'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { FileText, DollarSign, TrendingUp, Download, Loader2, Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTransactions, useProducts } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/converters';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const { transactions, loading: transactionsLoading } = useTransactions({ limit: 500 });
  const { products, loading: productsLoading } = useProducts();

  const filteredTransactions = transactions.filter((t) => {
    const txDate = (t.date || t.created_at || '').substring(0, 7);
    return txDate === selectedMonth;
  });

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalCost = filteredTransactions.reduce((sum, t) => {
    const items = t.items || t.transaction_items || [];
    return sum + items.reduce((itemSum: number, item: any) => {
      const product = products.find((p) => p.id === (item.product_id || item.product?.id));
      return itemSum + (product?.cost || 0) * (item.quantity || 0);
    }, 0);
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const productSales = products.map((product) => {
    const sold = filteredTransactions.reduce((sum, t) => {
      const items = t.items || t.transaction_items || [];
      return sum + items.reduce((itemSum: number, item: any) => {
        return itemSum + ((item.product_id || item.product?.id) === product.id ? (item.quantity || 0) : 0);
      }, 0);
    }, 0);
    const revenue = filteredTransactions.reduce((sum, t) => {
      const items = t.items || t.transaction_items || [];
      return sum + items.reduce((itemSum: number, item: any) => {
        return itemSum + ((item.product_id || item.product?.id) === product.id ? (item.subtotal || 0) : 0);
      }, 0);
    }, 0);
    return { product, sold, revenue };
  }).filter((item) => item.sold > 0);

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const loading = transactionsLoading || productsLoading;

  const handleExportPDF = () => {
    toast.success('Fitur export PDF akan segera hadir');
  };

  const handleExportExcel = () => {
    const csv = [
      ['Tanggal', 'Sales', 'Toko', 'Total', 'Metode'],
      ...filteredTransactions.map((t) => [
        new Date(t.date || t.created_at || '').toLocaleDateString('id-ID'),
        t.salesName || t.sales?.name || 'Sales',
        t.storeName || t.store?.name || 'Toko',
        t.total,
        t.paymentMethod || t.payment_method || 'cash',
      ]),
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV berhasil');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-600 mt-1">Centralized reporting dan analisis</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = date.toISOString().slice(0, 7);
                return (
                  <SelectItem key={value} value={value}>
                    {new Date(value + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{monthLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">HPP produk terjual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Kotor</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">{monthLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Laba</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Gross margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Sales Log - Aktivitas Penjualan
          </CardTitle>
          <CardDescription>
            Log transaksi lengkap dengan detail sales dan toko
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">Belum ada transaksi</p>
              <p className="text-sm">Tidak ada transaksi untuk periode ini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Toko</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((trx) => {
                  const items = trx.items || trx.transaction_items || [];
                  return (
                    <TableRow key={trx.id}>
                      <TableCell className="text-sm">
                        {new Date(trx.date || trx.created_at || '').toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="font-medium">{trx.salesName || trx.sales?.name || 'Sales'}</TableCell>
                      <TableCell>{trx.storeName || trx.store?.name || 'Toko'}</TableCell>
                      <TableCell>
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            {item.product?.name || 'Produk'}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        {items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(trx.total)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (trx.paymentMethod || trx.payment_method) === 'cash'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {(trx.paymentMethod || trx.payment_method) === 'cash' ? 'Tunai' : 'Transfer'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Product performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performa Produk</CardTitle>
          <CardDescription>Penjualan per produk</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : productSales.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="font-medium">Belum ada data penjualan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Varian</TableHead>
                  <TableHead>Terjual</TableHead>
                  <TableHead>Pendapatan</TableHead>
                  <TableHead>Harga Modal</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSales.map(({ product, sold, revenue }) => {
                  const margin = product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{product.variant}</TableCell>
                      <TableCell>{sold} pcs</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(revenue)}</TableCell>
                      <TableCell>{formatCurrency(product.cost)}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">{margin.toFixed(0)}%</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
