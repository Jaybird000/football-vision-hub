-- Multi-child support: one parent account can now own several child profiles.
--
-- Until now the link was one-directional (users.profile_id → the single profile).
-- We add the reverse ownership link on the profile and backfill it from the
-- existing users.profile_id, then repurpose users.profile_id as the parent's
-- *currently-selected/active* child pointer (still set on SOP submit, updated by
-- setActiveChild). Legacy rows with a NULL user_id stay reachable via the old
-- users.profile_id link, so the app keeps working before this migration runs.
--
-- Additive + nullable, same convention as 0010–0013: reads/writes in
-- src/server/{intent,stage2,stage3}.ts are .catch-guarded with a single-child
-- fallback so nothing breaks until this is applied to D1.

ALTER TABLE parent_child_profiles ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- Backfill the owning parent from the existing one-way users.profile_id link.
UPDATE parent_child_profiles
   SET user_id = (SELECT u.id FROM users u WHERE u.profile_id = parent_child_profiles.id)
 WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_user ON parent_child_profiles (user_id);
