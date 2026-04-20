import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          name: string;
          email: string;
          role: 'admin' | 'sales';
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          variant: string;
          price: number;
          cost: number;
          stock: number;
          unit: string;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      stores: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string | null;
          owner_name: string | null;
          latitude: number | null;
          longitude: number | null;
          total_transactions: number;
          lifetime_value: number;
          last_visit: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stores']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['stores']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          sales_id: string;
          store_id: string;
          total: number;
          payment_method: 'cash' | 'transfer';
          check_in_time: string;
          check_in_latitude: number | null;
          check_in_longitude: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transaction_items']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['transaction_items']['Insert']>;
      };
      sales_targets: {
        Row: {
          id: string;
          sales_id: string;
          month: string;
          target_amount: number;
          target_quantity: number;
          actual_amount: number;
          actual_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sales_targets']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['sales_targets']['Insert']>;
      };
      payroll: {
        Row: {
          id: string;
          sales_id: string;
          month: string;
          base_salary: number;
          allowance: number;
          commission_rate: number;
          total_sales: number;
          target_achieved: boolean;
          commission: number;
          total_pay: number;
          is_paid: boolean;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payroll']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['payroll']['Insert']>;
      };
      daily_activities: {
        Row: {
          id: string;
          sales_id: string;
          date: string;
          stores_visited: number;
          total_transactions: number;
          total_revenue: number;
          activities: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_activities']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['daily_activities']['Insert']>;
      };
    };
  };
};
