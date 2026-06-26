-- Lets a parent record WHICH partner/provider produced the report they upload
-- (client feedback 25 Jun 2026, item 3.c — multiple partners assess on different
-- parameters; the parent selects the partner, then uploads that partner's report).
-- Nullable + additive: existing uploads predate provider capture. Reads/writes in
-- src/server/{stage2,stage3}.ts are .catch-guarded so the app runs before this
-- migration is applied (the provider is simply not stored/shown until then).

ALTER TABLE assessment_uploads ADD COLUMN provider_id TEXT REFERENCES providers(id);
