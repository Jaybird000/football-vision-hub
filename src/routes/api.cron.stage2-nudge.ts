import { createFileRoute } from "@tanstack/react-router";
import { sql } from "@/server/db";
import { sendParentStage2Nudge } from "@/server/email";

const CRON_SECRET = process.env.CRON_SECRET;

// How long a profile must sit on Stage 2 with incomplete uploads before we
// send a re-engagement nudge. Cron fires once per profile (idempotency via
// notified_stage2_nudge_at).
const NUDGE_AFTER_DAYS = 7;

export const Route = createFileRoute("/api/cron/stage2-nudge")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!CRON_SECRET) return new Response("CRON_SECRET not set", { status: 500 });
        const auth = request.headers.get("authorization");
        if (auth !== `Bearer ${CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });

        // Profiles stuck on Stage 2:
        //   - Currently at stage 2 (intent submitted, no Stage 3 score yet)
        //   - Min dataset NOT yet reached (notified_advisor_min_dataset_at IS NULL)
        //   - Haven't already been nudged
        //   - Have sat for at least NUDGE_AFTER_DAYS since profile creation
        const rows = await sql<{
          id: string;
          parent_email: string;
          parent_name: string;
          child_name: string;
          created_at: Date;
        }[]>`
          SELECT id, parent_email, parent_name, child_name, created_at
          FROM parent_child_profiles
          WHERE stage = 2
            AND notified_advisor_min_dataset_at IS NULL
            AND notified_stage2_nudge_at IS NULL
            AND created_at < now() - (${NUDGE_AFTER_DAYS} || ' days')::interval
        `;

        const dispatched: string[] = [];
        for (const r of rows) {
          const daysSinceIntent = Math.floor((Date.now() - r.created_at.getTime()) / (1000 * 60 * 60 * 24));
          try {
            await sendParentStage2Nudge({
              to: r.parent_email,
              parentName: r.parent_name,
              childName: r.child_name,
              daysSinceIntent,
            });
            await sql`UPDATE parent_child_profiles SET notified_stage2_nudge_at = now() WHERE id = ${r.id}`;
            dispatched.push(r.id);
          } catch (err) {
            console.error(`[cron/stage2-nudge] failed for profile ${r.id}:`, err);
          }
        }

        return Response.json({ ok: true, scanned: rows.length, dispatched: dispatched.length });
      },
    },
  },
});
