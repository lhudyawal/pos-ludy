-- Add created_by column to stores table for ownership tracking
ALTER TABLE stores ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Create index for created_by
CREATE INDEX IF NOT EXISTS idx_stores_created_by ON stores(created_by);

-- Add salary settings to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS base_salary BIGINT DEFAULT 2200000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10;

-- Add created_by index for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_sales_id ON transactions(sales_id);