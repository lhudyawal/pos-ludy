// User types
export type UserRole = 'admin' | 'sales';

export interface User {
  id: string;
  clerk_id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy fields
  avatar?: string;
}

// Legacy User for mock data compatibility
export interface LegacyUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

// Product & Inventory types
export interface Product {
  id: string;
  name: string;
  variant: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  image_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  image?: string; // Legacy field
}

// Store CRM types
export interface Store {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  owner_name?: string | null;
  total_transactions?: number;
  lifetime_value?: number;
  last_visit?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy fields
  ownerName?: string;
  totalTransactions?: number;
  lifetimeValue?: number;
  lastVisit?: string;
}

// Sales & Transaction types
export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
  created_at: string;
}

export interface Transaction {
  id: string;
  // Database fields
  sales_id?: string;
  store_id?: string;
  total: number;
  payment_method?: 'cash' | 'transfer';
  check_in_time?: string;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  sales?: Pick<User, 'id' | 'name' | 'email'>;
  store?: Pick<Store, 'id' | 'name' | 'address'>;
  transaction_items?: TransactionItem[];
  // Legacy fields
  date?: string;
  salesId?: string;
  salesName?: string;
  storeName?: string;
  items?: CartItem[];
  paymentMethod?: 'cash' | 'transfer';
  checkInTime?: string;
  checkInLocation?: { latitude: number; longitude: number };
}

// Sales Target & Performance types
export interface SalesTarget {
  id: string;
  sales_id: string;
  salesName?: string;
  month: string;
  target_amount: number;
  deduction_rate?: number;
  actual_amount: number;
  created_at?: string;
  updated_at?: string;
  // Legacy fields
  salesId?: string;
  targetAmount?: number;
  actualAmount?: number;
}

// Payroll types
export interface Payroll {
  id: string;
  sales_id: string;
  salesName?: string;
  month: string;
  base_salary: number;
  allowance: number;
  commission_rate: number;
  total_sales: number;
  target_achieved: boolean;
  commission: number;
  total_pay: number;
  is_paid?: boolean;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Legacy fields
  salesId?: string;
  baseSalary?: number;
  commissionRate?: number;
  targetAchieved?: boolean;
  totalPay?: number;
}

// Daily Activity types
export interface DailyActivity {
  id: string;
  sales_id: string;
  salesName?: string;
  date: string;
  stores_visited: number;
  total_transactions: number;
  total_revenue: number;
  activities: string[];
  created_at?: string;
  updated_at?: string;
  // Legacy fields
  salesId?: string;
  storesVisited?: number;
  totalTransactions?: number;
  totalRevenue?: number;
}

// Dashboard stats
export interface DashboardStats {
  totalProducts: number;
  totalStores: number;
  totalSales: number;
  totalTransactions: number;
  todayRevenue: number;
  monthRevenue: number;
  activeSales: number;
  visitsToday: number;
  recentTransactions?: Transaction[];
  topProducts?: { name: string; stock: number }[];
  topStores?: { name: string; lifetime_value: number }[];
  dailySales?: { name: string; revenue: number; transactions: number }[];
}

// Legacy DashboardStats for mock compatibility
export interface LegacyDashboardStats {
  totalSales: number;
  totalTransactions: number;
  totalStores: number;
  totalProducts: number;
  todayRevenue: number;
  monthRevenue: number;
  activeSales: number;
  visitsToday: number;
}

// Re-export legacy types for mock data
export type LegacyProduct = Product;
export type LegacyStore = Store;
export type LegacyTransaction = Transaction;
export type LegacySalesTarget = SalesTarget;
export type LegacyPayroll = Payroll;
export type LegacyDailyActivity = DailyActivity;
