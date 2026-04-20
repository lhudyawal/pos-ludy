/* eslint-disable @typescript-eslint/no-explicit-any */
import { Product, Store, Transaction } from '@/types';

const API_BASE = '/api';

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string | number | boolean | undefined> }
): Promise<T> {
  const { params, ...fetchOptions } = options || {};
  
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  products: {
    getAll: (params?: { is_active?: boolean }) => 
      fetchAPI<Product[]>('/products', { params }),
    getById: (id: string) => 
      fetchAPI<Product>(`/products/${id}`),
    create: (data: Partial<Product>) => 
      fetchAPI<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) => 
      fetchAPI<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => 
      fetchAPI<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
  },

  stores: {
    getAll: (params?: { is_active?: boolean }) => 
      fetchAPI<Store[]>('/stores', { params }),
    getById: (id: string) => 
      fetchAPI<Store>(`/stores/${id}`),
    create: (data: Partial<Store>) => 
      fetchAPI<Store>('/stores', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Store>) => 
      fetchAPI<Store>(`/stores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => 
      fetchAPI<{ success: boolean }>(`/stores/${id}`, { method: 'DELETE' }),
    getTop: (type?: 'revenue' | 'products') => 
      fetchAPI<any[]>(`/stores/top?type=${type || 'revenue'}`),
  },

  transactions: {
    getAll: (params?: { sales_id?: string; store_id?: string; limit?: number; offset?: number }) => 
      fetchAPI<{ data: Transaction[]; count: number }>('/transactions', { params }),
    getById: (id: string) => 
      fetchAPI<Transaction>(`/transactions/${id}`),
    create: (data: any) => 
      fetchAPI<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => 
      fetchAPI<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => 
      fetchAPI<{ success: boolean }>(`/transactions/${id}`, { method: 'DELETE' }),
    getStats: (params?: { start_date?: string; end_date?: string }) => 
      fetchAPI<any>('/transactions/stats/summary', { params }),
  },

  sales: {
    getAll: (params?: { role?: string; is_active?: boolean }) => 
      fetchAPI<any[]>('/sales', { params }),
    getById: (id: string) => 
      fetchAPI<any>(`/sales/${id}`),
    create: (data: any) => 
      fetchAPI<any>('/sales', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => 
      fetchAPI<any>(`/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getActivity: (salesId: string, month?: string) => 
      fetchAPI<any[]>(`/sales/activity?sales_id=${salesId}${month ? `&month=${month}` : ''}`),
  },

  users: {
    sync: (data?: { name?: string; email?: string; phone?: string }) => 
      fetchAPI<{ exists: boolean; user: any }>('/users/sync', { method: 'POST', body: JSON.stringify(data || {}) }),
    getCurrent: () => 
      fetchAPI<{ exists: boolean; user: any }>('/users/sync', { method: 'GET' }),
  },

  salesTargets: {
    getAll: (params?: { month?: string; sales_id?: string }) => 
      fetchAPI<any[]>('/sales-targets', { params }),
    create: (data: { sales_id: string; month: string; target_amount: number; target_quantity: number }) => 
      fetchAPI<any>('/sales-targets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => 
      fetchAPI<any>(`/sales-targets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  payroll: {
    getAll: (params?: { month?: string; sales_id?: string }) => 
      fetchAPI<any[]>('/payroll', { params }),
    getCalculate: (params?: { month?: string; sales_id?: string }) => 
      fetchAPI<any[]>('/payroll/calculate', { params }),
    create: (data: any) => 
      fetchAPI<any>('/payroll', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => 
      fetchAPI<any>(`/payroll/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  salary: {
    getSettings: async (salesId: string) => {
      try {
        return await fetchAPI<any>(`/salary/settings?sales_id=${salesId}`);
      } catch {
        return { base_salary: 2200000, commission_rate: 10 };
      }
    },
    updateSettings: (salesId: string, data: { base_salary?: number; commission_rate?: number }) => 
      fetchAPI<any>(`/salary/settings`, { method: 'PUT', body: JSON.stringify({ sales_id: salesId, ...data }) }),
  },

  dashboard: {
    getStats: () => fetchAPI<any>('/dashboard/stats'),
  },
};

export default api;