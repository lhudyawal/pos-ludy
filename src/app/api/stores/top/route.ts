/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'revenue';

    let data;

    if (type === 'revenue') {
      const { data: stores, error } = await supabaseAdmin
        .from('stores')
        .select('id, name, address, owner_name, total_transactions, lifetime_value, last_visit')
        .eq('is_active', true)
        .order('lifetime_value', { ascending: false })
        .limit(10);

      if (error) throw error;
      data = stores || [];
    } else {
      const { data: transactions, error } = await supabaseAdmin
        .from('transactions')
        .select('store_id, transaction_items(product_id, quantity, unit_price)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const storeProductMap = new Map();
      
      for (const tx of (transactions || [])) {
        const storeId = tx.store_id;
        if (!storeProductMap.has(storeId)) {
          storeProductMap.set(storeId, new Map());
        }
        const productMap = storeProductMap.get(storeId);
        
        for (const item of (tx.transaction_items || [])) {
          const productId = item.product_id;
          if (!productId) continue;
          
          const current = productMap.get(productId) || { product_id: productId, quantity: 0, revenue: 0 };
          current.quantity += item.quantity || 0;
          current.revenue += (item.quantity || 0) * (item.unit_price || 0);
          productMap.set(productId, current);
        }
      }

      const topStores = [];
      const storeIds = Array.from(storeProductMap.keys()).slice(0, 10);
      
      for (const storeId of storeIds) {
        const productMap = storeProductMap.get(storeId);
        const products = Array.from(productMap.values())
          .sort((a: any, b: any) => b.quantity - a.quantity)
          .slice(0, 5);

        const { data: store } = await supabaseAdmin
          .from('stores')
          .select('name')
          .eq('id', storeId)
          .single();

        topStores.push({
          store_id: storeId,
          store_name: store?.name || 'Unknown',
          top_products: products,
        });
      }

      data = topStores;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/stores/top error:', error);
    return NextResponse.json({ error: 'Failed to fetch top stores' }, { status: 500 });
  }
}