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
  city: z.string().trim().max(120).optional().default(""),
  answers: z.record(z.string(), z.number().int().min(1).max(4))
    .refine(a => Object.keys(a).length === INTENT_QUESTIONS.length, "All questions must be answered")
    .refine(a => Object.keys(a).every(k => validQuestionIds.has(k)), "Unknown question id"),
  // Exact option text the parent chose per question (qid → label). Lets admins
  // see the real answer, not just the score. Optional for back-compat.
  answerChoices: z.record(z.string(), z.string().max(300)).optional().default({}),
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

export type MyIntent = {
  profileId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  childName: string;
  childAge: number;
  childGender: "Boy" | "Girl" | "Other";
  readiness: "high" | "medium" | "forming";
  submittedAt: string;
};

export const getMyIntent = createServerFn({ method: "GET" }).handler(async (): Promise<MyIntent | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const rows = await sql<{
    id: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string | null;
    child_name: string;
    child_age: number;
    child_gender: "Boy" | "Girl" | "Other";
    readiness: "high" | "medium" | "forming";
    created_at: Date;
  }[]>`
    SELECT p.id, p.parent_name, p.parent_email, p.parent_phone,
           p.child_name, p.child_age, p.child_gender,
           p.readiness, p.created_at
    FROM users u
    JOIN parent_child_profiles p ON p.id = u.profile_id
    WHERE u.id = ${userId}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    profileId: r.id,
    parentName: r.parent_name,
    parentEmail: r.parent_email,
    parentPhone: r.parent_phone,
    childName: r.child_name,
    childAge: r.child_age,
    childGender: r.child_gender,
    readiness: r.readiness,
    submittedAt: r.created_at.toISOString(),
  };
});

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

    // City (0012) and exact answer choices (0013) live in columns added by later
    // migrations. Write them best-effort so SOP submit keeps working before those
    // migrations are applied (the data is simply not stored until then).
    const cityVal = data.city?.trim() || null;
    if (cityVal) {
      await sql`UPDATE parent_child_profiles SET city = ${cityVal} WHERE id = ${profileId}`
        .catch(e => console.warn("[intent] city write skipped (migration 0012 applied?):", e instanceof Error ? e.message : e));
    }
    if (data.answerChoices && Object.keys(data.answerChoices).length > 0) {
      await sql`UPDATE parent_child_profiles SET answer_choices = ${sql.json(data.answerChoices)} WHERE id = ${profileId}`
        .catch(e => console.warn("[intent] answer_choices write skipped (migration 0013 applied?):", e instanceof Error ? e.message : e));
    }

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
