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
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Get all sales with their target for the month
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        base_salary,
        sales_targets!left(id, month, target_amount, actual_amount, deduction_rate)
      `)
      .eq('role', 'sales')
      .eq('is_active', true);

    if (salesId) query = query.eq('id', salesId);

    const { data: salesUsers, error } = await query;

    if (error) throw error;

    // Calculate payroll for each sales
    const payrollData = await Promise.all(
      (salesUsers || []).map(async (sales) => {
        const target = sales.sales_targets?.[0];
        const targetAmount = target?.target_amount || 10000000;
        const actualAmount = target?.actual_amount || 0;
        const deductionRate = target?.deduction_rate || 10;
        const targetAchieved = actualAmount >= targetAmount;
        
        // Calculate deduction: deduction_rate% of shortfall
        const shortfall = targetAmount - actualAmount;
        const deduction = !targetAchieved && shortfall > 0 ? Math.floor(shortfall * (deductionRate / 100)) : 0;
        
        // Total pay: base salary - deduction
        const baseSalary = sales.base_salary || 2200000;
        const totalPay = baseSalary - deduction;

        return {
          id: target?.id || null,
          sales_id: sales.id,
          sales_name: sales.name,
          sales_email: sales.email,
          month,
          base_salary: baseSalary,
          deduction_rate: deductionRate,
          total_sales: actualAmount,
          target_amount: targetAmount,
          actual_amount: actualAmount,
          target_achieved: targetAchieved,
          shortfall: shortfall > 0 ? shortfall : 0,
          deduction,
          total_pay: totalPay,
          is_paid: target?.id ? false : false,
        };
      })
    );

    return NextResponse.json(payrollData);
  } catch (error) {
    console.error('GET /api/payroll/calculate error:', error);
    return NextResponse.json({ error: 'Failed to calculate payroll' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminOnly = await isAdmin();
    if (!adminOnly) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { sales_id, month, base_salary, target_amount, deduction_rate } = body;

    if (!sales_id || !month) {
      return NextResponse.json({ error: 'sales_id and month are required' }, { status: 400 });
    }

    // Upsert salary settings
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        base_salary: base_salary || 2200000,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sales_id);

    if (userError) throw userError;

    // Upsert sales target
    if (target_amount !== undefined) {
      const { error: targetError } = await supabaseAdmin
        .from('sales_targets')
        .upsert({
          sales_id,
          month,
          target_amount: target_amount || 10000000,
          deduction_rate: deduction_rate || 10,
          actual_amount: 0,
        }, { onConflict: 'sales_id,month' });

      if (targetError) throw targetError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/payroll/calculate error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}