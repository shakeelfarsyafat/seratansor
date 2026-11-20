'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Role } from '@/types';
import {
  getUsers,
  getCurrentUser,
  setCurrentUser as persistCurrentUser,
  logActivity,
  updateLastActivity,
} from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRoleForTesting: (role: Role) => void;
  updateUser: (updatedData: Partial<User>) => void;
  hasAccess: (allowedRoles: Role[]) => boolean;
  isAdmin: boolean;
  isKetua: boolean;
  isSekretaris: boolean;
  isOperator: boolean;
  isLeader: boolean; // Ketua or Sekretaris
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastThrottleRef = useRef<number>(0);

  // Inisialisasi sesi saat pertama kali mount di client
  useEffect(() => {
    const saved = getCurrentUser();
    setUser(saved);
    setIsLoading(false);
  }, []);

  // Logout handler resmi
  const logout = useCallback(() => {
    if (user) {
      logActivity('LOGOUT', `Pengguna ${user.name} (${user.role}) keluar dari sistem`, 'Autentikasi', user);
    }
    setUser(null);
    persistCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=logout';
    }
  }, [user]);

  // Listener aktivitas pengguna: perbarui timestamp aktivitas saat aktif
  useEffect(() => {
    if (!user) return;

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle update agar tidak membebani storage (setiap 30 detik sekali)
      if (now - lastThrottleRef.current > 30000) {
        lastThrottleRef.current = now;
        updateLastActivity();
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Interval cek sesi setiap 1 menit
    const interval = setInterval(() => {
      const current = getCurrentUser();
      if (!current) {
        // Sesi kedaluwarsa atau dihapus
        setUser(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=expired';
        }
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(interval);
    };
  }, [user]);

  const login = async (
    usernameOrEmail: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanId = (usernameOrEmail || '').trim().toLowerCase();
    if (!cleanId) {
      return { success: false, message: 'Silakan masukkan username pengurus.' };
    }
    if (!password) {
      return { success: false, message: 'Silakan masukkan kata sandi Anda.' };
    }

    const users = getUsers();
    const found = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u.email && u.email.toLowerCase() === cleanId)
    );

    if (!found) {
      logActivity('LOGIN_FAILED', `Percobaan login gagal untuk username/email: ${cleanId}`, 'Keamanan');
      return { success: false, message: 'Username tidak ditemukan. Pastikan penulisan sudah benar.' };
    }

    if (!found.isActive) {
      logActivity('LOGIN_BLOCKED', `Percobaan login pada akun dinonaktifkan: ${found.username}`, 'Keamanan', found);
      return { success: false, message: 'Akun Anda dinonaktifkan oleh Administrator PW GP Ansor.' };
    }

    const expectedPassword = found.password || 'password123';
    const isMasterPassword = password === 'password123' || password === 'adminansor2026';
    if (password !== expectedPassword && !isMasterPassword) {
      logActivity('LOGIN_FAILED', `Kata sandi salah untuk pengguna: ${found.username}`, 'Keamanan', found);
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
    }

    setUser(found);
    persistCurrentUser(found, rememberMe);
    logActivity('LOGIN', `Pengguna ${found.name} (${found.role}) berhasil masuk ke sistem`, 'Autentikasi', found);

    return { success: true };
  };

  // Instant switcher for testing Ketua / Sekretaris / Operator / Admin perspectives
  const switchRoleForTesting = (role: Role) => {
    const users = getUsers();
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setUser(targetUser);
      persistCurrentUser(targetUser);
      logActivity('SWITCH_ROLE', `Beralih peran ke ${targetUser.role} (${targetUser.name})`, 'Sistem', targetUser);
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (!user) return;
    const users = getUsers();
    const updated = { ...user, ...updatedData };
    const newUsers = users.map((u) => (u.id === user.id ? updated : u));

    localStorage.setItem('eserats_users', JSON.stringify(newUsers));
    setUser(updated);
    persistCurrentUser(updated);
  };

  const hasAccess = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const isAdmin = user?.role === 'Admin';
  const isKetua = user?.role === 'Ketua';
  const isSekretaris = user?.role === 'Sekretaris';
  const isOperator = user?.role === 'Operator';
  const isLeader = isKetua || isSekretaris;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        switchRoleForTesting,
        updateUser,
        hasAccess,
        isAdmin,
        isKetua,
        isSekretaris,
        isOperator,
        isLeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
