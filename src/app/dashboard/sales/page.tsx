'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  ShoppingCart,
  UserPlus,
  Loader2,
  MapPin,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSales, useTransactions } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/converters';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface SalesSettings {
  base_salary: number;
  commission_rate: number;
  target_amount: number;
  actual_amount: number;
}

export default function SalesListPage() {
  const { sales, loading: salesLoading, refetch: refetchSales, createSales } = useSales();
  const { transactions } = useTransactions({ limit: 100 });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [salesSettings, setSalesSettings] = useState<Record<string, SalesSettings>>({});
  const [newSales, setNewSales] = useState({
    name: '',
    email: '',
    phone: '',
    clerk_id: `clerk-${Date.now()}`,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const settings: Record<string, SalesSettings> = {};
      for (const s of sales) {
        try {
          const data = await api.salary.getSettings(s.id);
          const targets = await api.salesTargets.getAll({ sales_id: s.id });
          const currentMonth = new Date().toISOString().slice(0, 7);
          const target = targets.find((t: any) => t.month === currentMonth);
          settings[s.id] = {
            base_salary: data?.base_salary || 2200000,
            commission_rate: data?.commission_rate || 10,
            target_amount: target?.target_amount || 10000000,
            actual_amount: target?.actual_amount || 0,
          };
        } catch {
          settings[s.id] = {
            base_salary: 2200000,
            commission_rate: 10,
            target_amount: 10000000,
            actual_amount: 0,
          };
        }
      }
      setSalesSettings(settings);
    };
    if (sales.length > 0) fetchSettings();
  }, [sales]);

  const fetchActivity = async (salesId: string) => {
    setSelectedSalesId(salesId);
    setActivityLoading(true);
    setShowActivityDialog(true);
    try {
      const data = await api.sales.getActivity(salesId);
      setActivityData(data);
    } catch (error) {
      toast.error('Gagal memuat aktivitas');
    } finally {
      setActivityLoading(false);
    }
  };

  const getSalesStats = (salesId: string) => {
    const settings = salesSettings[salesId] || { base_salary: 2200000, commission_rate: 10, target_amount: 10000000, actual_amount: 0 };
    
    const salesTransactions = transactions.filter((t) => t.sales_id === salesId || t.salesId === salesId);
    const totalSales = salesTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = salesTransactions.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTransactions = salesTransactions.filter((t) => 
      (t.date || t.created_at || '').startsWith(todayStr)
    );
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const todayVisits = new Set(todayTransactions.map((t) => t.store_id || '')).size;

    const actualMonthly = settings.actual_amount || totalSales;
    const target = settings.target_amount;
    const targetAchieved = actualMonthly >= target;
    const shortfall = target > actualMonthly ? target - actualMonthly : 0;
    const deduction = !targetAchieved && shortfall > 0 ? Math.floor(shortfall * 0.1) : 0;
    const commission = targetAchieved ? Math.floor(actualMonthly * (settings.commission_rate / 100)) : 0;
    const expectedSalary = settings.base_salary + commission - deduction;

    return {
      totalSales,
      totalTransactions,
      todayRevenue,
      todayVisits,
      target,
      base_salary: settings.base_salary,
      expected_salary: expectedSalary,
      target_achieved: targetAchieved,
    };
  };

  const handleAddSales = async () => {
    if (!newSales.name || !newSales.email) {
      toast.error('Data tidak lengkap', {
        description: 'Nama dan email wajib diisi.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createSales({
        clerk_id: newSales.clerk_id,
        name: newSales.name,
        email: newSales.email,
        phone: newSales.phone,
      });
      setIsAddDialogOpen(false);
      setNewSales({ name: '', email: '', phone: '', clerk_id: `clerk-${Date.now()}` });
      toast.success('Sales baru berhasil ditambahkan');
    } catch (error) {
      toast.error('Gagal menambahkan sales');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Sales</h1>
          <p className="text-gray-600 mt-1">Manajemen dan monitoring performa sales</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Sales
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Sales Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi akun untuk personil sales baru.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input 
                  id="name" 
                  placeholder="Masukkan nama lengkap" 
                  value={newSales.name}
                  onChange={(e) => setNewSales({...newSales, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@ludy.com" 
                  value={newSales.email}
                  onChange={(e) => setNewSales({...newSales, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. WhatsApp</Label>
                <Input 
                  id="phone" 
                  placeholder="628123456789" 
                  value={newSales.phone}
                  onChange={(e) => setNewSales({...newSales, phone: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
              <Button 
                onClick={handleAddSales} 
                className="bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  'Simpan Personil'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sales cards */}
      {salesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      ) : sales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Belum ada sales</p>
            <p className="text-sm text-gray-500 mt-1">Tambahkan sales baru untuk memulai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sales.map((salesPerson) => {
            const stats = getSalesStats(salesPerson.id);
            const targetPercentage = stats.target > 0 ? (stats.totalSales / stats.target) * 100 : 0;

            return (
              <Card key={salesPerson.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-red-600" />
                    </div>
                    {salesPerson.name}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      {salesPerson.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {salesPerson.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {salesPerson.email}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Penjualan Bulan Ini</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(stats.totalSales)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Transaksi</p>
                      <p className="text-xl font-bold">{stats.totalTransactions}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Kunjungan Hari Ini</p>
                      <p className="text-xl font-bold">{stats.todayVisits} toko</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pendapatan Hari Ini</p>
                      <p className="text-xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
                    </div>
                  </div>

                  {/* Target & Salary */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Gaji Pokok</p>
                        <p className="font-medium">{formatCurrency(stats.base_salary)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gaji Diterima</p>
                        <p className={`font-medium ${stats.target_achieved ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(stats.expected_salary)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Target Progress</span>
                      <span className="text-sm text-gray-500">
                        {targetPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          targetPercentage >= 100
                            ? 'bg-green-600'
                            : targetPercentage >= 50
                            ? 'bg-orange-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.min(targetPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {targetPercentage.toFixed(1)}% tercapai
                    </p>
                  </div>

                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => fetchActivity(salesPerson.id)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Lihat Detail Aktivitas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sales transaction log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Log Transaksi Harian
          </CardTitle>
          <CardDescription>
            Aktivitas penjualan terbaru
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">Belum ada transaksi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Toko</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((trx) => (
                  <TableRow key={trx.id}>
                    <TableCell className="text-sm">
                      {new Date(trx.date || trx.created_at || '').toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{trx.salesName || trx.sales?.name || 'Sales'}</TableCell>
                    <TableCell>{trx.storeName || trx.store?.name || 'Toko'}</TableCell>
                    <TableCell>{(trx.items || trx.transaction_items || []).length} produk</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(trx.total)}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Aktivitas Sales</DialogTitle>
            <DialogDescription>
              Toko yang dikunjungi dan transaksi per toko
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : activityData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activityData.map((storeActivity: any) => (
                  <Card key={storeActivity.store?.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {storeActivity.store?.name}
                      </CardTitle>
                      <CardDescription>
                        {storeActivity.store?.address}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Transaksi</p>
                          <p className="font-medium">{storeActivity.transactions_count} transaksi</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Pendapatan</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency(storeActivity.total_revenue)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Riwayat Transaksi:</p>
                        <div className="space-y-1">
                          {storeActivity.transactions?.slice(0, 5).map((trx: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span>{new Date(trx.created_at).toLocaleDateString('id-ID')}</span>
                              <span className="font-medium">{formatCurrency(trx.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
