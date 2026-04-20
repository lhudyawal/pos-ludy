import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfMonth = todayStr.substring(0, 7) + '-01';
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];

    const [
      productsCount,
      storesCount,
      salesCount,
      todayTransactions,
      monthTransactions,
      weekTransactions,
      activeSales,
      todayVisits,
    ] = await Promise.all([
      supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('stores').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'sales').eq('is_active', true),
      supabaseAdmin.from('transactions').select('id, total').gte('created_at', todayStr),
      supabaseAdmin.from('transactions').select('id, total').gte('created_at', startOfMonth),
      supabaseAdmin.from('transactions').select('id, total, created_at').gte('created_at', startOfWeek),
      supabaseAdmin.from('daily_activities').select('sales_id', { count: 'exact' }).gte('date', todayStr),
      supabaseAdmin.from('daily_activities').select('*').gte('date', todayStr),
    ]);

    const todayRevenue = todayTransactions.data?.reduce((sum, t) => sum + t.total, 0) || 0;
    const monthRevenue = monthTransactions.data?.reduce((sum, t) => sum + t.total, 0) || 0;

    const { data: recentTransactions } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        total,
        payment_method,
        created_at,
        sales:users!sales_id(name),
        store:stores!store_id(name)
      `)
      .gte('created_at', todayStr)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: topProducts } = await supabaseAdmin
      .from('transaction_items')
      .select(`
        quantity,
        product:products!product_id(name)
      `)
      .gte('created_at', startOfMonth);

    const productSales = topProducts?.reduce((acc, item) => {
      const name = (item.product as unknown as { name: string })?.name || 'Unknown';
      acc[name] = (acc[name] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>) || {};

    const topProductsList = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, stock]) => ({ name, stock }));

    const { data: topStores } = await supabaseAdmin
      .from('stores')
      .select('name, lifetime_value')
      .eq('is_active', true)
      .order('lifetime_value', { ascending: false })
      .limit(5);

    const dailySales = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((name, index) => {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - (6 - index));
      const dayStr = dayStart.toISOString().split('T')[0];
      const dayTransactions = weekTransactions.data?.filter(t => 
        t.created_at?.startsWith(dayStr)
      ) || [];
      return {
        name,
        revenue: dayTransactions.reduce((sum, t) => sum + t.total, 0),
        transactions: dayTransactions.length,
      };
    });

    return NextResponse.json({
      totalProducts: productsCount.count || 0,
      totalStores: storesCount.count || 0,
      totalSales: salesCount.count || 0,
      totalTransactions: monthTransactions.count || 0,
      todayRevenue,
      monthRevenue,
      activeSales: activeSales.data?.length || 0,
      visitsToday: todayVisits.data?.reduce((sum, a) => sum + (a.stores_visited || 0), 0) || 0,
      recentTransactions: recentTransactions || [],
      topProducts: topProductsList,
      topStores: topStores || [],
      dailySales,
    });
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
