-- Upload section redesign (client feedback 30 Jun 2026). Each assessment gets its
-- own page with context + a partner choice that distinguishes INTEGRATED partners
-- (auto-fetch via API — stubbed/"coming soon", no partner API exists yet) from
-- NON-INTEGRATED partners (parent uploads manually in an IKF predefined format).
--
--   providers.integration_type   — 'integrated' | 'manual' (default 'manual')
--   assessment_templates.format_url  — link to the IKF predefined format to download
--   assessment_templates.context_md  — richer "what is this / why it matters" copy
--
-- All additive + nullable; reads/writes in src/server/{stage2,admin}.ts are
-- .catch-guarded so the app runs before this migration is applied.

ALTER TABLE providers ADD COLUMN integration_type TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE assessment_templates ADD COLUMN format_url TEXT;
ALTER TABLE assessment_templates ADD COLUMN context_md TEXT;
