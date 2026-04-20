'use client';

import { useState } from 'react';
import { MapPin, Phone, User, DollarSign, Calendar, ExternalLink, Search, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStores } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/converters';
import { Store } from '@/types';

export default function StoresPage() {
  const { stores, loading } = useStores();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (store.owner_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedByLifetimeValue = [...stores].sort(
    (a, b) => (b.lifetime_value || 0) - (a.lifetime_value || 0)
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store CRM</h1>
        <p className="text-gray-600 mt-1">Database dan manajemen toko mitra</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari toko berdasarkan nama, alamat, atau pemilik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Top stores by CLV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Top Toko Berdasarkan Customer Lifetime Value
          </CardTitle>
          <CardDescription>
            Ranking toko berdasarkan total nilai transaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {sortedByLifetimeValue.slice(0, 3).map((store, index) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{store.name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {store.address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(store.lifetime_value || 0)}
                    </p>
                    <p className="text-sm text-gray-500">{store.total_transactions || 0} transaksi</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store list */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Toko</CardTitle>
          <CardDescription>
            Total {filteredStores.length} toko mitra
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">Belum ada toko</p>
              <p className="text-sm mt-1">Tambahkan toko baru dari halaman POS</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Toko</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Total Transaksi</TableHead>
                  <TableHead>Lifetime Value</TableHead>
                  <TableHead>Kunjungan Terakhir</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {store.owner_name || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {store.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      {store.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {store.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{store.total_transactions || 0}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(store.lifetime_value || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {store.last_visit || store.lastVisit || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStore(store)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Store detail dialog */}
      <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Toko</DialogTitle>
            <DialogDescription>Informasi lengkap toko mitra</DialogDescription>
          </DialogHeader>
          {selectedStore && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStore.name}</h3>
                {selectedStore.owner_name && (
                  <p className="text-gray-600">Pemilik: {selectedStore.owner_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">Total Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedStore.total_transactions || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">Lifetime Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedStore.lifetime_value || 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Alamat</p>
                    <p className="text-gray-600">{selectedStore.address}</p>
                  </div>
                </div>
                {selectedStore.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Kontak</p>
                      <p className="text-gray-600">{selectedStore.phone}</p>
                    </div>
                  </div>
                )}
                {selectedStore.latitude && selectedStore.longitude && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Koordinat GPS</p>
                      <p className="text-gray-600 font-mono">
                        {selectedStore.latitude}, {selectedStore.longitude}
                      </p>
                      <Button 
                        variant="link" 
                        className="px-0 h-auto"
                        onClick={() => window.open(`https://maps.google.com/?q=${selectedStore.latitude},${selectedStore.longitude}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Lihat di Maps
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Kunjungan Terakhir</p>
                <p className="font-medium">{selectedStore.last_visit || selectedStore.lastVisit || 'Belum pernah dikunjungi'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
