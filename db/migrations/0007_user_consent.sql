-- Brief §8 (data privacy): record explicit parent consent at signup, plus the
-- privacy-policy version they agreed to so a future material change can prompt
-- re-consent without losing the original record.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS consented_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version   TEXT;
