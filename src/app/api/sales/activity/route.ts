import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

async function isAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    return user?.role === 'admin';
  } catch {
    return false;
  }
}

async function getUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    return user?.id || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salesId = searchParams.get('sales_id');
    const month = searchParams.get('month');
    
    const isAdminUser = await isAdmin();
    const currentUserId = await getUserId();

    if (!isAdminUser && !currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetSalesId = isAdminUser && salesId ? salesId : currentUserId;

    if (!targetSalesId) {
      return NextResponse.json({ error: 'sales_id required' }, { status: 400 });
    }

    let dateFilter = '';
    if (month) {
      dateFilter = month;
    }

    // Get all transactions for this sales in the month
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        store_id,
        total,
        payment_method,
        created_at,
        store:stores!store_id(id, name, address, owner_name)
      `)
      .eq('sales_id', targetSalesId)
      .gte('created_at', `${dateFilter || new Date().toISOString().slice(0, 7)}-01`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by store
    const storeActivityMap = new Map();
    
    for (const tx of (transactions || [])) {
      const store = tx.store as any;
      if (!store) continue;
      
      const storeId = store.id;
      if (!storeActivityMap.has(storeId)) {
        storeActivityMap.set(storeId, {
          store: { id: storeId, name: store.name, address: store.address, owner_name: store.owner_name },
          transactions: [],
          total_revenue: 0,
          transactions_count: 0,
        });
      }
      
      const storeActivity = storeActivityMap.get(storeId);
      storeActivity.transactions.push({
        id: tx.id,
        total: tx.total,
        payment_method: tx.payment_method,
        created_at: tx.created_at,
      });
      storeActivity.total_revenue += tx.total || 0;
      storeActivity.transactions_count += 1;
    }

    const result = Array.from(storeActivityMap.values())
      .sort((a: any, b: any) => b.total_revenue - a.total_revenue);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/sales/activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales activity' }, { status: 500 });
  }
}