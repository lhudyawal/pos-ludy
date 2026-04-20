'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Package,
  Store,
  Users,
  DollarSign,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  FileText,
  Shield,
  Loader2,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useApi';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { title: string; href: string }[];
}

const adminMenuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Inventory',
    href: '/dashboard/inventory',
    icon: Package,
  },
  {
    title: 'Store CRM',
    href: '/dashboard/stores',
    icon: Store,
  },
  {
    title: 'Sales Management',
    href: '/dashboard/sales',
    icon: Users,
    children: [
      { title: 'Sales List', href: '/dashboard/sales' },
      { title: 'Salary & Target', href: '/dashboard/salary-target' },
      { title: 'Targets', href: '/dashboard/sales/targets' },
    ],
  },
  {
    title: 'Payroll',
    href: '/dashboard/payroll',
    icon: DollarSign,
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    title: 'POS (Sales Panel)',
    href: '/pos',
    icon: ShoppingCart,
  },
];

const salesMenuItems: MenuItem[] = [
  {
    title: 'POS (Sales Panel)',
    href: '/pos',
    icon: ShoppingCart,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded: userLoaded } = useUser();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && userLoaded && !isAdmin) {
      router.push('/pos');
    }
  }, [isAdmin, roleLoading, userLoaded, router]);

  if (!roleLoading && userLoaded && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" />
          <p className="mt-2 text-gray-600">Redirecting to POS...</p>
        </div>
      </div>
    );
  }

  if (roleLoading || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const menuItems = isAdmin ? adminMenuItems : salesMenuItems;

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LS</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">LUDY</h1>
              <p className="text-xs text-gray-500">SAMBEL PECEL</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuItems.map((item) => (
            <div key={item.href}>
              {item.children ? (
                <div>
                  <button
                    onClick={() =>
                      setExpandedMenu(expandedMenu === item.title ? null : item.title)
                    }
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        expandedMenu === item.title && 'rotate-180'
                      )}
                    />
                  </button>
                  {expandedMenu === item.title && (
                    <div className="ml-9 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block px-3 py-2 text-sm rounded-lg transition-colors',
                            pathname === child.href
                              ? 'bg-red-50 text-red-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                    pathname === item.href
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {isAdmin && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-red-50">
            <div className="flex items-center gap-2 text-xs text-red-700">
              <Shield className="w-4 h-4" />
              <span>Admin Mode</span>
            </div>
          </div>
        )}
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

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
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
