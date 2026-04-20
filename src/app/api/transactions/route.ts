import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

async function getUserRole(): Promise<{ role: string; clerkId: string | null; userId: string | null }> {
  try {
    const { userId } = await auth();
    if (!userId) return { role: '', clerkId: null, userId: null };

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    return { role: user?.role || 'sales', clerkId: userId, userId: user?.id || null };
  } catch {
    return { role: '', clerkId: null, userId: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { role, userId } = await getUserRole();
    const { searchParams } = new URL(request.url);
    const salesId = searchParams.get('sales_id');
    const storeId = searchParams.get('store_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('transactions')
      .select(`
        *,
        sales:users!sales_id(id, name, email),
        store:stores!store_id(id, name, address),
        transaction_items (
          *,
          product:products!product_id(id, name, variant, unit)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply role-based filtering
    if (role !== 'admin' && userId) {
      // Sales can only see their own transactions
      query = query.eq('sales_id', userId);
    } else if (salesId) {
      query = query.eq('sales_id', salesId);
    }

    if (storeId) query = query.eq('store_id', storeId);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, userId: supabaseUserId } = await getUserRole();
    const body = await request.json();
    const { store_id, items, payment_method, check_in_time, check_in_latitude, check_in_longitude, notes } = body;

    // Use sales_id from authenticated user, not from request body
    const sales_id = supabaseUserId;

    if (!sales_id || !store_id || !items || items.length === 0 || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!sales_id) {
      return NextResponse.json({ error: 'Unauthorized - user not found' }, { status: 401 });
    }

    const total = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sales_id,
        store_id,
        total,
        payment_method,
        check_in_time: check_in_time || new Date().toISOString(),
        check_in_latitude,
        check_in_longitude,
        notes,
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    const transactionItems = items.map((item: { product_id: string; quantity: number; unit_price: number; subtotal: number }) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('transaction_items')
      .insert(transactionItems);

    if (itemsError) throw itemsError;

    const { data: fullTransaction } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        sales:users!sales_id(id, name, email),
        store:stores!store_id(id, name, address),
        transaction_items (
          *,
          product:products!product_id(id, name, variant, unit, price)
        )
      `)
      .eq('id', transaction.id)
      .single();

    return NextResponse.json(fullTransaction, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}