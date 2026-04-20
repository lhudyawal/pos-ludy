'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TrendingUp,
  ShoppingCart,
  Store,
  Package,
  Users,
  DollarSign,
  MapPin,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useDashboardStats } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/converters';
import { mockDashboardStats, mockTransactions, mockProducts, mockStores } from '@/data/mock';

const COLORS = ['#DC2626', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'];

const defaultSalesData = [
  { name: 'Sen', revenue: 450000, transactions: 3 },
  { name: 'Sel', revenue: 520000, transactions: 4 },
  { name: 'Rab', revenue: 380000, transactions: 2 },
  { name: 'Kam', revenue: 610000, transactions: 5 },
  { name: 'Jum', revenue: 720000, transactions: 6 },
  { name: 'Sab', revenue: 890000, transactions: 7 },
  { name: 'Min', revenue: 650000, transactions: 5 },
];

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();

  const statsData = stats || mockDashboardStats;
  const salesData = stats?.dailySales || defaultSalesData;
  const recentTransactions = stats?.recentTransactions?.length 
    ? stats.recentTransactions 
    : mockTransactions;
  const topProducts = stats?.topProducts 
    ? stats.topProducts 
    : mockProducts.slice(0, 6).map((p) => ({
        name: p.name.split(' ').slice(0, 2).join(' '),
        stock: p.stock,
      }));
  const topStores = stats?.topStores 
    ? stats.topStores.map((s: { name: string; lifetime_value: number }) => ({
        name: s.name.split(' ').slice(0, 2).join(' '),
        value: s.lifetime_value,
      }))
    : mockStores.slice(0, 5).map((s) => ({
        name: s.name.split(' ').slice(0, 2).join(' '),
        value: s.lifetimeValue || 0,
      }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          {loading ? 'Memuat...' : 'Selamat datang di POS Ludy Sambel Pecel'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statsData.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +12.5% dari kemarin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statsData.monthRevenue)}</div>
            <p className="text-xs text-muted-foreground">Target: {formatCurrency(20000000)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +5 hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kunjungan Hari Ini</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.visitsToday}</div>
            <p className="text-xs text-muted-foreground">Sales aktif: {statsData.activeSales}</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Toko</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalStores}</div>
            <p className="text-xs text-muted-foreground">Toko aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Varian tersedia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.activeSales}</div>
            <p className="text-xs text-muted-foreground">Sedang bertugas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Penjualan Mingguan</CardTitle>
            <CardDescription>Pendapatan 7 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tren Transaksi</CardTitle>
            <CardDescription>Jumlah transaksi harian</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stok Produk</CardTitle>
            <CardDescription>Ketersediaan produk saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performa Toko</CardTitle>
            <CardDescription>Customer Lifetime Value</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topStores}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topStores.map((entry: { name: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terbaru</CardTitle>
          <CardDescription>5 transaksi terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.slice(0, 5).map((trx: any) => (
              <div
                key={trx.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{trx.storeName || trx.store?.name || 'Toko'}</p>
                    <p className="text-sm text-gray-500">
                      {trx.salesName || trx.sales?.name || 'Sales'} • {new Date(trx.date || trx.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(trx.total)}</p>
                  <p className="text-sm text-gray-500">
                    {(trx.paymentMethod || trx.payment_method) === 'cash' ? 'Tunai' : 'Transfer'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
