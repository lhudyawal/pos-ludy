'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Package, AlertTriangle, Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProducts } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/converters';
import { Product } from '@/types';
import { toast } from 'sonner';

export default function InventoryPage() {
  const { products, loading, refetch } = useProducts();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    variant: '',
    price: '',
    cost: '',
    stock: '',
    unit: 'pcs',
  });

  const handleAddProduct = async () => {
    if (!formData.name || !formData.variant || !formData.price || !formData.cost) {
      toast.error('Data tidak lengkap');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.products.create({
        name: formData.name,
        variant: formData.variant,
        price: parseInt(formData.price),
        cost: parseInt(formData.cost),
        stock: parseInt(formData.stock) || 0,
        unit: formData.unit,
      });
      await refetch();
      setIsAddOpen(false);
      setFormData({ name: '', variant: '', price: '', cost: '', stock: '', unit: 'pcs' });
      toast.success('Produk berhasil ditambahkan');
    } catch (error) {
      toast.error('Gagal menambahkan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.products.delete(id);
      await refetch();
      toast.success('Produk berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus produk');
    }
  };

  const lowStockProducts = products.filter((p) => (p.stock || 0) < 100);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Control</h1>
          <p className="text-gray-600 mt-1">Kelola produk dan stok gudang</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Produk Baru</DialogTitle>
              <DialogDescription>Isi informasi produk baru untuk inventory</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Produk</Label>
                <Input 
                  id="name" 
                  placeholder="Sambel Pecel Original" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="variant">Varian</Label>
                <Input 
                  id="variant" 
                  placeholder="Level 1 - Tidak Pedas" 
                  value={formData.variant}
                  onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Harga Jual</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="15000" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cost">Harga Modal</Label>
                  <Input 
                    id="cost" 
                    type="number" 
                    placeholder="8000" 
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stok Awal</Label>
                  <Input 
                    id="stock" 
                    type="number" 
                    placeholder="100" 
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Input 
                    id="unit" 
                    placeholder="pcs" 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleAddProduct} 
                className="bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  'Simpan Produk'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Peringatan Stok Rendah
            </CardTitle>
            <CardDescription className="text-orange-600">
              {lowStockProducts.length} produk memiliki stok di bawah 100 unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.variant}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-orange-600">{product.stock} {product.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Daftar Produk
          </CardTitle>
          <CardDescription>
            Total {products.length} produk dalam inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">Belum ada produk</p>
              <p className="text-sm mt-1">Tambah produk baru untuk memulai</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Varian</TableHead>
                  <TableHead>Harga Modal</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const margin = ((product.price - product.cost) / product.cost) * 100;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{product.variant}</TableCell>
                      <TableCell>{formatCurrency(product.cost)}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            (product.stock || 0) < 100
                              ? 'text-orange-600 font-semibold'
                              : 'text-green-600'
                          }
                        >
                          {product.stock} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">{margin.toFixed(0)}%</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
