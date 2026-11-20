'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getNotifications, saveNotifications } from '@/lib/storage';
import { AppNotification } from '@/types';
import { Menu, Bell } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'Ketua':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      case 'Sekretaris':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300';
      case 'Admin':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-12 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 px-3 sm:px-5 flex items-center justify-between shrink-0 shadow-2xs">
      {/* Left: Toggle Sidebar Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Buka/Tutup Menu"
          title="Buka/Tutup Menu Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 hidden sm:inline">
          e-Serat Ansor Jabar
        </span>
      </div>

      {/* Right: Cukup Nama & Sebagai Apa */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Subtle Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors relative"
            title="Pemberitahuan"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-800 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800 text-xs">
                <span className="font-bold text-gray-900 dark:text-white">Pemberitahuan</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-emerald-600 hover:underline font-semibold"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
              <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto text-xs">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-400 py-3 text-[11px]">Tidak ada notifikasi baru</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2 rounded-lg text-[11px] ${
                        n.isRead ? 'bg-gray-50 text-gray-600' : 'bg-emerald-50 text-emerald-900 font-medium'
                      }`}
                    >
                      <p className="font-bold">{n.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill: Cukup Nama dan Sebagai Apa */}
        {user && (
          <Link
            href="/profil"
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all"
            title="Buka Profil Akun"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-700 to-green-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate max-w-[140px] sm:max-w-[200px]">
                {user.name}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
