import { toJSONAsync } from "seroval";

const FN_ID = "eyJmaWxlIjoiL3NyYy9zZXJ2ZXIvaW50ZW50LnRzP3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6InN1Ym1pdEludGVudF9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0";

const payload = {
  data: {
    parentName: "E2E Test Parent",
    parentEmail: "e2e@test.local",
    parentPhone: "+91-9999999999",
    childName: "E2E Child",
    childAge: 13,
    childGender: "Girl",
    answers: { q1: 3, q2: 4, q3: 2, q4: 3, q5: 4, q6: 4, q7: 4, q8: 4 },
  },
};

const body = JSON.stringify(await toJSONAsync(payload));

const res = await fetch(`http://localhost:5173/_serverFn/${FN_ID}`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-tsr-serverFn": "true",
    "accept": "application/json",
  },
  body,
});

console.log("STATUS:", res.status);
console.log("HEADERS:", Object.fromEntries(res.headers.entries()));
const text = await res.text();
console.log("BODY:", text);
