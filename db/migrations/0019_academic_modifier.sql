-- Academic profile acts as a MODIFIER within a category, not a separate axis
-- (IKF Categorisation IP, client feedback 25 Jun 2026 pages 2-3). The 3x3
-- Player-Potential x Parental-Capacity matrix is unchanged; the advisor can
-- additionally tag the academic profile, which shifts the recommendation's
-- weight/direction without creating new cells. Nullable + additive; reads/writes
-- in src/server/stage3.ts are .catch-guarded so the app runs pre-migration.

ALTER TABLE categorisations ADD COLUMN academic_modifier TEXT;  -- 'strong' | 'average' | 'developing' | null
