-- Idempotency flag so the Stage 2 "ready to score" advisor email fires exactly once
-- per profile, even if the parent re-uploads, deletes, or shuffles assessments.
ALTER TABLE parent_child_profiles
  ADD COLUMN IF NOT EXISTS notified_advisor_min_dataset_at TIMESTAMPTZ;
