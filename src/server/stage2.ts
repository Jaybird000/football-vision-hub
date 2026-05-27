import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { sql } from "./db";
import { storeFile, deleteFile, readStoredFile, ALLOWED_MIME, MAX_FILE_SIZE } from "./storage";
import { sendAdvisorReadyToScore } from "./email";
import { logAudit } from "./audit";

type Role = "parent" | "advisor" | "admin";

export type AssessmentTemplate = {
  key: string;
  category: string;
  title: string;
  description: string;
  required: boolean;
  sortOrder: number;
};

export type ProviderListing = {
  id: string;
  assessmentKey: string;
  name: string;
  description: string;
  url: string;
  city: string | null;
};

export type UploadRecord = {
  id: string;
  assessmentKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "uploaded" | "verified" | "rejected";
  uploadedAt: string;
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
  const [templates, providers, uploads] = await Promise.all([
    sql<{ key: string; category: string; title: string; description: string; required: boolean; sort_order: number }[]>`
      SELECT key, category, title, description, required, sort_order
      FROM assessment_templates
      ORDER BY sort_order, key
    `,
    sql<{ id: string; assessment_key: string; name: string; description: string; url: string; city: string | null }[]>`
      SELECT id, assessment_key, name, description, url, city
      FROM providers
      WHERE is_active = true
      ORDER BY assessment_key, sort_order, name
    `,
    profileId
      ? sql<{ id: string; assessment_key: string; file_name: string; file_size: number; mime_type: string; status: string; uploaded_at: Date }[]>`
          SELECT id, assessment_key, file_name, file_size, mime_type, status, uploaded_at
          FROM assessment_uploads
          WHERE profile_id = ${profileId}
          ORDER BY uploaded_at DESC
        `
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
    })),
    providers: providers.map(p => ({
      id: p.id,
      assessmentKey: p.assessment_key,
      name: p.name,
      description: p.description,
      url: p.url,
      city: p.city,
    })),
    uploads: uploads.map(u => ({
      id: u.id,
      assessmentKey: u.assessment_key,
      fileName: u.file_name,
      fileSize: Number(u.file_size),
      mimeType: u.mime_type,
      status: u.status as UploadRecord["status"],
      uploadedAt: u.uploaded_at.toISOString(),
    })),
    requiredKeys,
    uploadedRequiredCount,
    minimumDatasetReached: requiredKeys.length > 0 && uploadedRequiredCount === requiredKeys.length,
  };
}

export const getMyStage2 = createServerFn({ method: "GET" }).handler(async (): Promise<Stage2State> => {
  const user = await getSessionUser();
  if (!user) {
    return loadStage2(null, null);
  }
  let childName: string | null = null;
  if (user.profileId) {
    const r = await sql<{ child_name: string }[]>`
      SELECT child_name FROM parent_child_profiles WHERE id = ${user.profileId} LIMIT 1
    `;
    childName = r[0]?.child_name ?? null;
  }
  return loadStage2(user.profileId, childName);
});

export const uploadAssessment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const key = String(data.get("assessmentKey") || "");
    const file = data.get("file");
    if (!key) throw new Error("Missing assessmentKey");
    if (!(file instanceof File) || file.size === 0) throw new Error("Missing file");
    return { key, file };
  })
  .handler(async ({ data }): Promise<UploadRecord> => {
    const user = await getSessionUser();
    if (!user) throw new Error("You must be signed in to upload reports.");
    if (!user.profileId) throw new Error("Please complete the Intent Form (Stage 1) before uploading reports.");

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
