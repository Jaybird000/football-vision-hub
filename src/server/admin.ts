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
  chargeInr: number | null;
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

// Module G: admins create / edit / delete assessment templates (the `key` is the
// primary key and is referenced by providers + uploads, so it's immutable once set).
const UpsertTemplateInput = z.object({
  key: z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/, "Key: lowercase letters, numbers and underscores only."),
  category: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().default(""),
  required: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
  isNew: z.boolean().optional().default(false),
});

export const upsertTemplate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertTemplateInput.parse(d))
  .handler(async ({ data }): Promise<{ key: string }> => {
    await requireAdmin();
    if (data.isNew) {
      const existing = await sql<{ key: string }[]>`SELECT key FROM assessment_templates WHERE key = ${data.key} LIMIT 1`;
      if (existing.length > 0) throw new Error(`A template with key "${data.key}" already exists.`);
      await sql`
        INSERT INTO assessment_templates (key, category, title, description, required, sort_order)
        VALUES (${data.key}, ${data.category}, ${data.title}, ${data.description}, ${data.required}, ${data.sortOrder})
      `;
    } else {
      await sql`
        UPDATE assessment_templates
        SET category = ${data.category}, title = ${data.title}, description = ${data.description},
            required = ${data.required}, sort_order = ${data.sortOrder}, updated_at = now()
        WHERE key = ${data.key}
      `;
    }
    return { key: data.key };
  });

const DeleteTemplateInput = z.object({ key: z.string().min(1) });

export const deleteTemplate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeleteTemplateInput.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin();
    // Block deletion if parents have already uploaded for this assessment — the
    // assessment_uploads FK would reject it and the data shouldn't be orphaned.
    // (Providers cascade-delete with the template per the 0003 schema.)
    const uploads = await sql<{ n: number }[]>`SELECT COUNT(*) AS n FROM assessment_uploads WHERE assessment_key = ${data.key}`;
    if (Number(uploads[0]?.n ?? 0) > 0) {
      throw new Error("Can't delete: parents have already uploaded reports for this assessment. Switch it to not-required instead.");
    }
    await sql`DELETE FROM assessment_templates WHERE key = ${data.key}`;
    return { ok: true };
  });

export const listAdminProviders = createServerFn({ method: "GET" }).handler(async (): Promise<AdminProvider[]> => {
  await requireAdmin();
  type Row = {
    id: string; assessment_key: string; name: string; description: string;
    url: string; city: string | null; charge_inr: number | null; is_active: boolean; sort_order: number;
  };
  // Tolerate migration 0011 (charge_inr) not being applied yet — fall back to a
  // query without the column so the providers admin still loads.
  const rows = await sql<Row[]>`
    SELECT id, assessment_key, name, description, url, city, charge_inr, is_active, sort_order
    FROM providers
    ORDER BY assessment_key, sort_order, name
  `.catch(async (e) => {
    console.warn("[admin] providers.charge_inr read failed (migration 0011 applied?):", e instanceof Error ? e.message : e);
    return sql<Row[]>`
      SELECT id, assessment_key, name, description, url, city, is_active, sort_order
      FROM providers
      ORDER BY assessment_key, sort_order, name
    `;
  });
  return rows.map(r => ({
    id: r.id,
    assessmentKey: r.assessment_key,
    name: r.name,
    description: r.description,
    url: r.url,
    city: r.city,
    chargeInr: r.charge_inr != null ? Number(r.charge_inr) : null,
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
  chargeInr: z.number().int().min(0).max(10_000_000).nullable().optional().default(null),
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
    const charge = data.chargeInr ?? null;
    // The charge_inr column may not exist yet (migration 0011). Try writing it;
    // if the column is missing, fall back to a write without it so provider
    // editing keeps working pre-migration (the charge is simply not persisted).
    if (data.id) {
      await sql`
        UPDATE providers
        SET assessment_key = ${data.assessmentKey},
            name = ${data.name},
            description = ${data.description},
            url = ${data.url},
            city = ${city},
            charge_inr = ${charge},
            is_active = ${data.isActive},
            sort_order = ${data.sortOrder},
            updated_at = now()
        WHERE id = ${data.id}
      `.catch(async (e) => {
        console.warn("[admin] provider update with charge_inr failed (migration 0011 applied?):", e instanceof Error ? e.message : e);
        await sql`
          UPDATE providers
          SET assessment_key = ${data.assessmentKey}, name = ${data.name}, description = ${data.description},
              url = ${data.url}, city = ${city}, is_active = ${data.isActive}, sort_order = ${data.sortOrder}, updated_at = now()
          WHERE id = ${data.id}
        `;
      });
      return { id: data.id };
    }
    const rows = await sql<{ id: string }[]>`
      INSERT INTO providers (assessment_key, name, description, url, city, charge_inr, is_active, sort_order)
      VALUES (${data.assessmentKey}, ${data.name}, ${data.description}, ${data.url}, ${city}, ${charge}, ${data.isActive}, ${data.sortOrder})
      RETURNING id
    `.catch(async (e) => {
      console.warn("[admin] provider insert with charge_inr failed (migration 0011 applied?):", e instanceof Error ? e.message : e);
      return sql<{ id: string }[]>`
        INSERT INTO providers (assessment_key, name, description, url, city, is_active, sort_order)
        VALUES (${data.assessmentKey}, ${data.name}, ${data.description}, ${data.url}, ${city}, ${data.isActive}, ${data.sortOrder})
        RETURNING id
      `;
    });
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
  city: string | null;
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
  // City lives in a column added by migration 0012 — fetch it separately and
  // guarded so the list still loads before that migration is applied.
  const cityRows = await sql<{ id: string; city: string | null }[]>`
    SELECT id, city FROM parent_child_profiles
  `.catch((e) => {
    console.warn("[admin] profiles.city read failed (migration 0012 applied?):", e instanceof Error ? e.message : e);
    return [] as { id: string; city: string | null }[];
  });
  const cityById = new Map(cityRows.map(c => [c.id, c.city]));
  return rows.map(r => ({
    id: r.id,
    childName: r.child_name,
    parentName: r.parent_name,
    parentEmail: r.parent_email,
    city: cityById.get(r.id) ?? null,
    readiness: r.readiness as AdminProfileRow["readiness"],
    stage: r.stage,
    uploadsTotal: Number(r.uploads_total),
    uploadsRequired: Number(r.uploads_required),
    createdAt: r.created_at.toISOString(),
  }));
});
