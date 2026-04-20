'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { Transaction, Product, Store, LegacyTransaction, User } from '@/types';
import { dbTransactionToLocal, dbProductToLocal, dbStoreToLocal } from '@/lib/converters';

export function useCurrentUser() {
  const { user, isLoaded } = useUser();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const syncUser = useCallback(async () => {
    if (!user || syncing) return;
    
    setSyncing(true);
    try {
      const result = await api.users.sync({
        name: user.fullName || user.username || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        phone: user.primaryPhoneNumber?.phoneNumber || '',
      });
      setCurrentUser(result.user);
    } catch (error) {
      console.error('Failed to sync user:', error);
    } finally {
      setSyncing(false);
    }
  }, [user, syncing]);

  useEffect(() => {
    if (isLoaded && user) {
      syncUser();
    }
  }, [isLoaded, user, syncUser]);

  return { user: currentUser || user, loading: !isLoaded || syncing, refetch: syncUser };
}

export function useProducts(isActive = true) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.products.getAll({ is_active: isActive });
      setProducts(data.map((p: any) => dbProductToLocal(p)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [isActive]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useStores(isActive = true) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.stores.getAll({ is_active: isActive });
      setStores(data.map((s: any) => dbStoreToLocal(s)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  }, [isActive]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return { stores, loading, error, refetch: fetchStores };
}

export function useTransactions(params?: { sales_id?: string; store_id?: string; limit?: number; offset?: number }) {
  const [transactions, setTransactions] = useState<LegacyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsKey = params ? JSON.stringify(params) : 'all';

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.transactions.getAll(params);
      setTransactions(result.data.map((t: any) => dbTransactionToLocal(t) as unknown as LegacyTransaction));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (data: {
    sales_id: string;
    store_id: string;
    items: { product_id: string; quantity: number; unit_price: number; subtotal: number }[];
    payment_method: 'cash' | 'transfer';
    check_in_time?: string;
    check_in_latitude?: number;
    check_in_longitude?: number;
  }) => {
    try {
      const result = await api.transactions.create(data);
      await fetchTransactions();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      await api.transactions.update(id, data);
      await fetchTransactions();
    } catch (err) {
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.transactions.delete(id);
      await fetchTransactions();
    } catch (err) {
      throw err;
    }
  };

  return { transactions, loading, error, refetch: fetchTransactions, createTransaction, updateTransaction, deleteTransaction };
}

export function useSales() {
  const [sales, setSales] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.sales.getAll({ role: 'sales' });
      setSales(data as any);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const createSales = async (data: { clerk_id: string; name: string; email: string; phone?: string }) => {
    try {
      const result = await api.sales.create(data);
      await fetchSales();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateSales = async (id: string, data: Partial<User>) => {
    try {
      await api.sales.update(id, data);
      await fetchSales();
    } catch (err) {
      throw err;
    }
  };

  return { sales, loading, error, refetch: fetchSales, createSales, updateSales };
}

export function useSalesTargets(params?: { month?: string; sales_id?: string }) {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.salesTargets.getAll(params);
      setTargets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  }, [params ? JSON.stringify(params) : 'all']);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const createTarget = async (data: { sales_id: string; month: string; target_amount: number; target_quantity: number }) => {
    try {
      await api.salesTargets.create(data);
      await fetchTargets();
    } catch (err) {
      throw err;
    }
  };

  return { targets, loading, error, refetch: fetchTargets, createTarget };
}

export function usePayroll(params?: { month?: string; sales_id?: string }) {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.payroll.getAll(params);
      setPayrolls(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payroll');
    } finally {
      setLoading(false);
    }
  }, [params ? JSON.stringify(params) : 'all']);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const createPayroll = async (data: any) => {
    try {
      await api.payroll.create(data);
      await fetchPayrolls();
    } catch (err) {
      throw err;
    }
  };

  const updatePayroll = async (id: string, data: any) => {
    try {
      await api.payroll.update(id, data);
      await fetchPayrolls();
    } catch (err) {
      throw err;
    }
  };

  return { payrolls, loading, error, refetch: fetchPayrolls, createPayroll, updatePayroll };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.dashboard.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function useUserRole() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<'admin' | 'sales' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/users/sync');
        const data = await response.json();
        
        if (data.user?.role) {
          setRole(data.user.role);
        } else {
          setRole('sales');
        }
      } catch {
        setRole('sales');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchRole();
    }
  }, [user, isLoaded]);

  const isAdmin = role === 'admin';
  const isSales = role === 'sales';

  return { role, isAdmin, isSales, loading };
}
