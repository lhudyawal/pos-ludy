import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (storeError) throw storeError;

    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        transaction_items (
          *,
          products (*)
        )
      `)
      .eq('store_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ ...store, recent_transactions: transactions || [] });
  } catch (error) {
    console.error('GET /api/stores/[id] error:', error);
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
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
      .from('stores')
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
    console.error('PUT /api/stores/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('stores')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/stores/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
}
