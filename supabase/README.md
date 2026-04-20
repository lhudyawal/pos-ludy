# Supabase Migration Guide

## Prerequisites

1. Supabase CLI installed (`npm install -g supabase`)
2. Supabase project created at [supabase.com](https://supabase.com)
3. Environment variables configured in `.env.local`

## Steps to Run Migration

### Option 1: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push

# Or run migrations locally
supabase db reset
```

### Option 2: Using SQL Editor in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run**

## Verify Migration

After running the migration, verify by checking the Tables in Supabase:
- [x] users
- [x] products
- [x] stores
- [x] transactions
- [x] transactions_items
- [x] sales_targets
- [x] payroll
- [x] daily_activities

## Seed Initial Data (Optional)

### Add Sample Products

```sql
INSERT INTO products (name, variant, price, cost, stock, unit) VALUES
('Sambel Pecel Original', 'Level 1 - Tidak Pedas', 15000, 8000, 150, 'pcs'),
('Sambel Pecel Sedang', 'Level 2 - Sedang', 15000, 8000, 200, 'pcs'),
('Sambel Pecel Pedas', 'Level 3 - Pedas', 15000, 8000, 180, 'pcs'),
('Sambel Pecel Extra Pedas', 'Level 4 - Extra Pedas', 18000, 9000, 120, 'pcs'),
('Sambel Pecel Gila', 'Level 5 - Super Pedas', 20000, 10000, 90, 'pcs'),
('Pecel Komplit', 'Paket Komplit', 25000, 12000, 100, 'pcs');
```

### Add Sample Stores

```sql
INSERT INTO stores (name, address, phone, owner_name, latitude, longitude) VALUES
('Warung Bu Sari', 'Jl. Merdeka No. 12, Jakarta Selatan', '081111111111', 'Bu Sari', -6.2294, 106.8295),
('Toko Makmur Jaya', 'Jl. Sudirman No. 45, Jakarta Pusat', '081222222222', 'Pak Harto', -6.2088, 106.8219),
('Warung Berkah', 'Jl. Gatot Subroto No. 78, Jakarta Selatan', '081333333333', 'Bu Dewi', -6.2186, 106.8023);
```

## Environment Variables Required

Make sure your `.env.local` contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Next Steps

1. Update frontend to use the new API endpoints
2. Integrate Clerk user sync with Supabase users table
3. Test the full POS flow (check-in → add items → checkout)
