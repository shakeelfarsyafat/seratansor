'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import {
  LayoutDashboard,
  Inbox,
  FileText,
  FileCheck,
  FilePlus,
  Archive,
  BarChart3,
  Building2,
  FileSpreadsheet,
  Hash,
  Users,
  UserCheck,
  LogOut,
  X,
  LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  badge?: string;
  highlight?: boolean;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isLeader } = useAuth();

  // Direct, flat list without group headings
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['Admin', 'Ketua', 'Sekretaris', 'Operator'],
    },
    {
      label: 'Surat Masuk & Disposisi',
      href: '/arsip/masuk',
      icon: Inbox,
      roles: ['Admin', 'Ketua', 'Sekretaris', 'Operator'],
    },
    {
      label: 'Daftar Surat Keluar',
      href: '/surat/keluar',
      icon: FileText,
      roles: ['Admin', 'Ketua', 'Sekretaris', 'Operator'],
    },
    {
      label: 'Menunggu Tanda Tangan',
      href: '/surat/tanda-tangan',
      icon: FileCheck,
      roles: ['Admin', 'Ketua', 'Sekretaris'],
      highlight: isLeader,
      badge: isLeader ? 'Penting' : undefined,
    },
    {
      label: 'Buat Surat Baru',
      href: '/surat/buat',
      icon: FilePlus,
      roles: ['Admin', 'Operator'],
    },
    {
      label: 'Arsip Surat Keluar',
      href: '/arsip/keluar',
      icon: Archive,
      roles: ['Admin', 'Ketua', 'Sekretaris', 'Operator'],
    },
    {
      label: 'Laporan Persuratan',
      href: '/laporan',
      icon: BarChart3,
      roles: ['Admin', 'Ketua', 'Sekretaris', 'Operator'],
    },
    {
      label: 'Data Instansi',
      href: '/pengaturan/instansi',
      icon: Building2,
      roles: ['Admin'],
    },
    {
      label: 'Template Surat',
      href: '/pengaturan/template',
      icon: FileSpreadsheet,
      roles: ['Admin'],
    },
    {
      label: 'Format Penomoran',
      href: '/pengaturan/penomoran',
      icon: Hash,
      roles: ['Admin'],
    },
    {
      label: 'Manajemen Pengguna',
      href: '/pengguna',
      icon: Users,
      roles: ['Admin'],
    },
    {
      label: 'Profil Pengurus',
      href: '/profil',
      icon: UserCheck,
      roles: ['Admin', 'Ketua', 'Sekretaris', 'Operator'],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-56 bg-gradient-to-b from-emerald-950 via-emerald-900 to-green-950 text-white flex flex-col border-r border-emerald-800/50 shadow-xl transition-transform duration-250 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-13 px-3.5 flex items-center justify-between border-b border-emerald-800/60 bg-emerald-950/80 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-emerald-600 p-0.5 shadow-sm shrink-0">
              <div className="w-full h-full bg-emerald-950 rounded-md flex items-center justify-center">
                <span className="text-amber-300 font-black text-xs">GP</span>
              </div>
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-extrabold text-xs text-white truncate">e-Serat Ansor</span>
              <span className="text-[9px] text-emerald-300 truncate">PW GP Ansor Jabar</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-colors"
            title="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items (Direct, compact, no group headers) */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-emerald-800">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs border border-emerald-400/30'
                    : item.highlight
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30 font-semibold'
                    : 'text-emerald-100/85 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-emerald-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                      item.highlight
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Compact Logout */}
        <div className="p-2 border-t border-emerald-800/60 bg-emerald-950/80 shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 border border-rose-900/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
