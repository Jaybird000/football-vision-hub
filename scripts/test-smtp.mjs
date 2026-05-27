// Smoke test for SMTP delivery. Reads the same env vars that src/server/email.ts
// reads, so a passing test here means the real email module will also work.
//
// Run: node --env-file=.env.local scripts/test-smtp.mjs

import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
  ADVISOR_EMAIL,
} = process.env;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
  console.error("Missing one of: SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM");
  console.error("Did you run with --env-file=.env.local?");
  process.exit(1);
}

const to = ADVISOR_EMAIL || SMTP_USER;
const port = SMTP_PORT ? Number(SMTP_PORT) : 587;
const secure = SMTP_SECURE === "true";

console.log(`Connecting to ${SMTP_HOST}:${port} (secure=${secure}) as ${SMTP_USER}…`);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

try {
  console.log("Verifying SMTP connection…");
  await transporter.verify();
  console.log("✓ SMTP server accepted credentials and is ready to send");

  console.log(`Sending test email from ${EMAIL_FROM} → ${to}…`);
  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: "IKF Pathway 360 — SMTP smoke test",
    text: [
      "If you can read this, the SMTP path from src/server/email.ts works end-to-end.",
      "",
      `Host:     ${SMTP_HOST}:${port} (secure=${secure})`,
      `From:     ${EMAIL_FROM}`,
      `To:       ${to}`,
      `Sent at:  ${new Date().toISOString()}`,
    ].join("\n"),
    html: `<p>If you can read this, the SMTP path from <code>src/server/email.ts</code> works end-to-end.</p>
<ul>
  <li><strong>Host:</strong> ${SMTP_HOST}:${port} (secure=${secure})</li>
  <li><strong>From:</strong> ${EMAIL_FROM}</li>
  <li><strong>To:</strong> ${to}</li>
  <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
</ul>`,
  });

  console.log(`✓ Sent. messageId=${info.messageId}`);
  if (info.accepted?.length) console.log(`  accepted: ${info.accepted.join(", ")}`);
  if (info.rejected?.length) console.log(`  rejected: ${info.rejected.join(", ")}`);
  if (info.response) console.log(`  server: ${info.response}`);
} catch (err) {
  console.error("✗ Failed:");
  console.error(err);
  process.exit(1);
}
