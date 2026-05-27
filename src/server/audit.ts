import { getCookie } from "@tanstack/react-start/server";
import { sql } from "./db";

type AuditArgs = {
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
};

// Brief §8: every action on the platform must be logged with timestamp and user.
// Never throws — auditing failure must not block the underlying action.
export async function logAudit(args: AuditArgs): Promise<void> {
  try {
    const token = getCookie("ikf_session");
    let userId: string | null = null;
    let userEmail: string | null = null;
    if (token) {
      const rows = await sql<{ user_id: string; email: string }[]>`
        SELECT s.user_id, u.email
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ${token} AND s.expires_at > now()
        LIMIT 1
      `;
      if (rows.length > 0) {
        userId = rows[0].user_id;
        userEmail = rows[0].email;
      }
    }
    await sql`
      INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, payload)
      VALUES (${userId}, ${userEmail}, ${args.action}, ${args.entityType}, ${args.entityId ?? null},
              ${args.payload ? sql.json(args.payload as Record<string, any>) : null})
    `;
  } catch (err) {
    console.error("[audit] log failed:", err);
  }
}
