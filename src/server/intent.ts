import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { sql } from "./db";
import { scoreReadiness, INTENT_QUESTIONS } from "@/lib/ikf360-data";
import { sendParentIntentAck, sendAdvisorNewIntent } from "./email";
import { logAudit } from "./audit";

const validQuestionIds = new Set(INTENT_QUESTIONS.map(q => q.id));

const SubmitIntentInput = z.object({
  parentName: z.string().trim().min(1).max(120),
  parentEmail: z.string().trim().email().max(160),
  parentPhone: z.string().trim().max(40).optional().default(""),
  childName: z.string().trim().min(1).max(120),
  childAge: z.number().int().min(5).max(25),
  childGender: z.enum(["Boy", "Girl", "Other"]),
  answers: z.record(z.string(), z.number().int().min(1).max(4))
    .refine(a => Object.keys(a).length === INTENT_QUESTIONS.length, "All questions must be answered")
    .refine(a => Object.keys(a).every(k => validQuestionIds.has(k)), "Unknown question id"),
});

export type SubmitIntentResult = {
  id: string;
  readiness: "high" | "medium" | "forming";
};

async function getSessionUserId(): Promise<string | null> {
  const token = getCookie("ikf_session");
  if (!token) return null;
  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id FROM sessions WHERE token = ${token} AND expires_at > now() LIMIT 1
  `;
  return rows[0]?.user_id ?? null;
}

export const submitIntent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SubmitIntentInput.parse(data))
  .handler(async ({ data }): Promise<SubmitIntentResult> => {
    const readiness = scoreReadiness(data.answers);
    const phone = data.parentPhone?.trim() || null;
    const userId = await getSessionUserId();

    const rows = await sql<{ id: string }[]>`
      INSERT INTO parent_child_profiles
        (parent_name, parent_email, parent_phone,
         child_name, child_age, child_gender,
         answers, readiness, stage)
      VALUES
        (${data.parentName}, ${data.parentEmail}, ${phone},
         ${data.childName}, ${data.childAge}, ${data.childGender},
         ${sql.json(data.answers)}, ${readiness}, 2)
      RETURNING id
    `;

    const profileId = rows[0].id;

    if (userId) {
      await sql`
        UPDATE users
        SET profile_id = ${profileId}, updated_at = now()
        WHERE id = ${userId}
      `;
    }

    await logAudit({
      action: "profile.create",
      entityType: "profile",
      entityId: profileId,
      payload: { readiness, childName: data.childName, parentEmail: data.parentEmail },
    });

    // Fire-and-forget: never block the parent's form submission on email delivery.
    void sendParentIntentAck({
      to: data.parentEmail,
      parentName: data.parentName,
      childName: data.childName,
    }).catch(err => console.error("[intent] parent ack send failed:", err));
    void sendAdvisorNewIntent({
      profileId,
      parentName: data.parentName,
      parentEmail: data.parentEmail,
      parentPhone: phone,
      childName: data.childName,
      childAge: data.childAge,
      readiness,
    }).catch(err => console.error("[intent] advisor notify send failed:", err));

    return { id: profileId, readiness };
  });
