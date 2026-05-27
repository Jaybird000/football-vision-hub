import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const globalForSql = globalThis as unknown as { __ikfSql?: ReturnType<typeof postgres> };

export const sql =
  globalForSql.__ikfSql ??
  postgres(url, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForSql.__ikfSql = sql;
}
