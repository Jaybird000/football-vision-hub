-- Password reset tokens (client feedback 30 Jun 2026 — "Forgot Password option is
-- missing"). A short-lived single-use token per request, emailed to the user as a
-- /reset-password?token=… link. Tokens are deleted-on-use (used_at set) and expire
-- after an hour. Cascades if the user is deleted. Reads/writes in src/server/auth.ts
-- are .catch-guarded so the app runs before this migration is applied.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_pwreset_user ON password_reset_tokens (user_id);
