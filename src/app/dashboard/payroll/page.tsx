'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { DollarSign, Calculator, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePayroll, useSales, useSalesTargets, useTransactions } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/converters';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Settings {
  base_salary: number;
  commission_rate: number;
  target_amount: number;
  actual_amount: number;
}

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const { payrolls, loading, refetch: refetchPayroll, updatePayroll } = usePayroll({ month: selectedMonth });
  const { sales } = useSales();
  const { targets } = useSalesTargets({ month: selectedMonth });
  const { transactions } = useTransactions({ limit: 500 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [salesSettings, setSalesSettings] = useState<Record<string, Settings>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const settings: Record<string, Settings> = {};
      for (const s of sales) {
        try {
          const data = await api.salary.getSettings(s.id);
          const target = targets.find((t: any) => t.sales_id === s.id);
          settings[s.id] = {
            base_salary: data?.base_salary || 2200000,
            commission_rate: data?.commission_rate || 10,
            target_amount: target?.target_amount || 10000000,
            actual_amount: target?.actual_amount || 0,
          };
        } catch {
          settings[s.id] = { base_salary: 2200000, commission_rate: 10, target_amount: 10000000, actual_amount: 0 };
        }
      }
      setSalesSettings(settings);
    };
    if (sales.length > 0) fetchSettings();
  }, [sales, targets]);

  const calculatePayroll = (salesId: string) => {
    const settings = salesSettings[salesId] || { base_salary: 2200000, commission_rate: 10, target_amount: 10000000, actual_amount: 0 };
    
    const totalSales = settings.actual_amount;
    const target = settings.target_amount;
    const targetAchieved = totalSales >= target;
    const commission = targetAchieved ? Math.floor(totalSales * (settings.commission_rate / 100)) : 0;
    const shortfall = target > totalSales ? target - totalSales : 0;
    const deduction = !targetAchieved && shortfall > 0 ? Math.floor(shortfall * 0.1) : 0;
    const totalPay = settings.base_salary + commission - deduction;

    return {
      baseSalary: settings.base_salary,
      commissionRate: settings.commission_rate,
      totalSales,
      target,
      targetAchieved,
      shortfall,
      deduction,
      commission,
      totalPay,
    };
  };

  const handleGeneratePayroll = async () => {
    for (const salesPerson of sales) {
      const calc = calculatePayroll(salesPerson.id);
      try {
        await updatePayroll(salesPerson.id, {
          sales_id: salesPerson.id,
          month: selectedMonth,
          base_salary: calc.baseSalary,
          commission_rate: calc.commissionRate,
          total_sales: calc.totalSales,
          target_achieved: calc.targetAchieved,
          commission: calc.commission,
          total_pay: calc.totalPay,
        });
      } catch (err) {
        console.error('Failed to generate payroll:', err);
      }
    }
    toast.success('Payroll berhasil dihitung');
  };

  const handleFinalizePayroll = async (payrollId: string) => {
    setUpdatingId(payrollId);
    try {
      await updatePayroll(payrollId, { id: payrollId, is_paid: true });
      toast.success('Payroll berhasil difinalisasi');
    } catch (error) {
      toast.error('Gagal memfinalisasi payroll');
    } finally {
      setUpdatingId(null);
    }
  };

  const allPayrolls = sales.map((salesPerson) => {
    const payroll = payrolls.find((p: any) => p.sales_id === salesPerson.id);
    const calc = calculatePayroll(salesPerson.id);
    return {
      ...salesPerson,
      payroll,
      ...calc,
    };
  });

  const totalPayroll = allPayrolls.reduce((sum, p) => sum + p.totalPay, 0);
  const totalCommission = allPayrolls.reduce((sum, p) => sum + p.commission, 0);
  const paidCount = payrolls.filter((p: any) => p.is_paid).length;

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistem Penggajian</h1>
          <p className="text-gray-600 mt-1">Kelola gaji dan komisi sales</p>
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
          <Button onClick={handleGeneratePayroll} className="bg-red-600 hover:bg-red-700">
            <Calculator className="w-4 h-4 mr-2" />
            Hitung Payroll
          </Button>
        </div>
      </div>

      {/* Payroll summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penggajian</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">{monthLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommission)}</div>
            <p className="text-xs text-muted-foreground">
              {allPayrolls.filter((p) => p.targetAchieved).length} sales dapat komisi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Pembayaran</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCount}/{allPayrolls.length}</div>
            <p className="text-xs text-muted-foreground">Sudah dibayar / Total sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Detail Penggajian per Sales
          </CardTitle>
          <CardDescription>
            Rincian gaji pokok, komisi, dan potongan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : allPayrolls.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calculator className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">Belum ada data sales</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPayrolls.map((payrollData) => (
                <div
                  key={payrollData.id}
                  className="p-6 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{payrollData.name}</h3>
                      <p className="text-sm text-gray-500">Periode: {monthLabel}</p>
                    </div>
                    <Badge
                      variant={payrollData.targetAchieved ? 'default' : 'secondary'}
                      className={
                        payrollData.targetAchieved
                          ? 'bg-green-600'
                          : 'bg-orange-600'
                      }
                    >
                      {payrollData.targetAchieved ? 'Target Tercapai' : 'Target Belum Tercapai'}
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <p className="text-sm text-gray-500">Gaji Pokok</p>
                      <p className="text-lg font-semibold">{formatCurrency(payrollData.baseSalary)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Target</p>
                      <p className="text-lg font-semibold">{formatCurrency(payrollData.target)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Komisi ({payrollData.commissionRate}%)</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(payrollData.commission)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Potongan (10%)</p>
                      <p className="text-lg font-semibold text-red-600">
                        -{formatCurrency(payrollData.deduction)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Penjualan</p>
                      <p className="text-lg font-semibold">{formatCurrency(payrollData.totalSales)}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Gaji</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(payrollData.totalPay)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleFinalizePayroll(payrollData.payroll?.id || payrollData.id)}
                      disabled={payrollData.payroll?.is_paid || updatingId === payrollData.payroll?.id}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {updatingId === payrollData.payroll?.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...
                        </>
                      ) : payrollData.payroll?.is_paid ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" /> Sudah Dikonfirmasi
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" /> Finalisasi
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission calculation info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Informasi Perhitungan Komisi
          </CardTitle>
          <CardDescription>
            Parameter komisi yang digunakan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Parameter Komisi</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Rate komisi: 2% dari total penjualan</li>
                <li>• Syarat: Target bulanan harus tercapai</li>
                <li>• Target: Rp10.000.000/bulan</li>
                <li>• Periode: Per bulan (dihitung otomatis)</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Contoh Perhitungan</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• Jika penjualan = Rp15.000.000 (target tercapai)</li>
                <li>• Komisi = 2% × Rp15.000.000 = Rp300.000</li>
                <li>• Total = Gaji Pokok + Tunjangan + Komisi</li>
                <li>• Total = Rp2.200.000 + Rp500.000 + Rp300.000</li>
                <li>• Total = Rp3.000.000</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll table */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Penggajian</CardTitle>
          <CardDescription>Tabel rekapitulasi gaji semua sales</CardDescription>
        </CardHeader>
        <CardContent>
          {allPayrolls.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="font-medium">Belum ada data</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales</TableHead>
                  <TableHead>Gaji Pokok</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Penjualan</TableHead>
                  <TableHead>Komisi</TableHead>
                  <TableHead>Potongan</TableHead>
                  <TableHead>Total Gaji</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPayrolls.map((payrollData) => (
                  <TableRow key={payrollData.id}>
                    <TableCell className="font-medium">{payrollData.name}</TableCell>
                    <TableCell>{formatCurrency(payrollData.baseSalary)}</TableCell>
                    <TableCell>{formatCurrency(payrollData.target)}</TableCell>
                    <TableCell>{formatCurrency(payrollData.totalSales)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(payrollData.commission)}
                    </TableCell>
                    <TableCell className="text-red-600">-{formatCurrency(payrollData.deduction)}</TableCell>
                    <TableCell className="font-bold text-red-600">
                      {formatCurrency(payrollData.totalPay)}
                    </TableCell>
                    <TableCell>
                      {payrollData.payroll?.is_paid ? (
                        <Badge className="bg-green-600">Dikonfirmasi</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
