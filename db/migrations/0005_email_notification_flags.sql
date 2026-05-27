-- Idempotency flag so the Stage 2 "ready to score" advisor email fires exactly once
-- per profile, even if the parent re-uploads, deletes, or shuffles assessments.
-- SQLite has no "ADD COLUMN IF NOT EXISTS" — the migration runner only applies
-- each file once (tracked in _migrations table) so a plain ADD COLUMN is safe.
ALTER TABLE parent_child_profiles ADD COLUMN notified_advisor_min_dataset_at TEXT;
