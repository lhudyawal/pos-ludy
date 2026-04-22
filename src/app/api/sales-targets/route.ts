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
    const month = searchParams.get('month');
    const salesId = searchParams.get('sales_id');
    const isAdminUser = await isAdmin();
    const currentUserId = await getUserId();

    let query = supabaseAdmin
      .from('sales_targets')
      .select(`
        *,
        sales:users!sales_id(id, name, email)
      `)
      .order('month', { ascending: false });

    if (!isAdminUser && currentUserId) {
      query = query.eq('sales_id', currentUserId);
    }

    if (month) query = query.eq('month', month);
    if (salesId && isAdminUser) query = query.eq('sales_id', salesId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/sales-targets error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales targets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminOnly = await isAdmin();
    if (!adminOnly) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { sales_id, month, target_amount, deduction_rate } = body;

    if (!sales_id || !month || !target_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('sales_targets')
      .select('id')
      .eq('sales_id', sales_id)
      .eq('month', month)
      .single();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('sales_targets')
        .update({
          target_amount,
          deduction_rate: deduction_rate || 10,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabaseAdmin
      .from('sales_targets')
      .insert({
        sales_id,
        month,
        target_amount,
        deduction_rate: deduction_rate || 10,
        actual_amount: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/sales-targets error:', error);
    return NextResponse.json({ error: 'Failed to create sales target' }, { status: 500 });
  }
}