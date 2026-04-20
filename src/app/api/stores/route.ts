import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
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
    const isActive = searchParams.get('is_active') !== 'false';

    if (role === 'admin' || role === '') {
      const { data, error } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('is_active', isActive)
        .order('lifetime_value', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Sales only sees stores they created
      const { data, error } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('is_active', isActive)
        .eq('created_by', userId)
        .order('lifetime_value', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('GET /api/stores error:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, clerkId } = await getUserRole();
    const body = await request.json();
    const { name, address, phone, owner_name, latitude, longitude } = body;

    if (!name || !address) {
      return NextResponse.json({ error: 'Name and address are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('stores')
      .insert({
        name,
        address,
        phone,
        owner_name,
        latitude,
        longitude,
        created_by: clerkId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/stores error:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}