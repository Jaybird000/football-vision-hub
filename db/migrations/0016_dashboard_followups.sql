-- Dashboard follow-ups: notification system + Type-3 content layer + Type-1
-- pre-review check-in + structured plain-language authoring.
--
-- Additive + nullable, same 0010–0015 convention: every read/write in
-- src/server/{notifications,stage3,auth}.ts is .catch-guarded so the app runs
-- before this is applied to D1. Apply with:
--   wrangler d1 execute ikf-pathway --remote --file=db/migrations/0016_dashboard_followups.sql

-- ── Notification system ──────────────────────────────────────────────────────
-- One row per notification delivered to a parent. Persisted for the in-app
-- dashboard strip + as the history/idempotency record behind the push emails.
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY DEFAULT (lower(
    hex(randomblob(4)) || '-' ||
    hex(randomblob(2)) || '-4' ||
    substr(hex(randomblob(2)), 2) || '-' ||
    substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' ||
    hex(randomblob(6))
  )),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id  TEXT REFERENCES parent_child_profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,             -- review_reminder | recommendation_update | content
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  link        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  read_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);

-- ── Type-3 content layer (admin-curated links) ───────────────────────────────
CREATE TABLE IF NOT EXISTS content_items (
  id           TEXT PRIMARY KEY DEFAULT (lower(
    hex(randomblob(4)) || '-' ||
    hex(randomblob(2)) || '-4' ||
    substr(hex(randomblob(2)), 2) || '-' ||
    substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' ||
    hex(randomblob(6))
  )),
  title        TEXT NOT NULL,
  summary      TEXT NOT NULL DEFAULT '',
  url          TEXT NOT NULL,
  category     TEXT,                      -- optional player_potential value (high|developing|uncertain); NULL = general
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ── Type-1 pre-review check-in ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pre_review_updates (
  id          TEXT PRIMARY KEY DEFAULT (lower(
    hex(randomblob(4)) || '-' ||
    hex(randomblob(2)) || '-4' ||
    substr(hex(randomblob(2)), 2) || '-' ||
    substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' ||
    hex(randomblob(6))
  )),
  profile_id  TEXT NOT NULL REFERENCES parent_child_profiles(id) ON DELETE CASCADE,
  responses   TEXT NOT NULL,             -- JSON
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ── Idempotency flags ────────────────────────────────────────────────────────
-- Type-1 parent reminder (28-day window) — distinct from the advisor's existing
-- 14-day last_review_reminder_at (0008).
ALTER TABLE categorisations ADD COLUMN parent_review_reminder_at TEXT;
-- Type-3 monthly content — gates to at most one per ~month.
ALTER TABLE parent_child_profiles ADD COLUMN last_content_at TEXT;

-- ── Structured plain-language authoring ──────────────────────────────────────
-- JSON: { situation, meaning, focus: { football, academics, physical, mindset } }
-- Snapshotted from the cell into the categorisation at score time (like
-- recommendation_md), so history is stable. Dashboard prefers this and falls
-- back to parsing recommendation_md when absent.
ALTER TABLE recommendation_cells ADD COLUMN structured_content TEXT;
ALTER TABLE categorisations      ADD COLUMN structured_content TEXT;
