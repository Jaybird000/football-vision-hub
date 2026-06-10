-- Stores the exact SOP option each parent chose (question id → chosen option
-- label), so admins see the real answer text instead of a score. The existing
-- `answers` column keeps the numeric scores (used for readiness + back-compat);
-- this is additive. Nullable — rows submitted before this migration only have
-- scores, and the admin view falls back to score-based reconstruction for them.

ALTER TABLE parent_child_profiles ADD COLUMN answer_choices TEXT;
