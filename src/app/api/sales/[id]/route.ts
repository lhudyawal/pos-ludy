import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError) throw userError;

    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = today.substring(0, 7) + '-01';

    const [todayStats, monthStats] = await Promise.all([
      supabaseAdmin
        .from('transactions')
        .select('id, total')
        .eq('sales_id', id)
        .gte('created_at', today),
      supabaseAdmin
        .from('transactions')
        .select('id, total')
        .eq('sales_id', id)
        .gte('created_at', startOfMonth),
    ]);

    const { data: targets } = await supabaseAdmin
      .from('sales_targets')
      .select('*')
      .eq('sales_id', id)
      .gte('month', startOfMonth.substring(0, 7))
      .single();

    const { data: activities } = await supabaseAdmin
      .from('daily_activities')
      .select('*')
      .eq('sales_id', id)
      .gte('date', today)
      .single();

    return NextResponse.json({
      ...user,
      stats: {
        todayRevenue: todayStats.data?.reduce((sum, t) => sum + t.total, 0) || 0,
        todayTransactions: todayStats.data?.length || 0,
        monthRevenue: monthStats.data?.reduce((sum, t) => sum + t.total, 0) || 0,
        monthTransactions: monthStats.data?.length || 0,
        visitsToday: activities?.stores_visited || 0,
      },
      currentTarget: targets,
    });
  } catch (error) {
    console.error('GET /api/sales/[id] error:', error);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/sales/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
