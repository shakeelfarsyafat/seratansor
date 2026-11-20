'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/storage';
import {
  UserCheck,
  Key,
  PenTool,
  Upload,
  RotateCcw,
  Check,
  Shield,
  Phone,
  Mail,
  AlertCircle,
  Eye,
} from 'lucide-react';

export default function ProfilPage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [position, setPosition] = useState(user?.position || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Signatures
  const [signatureData, setSignatureData] = useState<string>(user?.signaturePath || '');
  const [parafData, setParafData] = useState<string>(user?.parafPath || '');

  // Notification
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Canvas Drawing for Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setPosition(user.position || '');
      setSignatureData(user.signaturePath || '');
      setParafData(user.parafPath || '');
    }
  }, [user]);

  // Setup canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f766e'; // emerald/teal signature ink
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'paraf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAlertMsg({ text: 'Ukuran berkas melebihi 2MB. Silakan gunakan berkas yang lebih kecil.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'signature') {
        setSignatureData(dataUrl);
      } else {
        setParafData(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      setAlertMsg({ text: 'Konfirmasi kata sandi baru tidak cocok.', type: 'error' });
      return;
    }

    updateUser({
      name,
      phone,
      position,
      signaturePath: signatureData,
      parafPath: parafData,
    });

    logActivity('UPDATE_PROFILE', `Memperbarui data profil & tanda tangan pribadi (${user?.role})`, 'Profil');
    setAlertMsg({ text: 'Data profil dan tanda tangan digital Anda berhasil diperbarui!', type: 'success' });

    // Reset password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Profil & Tanda Tangan Saya</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Kelola data identitas pengurus, kata sandi, serta berkas tanda tangan & paraf resmi untuk penandatanganan surat
            </p>
          </div>
        </div>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-xs font-bold hover:opacity-80">
            Tutup
          </button>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Data Identitas */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> Identitas Pengurus
            </h2>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              Peran: {user?.role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nama Lengkap & Gelar</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Alamat Email (Akun)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/60 text-xs text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nomor WhatsApp / HP</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Jabatan di GP Ansor Jabar</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: Ketua PW GP Ansor Jawa Barat"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Tanda Tangan & Paraf Digital */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-emerald-600" /> Tanda Tangan & Paraf Digital
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Digunakan secara sah pada surat keluar yang telah Anda verifikasi dan setujui. Anda dapat menggambar langsung di kanvas atau mengunggah gambar berkas PNG transparan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Signature Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Tanda Tangan Utama
                </span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Bersihkan Kanvas
                </button>
              </div>

              {/* Drawing Canvas */}
              <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-2 bg-gray-50/70 dark:bg-zinc-800/40 text-center relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 bg-white dark:bg-zinc-900 rounded-xl cursor-crosshair touch-none shadow-xs border border-gray-200 dark:border-zinc-700"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  Gambar tanda tangan Anda di area putih di atas menggunakan mouse atau sentuhan layar
                </span>
              </div>

              {/* Preview or Upload */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Unggah Berkas Gambar</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => handleFileUpload(e, 'signature')}
                    className="hidden"
                  />
                </label>

                {signatureData && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Tersimpan
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Paraf Box */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Paraf Singkat
              </span>

              <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-4 bg-gray-50/70 dark:bg-zinc-800/40 text-center flex flex-col items-center justify-center min-h-[140px]">
                {parafData ? (
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xs max-w-[200px]">
                    <img src={parafData} alt="Paraf Preview" className="h-20 object-contain mx-auto" />
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs space-y-1">
                    <PenTool className="w-6 h-6 mx-auto opacity-50" />
                    <p>Belum ada berkas paraf singkat</p>
                  </div>
                )}
              </div>

              <div className="pt-1 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Unggah Berkas Paraf</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => handleFileUpload(e, 'paraf')}
                    className="hidden"
                  />
                </label>

                {parafData && (
                  <button
                    type="button"
                    onClick={() => setParafData('')}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    Hapus Paraf
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Ganti Kata Sandi */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" /> Ganti Kata Sandi
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Kosongkan bagian ini jika Anda tidak ingin mengubah kata sandi akun
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Kata Sandi Sekarang</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Kata Sandi Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Konfirmasi Sandi Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi sandi baru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-800 hover:to-green-700 text-white font-bold text-xs shadow-lg shadow-emerald-950/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Perubahan Profil & Tanda Tangan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
