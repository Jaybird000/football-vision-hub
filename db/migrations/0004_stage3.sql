-- Stage 3: Categorisation & Recommendation
-- Fully dynamic, admin-defined: axes, values per axis, recommendation cells
-- (one per axis-value cross-product), snapshot-on-score categorisations.

CREATE TABLE IF NOT EXISTS categorisation_axes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categorisation_axis_values (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  axis_id      UUID NOT NULL REFERENCES categorisation_axes(id) ON DELETE CASCADE,
  key          TEXT NOT NULL,
  label        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (axis_id, key)
);

CREATE INDEX IF NOT EXISTS idx_axis_values_axis ON categorisation_axis_values (axis_id, sort_order);

-- Cells: one per axis-value cross-product. cell_key is deterministic from sorted (axis_key:value_key)
-- e.g. "parent_capacity:aligned|player_potential:high"
CREATE TABLE IF NOT EXISTS recommendation_cells (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_key          TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL DEFAULT '',
  recommendation_md TEXT NOT NULL DEFAULT '',
  is_published      BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per scoring event. Snapshots cell + values so future edits don't change history.
CREATE TABLE IF NOT EXISTS categorisations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES parent_child_profiles(id) ON DELETE CASCADE,
  cell_key          TEXT NOT NULL,
  axis_values       JSONB NOT NULL,            -- [{ axis_key, axis_name, value_key, value_label }, ...]
  recommendation_md TEXT NOT NULL,             -- snapshot of cell text at scoring time
  cell_title        TEXT NOT NULL DEFAULT '',  -- snapshot of cell title at scoring time
  advisor_notes     TEXT NOT NULL DEFAULT '',
  scored_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  scored_by_name    TEXT NOT NULL DEFAULT '',  -- snapshot of advisor name
  scored_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until       TIMESTAMPTZ,
  is_current        BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_cat_profile_current ON categorisations (profile_id) WHERE is_current;
CREATE INDEX IF NOT EXISTS idx_cat_scored_at      ON categorisations (scored_at DESC);

-- Seed: the 2 axes + 3 values each from the Concept Document (admin can edit/rename/add)
INSERT INTO categorisation_axes (key, name, description, sort_order) VALUES
  ('player_potential', 'Player Potential', 'Where the child sits in terms of football potential and developmental trajectory.', 10),
  ('parent_capacity',  'Parent Capacity & Intent', 'How aligned the parent is and what they can sustain over a long journey.',     20)
ON CONFLICT (key) DO NOTHING;

INSERT INTO categorisation_axis_values (axis_id, key, label, description, sort_order)
SELECT a.id, v.key, v.label, v.description, v.sort_order
FROM categorisation_axes a
JOIN (VALUES
  ('player_potential', 'high',        'High potential',             'Strong trajectory across football and academic dimensions.', 10),
  ('player_potential', 'developing',  'Developing',                 'Showing promise; trajectory not yet clear.',                  20),
  ('player_potential', 'uncertain',   'Uncertain',                  'Too early or inconsistent to assess meaningfully.',           30),
  ('parent_capacity',  'aligned',     'Aligned & Sustained',        'Intent is clear; capacity matches commitment.',               10),
  ('parent_capacity',  'aspirational','Aspirational but Constrained','Strong intent; financial / geographic / time capacity is limited.', 20),
  ('parent_capacity',  'disengaged',  'Disengaged or Unclear',      'Intent is vague, inconsistent, or absent.',                   30)
) AS v(axis_key, key, label, description, sort_order) ON v.axis_key = a.key
ON CONFLICT (axis_id, key) DO NOTHING;
