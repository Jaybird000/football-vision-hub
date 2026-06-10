-- Module E: Stage 2 "I don't have these documents" → ask an IKF mentor for help.
-- A parent who is missing required assessments can request guidance; the mentor /
-- advisor is notified and responds within 48 hours. Conventions match 0001/0003:
-- TEXT uuid ids, TEXT ISO-8601 timestamps, JSON stored as TEXT.
--
-- One *open* request per profile at a time is enforced in the server fn
-- (src/server/stage2.ts), not the schema, because 'open' can recur after a
-- previous request is resolved.

CREATE TABLE IF NOT EXISTS mentor_assistance_requests (
  id            TEXT PRIMARY KEY DEFAULT (lower(
    hex(randomblob(4)) || '-' ||
    hex(randomblob(2)) || '-4' ||
    substr(hex(randomblob(2)), 2) || '-' ||
    substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' ||
    hex(randomblob(6))
  )),
  profile_id    TEXT NOT NULL REFERENCES parent_child_profiles(id) ON DELETE CASCADE,
  message       TEXT NOT NULL DEFAULT '',
  missing_keys  TEXT NOT NULL DEFAULT '[]',  -- JSON array of required assessment keys missing at request time
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resolved_at   TEXT,
  resolved_by   TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assist_profile ON mentor_assistance_requests (profile_id);
CREATE INDEX IF NOT EXISTS idx_assist_status  ON mentor_assistance_requests (status);
