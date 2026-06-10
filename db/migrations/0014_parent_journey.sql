-- Parent Journey SOP (replaces the legacy 8-question Stage 1 intent).
--
-- The new SOP collects 4 sections / 11 questions with shapes the old numeric
-- `answers` map can't hold (multi-select, a conditional follow-up, free text,
-- a "prefer not to say"). We keep the existing `answers` column populated with
-- the DERIVED per-question scores (so readiness stays reproducible and the
-- NOT NULL constraint is satisfied) and store the full structured responses in
-- the new `sop_responses` JSON column. Nullable + additive — legacy rows keep
-- their old `answers`/`answer_choices` and the admin view falls back to the
-- 8-question renderer for them. Reads/writes in src/server/{intent,stage3}.ts
-- are .catch-guarded so the app runs before this migration is applied (same
-- convention as 0010–0013).

ALTER TABLE parent_child_profiles ADD COLUMN sop_responses TEXT;

-- One in-progress draft per parent user, so the SOP can autosave and the parent
-- can pause and return. Consumed (deleted) on final submit. Cascades if the
-- user is deleted.
CREATE TABLE IF NOT EXISTS parent_sop_drafts (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  responses   TEXT NOT NULL,
  section     INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
