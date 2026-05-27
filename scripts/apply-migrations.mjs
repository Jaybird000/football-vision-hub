// Idempotent migration runner for the local SQLite DB. Tracks applied
// migrations in a `_migrations` table so each file runs exactly once even
// though SQLite has no `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
//
// Usage: node scripts/apply-migrations.mjs
//
// For Cloudflare D1 in prod, this same logic happens via:
//   wrangler d1 migrations apply <db-name> --remote
// (wrangler maintains its own d1_migrations tracking table.)

import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { join, isAbsolute } from "node:path";

const DB_PATH = process.env.DATABASE_PATH || "db/local.sqlite";
const ABS_PATH = isAbsolute(DB_PATH) ? DB_PATH : join(process.cwd(), DB_PATH);
const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");

const db = new Database(ABS_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.function("uuid", { deterministic: false }, () => globalThis.crypto.randomUUID());

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name        TEXT PRIMARY KEY,
    applied_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`);

const applied = new Set(
  db.prepare("SELECT name FROM _migrations").all().map(r => r.name),
);

const files = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith(".sql"))
  .sort();

console.log(`Found ${files.length} migration files in ${MIGRATIONS_DIR}`);
console.log(`Already applied: ${applied.size}`);

let appliedNow = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`  · skip   ${file}`);
    continue;
  }
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  const run = db.transaction(() => {
    db.exec(sql);
    db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  });
  try {
    run();
    console.log(`  ✓ apply  ${file}`);
    appliedNow++;
  } catch (err) {
    console.error(`  ✗ FAIL   ${file}`);
    console.error(err);
    process.exit(1);
  }
}

console.log(`\nDone. Applied ${appliedNow} new migration(s); total ${applied.size + appliedNow}.`);
db.close();
