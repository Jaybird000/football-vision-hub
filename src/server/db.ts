// Tagged-template SQL shim over better-sqlite3 (local dev) — same call-site
// shape as the `postgres` package we used to have, so caller code doesn't change.
//
// Phase 3 will swap the better-sqlite3 implementation for a Cloudflare D1
// binding when running on Workers (`env.DB.prepare(...).bind(...).all()`).
// The `sql` tagged template API and the `sql.json` helper stay identical so
// no caller in src/server/*.ts has to change between local dev and prod.

import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, isAbsolute } from "node:path";

const DB_PATH = process.env.DATABASE_PATH || "db/local.sqlite";
const ABS_PATH = isAbsolute(DB_PATH) ? DB_PATH : join(process.cwd(), DB_PATH);

const globalForDb = globalThis as unknown as { __ikfDb?: Database.Database };

function openDb(): Database.Database {
  const dir = dirname(ABS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(ABS_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // Make UUID-style IDs available to SQLite migrations as `uuid()` so DEFAULT
  // (uuid()) on a TEXT primary key produces a proper UUIDv4.
  db.function("uuid", { deterministic: false }, () => globalThis.crypto.randomUUID());
  return db;
}

const db: Database.Database = globalForDb.__ikfDb ?? openDb();
if (process.env.NODE_ENV !== "production") globalForDb.__ikfDb = db;

// `sql.json(v)` wraps a value so the shim knows to JSON.stringify it on bind
// (SQLite has no native JSONB — JSON is stored as TEXT and queried via
// json_extract). Implemented as a Symbol-keyed marker object so it can never
// collide with a normal value.
const JSON_TAG = Symbol("ikf:json");
type JsonMarker = { [JSON_TAG]: unknown };

function isJsonMarker(v: unknown): v is JsonMarker {
  return typeof v === "object" && v !== null && JSON_TAG in (v as object);
}

// Matches strict ISO-8601 timestamps so we can re-hydrate text columns back
// into Date objects on read. SQLite has no TIMESTAMPTZ; we store ISO strings.
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

function hydrate<T>(row: T): T {
  if (!row || typeof row !== "object") return row;
  const out: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v !== "string" || v.length === 0) continue;
    if (ISO_DATE_RE.test(v)) {
      out[k] = new Date(v);
    } else if (v[0] === "[" || v[0] === "{") {
      // Looks like JSON. Stand-in for postgres' automatic JSONB → object
      // hydration. No column in our schema stores a non-JSON string starting
      // with `[` or `{`, so the heuristic is safe in practice.
      try { out[k] = JSON.parse(v); } catch { /* leave as string */ }
    }
  }
  return out as T;
}

function bindParam(v: unknown): unknown {
  if (v === undefined) return null;
  if (isJsonMarker(v)) return JSON.stringify((v as Record<symbol, unknown>)[JSON_TAG]);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

// "select" or any statement containing RETURNING means we want rows back.
const RETURNING_RE = /\breturning\b/i;
// Postgres → SQLite syntax rewrites done on-the-fly so caller code doesn't
// have to know about the dialect change:
//   now()    → (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
//   = true   → = 1     (SQLite has no native bool; columns are INTEGER 0/1)
//   = false  → = 0
const NOW_REPLACEMENT = "(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))";
const NOW_RE = /\bnow\(\)/gi;
const BOOL_TRUE_RE = /=\s*true\b/gi;
const BOOL_FALSE_RE = /=\s*false\b/gi;

function rewriteDialect(s: string): string {
  return s
    .replace(NOW_RE, NOW_REPLACEMENT)
    .replace(BOOL_TRUE_RE, "= 1")
    .replace(BOOL_FALSE_RE, "= 0");
}

// Signature matches the `postgres` package: caller writes `sql<MyRow[]>` and
// gets back `Promise<MyRow[]>` — i.e. T is the whole array type, not a single
// row. Preserving this lets every existing call site keep the same generic.
async function runTag<T = unknown[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
  const sqlText = rewriteDialect(strings.join("?"));
  const params = values.map(bindParam);
  const trimmed = sqlText.trimStart().toLowerCase();
  const wantsRows = trimmed.startsWith("select") || RETURNING_RE.test(sqlText);

  try {
    const stmt = db.prepare(sqlText);
    if (wantsRows) {
      const rows = stmt.all(...(params as never[])) as unknown[];
      return rows.map(hydrate) as unknown as T;
    }
    stmt.run(...(params as never[]));
    return [] as unknown as T;
  } catch (err) {
    // Re-throw with the query attached so we can see what broke in dev logs.
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`SQL error: ${msg}\nQuery: ${sqlText}`);
  }
}

type SqlFn = {
  <T = unknown[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  json: (value: unknown) => JsonMarker;
};

export const sql = Object.assign(runTag, {
  json: (value: unknown): JsonMarker => ({ [JSON_TAG]: value }),
}) as SqlFn;
