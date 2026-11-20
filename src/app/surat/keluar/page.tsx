'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getOutgoingLetters,
  saveOutgoingLetters,
  logActivity,
} from '@/lib/storage';
import { OutgoingLetter, LetterStatus } from '@/types';
import {
  FileText, Search, Filter, Eye, Trash2,
  CheckCircle2, Clock, FileEdit, XCircle, Lock,
  Archive, ChevronDown, Plus, Printer,
} from 'lucide-react';

const STATUS_BADGE: Record<LetterStatus, { bg: string; text: string; border: string }> = {
  Draft: { bg: 'bg-slate-100 dark:bg-zinc-800', text: 'text-slate-700 dark:text-zinc-300', border: 'border-slate-300 dark:border-zinc-700' },
  Diajukan: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
  Ditandatangani: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  Ditolak: { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800' },
};

const STATUS_ICONS: Record<LetterStatus, React.ReactNode> = {
  Draft: <FileEdit className="w-3.5 h-3.5" />,
  Diajukan: <Clock className="w-3.5 h-3.5" />,
  Ditandatangani: <CheckCircle2 className="w-3.5 h-3.5" />,
  Ditolak: <XCircle className="w-3.5 h-3.5" />,
};

export default function SuratKeluarPage() {
  const { user, isAdmin } = useAuth();
  const [letters, setLetters] = useState<OutgoingLetter[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LetterStatus | 'Semua'>('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [selectedLetter, setSelectedLetter] = useState<OutgoingLetter | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setLetters(getOutgoingLetters());
  }, []);

  const categories = ['Semua', ...Array.from(new Set(letters.map((l) => l.category)))];

  const filtered = letters.filter((l) => {
    const matchSearch =
      l.subject.toLowerCase().includes(search.toLowerCase()) ||
      l.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || l.status === statusFilter;
    const matchCat = categoryFilter === 'Semua' || l.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const handleDelete = (id: string) => {
    if (!confirm('Yakin ingin menghapus surat ini? Tindakan tidak dapat dibatalkan.')) return;
    const updated = letters.filter((l) => l.id !== id);
    saveOutgoingLetters(updated);
    setLetters(updated);
    logActivity('DELETE_LETTER', `Surat ${id} dihapus`, 'Surat Keluar');
  };

  const handleArchive = (id: string) => {
    const updated = letters.map((l) => (l.id === id ? { ...l, isArchived: true } : l));
    saveOutgoingLetters(updated);
    setLetters(updated);
    logActivity('ARCHIVE_LETTER', `Surat ${id} diarsipkan`, 'Surat Keluar');
  };

  const handlePrint = (letter: OutgoingLetter) => {
    setSelectedLetter(letter);
    setShowDetail(true);
  };

  return (
    <div className="flex flex-col gap-2 w-full h-[calc(100vh-3.75rem)] overflow-hidden">
      {/* 1. Header Minimalis */}
      <div className="shrink-0 flex items-center justify-between pb-1.5 border-b border-gray-200/80 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
              Daftar Surat Keluar
            </h1>
            <p className="text-[10px] text-gray-500 truncate hidden sm:block">
              Total {filtered.length} dari {letters.length} surat tercatat
            </p>
          </div>
        </div>

        {(isAdmin || user?.role === 'Operator') && (
          <Link
            href="/surat/buat"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Surat Baru</span>
          </Link>
        )}
      </div>

      {/* 2. 4 Kartu Statistik Status Konsisten & Interaktif */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {(['Draft', 'Diajukan', 'Ditandatangani', 'Ditolak'] as LetterStatus[]).map((st) => {
          const count = letters.filter((l) => l.status === st).length;
          const isActive = statusFilter === st;

          const colorTheme = {
            Draft: { border: 'border-slate-300/80 dark:border-zinc-700', text: 'text-slate-600 dark:text-zinc-400', iconBg: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300', desc: 'Konsep awal' },
            Diajukan: { border: 'border-amber-300/80 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300', desc: 'Menunggu TTD' },
            Ditandatangani: { border: 'border-emerald-300/80 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300', desc: 'Sah & Tuntas' },
            Ditolak: { border: 'border-rose-300/80 dark:border-rose-800', text: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300', desc: 'Perlu revisi' },
          }[st];

          return (
            <button
              key={st}
              onClick={() => setStatusFilter(statusFilter === st ? 'Semua' : st)}
              className={`p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border text-left flex items-center justify-between shadow-2xs transition-all cursor-pointer ${
                isActive ? 'ring-2 ring-emerald-500 border-emerald-500' : colorTheme.border
              }`}
            >
              <div>
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wide block ${colorTheme.text}`}>
                  {st}
                </span>
                <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none mt-0.5 block">
                  {count}
                </span>
                <span className="text-[9px] text-gray-400">
                  {isActive ? 'Aktif terfilter' : colorTheme.desc}
                </span>
              </div>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorTheme.iconBg}`}>
                {STATUS_ICONS[st]}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Bar Filter Ringkas 1 Baris */}
      <div className="shrink-0 flex items-center gap-2 p-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Cari nomor, perihal, atau tujuan surat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs border border-gray-200/80 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-7 sm:h-8"
          />
        </div>

        <div className="relative shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LetterStatus | 'Semua')}
            className="pl-2.5 pr-6 py-1 text-xs border border-gray-200/80 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-800 appearance-none cursor-pointer h-7 sm:h-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 dark:text-gray-300"
          >
            {(['Semua', 'Draft', 'Diajukan', 'Ditandatangani', 'Ditolak'] as const).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
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

      {/* 4. Tabel Surat dengan Header Lengket & Scroll Internal */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <FileText className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tidak ada surat keluar ditemukan</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Ubah kata kunci filter atau buat surat baru</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-gray-50/95 dark:bg-zinc-800/95 backdrop-blur-xs z-10 border-b border-gray-200/80 dark:border-zinc-800 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2">No. Surat</th>
                  <th className="px-3 py-2">Perihal & Tujuan</th>
                  <th className="px-3 py-2 hidden md:table-cell">Tanggal</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Kategori</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {filtered.map((letter) => {
                  const badge = STATUS_BADGE[letter.status];
                  return (
                    <tr key={letter.id} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {letter.isLocked && <Lock className="w-3 h-3 text-emerald-600 shrink-0" />}
                          {letter.isArchived && <Archive className="w-3 h-3 text-blue-500 shrink-0" />}
                          <span className="font-mono text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                            {letter.referenceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 max-w-[280px]">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{letter.subject}</p>
                        <p className="text-[10px] text-gray-400 line-clamp-1">Kpd: {letter.destination}</p>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-gray-500 dark:text-gray-400 text-[11px] whitespace-nowrap">
                        {letter.dateGregorian}
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-zinc-700">
                          {letter.category}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {STATUS_ICONS[letter.status]}
                          {letter.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/surat/keluar/${letter.id}`}
                            className="p-1 rounded-md text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Detail Surat"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {letter.status === 'Ditandatangani' && (
                            <button
                              onClick={() => handlePrint(letter)}
                              className="p-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              title="Cetak PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!letter.isArchived && letter.status === 'Ditandatangani' && (
                            <button
                              onClick={() => handleArchive(letter.id)}
                              className="p-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              title="Arsipkan"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(isAdmin || (user?.role === 'Operator' && letter.status === 'Draft')) && (
                            <button
                              onClick={() => handleDelete(letter.id)}
                              className="p-1 rounded-md text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Status Bar Bawah */}
        <div className="shrink-0 px-3 py-1.5 bg-gray-50/80 dark:bg-zinc-800/50 border-t border-gray-200/80 dark:border-zinc-800 text-[10px] text-gray-500 flex items-center justify-between">
          <span>Menampilkan {filtered.length} surat keluar</span>
          <span className="font-medium text-emerald-700 dark:text-emerald-400">Status filter: {statusFilter}</span>
        </div>
      </div>

      {/* Modal Detail Surat */}
      {showDetail && selectedLetter && (
        <LetterDetailModal letter={selectedLetter} onClose={() => setShowDetail(false)} />
      )}
    </div>
  );
}

function LetterDetailModal({ letter, onClose }: { letter: OutgoingLetter; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto border border-gray-200 dark:border-zinc-800 flex flex-col">
        {/* Header Modal */}
        <div className="p-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Detail Dokumen Surat</h2>
            <p className="text-[10px] text-gray-500 font-mono">{letter.referenceNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors cursor-pointer">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Surat */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto text-xs">
          <div className="border border-emerald-900/30 rounded-lg p-4 bg-white dark:bg-zinc-950">
            <div className="text-center mb-3 pb-3 border-b-2 border-emerald-900/40">
              <h3 className="font-bold text-xs text-emerald-900 dark:text-emerald-400 uppercase tracking-wide">PIMPINAN WILAYAH GERAKAN PEMUDA ANSOR</h3>
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">PROVINSI JAWA BARAT</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Sekretariat: Jl. Pasirkoja No. 248 Bandung 40222</p>
            </div>

            <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-gray-500">Nomor:</span>
                <span className="font-semibold text-gray-900 dark:text-white font-mono">{letter.referenceNumber}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-gray-500">Perihal:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{letter.subject}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-gray-500">Kepada:</span>
                <span className="text-gray-900 dark:text-white font-medium">{letter.destination}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-gray-500">Tanggal:</span>
                <span>{letter.placeOfLetter}, {letter.dateGregorian} ({letter.dateHijri})</span>
              </div>

              {/* Dynamic data */}
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-1">
                {Object.entries(letter.dynamicData).map(([k, v]) => (
                  <div key={k} className="p-2 rounded bg-gray-50 dark:bg-zinc-800/50">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide block font-semibold">{k.replace(/_/g, ' ')}:</span>
                    <p className="text-gray-800 dark:text-gray-200 text-xs whitespace-pre-line mt-0.5">{String(v)}</p>
                  </div>
                ))}
              </div>

              {/* Signers */}
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Penandatangan</p>
                <div className="grid grid-cols-2 gap-2">
                  {letter.signers.map((s) => (
                    <div key={s.id} className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase">{s.role}</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-white mt-0.5">{s.userName}</p>
                      <span className={`inline-block mt-1 text-[9px] font-semibold px-2 py-0.2 rounded-full ${
                        s.status === 'Ditandatangani' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'Ditolak' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Code */}
              <div className="mt-3 p-2 bg-gray-900 rounded-lg text-center">
                <p className="text-[10px] text-gray-400">Kode Verifikasi Dokumen</p>
                <p className="text-emerald-400 font-mono font-bold tracking-widest text-xs">{letter.verificationCode}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Dokumen
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
