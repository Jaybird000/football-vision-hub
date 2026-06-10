-- Adds the parent's city to the Parent SOP so admins can filter profiles by city
-- (BRD Module F). Nullable — existing rows predate collection. Reads/writes in
-- src/server/{intent,admin,stage3}.ts tolerate this column being absent until the
-- migration is applied (the city is simply not stored / shown).

ALTER TABLE parent_child_profiles ADD COLUMN city TEXT;
