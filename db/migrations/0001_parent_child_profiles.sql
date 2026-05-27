-- SQLite (for Cloudflare D1 / better-sqlite3 local dev).
-- Originally PostgreSQL; rewritten 2026-05-27 as part of the Cloudflare migration.
--
-- ID convention: TEXT holding UUID-style values, generated via the uuid() SQL
-- function registered in src/server/db.ts (better-sqlite3 user function).
-- Timestamps: TEXT holding ISO-8601 with millisecond precision; db.ts hydrates
-- back to Date objects on read.
-- Booleans: INTEGER 0/1 (SQLite has no native bool).
-- JSON: TEXT holding JSON string; sql.json(v) helper wraps writes.

CREATE TABLE IF NOT EXISTS parent_child_profiles (
  id              TEXT PRIMARY KEY DEFAULT (lower(
    hex(randomblob(4)) || '-' ||
    hex(randomblob(2)) || '-4' ||
    substr(hex(randomblob(2)), 2) || '-' ||
    substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' ||
    hex(randomblob(6))
  )),
  parent_name     TEXT NOT NULL,
  parent_email    TEXT NOT NULL,
  parent_phone    TEXT,
  child_name      TEXT NOT NULL,
  child_age       INTEGER NOT NULL CHECK (child_age BETWEEN 5 AND 25),
  child_gender    TEXT NOT NULL,
  answers         TEXT NOT NULL,
  readiness       TEXT NOT NULL CHECK (readiness IN ('high', 'medium', 'forming')),
  advisor_id      TEXT,
  stage           INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_email     ON parent_child_profiles (parent_email);
CREATE INDEX IF NOT EXISTS idx_profiles_readiness ON parent_child_profiles (readiness);
CREATE INDEX IF NOT EXISTS idx_profiles_created   ON parent_child_profiles (created_at DESC);
