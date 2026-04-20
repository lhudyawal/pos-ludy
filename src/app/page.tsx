'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ShoppingCart, TrendingUp, Users, Package, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LS</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">LUDY SAMBEL PECEL</h1>
              <p className="text-xs text-gray-500">POS System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignedOut>
              <SignInButton>
                <Button className="bg-red-600 hover:bg-red-700">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-white font-bold text-4xl">LS</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent mb-4">
              POS Ludy Sambel Pecel
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sistem Point of Sale terintegrasi untuk manajemen inventory, CRM, sales tracking, dan payroll dalam satu platform
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-100">
              <div className="flex justify-center mb-3">
                <Package className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="font-bold mb-2">Inventory Control</h3>
              <p className="text-sm text-gray-600">
                Kelola produk, varian, harga, dan stok gudang
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100">
              <div className="flex justify-center mb-3">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">Store CRM</h3>
              <p className="text-sm text-gray-600">
                Database toko dan Customer Lifetime Value tracking
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-100">
              <div className="flex justify-center mb-3">
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-bold mb-2">Sales Management</h3>
              <p className="text-sm text-gray-600">
                Target setting, tracking, dan payroll otomatis
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-100">
              <div className="flex justify-center mb-3">
                <ShoppingCart className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="font-bold mb-2">Smart POS</h3>
              <p className="text-sm text-gray-600">
                Point of Sale dengan GPS check-in dan struk digital
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <SignedIn>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                  Admin Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/pos">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  POS System
                  <ShoppingCart className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/sales/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sales Dashboard
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="text-center">
              <p className="text-gray-600 mb-4">Sign in to access the dashboard and POS system</p>
              <SignInButton>
                <Button size="lg" className="bg-red-600 hover:bg-red-700">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2026 Ludy Sambel Pecel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
