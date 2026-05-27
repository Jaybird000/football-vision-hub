import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const ADVISOR_EMAIL = process.env.ADVISOR_EMAIL;
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";

const resend: Resend | null = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type SendArgs = { to: string; subject: string; html: string; text: string };

async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  if (!resend || !EMAIL_FROM) {
    // Dev mode: no API key or sender configured. Log so the developer can see
    // what would have been sent without blocking the underlying user action.
    console.log(`[email:noop] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html, text });
    if (error) console.error(`[email] Resend error for to=${to}:`, error);
  } catch (err) {
    console.error(`[email] Send failed for to=${to}:`, err);
  }
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || "there";
}

function shell(bodyHtml: string): string {
  // Minimal inline-styled HTML shell. Email clients strip <style>, so everything is inline.
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B1220;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f6f7;padding:32px 16px;"><tr><td align="center">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
      <tr><td style="padding:28px 32px;background:#0B1220;color:#ffffff;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">IKF Pathway 360</td></tr>
      <tr><td style="padding:32px;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #eaeaea;font-size:11px;color:#6b7280;line-height:1.5;">India Khelo Football · <a href="https://indiakhelofootball.com" style="color:#6b7280;">indiakhelofootball.com</a></td></tr>
    </table>
  </td></tr></table></body></html>`;
}

// ---------- Stage 1: parent acknowledgement ----------

export async function sendParentIntentAck(args: {
  to: string;
  parentName: string;
  childName: string;
}): Promise<void> {
  const fn = firstName(args.parentName);
  const subject = `Welcome to IKF Pathway 360, ${fn}`;
  const text = [
    `Hi ${fn},`,
    ``,
    `Thank you for telling us about ${args.childName}. We've received the first step of your application to IKF Pathway 360.`,
    ``,
    `Here is what happens next:`,
    `  • An IKF advisor will review what you've shared, usually within two working days.`,
    `  • You'll then be guided through the next step — gathering a small set of assessments so we can build a real picture of ${args.childName}'s pathway.`,
    `  • Your dashboard will fill in as that picture comes together.`,
    ``,
    `You can sign in any time at ${APP_BASE_URL}/login to see your progress.`,
    ``,
    `We are with you in this.`,
    `— The IKF Pathway 360 team`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;">Hi ${fn},</p>
    <p style="margin:0 0 16px;">Thank you for telling us about <strong>${args.childName}</strong>. We've received the first step of your application to IKF Pathway 360.</p>
    <p style="margin:0 0 8px;font-weight:600;">What happens next</p>
    <ul style="margin:0 0 16px;padding-left:20px;">
      <li style="margin-bottom:6px;">An IKF advisor will review what you've shared, usually within two working days.</li>
      <li style="margin-bottom:6px;">You'll then be guided through the next step — gathering a small set of assessments so we can build a real picture of ${args.childName}'s pathway.</li>
      <li>Your dashboard will fill in as that picture comes together.</li>
    </ul>
    <p style="margin:0 0 16px;"><a href="${APP_BASE_URL}/login" style="display:inline-block;padding:10px 16px;background:#dfff5e;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Open your dashboard</a></p>
    <p style="margin:0;">We are with you in this.<br/>— The IKF Pathway 360 team</p>
  `);
  await sendEmail({ to: args.to, subject, html, text });
}

// ---------- Stage 1: advisor new-intent notification ----------

export async function sendAdvisorNewIntent(args: {
  profileId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  childName: string;
  childAge: number;
  readiness: "high" | "medium" | "forming";
}): Promise<void> {
  if (!ADVISOR_EMAIL) {
    console.warn("[email] ADVISOR_EMAIL not set; skipping advisor new-intent notification.");
    return;
  }
  const profileUrl = `${APP_BASE_URL}/ikf360/admin/profiles/${args.profileId}`;
  const subject = `New Stage 1 intent — ${args.childName} (${args.readiness} readiness)`;
  const phoneLine = args.parentPhone ? `\nPhone:      ${args.parentPhone}` : "";
  const text = [
    `A new parent has completed the Stage 1 Parent SOP.`,
    ``,
    `Child:      ${args.childName}, age ${args.childAge}`,
    `Parent:     ${args.parentName}`,
    `Email:      ${args.parentEmail}${phoneLine}`,
    `Readiness:  ${args.readiness}`,
    ``,
    `Open profile: ${profileUrl}`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;font-weight:600;">New Stage 1 intent</p>
    <table cellpadding="6" cellspacing="0" border="0" style="font-size:14px;margin:0 0 16px;">
      <tr><td style="color:#6b7280;">Child</td><td><strong>${args.childName}</strong>, age ${args.childAge}</td></tr>
      <tr><td style="color:#6b7280;">Parent</td><td>${args.parentName}</td></tr>
      <tr><td style="color:#6b7280;">Email</td><td><a href="mailto:${args.parentEmail}" style="color:#0B1220;">${args.parentEmail}</a></td></tr>
      ${args.parentPhone ? `<tr><td style="color:#6b7280;">Phone</td><td>${args.parentPhone}</td></tr>` : ""}
      <tr><td style="color:#6b7280;">Readiness</td><td><strong>${args.readiness}</strong></td></tr>
    </table>
    <p style="margin:0;"><a href="${profileUrl}" style="display:inline-block;padding:10px 16px;background:#dfff5e;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Open profile</a></p>
  `);
  await sendEmail({ to: ADVISOR_EMAIL, subject, html, text });
}

// ---------- Stage 2: advisor "ready to score" ----------

export async function sendAdvisorReadyToScore(args: {
  profileId: string;
  parentName: string;
  childName: string;
}): Promise<void> {
  if (!ADVISOR_EMAIL) {
    console.warn("[email] ADVISOR_EMAIL not set; skipping advisor ready-to-score notification.");
    return;
  }
  const profileUrl = `${APP_BASE_URL}/ikf360/admin/profiles/${args.profileId}`;
  const subject = `Ready to categorise — ${args.childName}`;
  const text = [
    `${args.childName}'s required assessments are all uploaded. ${args.parentName} is ready for Stage 3 categorisation.`,
    ``,
    `Review and score: ${profileUrl}`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;font-weight:600;">Ready to categorise</p>
    <p style="margin:0 0 16px;"><strong>${args.childName}</strong>'s required assessments are all uploaded. ${args.parentName} is ready for Stage 3 categorisation.</p>
    <p style="margin:0;"><a href="${profileUrl}" style="display:inline-block;padding:10px 16px;background:#dfff5e;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Review &amp; score</a></p>
  `);
  await sendEmail({ to: ADVISOR_EMAIL, subject, html, text });
}

// ---------- Stage 3: parent "your recommendation is ready" ----------

export async function sendParentRecommendationReady(args: {
  to: string;
  parentName: string;
  childName: string;
  cellTitle: string;
  advisorName: string;
}): Promise<void> {
  const fn = firstName(args.parentName);
  const dashboardUrl = `${APP_BASE_URL}/ikf360/dashboard`;
  const titleLine = args.cellTitle ? ` — ${args.cellTitle}` : "";
  const subject = `${args.childName}'s pathway is ready${titleLine}`;
  const text = [
    `Hi ${fn},`,
    ``,
    `${args.advisorName || "Your IKF advisor"} has reviewed everything you've shared and prepared a pathway recommendation for ${args.childName}.`,
    ``,
    `Open your dashboard to read it: ${dashboardUrl}`,
    ``,
    `Take your time with it. If anything in the recommendation surprises you, that's exactly the kind of thing to raise with ${args.advisorName || "your advisor"} in your next conversation.`,
    ``,
    `— The IKF Pathway 360 team`,
  ].join("\n");
  const advisorLabel = args.advisorName || "Your IKF advisor";
  const html = shell(`
    <p style="margin:0 0 12px;">Hi ${fn},</p>
    <p style="margin:0 0 16px;"><strong>${advisorLabel}</strong> has reviewed everything you've shared and prepared a pathway recommendation for <strong>${args.childName}</strong>.</p>
    <p style="margin:0 0 16px;"><a href="${dashboardUrl}" style="display:inline-block;padding:10px 16px;background:#dfff5e;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Read the recommendation</a></p>
    <p style="margin:0 0 12px;">Take your time with it. If anything in the recommendation surprises you, that's exactly the kind of thing to raise with ${advisorLabel.toLowerCase().startsWith("your") ? advisorLabel.toLowerCase() : args.advisorName} in your next conversation.</p>
    <p style="margin:0;">— The IKF Pathway 360 team</p>
  `);
  await sendEmail({ to: args.to, subject, html, text });
}
