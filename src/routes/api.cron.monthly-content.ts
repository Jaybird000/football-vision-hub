import { createFileRoute } from "@tanstack/react-router";
import { sql } from "@/server/db";
import { sendParentContent } from "@/server/email";
import { createNotification } from "@/server/notifications";

// Notification Type 3: one relevant content item per parent, at most ~monthly,
// chosen by their current categorisation's player_potential value (falling back
// to general/untagged items). Authed like the other crons.
const CRON_SECRET = process.env.CRON_SECRET;
const MIN_GAP_DAYS = 25; // don't re-send within ~a month

type AxisValue = { axisKey: string; valueKey: string };

export const Route = createFileRoute("/api/cron/monthly-content")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!CRON_SECRET) return new Response("CRON_SECRET not set", { status: 500 });
        const auth = request.headers.get("authorization");
        if (auth !== `Bearer ${CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });

        // Published content, newest first. Picked per-parent in JS (small set) to
        // avoid a query per profile. Guarded → [] before migration 0016.
        const content = await sql<{ id: string; title: string; summary: string; url: string; category: string | null }[]>`
          SELECT id, title, summary, url, category FROM content_items WHERE is_published = 1 ORDER BY created_at DESC
        `.catch(() => [] as { id: string; title: string; summary: string; url: string; category: string | null }[]);

        if (content.length === 0) {
          console.warn("[cron/monthly-content] no published content_items — nothing to send.");
          return Response.json({ ok: true, scanned: 0, dispatched: 0, note: "no published content" });
        }

        let scanned = 0;
        let dispatched = 0;
        try {
          const cutoff = new Date(Date.now() - MIN_GAP_DAYS * 24 * 60 * 60 * 1000);
          const rows = await sql<{ profile_id: string; parent_name: string; parent_email: string; child_name: string; user_id: string | null; axis_values: AxisValue[] }[]>`
            SELECT p.id AS profile_id, p.parent_name, p.parent_email, p.child_name, p.user_id, c.axis_values
            FROM parent_child_profiles p
            JOIN categorisations c ON c.profile_id = p.id AND c.is_current = true
            WHERE (p.last_content_at IS NULL OR p.last_content_at <= ${cutoff})
          `;
          scanned = rows.length;
          for (const r of rows) {
            const potential = Array.isArray(r.axis_values)
              ? (r.axis_values.find(a => a.axisKey === "player_potential")?.valueKey ?? "")
              : "";
            const pick = content.find(c => c.category === potential) ?? content.find(c => !c.category) ?? null;
            if (!pick) continue; // no category match and no general item
            try {
              if (r.user_id) {
                await createNotification({
                  userId: r.user_id,
                  profileId: r.profile_id,
                  type: "content",
                  title: pick.title,
                  body: pick.summary,
                  link: pick.url,
                });
              }
              await sendParentContent({
                to: r.parent_email,
                parentName: r.parent_name,
                childName: r.child_name,
                contentTitle: pick.title,
                contentSummary: pick.summary,
                contentUrl: pick.url,
              });
              await sql`UPDATE parent_child_profiles SET last_content_at = now() WHERE id = ${r.profile_id}`;
              dispatched++;
            } catch (err) {
              console.error(`[cron/monthly-content] send failed for profile ${r.profile_id}:`, err);
            }
          }
        } catch (err) {
          console.error("[cron/monthly-content] scan failed (migration 0016 applied?):", err);
        }

        return Response.json({ ok: true, scanned, dispatched });
      },
    },
  },
});
