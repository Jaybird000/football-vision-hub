import { toJSONAsync } from "seroval";

const SIGNUP = "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYXV0aC50cz90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJzaWdudXBfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9";
const LOGIN  = "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYXV0aC50cz90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJsb2dpbl9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0";
const LOGOUT = "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYXV0aC50cz90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJsb2dvdXRfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9";
const ME     = "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvYXV0aC50cz90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJjdXJyZW50VXNlcl9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0";

const BASE = "http://localhost:5173/_serverFn/";
let cookieJar = "";

function captureCookies(setCookieHeaders) {
  if (!setCookieHeaders) return;
  const parts = setCookieHeaders.split(/,(?=[^;]+=)/);
  for (const p of parts) {
    const kv = p.split(";")[0].trim();
    if (!kv) continue;
    cookieJar = kv;
  }
}

async function callPost(id, data) {
  const body = JSON.stringify(await toJSONAsync({ data }));
  const headers = {
    "content-type": "application/json",
    "x-tsr-serverFn": "true",
    accept: "application/json",
  };
  if (cookieJar) headers.cookie = cookieJar;
  const res = await fetch(BASE + id, { method: "POST", headers, body });
  captureCookies(res.headers.get("set-cookie"));
  return { status: res.status, body: await res.text() };
}

async function callGet(id) {
  const headers = { "x-tsr-serverFn": "true", accept: "application/json" };
  if (cookieJar) headers.cookie = cookieJar;
  const res = await fetch(BASE + id, { method: "GET", headers });
  return { status: res.status, body: await res.text() };
}

const email = `e2e-${Date.now()}@test.local`;
const password = "supersecret123";

console.log("--- SIGNUP ---");
console.log(await callPost(SIGNUP, { fullName: "E2E User", email, password }));
console.log("cookieJar:", cookieJar);

console.log("\n--- currentUser (with signup cookie) ---");
console.log(await callGet(ME));

console.log("\n--- LOGOUT ---");
console.log(await callPost(LOGOUT, undefined));

console.log("\n--- currentUser (after logout) ---");
console.log(await callGet(ME));

cookieJar = "";
console.log("\n--- LOGIN ---");
console.log(await callPost(LOGIN, { email, password }));
console.log("cookieJar:", cookieJar);

console.log("\n--- currentUser (after login) ---");
console.log(await callGet(ME));

console.log("\n--- LOGIN with wrong password ---");
cookieJar = "";
console.log(await callPost(LOGIN, { email, password: "wrong" }));

console.log("\n--- SIGNUP duplicate email ---");
cookieJar = "";
console.log(await callPost(SIGNUP, { fullName: "Dup", email, password }));
