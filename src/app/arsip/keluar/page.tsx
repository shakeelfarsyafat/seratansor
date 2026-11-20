'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOutgoingLetters } from '@/lib/storage';
import { OutgoingLetter } from '@/types';
import {
  Archive, Search, Filter, Lock, CheckCircle2, ExternalLink,
  ChevronDown, Calendar, FileText, Eye, ShieldCheck,
} from 'lucide-react';

export default function ArsipKeluarPage() {
  const [letters, setLetters] = useState<OutgoingLetter[]>([]);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [selectedLetter, setSelectedLetter] = useState<OutgoingLetter | null>(null);

  useEffect(() => {
    const all = getOutgoingLetters().filter((l) => l.isArchived || l.status === 'Ditandatangani');
    setLetters(all);
  }, []);

  const years = ['Semua', ...Array.from(new Set(letters.map((l) => l.dateGregorian.split(' ').pop() || ''))).filter(Boolean).sort().reverse()];
  const categories = ['Semua', ...Array.from(new Set(letters.map((l) => l.category)))];

  const filtered = letters.filter((l) => {
    const matchSearch =
      l.subject.toLowerCase().includes(search.toLowerCase()) ||
      l.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.destination.toLowerCase().includes(search.toLowerCase());
    const matchYear = yearFilter === 'Semua' || l.dateGregorian.includes(yearFilter);
    const matchCat = categoryFilter === 'Semua' || l.category === categoryFilter;
    return matchSearch && matchYear && matchCat;
  });

  return (
    <div className="flex flex-col gap-2 w-full h-[calc(100vh-3.75rem)] overflow-hidden">
      {/* 1. Header Minimalis */}
      <div className="shrink-0 flex items-center justify-between pb-1.5 border-b border-gray-200/80 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Archive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
              Arsip Surat Keluar
            </h1>
            <p className="text-[10px] text-gray-500 truncate hidden sm:block">
              Surat resmi yang telah sah ditandatangani dan diarsipkan — {filtered.length} dokumen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tersertifikasi Digital</span>
        </div>
      </div>

      {/* 2. 4 Kartu Statistik Konsisten */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Total Arsip */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Total Arsip</span>
            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none mt-0.5 block">{letters.length}</span>
            <span className="text-[9px] text-gray-400">Arsip permanen tersimpan</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <Archive className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Surat Sah / Terkunci */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300/80 dark:border-emerald-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide block">Sah & Terkunci</span>
            <span className="text-base sm:text-lg font-black text-emerald-600 leading-none mt-0.5 block">
              {letters.filter(l => l.isLocked || l.status === 'Ditandatangani').length}
            </span>
            <span className="text-[9px] text-emerald-600/80">Keabsahan QR aktif</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Jenis Klasifikasi */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Kategori</span>
            <span className="text-base sm:text-lg font-black text-gray-700 dark:text-zinc-200 leading-none mt-0.5 block">
              {categories.filter(c => c !== 'Semua').length} Jenis
            </span>
            <span className="text-[9px] text-gray-400">Klasifikasi persuratan</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Tahun Berjalan */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Tahun Ini</span>
            <span className="text-base sm:text-lg font-black text-gray-700 dark:text-zinc-200 leading-none mt-0.5 block">
              {letters.filter(l => l.dateGregorian?.includes('2026')).length}
            </span>
            <span className="text-[9px] text-gray-400">Dokumen periode 2026</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. Bar Filter Ringkas 1 Baris */}
      <div className="shrink-0 flex items-center gap-2 p-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Cari nomor arsip, perihal, atau tujuan..."
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

        <div className="relative shrink-0">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="pl-2.5 pr-6 py-1 text-xs border border-gray-200/80 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-800 appearance-none cursor-pointer h-7 sm:h-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 dark:text-gray-300"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* 4. Tabel Arsip Surat Keluar (Header Lengket & Scroll Internal) */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Archive className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tidak ada dokumen arsip ditemukan</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Ubah filter pencarian untuk menemukan dokumen yang sesuai</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-gray-50/95 dark:bg-zinc-800/95 backdrop-blur-xs z-10 border-b border-gray-200/80 dark:border-zinc-800 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2">No. Arsip & Status</th>
                  <th className="px-3 py-2">Perihal & Tujuan</th>
                  <th className="px-3 py-2 hidden md:table-cell">Tanggal</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Kategori</th>
                  <th className="px-3 py-2">Kode Verifikasi</th>
                  <th className="px-3 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {filtered.map((letter) => (
                  <tr key={letter.id} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {letter.isLocked && <span title="Terkunci & Sah"><Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" /></span>}
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {letter.category}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/60 inline-block">
                        🔒 {letter.verificationCode}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedLetter(letter)}
                          className="p-1 rounded-md text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          title="Lihat Detail Ringkas"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/surat/keluar/${letter.id}`}
                          className="p-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Lihat Format Surat Lengkap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Status Bar Bawah */}
        <div className="shrink-0 px-3 py-1.5 bg-gray-50/80 dark:bg-zinc-800/50 border-t border-gray-200/80 dark:border-zinc-800 text-[10px] text-gray-500 flex items-center justify-between">
          <span>Menampilkan {filtered.length} arsip surat keluar</span>
          <span className="font-medium text-emerald-700 dark:text-emerald-400">Filter tahun: {yearFilter}</span>
        </div>
      </div>

      {/* Modal Detail Arsip Surat */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto border border-gray-200 dark:border-zinc-800 flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Detail Arsip Surat Keluar</h2>
                <p className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">{selectedLetter.referenceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedLetter(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto text-xs">
              <div className="space-y-1.5">
                {[
                  ['Perihal', selectedLetter.subject],
                  ['Kepada', selectedLetter.destination],
                  ['Tanggal', `${selectedLetter.dateGregorian} / ${selectedLetter.dateHijri}`],
                  ['Kategori', selectedLetter.category],
                  ['Dibuat Oleh', selectedLetter.createdByName],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-2 text-xs">
                    <span className="w-24 shrink-0 text-gray-400">{label}:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{val}</span>
                  </div>
                ))}
              </div>

              {/* Signers */}
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-2.5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Penandatangan Dokumen</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedLetter.signers.map((s) => (
                    <div key={s.id} className="p-2 rounded-lg border border-emerald-200/80 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-center text-xs">
                      <p className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">{s.role}</p>
                      <p className="font-bold text-gray-800 dark:text-white text-xs mt-0.5">{s.userName}</p>
                      <p className="text-[10px] text-gray-500">{s.userPosition}</p>
                      {s.signedAt && <p className="text-[9px] text-emerald-600 mt-1">{new Date(s.signedAt).toLocaleDateString('id-ID')}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Data preview */}
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-2.5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Isi Data Surat</p>
                <div className="space-y-1 bg-gray-50 dark:bg-zinc-800/40 rounded-lg p-2.5 border border-gray-200/80 dark:border-zinc-800">
                  {Object.entries(selectedLetter.dynamicData).map(([k, v]) => (
                    <div key={k} className="text-xs">
                      <span className="text-[10px] text-gray-400 capitalize block font-semibold">{k.replace(/_/g, ' ')}:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium whitespace-pre-line">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Code */}
              <div className="bg-gray-900 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-gray-400 mb-0.5">Kode Keaslian Dokumen</p>
                <p className="text-emerald-400 font-mono font-bold tracking-widest text-xs">{selectedLetter.verificationCode}</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Link
                  href={`/surat/keluar/${selectedLetter.id}`}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors text-center flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Format Surat Resmi
                </Link>
                <Link
                  href={`/verifikasi/${selectedLetter.verificationCode}`}
                  target="_blank"
                  className="px-3 py-1.5 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Verifikasi Publik
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
