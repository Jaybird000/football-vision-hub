-- Family/parent-level SOP answers, captured ONCE per parent and reused for every
-- child (client feedback 25 Jun 2026, item 4.a — "first ask family-related
-- questions, then ask about each kid separately"). The child-specific answers
-- still live denormalised on each parent_child_profiles.sop_responses row (so the
-- admin view, readiness, and dashboard summaries are unchanged); this table is the
-- source of truth for the shared family answers and lets the SOP wizard skip
-- re-asking them when a second child is added.
--
-- responses: JSON holding the family subset of SopResponses (q6,q7,q8,q9,q10).
-- Guarded reads/writes in src/server/intent.ts keep the app working pre-migration.

CREATE TABLE IF NOT EXISTS parent_family_responses (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  responses   TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
