import { createFileRoute } from "@tanstack/react-router";
import { sql } from "@/server/db";
import { sendAdvisorReviewDue } from "@/server/email";

// Vercel Cron sets `Authorization: Bearer $CRON_SECRET` automatically when the
// path is listed in vercel.json's crons array AND CRON_SECRET is set as an env
// var on the project. Same secret is checkable for manual triggers via curl.
const CRON_SECRET = process.env.CRON_SECRET;

const REMINDER_WINDOW_DAYS = 14;

export const Route = createFileRoute("/api/cron/review-reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!CRON_SECRET) return new Response("CRON_SECRET not set", { status: 500 });
        const auth = request.headers.get("authorization");
        if (auth !== `Bearer ${CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });

        // Categorisations whose 6-month window opens within the next 14 days,
        // are still the current categorisation for their profile, and haven't
        // already had a reminder fired.
        const rows = await sql<{
          id: string;
          profile_id: string;
          valid_until: Date;
          parent_name: string;
          child_name: string;
        }[]>`
          SELECT c.id, c.profile_id, c.valid_until, p.parent_name, p.child_name
          FROM categorisations c
          JOIN parent_child_profiles p ON p.id = c.profile_id
          WHERE c.is_current = true
            AND c.valid_until IS NOT NULL
            AND c.valid_until <= now() + (${REMINDER_WINDOW_DAYS} || ' days')::interval
            AND c.valid_until > now()
            AND c.last_review_reminder_at IS NULL
        `;

        const dispatched: string[] = [];
        for (const r of rows) {
          const daysRemaining = Math.max(0, Math.ceil((r.valid_until.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          try {
            await sendAdvisorReviewDue({
              profileId: r.profile_id,
              parentName: r.parent_name,
              childName: r.child_name,
              validUntil: r.valid_until,
              daysRemaining,
            });
            await sql`UPDATE categorisations SET last_review_reminder_at = now() WHERE id = ${r.id}`;
            dispatched.push(r.id);
          } catch (err) {
            console.error(`[cron/review-reminders] failed for categorisation ${r.id}:`, err);
          }
        }

        return Response.json({ ok: true, scanned: rows.length, dispatched: dispatched.length });
      },
    },
  },
});
