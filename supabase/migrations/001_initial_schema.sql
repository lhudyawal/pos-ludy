-- POS Ludy Sambel Pecel - Database Schema
-- Migration: Initial schema setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Linked to Clerk)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'sales')) DEFAULT 'sales',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    variant TEXT NOT NULL,
    price BIGINT NOT NULL CHECK (price >= 0),
    cost BIGINT NOT NULL CHECK (cost >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unit TEXT NOT NULL DEFAULT 'pcs',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STORES TABLE (Customer CRM)
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    owner_name TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    total_transactions INTEGER DEFAULT 0,
    lifetime_value BIGINT DEFAULT 0,
    last_visit TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_id UUID NOT NULL REFERENCES users(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    total BIGINT NOT NULL CHECK (total >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
    check_in_time TIMESTAMPTZ NOT NULL,
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(11, 8),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTION ITEMS TABLE (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
    subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALES TARGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_id UUID NOT NULL REFERENCES users(id),
    month TEXT NOT NULL,
    target_amount BIGINT NOT NULL CHECK (target_amount >= 0),
    target_quantity INTEGER NOT NULL CHECK (target_quantity >= 0),
    actual_amount BIGINT DEFAULT 0,
    actual_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sales_id, month)
);

-- ============================================
-- PAYROLL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_id UUID NOT NULL REFERENCES users(id),
    month TEXT NOT NULL,
    base_salary BIGINT NOT NULL DEFAULT 0,
    allowance BIGINT NOT NULL DEFAULT 0,
    commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    total_sales BIGINT DEFAULT 0,
    target_achieved BOOLEAN DEFAULT false,
    commission BIGINT DEFAULT 0,
    total_pay BIGINT DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sales_id, month)
);

-- ============================================
-- DAILY ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    stores_visited INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    activities TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sales_id, date)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_sales_id ON transactions(sales_id);
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_targets_sales_id ON sales_targets(sales_id);
CREATE INDEX IF NOT EXISTS idx_payroll_sales_id ON payroll(sales_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_sales_id ON daily_activities(sales_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

-- Users: Admin can manage all, users can read their own
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.jwt() ->> 'sub' = clerk_id);

CREATE POLICY "Admin can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
    );

-- Products: Everyone can read, admin can manage
CREATE POLICY "Everyone can read products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
    );

-- Stores: Everyone can read, admin can manage, sales can insert
CREATE POLICY "Everyone can read stores" ON stores
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage stores" ON stores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
    );

CREATE POLICY "Sales can insert stores" ON stores
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);

-- Transactions: Admin can read all, sales can CRUD their own
CREATE POLICY "Admin can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
        OR sales_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Sales can insert transactions" ON transactions
    FOR INSERT WITH CHECK (
        sales_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Sales can update their own transactions" ON transactions
    FOR UPDATE USING (
        sales_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Sales can delete their own transactions" ON transactions
    FOR DELETE USING (
        sales_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Transaction Items: Based on transaction access
CREATE POLICY "Users can manage transaction items" ON transaction_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM transactions t
            JOIN users u ON t.sales_id = u.id
            WHERE t.id = transaction_id 
            AND u.clerk_id = auth.jwt() ->> 'sub'
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
    );

-- Sales Targets: Admin can manage all, sales can view their own
CREATE POLICY "Admin can manage sales targets" ON sales_targets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
    );

CREATE POLICY "Sales can view their own targets" ON sales_targets
    FOR SELECT USING (
        sales_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Payroll: Admin can manage, sales can view their own
CREATE POLICY "Admin can manage payroll" ON payroll
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
    );

CREATE POLICY "Sales can view their own payroll" ON payroll
    FOR SELECT USING (
        sales_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Daily Activities: Admin can view all, sales can manage their own
CREATE POLICY "Admin can view all daily activities" ON daily_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub' 
            AND role = 'admin'
        )
    );

CREATE POLICY "Sales can manage their own activities" ON daily_activities
    FOR ALL USING (
        sales_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update store statistics after transaction
CREATE OR REPLACE FUNCTION update_store_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE stores
    SET 
        total_transactions = total_transactions + 1,
        lifetime_value = lifetime_value + NEW.total,
        last_visit = NOW(),
        updated_at = NOW()
    WHERE id = NEW.store_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for store stats update
CREATE OR REPLACE TRIGGER trigger_update_store_stats
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_store_stats();

-- Function to update daily activity after transaction
CREATE OR REPLACE FUNCTION update_daily_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_date DATE := DATE(NEW.created_at);
    v_sales_id UUID := NEW.sales_id;
    v_store_id UUID := NEW.store_id;
BEGIN
    INSERT INTO daily_activities (sales_id, date, stores_visited, total_transactions, total_revenue, activities)
    VALUES (v_sales_id, v_date, 1, 1, NEW.total, ARRAY['Transaksi ' || NEW.total::TEXT])
    ON CONFLICT (sales_id, date) DO UPDATE SET
        stores_visited = daily_activities.stores_visited + 1,
        total_transactions = daily_activities.total_transactions + 1,
        total_revenue = daily_activities.total_revenue + NEW.total,
        activities = array_append(daily_activities.activities, 'Transaksi ' || NEW.total::TEXT),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for daily activity update
CREATE OR REPLACE TRIGGER trigger_update_daily_activity
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_activity();

-- Function to update sales target actuals
CREATE OR REPLACE FUNCTION update_sales_target_actuals()
RETURNS TRIGGER AS $$
DECLARE
    v_month TEXT := TO_CHAR(NEW.created_at, 'YYYY-MM');
    v_sales_id UUID := NEW.sales_id;
BEGIN
    UPDATE sales_targets
    SET 
        actual_amount = actual_amount + NEW.total,
        actual_quantity = actual_quantity + (
            SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = NEW.id
        ),
        updated_at = NOW()
    WHERE sales_id = v_sales_id AND month = v_month;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sales target update
CREATE OR REPLACE TRIGGER trigger_update_sales_target
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_target_actuals();

-- ============================================
-- SEED DATA (Optional - for initial testing)
-- ============================================

-- Note: Seed data should be inserted after users are created in Clerk
-- These are template records that can be populated with real clerk_id
