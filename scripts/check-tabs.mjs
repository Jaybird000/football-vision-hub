import { toJSONAsync } from "seroval";

const LOGIN       = "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYXV0aC50cz90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJsb2dpbl9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0";
const ADMIN_LOGIN = "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYXV0aC50cz90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJhZG1pbkxvZ2luX2NyZWF0ZVNlcnZlckZuX2hhbmRsZXIifQ";

async function loginAs(fnId, email, password) {
  const body = JSON.stringify(await toJSONAsync({ data: { email, password } }));
  const r = await fetch(`http://localhost:5173/_serverFn/${fnId}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-tsr-serverFn": "true", accept: "application/json" },
    body,
  });
  const set = r.headers.get("set-cookie") || "";
  const m = set.match(/ikf_session=([^;]+)/);
  return m ? `ikf_session=${m[1]}` : "";
}

async function fetchTabs(cookie) {
  const r = await fetch("http://localhost:5173/ikf360/intent", { headers: { cookie } });
  const html = await r.text();
  return {
    overview:  /\bOverview\b/.test(html),
    intent:    /Intent Form/.test(html),
    upload:    /Upload Portal/.test(html),
    dashboard: /Parent Dashboard/.test(html),
    admin:     /Admin · Profiles/.test(html),
  };
}

const parentCookie = await loginAs(LOGIN, "e2e-1779836881007@test.local", "supersecret123");
const adminCookie  = await loginAs(ADMIN_LOGIN, "admin@ikf.test", "adminpass123");

console.log("PARENT view of /ikf360/intent tabs:", await fetchTabs(parentCookie));
console.log("ADMIN  view of /ikf360/intent tabs:", await fetchTabs(adminCookie));
