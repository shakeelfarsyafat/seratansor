'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getNumberingConfig, saveNumberingConfig, logActivity } from '@/lib/storage';
import { NumberingConfig } from '@/types';
import {
  Hash, Save, AlertCircle, CheckCircle2, Info, Eye,
} from 'lucide-react';

export default function PengaturanPenomoranPage() {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<NumberingConfig>({
    formatPattern: '{SEQ}/PW-GPAnsor/{WIL}/{ROMAN}/{YEAR}',
    currentSequence: 1,
    year: new Date().getFullYear(),
    autoResetYearly: true,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setConfig(getNumberingConfig());
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Akses Terbatas</h2>
        <p className="text-slate-500 mt-2">Hanya Admin yang dapat mengatur format penomoran surat.</p>
      </div>
    );
  }

  const handleSave = () => {
    if (!config.formatPattern) {
      setError('Format penomoran wajib diisi.');
      return;
    }
    saveNumberingConfig(config);
    logActivity('UPDATE_NUMBERING', 'Format penomoran surat diperbarui', 'Pengaturan Penomoran');
    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 3000);
  };

  // Preview
  const generatePreview = () => {
    const romanMonth = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][new Date().getMonth()];
    const nextSeq = String(config.currentSequence + 1).padStart(3, '0');
    return config.formatPattern
      .replace('{SEQ}', nextSeq)
      .replace('{WIL}', 'JB')
      .replace('{ROMAN}', romanMonth)
      .replace('{YEAR}', String(new Date().getFullYear()));
  };

  const VARIABLES = [
    { var: '{SEQ}', desc: 'Nomor urut surat (3 digit, contoh: 001)' },
    { var: '{WIL}', desc: 'Kode wilayah dari Data Instansi (contoh: JB)' },
    { var: '{ROMAN}', desc: 'Bulan dalam angka Romawi (I s/d XII)' },
    { var: '{YEAR}', desc: 'Tahun 4 digit (contoh: 2026)' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Format Penomoran Surat</h1>
        <p className="text-sm text-slate-500 mt-1">Konfigurasi format nomor surat yang otomatis dibuat sistem</p>
      </div>

      {/* Messages */}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Format penomoran berhasil disimpan!
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Variable Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-blue-800">Variabel yang Tersedia dalam Format</p>
        </div>
        <div className="space-y-1.5">
          {VARIABLES.map(({ var: v, desc }) => (
            <div key={v} className="flex gap-3 text-xs">
              <code className="font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">{v}</code>
              <span className="text-blue-700">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center gap-3">
          <Hash className="w-5 h-5 text-slate-600" />
          <h2 className="font-bold text-slate-800">Konfigurasi Format</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Format Pattern */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Pola Format Nomor Surat <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={config.formatPattern}
              onChange={(e) => setConfig({ ...config, formatPattern: e.target.value })}
              className="w-full px-4 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-400 mt-1">Contoh: {`{SEQ}/PW-GPAnsor/{WIL}/{ROMAN}/{YEAR}`}</p>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Eye className="w-4 h-4 inline mr-1 text-slate-500" />
              Pratinjau Nomor Berikutnya
            </label>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
              <p className="font-mono font-bold text-xl text-emerald-800 tracking-wide">
                {generatePreview()}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Nomor urut ke-{config.currentSequence + 1}</p>
            </div>
          </div>

          {/* Current Sequence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nomor Urut Terakhir</label>
              <input
                type="number"
                value={config.currentSequence}
                onChange={(e) => setConfig({ ...config, currentSequence: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-400 mt-1">Surat berikutnya: #{config.currentSequence + 1}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tahun Berjalan</label>
              <input
                type="number"
                value={config.year}
                onChange={(e) => setConfig({ ...config, year: parseInt(e.target.value) || new Date().getFullYear() })}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Auto Reset */}
          <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={config.autoResetYearly}
              onChange={(e) => setConfig({ ...config, autoResetYearly: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 border-slate-300 cursor-pointer"
            />
            <div>
              <p className="text-sm font-semibold text-slate-700">Reset Nomor Urut Setiap Tahun Baru</p>
              <p className="text-xs text-slate-500 mt-0.5">Jika diaktifkan, nomor urut akan kembali ke 001 setiap pergantian tahun</p>
            </div>
          </label>
        </div>
      </div>

      {/* Common Format Examples */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">Format Umum yang Digunakan</h3>
        <div className="space-y-2">
          {[
            { label: 'PW GP Ansor (Standar)', pattern: '{SEQ}/PW-GPAnsor/{WIL}/{ROMAN}/{YEAR}' },
            { label: 'PC GP Ansor', pattern: '{SEQ}/PC-GPAnsor/{WIL}/{ROMAN}/{YEAR}' },
            { label: 'Sederhana', pattern: '{SEQ}/{WIL}/{YEAR}' },
            { label: 'Formal NU', pattern: '{SEQ}/A.I/{WIL}/{ROMAN}/{YEAR}' },
          ].map((ex) => (
            <button
              key={ex.label}
              onClick={() => setConfig({ ...config, formatPattern: ex.pattern })}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer group"
            >
              <p className="text-xs font-semibold text-slate-600 group-hover:text-emerald-700">{ex.label}</p>
              <p className="font-mono text-sm text-slate-800 mt-0.5">{ex.pattern}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Save className="w-5 h-5" />
        Simpan Konfigurasi Penomoran
      </button>
    </div>
  );
}
