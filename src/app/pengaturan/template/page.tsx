'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTemplates, saveTemplates, logActivity } from '@/lib/storage';
import { LetterTemplate } from '@/types';
import {
  AlertCircle, CheckCircle2, Lock, Trash2, Table,
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from 'lucide-react';

const CATEGORIES = [
  'Rutin',
  'Tugas',
  'Edaran',
  'Instruksi',
  'Rekomendasi',
  'Peringatan',
];

export default function PengaturanTemplatePage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'umum' | 'diktum'>('umum');
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Rutin');
  const [templateText, setTemplateText] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load templates
  useEffect(() => {
    const list = getTemplates();
    setTemplates(list);
    if (list.length > 0 && !selectedTemplateId) {
      // Default to first template
      const first = list[0];
      setSelectedTemplateId(first.id);
      setName(first.name);
      setCategory(first.category || 'Rutin');
      setTemplateText(first.contentStructure || first.rawText || first.content || '');
    }
  }, []);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (id === 'new') {
      setName('');
      setCategory('Rutin');
      setTemplateText('');
    } else {
      const found = templates.find((t) => t.id === id);
      if (found) {
        setName(found.name);
        setCategory(found.category || 'Rutin');
        setTemplateText(found.contentStructure || found.rawText || found.content || '');
      }
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('templateTextarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = templateText.substring(start, end);
    const replacement = before + (selected || 'teks') + after;
    const newText = templateText.substring(0, start) + replacement + templateText.substring(end);
    setTemplateText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 4));
    }, 50);
  };

  const insertTable = () => {
    const tableTemplate = `\n| No | Uraian | Keterangan |\n|---|---|---|\n| 1 |  |  |\n| 2 |  |  |\n`;
    setTemplateText((prev) => prev + tableTemplate);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setStatusMsg({ type: 'error', text: 'Nama / Judul Template wajib diisi!' });
      return;
    }

    let updatedTemplates = [...templates];
    let templateCode = 'RUTIN';
    const upperCat = category.toUpperCase();
    if (upperCat.includes('PERINGATAN')) templateCode = 'PERINGATAN';
    else if (upperCat.includes('EDARAN')) templateCode = 'EDARAN';
    else if (upperCat.includes('INSTRUKSI')) templateCode = 'INSTRUKSI';
    else if (upperCat.includes('TUGAS')) templateCode = 'TUGAS';
    else if (upperCat.includes('REKOMENDASI')) templateCode = 'REKOMENDASI';

    if (selectedTemplateId === 'new' || !selectedTemplateId) {
      const newTpl: LetterTemplate = {
        id: 'tpl-' + Date.now(),
        name: name.trim(),
        code: templateCode,
        description: `Template untuk ${name.trim()}`,
        category: category,
        signersRequired: 'Ketua_dan_Sekretaris',
        fields: [],
        contentStructure: templateText,
        rawText: templateText,
        isActive: true,
      };
      updatedTemplates.push(newTpl);
      setSelectedTemplateId(newTpl.id);
      logActivity('CREATE_TEMPLATE', `Membuat template baru: ${newTpl.name}`, 'Template Surat');
    } else {
      updatedTemplates = updatedTemplates.map((t) => {
        if (t.id === selectedTemplateId) {
          return {
            ...t,
            name: name.trim(),
            category: category,
            code: templateCode,
            contentStructure: templateText,
            rawText: templateText,
          };
        }
        return t;
      });
      logActivity('UPDATE_TEMPLATE', `Memperbarui template: ${name.trim()}`, 'Template Surat');
    }

    saveTemplates(updatedTemplates);
    setTemplates(updatedTemplates);
    setStatusMsg({ type: 'success', text: 'Template berhasil disimpan!' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDelete = () => {
    if (selectedTemplateId === 'new') return;
    if (!confirm(`Hapus template "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    const updated = templates.filter((t) => t.id !== selectedTemplateId);
    saveTemplates(updated);
    setTemplates(updated);
    logActivity('DELETE_TEMPLATE', `Menghapus template: ${name}`, 'Template Surat');
    
    if (updated.length > 0) {
      handleSelectTemplate(updated[0].id);
    } else {
      handleSelectTemplate('new');
    }
    setStatusMsg({ type: 'success', text: 'Template berhasil dihapus!' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Akses Terbatas</h2>
        <p className="text-slate-500 mt-2">Hanya Admin yang dapat mengelola template surat.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 min-h-screen text-slate-800 dark:text-zinc-100 p-4 sm:p-6 space-y-4">
      {/* Tab Navigasi Atas persis seperti gambar 2 */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-zinc-800 pb-3 font-semibold text-sm">
        <button
          onClick={() => setActiveTab('umum')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'umum'
              ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-3 -mb-3.5'
              : 'text-blue-600/70 hover:text-blue-600'
          }`}
        >
          Template Surat Umum
        </button>
        <button
          onClick={() => setActiveTab('diktum')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'diktum'
              ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-3 -mb-3.5'
              : 'text-blue-600/70 hover:text-blue-600'
          }`}
        >
          Master Diktum SK
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {statusMsg.text}
        </div>
      )}

      {activeTab === 'umum' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Sisi Kiri: Pilih/Kelola, Nama, Kategori, Tombol Simpan & Hapus */}
          <div className="lg:col-span-4 space-y-4">
            {/* Pilih / Kelola Template */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Pilih / Kelola Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="new">-- Buat Template Baru --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code || t.category?.toUpperCase() || 'RUTIN'})
                  </option>
                ))}
              </select>
            </div>

            {/* Nama / Judul Template */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Nama / Judul Template
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cth: Undangan Pengajian Akbar"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Kategori Dasar Surat */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Kategori Dasar Surat
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Simpan Template (Hijau Toska/Emerald sesuai gambar 2) */}
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-2.5 px-4 bg-[#0d7a6e] hover:bg-[#0b6a60] text-white font-bold text-xs rounded-md shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Simpan Template
            </button>

            {/* Tombol Hapus Template (Border Merah dengan Icon Sampah sesuai gambar 2) */}
            {selectedTemplateId !== 'new' && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2 px-4 border border-rose-500 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium text-xs rounded-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Template Ini
              </button>
            )}
          </div>

          {/* Sisi Kanan: Isi Teks Template + Toolbar Formatting */}
          <div className="lg:col-span-8 flex flex-col space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200">
              Isi Teks Template
            </label>

            {/* Editor Container */}
            <div className="border border-slate-300 dark:border-zinc-700 rounded-md overflow-hidden flex flex-col bg-white dark:bg-zinc-900 shadow-2xs">
              {/* Toolbar Formatting persis seperti gambar 2 */}
              <div className="flex items-center gap-1 p-1.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertText('**', '**')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 font-bold"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('*', '*')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 italic"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('<u>', '</u>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 underline"
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                <button
                  type="button"
                  onClick={() => insertText('\n- ')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('\n1. ')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                <button
                  type="button"
                  onClick={() => insertText('<div style="text-align: left;">\n', '\n</div>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('<div style="text-align: center;">\n', '\n</div>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('<div style="text-align: right;">\n', '\n</div>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('<div style="text-align: justify;">\n', '\n</div>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Justify"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                {/* Tombol Sisipkan Tabel (Biru terang sesuai gambar 2) */}
                <button
                  type="button"
                  onClick={insertTable}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-[#0b63e5] hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs"
                >
                  <Table className="w-3.5 h-3.5" />
                  Sisipkan Tabel
                </button>
              </div>

              {/* Textarea Area Editor */}
              <textarea
                id="templateTextarea"
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                placeholder="Tuliskan isi teks template di sini..."
                rows={16}
                className="w-full p-4 text-xs sm:text-sm text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none resize-y min-h-[360px] font-sans"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Tab Master Diktum SK */
        <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-xl my-6">
          <p className="font-semibold text-slate-700 mb-1">Master Diktum Surat Keputusan (SK)</p>
          <p className="text-xs">Fitur kelola diktum menimbang, mengingat, memperhatikan, dan memutuskan untuk SK.</p>
        </div>
      )}
    </div>
  );
}
