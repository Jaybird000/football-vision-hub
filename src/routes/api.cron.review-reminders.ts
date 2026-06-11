import { createFileRoute } from "@tanstack/react-router";
import { sql } from "@/server/db";
import { sendAdvisorReviewDue, sendParentReviewReminder } from "@/server/email";
import { createNotification } from "@/server/notifications";

// Vercel Cron sets `Authorization: Bearer $CRON_SECRET` automatically when the
// path is listed in vercel.json's crons array AND CRON_SECRET is set as an env
// var on the project. Same secret is checkable for manual triggers via curl.
const CRON_SECRET = process.env.CRON_SECRET;

const ADVISOR_WINDOW_DAYS = 14; // advisor "review due" heads-up
const PARENT_WINDOW_DAYS = 28;  // parent "review coming up" reminder (notification Type 1)

export const Route = createFileRoute("/api/cron/review-reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!CRON_SECRET) return new Response("CRON_SECRET not set", { status: 500 });
        const auth = request.headers.get("authorization");
        if (auth !== `Bearer ${CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });

        // ── Advisor branch (14-day): unchanged. Isolated so a failure here can't
        // stop the parent branch below.
        let advisorDispatched = 0;
        let advisorScanned = 0;
        try {
          const advisorCutoff = new Date(Date.now() + ADVISOR_WINDOW_DAYS * 24 * 60 * 60 * 1000);
          const rows = await sql<{ id: string; profile_id: string; valid_until: Date; parent_name: string; child_name: string }[]>`
            SELECT c.id, c.profile_id, c.valid_until, p.parent_name, p.child_name
            FROM categorisations c
            JOIN parent_child_profiles p ON p.id = c.profile_id
            WHERE c.is_current = true
              AND c.valid_until IS NOT NULL
              AND c.valid_until <= ${advisorCutoff}
              AND c.valid_until > now()
              AND c.last_review_reminder_at IS NULL
          `;
          advisorScanned = rows.length;
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
              advisorDispatched++;
            } catch (err) {
              console.error(`[cron/review-reminders] advisor send failed for ${r.id}:`, err);
            }
          }
        } catch (err) {
          console.error("[cron/review-reminders] advisor branch failed:", err);
        }

        // ── Parent branch (28-day, notification Type 1): in-app notification +
        // parent email linking to the pre-review check-in. Separate idempotency
        // flag (parent_review_reminder_at, 0016). Guarded so it no-ops cleanly
        // before that migration is applied.
        let parentDispatched = 0;
        let parentScanned = 0;
        try {
          const parentCutoff = new Date(Date.now() + PARENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
          const prows = await sql<{ id: string; profile_id: string; valid_until: Date; parent_name: string; parent_email: string; child_name: string; user_id: string | null }[]>`
            SELECT c.id, c.profile_id, c.valid_until, p.parent_name, p.parent_email, p.child_name, p.user_id
            FROM categorisations c
            JOIN parent_child_profiles p ON p.id = c.profile_id
            WHERE c.is_current = true
              AND c.valid_until IS NOT NULL
              AND c.valid_until <= ${parentCutoff}
              AND c.valid_until > now()
              AND c.parent_review_reminder_at IS NULL
          `;
          parentScanned = prows.length;
          for (const r of prows) {
            const daysRemaining = Math.max(0, Math.ceil((r.valid_until.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            const weeksRemaining = Math.max(1, Math.round(daysRemaining / 7));
            try {
              if (r.user_id) {
                await createNotification({
                  userId: r.user_id,
                  profileId: r.profile_id,
                  type: "review_reminder",
                  title: `${r.child_name}'s next review is coming up`,
                  body: "Before we update the profile, a quick five-minute check-in.",
                  link: `/ikf360/pre-review?child=${r.profile_id}`,
                });
              }
              await sendParentReviewReminder({
                to: r.parent_email,
                parentName: r.parent_name,
                childName: r.child_name,
                weeksRemaining,
                profileId: r.profile_id,
              });
              await sql`UPDATE categorisations SET parent_review_reminder_at = now() WHERE id = ${r.id}`;
              parentDispatched++;
            } catch (err) {
              console.error(`[cron/review-reminders] parent send failed for ${r.id}:`, err);
            }
          }
        } catch (err) {
          console.error("[cron/review-reminders] parent branch failed (migration 0016 applied?):", err);
        }

        return Response.json({
          ok: true,
          advisor: { scanned: advisorScanned, dispatched: advisorDispatched },
          parent: { scanned: parentScanned, dispatched: parentDispatched },
        });
      },
    },
  },
});
