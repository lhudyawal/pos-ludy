'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';
import { ShoppingCart, FileText, Loader2, Shield, Target, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole, useCurrentUser } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/converters';

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { user: currentUser } = useCurrentUser();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [salaryInfo, setSalaryInfo] = useState({ base_salary: 2200000, target_amount: 10000000, actual_amount: 0, commission_rate: 10 });

  useEffect(() => {
    const fetchSalaryInfo = async () => {
      if (!currentUser?.id) return;
      try {
        const settings = await api.salary.getSettings(currentUser.id);
        const targets = await api.salesTargets.getAll({ sales_id: currentUser.id });
        const currentMonth = new Date().toISOString().slice(0, 7);
        const target = targets.find((t: any) => t.month === currentMonth);
        setSalaryInfo({
          base_salary: settings?.base_salary || 2200000,
          commission_rate: settings?.commission_rate || 10,
          target_amount: target?.target_amount || 10000000,
          actual_amount: target?.actual_amount || 0,
        });
      } catch (e) {
        console.error('Failed to fetch salary info', e);
      }
    };
    if (currentUser?.id && !isAdmin) {
      fetchSalaryInfo();
    }
  }, [currentUser, isAdmin]);

  if (!userLoaded || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Point of Sale',
      href: '/pos',
      icon: ShoppingCart,
      active: pathname === '/pos',
    },
  ];

  if (isAdmin) {
    menuItems.push({
      title: 'Dashboard',
      href: '/dashboard',
      icon: FileText,
      active: pathname.startsWith('/dashboard'),
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LS</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900">LUDY</h1>
                <p className="text-xs text-gray-500">SAMBEL PECEL</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 ml-8">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors',
                    item.active
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/dashboard"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-full"
              >
                <Shield className="w-3 h-3" />
                Admin
              </Link>
            )}

            {!isAdmin && currentUser && (
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <Target className="w-4 h-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-xs text-green-700">Target: {formatCurrency(salaryInfo.actual_amount)} / {formatCurrency(salaryInfo.target_amount)}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-0.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        (salaryInfo.actual_amount / salaryInfo.target_amount) >= 1
                          ? 'bg-green-600'
                          : (salaryInfo.actual_amount / salaryInfo.target_amount) >= 0.5
                          ? 'bg-orange-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min((salaryInfo.actual_amount / salaryInfo.target_amount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col border-l border-green-200 pl-2">
                  <span className="text-xs text-green-700">Gaji: {formatCurrency(salaryInfo.base_salary)}</span>
                  <span className="text-xs font-medium text-green-800">
                    Est: {formatCurrency(
                      salaryInfo.actual_amount >= salaryInfo.target_amount
                        ? salaryInfo.base_salary + Math.floor(salaryInfo.actual_amount * (salaryInfo.commission_rate / 100))
                        : salaryInfo.base_salary - Math.floor((salaryInfo.target_amount - salaryInfo.actual_amount) * 0.1)
                    )}
                  </span>
                </div>
              </div>
            )}

            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors',
                item.active
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </header>

      <main className="p-4 lg:p-6">{children}</main>
    </div>
  );
}
