'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  History,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  Store,
  DollarSign,
  CreditCard,
  Eye,
  ArrowLeft,
  Loader2,
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
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTransactions } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/converters';
import { Transaction } from '@/types';
import { toast } from 'sonner';

export default function TransactionHistoryPage() {
  const router = useRouter();
  const { transactions, loading, deleteTransaction, updateTransaction } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTransactions = transactions.filter(
    (trx) =>
      (trx.storeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trx.salesName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = transactions.reduce((sum, trx) => sum + trx.total, 0);

  const handleViewDetail = (trx: Transaction) => {
    setSelectedTransaction(trx);
    setShowDetailDialog(true);
  };

  const handleEdit = (trx: Transaction) => {
    setEditingTransaction(trx);
    setEditPaymentMethod(trx.paymentMethod || trx.payment_method || 'cash');
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    setIsSubmitting(true);
    try {
      await updateTransaction(editingTransaction.id, {
        payment_method: editPaymentMethod,
      });
      setShowEditDialog(false);
      setEditingTransaction(null);
      toast.success('Transaksi berhasil diupdate');
    } catch (error) {
      toast.error('Gagal mengupdate transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (trx: Transaction) => {
    setSelectedTransaction(trx);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTransaction) return;

    setIsSubmitting(true);
    try {
      await deleteTransaction(selectedTransaction.id);
      setShowDeleteDialog(false);
      setSelectedTransaction(null);
      toast.success('Transaksi berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToPOS = () => {
    router.push('/pos');
  };

  const getTransactionDate = (trx: Transaction) => {
    return trx.date || trx.created_at || new Date().toISOString();
  };

  const getStoreName = (trx: Transaction) => {
    return trx.storeName || trx.store?.name || 'Toko';
  };

  const getSalesName = (trx: Transaction) => {
    return trx.salesName || trx.sales?.name || 'Sales';
  };

  const getPaymentMethod = (trx: Transaction) => {
    return trx.paymentMethod || trx.payment_method || 'cash';
  };

  const getItems = (trx: Transaction) => {
    return trx.items || trx.transaction_items || [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleBackToPOS}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">Riwayat Transaksi</h1>
                  <p className="text-xs text-gray-500">Sales Panel - CRUD Transactions</p>
                </div>
              </div>
            </div>
            <Button onClick={handleBackToPOS} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Transaksi Baru
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Transaksi</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Toko Dikunjungi</p>
                  <p className="text-2xl font-bold">
                    {new Set(transactions.map((t) => t.store_id || '')).size}
                  </p>
                </div>
                <Store className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari transaksi berdasarkan toko, sales, atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transaction list */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Transaksi</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaksi tersimpan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">Belum ada transaksi</p>
                <p className="text-sm mt-1">Mulai transaksi di POS untuk melihat riwayat di sini</p>
                <Button
                  onClick={handleBackToPOS}
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Transaksi Pertama
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Toko</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pembayaran</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((trx) => (
                    <TableRow key={trx.id}>
                      <TableCell className="font-mono text-sm">{trx.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(getTransactionDate(trx)).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{getStoreName(trx)}</TableCell>
                      <TableCell>{getSalesName(trx)}</TableCell>
                      <TableCell>{getItems(trx).length} produk</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(trx.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            getPaymentMethod(trx) === 'cash'
                              ? 'bg-green-600'
                              : 'bg-blue-600'
                          }
                        >
                          {getPaymentMethod(trx) === 'cash' ? 'Tunai' : 'Transfer'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(trx)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(trx)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(trx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>Informasi lengkap transaksi</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID Transaksi</p>
                    <p className="font-mono font-medium">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal</p>
                    <p className="font-medium">
                      {new Date(getTransactionDate(selectedTransaction)).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Toko</p>
                    <p className="font-medium">{getStoreName(selectedTransaction)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sales</p>
                    <p className="font-medium">{getSalesName(selectedTransaction)}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-500 mb-2">Item yang Dibeli</p>
                  <div className="space-y-2">
                    {getItems(selectedTransaction).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.product?.name || 'Produk'}</p>
                          <p className="text-xs text-gray-500">{item.product?.variant}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} x {formatCurrency(item.unit_price || item.product?.price || 0)}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Metode Pembayaran</p>
                    <Badge
                      className={
                        getPaymentMethod(selectedTransaction) === 'cash'
                          ? 'bg-green-600'
                          : 'bg-blue-600'
                      }
                    >
                      {getPaymentMethod(selectedTransaction) === 'cash' ? 'Tunai' : 'Transfer'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedTransaction.total)}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
            <DialogDescription>Ubah informasi transaksi</DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-500">ID Transaksi</p>
                <p className="font-mono font-medium">{editingTransaction.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Toko</p>
                <p className="font-medium">{getStoreName(editingTransaction)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(editingTransaction.total)}
                </p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={editPaymentMethod === 'cash' ? 'default' : 'outline'}
                    onClick={() => setEditPaymentMethod('cash')}
                    className={editPaymentMethod === 'cash' ? 'bg-red-600' : ''}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Tunai
                  </Button>
                  <Button
                    variant={editPaymentMethod === 'transfer' ? 'default' : 'outline'}
                    onClick={() => setEditPaymentMethod('transfer')}
                    className={editPaymentMethod === 'transfer' ? 'bg-red-600' : ''}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Transfer
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedTransaction && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{getStoreName(selectedTransaction)}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(selectedTransaction.total)} -{' '}
                {new Date(getTransactionDate(selectedTransaction)).toLocaleString('id-ID')}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menghapus...' : 'Hapus Transaksi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
