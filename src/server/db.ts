// SQL helper backed by Cloudflare D1's HTTP API. Same code runs on Node
// (local dev) and on Cloudflare Workers (production) — both just call
// fetch() with the account ID + database ID + an API token.
//
// Why HTTP API instead of D1 bindings:
//   - bindings only work inside the Workers request handler (env.DB), which
//     would require threading env through every server function. Doable, but
//     significant TanStack-Start-adapter work.
//   - HTTP API works from anywhere. One code path. Slower per query (~30-50ms
//     vs ~1ms for bindings) but acceptable at pilot scale.
//
// Caller API matches the postgres `sql` package: tagged template literal
// `sql<MyRow[]>` returns `Promise<MyRow[]>`; `sql.json(v)` marks JSON columns.
// Same `now()` / boolean rewrites + ISO-date and JSON hydration as before.

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID;
const API_TOKEN = process.env.CF_API_TOKEN;

const D1_ENDPOINT = ACCOUNT_ID && D1_DATABASE_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`
  : null;

if (!D1_ENDPOINT || !API_TOKEN) {
  console.warn("[db] CF_ACCOUNT_ID / CF_D1_DATABASE_ID / CF_API_TOKEN not all set — every query will throw.");
}

// ---- sql.json marker (same shape as the old postgres package) ----

const JSON_TAG = Symbol("ikf:json");
type JsonMarker = { [JSON_TAG]: unknown };
function isJsonMarker(v: unknown): v is JsonMarker {
  return typeof v === "object" && v !== null && JSON_TAG in (v as object);
}

// ---- read hydration: ISO-string → Date, looks-like-JSON → parsed ----

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

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

// ---- param binding: Date → ISO, bool → 0/1, JsonMarker → JSON string ----

function bindParam(v: unknown): unknown {
  if (v === undefined) return null;
  if (isJsonMarker(v)) return JSON.stringify((v as Record<symbol, unknown>)[JSON_TAG]);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

// ---- dialect rewrites: now() and = true/false stay PG-style at call sites ----

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

// ---- the tagged-template entry point ----

type D1QueryResponse = {
  success: boolean;
  errors?: Array<{ message: string }>;
  result?: Array<{ results?: unknown[]; meta?: { changes?: number; last_row_id?: number } }>;
};

async function runTag<T = unknown[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
  if (!D1_ENDPOINT || !API_TOKEN) {
    throw new Error("D1 not configured: set CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN.");
  }
  const sqlText = rewriteDialect(strings.join("?"));
  const params = values.map(bindParam);

  let res: Response;
  try {
    res = await fetch(D1_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ sql: sqlText, params }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`D1 fetch failed: ${msg}\nQuery: ${sqlText}`);
  }

  const body = (await res.json()) as D1QueryResponse;
  if (!res.ok || !body.success) {
    const errMsg = body.errors?.map(e => e.message).join("; ") || `HTTP ${res.status}`;
    throw new Error(`D1 error: ${errMsg}\nQuery: ${sqlText}`);
  }

  const rows = (body.result?.[0]?.results ?? []) as unknown[];
  return rows.map(hydrate) as unknown as T;
}

type SqlFn = {
  <T = unknown[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  json: (value: unknown) => JsonMarker;
};

export const sql = Object.assign(runTag, {
  json: (value: unknown): JsonMarker => ({ [JSON_TAG]: value }),
}) as SqlFn;
