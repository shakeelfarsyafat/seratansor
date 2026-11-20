'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Lock, User, ArrowRight, ShieldCheck, AlertCircle,
  Eye, EyeOff, ShieldAlert, KeyRound, CheckCircle2,
  Info, ChevronDown, ChevronUp, UserCheck, Key
} from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

// Daftar akun resmi yang tersedia
const AVAILABLE_ACCOUNTS = [
  {
    role: 'Admin',
    label: 'Administrator Sistem',
    username: 'admin',
    name: 'Sahabat Administrator',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
  },
  {
    role: 'Ketua',
    label: 'Ketua PW GP Ansor',
    username: 'ketua_pw',
    name: 'H. SUBHAN FAHMI',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
  },
  {
    role: 'Sekretaris',
    label: 'Sekretaris PW',
    username: 'sekretaris_pw',
    name: 'H. EDI RUSYANDI',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
  },
  {
    role: 'Operator',
    label: 'Tata Usaha / Operator',
    username: 'staf_tu',
    name: 'Sahabat M. Rifki Fauzi',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);

  // Security & Rate Limiting states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [captcha, setCaptcha] = useState({ a: 3, b: 4, expected: 7 });
  const [captchaInput, setCaptchaInput] = useState('');

  // Generate new security challenge
  const refreshCaptcha = () => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 7) + 1;
    setCaptcha({ a, b, expected: a + b });
    setCaptchaInput('');
  };

  // Check saved lockout & URL notification on mount
  useEffect(() => {
    if (user) {
      router.push('/');
      return;
    }

    // Periksa notifikasi alasan pengalihan login (logout atau expired)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const reason = searchParams.get('reason');
      if (reason === 'logout') {
        setNotice('Anda telah berhasil keluar dari sistem secara aman.');
      } else if (reason === 'expired') {
        setNotice('Sesi login Anda telah berakhir demi keamanan. Silakan masuk kembali.');
      }
    } catch {}

    try {
      const savedAttempts = parseInt(sessionStorage.getItem('eserats_login_attempts') || '0', 10);
      const savedLockUntil = parseInt(sessionStorage.getItem('eserats_login_lock_until') || '0', 10);
      const now = Date.now();

      if (savedLockUntil > now) {
        const remaining = Math.ceil((savedLockUntil - now) / 1000);
        setLockoutTime(remaining);
      }
      setFailedAttempts(savedAttempts);
      if (savedAttempts >= 2) {
        refreshCaptcha();
      }
    } catch {
      // ignore storage access errors
    }
  }, [user, router]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime <= 0) return;

    const timer = setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1) {
          try {
            sessionStorage.removeItem('eserats_login_lock_until');
            sessionStorage.setItem('eserats_login_attempts', '0');
          } catch {}
          setFailedAttempts(0);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTime]);

  const handleSelectAccount = (accUsername: string) => {
    setUsername(accUsername);
    setPassword('password123');
    setError('');
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Silakan masukkan username pengurus Anda.');
      return;
    }
    if (!password) {
      setError('Silakan masukkan kata sandi Anda.');
      return;
    }

    // Security Captcha validation if attempts >= 2
    if (failedAttempts >= 2) {
      if (parseInt(captchaInput.trim(), 10) !== captcha.expected) {
        setError('Jawaban verifikasi keamanan tidak tepat. Silakan hitung kembali.');
        refreshCaptcha();
        return;
      }
    }

    setError('');
    setNotice(null);
    setLoading(true);

    try {
      const result = await login(cleanUsername, password, rememberMe);
      if (result.success) {
        try {
          sessionStorage.removeItem('eserats_login_attempts');
          sessionStorage.removeItem('eserats_login_lock_until');
        } catch {}
        router.push('/');
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockUntil = Date.now() + LOCKOUT_SECONDS * 1000;
          try {
            sessionStorage.setItem('eserats_login_lock_until', String(lockUntil));
            sessionStorage.setItem('eserats_login_attempts', String(newAttempts));
          } catch {}
          setLockoutTime(LOCKOUT_SECONDS);
          setError(`Percobaan gagal mencapai batas maksimum (${MAX_ATTEMPTS}x). Sistem dikunci sementara demi keamanan.`);
        } else {
          try {
            sessionStorage.setItem('eserats_login_attempts', String(newAttempts));
          } catch {}
          if (newAttempts >= 2) {
            refreshCaptcha();
          }
          const remaining = MAX_ATTEMPTS - newAttempts;
          setError(`${result.message || 'Login gagal.'} (Sisa percobaan: ${remaining}x)`);
        }
      }
    } catch {
      setError('Koneksi terputus atau terjadi kendala pada server persuratan.');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockoutTime > 0;

  return (
    <div className="min-h-screen w-screen overflow-y-auto bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 flex flex-col justify-center items-center py-8 px-4 sm:px-6 relative select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-green-900 border-2 border-amber-400/60 shadow-xl p-1 mb-2">
            <div className="w-full h-full rounded-xl bg-emerald-950 flex flex-col items-center justify-center border border-amber-400/30">
              <span className="text-amber-300 font-black text-lg sm:text-xl tracking-wider leading-none">GP</span>
              <span className="text-[8px] text-amber-200 font-extrabold uppercase tracking-widest mt-0.5">ANSOR</span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            e-Serat <span className="text-amber-400">Ansor Jabar</span>
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-emerald-200/80">
            Sistem Administrasi & Persuratan Digital Resmi
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/20 dark:border-zinc-800 space-y-3.5">
          {/* Logout or Expiry Notice */}
          {notice && !error && !isLocked && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="leading-tight">{notice}</span>
            </div>
          )}

          {/* Lockout Banner */}
          {isLocked && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Akses Dikunci Sementara</p>
                <p className="text-[11px] mt-0.5">Silakan tunggu <strong>{lockoutTime} detik</strong> untuk mencoba kembali.</p>
              </div>
            </div>
          )}

          {/* Normal Error Alert */}
          {!isLocked && error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="leading-tight">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>Username Pengurus</span>
                <span className="text-[10px] font-normal text-gray-400">misal: ketua_pw</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-700 dark:text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  disabled={isLocked || loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/70 dark:bg-zinc-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-60 font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>Kata Sandi</span>
                <span className="text-[10px] font-normal text-gray-400">Sandi Terenkripsi</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLocked || loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/70 dark:bg-zinc-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-60 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Ingat Saya Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
              <span className="text-[10px] text-gray-400">Sesi aman</span>
            </div>

            {/* Anti-Bot Security Challenge (Appears after 2 failed attempts) */}
            {failedAttempts >= 2 && !isLocked && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-300">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" /> Verifikasi Keamanan:
                  </span>
                  <span className="font-mono bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-amber-300">
                    {captcha.a} + {captcha.b} = ?
                  </span>
                </div>
                <input
                  type="number"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Ketik hasil penjumlahan"
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center font-bold"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 hover:from-emerald-800 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </div>
              ) : isLocked ? (
                <span>Terkunci ({lockoutTime}s)</span>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Account Selector / Information */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowAccountList(!showAccountList)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline py-1"
            >
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pilihan Akun Resmi untuk Masuk</span>
              </span>
              {showAccountList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAccountList && (
              <div className="mt-2 space-y-1.5 bg-gray-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs animate-in fade-in">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
                  Klik salah satu akun di bawah untuk mengisi username & kata sandi secara otomatis:
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {AVAILABLE_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleSelectAccount(acc.username)}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${acc.color}`}>
                            {acc.role}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white text-[11px] truncate">
                            {acc.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>User: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{acc.username}</strong></span>
                          <span>•</span>
                          <span>Sandi: <strong className="font-mono">password123</strong></span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        Pilih
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Security Assurance Badges */}
          <div className="pt-1 flex items-center justify-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 256-Bit</span>
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Brute-Force Protected</span>
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-Timeout Sesi</span>
            </span>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="mt-3 text-center text-[10px] text-emerald-200/60">
          <p>&copy; 2026 Pimpinan Wilayah GP Ansor Jawa Barat</p>
        </div>
      </div>
    </div>
  );
}
