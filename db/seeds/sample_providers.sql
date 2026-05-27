-- Sample / placeholder providers for the 9 assessment templates.
-- Replace or remove these via /ikf360/admin/providers.
-- ON CONFLICT clause makes the seed idempotent (matches on name + assessment_key + url).

WITH seed_data (assessment_key, name, description, url, city, sort_order) AS (VALUES
  -- Football
  ('scouting',     'IKF Scout Network',          'Match-play evaluation across 3 sessions. Report in 10 days.',          'https://ikfsports.com/scouts',                'Pan-India', 10),
  ('scouting',     'Sample Scout Lab — Kolkata', 'Single-day on-pitch evaluation. Replace with a real partner.',          'https://ikfsports.com/scouts?city=kolkata',   'Kolkata',   20),
  ('technical',    'FootballTech India',         'Ball control, passing, finishing benchmarks. 5-day turnaround.',        'https://ikfsports.com/technical',             'Bengaluru', 10),
  ('technical',    'Sample Technical Partner',   'Placeholder — edit in admin to add your real provider.',                'https://ikfsports.com/technical',             NULL,        20),
  -- Mental
  ('psychometric', 'Mindlogic Sports',           'Sports-specific psychometric battery. Online assessment.',              'https://ikfsports.com/psychometric',          'Online',    10),
  ('psychology',   'Sportzminds Clinic',         '1:1 evaluation with registered sports psychologist.',                   'https://ikfsports.com/psychology',            'Mumbai',    10),
  -- Physical
  ('fitness',      'IKF Conditioning Hub',       'Strength, endurance, mobility profile. Report in 7 days.',              'https://ikfsports.com/fitness',               'Pan-India', 10),
  ('fitness',      'Sample Fitness Lab',         'Placeholder — replace with your local fitness partner.',                'https://ikfsports.com/fitness',               NULL,        20),
  ('nutrition',    'IKF Nutrition Network',      'Registered sports dietitian consultation + 4-week plan.',               'https://ikfsports.com/nutrition',             'Online',    10),
  -- Academic
  ('academic',     'Parent uploads directly',    'Most recent school report card. No provider needed — upload yourself.', 'https://ikfsports.com/academic-guide',        NULL,        10),
  ('aptitude',     'LearnPath Academy Testing',  'Learning style + academic aptitude profile.',                           'https://ikfsports.com/aptitude',              'Online',    10),
  -- Personality
  ('personality',  'Mindlogic Sports',           'Personality + interest mapping (separate from psychometric).',          'https://ikfsports.com/personality',           'Online',    10)
)
INSERT INTO providers (assessment_key, name, description, url, city, is_active, sort_order)
SELECT s.assessment_key, s.name, s.description, s.url, s.city, true, s.sort_order
FROM seed_data s
WHERE NOT EXISTS (
  SELECT 1 FROM providers p
  WHERE p.assessment_key = s.assessment_key
    AND p.name = s.name
    AND p.url = s.url
);
