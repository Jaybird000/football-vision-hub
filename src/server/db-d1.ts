// PHASE 3 SCAFFOLDING — NOT YET ACTIVE.
//
// This file shows what the D1-binding version of `src/server/db.ts` looks like.
// To activate on Cloudflare Workers, the final Phase 3 work is:
//
//   1. Set up the Cloudflare adapter in vite.config.ts using
//      @cloudflare/vite-plugin (already in devDependencies).
//   2. Write a Workers entry that captures `env` (from the fetch handler args)
//      into an AsyncLocalStorage scope per request.
//   3. Swap the import in callers from "./db" to this file, OR — preferred —
//      keep "./db" and have it auto-detect environment (D1 binding present → D1;
//      otherwise → better-sqlite3). The auto-detect glue is the missing piece.
//
// Once active, the same `sql` tagged-template API used by intent.ts /
// stage2.ts / stage3.ts / etc. just works — every caller is unchanged.

import type { D1Database } from "@cloudflare/workers-types";

// ---- Same `sql.json` marker + dialect rewrites as src/server/db.ts ----

const JSON_TAG = Symbol("ikf:json");
type JsonMarker = { [JSON_TAG]: unknown };
function isJsonMarker(v: unknown): v is JsonMarker {
  return typeof v === "object" && v !== null && JSON_TAG in (v as object);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;
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

function bindParam(v: unknown): unknown {
  if (v === undefined) return null;
  if (isJsonMarker(v)) return JSON.stringify((v as Record<symbol, unknown>)[JSON_TAG]);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

function hydrate<T>(row: T): T {
  if (!row || typeof row !== "object") return row;
  const out: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v !== "string" || v.length === 0) continue;
    if (ISO_DATE_RE.test(v)) out[k] = new Date(v);
    else if (v[0] === "[" || v[0] === "{") {
      try { out[k] = JSON.parse(v); } catch { /* leave as string */ }
    }
  }
  return out as T;
}

// ---- The D1-specific bit: query via the binding instead of better-sqlite3 ----

const RETURNING_RE = /\breturning\b/i;

export function createD1Sql(db: D1Database) {
  async function runTag<T = unknown[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
    const sqlText = rewriteDialect(strings.join("?"));
    const params = values.map(bindParam);
    const trimmed = sqlText.trimStart().toLowerCase();
    const wantsRows = trimmed.startsWith("select") || RETURNING_RE.test(sqlText);

    const stmt = db.prepare(sqlText).bind(...(params as Array<string | number | null>));
    if (wantsRows) {
      const result = await stmt.all();
      return (result.results as unknown[]).map(hydrate) as unknown as T;
    }
    await stmt.run();
    return [] as unknown as T;
  }

  return Object.assign(runTag, {
    json: (value: unknown): JsonMarker => ({ [JSON_TAG]: value }),
  });
}

// D1 has no user-defined functions, so the `uuid()` SQL function used in the
// migrations DEFAULT clauses won't exist on Workers. Two options:
//   A) Generate IDs in TS code with crypto.randomUUID() and pass them
//      explicitly in INSERTs (preferred — most portable, fastest).
//   B) Rewrite all DEFAULT (uuid()) in the SQLite migrations to use the
//      inline UUIDv4 expression (verbose but no app-code changes).
//
// Recommended path for next session: Option A — add `id: crypto.randomUUID()`
// to the 4-5 INSERTs that currently rely on DEFAULT, then run the migrations
// against D1 unchanged.
