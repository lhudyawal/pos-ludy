import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, phone } = body;

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (existingUser) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          name: name || null,
          email: email || null,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', clerkId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ exists: true, user: data });
    } else {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: clerkId,
          name: name || 'User',
          email: email || `${clerkId}@placeholder.com`,
          phone: phone || null,
          role: 'sales',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ exists: true, user: data }, { status: 201 });
    }
  } catch (error) {
    console.error('POST /api/users/sync error:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ exists: false, user: null });
    }

    if (error) throw error;

    return NextResponse.json({ exists: true, user: data });
  } catch (error) {
    console.error('GET /api/users/sync error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
