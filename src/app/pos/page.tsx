'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  MapPin,
  Printer,
  Share2,
  History,
  PlusCircle,
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { useProducts, useStores, useTransactions, useCurrentUser } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/converters';
import { Product, CartItem, Store, Transaction } from '@/types';
import { toast } from 'sonner';

export default function POSPage() {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showAddStoreDialog, setShowAddStoreDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    phone: '',
    ownerName: '',
  });

  const { products, loading: productsLoading } = useProducts();
  const { stores, loading: storesLoading, refetch: refetchStores } = useStores();
  const { createTransaction } = useTransactions();

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.price,
              }
            : item
        );
      }
      return [...prev, { product, quantity: 1, subtotal: product.price }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.max(0, item.quantity + delta),
                subtotal: Math.max(0, item.quantity + delta) * item.product.price,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckIn = () => {
    if (!selectedStore) {
      toast.error('Pilih toko terlebih dahulu');
      return;
    }
    setIsCheckedIn(true);
    toast.success('Check-in berhasil');
  };

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.address) {
      toast.error('Data tidak lengkap', { description: 'Nama dan alamat wajib diisi.' });
      return;
    }

    try {
      const result = await api.stores.create({
        name: newStore.name,
        address: newStore.address,
        phone: newStore.phone,
        owner_name: newStore.ownerName,
      });
      
      await refetchStores();
      setSelectedStore(result.id);
      setShowAddStoreDialog(false);
      setNewStore({ name: '', address: '', phone: '', ownerName: '' });
      toast.success('Toko berhasil ditambahkan');
    } catch (error) {
      toast.error('Gagal menambahkan toko');
    }
  };

  const handleConfirmCheckout = async () => {
    if (!selectedStore || cart.length === 0) {
      toast.error('Data tidak lengkap');
      return;
    }

    const salesId = currentUser?.id;
    if (!salesId) {
      toast.error('User tidak ditemukan. Silakan login ulang.');
      return;
    }

    setIsSubmitting(true);
    try {
      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.subtotal,
      }));

      await createTransaction({
        sales_id: salesId,
        store_id: selectedStore,
        items,
        payment_method: paymentMethod,
        check_in_time: new Date().toISOString(),
      });

      setShowCheckoutDialog(false);
      setShowSuccessDialog(true);
      toast.success('Transaksi berhasil disimpan');
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    setShowSuccessDialog(false);
    clearCart();
    setIsCheckedIn(false);
    setSelectedStore('');
    toast.info('Struk dicetak');
  };

  const handleShareWhatsApp = () => {
    const store = stores.find((s) => s.id === selectedStore);
    const message = `Halo ${store?.name}, berikut rincian pesanan Anda senilai ${formatCurrency(total)}`;
    const phone = store?.phone?.replace(/^0/, '62') || '';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const selectedStoreData = stores.find((s) => s.id === selectedStore);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">POS Ludy Sambel Pecel</h1>
              <p className="text-xs text-gray-500">Point of Sale System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCheckedIn && <Badge className="bg-green-600">Checked In</Badge>}
            <Button variant="outline" size="sm" onClick={() => router.push('/sales/transactions')}>
              <History className="w-4 h-4 mr-2" /> Riwayat
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Check-in section */}
        {!isCheckedIn && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Check-in Kunjungan
                  </CardTitle>
                  <CardDescription>Pilih atau tambahkan toko baru</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowAddStoreDialog(true)}
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Toko Baru
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Pilih Toko</Label>
                {storesLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memuat toko...
                  </div>
                ) : (
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cari toko..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {selectedStoreData && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-medium">{selectedStoreData.name}</p>
                  <p className="text-xs text-gray-500">{selectedStoreData.address}</p>
                </div>
              )}

              <Button
                onClick={handleCheckIn}
                disabled={!selectedStore}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Check-in Sekarang
              </Button>
            </CardContent>
          </Card>
        )}

        {/* POS Interface */}
        {isCheckedIn && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pilih Produk</CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {products.map((p) => (
                        <button 
                          key={p.id} 
                          onClick={() => addToCart(p)} 
                          className="p-4 border rounded-lg hover:border-red-500 text-left transition-colors"
                        >
                          <p className="font-bold">{p.name}</p>
                          <p className="text-sm text-gray-500">{p.variant}</p>
                          <p className="text-red-600 font-semibold">{formatCurrency(p.price)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Cart Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Keranjang ({cart.length} item)</CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Keranjang kosong</p>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.product.name}</p>
                              <p className="text-xs text-gray-500">x{item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200"
                              >
                                -
                              </button>
                              <span className="text-sm w-6 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200"
                              >
                                +
                              </button>
                              <span className="text-sm font-medium w-20 text-right">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4"/>
                      <div className="flex justify-between font-bold text-lg mb-4">
                        <span>Total</span>
                        <span className="text-red-600">{formatCurrency(total)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <Button 
                          variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('cash')}
                          className={paymentMethod === 'cash' ? 'bg-red-600' : ''}
                        >
                          Tunai
                        </Button>
                        <Button 
                          variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('transfer')}
                          className={paymentMethod === 'transfer' ? 'bg-red-600' : ''}
                        >
                          Transfer
                        </Button>
                      </div>
                      <Button 
                        className="w-full bg-red-600" 
                        onClick={() => setShowCheckoutDialog(true)}
                      >
                        Bayar Sekarang
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Tambah Toko */}
      <Dialog open={showAddStoreDialog} onOpenChange={setShowAddStoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Toko Baru</DialogTitle>
            <DialogDescription>Masukkan detail toko untuk ditambahkan ke database.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Toko</Label>
              <Input 
                id="name" 
                placeholder="Contoh: Toko Berkah" 
                value={newStore.name}
                onChange={(e) => setNewStore({...newStore, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Input 
                id="address" 
                placeholder="Jl. Raya No. 123..." 
                value={newStore.address}
                onChange={(e) => setNewStore({...newStore, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Nama Pemilik</Label>
                <Input 
                  id="owner" 
                  placeholder="Nama pemilik" 
                  value={newStore.ownerName}
                  onChange={(e) => setNewStore({...newStore, ownerName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. WhatsApp</Label>
                <Input 
                  id="phone" 
                  placeholder="62812..." 
                  value={newStore.phone}
                  onChange={(e) => setNewStore({...newStore, phone: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStoreDialog(false)}>Batal</Button>
            <Button onClick={handleAddStore} className="bg-red-600">Simpan Toko</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Checkout */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>Total: {formatCurrency(total)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Metode Pembayaran: <strong>{paymentMethod === 'cash' ? 'Tunai' : 'Transfer'}</strong></p>
            <p>Toko: <strong>{selectedStoreData?.name}</strong></p>
            <p>Items: <strong>{cart.length} produk</strong></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>Batal</Button>
            <Button 
              onClick={handleConfirmCheckout} 
              className="bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                </>
              ) : (
                'Konfirmasi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Success */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaksi Berhasil!</DialogTitle>
            <DialogDescription>Pesanan telah berhasil dicatat.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button onClick={handlePrintReceipt}>
              <Printer className="mr-2 h-4 w-4"/> Cetak Struk
            </Button>
            <Button onClick={handleShareWhatsApp} variant="outline">
              <Share2 className="mr-2 h-4 w-4"/> Kirim via WhatsApp
            </Button>
            <Button variant="outline" onClick={() => { setShowSuccessDialog(false); clearCart(); setIsCheckedIn(false); }}>
              Transaksi Baru
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
