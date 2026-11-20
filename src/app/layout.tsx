import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ClientLayout from '@/components/layout/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'e-Serat Ansor Jabar - Sistem Persuratan Digital GP Ansor Jawa Barat',
  description: 'Aplikasi manajemen persuratan, pembuatan surat berbasis template, disposisi, tanda tangan digital, dan verifikasi keaslian surat GP Ansor Jawa Barat.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50 text-gray-900 selection:bg-emerald-200 selection:text-emerald-950`}>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
