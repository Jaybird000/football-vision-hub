// Email send via SMTP2GO's HTTP API (NOT SMTP). HTTP is required because the
// production target is Cloudflare Workers, which doesn't allow raw TCP / SMTP.
// Same provider as before — just the HTTP API key instead of SMTP credentials.
//
// Get your API key at: https://app.smtp2go.com/settings/apikeys

const SMTP2GO_API_KEY = process.env.SMTP2GO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const ADVISOR_EMAIL = process.env.ADVISOR_EMAIL;
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";

const SMTP2GO_ENDPOINT = "https://api.smtp2go.com/v3/email/send";

type SendArgs = { to: string; subject: string; html: string; text: string };

async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  if (!SMTP2GO_API_KEY || !EMAIL_FROM) {
    // Dev mode: API key or sender not configured. Log so the developer can
    // see what would have been sent without blocking the underlying action.
    console.log(`[email:noop] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  try {
    const res = await fetch(SMTP2GO_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: SMTP2GO_API_KEY,
        to: [to],
        sender: EMAIL_FROM,
        subject,
        text_body: text,
        html_body: html,
      }),
    });
    const body = await res.json() as {
      data?: { succeeded?: number; failed?: number; failures?: unknown[]; error?: string; error_code?: string };
    };
    if (!res.ok || body.data?.error || (body.data?.failed ?? 0) > 0) {
      console.error(`[email] SMTP2GO HTTP send failed for to=${to}:`, body);
    }
  } catch (err) {
    console.error(`[email] SMTP2GO request failed for to=${to}:`, err);
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
    <p style="margin:0 0 16px;"><a href="${APP_BASE_URL}/login" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Open your dashboard</a></p>
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
    <p style="margin:0;"><a href="${profileUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Open profile</a></p>
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
    <p style="margin:0;"><a href="${profileUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Review &amp; score</a></p>
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
    <p style="margin:0 0 16px;"><a href="${dashboardUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Read the recommendation</a></p>
    <p style="margin:0 0 12px;">Take your time with it. If anything in the recommendation surprises you, that's exactly the kind of thing to raise with ${advisorLabel.toLowerCase().startsWith("your") ? advisorLabel.toLowerCase() : args.advisorName} in your next conversation.</p>
    <p style="margin:0;">— The IKF Pathway 360 team</p>
  `);
  await sendEmail({ to: args.to, subject, html, text });
}

// ---------- Cron: advisor "review due" (6-month cycle approaching) ----------

export async function sendAdvisorReviewDue(args: {
  profileId: string;
  parentName: string;
  childName: string;
  validUntil: Date;
  daysRemaining: number;
}): Promise<void> {
  if (!ADVISOR_EMAIL) {
    console.warn("[email] ADVISOR_EMAIL not set; skipping advisor review-due notification.");
    return;
  }
  const profileUrl = `${APP_BASE_URL}/ikf360/admin/profiles/${args.profileId}`;
  const dueOn = args.validUntil.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const subject = `Review due in ${args.daysRemaining} days — ${args.childName}`;
  const text = [
    `${args.childName}'s 6-month categorisation review is approaching.`,
    ``,
    `Child:     ${args.childName}`,
    `Parent:    ${args.parentName}`,
    `Due by:    ${dueOn} (${args.daysRemaining} days remaining)`,
    ``,
    `Open profile: ${profileUrl}`,
    ``,
    `Re-engage the parent, refresh the assessment data if anything has changed, and re-score the profile.`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;font-weight:600;">Review due — ${args.childName}</p>
    <p style="margin:0 0 16px;">The 6-month categorisation review for <strong>${args.childName}</strong> is due in <strong>${args.daysRemaining} days</strong> (by ${dueOn}). ${args.parentName} should be re-engaged to refresh assessment data and re-score the profile.</p>
    <p style="margin:0;"><a href="${profileUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Open profile</a></p>
  `);
  await sendEmail({ to: ADVISOR_EMAIL, subject, html, text });
}

// ---------- Cron: parent Stage 2 re-engagement nudge ----------

export async function sendParentStage2Nudge(args: {
  to: string;
  parentName: string;
  childName: string;
  daysSinceIntent: number;
}): Promise<void> {
  const fn = firstName(args.parentName);
  const uploadUrl = `${APP_BASE_URL}/ikf360/upload`;
  const subject = `${args.childName}'s pathway is waiting on a few uploads`;
  const text = [
    `Hi ${fn},`,
    ``,
    `It's been ${args.daysSinceIntent} days since you completed the Parent SOP for ${args.childName}. The next step is uploading the assessment reports so an IKF advisor can build a recommendation.`,
    ``,
    `If you've run into anything that's making it hard to gather them, your advisor would rather hear about it than have you stuck. Reply to this email and we'll work through it together.`,
    ``,
    `Open the upload portal: ${uploadUrl}`,
    ``,
    `— The IKF Pathway 360 team`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;">Hi ${fn},</p>
    <p style="margin:0 0 16px;">It's been ${args.daysSinceIntent} days since you completed the Parent SOP for <strong>${args.childName}</strong>. The next step is uploading the assessment reports so an IKF advisor can build a recommendation.</p>
    <p style="margin:0 0 16px;">If you've run into anything that's making it hard to gather them, your advisor would rather hear about it than have you stuck. Reply to this email and we'll work through it together.</p>
    <p style="margin:0 0 16px;"><a href="${uploadUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Open upload portal</a></p>
    <p style="margin:0;">— The IKF Pathway 360 team</p>
  `);
  await sendEmail({ to: args.to, subject, html, text });
}

// ---------- Stage 2: advisor "mentor help requested" (Module E) ----------

export async function sendAdvisorAssistanceRequested(args: {
  profileId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  childName: string;
  missingTitles: string[];
  message: string;
}): Promise<void> {
  if (!ADVISOR_EMAIL) {
    console.warn("[email] ADVISOR_EMAIL not set; skipping advisor assistance-requested notification.");
    return;
  }
  const profileUrl = `${APP_BASE_URL}/ikf360/admin/profiles/${args.profileId}`;
  const subject = `Mentor help requested (48h) — ${args.childName}`;
  const missingList = args.missingTitles.length > 0 ? args.missingTitles : ["(none specified)"];
  const phoneLine = args.parentPhone ? `\nPhone:    ${args.parentPhone}` : "";
  const text = [
    `${args.parentName} has asked for help gathering documents for ${args.childName}. Please respond within 48 hours.`,
    ``,
    `Parent:   ${args.parentName}`,
    `Email:    ${args.parentEmail}${phoneLine}`,
    ``,
    `Documents they're missing:`,
    ...missingList.map(t => `  • ${t}`),
    ``,
    args.message ? `Their message:\n"${args.message}"` : `(No message left.)`,
    ``,
    `Open profile: ${profileUrl}`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;font-weight:600;">Mentor help requested — respond within 48 hours</p>
    <p style="margin:0 0 16px;"><strong>${args.parentName}</strong> has asked for help gathering documents for <strong>${args.childName}</strong>.</p>
    <table cellpadding="6" cellspacing="0" border="0" style="font-size:14px;margin:0 0 16px;">
      <tr><td style="color:#6b7280;">Parent</td><td>${args.parentName}</td></tr>
      <tr><td style="color:#6b7280;">Email</td><td><a href="mailto:${args.parentEmail}" style="color:#0B1220;">${args.parentEmail}</a></td></tr>
      ${args.parentPhone ? `<tr><td style="color:#6b7280;">Phone</td><td>${args.parentPhone}</td></tr>` : ""}
    </table>
    <p style="margin:0 0 6px;font-weight:600;">Documents they're missing</p>
    <ul style="margin:0 0 16px;padding-left:20px;">
      ${missingList.map(t => `<li style="margin-bottom:4px;">${t}</li>`).join("")}
    </ul>
    ${args.message ? `<p style="margin:0 0 6px;font-weight:600;">Their message</p><p style="margin:0 0 16px;padding:12px;background:#f5f6f7;border-radius:6px;">${args.message}</p>` : `<p style="margin:0 0 16px;color:#6b7280;">No message left.</p>`}
    <p style="margin:0;"><a href="${profileUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Open profile</a></p>
  `);
  await sendEmail({ to: ADVISOR_EMAIL, subject, html, text });
}

// ---------- Dashboard Module 5: parent flags their SOP for review ----------

export async function sendAdvisorSopReviewFlag(args: {
  profileId: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  note: string;
}): Promise<void> {
  if (!ADVISOR_EMAIL) {
    console.warn("[email] ADVISOR_EMAIL not set; skipping SOP review-flag notification.");
    return;
  }
  const profileUrl = `${APP_BASE_URL}/ikf360/admin/profiles/${args.profileId}`;
  const subject = `SOP review requested — ${args.childName}`;
  const text = [
    `${args.parentName} says something significant has changed in their family's situation and has asked for ${args.childName}'s profile to be reviewed.`,
    ``,
    `Parent:   ${args.parentName}`,
    `Email:    ${args.parentEmail}`,
    ``,
    args.note ? `What changed:\n"${args.note}"` : `(No detail left.)`,
    ``,
    `Open profile: ${profileUrl}`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;font-weight:600;">SOP review requested</p>
    <p style="margin:0 0 16px;"><strong>${args.parentName}</strong> says something significant has changed and has asked for <strong>${args.childName}</strong>'s profile to be reviewed.</p>
    <table cellpadding="6" cellspacing="0" border="0" style="font-size:14px;margin:0 0 16px;">
      <tr><td style="color:#6b7280;">Parent</td><td>${args.parentName}</td></tr>
      <tr><td style="color:#6b7280;">Email</td><td><a href="mailto:${args.parentEmail}" style="color:#0B1220;">${args.parentEmail}</a></td></tr>
    </table>
    ${args.note ? `<p style="margin:0 0 6px;font-weight:600;">What changed</p><p style="margin:0 0 16px;padding:12px;background:#f5f6f7;border-radius:6px;">${args.note}</p>` : `<p style="margin:0 0 16px;color:#6b7280;">No detail left.</p>`}
    <p style="margin:0;"><a href="${profileUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Open profile</a></p>
  `);
  await sendEmail({ to: ADVISOR_EMAIL, subject, html, text });
}

// ---------- Notification Type 1: parent review reminder (4 weeks out) ----------

export async function sendParentReviewReminder(args: {
  to: string;
  parentName: string;
  childName: string;
  weeksRemaining: number;
  profileId?: string;
}): Promise<void> {
  const fn = firstName(args.parentName);
  const preReviewUrl = `${APP_BASE_URL}/ikf360/pre-review${args.profileId ? `?child=${args.profileId}` : ""}`;
  const weeks = args.weeksRemaining;
  const subject = `${args.childName}'s next review is coming up`;
  const text = [
    `Hi ${fn},`,
    ``,
    `${args.childName}'s next review is coming up in about ${weeks} ${weeks === 1 ? "week" : "weeks"}. Before we update ${args.childName}'s profile, we'd like to check in on a few things.`,
    ``,
    `It's five short questions and takes about five minutes — just anything that's changed since you last told us about your situation.`,
    ``,
    `Start the check-in: ${preReviewUrl}`,
    ``,
    `— The IKF Pathway 360 team`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;">Hi ${fn},</p>
    <p style="margin:0 0 16px;"><strong>${args.childName}</strong>'s next review is coming up in about <strong>${weeks} ${weeks === 1 ? "week" : "weeks"}</strong>. Before we update the profile, we'd like to check in on a few things.</p>
    <p style="margin:0 0 16px;">It's five short questions, about five minutes — just anything that's changed since you last told us about your situation.</p>
    <p style="margin:0;"><a href="${preReviewUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Start the check-in</a></p>
  `);
  await sendEmail({ to: args.to, subject, html, text });
}

// ---------- Notification Type 3: monthly relevant content ----------

export async function sendParentContent(args: {
  to: string;
  parentName: string;
  childName: string;
  contentTitle: string;
  contentSummary: string;
  contentUrl: string;
}): Promise<void> {
  const fn = firstName(args.parentName);
  const subject = `One thing worth reading this month`;
  const text = [
    `Hi ${fn},`,
    ``,
    `One thing worth reading this month, chosen for where ${args.childName} is right now:`,
    ``,
    `${args.contentTitle}`,
    args.contentSummary ? `${args.contentSummary}` : ``,
    ``,
    `Read it: ${args.contentUrl}`,
    ``,
    `— The IKF Pathway 360 team`,
  ].filter(l => l !== undefined).join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;">Hi ${fn},</p>
    <p style="margin:0 0 16px;">One thing worth reading this month, chosen for where <strong>${args.childName}</strong> is right now:</p>
    <p style="margin:0 0 6px;font-weight:600;font-size:16px;">${args.contentTitle}</p>
    ${args.contentSummary ? `<p style="margin:0 0 16px;color:#5B6675;">${args.contentSummary}</p>` : ""}
    <p style="margin:0;"><a href="${args.contentUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Read it</a></p>
  `);
  await sendEmail({ to: args.to, subject, html, text });
}

// ---------- Type 1: advisor sees the parent's pre-review check-in ----------

export async function sendAdvisorPreReview(args: {
  profileId: string;
  parentName: string;
  childName: string;
  lines: { q: string; a: string }[];
}): Promise<void> {
  if (!ADVISOR_EMAIL) {
    console.warn("[email] ADVISOR_EMAIL not set; skipping advisor pre-review notification.");
    return;
  }
  const profileUrl = `${APP_BASE_URL}/ikf360/admin/profiles/${args.profileId}`;
  const subject = `Pre-review check-in — ${args.childName}`;
  const text = [
    `${args.parentName} completed the pre-review check-in for ${args.childName} ahead of the next review.`,
    ``,
    ...args.lines.flatMap(l => [`${l.q}`, `  ${l.a || "—"}`, ``]),
    `Open profile: ${profileUrl}`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;font-weight:600;">Pre-review check-in — ${args.childName}</p>
    <p style="margin:0 0 16px;"><strong>${args.parentName}</strong> completed the pre-review check-in ahead of the next review.</p>
    ${args.lines.map(l => `<p style="margin:0 0 4px;color:#6b7280;font-size:13px;">${l.q}</p><p style="margin:0 0 14px;">${l.a || "—"}</p>`).join("")}
    <p style="margin:0;"><a href="${profileUrl}" style="display:inline-block;padding:10px 16px;background:#F5C518;color:#0B1220;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Open profile</a></p>
  `);
  await sendEmail({ to: ADVISOR_EMAIL, subject, html, text });
}

// ---------- Stage 2: parent assistance acknowledgement (Module E) ----------

export async function sendParentAssistanceAck(args: {
  to: string;
  parentName: string;
  childName: string;
}): Promise<void> {
  const fn = firstName(args.parentName);
  const subject = `We've got your request — your IKF mentor will be in touch`;
  const text = [
    `Hi ${fn},`,
    ``,
    `Thank you for reaching out. We understand you don't have all of ${args.childName}'s documents ready yet — that's completely fine, and you don't need to worry.`,
    ``,
    `Your IKF mentor has been notified and will get back to you within 48 hours to guide you on the next steps. There's nothing more you need to do right now.`,
    ``,
    `— The IKF Pathway 360 team`,
  ].join("\n");
  const html = shell(`
    <p style="margin:0 0 12px;">Hi ${fn},</p>
    <p style="margin:0 0 16px;">Thank you for reaching out. We understand you don't have all of <strong>${args.childName}</strong>'s documents ready yet — that's completely fine, and you don't need to worry.</p>
    <p style="margin:0 0 16px;">Your IKF mentor has been notified and will get back to you <strong>within 48 hours</strong> to guide you on the next steps. There's nothing more you need to do right now.</p>
    <p style="margin:0;">— The IKF Pathway 360 team</p>
  `);
  await sendEmail({ to: args.to, subject, html, text });
}
