-- Update sales_targets table schema
-- Remove target_quantity and actual_quantity, add deduction_rate

ALTER TABLE sales_targets DROP COLUMN IF EXISTS target_quantity;
ALTER TABLE sales_targets DROP COLUMN IF EXISTS actual_quantity;

ALTER TABLE sales_targets ADD COLUMN IF NOT EXISTS deduction_rate DECIMAL(5, 2) NOT NULL DEFAULT 10;

COMMENT ON COLUMN sales_targets.deduction_rate IS 'Persentase potongan jika target tidak terpenuhi (default 10%)';
