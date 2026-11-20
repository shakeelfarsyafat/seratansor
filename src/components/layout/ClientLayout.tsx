'use client';

import React, { Suspense } from 'react';
import AppLayout from './AppLayout';

function LayoutLoading() {
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

// Wrapper client component dengan Suspense boundary agar usePathname()
// aman saat prerendering / next build di Next.js
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LayoutLoading />}>
      <AppLayout>{children}</AppLayout>
    </Suspense>
  );
}
