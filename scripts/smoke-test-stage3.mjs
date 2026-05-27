import { toJSONAsync } from "seroval";

const BASE = "http://localhost:5173/_serverFn/";

async function fnIds() {
  // Pull live IDs from the dev bundle (handles base64url vs base64 differences).
  const grab = async (path) => {
    const txt = await (await fetch(`http://localhost:5173/${path}`)).text();
    const matches = txt.match(/createClientRpc\("[^"]+"\)/g) || [];
    return matches.map(m => m.match(/createClientRpc\("([^"]+)"\)/)[1]);
  };
  return {
    auth:   await grab("src/server/auth.ts"),
    intent: await grab("src/server/intent.ts"),
    stage3: await grab("src/server/stage3.ts"),
  };
}

async function decode(id) {
  const fixed = id.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(fixed, "base64").toString("utf8");
  const parsed = JSON.parse(json + (json.endsWith("}") ? "" : "}"));
  return parsed.export;
}

async function findFn(group, exportName) {
  for (const id of group) {
    const e = await decode(id);
    if (e === `${exportName}_createServerFn_handler`) return id;
  }
  throw new Error(`fn ${exportName} not found`);
}

async function callPost(id, data, cookie) {
  const body = JSON.stringify(await toJSONAsync({ data }));
  const headers = { "content-type": "application/json", "x-tsr-serverFn": "true", accept: "application/json" };
  if (cookie) headers.cookie = cookie;
  const r = await fetch(BASE + id, { method: "POST", headers, body });
  const set = r.headers.get("set-cookie") || "";
  const m = set.match(/ikf_session=([^;]+)/);
  return { status: r.status, body: await r.text(), cookie: m ? `ikf_session=${m[1]}` : null };
}

async function callGet(id, cookie) {
  const headers = { "x-tsr-serverFn": "true", accept: "application/json" };
  if (cookie) headers.cookie = cookie;
  const r = await fetch(BASE + id, { method: "GET", headers });
  return { status: r.status, body: await r.text() };
}

// Warm the routes / server bundles
for (const p of ["/ikf360/admin", "/ikf360/admin/axes", "/ikf360/admin/cells", "/ikf360/dashboard", "/ikf360/upload"]) {
  await fetch("http://localhost:5173" + p);
}
for (const f of ["src/server/auth.ts", "src/server/intent.ts", "src/server/stage3.ts"]) {
  await fetch("http://localhost:5173/" + f);
}

const ids = await fnIds();
const ID = {
  login:       await findFn(ids.auth,   "login"),
  adminLogin:  await findFn(ids.auth,   "adminLogin"),
  submit:      await findFn(ids.intent, "submitIntent"),
  upsertCell:  await findFn(ids.stage3, "upsertCell"),
  scoreProfile:await findFn(ids.stage3, "scoreProfile"),
  myCat:       await findFn(ids.stage3, "getMyCategorisation"),
  listCells:   await findFn(ids.stage3, "listCells"),
};

// ---- ADMIN: publish a recommendation for the high/aligned cell ----
const adminRes = await callPost(ID.adminLogin, { email: "admin@ikf.test", password: "adminpass123" });
const adminCookie = adminRes.cookie;
console.log("admin cookie ok:", !!adminCookie);

const cellKey = "parent_capacity:aligned|player_potential:high"; // sorted axis_key:value_key
const cellRes = await callPost(ID.upsertCell, {
  cellKey,
  title: "Aligned family, high-potential player",
  recommendationMd: "# Football pathway\nRecommend a top-tier residential academy trial within 6 months.\n\n# Academic\nMaintain school plan; consider hybrid model.\n\n# Long-term\nProfessional pathway is realistic; backup plan in coaching/sports management.",
  isPublished: true,
}, adminCookie);
console.log("upsertCell status:", cellRes.status);

// ---- PARENT: signup + submit intent + check empty dashboard ----
const parentEmail = `s3-${Date.now()}@test.local`;
const parentSignup = await callPost(await findFn(ids.auth, "signup"), {
  fullName: "Stage3 Parent",
  email: parentEmail,
  password: "supersecret123",
});
const parentCookie = parentSignup.cookie;
console.log("parent cookie ok:", !!parentCookie);

const intent = await callPost(ID.submit, {
  parentName: "Stage3 Parent",
  parentEmail,
  parentPhone: "+91-9000000099",
  childName: "Stage3 Kid",
  childAge: 14,
  childGender: "Boy",
  answers: { q1: 3, q2: 3, q3: 2, q4: 3, q5: 4, q6: 4, q7: 4, q8: 4 },
}, parentCookie);
console.log("intent status:", intent.status);

// dashboard should report "no categorisation yet"
const dashEmpty = await callGet(ID.myCat, parentCookie);
console.log("dashboard before scoring:", dashEmpty.body.includes('"s":0') ? "empty ✓" : "(non-empty)");

async function grabAdmin() {
  const txt = await (await fetch("http://localhost:5173/src/server/admin.ts")).text();
  return (txt.match(/createClientRpc\("[^"]+"\)/g) || []).map(m => m.match(/createClientRpc\("([^"]+)"\)/)[1]);
}
const adminFns = await grabAdmin();
const listAdminProfiles = await findFn(adminFns, "listAdminProfiles");
const profilesRes = await callGet(listAdminProfiles, adminCookie);

// Find our profile id in the seroval payload by matching the email
const profileIdMatch = profilesRes.body.match(new RegExp(`"id"[^"]*"([a-f0-9-]{36})"[^{]*"${parentEmail}"`));
// fallback: just take the first id near our email
let profileId = null;
const allIds = [...profilesRes.body.matchAll(/"s":"([a-f0-9-]{36})"/g)].map(m => m[1]);
const emailIdx = profilesRes.body.indexOf(parentEmail);
if (emailIdx >= 0) {
  // pick the id whose position is closest before email
  let best = null;
  for (const m of profilesRes.body.matchAll(/"s":"([a-f0-9-]{36})"/g)) {
    if (m.index < emailIdx) best = m[1];
  }
  profileId = best;
}
console.log("found profileId:", profileId);

// Score this profile in the high/aligned cell
const score = await callPost(ID.scoreProfile, {
  profileId,
  selections: [
    { axisKey: "player_potential", valueKey: "high" },
    { axisKey: "parent_capacity",  valueKey: "aligned" },
  ],
  advisorNotes: "smoke test",
}, adminCookie);
console.log("scoreProfile status:", score.status, "snippet:", score.body.substring(0, 200));

// Parent dashboard now should have the snapshot
const dashAfter = await callGet(ID.myCat, parentCookie);
const ok = dashAfter.body.includes("Aligned family") && dashAfter.body.includes("residential academy");
console.log("dashboard after scoring → recommendation present:", ok ? "✓" : "✗");
console.log("dashboard body snippet:", dashAfter.body.substring(0, 400));
