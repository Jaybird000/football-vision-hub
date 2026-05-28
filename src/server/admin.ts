import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { sql } from "./db";

type Role = "parent" | "advisor" | "admin";

async function requireAdmin(): Promise<{ id: string; role: Role }> {
  const token = getCookie("ikf_session");
  if (!token) throw new Error("Not signed in.");
  const rows = await sql<{ id: string; role: Role }[]>`
    SELECT u.id, u.role
    FROM sessions s
    
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) throw new Error("Not signed in.");
  const me = rows[0];
  if (me.role !== "admin" && me.role !== "advisor") throw new Error("Admin or advisor only.");
  return me;
}

export type AdminTemplate = {
  key: string;
  category: string;
  title: string;
  description: string;
  required: boolean;
  sortOrder: number;
  providerCount: number;
  uploadCount: number;
};

export type AdminProvider = {
  id: string;
  assessmentKey: string;
  name: string;
  description: string;
  url: string;
  city: string | null;
  isActive: boolean;
  sortOrder: number;
};

export const listAdminTemplates = createServerFn({ method: "GET" }).handler(async (): Promise<AdminTemplate[]> => {
  await requireAdmin();
  const rows = await sql<{
    key: string; category: string; title: string; description: string;
    required: boolean; sort_order: number; provider_count: string; upload_count: string;
  }[]>`
    SELECT
      t.key, t.category, t.title, t.description, t.required, t.sort_order,
      (SELECT COUNT(*) FROM providers p WHERE p.assessment_key = t.key AND p.is_active) AS provider_count,
      (SELECT COUNT(*) FROM assessment_uploads u WHERE u.assessment_key = t.key) AS upload_count
    FROM assessment_templates t
    ORDER BY t.sort_order, t.key
  `;
  return rows.map(r => ({
    key: r.key,
    category: r.category,
    title: r.title,
    description: r.description,
    required: r.required,
    sortOrder: r.sort_order,
    providerCount: Number(r.provider_count),
    uploadCount: Number(r.upload_count),
  }));
});

const SetRequiredInput = z.object({
  key: z.string().min(1),
  required: z.boolean(),
});

export const setTemplateRequired = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SetRequiredInput.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin();
    await sql`UPDATE assessment_templates SET required = ${data.required}, updated_at = now() WHERE key = ${data.key}`;
    return { ok: true };
  });

export const listAdminProviders = createServerFn({ method: "GET" }).handler(async (): Promise<AdminProvider[]> => {
  await requireAdmin();
  const rows = await sql<{
    id: string; assessment_key: string; name: string; description: string;
    url: string; city: string | null; is_active: boolean; sort_order: number;
  }[]>`
    SELECT id, assessment_key, name, description, url, city, is_active, sort_order
    FROM providers
    ORDER BY assessment_key, sort_order, name
  `;
  return rows.map(r => ({
    id: r.id,
    assessmentKey: r.assessment_key,
    name: r.name,
    description: r.description,
    url: r.url,
    city: r.city,
    isActive: r.is_active,
    sortOrder: r.sort_order,
  }));
});

const UpsertProviderInput = z.object({
  id: z.string().uuid().optional(),
  assessmentKey: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().default(""),
  url: z.string().trim().url().max(500),
  city: z.string().trim().max(80).optional().default(""),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const upsertProvider = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertProviderInput.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireAdmin();

    const templateRows = await sql<{ key: string }[]>`
      SELECT key FROM assessment_templates WHERE key = ${data.assessmentKey} LIMIT 1
    `;
    if (templateRows.length === 0) throw new Error(`Unknown assessment: ${data.assessmentKey}`);

    const city = data.city.trim() || null;
    if (data.id) {
      await sql`
        UPDATE providers
        SET assessment_key = ${data.assessmentKey},
            name = ${data.name},
            description = ${data.description},
            url = ${data.url},
            city = ${city},
            is_active = ${data.isActive},
            sort_order = ${data.sortOrder},
            updated_at = now()
        WHERE id = ${data.id}
      `;
      return { id: data.id };
    }
    const rows = await sql<{ id: string }[]>`
      INSERT INTO providers (assessment_key, name, description, url, city, is_active, sort_order)
      VALUES (${data.assessmentKey}, ${data.name}, ${data.description}, ${data.url}, ${city}, ${data.isActive}, ${data.sortOrder})
      RETURNING id
    `;
    return { id: rows[0].id };
  });

const DeleteProviderInput = z.object({ id: z.string().uuid() });

export const deleteProvider = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeleteProviderInput.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin();
    await sql`DELETE FROM providers WHERE id = ${data.id}`;
    return { ok: true };
  });

export type AdminProfileRow = {
  id: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  readiness: "high" | "medium" | "forming";
  stage: number;
  uploadsTotal: number;
  uploadsRequired: number;
  createdAt: string;
};

export const listAdminProfiles = createServerFn({ method: "GET" }).handler(async (): Promise<AdminProfileRow[]> => {
  await requireAdmin();
  const rows = await sql<{
    id: string; child_name: string; parent_name: string; parent_email: string;
    readiness: string; stage: number; uploads_total: string; uploads_required: string;
    created_at: Date;
  }[]>`
    SELECT
      p.id, p.child_name, p.parent_name, p.parent_email, p.readiness, p.stage,
      (SELECT COUNT(*) FROM assessment_uploads u WHERE u.profile_id = p.id) AS uploads_total,
      (SELECT COUNT(*) FROM assessment_uploads u
         JOIN assessment_templates t ON t.key = u.assessment_key
         WHERE u.profile_id = p.id AND t.required) AS uploads_required,
      p.created_at
    FROM parent_child_profiles p
    ORDER BY p.created_at DESC
  `;
  return rows.map(r => ({
    id: r.id,
    childName: r.child_name,
    parentName: r.parent_name,
    parentEmail: r.parent_email,
    readiness: r.readiness as AdminProfileRow["readiness"],
    stage: r.stage,
    uploadsTotal: Number(r.uploads_total),
    uploadsRequired: Number(r.uploads_required),
    createdAt: r.created_at.toISOString(),
  }));
});
