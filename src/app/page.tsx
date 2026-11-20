'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getOutgoingLetters, getIncomingLetters } from '@/lib/storage';
import { OutgoingLetter, IncomingLetter } from '@/types';
import {
  FileText,
  Inbox,
  Clock,
  FileEdit,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLeader, isAdmin } = useAuth();
  const [outgoing, setOutgoing] = useState<OutgoingLetter[]>([]);
  const [incoming, setIncoming] = useState<IncomingLetter[]>([]);

  useEffect(() => {
    setOutgoing(getOutgoingLetters());
    setIncoming(getIncomingLetters());
  }, []);

  // Stats calculation
  const totalIncoming = incoming.length;
  const totalOutgoing = outgoing.length;
  const totalDraft = outgoing.filter((l) => l.status === 'Draft').length;

  // Letters waiting for signature by current user (or general leader)
  const pendingSignatures = outgoing.filter((l) => {
    if (l.status !== 'Diajukan') return false;
    return l.signers.some((s) => {
      if (s.status !== 'Menunggu') return false;
      if (user?.role === 'Ketua' && s.role === 'Ketua') return true;
      if (user?.role === 'Sekretaris' && s.role === 'Sekretaris') return true;
      if (isAdmin) return true;
      return false;
    });
  });

  const totalSigned = outgoing.filter((l) => l.status === 'Ditandatangani').length;
  const recentOutgoing = [...outgoing].slice(0, 4);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* 1. Header Minimalis: Cukup Selamat Datang [Nama] */}
      <div className="shrink-0 flex items-center justify-between pb-1 border-b border-gray-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
            Selamat datang, <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{user?.name}</span>
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
            {user?.role}
          </span>
        </div>
        <div className="text-[11px] text-gray-500 font-medium hidden sm:block shrink-0">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* 2. Alert Ringkas Menunggu TTD (Jika ada) */}
      {isLeader && pendingSignatures.length > 0 && (
        <div className="shrink-0 flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
            <span className="text-amber-900 dark:text-amber-200 text-xs truncate">
              Ada <strong className="text-amber-700 dark:text-amber-300">{pendingSignatures.length} surat</strong> menunggu tanda tangan Anda
            </span>
          </div>
          <Link
            href="/surat/tanda-tangan"
            className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-0.5 shrink-0"
          >
            <span>Tinjau Surat</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* 3. 5 Kartu Statistik Ringkas & Padat */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Surat Masuk */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Surat Masuk</span>
            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none mt-0.5 block">{totalIncoming}</span>
            <span className="text-[9px] text-gray-400">Total arsip</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <Inbox className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Surat Keluar */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Surat Keluar</span>
            <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none mt-0.5 block">{totalOutgoing}</span>
            <span className="text-[9px] text-gray-400">Total registrasi</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Menunggu TTD */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300/80 dark:border-amber-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 uppercase tracking-wide block">Menunggu TTD</span>
            <span className="text-base sm:text-lg font-black text-amber-600 leading-none mt-0.5 block">{pendingSignatures.length}</span>
            <span className="text-[9px] text-amber-600/80">Persetujuan</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Draft Surat */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Draft Surat</span>
            <span className="text-base sm:text-lg font-black text-gray-700 dark:text-gray-300 leading-none mt-0.5 block">{totalDraft}</span>
            <span className="text-[9px] text-gray-400">Belum diajukan</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 flex items-center justify-center shrink-0">
            <FileEdit className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Telah Sah & QR */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300/80 dark:border-emerald-800 flex items-center justify-between shadow-2xs col-span-2 sm:col-span-1">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">Telah Sah & QR</span>
            <span className="text-base sm:text-lg font-black text-emerald-600 leading-none mt-0.5 block">{totalSigned}</span>
            <span className="text-[9px] text-emerald-600/80">Tersertifikasi</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 4. Bagian Bawah: Grafik & Surat Terbaru (Presisi Sehalaman) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Kolom Kiri: Grafik Batang Bulanan */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-2.5 sm:p-3 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between h-52 sm:h-56">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <h2 className="text-xs font-bold text-gray-900 dark:text-white">
                Statistik Surat Masuk vs Keluar (2026)
              </h2>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-blue-500"></span> Masuk
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-emerald-600"></span> Keluar
              </span>
            </div>
          </div>

          {/* Bar Chart Flex */}
          <div className="flex-1 flex items-end justify-between gap-1 sm:gap-1.5 pt-2 min-h-0">
            {[
              { m: 'Jan', in: 6, out: 12 },
              { m: 'Feb', in: 8, out: 14 },
              { m: 'Mar', in: 12, out: 18 },
              { m: 'Apr', in: 15, out: 24 },
              { m: 'Mei', in: 10, out: 16 },
              { m: 'Jun', in: 14, out: 20 },
              { m: 'Jul', in: 9, out: 15 },
              { m: 'Agu', in: 18, out: 26 },
              { m: 'Sep', in: 14, out: 22 },
              { m: 'Okt', in: 22, out: 30 },
              { m: 'Nov', in: 16, out: 20 },
              { m: 'Des', in: 11, out: 17 },
            ].map((col, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-0.5 h-[calc(100%-16px)]">
                  <div
                    style={{ height: `${(col.in / 30) * 100}%` }}
                    className="w-1.5 sm:w-2.5 bg-blue-500 hover:bg-blue-600 rounded-t-xs transition-all"
                    title={`Surat Masuk ${col.m}: ${col.in}`}
                  />
                  <div
                    style={{ height: `${(col.out / 30) * 100}%` }}
                    className="w-1.5 sm:w-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-t-xs transition-all"
                    title={`Surat Keluar ${col.m}: ${col.out}`}
                  />
                </div>
                <span className="text-[8px] sm:text-[9px] text-gray-400 font-medium group-hover:text-emerald-700">
                  {col.m}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: 4 Surat Terbaru */}
        <div className="bg-white dark:bg-zinc-900 p-2.5 sm:p-3 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between h-52 sm:h-56">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-zinc-800 shrink-0">
            <h2 className="text-xs font-bold text-gray-900 dark:text-white">Surat Terbaru</h2>
            <Link
              href="/surat/keluar"
              className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center"
            >
              Lihat Semua <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-between pt-1 gap-1 min-h-0">
            {recentOutgoing.map((letItem) => (
              <Link
                key={letItem.id}
                href={`/surat/keluar/${letItem.id}`}
                className="p-1.5 rounded-lg bg-gray-50/70 hover:bg-emerald-50/50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 text-xs transition-colors flex flex-col justify-center"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-emerald-800 dark:text-emerald-400 truncate max-w-[130px]">
                    {letItem.referenceNumber}
                  </span>
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                      letItem.status === 'Ditandatangani'
                        ? 'bg-emerald-100 text-emerald-800'
                        : letItem.status === 'Diajukan'
                        ? 'bg-amber-100 text-amber-800'
                        : letItem.status === 'Ditolak'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {letItem.status}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-[10px] sm:text-[11px] truncate mt-0.5">
                  {letItem.subject}
                </h4>
                <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-gray-400">
                  <span className="truncate max-w-[120px]">Tujuan: {letItem.destination}</span>
                  <span className="shrink-0">{letItem.dateGregorian}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
