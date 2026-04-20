'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  Target,
  DollarSign,
  Loader2,
  Save
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSales, useUserRole } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/converters';
import { toast } from 'sonner';

export default function SalaryTargetPage() {
  const { sales, loading: salesLoading, refetch } = useSales();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [selectedSales, setSelectedSales] = useState<string>('');
  const [salarySettings, setSalarySettings] = useState({
    base_salary: 2200000,
    commission_rate: 10,
    target_amount: 10000000,
    target_quantity: 100,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Akses ditolak. Hanya admin yang dapat mengakses halaman ini.');
    }
  }, [roleLoading, isAdmin]);

  const handleOpenDialog = async (salesId: string) => {
    setSelectedSales(salesId);
    setIsDialogOpen(true);
    
    try {
      const settings = await api.salary.getSettings(salesId);
      const targets = await api.salesTargets.getAll({ sales_id: salesId });
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentTarget = targets.find((t: any) => t.month === currentMonth);
      
      setSalarySettings({
        base_salary: settings?.base_salary || 2200000,
        commission_rate: settings?.commission_rate || 10,
        target_amount: currentTarget?.target_amount || 10000000,
        target_quantity: currentTarget?.target_quantity || 100,
      });
    } catch (error) {
      setSalarySettings({
        base_salary: 2200000,
        commission_rate: 10,
        target_amount: 10000000,
        target_quantity: 100,
      });
    }
  };

  const handleSave = async () => {
    if (!selectedSales) return;
    
    setIsSubmitting(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      await api.salary.updateSettings(selectedSales, {
        base_salary: salarySettings.base_salary,
        commission_rate: salarySettings.commission_rate,
      });
      
      await api.salesTargets.create({
        sales_id: selectedSales,
        month: currentMonth,
        target_amount: salarySettings.target_amount,
        target_quantity: salarySettings.target_quantity,
      });
      
      toast.success('Gaji dan target berhasil disimpan');
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDeduction = (actual: number) => {
    const shortfall = salarySettings.target_amount - actual;
    return shortfall > 0 ? Math.floor(shortfall * 0.1) : 0;
  };

  if (roleLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gaji & Target Sales</h1>
          <p className="text-gray-600 mt-1">Kelola gaji pokok dan target sales untuk setiap salesman</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Informasi Perhitungan Gaji</h3>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• Gaji Pokok: {formatCurrency(salarySettings.base_salary)}/bulan</li>
                <li>• Bonus: {salarySettings.commission_rate}% dari penjualan di atas target</li>
                <li>• Potongan: 10% dari shortfall jika target tidak terpenuhi</li>
                <li>• Target Awal: {formatCurrency(salarySettings.target_amount)}/bulan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      {salesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      ) : sales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Belum ada sales</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sales.map((salesPerson) => (
            <Card key={salesPerson.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-600" />
                  </div>
                  {salesPerson.name}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" /> {salesPerson.email}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Gaji Pokok</span>
                    <span className="font-medium">{formatCurrency(salarySettings.base_salary)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Target Penjualan</span>
                    <span className="font-medium">{formatCurrency(salarySettings.target_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Target Quantity</span>
                    <span className="font-medium">{salarySettings.target_quantity} transaksi</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Komisi</span>
                    <span className="font-medium">{salarySettings.commission_rate}%</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => handleOpenDialog(salesPerson.id)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Atur Gaji & Target
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Gaji & Target</DialogTitle>
            <DialogDescription>
              Masukkan gaji pokok dan target sales per bulan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="base_salary">Gaji Pokok (Rp)</Label>
              <Input
                id="base_salary"
                type="number"
                value={salarySettings.base_salary}
                onChange={(e) => setSalarySettings({
                  ...salarySettings,
                  base_salary: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-gray-500">Gaji pokok per bulan (default: 2.200.000)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target_amount">Target Penjualan (Rp)</Label>
              <Input
                id="target_amount"
                type="number"
                value={salarySettings.target_amount}
                onChange={(e) => setSalarySettings({
                  ...salarySettings,
                  target_amount: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-gray-500">Target penjualan per bulan (default: 10.000.000)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target_quantity">Target Jumlah Transaksi</Label>
              <Input
                id="target_quantity"
                type="number"
                value={salarySettings.target_quantity}
                onChange={(e) => setSalarySettings({
                  ...salarySettings,
                  target_quantity: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-gray-500">Target jumlah transaksi per bulan</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commission_rate">Rate Komisi (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                value={salarySettings.commission_rate}
                onChange={(e) => setSalarySettings({
                  ...salarySettings,
                  commission_rate: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-gray-500">Persentase bonus dari penjualan di atas target</p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-lg mt-4">
              <h4 className="font-medium mb-2">Preview Perhitungan:</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Gaji Pokok:</span>
                  <span>{formatCurrency(salarySettings.base_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span>{formatCurrency(salarySettings.target_amount)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>Jika target terpenuhi:</span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(salarySettings.base_salary)}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Jika target tidak terpenuhi (-1jt):</span>
                  <span className="font-medium">
                    {formatCurrency(salarySettings.base_salary - calculateDeduction(salarySettings.target_amount - 1000000))}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={handleSave} 
              className="bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}