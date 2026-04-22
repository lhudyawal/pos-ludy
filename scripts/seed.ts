import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedProducts() {
  console.log('Seeding products...');
  
  const products = [
    { name: 'Sambel Pecel Ludy', variant: '250ml', price: 15000, cost: 8000, stock: 100, unit: 'botol' },
    { name: 'Sambel Pecel Ludy', variant: '500ml', price: 25000, cost: 14000, stock: 50, unit: 'botol' },
    { name: 'Sambel Pecel Ludy', variant: '1000ml', price: 45000, cost: 25000, stock: 30, unit: 'botol' },
    { name: 'Sambel Bawang Ludy', variant: '250ml', price: 12000, cost: 6500, stock: 80, unit: 'botol' },
    { name: 'Sambel Bawang Ludy', variant: '500ml', price: 20000, cost: 11000, stock: 40, unit: 'botol' },
    { name: 'Sambel Terasi Ludy', variant: '250ml', price: 14000, cost: 7500, stock: 60, unit: 'botol' },
    { name: 'Kacang Ludy', variant: '500gr', price: 18000, cost: 10000, stock: 45, unit: 'pouch' },
    { name: 'Kacang Ludy', variant: '1000gr', price: 32000, cost: 18000, stock: 25, unit: 'pouch' },
  ];

  const { error } = await supabase.from('products').insert(products);
  
  if (error) {
    console.error('Error seeding products:', error);
    return false;
  }
  
  console.log(`Seeded ${products.length} products`);
  return true;
}

async function seedStores() {
  console.log('Seeding stores...');
  
  const stores = [
    { name: 'Warung Bu Siti', address: 'Jl. Raya Solo No. 15, Kartasura', phone: '081234567890', owner_name: 'Bu Siti' },
    { name: 'Toko Maju Jaya', address: 'Jl. Ahmad Yani No. 42, Surakarta', phone: '081234567891', owner_name: 'Pak Budi' },
    { name: 'Warung Makan Bersama', address: 'Jl. Slamet Riyadi No. 8, Laweyan', phone: '081234567892', owner_name: 'Ibu Ratna' },
    { name: 'Minimarket Serba Ada', address: 'Jl. Ir. Sutami No. 25, Jebres', phone: '081234567893', owner_name: 'Pak Herman' },
    { name: 'Kedai Kopi Nusantara', address: 'Jl. Dr. Rajiman No. 3, Pasarkliwon', phone: '081234567894', owner_name: 'Pak Jono' },
    { name: 'Warung Mbak Yuni', address: 'Jl. Kolonel Sutarto No. 17, Kestalan', phone: '081234567895', owner_name: 'Mbak Yuni' },
    { name: 'Toko Sumber Rejeki', address: 'Jl. Setyabudi No. 88, Gilingan', phone: '081234567896', owner_name: 'Pak Slamet' },
    { name: 'Warung makan 24', address: 'Jl. Garuda Mas No. 5, Baluwarti', phone: '081234567897', owner_name: 'Ibu Susi' },
  ];

  const { error } = await supabase.from('stores').insert(stores);
  
  if (error) {
    console.error('Error seeding stores:', error);
    return false;
  }
  
  console.log(`Seeded ${stores.length} stores`);
  return true;
}

async function seedAdminUser() {
  console.log('Seeding admin user...');
  
  const adminUser = {
    clerk_id: 'admin_clerk_id_placeholder',
    name: 'Admin Ludy',
    email: 'admin@ludy.com',
    role: 'admin',
    phone: '081234567800',
    is_active: true,
  };

  const { error } = await supabase.from('users').upsert(adminUser, { onConflict: 'clerk_id' });
  
  if (error) {
    console.error('Error seeding admin user:', error);
    return false;
  }
  
  console.log('Seeded admin user');
  return true;
}

async function seedDemoSales() {
  console.log('Seeding demo sales users...');
  
  const salesUsers = [
    {
      clerk_id: 'demo_sales_1',
      name: 'Ahmad Fauzi',
      email: 'ahmad@ludy.com',
      role: 'sales',
      phone: '081234567801',
      is_active: true,
    },
    {
      clerk_id: 'demo_sales_2',
      name: 'Dewi Lestari',
      email: 'dewi@ludy.com',
      role: 'sales',
      phone: '081234567802',
      is_active: true,
    },
    {
      clerk_id: 'demo_sales_3',
      name: 'Budi Santoso',
      email: 'budi@ludy.com',
      role: 'sales',
      phone: '081234567803',
      is_active: true,
    },
  ];

  const { error } = await supabase.from('users').upsert(salesUsers, { onConflict: 'clerk_id' });
  
  if (error) {
    console.error('Error seeding sales users:', error);
    return false;
  }
  
  console.log(`Seeded ${salesUsers.length} sales users`);
  return true;
}

async function seedSalesTargets() {
  console.log('Seeding sales targets...');
  
  const { data: users } = await supabase.from('users').select('id, role').eq('role', 'sales');
  
  if (!users || users.length === 0) {
    console.log('No sales users found, skipping targets');
    return true;
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const targets = users.map(user => ({
    sales_id: user.id,
    month: currentMonth,
    target_amount: 5000000,
    deduction_rate: 10,
    actual_amount: 0,
  }));

  const { error } = await supabase.from('sales_targets').upsert(targets, { onConflict: 'sales_id, month' });
  
  if (error) {
    console.error('Error seeding targets:', error);
    return false;
  }
  
  console.log(`Seeded ${targets.length} sales targets`);
  return true;
}

async function main() {
  console.log('Starting seed data process...\n');
  
  const results = await Promise.all([
    seedProducts(),
    seedStores(),
    seedAdminUser(),
    seedDemoSales(),
    seedSalesTargets(),
  ]);

  const allSuccess = results.every(r => r);
  
  if (allSuccess) {
    console.log('\n✓ All seed data inserted successfully!');
  } else {
    console.log('\n✗ Some seed data failed to insert');
    process.exit(1);
  }
}

main().catch(console.error);
