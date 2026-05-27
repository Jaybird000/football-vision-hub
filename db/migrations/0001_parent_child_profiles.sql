CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS parent_child_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name     TEXT NOT NULL,
  parent_email    TEXT NOT NULL,
  parent_phone    TEXT,
  child_name      TEXT NOT NULL,
  child_age       INTEGER NOT NULL CHECK (child_age BETWEEN 5 AND 25),
  child_gender    TEXT NOT NULL,
  answers         JSONB NOT NULL,
  readiness       TEXT NOT NULL CHECK (readiness IN ('high', 'medium', 'forming')),
  advisor_id      TEXT,
  stage           INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email     ON parent_child_profiles (parent_email);
CREATE INDEX IF NOT EXISTS idx_profiles_readiness ON parent_child_profiles (readiness);
CREATE INDEX IF NOT EXISTS idx_profiles_created   ON parent_child_profiles (created_at DESC);
