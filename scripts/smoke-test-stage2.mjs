import { toJSONAsync } from "seroval";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:5173/_serverFn/";
const FN = {
  login:               "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYXV0aC50cz90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJsb2dpbl9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0",
  adminLogin:          "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYXV0aC50cz90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJhZG1pbkxvZ2luX2NyZWF0ZVNlcnZlckZuX2hhbmRsZXIifQ",
  submitIntent:        "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvaW50ZW50LnRzP3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6InN1Ym1pdEludGVudF9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0",
  getMyStage2:         "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvc3RhZ2UyLnRzP3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6ImdldE15U3RhZ2UyX2NyZWF0ZVNlcnZlckZuX2hhbmRsZXIifQ",
  uploadAssessment:    "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvc3RhZ2UyLnRzP3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6InVwbG9hZEFzc2Vzc21lbnRfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9",
  upsertProvider:      "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYWRtaW4udHM/dHNzLXNlcnZlcmZuLXNwbGl0IiwiZXhwb3J0IjoidXBzZXJ0UHJvdmlkZXJfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9",
  setTemplateRequired: "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYWRtaW4udHM/dHNzLXNlcnZlcmZuLXNwbGl0IiwiZXhwb3J0Ijoic2V0VGVtcGxhdGVSZXF1aXJlZF9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0",
};

const SEROVAL_TYPES = { NULL: 2, STRING: 1, OBJECT: 10, OBJECT_REF: 11, ARRAY: 9, ERROR: 25 };

function findKey(obj, key) {
  if (!obj || typeof obj !== "object") return null;
  if ("k" in obj && Array.isArray(obj.k) && Array.isArray(obj.v)) {
    const i = obj.k.indexOf(key);
    if (i >= 0) return obj.v[i];
  }
  return null;
}

async function callPost(fnId, data, cookie) {
  const body = JSON.stringify(await toJSONAsync({ data }));
  const r = await fetch(BASE + fnId, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tsr-serverFn": "true",
      accept: "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body,
  });
  const setCookie = r.headers.get("set-cookie") || "";
  const m = setCookie.match(/ikf_session=([^;]+)/);
  const newCookie = m ? `ikf_session=${m[1]}` : null;
  return { status: r.status, body: await r.json(), newCookie };
}

async function callGet(fnId, cookie) {
  const r = await fetch(BASE + fnId, {
    method: "GET",
    headers: {
      "x-tsr-serverFn": "true",
      accept: "application/json",
      ...(cookie ? { cookie } : {}),
    },
  });
  return { status: r.status, body: await r.json() };
}

async function callUpload(cookie, assessmentKey, filePath, fileName, mimeType) {
  const fd = new FormData();
  fd.set("assessmentKey", assessmentKey);
  const buf = await (await import("node:fs/promises")).readFile(filePath);
  fd.set("file", new Blob([buf], { type: mimeType }), fileName);
  const r = await fetch(BASE + FN.uploadAssessment, {
    method: "POST",
    headers: {
      "x-tsr-serverFn": "true",
      accept: "application/json",
      cookie,
    },
    body: fd,
  });
  return { status: r.status, body: await r.text() };
}

function unwrapResult(envelope) {
  const payload = envelope?.p;
  return findKey(payload, "result");
}
function unwrapError(envelope) {
  const err = findKey(envelope?.p, "error");
  if (err && err.s && err.s.message) return err.s.message.s;
  return null;
}

async function main() {
  console.log("\n=== ADMIN: log in, add a provider, mark personality required ===");
  const adminLoginRes = await callPost(FN.adminLogin, { email: "admin@ikf.test", password: "adminpass123" });
  const adminCookie = adminLoginRes.newCookie;
  console.log("admin cookie:", !!adminCookie);

  const newProvider = await callPost(FN.upsertProvider, {
    assessmentKey: "scouting",
    name: "Test Scout Lab",
    description: "Two-session evaluation, report in 5 days.",
    url: "https://example.com/scout-book",
    city: "Kolkata",
    isActive: true,
    sortOrder: 0,
  }, adminCookie);
  console.log("upsertProvider →", newProvider.status, JSON.stringify(unwrapResult(newProvider.body)));

  const toggle = await callPost(FN.setTemplateRequired, { key: "personality", required: true }, adminCookie);
  console.log("setTemplateRequired personality=true →", unwrapResult(toggle.body));

  console.log("\n=== PARENT: signup-style login (using earlier test user) ===");
  const parentLoginRes = await callPost(FN.login, { email: "e2e-1779836881007@test.local", password: "supersecret123" });
  const parentCookie = parentLoginRes.newCookie;

  console.log("\n=== PARENT: submit Stage 1 intent ===");
  const intent = await callPost(FN.submitIntent, {
    parentName: "Stage2 Smoke Parent",
    parentEmail: "stage2@smoke.local",
    parentPhone: "+91-9000000000",
    childName: "Stage2 Smoke Child",
    childAge: 12,
    childGender: "Boy",
    answers: { q1: 3, q2: 3, q3: 2, q4: 3, q5: 4, q6: 4, q7: 4, q8: 4 },
  }, parentCookie);
  console.log("submitIntent →", unwrapResult(intent.body));

  console.log("\n=== PARENT: fetch Stage 2 state (should be unlocked) ===");
  const state = await callGet(FN.getMyStage2, parentCookie);
  const result = unwrapResult(state.body);
  console.log("profileId set?", !!findKey(result, "profileId"));
  console.log("childName:", findKey(result, "childName")?.s);
  const tpls = findKey(result, "templates");
  console.log("templates returned:", tpls?.a?.length || tpls?.l || "(unknown)");
  console.log("requiredKeys:", JSON.stringify(findKey(result, "requiredKeys")));

  console.log("\n=== PARENT: upload a PDF ===");
  const tmp = await mkdtemp(join(tmpdir(), "stage2-smoke-"));
  const pdfPath = join(tmp, "fake.pdf");
  // minimal valid PDF
  await writeFile(pdfPath, Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n"));
  const up = await callUpload(parentCookie, "scouting", pdfPath, "smoke-scout.pdf", "application/pdf");
  console.log("upload status:", up.status);
  console.log("upload body snippet:", up.body.substring(0, 200));

  console.log("\n=== PARENT: fetch Stage 2 again, expect 1 upload ===");
  const state2 = await callGet(FN.getMyStage2, parentCookie);
  const r2 = unwrapResult(state2.body);
  const uploads = findKey(r2, "uploads");
  console.log("uploads array length-ish:", JSON.stringify(uploads)?.substring(0, 250));
}
main().catch(e => { console.error(e); process.exit(1); });
