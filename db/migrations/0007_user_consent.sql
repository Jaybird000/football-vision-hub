-- Brief §8 (data privacy): record explicit parent consent at signup, plus the
-- privacy-policy version they agreed to so a future material change can prompt
-- re-consent without losing the original record.
ALTER TABLE users ADD COLUMN consented_at TEXT;
ALTER TABLE users ADD COLUMN consent_version TEXT;
