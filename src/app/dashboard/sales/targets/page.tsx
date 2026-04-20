'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Users, Target, Plus, Edit, Loader2 } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useSalesTargets, useSales, useTransactions } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/converters';
import { toast } from 'sonner';

export default function SalesTargetsPage() {
  const { targets, loading: targetsLoading, refetch: refetchTargets, createTarget } = useSalesTargets();
  const { sales, loading: salesLoading } = useSales();
  const { transactions } = useTransactions({ limit: 500 });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newTarget, setNewTarget] = useState({
    sales_id: '',
    month: new Date().toISOString().slice(0, 7),
    target_amount: '',
    target_quantity: '',
  });

  const getSalesPerformance = (salesId: string, month: string) => {
    const salesTransactions = transactions.filter((t) => {
      const txDate = (t.date || t.created_at || '').substring(0, 7);
      const txSalesId = t.sales_id || t.salesId;
      return txSalesId === salesId && txDate === month;
    });
    
    const totalAmount = salesTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalQuantity = salesTransactions.reduce((sum, t) => {
      const items = t.items || t.transaction_items || [];
      return sum + items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
    }, 0);
    
    return { totalAmount, totalQuantity };
  };

  const handleAddTarget = async () => {
    if (!newTarget.sales_id || !newTarget.target_amount || !newTarget.target_quantity) {
      toast.error('Data tidak lengkap');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTarget({
        sales_id: newTarget.sales_id,
        month: newTarget.month,
        target_amount: parseInt(newTarget.target_amount),
        target_quantity: parseInt(newTarget.target_quantity),
      });
      setIsAddOpen(false);
      setNewTarget({
        sales_id: '',
        month: new Date().toISOString().slice(0, 7),
        target_amount: '',
        target_quantity: '',
      });
      toast.success('Target berhasil ditambahkan');
    } catch (error) {
      toast.error('Gagal menambahkan target');
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthlyTargets = targets.filter((t) => t.month === selectedMonth);

  const allSalesWithTargets = sales.map((salesPerson) => {
    const target = monthlyTargets.find((t) => t.sales_id === salesPerson.id);
    const performance = getSalesPerformance(salesPerson.id, selectedMonth);
    return {
      ...salesPerson,
      target,
      performance,
    };
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Target Penjualan</h1>
          <p className="text-gray-600 mt-1">Tetapkan dan pantau target sales bulanan</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3].map((i) => {
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
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Tetapkan Target
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tetapkan Target Baru</DialogTitle>
                <DialogDescription>Input target penjualan bulanan untuk sales</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="sales">Sales</Label>
                  <Select value={newTarget.sales_id} onValueChange={(v) => setNewTarget({ ...newTarget, sales_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Sales" />
                    </SelectTrigger>
                    <SelectContent>
                      {sales.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="month">Bulan</Label>
                  <Input 
                    id="month" 
                    type="month" 
                    value={newTarget.month}
                    onChange={(e) => setNewTarget({ ...newTarget, month: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="targetAmount">Target Nominal (Rp)</Label>
                    <Input 
                      id="targetAmount" 
                      type="number" 
                      placeholder="10000000"
                      value={newTarget.target_amount}
                      onChange={(e) => setNewTarget({ ...newTarget, target_amount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetQuantity">Target Kuantitas (pcs)</Label>
                    <Input 
                      id="targetQuantity" 
                      type="number" 
                      placeholder="500"
                      value={newTarget.target_quantity}
                      onChange={(e) => setNewTarget({ ...newTarget, target_quantity: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddTarget} className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    'Simpan Target'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sales performance overview */}
      {targetsLoading || salesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      ) : allSalesWithTargets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Belum ada data sales</p>
            <p className="text-sm text-gray-500 mt-1">Tambahkan sales terlebih dahulu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {allSalesWithTargets.map((salesData) => {
            const targetAmount = salesData.target?.target_amount || 0;
            const targetQuantity = salesData.target?.target_quantity || 0;
            const amountPercentage = targetAmount > 0
              ? Math.min((salesData.performance.totalAmount / targetAmount) * 100, 100)
              : 0;
            const quantityPercentage = targetQuantity > 0
              ? Math.min((salesData.performance.totalQuantity / targetQuantity) * 100, 100)
              : 0;

            return (
              <Card key={salesData.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {salesData.name}
                    </span>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {salesData.target ? (
                      <>Periode: {new Date(salesData.target.month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</>
                    ) : (
                      <span className="text-orange-600">Belum ada target</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Amount target */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Target Nominal</span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(salesData.performance.totalAmount)} / {formatCurrency(targetAmount)}
                      </span>
                    </div>
                    <Progress value={amountPercentage} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {amountPercentage.toFixed(1)}% tercapai
                    </p>
                  </div>

                  {/* Quantity target */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Target Kuantitas</span>
                      <span className="text-sm text-gray-500">
                        {salesData.performance.totalQuantity} / {targetQuantity} pcs
                      </span>
                    </div>
                    <Progress value={quantityPercentage} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {quantityPercentage.toFixed(1)}% tercapai
                    </p>
                  </div>

                  {/* Gap analysis */}
                  {salesData.target && (
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Kurang Nominal</p>
                          <p className="text-lg font-semibold text-red-600">
                            {formatCurrency(Math.max(0, targetAmount - salesData.performance.totalAmount))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Kurang Kuantitas</p>
                          <p className="text-lg font-semibold text-red-600">
                            {Math.max(0, targetQuantity - salesData.performance.totalQuantity)} pcs
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Target summary table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Ringkasan Target {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <CardDescription>
            Monitoring pencapaian semua sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allSalesWithTargets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">Belum ada data</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales</TableHead>
                  <TableHead>Target Nominal</TableHead>
                  <TableHead>Realisasi</TableHead>
                  <TableHead>Pencapaian</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSalesWithTargets.map((salesData) => {
                  const targetAmount = salesData.target?.target_amount || 0;
                  const percentage = targetAmount > 0
                    ? (salesData.performance.totalAmount / targetAmount) * 100
                    : 0;
                  return (
                    <TableRow key={salesData.id}>
                      <TableCell className="font-medium">{salesData.name}</TableCell>
                      <TableCell>{formatCurrency(targetAmount)}</TableCell>
                      <TableCell>{formatCurrency(salesData.performance.totalAmount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(percentage, 100)} className="h-2 w-20" />
                          <span className="text-sm">{percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {salesData.target ? (
                          percentage >= 100 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Tercapai ✓
                            </span>
                          ) : percentage >= 50 ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              Dalam Proses
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              Perlu Effort
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Tanpa Target
                          </span>
                        )}
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
