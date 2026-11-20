'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getInstitution, saveInstitution, logActivity } from '@/lib/storage';
import { Institution } from '@/types';
import {
  Building2, Save, AlertCircle, CheckCircle2,
  Phone, Mail, Globe, MapPin, Tag, Hash,
} from 'lucide-react';

export default function PengaturanInstansiPage() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState<Institution>({
    name: '', level: 'PW', code: '', regionCode: '',
    address: '', phone: '', email: '', website: '',
    kopHeader1: '', kopHeader2: '', kopSubheader: '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(getInstitution());
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Akses Terbatas</h2>
        <p className="text-slate-500 mt-2">Hanya Admin yang dapat mengubah data instansi.</p>
      </div>
    );
  }

  const handleSave = () => {
    if (!form.name || !form.code || !form.address) {
      setError('Nama instansi, kode, dan alamat wajib diisi.');
      return;
    }
    saveInstitution(form);
    logActivity('UPDATE_INSTITUTION', 'Data instansi diperbarui', 'Pengaturan Instansi');
    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (key: keyof Institution, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const LEVEL_OPTIONS: Institution['level'][] = ['PW', 'PC', 'PAC', 'PR'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Data Instansi</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola informasi lembaga yang tampil pada kop surat dan identitas sistem</p>
      </div>

      {/* Success/Error Messages */}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Data instansi berhasil disimpan!
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Form Sections */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-emerald-700" />
            <h2 className="font-bold text-slate-800">Identitas Lembaga</h2>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Resmi Lembaga <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Level Organisasi</label>
            <select
              value={form.level}
              onChange={(e) => handleChange('level', e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l}>{l} — {
                  l === 'PW' ? 'Pimpinan Wilayah (Provinsi)' :
                  l === 'PC' ? 'Pimpinan Cabang (Kab/Kota)' :
                  l === 'PAC' ? 'Pimpinan Anak Cabang (Kecamatan)' : 'Pimpinan Ranting (Desa/Kelurahan)'
                }</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kode Lembaga <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={form.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="PW-GPAnsor"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kode Wilayah</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={form.regionCode}
                onChange={(e) => handleChange('regionCode', e.target.value)}
                placeholder="JB"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Sekretariat <span className="text-rose-500">*</span></label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <textarea
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nomor Telepon</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(022) 1234567"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)}
                placeholder="sekretariat@ansor.or.id"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" value={form.website} onChange={(e) => handleChange('website', e.target.value)}
                placeholder="www.ansorjabar.or.id"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Kop Surat Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">Konfigurasi Kop Surat</h2>
          <p className="text-xs text-slate-500 mt-0.5">Teks yang tampil pada kop surat resmi</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Baris 1 (Nama Induk / Federasi)</label>
            <input type="text" value={form.kopHeader1} onChange={(e) => handleChange('kopHeader1', e.target.value)}
              placeholder="PIMPINAN WILAYAH GERAKAN PEMUDA ANSOR"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Baris 2 (Nama Wilayah)</label>
            <input type="text" value={form.kopHeader2} onChange={(e) => handleChange('kopHeader2', e.target.value)}
              placeholder="PROVINSI JAWA BARAT"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sub-header / Info Kontak</label>
            <input type="text" value={form.kopSubheader} onChange={(e) => handleChange('kopSubheader', e.target.value)}
              placeholder="Sekretariat: Jl. ... | Telp: ... | Email: ..."
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Preview */}
          <div className="mt-4 border-2 border-emerald-900 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-emerald-900 uppercase tracking-widest">{form.kopHeader1 || '[ Baris 1 Kop ]'}</p>
            <p className="text-lg font-black text-emerald-900 uppercase tracking-wider">{form.kopHeader2 || '[ Baris 2 Kop ]'}</p>
            <p className="text-xs text-slate-500 mt-1">{form.kopSubheader || '[ Sub-header Kop ]'}</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Save className="w-5 h-5" />
        Simpan Data Instansi
      </button>
    </div>
  );
}
