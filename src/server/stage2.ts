import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { sql } from "./db";
import { storeFile, deleteFile, readStoredFile, ALLOWED_MIME, MAX_FILE_SIZE } from "./storage";
import { sendAdvisorReadyToScore, sendAdvisorAssistanceRequested, sendParentAssistanceAck } from "./email";
import { logAudit } from "./audit";

type Role = "parent" | "advisor" | "admin";

export type AssessmentTemplate = {
  key: string;
  category: string;
  title: string;
  description: string;
  required: boolean;
  sortOrder: number;
  // 0021 — richer "what/why" context + a link to the IKF predefined upload format.
  contextMd: string | null;
  formatUrl: string | null;
};

export type ProviderListing = {
  id: string;
  assessmentKey: string;
  name: string;
  description: string;
  url: string;
  city: string | null;
  chargeInr: number | null;
  // 0021 — 'integrated' partners auto-fetch via API (stubbed; coming soon),
  // 'manual' partners mean the parent uploads the report themselves.
  integrationType: "integrated" | "manual";
};

export type UploadRecord = {
  id: string;
  assessmentKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "uploaded" | "verified" | "rejected";
  uploadedAt: string;
  // Which partner/provider produced this report (0018). Null for legacy uploads
  // or when the parent didn't pick one.
  providerId: string | null;
  providerName: string | null;
};

export type Stage2State = {
  profileId: string | null;
  childName: string | null;
  templates: AssessmentTemplate[];
  providers: ProviderListing[];
  uploads: UploadRecord[];
  requiredKeys: string[];
  uploadedRequiredCount: number;
  minimumDatasetReached: boolean;
  // Module E: timestamp of the parent's most recent *open* mentor-help request,
  // or null if none is outstanding. Drives the "request sent" UI state.
  assistanceRequestedAt: string | null;
};

async function getSessionUser(): Promise<{ id: string; role: Role; profileId: string | null } | null> {
  const token = getCookie("ikf_session");
  if (!token) return null;
  const rows = await sql<{ id: string; role: Role; profile_id: string | null }[]>`
    SELECT u.id, u.role, u.profile_id
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { id: rows[0].id, role: rows[0].role, profileId: rows[0].profile_id };
}

async function loadStage2(profileId: string | null, childName: string | null): Promise<Stage2State> {
  const [templates, providers, uploads, openAssist] = await Promise.all([
    (() => {
      type TRow = { key: string; category: string; title: string; description: string; required: boolean; sort_order: number; context_md: string | null; format_url: string | null };
      // Tolerate migration 0021 (context_md/format_url) being unapplied.
      return sql<TRow[]>`
        SELECT key, category, title, description, required, sort_order, context_md, format_url
        FROM assessment_templates
        ORDER BY sort_order, key
      `.catch(async (e) => {
        console.warn("[stage2] assessment_templates.context_md read failed (migration 0021 applied?):", e instanceof Error ? e.message : e);
        const rows = await sql<Omit<TRow, "context_md" | "format_url">[]>`
          SELECT key, category, title, description, required, sort_order
          FROM assessment_templates
          ORDER BY sort_order, key
        `;
        return rows.map(r => ({ ...r, context_md: null, format_url: null })) as TRow[];
      });
    })(),
    (() => {
      type PRow = { id: string; assessment_key: string; name: string; description: string; url: string; city: string | null; charge_inr: number | null; integration_type: string };
      // Tolerate migrations 0011 (charge_inr) / 0021 (integration_type) being
      // unapplied — fall back progressively so the portal keeps listing providers.
      return sql<PRow[]>`
        SELECT id, assessment_key, name, description, url, city, charge_inr, integration_type
        FROM providers
        WHERE is_active = true
        ORDER BY assessment_key, sort_order, name
      `.catch(async (e) => {
        console.warn("[stage2] providers.integration_type/charge_inr read failed (migrations 0011/0021 applied?):", e instanceof Error ? e.message : e);
        const rows = await sql<{ id: string; assessment_key: string; name: string; description: string; url: string; city: string | null }[]>`
          SELECT id, assessment_key, name, description, url, city
          FROM providers
          WHERE is_active = true
          ORDER BY assessment_key, sort_order, name
        `;
        return rows.map(r => ({ ...r, charge_inr: null, integration_type: "manual" })) as PRow[];
      });
    })(),
    profileId
      ? (() => {
          type URow = { id: string; assessment_key: string; file_name: string; file_size: number; mime_type: string; status: string; uploaded_at: Date; provider_id: string | null; provider_name: string | null };
          // Tolerate migration 0018 (provider_id) being unapplied — fall back to
          // the pre-provider query so the upload list keeps working.
          return sql<URow[]>`
            SELECT u.id, u.assessment_key, u.file_name, u.file_size, u.mime_type, u.status, u.uploaded_at,
                   u.provider_id, p.name AS provider_name
            FROM assessment_uploads u
            LEFT JOIN providers p ON p.id = u.provider_id
            WHERE u.profile_id = ${profileId}
            ORDER BY u.uploaded_at DESC
          `.catch(async (e) => {
            console.warn("[stage2] assessment_uploads.provider_id read failed (migration 0018 applied?):", e instanceof Error ? e.message : e);
            const rows = await sql<{ id: string; assessment_key: string; file_name: string; file_size: number; mime_type: string; status: string; uploaded_at: Date }[]>`
              SELECT id, assessment_key, file_name, file_size, mime_type, status, uploaded_at
              FROM assessment_uploads
              WHERE profile_id = ${profileId}
              ORDER BY uploaded_at DESC
            `;
            return rows.map(r => ({ ...r, provider_id: null, provider_name: null })) as URow[];
          });
        })()
      : Promise.resolve([]),
    profileId
      ? sql<{ created_at: Date }[]>`
          SELECT created_at FROM mentor_assistance_requests
          WHERE profile_id = ${profileId} AND status = 'open'
          ORDER BY created_at DESC
          LIMIT 1
        `.catch((e) => {
          // Resilient to migration 0010 not being applied yet — the upload page
          // must keep working without the mentor_assistance_requests table.
          console.warn("[stage2] mentor_assistance_requests read failed (migration 0010 applied?):", e instanceof Error ? e.message : e);
          return [] as { created_at: Date }[];
        })
      : Promise.resolve([]),
  ]);

  const requiredKeys = templates.filter(t => t.required).map(t => t.key);
  const uploadedKeys = new Set(uploads.map(u => u.assessment_key));
  const uploadedRequiredCount = requiredKeys.filter(k => uploadedKeys.has(k)).length;

  return {
    profileId,
    childName,
    templates: templates.map(t => ({
      key: t.key,
      category: t.category,
      title: t.title,
      description: t.description,
      required: t.required,
      sortOrder: t.sort_order,
      contextMd: t.context_md ?? null,
      formatUrl: t.format_url ?? null,
    })),
    providers: providers.map(p => ({
      id: p.id,
      assessmentKey: p.assessment_key,
      name: p.name,
      description: p.description,
      url: p.url,
      city: p.city,
      chargeInr: p.charge_inr != null ? Number(p.charge_inr) : null,
      integrationType: p.integration_type === "integrated" ? "integrated" : "manual",
    })),
    uploads: uploads.map(u => ({
      id: u.id,
      assessmentKey: u.assessment_key,
      fileName: u.file_name,
      fileSize: Number(u.file_size),
      mimeType: u.mime_type,
      status: u.status as UploadRecord["status"],
      uploadedAt: u.uploaded_at.toISOString(),
      providerId: u.provider_id ?? null,
      providerName: u.provider_name ?? null,
    })),
    requiredKeys,
    uploadedRequiredCount,
    minimumDatasetReached: requiredKeys.length > 0 && uploadedRequiredCount === requiredKeys.length,
    assistanceRequestedAt: openAssist[0]?.created_at.toISOString() ?? null,
  };
}

// Resolve which child this Stage 2 read targets: the active child by default, or
// an explicit (ownership-checked) child for multi-child dashboards. Guarded so it
// works before migration 0015 adds parent_child_profiles.user_id.
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

const Stage2Input = z.object({ profileId: z.string().uuid().optional() });

export const getMyStage2 = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => Stage2Input.parse(d ?? {}))
  .handler(async ({ data }): Promise<Stage2State> => {
    const user = await getSessionUser();
    if (!user) {
      return loadStage2(null, null);
    }
    const profileId = await resolveOwnedProfileId(user, data.profileId);
    let childName: string | null = null;
    if (profileId) {
      const r = await sql<{ child_name: string }[]>`
        SELECT child_name FROM parent_child_profiles WHERE id = ${profileId} LIMIT 1
      `;
      childName = r[0]?.child_name ?? null;
    }
    return loadStage2(profileId, childName);
  });

export const uploadAssessment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const key = String(data.get("assessmentKey") || "");
    const file = data.get("file");
    const providerRaw = data.get("providerId");
    const providerId = providerRaw ? String(providerRaw) : null;
    if (!key) throw new Error("Missing assessmentKey");
    if (!(file instanceof File) || file.size === 0) throw new Error("Missing file");
    return { key, file, providerId };
  })
  .handler(async ({ data }): Promise<UploadRecord> => {
    const user = await getSessionUser();
    if (!user) throw new Error("You must be signed in to upload reports.");
    if (!user.profileId) throw new Error("Please complete the Parent SOP (Stage 1) before uploading reports.");

    const templateRows = await sql<{ key: string }[]>`
      SELECT key FROM assessment_templates WHERE key = ${data.key} LIMIT 1
    `;
    if (templateRows.length === 0) throw new Error(`Unknown assessment: ${data.key}`);

    if (!ALLOWED_MIME.has(data.file.type)) {
      throw new Error("File must be PDF, DOC, DOCX, JPG, or PNG.");
    }
    if (data.file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large. Max ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
    }

    const existing = await sql<{ id: string; file_path: string }[]>`
      SELECT id, file_path FROM assessment_uploads
      WHERE profile_id = ${user.profileId} AND assessment_key = ${data.key}
      LIMIT 1
    `;

    const stored = await storeFile(user.profileId, data.key, data.file);

    let row: { id: string; assessment_key: string; file_name: string; file_size: number; mime_type: string; status: string; uploaded_at: Date };
    if (existing.length > 0) {
      const upd = await sql<typeof row[]>`
        UPDATE assessment_uploads
        SET file_name = ${data.file.name},
            file_path = ${stored.path},
            file_size = ${stored.size},
            mime_type = ${data.file.type},
            status = 'uploaded',
            uploaded_at = now(),
            uploaded_by = ${user.id},
            reviewed_at = NULL,
            reviewed_by = NULL
        WHERE id = ${existing[0].id}
        RETURNING id, assessment_key, file_name, file_size, mime_type, status, uploaded_at
      `;
      row = upd[0];
      await deleteFile(existing[0].file_path);
    } else {
      const ins = await sql<typeof row[]>`
        INSERT INTO assessment_uploads
          (profile_id, assessment_key, file_name, file_path, file_size, mime_type, status, uploaded_by)
        VALUES
          (${user.profileId}, ${data.key}, ${data.file.name}, ${stored.path}, ${stored.size}, ${data.file.type}, 'uploaded', ${user.id})
        RETURNING id, assessment_key, file_name, file_size, mime_type, status, uploaded_at
      `;
      row = ins[0];
    }

    // Attribute the upload to the chosen partner (0018). Validate the provider
    // belongs to this assessment, then write it guarded so a submit still
    // succeeds before the migration is applied.
    let providerName: string | null = null;
    if (data.providerId) {
      const prov = await sql<{ id: string; name: string }[]>`
        SELECT id, name FROM providers WHERE id = ${data.providerId} AND assessment_key = ${data.key} LIMIT 1
      `.catch(() => [] as { id: string; name: string }[]);
      if (prov.length > 0) {
        providerName = prov[0].name;
        await sql`UPDATE assessment_uploads SET provider_id = ${data.providerId} WHERE id = ${row.id}`
          .catch(e => console.warn("[stage2] provider_id write skipped (migration 0018 applied?):", e instanceof Error ? e.message : e));
      }
    }

    await logAudit({
      action: existing.length > 0 ? "upload.replace" : "upload.create",
      entityType: "upload",
      entityId: row.id,
      payload: {
        profileId: user.profileId,
        assessmentKey: data.key,
        fileName: data.file.name,
        fileSize: Number(stored.size),
        mimeType: data.file.type,
      },
    });

    // Stage 2 → advisor "ready to score" notification.
    // Only check on fresh inserts (re-uploads don't change the uploaded set).
    // Idempotent via parent_child_profiles.notified_advisor_min_dataset_at — the
    // conditional UPDATE returns a row only on the first transition.
    if (existing.length === 0) {
      const [reqRows, uploadedRows] = await Promise.all([
        sql<{ key: string }[]>`SELECT key FROM assessment_templates WHERE required = true`,
        sql<{ assessment_key: string }[]>`SELECT DISTINCT assessment_key FROM assessment_uploads WHERE profile_id = ${user.profileId}`,
      ]);
      const requiredSet = new Set(reqRows.map(r => r.key));
      const uploadedSet = new Set(uploadedRows.map(u => u.assessment_key));
      const allRequired = requiredSet.size > 0 && [...requiredSet].every(k => uploadedSet.has(k));
      if (allRequired) {
        const claimed = await sql<{ id: string; parent_name: string; child_name: string }[]>`
          UPDATE parent_child_profiles
          SET notified_advisor_min_dataset_at = now()
          WHERE id = ${user.profileId} AND notified_advisor_min_dataset_at IS NULL
          RETURNING id, parent_name, child_name
        `;
        if (claimed.length > 0) {
          const p = claimed[0];
          void sendAdvisorReadyToScore({
            profileId: p.id,
            parentName: p.parent_name,
            childName: p.child_name,
          }).catch(err => console.error("[stage2] advisor ready-to-score send failed:", err));
        }
      }
    }

    return {
      id: row.id,
      assessmentKey: row.assessment_key,
      fileName: row.file_name,
      fileSize: Number(row.file_size),
      mimeType: row.mime_type,
      status: row.status as UploadRecord["status"],
      uploadedAt: row.uploaded_at.toISOString(),
      providerId: data.providerId,
      providerName,
    };
  });

const SetStatusInput = z.object({
  uploadId: z.string().uuid(),
  status: z.enum(["verified", "rejected"]),
});

export const setUploadStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SetStatusInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const user = await getSessionUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw new Error("Admin or advisor only.");
    }
    await sql`
      UPDATE assessment_uploads
      SET status = ${data.status},
          reviewed_at = now(),
          reviewed_by = ${user.id}
      WHERE id = ${data.uploadId}
    `;
    await logAudit({
      action: "upload.review",
      entityType: "upload",
      entityId: data.uploadId,
      payload: { status: data.status },
    });
    return { ok: true };
  });

const DeleteInput = z.object({ uploadId: z.string().uuid() });

export const deleteUpload = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DeleteInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const user = await getSessionUser();
    if (!user) throw new Error("Not signed in.");
    const isAdmin = user.role === "admin" || user.role === "advisor";

    const rows = await sql<{ id: string; profile_id: string; file_path: string }[]>`
      SELECT id, profile_id, file_path FROM assessment_uploads WHERE id = ${data.uploadId} LIMIT 1
    `;
    if (rows.length === 0) return { ok: true };
    const upload = rows[0];
    if (!isAdmin && upload.profile_id !== user.profileId) {
      throw new Error("You can only delete your own uploads.");
    }
    await sql`DELETE FROM assessment_uploads WHERE id = ${upload.id}`;
    await deleteFile(upload.file_path);
    await logAudit({
      action: "upload.delete",
      entityType: "upload",
      entityId: data.uploadId,
      payload: { profileId: upload.profile_id },
    });
    return { ok: true };
  });

// ---------- Module E: parent requests IKF mentor help with documents ----------

const AssistanceInput = z.object({ message: z.string().max(2000).optional() });

export const requestMentorAssistance = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AssistanceInput.parse(data ?? {}))
  .handler(async ({ data }): Promise<{ ok: true; alreadyOpen: boolean; requestedAt: string }> => {
    const user = await getSessionUser();
    if (!user) throw new Error("You must be signed in to request assistance.");
    if (!user.profileId) throw new Error("Please complete the Parent SOP (Stage 1) first.");

    // One open request per profile — don't duplicate or re-notify the advisor.
    const open = await sql<{ id: string; created_at: Date }[]>`
      SELECT id, created_at FROM mentor_assistance_requests
      WHERE profile_id = ${user.profileId} AND status = 'open'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (open.length > 0) {
      return { ok: true, alreadyOpen: true, requestedAt: open[0].created_at.toISOString() };
    }

    // Compute the missing required assessments server-side (authoritative).
    const [reqRows, uploadedRows, profileRows] = await Promise.all([
      sql<{ key: string; title: string }[]>`
        SELECT key, title FROM assessment_templates WHERE required = true ORDER BY sort_order, key
      `,
      sql<{ assessment_key: string }[]>`
        SELECT DISTINCT assessment_key FROM assessment_uploads WHERE profile_id = ${user.profileId}
      `,
      sql<{ parent_name: string; parent_email: string; parent_phone: string | null; child_name: string }[]>`
        SELECT parent_name, parent_email, parent_phone, child_name
        FROM parent_child_profiles WHERE id = ${user.profileId} LIMIT 1
      `,
    ]);
    if (profileRows.length === 0) throw new Error("Profile not found.");

    const uploaded = new Set(uploadedRows.map(u => u.assessment_key));
    const missing = reqRows.filter(r => !uploaded.has(r.key));
    const message = (data.message ?? "").trim();

    const ins = await sql<{ id: string; created_at: Date }[]>`
      INSERT INTO mentor_assistance_requests (profile_id, message, missing_keys)
      VALUES (${user.profileId}, ${message}, ${sql.json(missing.map(m => m.key))})
      RETURNING id, created_at
    `;
    const req = ins[0];

    await logAudit({
      action: "assistance.request",
      entityType: "profile",
      entityId: user.profileId,
      payload: { requestId: req.id, missingKeys: missing.map(m => m.key), hasMessage: message.length > 0 },
    });

    const p = profileRows[0];
    void sendAdvisorAssistanceRequested({
      profileId: user.profileId,
      parentName: p.parent_name,
      parentEmail: p.parent_email,
      parentPhone: p.parent_phone,
      childName: p.child_name,
      missingTitles: missing.map(m => m.title),
      message,
    }).catch(err => console.error("[stage2] advisor assistance send failed:", err));
    void sendParentAssistanceAck({
      to: p.parent_email,
      parentName: p.parent_name,
      childName: p.child_name,
    }).catch(err => console.error("[stage2] parent assistance ack send failed:", err));

    return { ok: true, alreadyOpen: false, requestedAt: req.created_at.toISOString() };
  });
