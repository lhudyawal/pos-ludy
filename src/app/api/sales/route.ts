import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('is_active') !== 'false';

    let query = supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', isActive)
      .order('name', { ascending: true });

    if (role) query = query.eq('role', role);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/sales error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerk_id, name, email, role, phone, avatar_url } = body;

    if (!clerk_id || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id,
        name,
        email,
        role: role || 'sales',
        phone,
        avatar_url,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/sales error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
