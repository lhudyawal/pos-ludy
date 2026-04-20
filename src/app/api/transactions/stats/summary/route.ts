import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabaseAdmin
      .from('transactions')
      .select(`
        id,
        total,
        payment_method,
        created_at,
        sales:users!sales_id(id, name),
        store:stores!store_id(id, name)
      `)
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      totalTransactions: data?.length || 0,
      totalRevenue: data?.reduce((sum, t) => sum + (t.total || 0), 0) || 0,
      cashTransactions: data?.filter(t => t.payment_method === 'cash').length || 0,
      transferTransactions: data?.filter(t => t.payment_method === 'transfer').length || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('GET /api/transactions/stats/summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
