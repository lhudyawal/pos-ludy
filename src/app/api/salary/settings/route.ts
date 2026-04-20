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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salesId = searchParams.get('sales_id');

    if (!salesId) {
      return NextResponse.json({ error: 'sales_id required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, base_salary, commission_rate')
      .eq('id', salesId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ base_salary: 2200000, commission_rate: 10 });
      }
      console.error('Salary settings fetch error:', error);
      return NextResponse.json({ base_salary: 2200000, commission_rate: 10 });
    }

    return NextResponse.json(data || { base_salary: 2200000, commission_rate: 10 });
  } catch (error) {
    console.error('GET /api/salary/settings error:', error);
    return NextResponse.json({ base_salary: 2200000, commission_rate: 10 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminOnly = await isAdmin();
    if (!adminOnly) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { sales_id, base_salary, commission_rate } = body;

    if (!sales_id) {
      return NextResponse.json({ error: 'sales_id required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        base_salary: base_salary || 2200000,
        commission_rate: commission_rate || 10,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sales_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/salary/settings error:', error);
    return NextResponse.json({ error: 'Failed to update salary settings' }, { status: 500 });
  }
}