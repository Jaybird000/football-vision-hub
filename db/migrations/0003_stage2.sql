-- Stage 2: Deep Assessment
-- - 9 assessment templates (admin toggles which are required)
-- - Providers (admin-curated, parents click through)
-- - Uploaded files (one row per assessment per profile; overwrite on re-upload)

CREATE TABLE IF NOT EXISTS assessment_templates (
  key           TEXT PRIMARY KEY,
  category      TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  required      INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS providers (
  id             TEXT PRIMARY KEY DEFAULT (uuid()),
  assessment_key TEXT NOT NULL REFERENCES assessment_templates(key) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  url            TEXT NOT NULL,
  city           TEXT,
  is_active      INTEGER NOT NULL DEFAULT 1,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_providers_assessment ON providers (assessment_key);
CREATE INDEX IF NOT EXISTS idx_providers_active     ON providers (is_active);

CREATE TABLE IF NOT EXISTS assessment_uploads (
  id              TEXT PRIMARY KEY DEFAULT (uuid()),
  profile_id      TEXT NOT NULL REFERENCES parent_child_profiles(id) ON DELETE CASCADE,
  assessment_key  TEXT NOT NULL REFERENCES assessment_templates(key),
  file_name       TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  file_size       INTEGER NOT NULL,
  mime_type       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','verified','rejected')),
  uploaded_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  uploaded_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TEXT,
  reviewed_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (profile_id, assessment_key)
);

CREATE INDEX IF NOT EXISTS idx_uploads_profile ON assessment_uploads (profile_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status  ON assessment_uploads (status);

-- Seed the 9 default assessment templates from the Platform Brief.
-- Admin can toggle `required` afterwards.
INSERT INTO assessment_templates (key, category, title, description, required, sort_order) VALUES
  ('scouting',     'Football',    'Scouting Report',              'Match-play observation across multiple sessions.',     1, 10),
  ('technical',    'Football',    'Technical Skill Assessment',   'Ball control, passing, finishing, positional awareness.', 1, 20),
  ('psychometric', 'Mental',      'Psychometric Analysis',        'Resilience, focus, competitive temperament.',          1, 30),
  ('psychology',   'Mental',      'Psychology Evaluation',        '1:1 evaluation by a registered sports psychologist.',  0, 40),
  ('fitness',      'Physical',    'Strength & Conditioning',      'Strength, endurance, mobility and recovery profile.',  1, 50),
  ('nutrition',    'Physical',    'Nutrition Assessment',         'Dietary patterns, deficiencies, sports nutrition plan.', 0, 60),
  ('academic',     'Academic',    'School Academic Record',       'Most recent academic transcript or report card.',      1, 70),
  ('aptitude',     'Academic',    'Learning & Aptitude Profile',  'Learning style and academic aptitude testing.',        0, 80),
  ('personality',  'Personality', 'Personality & Interest Map',   'Character traits and interests beyond the pitch.',     0, 90)
ON CONFLICT (key) DO NOTHING;
