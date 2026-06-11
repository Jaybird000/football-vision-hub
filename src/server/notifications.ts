import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { sql } from "./db";
import { logAudit } from "./audit";
import { sendAdvisorPreReview } from "./email";
import { PRE_REVIEW_QUESTIONS, type PreReviewResponses } from "@/lib/ikf360-data";

// ─── Session + ownership helpers (same convention as the other server files) ──

async function getSessionUser(): Promise<{ id: string; profileId: string | null } | null> {
  const token = getCookie("ikf_session");
  if (!token) return null;
  const rows = await sql<{ id: string; profile_id: string | null }[]>`
    SELECT u.id, u.profile_id
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { id: rows[0].id, profileId: rows[0].profile_id };
}

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

// ─── Shared insert helper (used by crons + scoreProfile, not just the UI) ─────

export type NotificationType = "review_reminder" | "recommendation_update" | "content";

// Guarded insert: never throws (a notification failing must not block the
// triggering action), and no-ops cleanly before migration 0016 is applied.
export async function createNotification(args: {
  userId: string;
  profileId: string | null;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  await sql`
    INSERT INTO notifications (user_id, profile_id, type, title, body, link)
    VALUES (${args.userId}, ${args.profileId}, ${args.type}, ${args.title}, ${args.body ?? ""}, ${args.link ?? ""})
  `.catch(e => console.warn("[notifications] insert skipped (migration 0016 applied?):", e instanceof Error ? e.message : e));
}

// ─── Parent-facing reads ──────────────────────────────────────────────────────

export type MyNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  createdAt: string;
  readAt: string | null;
};

const ProfileIdInput = z.object({ profileId: z.string().uuid().optional() });

// Unread notifications for the selected child (or any of the user's children when
// a notification has no profile_id). Guarded → [] before migration 0016.
export const listMyNotifications = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => ProfileIdInput.parse(d ?? {}))
  .handler(async ({ data }): Promise<MyNotification[]> => {
    const user = await getSessionUser();
    if (!user) return [];
    const profileId = await resolveOwnedProfileId(user, data.profileId).catch(() => user.profileId);
    const rows = await sql<{ id: string; type: NotificationType; title: string; body: string; link: string; created_at: Date; read_at: Date | null }[]>`
      SELECT id, type, title, body, link, created_at, read_at
      FROM notifications
      WHERE user_id = ${user.id}
        AND read_at IS NULL
        AND (profile_id IS NULL OR profile_id = ${profileId})
      ORDER BY created_at DESC
      LIMIT 10
    `.catch(() => [] as { id: string; type: NotificationType; title: string; body: string; link: string; created_at: Date; read_at: Date | null }[]);
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      link: r.link,
      createdAt: r.created_at.toISOString(),
      readAt: r.read_at ? r.read_at.toISOString() : null,
    }));
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const user = await getSessionUser();
    if (!user) throw new Error("Not signed in.");
    await sql`UPDATE notifications SET read_at = now() WHERE id = ${data.id} AND user_id = ${user.id}`
      .catch(e => console.warn("[notifications] mark-read skipped:", e instanceof Error ? e.message : e));
    return { ok: true };
  });

// ─── Type 1: pre-review check-in submission ───────────────────────────────────

const SubmitPreReviewInput = z.object({
  profileId: z.string().uuid().optional(),
  responses: z.object({
    pr1: z.string().trim().max(300).default(""),
    pr2: z.string().trim().max(300).default(""),
    pr3: z.string().trim().max(300).default(""),
    pr4: z.string().trim().max(300).default(""),
    pr5: z.string().trim().max(2000).default(""),
  }),
});

export const submitPreReview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitPreReviewInput.parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const user = await getSessionUser();
    if (!user) throw new Error("You need to be signed in.");
    const profileId = await resolveOwnedProfileId(user, data.profileId);
    if (!profileId) throw new Error("No profile to update.");

    await sql`
      INSERT INTO pre_review_updates (profile_id, responses)
      VALUES (${profileId}, ${sql.json(data.responses)})
    `.catch(e => console.warn("[pre-review] insert skipped (migration 0016 applied?):", e instanceof Error ? e.message : e));

    await logAudit({ action: "pre_review.submit", entityType: "profile", entityId: profileId });

    const prof = await sql<{ parent_name: string; child_name: string }[]>`
      SELECT parent_name, child_name FROM parent_child_profiles WHERE id = ${profileId} LIMIT 1
    `;
    const p = prof[0];
    if (p) {
      const r = data.responses as PreReviewResponses;
      const lines = PRE_REVIEW_QUESTIONS.map(q => ({ q: q.q, a: r[q.id] ?? "" }));
      void sendAdvisorPreReview({ profileId, parentName: p.parent_name, childName: p.child_name, lines })
        .catch(err => console.error("[pre-review] advisor notify failed:", err));
    }
    return { ok: true };
  });

// ─── Admin: content-item CRUD (notification Type 3 source) ────────────────────

async function requireAdmin(): Promise<{ id: string }> {
  const token = getCookie("ikf_session");
  if (!token) throw new Error("Not signed in.");
  const rows = await sql<{ id: string; role: string }[]>`
    SELECT u.id, u.role FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now() LIMIT 1
  `;
  const u = rows[0];
  if (!u || (u.role !== "admin" && u.role !== "advisor")) throw new Error("Admin or advisor only.");
  return { id: u.id };
}

export type ContentItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  category: string | null;
  isPublished: boolean;
  createdAt: string;
};

export const listContentItems = createServerFn({ method: "GET" }).handler(async (): Promise<ContentItem[]> => {
  await requireAdmin();
  const rows = await sql<{ id: string; title: string; summary: string; url: string; category: string | null; is_published: boolean; created_at: Date }[]>`
    SELECT id, title, summary, url, category, is_published, created_at
    FROM content_items ORDER BY created_at DESC
  `.catch(() => [] as { id: string; title: string; summary: string; url: string; category: string | null; is_published: boolean; created_at: Date }[]);
  return rows.map(r => ({
    id: r.id, title: r.title, summary: r.summary, url: r.url,
    category: r.category, isPublished: !!r.is_published, createdAt: r.created_at.toISOString(),
  }));
});

const UpsertContentInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(600).optional().default(""),
  url: z.string().trim().url().max(600),
  category: z.string().trim().max(64).nullable().optional().default(null),
  isPublished: z.boolean().optional().default(false),
});

export const upsertContentItem = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertContentInput.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireAdmin();
    const category = data.category && data.category.length > 0 ? data.category : null;
    if (data.id) {
      await sql`
        UPDATE content_items
        SET title = ${data.title}, summary = ${data.summary}, url = ${data.url},
            category = ${category}, is_published = ${data.isPublished}, updated_at = now()
        WHERE id = ${data.id}
      `;
      await logAudit({ action: "content.upsert", entityType: "content", entityId: data.id });
      return { id: data.id };
    }
    const rows = await sql<{ id: string }[]>`
      INSERT INTO content_items (title, summary, url, category, is_published)
      VALUES (${data.title}, ${data.summary}, ${data.url}, ${category}, ${data.isPublished})
      RETURNING id
    `;
    await logAudit({ action: "content.create", entityType: "content", entityId: rows[0].id });
    return { id: rows[0].id };
  });

export const deleteContentItem = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin();
    await sql`DELETE FROM content_items WHERE id = ${data.id}`;
    await logAudit({ action: "content.delete", entityType: "content", entityId: data.id });
    return { ok: true };
  });
