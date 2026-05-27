import { createFileRoute } from "@tanstack/react-router";
import { sql } from "@/server/db";
import { readStoredFile } from "@/server/storage";

export const Route = createFileRoute("/api/uploads/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie") || "";
        const match = cookieHeader.match(/ikf_session=([^;]+)/);
        const token = match?.[1];
        if (!token) return new Response("Unauthorized", { status: 401 });

        const sessionRows = await sql<{ user_id: string; role: string; profile_id: string | null }[]>`
          SELECT u.id AS user_id, u.role, u.profile_id
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token = ${token} AND s.expires_at > now()
          LIMIT 1
        `;
        if (sessionRows.length === 0) return new Response("Unauthorized", { status: 401 });
        const me = sessionRows[0];

        const rows = await sql<{ file_name: string; file_path: string; mime_type: string; profile_id: string }[]>`
          SELECT file_name, file_path, mime_type, profile_id
          FROM assessment_uploads
          WHERE id = ${params.id}
          LIMIT 1
        `;
        if (rows.length === 0) return new Response("Not found", { status: 404 });
        const upload = rows[0];

        const isAdmin = me.role === "admin" || me.role === "advisor";
        if (!isAdmin && upload.profile_id !== me.profile_id) {
          return new Response("Forbidden", { status: 403 });
        }

        const { buffer, size } = await readStoredFile(upload.file_path);
        const url = new URL(request.url);
        const inline = url.searchParams.get("inline") === "1";

        return new Response(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "content-type": upload.mime_type,
            "content-length": String(size),
            "content-disposition": `${inline ? "inline" : "attachment"}; filename="${upload.file_name.replace(/"/g, "")}"`,
            "cache-control": "private, no-store",
          },
        });
      },
    },
  },
});
