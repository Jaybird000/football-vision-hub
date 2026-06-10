-- Module H: per-provider report charge (₹), so parents can compare costs across
-- the providers listed for an assessment. Whole rupees, nullable (not every
-- provider publishes a price). Reads/writes in src/server/{admin,stage2}.ts are
-- written to tolerate this column being absent until the migration is applied.

ALTER TABLE providers ADD COLUMN charge_inr INTEGER;
