import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { sql } from "./db";
import { deriveReadiness, journeyScoreMap, PREFER_NOT_TO_SAY, type SopResponses } from "@/lib/ikf360-data";
import { sendParentIntentAck, sendAdvisorNewIntent, sendAdvisorSopReviewFlag } from "./email";
import { logAudit } from "./audit";

// ─── Session helpers ─────────────────────────────────────────────────────────

async function getSessionUserId(): Promise<string | null> {
  const token = getCookie("ikf_session");
  if (!token) return null;
  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id FROM sessions WHERE token = ${token} AND expires_at > now() LIMIT 1
  `;
  return rows[0]?.user_id ?? null;
}

type SessionUser = { id: string; email: string; fullName: string };

// Full session user (id + email + name). The Parent Journey SOP no longer asks
// for the parent's name/email — it sources them from the signed-in account.
async function getSessionUser(): Promise<SessionUser | null> {
  const token = getCookie("ikf_session");
  if (!token) return null;
  const rows = await sql<{ id: string; email: string; full_name: string }[]>`
    SELECT u.id, u.email, u.full_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { id: rows[0].id, email: rows[0].email, fullName: rows[0].full_name };
}

// Resolve which child profile a parent read/action should target. With no
// explicit id, the user's active child (users.profile_id) is used. With an
// explicit id, it must be owned by the user (multi-child). Guarded so it keeps
// working before migration 0015 adds parent_child_profiles.user_id — pre-migration
// ownership falls back to the legacy active-child pointer.
async function resolveOwnedProfileId(userId: string, requestedId?: string | null): Promise<string | null> {
  if (!requestedId) {
    const rows = await sql<{ profile_id: string | null }[]>`
      SELECT profile_id FROM users WHERE id = ${userId} LIMIT 1
    `;
    return rows[0]?.profile_id ?? null;
  }
  const owned = await sql<{ id: string }[]>`
    SELECT id FROM parent_child_profiles
    WHERE id = ${requestedId}
      AND (user_id = ${userId} OR id = (SELECT profile_id FROM users WHERE id = ${userId}))
    LIMIT 1
  `.catch(() => sql<{ id: string }[]>`
    SELECT id FROM parent_child_profiles
    WHERE id = ${requestedId} AND id = (SELECT profile_id FROM users WHERE id = ${userId})
    LIMIT 1
  `);
  if (owned.length === 0) throw new Error("That profile is not yours.");
  return requestedId;
}

// ─── Existing-profile lookup (unchanged shape; used by the SOP + overview) ────

export type MyIntent = {
  profileId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  childName: string;
  childAge: number;
  childGender: "Boy" | "Girl" | "Other" | "Not specified";
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
    child_gender: "Boy" | "Girl" | "Other" | "Not specified";
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

// ─── Parent Journey SOP — validation ─────────────────────────────────────────

// Lenient per-field pieces, reused by both the strict submit schema and the
// permissive draft schema (drafts can be half-empty).
const q4Shape = z.object({
  prior: z.enum(["yes", "no", ""]).default(""),
  detail: z.string().trim().max(500).default(""),
});
const q6Shape = z.object({
  choices: z.array(z.string().max(400)).max(2).default([]),
  other: z.string().trim().max(500).default(""),
});

// Strict: every required answer present. Mirrors the client's gating so the
// server is a real backstop, not a rubber stamp.
const SubmitSopSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  age: z.number().int().min(8).max(18),
  q2: z.string().trim().min(1).max(200),
  q3: z.string().trim().min(1).max(200),
  q4: q4Shape.refine(v => v.prior === "yes" || v.prior === "no", "Please answer the IKF camps question."),
  q5: z.string().trim().min(1).max(300),
  q6: q6Shape.refine(v => v.choices.length >= 1, "Please choose at least one concern."),
  q7: z.string().trim().min(1).max(300),
  q8: z.string().trim().min(1).max(400),
  q9: z.string().trim().min(1).max(300),
  q10: z.string().trim().min(1).max(300),
  q11: z.string().trim().max(5000).default(""),
});

// Permissive: anything goes (used for autosave of in-progress drafts).
const DraftSopSchema = z.object({
  firstName: z.string().max(80).default(""),
  age: z.number().int().min(8).max(18).nullable().default(null),
  q2: z.string().max(200).default(""),
  q3: z.string().max(200).default(""),
  q4: q4Shape,
  q5: z.string().max(300).default(""),
  q6: q6Shape,
  q7: z.string().max(300).default(""),
  q8: z.string().max(400).default(""),
  q9: z.string().max(300).default(""),
  q10: z.string().max(300).default(""),
  q11: z.string().max(5000).default(""),
});

export type SubmitJourneyResult = {
  id: string;
  readiness: "high" | "medium" | "forming";
};

// ─── Draft autosave + resume ─────────────────────────────────────────────────

const SaveDraftInput = z.object({
  responses: DraftSopSchema,
  section: z.number().int().min(1).max(4),
});

export const saveSopDraft = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SaveDraftInput.parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false };
    // Upsert one draft per user. Guarded so the app keeps working before
    // migration 0014 creates parent_sop_drafts.
    await sql`
      INSERT INTO parent_sop_drafts (user_id, responses, section, updated_at)
      VALUES (${userId}, ${sql.json(data.responses)}, ${data.section}, now())
      ON CONFLICT (user_id) DO UPDATE
        SET responses = excluded.responses,
            section    = excluded.section,
            updated_at = now()
    `.catch(e => console.warn("[journey] draft save skipped (migration 0014 applied?):", e instanceof Error ? e.message : e));
    return { ok: true };
  });

export type MySopDraft = { responses: SopResponses; section: number };

export const getMySopDraft = createServerFn({ method: "GET" }).handler(async (): Promise<MySopDraft | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const rows = await sql<{ responses: SopResponses; section: number }[]>`
    SELECT responses, section FROM parent_sop_drafts WHERE user_id = ${userId} LIMIT 1
  `.catch(() => [] as { responses: SopResponses; section: number }[]);
  if (rows.length === 0) return null;
  return { responses: rows[0].responses, section: rows[0].section };
});

// ─── Submit ──────────────────────────────────────────────────────────────────

export const submitJourney = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SubmitSopSchema.parse(data))
  .handler(async ({ data }): Promise<SubmitJourneyResult> => {
    const user = await getSessionUser();
    if (!user) throw new Error("You need to be signed in to start your child's profile.");

    // `data` is the zod-validated payload — every required answer is present and
    // `age` is a concrete number (the SopResponses type allows null only for
    // in-progress drafts). It is structurally a SopResponses, so it feeds the
    // scoring helpers and JSON storage directly.
    const responses = data;
    const readiness = deriveReadiness(responses);
    const scoreMap = journeyScoreMap(responses);

    // The SOP does not collect the parent's name/email (taken from the account),
    // a phone number, or the child's gender. Gender is NOT NULL with no CHECK, so
    // a placeholder satisfies the constraint without inventing data.
    const rows = await sql<{ id: string }[]>`
      INSERT INTO parent_child_profiles
        (parent_name, parent_email, parent_phone,
         child_name, child_age, child_gender,
         answers, readiness, stage)
      VALUES
        (${user.fullName}, ${user.email}, ${null},
         ${responses.firstName}, ${responses.age}, ${"Not specified"},
         ${sql.json(scoreMap)}, ${readiness}, 2)
      RETURNING id
    `;
    const profileId = rows[0].id;

    // sop_responses lives in the 0014 column; write it guarded so a submit still
    // succeeds (storing only the derived scores) before that migration runs.
    await sql`UPDATE parent_child_profiles SET sop_responses = ${sql.json(responses)} WHERE id = ${profileId}`
      .catch(e => console.warn("[journey] sop_responses write skipped (migration 0014 applied?):", e instanceof Error ? e.message : e));

    // Multi-child ownership link (0015). Guarded so a submit still succeeds before
    // the migration runs (the profile stays reachable via users.profile_id below).
    await sql`UPDATE parent_child_profiles SET user_id = ${user.id} WHERE id = ${profileId}`
      .catch(e => console.warn("[journey] user_id write skipped (migration 0015 applied?):", e instanceof Error ? e.message : e));

    // Consume the draft now that it's been submitted (guarded).
    await sql`DELETE FROM parent_sop_drafts WHERE user_id = ${user.id}`
      .catch(() => { /* table may not exist yet */ });

    await sql`
      UPDATE users SET profile_id = ${profileId}, updated_at = now() WHERE id = ${user.id}
    `;

    await logAudit({
      action: "profile.create",
      entityType: "profile",
      entityId: profileId,
      payload: { readiness, childName: responses.firstName, parentEmail: user.email },
    });

    // Fire-and-forget: never block the parent's submission on email delivery.
    void sendParentIntentAck({
      to: user.email,
      parentName: user.fullName,
      childName: responses.firstName,
    }).catch(err => console.error("[journey] parent ack send failed:", err));
    void sendAdvisorNewIntent({
      profileId,
      parentName: user.fullName,
      parentEmail: user.email,
      parentPhone: null,
      childName: responses.firstName,
      childAge: responses.age,
      readiness,
    }).catch(err => console.error("[journey] advisor notify send failed:", err));

    return { id: profileId, readiness };
  });

// ─── Multi-child (0015): list / switch the parent's children ─────────────────

export type MyChild = {
  profileId: string;
  childName: string;
  childAge: number;
  stage: number;
  isActive: boolean;
  createdAt: string;
};

// All child profiles owned by the signed-in parent, oldest first, with the
// currently-active one flagged. Guarded: before migration 0015 the user_id
// column is absent, so we fall back to the single active-child profile.
export const listMyChildren = createServerFn({ method: "GET" }).handler(async (): Promise<MyChild[]> => {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const urows = await sql<{ profile_id: string | null }[]>`
    SELECT profile_id FROM users WHERE id = ${userId} LIMIT 1
  `;
  const activeId = urows[0]?.profile_id ?? null;

  type Row = { id: string; child_name: string; child_age: number; stage: number; created_at: Date };
  let rows = await sql<Row[]>`
    SELECT id, child_name, child_age, stage, created_at
    FROM parent_child_profiles
    WHERE user_id = ${userId}
    ORDER BY created_at
  `.catch(() => null as Row[] | null);

  // Pre-migration (or an un-backfilled legacy row): just the active child.
  if (!rows || rows.length === 0) {
    if (!activeId) return [];
    rows = await sql<Row[]>`
      SELECT id, child_name, child_age, stage, created_at
      FROM parent_child_profiles WHERE id = ${activeId} LIMIT 1
    `.catch(() => [] as Row[]);
  }

  return rows.map(r => ({
    profileId: r.id,
    childName: r.child_name,
    childAge: r.child_age,
    stage: r.stage,
    isActive: r.id === activeId,
    createdAt: r.created_at.toISOString(),
  }));
});

export const setActiveChild = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const userId = await getSessionUserId();
    if (!userId) throw new Error("You need to be signed in.");
    await resolveOwnedProfileId(userId, data.profileId); // throws if not owned
    await sql`UPDATE users SET profile_id = ${data.profileId}, updated_at = now() WHERE id = ${userId}`;
    return { ok: true };
  });

// ─── Dashboard Module 5: SOP summary + flag-for-review ───────────────────────

export type MySopSummary = {
  hasResponses: boolean;
  hopingFor: string;   // q5 — age-22 vision
  capacity: string;    // q8 (funding) + q7 (support duration)
  relocation: string;  // q9 — relocation openness
  playingFor: string;  // q2 — years playing (used by the greeting strip)
};

const ProfileIdInput = z.object({ profileId: z.string().uuid().optional() });

export const getMySop = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => ProfileIdInput.parse(d ?? {}))
  .handler(async ({ data }): Promise<MySopSummary | null> => {
    const userId = await getSessionUserId();
    if (!userId) return null;
    const profileId = await resolveOwnedProfileId(userId, data.profileId);
    if (!profileId) return null;
    const rows = await sql<{ sop_responses: SopResponses | null }[]>`
      SELECT sop_responses FROM parent_child_profiles WHERE id = ${profileId} LIMIT 1
    `.catch(() => [] as { sop_responses: SopResponses | null }[]);
    const r = rows[0]?.sop_responses ?? null;
    if (!r) return { hasResponses: false, hopingFor: "", capacity: "", relocation: "", playingFor: "" };
    const funding = r.q8 && r.q8 !== PREFER_NOT_TO_SAY ? r.q8 : "";
    const capacity = [funding, r.q7].filter(Boolean).join(" ");
    return {
      hasResponses: true,
      hopingFor: r.q5 ?? "",
      capacity,
      relocation: r.q9 ?? "",
      playingFor: r.q2 ?? "",
    };
  });

const FlagReviewInput = z.object({
  profileId: z.string().uuid().optional(),
  note: z.string().trim().max(2000).optional().default(""),
});

export const flagSopForReview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => FlagReviewInput.parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const user = await getSessionUser();
    if (!user) throw new Error("You need to be signed in.");
    const profileId = await resolveOwnedProfileId(user.id, data.profileId);
    if (!profileId) throw new Error("No profile to flag for review.");
    const prows = await sql<{ parent_name: string; parent_email: string; child_name: string }[]>`
      SELECT parent_name, parent_email, child_name FROM parent_child_profiles WHERE id = ${profileId} LIMIT 1
    `;
    const p = prows[0];
    await logAudit({
      action: "sop.flag_review",
      entityType: "profile",
      entityId: profileId,
      payload: { hasNote: data.note.length > 0 },
    });
    if (p) {
      void sendAdvisorSopReviewFlag({
        profileId,
        parentName: p.parent_name,
        parentEmail: p.parent_email,
        childName: p.child_name,
        note: data.note,
      }).catch(err => console.error("[sop] review-flag send failed:", err));
    }
    return { ok: true };
  });
