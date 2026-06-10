import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { sql } from "./db";
import { sendParentRecommendationReady } from "./email";
import { logAudit } from "./audit";
import type { SopResponses } from "@/lib/ikf360-data";

type Role = "parent" | "advisor" | "admin";

// ---------- shared helpers ----------

async function getSessionUser(): Promise<{ id: string; role: Role; profileId: string | null; fullName: string } | null> {
  const token = getCookie("ikf_session");
  if (!token) return null;
  const rows = await sql<{ id: string; role: Role; profile_id: string | null; full_name: string }[]>`
    SELECT u.id, u.role, u.profile_id, u.full_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { id: rows[0].id, role: rows[0].role, profileId: rows[0].profile_id, fullName: rows[0].full_name };
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in.");
  if (user.role !== "admin" && user.role !== "advisor") throw new Error("Admin or advisor only.");
  return user;
}

// Resolve which child a parent read should target: the active child by default,
// or an explicit (ownership-checked) child for multi-child tab switching. Guarded
// so it works before migration 0015 adds parent_child_profiles.user_id.
async function resolveOwnedProfileId(
  user: { id: string; profileId: string | null },
  requestedId?: string | null,
): Promise<string | null> {
  if (!requestedId) return user.profileId;
  const owned = await sql<{ id: string }[]>`
    SELECT id FROM parent_child_profiles
    WHERE id = ${requestedId} AND (user_id = ${user.id} OR id = ${user.profileId})
    LIMIT 1
  `.catch(() => sql<{ id: string }[]>`
    SELECT id FROM parent_child_profiles
    WHERE id = ${requestedId} AND id = ${user.profileId}
    LIMIT 1
  `);
  if (owned.length === 0) throw new Error("That profile is not yours.");
  return requestedId;
}

// Cell key = sorted "axis_key:value_key" joined by "|" — deterministic regardless of input order.
export function makeCellKey(pairs: { axisKey: string; valueKey: string }[]): string {
  return pairs
    .map(p => `${p.axisKey}:${p.valueKey}`)
    .sort()
    .join("|");
}

// ---------- types exposed to UI ----------

export type AxisValue = {
  id: string;
  axisId: string;
  key: string;
  label: string;
  description: string;
  sortOrder: number;
};

export type Axis = {
  id: string;
  key: string;
  name: string;
  description: string;
  sortOrder: number;
  values: AxisValue[];
};

export type Cell = {
  id: string | null;
  cellKey: string;
  title: string;
  recommendationMd: string;
  isPublished: boolean;
  axisValues: { axisKey: string; axisName: string; valueKey: string; valueLabel: string }[];
};

export type CategorisationSnapshot = {
  id: string;
  cellKey: string;
  cellTitle: string;
  axisValues: { axisKey: string; axisName: string; valueKey: string; valueLabel: string }[];
  recommendationMd: string;
  advisorNotes: string;
  scoredByName: string;
  scoredAt: string;
  validUntil: string | null;
};

// ---------- axes + values ----------

export const listAxes = createServerFn({ method: "GET" }).handler(async (): Promise<Axis[]> => {
  const axes = await sql<{ id: string; key: string; name: string; description: string; sort_order: number }[]>`
    SELECT id, key, name, description, sort_order
    FROM categorisation_axes
    ORDER BY sort_order, name
  `;
  if (axes.length === 0) return [];

  const values = await sql<{ id: string; axis_id: string; key: string; label: string; description: string; sort_order: number }[]>`
    SELECT id, axis_id, key, label, description, sort_order
    FROM categorisation_axis_values
    ORDER BY axis_id, sort_order, label
  `;

  return axes.map(a => ({
    id: a.id,
    key: a.key,
    name: a.name,
    description: a.description,
    sortOrder: a.sort_order,
    values: values
      .filter(v => v.axis_id === a.id)
      .map(v => ({
        id: v.id,
        axisId: v.axis_id,
        key: v.key,
        label: v.label,
        description: v.description,
        sortOrder: v.sort_order,
      })),
  }));
});

const UpsertAxisInput = z.object({
  id: z.string().uuid().optional(),
  key: z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/, "lowercase, digits, underscore only"),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().default(""),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const upsertAxis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertAxisInput.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireAdmin();
    if (data.id) {
      await sql`
        UPDATE categorisation_axes
        SET key = ${data.key}, name = ${data.name}, description = ${data.description}, sort_order = ${data.sortOrder}, updated_at = now()
        WHERE id = ${data.id}
      `;
      return { id: data.id };
    }
    const rows = await sql<{ id: string }[]>`
      INSERT INTO categorisation_axes (key, name, description, sort_order)
      VALUES (${data.key}, ${data.name}, ${data.description}, ${data.sortOrder})
      RETURNING id
    `;
    return { id: rows[0].id };
  });

export const deleteAxis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin();
    await sql`DELETE FROM categorisation_axes WHERE id = ${data.id}`;
    return { ok: true };
  });

const UpsertValueInput = z.object({
  id: z.string().uuid().optional(),
  axisId: z.string().uuid(),
  key: z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/, "lowercase, digits, underscore only"),
  label: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().default(""),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const upsertAxisValue = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertValueInput.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireAdmin();
    if (data.id) {
      await sql`
        UPDATE categorisation_axis_values
        SET axis_id = ${data.axisId}, key = ${data.key}, label = ${data.label},
            description = ${data.description}, sort_order = ${data.sortOrder}, updated_at = now()
        WHERE id = ${data.id}
      `;
      return { id: data.id };
    }
    const rows = await sql<{ id: string }[]>`
      INSERT INTO categorisation_axis_values (axis_id, key, label, description, sort_order)
      VALUES (${data.axisId}, ${data.key}, ${data.label}, ${data.description}, ${data.sortOrder})
      RETURNING id
    `;
    return { id: rows[0].id };
  });

export const deleteAxisValue = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin();
    await sql`DELETE FROM categorisation_axis_values WHERE id = ${data.id}`;
    return { ok: true };
  });

// ---------- cells (cross-product of axis values) ----------

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>((acc, arr) => acc.flatMap(a => arr.map(x => [...a, x])), [[]]);
}

export const listCells = createServerFn({ method: "GET" }).handler(async (): Promise<Cell[]> => {
  const axes = await listAxes();
  if (axes.length === 0) return [];

  const cellRows = await sql<{ id: string; cell_key: string; title: string; recommendation_md: string; is_published: boolean }[]>`
    SELECT id, cell_key, title, recommendation_md, is_published FROM recommendation_cells
  `;
  const byKey = new Map(cellRows.map(c => [c.cell_key, c]));

  // Cross-product of axis values
  const combos = cartesian(axes.map(a => a.values.map(v => ({ axis: a, value: v }))));

  return combos.map(combo => {
    const cellKey = makeCellKey(combo.map(c => ({ axisKey: c.axis.key, valueKey: c.value.key })));
    const existing = byKey.get(cellKey);
    return {
      id: existing?.id ?? null,
      cellKey,
      title: existing?.title ?? "",
      recommendationMd: existing?.recommendation_md ?? "",
      isPublished: existing?.is_published ?? false,
      axisValues: combo.map(c => ({
        axisKey: c.axis.key,
        axisName: c.axis.name,
        valueKey: c.value.key,
        valueLabel: c.value.label,
      })),
    };
  });
});

const UpsertCellInput = z.object({
  cellKey: z.string().min(1),
  title: z.string().trim().max(200).optional().default(""),
  recommendationMd: z.string().max(10_000).optional().default(""),
  isPublished: z.boolean().optional().default(false),
});

export const upsertCell = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertCellInput.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireAdmin();
    const rows = await sql<{ id: string }[]>`
      INSERT INTO recommendation_cells (cell_key, title, recommendation_md, is_published)
      VALUES (${data.cellKey}, ${data.title}, ${data.recommendationMd}, ${data.isPublished})
      ON CONFLICT (cell_key) DO UPDATE
        SET title = EXCLUDED.title,
            recommendation_md = EXCLUDED.recommendation_md,
            is_published = EXCLUDED.is_published,
            updated_at = now()
      RETURNING id
    `;
    await logAudit({
      action: "cell.upsert",
      entityType: "cell",
      entityId: rows[0].id,
      payload: {
        cellKey: data.cellKey,
        isPublished: data.isPublished,
        titleLength: data.title.length,
        mdLength: data.recommendationMd.length,
      },
    });
    return { id: rows[0].id };
  });

// ---------- categorisation (scoring) ----------

const ScoreProfileInput = z.object({
  profileId: z.string().uuid(),
  selections: z.array(z.object({
    axisKey: z.string().min(1),
    valueKey: z.string().min(1),
  })).min(1),
  advisorNotes: z.string().max(2000).optional().default(""),
  validForDays: z.number().int().min(1).max(3650).optional().default(180), // 6 months default
});

export const scoreProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScoreProfileInput.parse(d))
  .handler(async ({ data }): Promise<{ id: string; cellKey: string }> => {
    const user = await requireAdmin();

    // Resolve axis + value rows to capture labels for the snapshot
    const axes = await listAxes();
    const valueByAxis = new Map(axes.map(a => [a.key, new Map(a.values.map(v => [v.key, v]))]));

    const snapshot = data.selections.map(s => {
      const axis = axes.find(a => a.key === s.axisKey);
      if (!axis) throw new Error(`Unknown axis: ${s.axisKey}`);
      const value = valueByAxis.get(s.axisKey)?.get(s.valueKey);
      if (!value) throw new Error(`Unknown value '${s.valueKey}' on axis '${s.axisKey}'`);
      return { axisKey: axis.key, axisName: axis.name, valueKey: value.key, valueLabel: value.label };
    });

    // Every axis must be specified for a complete categorisation
    if (snapshot.length !== axes.length) {
      throw new Error(`Score every axis (${axes.length}). You provided ${snapshot.length}.`);
    }

    const cellKey = makeCellKey(snapshot.map(s => ({ axisKey: s.axisKey, valueKey: s.valueKey })));

    // Look up cell snapshot (recommendation_md + title) at scoring time
    const cellRows = await sql<{ title: string; recommendation_md: string; is_published: boolean }[]>`
      SELECT title, recommendation_md, is_published FROM recommendation_cells WHERE cell_key = ${cellKey} LIMIT 1
    `;
    const cell = cellRows[0];
    const recommendationMd = cell?.is_published ? cell.recommendation_md : "(No published recommendation yet for this category. An advisor will follow up shortly.)";
    const cellTitle = cell?.title ?? "";

    // Mark prior current categorisation as not current
    await sql`UPDATE categorisations SET is_current = false WHERE profile_id = ${data.profileId} AND is_current = true`;

    const validUntil = new Date(Date.now() + data.validForDays * 24 * 60 * 60 * 1000);

    const rows = await sql<{ id: string }[]>`
      INSERT INTO categorisations
        (profile_id, cell_key, axis_values, recommendation_md, cell_title,
         advisor_notes, scored_by, scored_by_name, valid_until, is_current)
      VALUES
        (${data.profileId}, ${cellKey}, ${sql.json(snapshot)}, ${recommendationMd}, ${cellTitle},
         ${data.advisorNotes}, ${user.id}, ${user.fullName}, ${validUntil}, true)
      RETURNING id
    `;

    // Bump profile to stage 3
    await sql`UPDATE parent_child_profiles SET stage = 3, updated_at = now() WHERE id = ${data.profileId}`;

    await logAudit({
      action: "categorisation.create",
      entityType: "categorisation",
      entityId: rows[0].id,
      payload: {
        profileId: data.profileId,
        cellKey,
        selections: data.selections,
        hasAdvisorNotes: data.advisorNotes.length > 0,
        validForDays: data.validForDays,
      },
    });

    // Stage 3 → parent "your recommendation is ready" email.
    // Only when the cell is actually published (otherwise the parent would land on
    // placeholder copy). Fires on every fresh score AND re-score, which matches the
    // brief: parents should be notified of material changes to their categorisation.
    if (cell?.is_published) {
      const profileRows = await sql<{ parent_email: string; parent_name: string; child_name: string }[]>`
        SELECT parent_email, parent_name, child_name
        FROM parent_child_profiles WHERE id = ${data.profileId} LIMIT 1
      `;
      const p = profileRows[0];
      if (p) {
        void sendParentRecommendationReady({
          to: p.parent_email,
          parentName: p.parent_name,
          childName: p.child_name,
          cellTitle,
          advisorName: user.fullName,
        }).catch(err => console.error("[stage3] parent recommendation-ready send failed:", err));
      }
    }

    return { id: rows[0].id, cellKey };
  });

// Parent view: latest current categorisation. Optional profileId selects a
// specific (ownership-checked) child for multi-child dashboards; default = active.
const MyProfileInput = z.object({ profileId: z.string().uuid().optional() });

export const getMyCategorisation = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => MyProfileInput.parse(d ?? {}))
  .handler(async ({ data }): Promise<CategorisationSnapshot | null> => {
    const user = await getSessionUser();
    if (!user) return null;
    const profileId = await resolveOwnedProfileId(user, data.profileId);
    if (!profileId) return null;

    const rows = await sql<{
      id: string; cell_key: string; cell_title: string; axis_values: { axisKey: string; axisName: string; valueKey: string; valueLabel: string }[];
      recommendation_md: string; advisor_notes: string; scored_by_name: string; scored_at: Date; valid_until: Date | null;
    }[]>`
      SELECT id, cell_key, cell_title, axis_values, recommendation_md, advisor_notes,
             scored_by_name, scored_at, valid_until
      FROM categorisations
      WHERE profile_id = ${profileId} AND is_current = true
      ORDER BY scored_at DESC
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      cellKey: r.cell_key,
      cellTitle: r.cell_title,
      axisValues: r.axis_values,
      recommendationMd: r.recommendation_md,
      advisorNotes: r.advisor_notes,
      scoredByName: r.scored_by_name,
      scoredAt: r.scored_at.toISOString(),
      validUntil: r.valid_until?.toISOString() ?? null,
    };
  });

// Parent view: full review history for the timeline (Module 3). Returns every
// categorisation for the child (newest first) plus the profile-created event.
export type JourneyEvent = {
  kind: "created" | "review";
  date: string;
  title: string;
  by: string | null;
};

export const getMyJourney = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => MyProfileInput.parse(d ?? {}))
  .handler(async ({ data }): Promise<JourneyEvent[]> => {
    const user = await getSessionUser();
    if (!user) return [];
    const profileId = await resolveOwnedProfileId(user, data.profileId);
    if (!profileId) return [];

    const cats = await sql<{ cell_title: string; scored_by_name: string; scored_at: Date }[]>`
      SELECT cell_title, scored_by_name, scored_at
      FROM categorisations
      WHERE profile_id = ${profileId}
      ORDER BY scored_at DESC
    `;
    const prof = await sql<{ created_at: Date }[]>`
      SELECT created_at FROM parent_child_profiles WHERE id = ${profileId} LIMIT 1
    `;

    const events: JourneyEvent[] = cats.map(c => ({
      kind: "review" as const,
      date: c.scored_at.toISOString(),
      title: c.cell_title || "Recommendation updated",
      by: c.scored_by_name || null,
    }));
    if (prof[0]) {
      events.push({
        kind: "created",
        date: prof[0].created_at.toISOString(),
        title: "Profile created",
        by: null,
      });
    }
    return events; // newest first; the created event sits at the bottom
  });

// Admin: get a specific profile's current categorisation (for the scoring page)
const GetProfileCatInput = z.object({ profileId: z.string().uuid() });

export const getProfileCategorisation = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetProfileCatInput.parse(d))
  .handler(async ({ data }): Promise<CategorisationSnapshot | null> => {
    await requireAdmin();
    const rows = await sql<{
      id: string; cell_key: string; cell_title: string; axis_values: { axisKey: string; axisName: string; valueKey: string; valueLabel: string }[];
      recommendation_md: string; advisor_notes: string; scored_by_name: string; scored_at: Date; valid_until: Date | null;
    }[]>`
      SELECT id, cell_key, cell_title, axis_values, recommendation_md, advisor_notes,
             scored_by_name, scored_at, valid_until
      FROM categorisations
      WHERE profile_id = ${data.profileId} AND is_current = true
      ORDER BY scored_at DESC
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      cellKey: r.cell_key,
      cellTitle: r.cell_title,
      axisValues: r.axis_values,
      recommendationMd: r.recommendation_md,
      advisorNotes: r.advisor_notes,
      scoredByName: r.scored_by_name,
      scoredAt: r.scored_at.toISOString(),
      validUntil: r.valid_until?.toISOString() ?? null,
    };
  });

// Admin: get a profile + uploads for the scoring UI
export type AdminProfileDetail = {
  id: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  childAge: number;
  childGender: string;
  city: string | null;
  readiness: "high" | "medium" | "forming";
  stage: number;
  submittedAt: string;
  // Raw Parent SOP answers: question id → chosen option score (1-4). The admin
  // UI prefers `answerChoices` (exact text) and falls back to reconstructing from
  // these scores for profiles submitted before migration 0013.
  answers: Record<string, number>;
  // Exact option text chosen per question (qid → label), when available (0013).
  answerChoices: Record<string, string>;
  // Full Parent Journey SOP responses (0014). Present for profiles submitted via
  // the new 4-section SOP; null for legacy 8-question rows.
  sopResponses: SopResponses | null;
  uploads: { id: string; assessmentKey: string; assessmentTitle: string; fileName: string; mimeType: string; status: string; uploadedAt: string }[];
  // Mentor-help requests for this profile (Module E). Empty if none / table absent.
  assistanceRequests: { id: string; message: string; missingKeys: string[]; status: string; createdAt: string }[];
};

export const getAdminProfileDetail = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => GetProfileCatInput.parse(d))
  .handler(async ({ data }): Promise<AdminProfileDetail | null> => {
    await requireAdmin();
    const prows = await sql<{ id: string; child_name: string; parent_name: string; parent_email: string; parent_phone: string | null; child_age: number; child_gender: string; readiness: string; stage: number; answers: Record<string, number>; created_at: Date }[]>`
      SELECT id, child_name, parent_name, parent_email, parent_phone, child_age, child_gender, readiness, stage, answers, created_at
      FROM parent_child_profiles WHERE id = ${data.profileId} LIMIT 1
    `;
    if (prows.length === 0) return null;
    const p = prows[0];
    const urows = await sql<{ id: string; assessment_key: string; title: string; file_name: string; mime_type: string; status: string; uploaded_at: Date }[]>`
      SELECT u.id, u.assessment_key, t.title, u.file_name, u.mime_type, u.status, u.uploaded_at
      FROM assessment_uploads u
      JOIN assessment_templates t ON t.key = u.assessment_key
      WHERE u.profile_id = ${data.profileId}
      ORDER BY u.uploaded_at DESC
    `;
    // Mentor-help requests (Module E). Guarded so the page still loads if
    // migration 0010 hasn't been applied yet.
    const arows = await sql<{ id: string; message: string; missing_keys: string[]; status: string; created_at: Date }[]>`
      SELECT id, message, missing_keys, status, created_at
      FROM mentor_assistance_requests
      WHERE profile_id = ${data.profileId}
      ORDER BY created_at DESC
    `.catch((e) => {
      console.warn("[admin] mentor_assistance_requests read failed (migration 0010 applied?):", e instanceof Error ? e.message : e);
      return [] as { id: string; message: string; missing_keys: string[]; status: string; created_at: Date }[];
    });
    // city (0012) + answer_choices (0013) live in later-migration columns; read
    // each guarded so the page loads before those migrations are applied.
    const cityRows = await sql<{ city: string | null }[]>`
      SELECT city FROM parent_child_profiles WHERE id = ${data.profileId} LIMIT 1
    `.catch(() => [] as { city: string | null }[]);
    const choiceRows = await sql<{ answer_choices: Record<string, string> | null }[]>`
      SELECT answer_choices FROM parent_child_profiles WHERE id = ${data.profileId} LIMIT 1
    `.catch(() => [] as { answer_choices: Record<string, string> | null }[]);
    // Full SOP responses (0014). Guarded so the page loads before the migration.
    const sopRows = await sql<{ sop_responses: SopResponses | null }[]>`
      SELECT sop_responses FROM parent_child_profiles WHERE id = ${data.profileId} LIMIT 1
    `.catch(() => [] as { sop_responses: SopResponses | null }[]);
    return {
      id: p.id,
      childName: p.child_name,
      parentName: p.parent_name,
      parentEmail: p.parent_email,
      parentPhone: p.parent_phone,
      childAge: p.child_age,
      childGender: p.child_gender,
      city: cityRows[0]?.city ?? null,
      readiness: p.readiness as "high" | "medium" | "forming",
      stage: p.stage,
      submittedAt: p.created_at.toISOString(),
      answers: p.answers ?? {},
      answerChoices: choiceRows[0]?.answer_choices ?? {},
      sopResponses: sopRows[0]?.sop_responses ?? null,
      assistanceRequests: arows.map(a => ({
        id: a.id,
        message: a.message,
        missingKeys: Array.isArray(a.missing_keys) ? a.missing_keys : [],
        status: a.status,
        createdAt: a.created_at.toISOString(),
      })),
      uploads: urows.map(u => ({
        id: u.id,
        assessmentKey: u.assessment_key,
        assessmentTitle: u.title,
        fileName: u.file_name,
        mimeType: u.mime_type,
        status: u.status,
        uploadedAt: u.uploaded_at.toISOString(),
      })),
    };
  });
