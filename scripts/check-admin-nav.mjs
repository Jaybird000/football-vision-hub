import { toJSONAsync } from "seroval";
const ADMIN_LOGIN = "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYXV0aC50cz90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJhZG1pbkxvZ2luX2NyZWF0ZVNlcnZlckZuX2hhbmRsZXIifQ";
const body = JSON.stringify(await toJSONAsync({ data: { email: "admin@ikf.test", password: "adminpass123" } }));
const r = await fetch(`http://localhost:5173/_serverFn/${ADMIN_LOGIN}`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-tsr-serverFn": "true", accept: "application/json" },
  body,
});
const set = r.headers.get("set-cookie") || "";
const m = set.match(/ikf_session=([^;]+)/);
const cookie = m ? `ikf_session=${m[1]}` : "";
const page = await (await fetch("http://localhost:5173/ikf360/admin/providers", { headers: { cookie } })).text();
console.log("page bytes:", page.length);
const checks = [
  ['Has top sticky nav',         'sticky top-0'],
  ['IKF logo image',             'ikf-logo'],
  ['Admin pill (Shield)',        'Shield'],
  ['Profiles tab',               '>Profiles<'],
  ['Templates tab',              '>Templates<'],
  ['Providers tab',              '>Providers<'],
  ['No 1 · Intent Form tab',     '!1 · Intent Form'],
  ['No 2 · Upload Portal tab',   '!2 · Upload Portal'],
  ['Parent-view switcher',       '>Parent view<'],
];
for (const [label, needle] of checks) {
  const neg = needle.startsWith('!');
  const n = neg ? needle.slice(1) : needle;
  const has = page.includes(n);
  const ok = neg ? !has : has;
  console.log(`${ok ? '✓' : '✗'} ${label}`);
}
