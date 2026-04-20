/* eslint-disable @typescript-eslint/no-explicit-any */
import { Product, Store, Transaction, CartItem } from '@/types';

export function formatCurrency(amount: number): string {
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function dbProductToLocal(product: any): Product {
  return {
    id: product.id,
    name: product.name,
    variant: product.variant,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    unit: product.unit,
    image_url: product.image_url,
    is_active: product.is_active ?? true,
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

export function dbStoreToLocal(store: any): Store {
  return {
    id: store.id,
    name: store.name,
    address: store.address,
    phone: store.phone,
    latitude: store.latitude,
    longitude: store.longitude,
    owner_name: store.owner_name,
    total_transactions: store.total_transactions ?? 0,
    lifetime_value: store.lifetime_value ?? 0,
    last_visit: store.last_visit,
    is_active: store.is_active ?? true,
    created_at: store.created_at,
    updated_at: store.updated_at,
  };
}

export function dbTransactionToLocal(tx: any): Transaction {
  return {
    id: tx.id,
    date: tx.created_at,
    sales_id: tx.sales_id,
    salesName: tx.sales?.name || 'Unknown',
    store_id: tx.store_id,
    storeName: tx.store?.name || 'Unknown',
    items: (tx.transaction_items || []).map((item: any): CartItem => ({
      product: dbProductToLocal(item.product || { 
        id: item.product_id, 
        name: 'Unknown', 
        variant: '',
        price: item.unit_price,
        cost: 0,
        stock: 0,
        unit: '',
        is_active: true,
        created_at: '',
        updated_at: ''
      }),
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    total: tx.total,
    payment_method: tx.payment_method,
    paymentMethod: tx.payment_method,
    check_in_time: tx.check_in_time,
    checkInTime: tx.check_in_time,
    checkInLocation: tx.check_in_latitude && tx.check_in_longitude 
      ? { latitude: tx.check_in_latitude, longitude: tx.check_in_longitude }
      : undefined,
  };
}

export function localProductToDb(product: Product) {
  return {
    name: product.name,
    variant: product.variant,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    unit: product.unit,
    image_url: product.image_url,
  };
}

export function localStoreToDb(store: Store) {
  return {
    name: store.name,
    address: store.address,
    phone: store.phone,
    owner_name: store.owner_name,
    latitude: store.latitude,
    longitude: store.longitude,
  };
}

export function localCartToDbItems(cart: { product: Product; quantity: number; subtotal: number }[]) {
  return cart.map(item => ({
    product_id: item.product.id,
    quantity: item.quantity,
    unit_price: item.product.price,
    subtotal: item.subtotal,
  }));
}
