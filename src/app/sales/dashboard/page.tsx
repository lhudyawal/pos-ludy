'use client';

import { useState } from 'react';
import { Calendar, Clock, Store, DollarSign, TrendingUp, MapPin, CheckCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  mockDailyActivities,
  mockTransactions,
  mockSalesTargets,
  formatCurrency,
} from '@/data/mock';

export default function SalesDashboardPage() {
  const salesId = 'user-2'; // Mock sales ID
  const todayActivities = mockDailyActivities.filter(
    (a) => a.salesId === salesId && a.date === '2026-04-14'
  );
  const allActivities = mockDailyActivities.filter((a) => a.salesId === salesId);
  const target = mockSalesTargets.find((t) => t.salesId === salesId);

  const todayTransactions = mockTransactions.filter(
    (t) => t.salesId === salesId && t.date.startsWith('2026-04-14')
  );
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const todayVisits = new Set(todayTransactions.map((t) => t.storeId)).size;

  const monthTransactions = mockTransactions.filter((t) => t.salesId === salesId);
  const monthRevenue = monthTransactions.reduce((sum, t) => sum + t.total, 0);
  const targetPercentage = target ? (monthRevenue / target.targetAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Performance Dashboard</h1>
            <p className="text-sm text-gray-600">Sales Andi - April 2026</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Target progress card */}
        <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Target Bulanan</p>
                <p className="text-2xl font-bold">{formatCurrency(target?.targetAmount || 0)}</p>
              </div>
              <Target className="w-12 h-12 opacity-50" />
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Pencapaian</span>
                <span className="text-sm font-semibold">{targetPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(targetPercentage, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Realisasi: {formatCurrency(monthRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Today's stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-500">Hari Ini</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{todayVisits}</p>
              <p className="text-xs text-gray-500">Toko dikunjungi</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-500">Pendapatan</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(todayRevenue)}</p>
              <p className="text-xs text-gray-500">Hari ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Aktivitas Hari Ini
            </CardTitle>
            <CardDescription>
              Timeline kunjungan dan transaksi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayTransactions.map((trx, index) => (
                <div key={trx.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    {index < todayTransactions.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{trx.storeName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(trx.date).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Selesai
                      </Badge>
                    </div>
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {trx.items.length} produk
                        </span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(trx.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Ringkasan Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Kunjungan</p>
                  <p className="text-xl font-bold">{todayVisits} toko</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Transaksi</p>
                  <p className="text-xl font-bold">{monthTransactions.length}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pendapatan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthRevenue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Kurang untuk mencapai target</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(Math.max(0, (target?.targetAmount || 0) - monthRevenue))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Target({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
