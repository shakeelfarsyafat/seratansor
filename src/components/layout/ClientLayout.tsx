'use client';

import React from 'react';
import AppLayout from './AppLayout';

// Wrapper client component agar AppLayout bisa diterima oleh Server Component (layout.tsx)
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
