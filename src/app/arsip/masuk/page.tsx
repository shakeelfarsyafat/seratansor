'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getIncomingLetters, saveIncomingLetters, logActivity,
} from '@/lib/storage';
import { IncomingLetter, Disposition } from '@/types';
import {
  Inbox, Plus, Search, Filter, Eye, Trash2, X,
  ChevronDown, MessageSquare, Building2, ArrowRight,
  Clock, CheckCircle2,
} from 'lucide-react';

export default function SuratMasukPage() {
  const { user, isAdmin, isLeader } = useAuth();
  const [letters, setLetters] = useState<IncomingLetter[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<IncomingLetter | null>(null);

  // Form State
  const [form, setForm] = useState({
    letterNumber: '', sender: '', letterDate: '', receivedDate: '',
    subject: '', category: 'Umum', notes: '', scanUrl: '',
  });

  // Disposition Form
  const [dispForm, setDispForm] = useState({ to: '', instruction: '' });

  useEffect(() => {
    setLetters(getIncomingLetters());
  }, []);

  const categories = ['Semua', ...Array.from(new Set(letters.map((l) => l.category)))];
  const LETTER_CATEGORIES = ['Umum', 'Undangan', 'Permohonan', 'Laporan', 'Rekomendasi', 'Surat Keputusan', 'Koordinasi', 'Lain-lain'];

  const filtered = letters.filter((l) => {
    const matchSearch =
      l.subject.toLowerCase().includes(search.toLowerCase()) ||
      l.sender.toLowerCase().includes(search.toLowerCase()) ||
      l.letterNumber.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'Semua' || l.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleAdd = () => {
    if (!form.letterNumber || !form.sender || !form.subject) {
      alert('Nomor surat, pengirim, dan perihal wajib diisi.');
      return;
    }
    const newLetter: IncomingLetter = {
      id: 'inc-' + Date.now(),
      ...form,
      letterDate: form.letterDate || new Date().toISOString().slice(0, 10),
      receivedDate: form.receivedDate || new Date().toISOString().slice(0, 10),
      dispositions: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newLetter, ...letters];
    saveIncomingLetters(updated);
    setLetters(updated);
    logActivity('ADD_INCOMING', `Surat masuk ditambahkan: ${newLetter.letterNumber}`, 'Surat Masuk');
    setForm({ letterNumber: '', sender: '', letterDate: '', receivedDate: '', subject: '', category: 'Umum', notes: '', scanUrl: '' });
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Hapus surat masuk ini?')) return;
    const updated = letters.filter((l) => l.id !== id);
    saveIncomingLetters(updated);
    setLetters(updated);
    logActivity('DELETE_INCOMING', `Surat masuk ${id} dihapus`, 'Surat Masuk');
  };

  const handleAddDisposition = () => {
    if (!selectedLetter || !dispForm.to || !dispForm.instruction) return;
    const newDisp: Disposition = {
      id: 'disp-' + Date.now(),
      to: dispForm.to,
      instruction: dispForm.instruction,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Menunggu',
    };

    const updated = letters.map((l) => {
      if (l.id !== selectedLetter.id) return l;
      return { ...l, dispositions: [...l.dispositions, newDisp] };
    });

    saveIncomingLetters(updated);
    setLetters(updated);
    setSelectedLetter({ ...selectedLetter, dispositions: [...selectedLetter.dispositions, newDisp] });
    logActivity('ADD_DISPOSITION', `Disposisi ditambahkan ke surat ${selectedLetter.letterNumber}`, 'Surat Masuk');
    setDispForm({ to: '', instruction: '' });
    setShowDispositionModal(false);
  };

  const updateDispositionStatus = (letterId: string, dispId: string, status: 'Menunggu' | 'Diproses' | 'Selesai') => {
    const updated = letters.map((l) => {
      if (l.id !== letterId) return l;
      return {
        ...l,
        dispositions: l.dispositions.map((d) => d.id === dispId ? { ...d, status } : d),
      };
    });
    saveIncomingLetters(updated);
    setLetters(updated);
    if (selectedLetter?.id === letterId) {
      setSelectedLetter({
        ...selectedLetter,
        dispositions: selectedLetter.dispositions.map((d) => d.id === dispId ? { ...d, status } : d),
      });
    }
  };

  const DISP_STATUS_COLORS = {
    Menunggu: 'bg-amber-100 text-amber-800 border-amber-200',
    Diproses: 'bg-blue-100 text-blue-800 border-blue-200',
    Selesai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <div className="flex flex-col gap-2 w-full h-[calc(100vh-3.75rem)] overflow-hidden">
      {/* 1. Header Minimalis */}
      <div className="shrink-0 flex items-center justify-between pb-1.5 border-b border-gray-200/80 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
              Surat Masuk & Disposisi
            </h1>
            <p className="text-[10px] text-gray-500 truncate hidden sm:block">
              Total {filtered.length} surat masuk tercatat
            </p>
          </div>
        </div>

        {(isAdmin || isLeader || user?.role === 'Operator') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Surat Masuk</span>
          </button>
        )}
      </div>

      {/* 2. 4 Kartu Statistik Konsisten */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Total Masuk */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Total Masuk</span>
            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none mt-0.5 block">{letters.length}</span>
            <span className="text-[9px] text-gray-400">Total arsip tercatat</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <Inbox className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Dengan Disposisi */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300/80 dark:border-amber-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 uppercase tracking-wide block">Disposisi</span>
            <span className="text-base sm:text-lg font-black text-amber-600 leading-none mt-0.5 block">{letters.filter(l => l.dispositions.length > 0).length}</span>
            <span className="text-[9px] text-amber-600/80">Ada instruksi</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Selesai Diproses */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300/80 dark:border-emerald-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">Selesai Diproses</span>
            <span className="text-base sm:text-lg font-black text-emerald-600 leading-none mt-0.5 block">
              {letters.filter(l => l.dispositions.some(d => d.status === 'Selesai')).length}
            </span>
            <span className="text-[9px] text-emerald-600/80">Disposisi tuntas</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Bulan Ini */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Bulan Ini</span>
            <span className="text-base sm:text-lg font-black text-gray-700 dark:text-gray-300 leading-none mt-0.5 block">
              {letters.filter(l => l.receivedDate?.startsWith('2026-10')).length}
            </span>
            <span className="text-[9px] text-gray-400">Periode berjalan</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. Bar Filter Ringkas 1 Baris */}
      <div className="shrink-0 flex items-center gap-2 p-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Cari nomor, pengirim, atau perihal surat masuk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs border-0 bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
        <div className="relative shrink-0 border-l border-gray-200 dark:border-zinc-800 pl-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pr-6 pl-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 focus:outline-none appearance-none cursor-pointer font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'Semua' ? 'Semua Kategori' : c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* 4. Tabel Surat Masuk Mengisi Sisa Ruang Sehalaman */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs flex flex-col overflow-hidden">
        <div className="overflow-y-auto flex-1 text-xs">
          <table className="w-full text-left">
            <thead className="bg-gray-50/90 dark:bg-zinc-800/60 sticky top-0 border-b border-gray-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-gray-500 z-10">
              <tr>
                <th className="px-3 py-2">No. Surat & Kategori</th>
                <th className="px-3 py-2">Pengirim & Perihal</th>
                <th className="px-3 py-2 hidden md:table-cell">Tgl Diterima</th>
                <th className="px-3 py-2 hidden lg:table-cell">Disposisi</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                    Tidak ditemukan data surat masuk.
                  </td>
                </tr>
              ) : (
                filtered.map((letter) => (
                  <tr key={letter.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="font-mono text-[10px] font-semibold text-gray-800 dark:text-gray-200 block">{letter.letterNumber}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 mt-0.5 inline-block">{letter.category}</span>
                    </td>
                    <td className="px-3 py-1.5 max-w-[280px]">
                      <p className="font-bold text-gray-900 dark:text-white text-xs truncate">{letter.subject}</p>
                      <p className="text-[10px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span>{letter.sender}</span>
                      </p>
                    </td>
                    <td className="px-3 py-1.5 hidden md:table-cell text-gray-500 text-[10px] whitespace-nowrap">{letter.receivedDate}</td>
                    <td className="px-3 py-1.5 hidden lg:table-cell">
                      {letter.dispositions.length === 0 ? (
                        <span className="text-gray-400 text-[10px]">—</span>
                      ) : (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                          {letter.dispositions.length} disposisi
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedLetter(letter); setShowDetailModal(true); }}
                          className="p-1 rounded-md text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Lihat Detail Surat"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {(isAdmin || isLeader) && (
                          <button
                            onClick={() => { setSelectedLetter(letter); setShowDispositionModal(true); }}
                            className="p-1 rounded-md text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Tambah Disposisi"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(letter.id)}
                            className="p-1 rounded-md text-gray-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-zinc-800">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h2 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Catat Surat Masuk Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Nomor Surat', key: 'letterNumber', placeholder: '001/PC-Bandung/X/2026', req: true },
                { label: 'Pengirim / Instansi', key: 'sender', placeholder: 'PC GP Ansor Kota Bandung', req: true },
                { label: 'Perihal', key: 'subject', placeholder: 'Permohonan Dukungan Kegiatan', req: true },
                { label: 'Tanggal Surat', key: 'letterDate', type: 'date', req: false },
                { label: 'Tanggal Diterima', key: 'receivedDate', type: 'date', req: false },
                { label: 'Catatan Internal', key: 'notes', placeholder: 'Catatan tambahan (opsional)', req: false },
              ].map(({ label, key, placeholder, type, req }) => (
                <div key={key} className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    {label} {req && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type={type || 'text'}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50/50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Kategori Surat</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50/50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {LETTER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                  Batal
                </button>
                <button onClick={handleAdd} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                  Simpan Surat Masuk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-zinc-800">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h2 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Detail Surat Masuk</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Nomor Surat', selectedLetter.letterNumber],
                  ['Pengirim', selectedLetter.sender],
                  ['Perihal', selectedLetter.subject],
                  ['Kategori', selectedLetter.category],
                  ['Tgl Surat', selectedLetter.letterDate],
                  ['Tgl Diterima', selectedLetter.receivedDate],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 dark:bg-zinc-800 p-2 rounded-lg border border-gray-100 dark:border-zinc-700">
                    <p className="text-[10px] text-gray-400 font-medium">{l}</p>
                    <p className="font-bold text-gray-900 dark:text-white mt-0.5 truncate">{v}</p>
                  </div>
                ))}
              </div>
              {selectedLetter.notes && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-bold mb-0.5">Catatan:</p>
                  <p>{selectedLetter.notes}</p>
                </div>
              )}

              {/* Dispositions */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 text-xs">Riwayat Disposisi ({selectedLetter.dispositions.length})</h3>
                  {(isAdmin || isLeader) && (
                    <button
                      onClick={() => { setShowDetailModal(false); setShowDispositionModal(true); }}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah Disposisi
                    </button>
                  )}
                </div>
                {selectedLetter.dispositions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada disposisi pimpinan.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedLetter.dispositions.map((d) => (
                      <div key={d.id} className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50/70 dark:bg-zinc-800 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-emerald-600" />
                            {d.to}
                          </span>
                          <select
                            value={d.status}
                            onChange={(e) => updateDispositionStatus(selectedLetter.id, d.id, e.target.value as any)}
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border cursor-pointer ${DISP_STATUS_COLORS[d.status]}`}
                          >
                            <option value="Menunggu">Menunggu</option>
                            <option value="Diproses">Diproses</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] italic">"{d.instruction}"</p>
                        <p className="text-gray-400 text-[9px] mt-0.5">{d.date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disposition Modal */}
      {showDispositionModal && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-4 border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Tambah Disposisi Pimpinan</h2>
              <button onClick={() => setShowDispositionModal(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 truncate">Surat: <strong>{selectedLetter.subject}</strong></p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Ditujukan Kepada <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={dispForm.to}
                  onChange={(e) => setDispForm({ ...dispForm, to: e.target.value })}
                  placeholder="Contoh: Wakil Sekretaris Bidang Organisasi"
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50/50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Instruksi Disposisi <span className="text-rose-500">*</span></label>
                <textarea
                  value={dispForm.instruction}
                  onChange={(e) => setDispForm({ ...dispForm, instruction: e.target.value })}
                  placeholder="Mohon ditindaklanjuti dan dikoordinasikan..."
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50/50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowDispositionModal(false)} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">Batal</button>
                <button
                  onClick={handleAddDisposition}
                  disabled={!dispForm.to || !dispForm.instruction}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Simpan Disposisi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
