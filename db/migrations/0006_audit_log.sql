-- Brief §8: every action on the platform must be logged with timestamp and user.
-- user_id is FK-soft (kept on user delete via SET NULL) so deleting a user does not
-- erase the audit trail. user_email is denormalised at write time so audit rows
-- remain interpretable even after the user row is gone.
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email   TEXT,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT,
  payload      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user     ON audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity   ON audit_log (entity_type, entity_id);
