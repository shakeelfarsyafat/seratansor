'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getOutgoingLetters, saveOutgoingLetters, logActivity, addNotification,
} from '@/lib/storage';
import { OutgoingLetter } from '@/types';
import Link from 'next/link';
import {
  FileCheck, Clock, CheckCircle2, XCircle, AlertTriangle,
  Pen, ChevronDown, User, Calendar, Eye, Search,
} from 'lucide-react';

export default function TandaTanganPage() {
  const { user, isLeader, isAdmin, isKetua, isSekretaris } = useAuth();
  const [letters, setLetters] = useState<OutgoingLetter[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [selectedLetter, setSelectedLetter] = useState<OutgoingLetter | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadLetters();
  }, [user]);

  const loadLetters = () => {
    const all = getOutgoingLetters();
    // Only show letters waiting for THIS user's signature
    const pending = all.filter((l) => {
      if (l.status !== 'Diajukan') return false;
      return l.signers.some((s) => {
        if (s.status !== 'Menunggu') return false;
        if (isKetua && s.role === 'Ketua') return true;
        if (isSekretaris && s.role === 'Sekretaris') return true;
        if (isAdmin) return true;
        return false;
      });
    });
    setLetters(pending);
  };

  const canSign = (letter: OutgoingLetter): boolean => {
    if (isAdmin) return true;
    const userSigner = letter.signers.find((s) => {
      if (s.status !== 'Menunggu') return false;
      if (isKetua && s.role === 'Ketua') return true;
      if (isSekretaris && s.role === 'Sekretaris') return true;
      return false;
    });
    if (userSigner?.order === 2) {
      const order1 = letter.signers.find((s) => s.order === 1);
      if (order1 && order1.status === 'Menunggu') return false;
    }
    return !!userSigner;
  };

  const handleSign = (letter: OutgoingLetter) => {
    if (!user || !canSign(letter)) return;
    setProcessing(true);

    const allLetters = getOutgoingLetters();
    const updated = allLetters.map((l) => {
      if (l.id !== letter.id) return l;
      const newSigners = l.signers.map((s) => {
        const matches = (isKetua && s.role === 'Ketua') || (isSekretaris && s.role === 'Sekretaris') || isAdmin;
        if (matches && s.status === 'Menunggu') {
          return { ...s, status: 'Ditandatangani' as const, signedAt: new Date().toISOString() };
        }
        return s;
      });
      const allSigned = newSigners.every((s) => s.status === 'Ditandatangani');
      return {
        ...l,
        signers: newSigners,
        status: allSigned ? ('Ditandatangani' as const) : l.status,
        signedAt: allSigned ? new Date().toISOString() : undefined,
        isLocked: allSigned,
        isArchived: allSigned,
      };
    });

    saveOutgoingLetters(updated);
    logActivity('SIGN_LETTER', `Surat ${letter.referenceNumber} ditandatangani oleh ${user.name}`, 'Tanda Tangan');
    addNotification({
      title: 'Surat Ditandatangani',
      message: `Surat "${letter.subject}" telah ditandatangani oleh ${user.name}.`,
      type: 'success',
      letterId: letter.id,
    });

    setSuccessMsg(`✅ Berhasil menandatangani: ${letter.referenceNumber}`);
    setSelectedLetter(null);
    setProcessing(false);
    loadLetters();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleReject = (letter: OutgoingLetter) => {
    if (!user || !rejectNote.trim()) return;
    setProcessing(true);

    const allLetters = getOutgoingLetters();
    const updated = allLetters.map((l) => {
      if (l.id !== letter.id) return l;
      const newSigners = l.signers.map((s) => {
        const matches = (isKetua && s.role === 'Ketua') || (isSekretaris && s.role === 'Sekretaris') || isAdmin;
        if (matches && s.status === 'Menunggu') {
          return { ...s, status: 'Ditolak' as const, notes: rejectNote };
        }
        return s;
      });
      return { ...l, signers: newSigners, status: 'Ditolak' as const, rejectionNotes: rejectNote };
    });

    saveOutgoingLetters(updated);
    logActivity('REJECT_LETTER', `Surat ${letter.referenceNumber} ditolak: ${rejectNote}`, 'Tanda Tangan');
    addNotification({
      title: 'Surat Ditolak',
      message: `Surat "${letter.subject}" ditolak. Alasan: ${rejectNote}`,
      type: 'danger',
      letterId: letter.id,
    });

    setSuccessMsg(`❌ Surat ${letter.referenceNumber} ditolak dengan catatan.`);
    setSelectedLetter(null);
    setShowRejectForm(false);
    setRejectNote('');
    setProcessing(false);
    loadLetters();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const categories = ['Semua', ...Array.from(new Set(letters.map((l) => l.category)))];

  const filtered = letters.filter((l) => {
    const matchSearch =
      l.subject.toLowerCase().includes(search.toLowerCase()) ||
      l.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.destination.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'Semua' || l.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const signableCount = letters.filter((l) => canSign(l)).length;
  const waitingOrderCount = letters.length - signableCount;

  if (!isLeader && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.75rem)] text-center p-6">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
        <h2 className="text-sm font-bold text-gray-800 dark:text-white">Akses Terbatas</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">Halaman verifikasi dan persetujuan tanda tangan digital hanya dapat diakses oleh Ketua, Sekretaris, dan Administrator.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full h-[calc(100vh-3.75rem)] overflow-hidden">
      {/* 1. Header Minimalis */}
      <div className="shrink-0 flex items-center justify-between pb-1.5 border-b border-gray-200/80 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
              Menunggu Tanda Tangan
            </h1>
            <p className="text-[10px] text-gray-500 truncate hidden sm:block">
              Antrean persetujuan & legalisasi sebagai <strong className="text-emerald-700 dark:text-emerald-400">{user?.role}</strong>
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 animate-fade-in">
            {successMsg}
          </div>
        )}
      </div>

      {/* 2. 4 Kartu Statistik Konsisten */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Total Menunggu */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Antrean TTD</span>
            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none mt-0.5 block">{letters.length}</span>
            <span className="text-[9px] text-gray-400">Total surat masuk antrean</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Siap Ditandatangani */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300/80 dark:border-emerald-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide block">Siap TTD</span>
            <span className="text-base sm:text-lg font-black text-emerald-600 leading-none mt-0.5 block">{signableCount}</span>
            <span className="text-[9px] text-emerald-600/80">Giliran Anda sekarang</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center shrink-0">
            <Pen className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Menunggu Urutan */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wide block">Menunggu Urutan</span>
            <span className="text-base sm:text-lg font-black text-slate-700 dark:text-zinc-200 leading-none mt-0.5 block">{waitingOrderCount}</span>
            <span className="text-[9px] text-gray-400">Menunggu TTD Ketua/Sekretaris</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Peran Anda */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Otoritas</span>
            <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 leading-none mt-0.5 block truncate max-w-[120px]">{user?.name}</span>
            <span className="text-[9px] text-gray-400">Sebagai {user?.role}</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. Bar Filter Ringkas 1 Baris */}
      <div className="shrink-0 flex items-center gap-2 p-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Cari nomor, perihal, atau tujuan surat antrean TTD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs border border-gray-200/80 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-7 sm:h-8"
          />
        </div>

        <div className="relative shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-2.5 pr-6 py-1 text-xs border border-gray-200/80 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-800 appearance-none cursor-pointer h-7 sm:h-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 dark:text-gray-300"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* 4. Daftar Surat Menunggu TTD (Scroll Internal Sehalaman) */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mx-auto mb-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-800 dark:text-white">Tidak Ada Surat Menunggu TTD</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Semua surat sudah ditandatangani atau tidak ada pengajuan baru</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-2 sm:p-2.5 space-y-2">
            {filtered.map((letter) => {
              const signable = canSign(letter);
              const blockedBy = !signable ? letter.signers.find((s) => s.order === 1 && s.status === 'Menunggu') : null;

              return (
                <div
                  key={letter.id}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                    signable
                      ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/20 dark:bg-amber-950/10 hover:shadow-xs'
                      : 'border-gray-200/80 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {signable ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            ⚡ Giliran Anda TTD
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700">
                            Menunggu Urutan
                          </span>
                        )}
                        <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {letter.category}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          {letter.referenceNumber}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-1">{letter.subject}</h3>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">Tujuan: <strong className="text-gray-700 dark:text-gray-300">{letter.destination}</strong></p>

                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {letter.dateGregorian}
                        </span>
                        <span>Dibuat: {letter.createdByName}</span>
                      </div>

                      {blockedBy && (
                        <div className="mt-2 p-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[10px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Menunggu tanda tangan <strong>{blockedBy.role} ({blockedBy.userName})</strong> terlebih dahulu</span>
                        </div>
                      )}
                    </div>

                    {/* Aksi */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center mt-1 sm:mt-0">
                      <Link
                        href={`/surat/keluar/${letter.id}`}
                        className="px-2.5 py-1 text-xs font-semibold border border-gray-200/80 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-gray-500" />
                        <span>Pratinjau</span>
                      </Link>

                      {signable && (
                        <>
                          <button
                            onClick={() => { setShowRejectForm(true); setSelectedLetter(letter); }}
                            className="px-2.5 py-1 text-xs font-semibold border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleSign(letter)}
                            disabled={processing}
                            className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                          >
                            <Pen className="w-3 h-3" />
                            <span>Tandatangani</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Signers Progress Bar Mini */}
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {letter.signers.map((s) => (
                      <div key={s.id} className={`p-1.5 rounded-lg flex items-center gap-2 text-[10px] ${
                        s.status === 'Ditandatangani' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' :
                        s.status === 'Ditolak' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300' :
                        'bg-gray-50 dark:bg-zinc-800/60 text-gray-600 dark:text-gray-400'
                      }`}>
                        {s.status === 'Ditandatangani' ? <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> :
                         s.status === 'Ditolak' ? <XCircle className="w-3 h-3 text-rose-600 shrink-0" /> :
                         <Clock className="w-3 h-3 text-amber-500 shrink-0" />}
                        <div className="min-w-0 flex-1 truncate">
                          <span className="font-bold">{s.role} ({s.userName}):</span> <span>{s.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Status Bar Bawah */}
        <div className="shrink-0 px-3 py-1.5 bg-gray-50/80 dark:bg-zinc-800/50 border-t border-gray-200/80 dark:border-zinc-800 text-[10px] text-gray-500 flex items-center justify-between">
          <span>Menampilkan {filtered.length} surat menunggu persetujuan</span>
          <span className="font-medium text-amber-700 dark:text-amber-400">Siap TTD: {signableCount} berkas</span>
        </div>
      </div>

      {/* Modal Tolak Surat */}
      {showRejectForm && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm p-4 border border-gray-200 dark:border-zinc-800">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Tolak Dokumen Surat</h2>
            <p className="text-[11px] text-gray-500 mb-2 truncate">
              {selectedLetter.referenceNumber} - {selectedLetter.subject}
            </p>
            <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1">
              Alasan Penolakan <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Tuliskan catatan perbaikan atau alasan penolakan..."
              rows={3}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none text-gray-800 dark:text-white"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setShowRejectForm(false); setSelectedLetter(null); setRejectNote(''); }}
                className="flex-1 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleReject(selectedLetter)}
                disabled={!rejectNote.trim() || processing}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
