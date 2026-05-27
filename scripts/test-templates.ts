// Sends each email template with realistic sample data so you can visually
// verify the rendered output. Imports the ACTUAL functions from src/server/email.ts
// — no duplication — so a passing test here means the live trigger sites
// (intent.ts, stage2.ts, stage3.ts, cron routes) will produce the same output.
//
// Run: npx tsx --env-file=.env.local scripts/test-templates.ts

import {
  sendParentIntentAck,
  sendAdvisorNewIntent,
  sendAdvisorReadyToScore,
  sendParentRecommendationReady,
  sendAdvisorReviewDue,
  sendParentStage2Nudge,
} from "../src/server/email.js";

const recipient = process.env.ADVISOR_EMAIL || process.env.SMTP_USER;
if (!recipient) {
  console.error("Need ADVISOR_EMAIL or SMTP_USER in .env.local to know where to send tests.");
  process.exit(1);
}

console.log(`Sending 6 template tests → ${recipient}\n`);

const parent = {
  to: recipient,
  parentName: "Sunita Mahato",
  childName: "Aarav Mahato",
};

const sampleProfileId = "00000000-0000-0000-0000-000000000001";

async function step(name: string, fn: () => Promise<void>) {
  process.stdout.write(`• ${name}… `);
  try {
    await fn();
    console.log("sent");
  } catch (err) {
    console.log("FAILED");
    console.error(err);
  }
}

await step("Parent: intent acknowledgement (Stage 1)", () =>
  sendParentIntentAck(parent),
);

await step("Parent: recommendation ready (Stage 3)", () =>
  sendParentRecommendationReady({
    ...parent,
    cellTitle: "The committed family with a high-potential child",
    advisorName: "R. Verma",
  }),
);

await step("Parent: Stage 2 re-engagement nudge (cron)", () =>
  sendParentStage2Nudge({
    ...parent,
    daysSinceIntent: 9,
  }),
);

await step("Advisor: new intent (Stage 1)", () =>
  sendAdvisorNewIntent({
    profileId: sampleProfileId,
    parentName: parent.parentName,
    parentEmail: "sunita.mahato@example.com",
    parentPhone: "+91 98765 43210",
    childName: parent.childName,
    childAge: 12,
    readiness: "high",
  }),
);

await step("Advisor: ready to score (Stage 2)", () =>
  sendAdvisorReadyToScore({
    profileId: sampleProfileId,
    parentName: parent.parentName,
    childName: parent.childName,
  }),
);

await step("Advisor: review due (cron)", () =>
  sendAdvisorReviewDue({
    profileId: sampleProfileId,
    parentName: parent.parentName,
    childName: parent.childName,
    validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    daysRemaining: 10,
  }),
);

console.log("\nDone. Check the inbox.");
