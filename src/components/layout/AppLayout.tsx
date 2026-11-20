'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Loading spinner yang sama antara server & client (mencegah hydration mismatch)
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-2xl bg-emerald-700 animate-spin flex items-center justify-center">
        <div className="w-5 h-5 rounded-lg bg-amber-400"></div>
      </div>
      <p className="mt-3 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
        Memuat e-Serat Ansor Jabar...
      </p>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // useMounted: pastikan render pertama di client = server (keduanya tampilkan LoadingScreen)
  // Setelah mount, baru render berdasarkan state auth yang sesungguhnya.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Halaman publik (login, verifikasi) — tidak perlu auth, render langsung tanpa loading
  const isPublicPage = pathname === '/login' || pathname.startsWith('/verifikasi');

  // Pengalihan ke /login via useEffect (sesuai kaidah React client component)
  useEffect(() => {
    if (mounted && !isLoading && !user && !isPublicPage) {
      router.push('/login');
    }
  }, [mounted, isLoading, user, isPublicPage, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  // Belum mount (SSR), sedang loading auth, atau belum ada user -> tampilkan loading screen
  if (!mounted || isLoading || !user) {
    return <LoadingScreen />;
  }

  // Role Restriction Check for Admin-Only routes
  const adminOnlyRoutes = ['/pengguna', '/pengaturan'];
  const isForbidden = adminOnlyRoutes.some((route) => pathname.startsWith(route)) && user.role !== 'Admin';

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`flex-1 flex flex-col transition-all duration-250 ${sidebarOpen ? 'lg:pl-56' : 'lg:pl-0'}`}>
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-red-200 dark:border-red-900/50 shadow-lg text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Akses Ditolak (403 Forbidden)</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Halaman ini hanya dapat diakses oleh akun dengan peran <strong>Administrator Sistem</strong>. Akun Anda saat ini memiliki peran <strong>{user.role}</strong>.
              </p>
              <div className="pt-1">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Dashboard</span>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-gray-50/80 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex-1 h-full max-h-full flex flex-col transition-all duration-250 overflow-hidden ${sidebarOpen ? 'lg:pl-56' : 'lg:pl-0'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-3 sm:p-4 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
