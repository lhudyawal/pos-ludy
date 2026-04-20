import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const salesId = searchParams.get('sales_id');

    let query = supabaseAdmin
      .from('payroll')
      .select(`
        *,
        sales:users!sales_id(id, name, email)
      `)
      .order('month', { ascending: false });

    if (month) query = query.eq('month', month);
    if (salesId) query = query.eq('sales_id', salesId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/payroll error:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sales_id, month, base_salary, allowance, commission_rate, total_sales, target_achieved, commission, total_pay } = body;

    if (!sales_id || !month) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('payroll')
      .select('id')
      .eq('sales_id', sales_id)
      .eq('month', month)
      .single();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('payroll')
        .update({
          base_salary,
          allowance,
          commission_rate,
          total_sales,
          target_achieved,
          commission,
          total_pay,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabaseAdmin
      .from('payroll')
      .insert({
        sales_id,
        month,
        base_salary: base_salary || 2200000,
        allowance: allowance || 500000,
        commission_rate: commission_rate || 2,
        total_sales: total_sales || 0,
        target_achieved: target_achieved || false,
        commission: commission || 0,
        total_pay: total_pay || (base_salary || 2200000) + (allowance || 500000),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/payroll error:', error);
    return NextResponse.json({ error: 'Failed to create payroll' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_paid, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Payroll ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
    
    if (is_paid !== undefined) {
      updateData.is_paid = is_paid;
      updateData.paid_at = is_paid ? new Date().toISOString() : null;
    }

    const { data, error } = await supabaseAdmin
      .from('payroll')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/payroll error:', error);
    return NextResponse.json({ error: 'Failed to update payroll' }, { status: 500 });
  }
}
