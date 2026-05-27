// Smoke test for the SMTP2GO HTTP API. Reads the same env vars that
// src/server/email.ts reads, so a passing test here means the real email
// module will also work — including on Cloudflare Workers (which is why we're
// on the HTTP API not raw SMTP).
//
// Run: node --env-file=.env.local scripts/test-smtp.mjs

const { SMTP2GO_API_KEY, EMAIL_FROM, ADVISOR_EMAIL } = process.env;

if (!SMTP2GO_API_KEY || !EMAIL_FROM) {
  console.error("Missing SMTP2GO_API_KEY or EMAIL_FROM. Did you run with --env-file=.env.local?");
  process.exit(1);
}

const to = ADVISOR_EMAIL || EMAIL_FROM;

console.log(`Sending test email via SMTP2GO HTTP API: ${EMAIL_FROM} → ${to}`);

const res = await fetch("https://api.smtp2go.com/v3/email/send", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    api_key: SMTP2GO_API_KEY,
    to: [to],
    sender: EMAIL_FROM,
    subject: "IKF Pathway 360 — SMTP2GO HTTP API smoke test",
    text_body: [
      "If you can read this, the SMTP2GO HTTP API works end-to-end.",
      "",
      `From:    ${EMAIL_FROM}`,
      `To:      ${to}`,
      `Sent at: ${new Date().toISOString()}`,
    ].join("\n"),
    html_body: `<p>If you can read this, the SMTP2GO HTTP API works end-to-end.</p>
<ul>
  <li><strong>From:</strong> ${EMAIL_FROM}</li>
  <li><strong>To:</strong> ${to}</li>
  <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
</ul>`,
  }),
});

const body = await res.json();
console.log(`HTTP ${res.status}`);
console.log(JSON.stringify(body, null, 2));

if (!res.ok || body?.data?.error || (body?.data?.failed ?? 0) > 0) {
  console.error("\n✗ Send did not succeed.");
  process.exit(1);
}
console.log(`\n✓ Email accepted. email_id=${body?.data?.email_id}`);
