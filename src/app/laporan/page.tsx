'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getOutgoingLetters, getIncomingLetters, getActivityLogs,
} from '@/lib/storage';
import { OutgoingLetter, IncomingLetter, ActivityLog } from '@/types';
import {
  BarChart3, Download, FileText, Inbox, TrendingUp,
  Calendar, ChevronDown, CheckCircle2, Clock,
  ArrowUpRight,
} from 'lucide-react';

type ReportType = 'rekap' | 'keluar' | 'masuk' | 'aktivitas';

export default function LaporanPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportType>('rekap');
  const [outgoing, setOutgoing] = useState<OutgoingLetter[]>([]);
  const [incoming, setIncoming] = useState<IncomingLetter[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [monthFilter, setMonthFilter] = useState('Semua');

  useEffect(() => {
    setOutgoing(getOutgoingLetters());
    setIncoming(getIncomingLetters());
    setLogs(getActivityLogs());
  }, []);

  const MONTHS = ['Semua', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const filteredOutgoing = outgoing.filter((l) => monthFilter === 'Semua' || l.dateGregorian.includes(monthFilter));
  const filteredIncoming = incoming.filter((l) => monthFilter === 'Semua' || (l.receivedDate && MONTHS[new Date(l.receivedDate).getMonth() + 1] === monthFilter));

  const outgoingByCategory = outgoing.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const outgoingByStatus = outgoing.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExportCSV = (type: 'keluar' | 'masuk') => {
    const data = type === 'keluar' ? filteredOutgoing : filteredIncoming;
    const headers = type === 'keluar'
      ? ['Nomor Surat', 'Perihal', 'Kepada', 'Tanggal', 'Kategori', 'Status']
      : ['Nomor Surat', 'Pengirim', 'Perihal', 'Tanggal Terima', 'Kategori'];

    const rows = type === 'keluar'
      ? (data as OutgoingLetter[]).map((l) => [l.referenceNumber, l.subject, l.destination, l.dateGregorian, l.category, l.status])
      : (data as IncomingLetter[]).map((l) => [l.letterNumber, l.sender, l.subject, l.receivedDate, l.category]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-surat-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2 w-full h-[calc(100vh-3.75rem)] overflow-hidden">
      {/* 1. Header Minimalis (Title + Filter Bulan + Tombol Ekspor dalam 1 Baris) */}
      <div className="shrink-0 flex items-center justify-between pb-1.5 border-b border-gray-200/80 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
              Rekap & Laporan Persuratan
            </h1>
            <p className="text-[10px] text-gray-500 truncate hidden sm:block">
              Statistik, rekapitulasi, dan ekspor data surat e-Serat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Month Filter */}
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="pl-7 pr-6 py-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none font-medium cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m === 'Semua' ? 'Semua Bulan' : m}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Export buttons */}
          <button
            onClick={() => handleExportCSV('keluar')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Ekspor CSV Surat Keluar"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ekspor Keluar</span>
          </button>
          <button
            onClick={() => handleExportCSV('masuk')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            title="Ekspor CSV Surat Masuk"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ekspor Masuk</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Kartu Statistik Konsisten (Sama persis dengan bentuk menu lain) */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Surat Keluar */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Surat Keluar</span>
            <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none mt-0.5 block">{outgoing.length}</span>
            <span className="text-[9px] text-gray-400">{outgoing.filter(l => l.status === 'Ditandatangani').length} ditandatangani</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Surat Masuk */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Surat Masuk</span>
            <span className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-400 leading-none mt-0.5 block">{incoming.length}</span>
            <span className="text-[9px] text-gray-400">{incoming.filter(l => l.dispositions.length > 0).length} ada disposisi</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <Inbox className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Draft & Diajukan */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300/80 dark:border-amber-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 uppercase tracking-wide block">Draft & Diajukan</span>
            <span className="text-base sm:text-lg font-black text-amber-600 leading-none mt-0.5 block">
              {outgoing.filter(l => l.status === 'Draft' || l.status === 'Diajukan').length}
            </span>
            <span className="text-[9px] text-amber-600/80">{outgoing.filter(l => l.status === 'Diajukan').length} menunggu TTD</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Log Aktivitas */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-violet-200/80 dark:border-violet-900/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-violet-700 uppercase tracking-wide block">Log Aktivitas</span>
            <span className="text-base sm:text-lg font-black text-violet-600 leading-none mt-0.5 block">{logs.length}</span>
            <span className="text-[9px] text-gray-400">Total aktivitas</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. Segmented Tabs Ringkas */}
      <div className="shrink-0 flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg w-fit">
        {([
          { key: 'rekap', label: 'Rekap Umum' },
          { key: 'keluar', label: 'Surat Keluar' },
          { key: 'masuk', label: 'Surat Masuk' },
          { key: 'aktivitas', label: 'Log Aktivitas' },
        ] as { key: ReportType; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === t.key
                ? 'bg-white dark:bg-zinc-900 shadow-2xs text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Content Area (Terpasang Rapi Mengisi Sisa Ruang Sehalaman) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Tab 1: Rekap Umum */}
        {activeTab === 'rekap' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full">
            {/* Surat Keluar per Kategori */}
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between overflow-y-auto">
              <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 pb-1.5 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1.5 shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Surat Keluar per Kategori</span>
              </h3>
              {Object.entries(outgoingByCategory).length === 0 ? (
                <p className="text-gray-400 text-xs py-4 text-center">Tidak ada data surat keluar</p>
              ) : (
                <div className="space-y-2 py-1 flex-1 overflow-y-auto">
                  {Object.entries(outgoingByCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                    const pct = Math.round((count / (outgoing.length || 1)) * 100);
                    return (
                      <div key={cat} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{cat}</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{count} surat ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Surat Keluar per Status */}
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between overflow-y-auto">
              <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 pb-1.5 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Surat Keluar per Status</span>
              </h3>
              <div className="space-y-2 py-1 flex-1 overflow-y-auto">
                {[
                  { status: 'Ditandatangani', color: 'from-emerald-500 to-green-400' },
                  { status: 'Diajukan', color: 'from-amber-500 to-orange-400' },
                  { status: 'Draft', color: 'from-slate-400 to-slate-500' },
                  { status: 'Ditolak', color: 'from-rose-500 to-red-400' },
                ].map(({ status, color }) => {
                  const count = outgoingByStatus[status] || 0;
                  const pct = outgoing.length > 0 ? Math.round((count / outgoing.length) * 100) : 0;
                  return (
                    <div key={status} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{status}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Surat Keluar Table */}
        {activeTab === 'keluar' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs h-full flex flex-col overflow-hidden">
            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-gray-800 dark:text-gray-200">{filteredOutgoing.length} Surat Keluar</span>
              <button
                onClick={() => handleExportCSV('keluar')}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Unduh CSV
              </button>
            </div>
            <div className="overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50/90 dark:bg-zinc-800/60 sticky top-0 border-b border-gray-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Nomor Surat</th>
                    <th className="px-3 py-2">Perihal</th>
                    <th className="px-3 py-2">Kepada</th>
                    <th className="px-3 py-2">Tanggal</th>
                    <th className="px-3 py-2">Kategori</th>
                    <th className="px-3 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                  {filteredOutgoing.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-gray-400">Tidak ada data surat</td>
                    </tr>
                  ) : (
                    filteredOutgoing.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-3 py-2 font-mono text-[10px] text-gray-700 dark:text-gray-300 font-semibold">{l.referenceNumber}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white font-bold truncate max-w-[220px]">{l.subject}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[160px]">{l.destination}</td>
                        <td className="px-3 py-2 text-gray-500 text-[10px] whitespace-nowrap">{l.dateGregorian}</td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">{l.category}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            l.status === 'Ditandatangani' ? 'bg-emerald-100 text-emerald-800' :
                            l.status === 'Diajukan' ? 'bg-amber-100 text-amber-800' :
                            l.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                            'bg-rose-100 text-rose-800'
                          }`}>{l.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Surat Masuk Table */}
        {activeTab === 'masuk' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs h-full flex flex-col overflow-hidden">
            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-gray-800 dark:text-gray-200">{filteredIncoming.length} Surat Masuk</span>
              <button
                onClick={() => handleExportCSV('masuk')}
                className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Unduh CSV
              </button>
            </div>
            <div className="overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50/90 dark:bg-zinc-800/60 sticky top-0 border-b border-gray-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-gray-500">
                  <tr>
                    <th className="px-3 py-2">No. Surat</th>
                    <th className="px-3 py-2">Pengirim</th>
                    <th className="px-3 py-2">Perihal</th>
                    <th className="px-3 py-2">Tgl Terima</th>
                    <th className="px-3 py-2">Kategori</th>
                    <th className="px-3 py-2 text-right">Disposisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                  {filteredIncoming.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-gray-400">Tidak ada data surat masuk</td>
                    </tr>
                  ) : (
                    filteredIncoming.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-3 py-2 font-mono text-[10px] text-gray-700 dark:text-gray-300 font-semibold">{l.letterNumber}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white font-bold truncate max-w-[160px]">{l.sender}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 truncate max-w-[220px]">{l.subject}</td>
                        <td className="px-3 py-2 text-gray-500 text-[10px] whitespace-nowrap">{l.receivedDate}</td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">{l.category}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            l.dispositions.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {l.dispositions.length > 0 ? `${l.dispositions.length} Disposisi` : 'Belum'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Log Aktivitas Table */}
        {activeTab === 'aktivitas' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs h-full flex flex-col overflow-hidden">
            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-gray-800 dark:text-gray-200">{logs.length} Log Aktivitas Terkini</span>
            </div>
            <div className="overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50/90 dark:bg-zinc-800/60 sticky top-0 border-b border-gray-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Waktu</th>
                    <th className="px-3 py-2">Pengguna</th>
                    <th className="px-3 py-2">Peran</th>
                    <th className="px-3 py-2">Aksi</th>
                    <th className="px-3 py-2">Deskripsi Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-gray-400">Belum ada log aktivitas</td>
                    </tr>
                  ) : (
                    logs.slice(0, 50).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-3 py-2 text-[10px] text-gray-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-800 dark:text-gray-200 truncate max-w-[130px]">{log.userName}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            log.userRole === 'Admin' ? 'bg-emerald-100 text-emerald-800' :
                            log.userRole === 'Ketua' ? 'bg-amber-100 text-amber-800' :
                            log.userRole === 'Sekretaris' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>{log.userRole}</span>
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono font-semibold">{log.action}</code>
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 text-[11px] truncate max-w-[280px]">{log.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
