'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getOutgoingLetters, saveOutgoingLetters, getTemplates,
  generateNextLetterNumber, saveNumberingConfig, getNumberingConfig,
  getApproxHijriDate, formatIndonesianDate, getInstitution, logActivity,
  addNotification, getUsers,
} from '@/lib/storage';
import { OutgoingLetter, LetterTemplate, SignatureSigner } from '@/types';
import {
  Check, AlertCircle, Send, ChevronDown, ChevronUp, Paperclip,
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table, Sparkles, FileText, Eye,
} from 'lucide-react';

const JENIS_SURAT_OPTIONS = [
  'Surat Rutin',
  'Surat Tugas',
  'Surat Edaran',
  'Surat Instruksi',
  'Surat Rekomendasi',
  'Surat Peringatan (SP)',
  'Surat Keputusan (SK)',
];

const SIFAT_DISTRIBUSI_OPTIONS = [
  'Biasa (Terbuka)',
  'Penting',
  'Rahasia / Terbatas',
  'Segera',
];

const KATEGORI_OPTIONS = [
  'Internal',
  'Eksternal',
];

export default function BuatSuratPage() {
  const { user, isAdmin } = useAuth();
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [institution, setInstitution] = useState(getInstitution());
  const [numConfig, setNumConfig] = useState(getNumberingConfig());

  // Form Fields per gambar 1
  const [jenisSurat, setJenisSurat] = useState('Surat Rutin');
  const [sifatDistribusi, setSifatDistribusi] = useState('Biasa (Terbuka)');
  const [kategori, setKategori] = useState('Internal');
  const [nomorSurat, setNomorSurat] = useState('656/PW-IX/SR-01/I/2026');
  const [perihal, setPerihal] = useState('');
  const [barisLampiran, setBarisLampiran] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tempatAlamat, setTempatAlamat] = useState('T e m p a t');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Isi teks surat default disesuaikan dengan contoh resmi Ansor
  const [isiTeksSurat, setIsiTeksSurat] = useState(
    'Salam silaturahmi teriring doa kami sampaikan semoga Bapak/Ibu senantiasa dalam lindungan Allah Swt. Amiin\n\n' +
    'Menindaklanjuti hasil rapat dengan Pimpinan Pusat pada tanggal 12 Januari 2026 tentang kerja sama antara PT Alihdaya Solusi Nusantara Raya, anak perusahaan BUMA, dan PT Sang Hyang Seri terkait dengan rekrutmen tenaga security di 115 lokasi se-Indonesia di antaranya ada di Jawa Barat, maka dengan itu Pimpinan Wilayah Mengundang Sahabat untuk dapat hadir pada :\n\n' +
    'Hari/Tanggal : \n' +
    'Waktu        : \n' +
    'Tempat       : \n\n' +
    'Demikian undangan ini kami sampaikan. Atas perhatian dan kehdiran Sahabat kami ucapkan terima kasih.'
  );
  
  // Data Lampiran (Opsional) collapsible
  const [showLampiranSection, setShowLampiranSection] = useState(true);
  const [dataLampiranText, setDataLampiranText] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');

  // Tembusan & Tanggal
  const [tembusan, setTembusan] = useState('');
  const [kotaSurat, setKotaSurat] = useState('Bandung');
  const [tglMasehi, setTglMasehi] = useState('');
  const [tglHijriyah, setTglHijriyah] = useState('25 Rajab 1447 H');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedLetter, setSavedLetter] = useState<OutgoingLetter | null>(null);

  // Initialize dates and next letter number on mount
  useEffect(() => {
    const all = getTemplates().filter((t) => t.isActive);
    setTemplates(all);
    const inst = getInstitution();
    setInstitution(inst);
    const nCfg = getNumberingConfig();
    setNumConfig(nCfg);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    setTglMasehi(`${yyyy}-${mm}-${dd}`);
    setTglHijriyah('25 Rajab 1447 H');
  }, []);

  const handleDateChange = (val: string) => {
    setTglMasehi(val);
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        setTglHijriyah(getApproxHijriDate(d));
      }
    }
  };

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      if (tpl.contentStructure || tpl.rawText || tpl.content) {
        setIsiTeksSurat(tpl.contentStructure || tpl.rawText || tpl.content || '');
      }
      if (!perihal) {
        setPerihal(tpl.name);
      }
    }
  };

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('isiTeksSuratTextarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = isiTeksSurat.substring(start, end);
    const replacement = before + (selected || 'teks') + after;
    const newText = isiTeksSurat.substring(0, start) + replacement + isiTeksSurat.substring(end);
    setIsiTeksSurat(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 4));
    }, 50);
  };

  const insertTable = () => {
    const tableTemplate = `\nHari/Tanggal : \nWaktu        : \nTempat       : \n`;
    setIsiTeksSurat((prev) => prev + tableTemplate);
  };

  const insertLampiranFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('lampiranTextarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = dataLampiranText.substring(start, end);
    const replacement = before + (selected || 'teks') + after;
    const newText = dataLampiranText.substring(0, start) + replacement + dataLampiranText.substring(end);
    setDataLampiranText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 4));
    }, 50);
  };

  const insertLampiranTable = () => {
    const tableTemplate = `\n| No | Nama / Uraian | Keterangan |\n|---|---|---|\n| 1 |  |  |\n| 2 |  |  |\n`;
    setDataLampiranText((prev) => prev + tableTemplate);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nomorSurat.trim()) newErrors.nomorSurat = 'Nomor surat wajib diisi';
    if (!tujuan.trim()) newErrors.tujuan = 'Tujuan surat wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (status: 'Draft' | 'Diajukan') => {
    if (!validate()) return;
    setIsSubmitting(true);

    const now = new Date();
    const allUsers = getUsers();
    const ketuaUser = allUsers.find((u) => u.role === 'Ketua');
    const sekretarisUser = allUsers.find((u) => u.role === 'Sekretaris');

    const signers: SignatureSigner[] = [
      {
        id: 'sig-new-1',
        userId: ketuaUser?.id || 'usr-ketua',
        userName: ketuaUser?.name || 'H. SUBHAN FAHMI',
        userPosition: ketuaUser?.position || 'Ketua PW GP Ansor Jawa Barat',
        role: 'Ketua',
        order: 1,
        status: 'Menunggu',
      },
      {
        id: 'sig-new-2',
        userId: sekretarisUser?.id || 'usr-sekretaris',
        userName: sekretarisUser?.name || 'H. EDI RUSYANDI',
        userPosition: sekretarisUser?.position || 'Sekretaris PW GP Ansor Jawa Barat',
        role: 'Sekretaris',
        order: 2,
        status: 'Menunggu',
      },
    ];

    const newLetter: OutgoingLetter = {
      id: 'let-' + Date.now(),
      referenceNumber: nomorSurat,
      templateId: selectedTemplateId || 'custom',
      templateName: perihal || 'Surat Keluar',
      category: jenisSurat,
      subject: perihal,
      destination: tujuan,
      dateHijri: tglHijriyah || '25 Rajab 1447 H',
      dateGregorian: formatIndonesianDate(tglMasehi ? new Date(tglMasehi) : now),
      placeOfLetter: kotaSurat || 'Bandung',
      dynamicData: {
        jenisSurat,
        sifatDistribusi,
        kategori,
        barisLampiran,
        tempatAlamat,
        isiTeksSurat,
        dataLampiranText,
        tembusan,
      },
      status,
      createdBy: user?.id || 'usr-staf',
      createdByName: user?.name || 'Petugas Persuratan',
      createdAt: now.toISOString(),
      signers,
      verificationCode: 'VRF-ANSOR-JB-' + Math.floor(100000 + Math.random() * 900000),
      isLocked: false,
      isArchived: false,
    };

    const letters = getOutgoingLetters();
    saveOutgoingLetters([newLetter, ...letters]);

    logActivity(
      status === 'Draft' ? 'CREATE_DRAFT' : 'SUBMIT_LETTER',
      `Surat ${status === 'Draft' ? 'draft' : 'diajukan'}: ${newLetter.referenceNumber}`,
      'Buat Surat',
    );

    if (status === 'Diajukan') {
      addNotification({
        title: 'Surat Menunggu Tanda Tangan',
        message: `Surat "${newLetter.subject || newLetter.referenceNumber}" telah diajukan dan menunggu tanda tangan.`,
        type: 'warning',
        targetRole: 'Ketua',
        letterId: newLetter.id,
      });
    }

    setSavedLetter(newLetter);
    setIsSubmitting(false);
    setSuccess(true);
  };

  if (!isAdmin && user?.role !== 'Operator') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Akses Terbatas</h2>
        <p className="text-slate-500 mt-2">Hanya Admin dan Operator yang dapat membuat surat baru.</p>
      </div>
    );
  }

  if (success && savedLetter) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
          Surat Berhasil {savedLetter.status === 'Draft' ? 'Disimpan sebagai Draft' : 'Diajukan untuk Ditandatangani'}!
        </h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Nomor Surat: <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{savedLetter.referenceNumber}</span>
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setSuccess(false);
              setSavedLetter(null);
              setPerihal('');
              setTujuan('');
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Buat Surat Lagi
          </button>
          <a
            href="/surat/keluar"
            className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Lihat Daftar Surat
          </a>
        </div>
      </div>
    );
  }

  const inst = institution;
  const displayDateGregorian = tglMasehi ? formatIndonesianDate(new Date(tglMasehi)) : '14 Januari 2026';

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* ── SISI KIRI: Formulir Buat Surat (Scrollable) ── */}
      <div className="flex-1 min-w-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden">
        {/* Header Form */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Form Buat Surat Baru</h1>
            <p className="text-[11px] text-slate-500">Isian surat di sebelah kiri, pratinjau lembar resmi persis Ansor di sebelah kanan</p>
          </div>
        </div>

        {/* Isi Formulir */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-slate-800 dark:text-zinc-100">
          {/* BARIS 1: Jenis Surat & Sifat Distribusi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
                Jenis Surat
              </label>
              <select
                value={jenisSurat}
                onChange={(e) => setJenisSurat(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {JENIS_SURAT_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1">
                Sifat Distribusi Surat
              </label>
              <select
                value={sifatDistribusi}
                onChange={(e) => setSifatDistribusi(e.target.value)}
                className="w-full px-3 py-2 text-xs border-2 border-red-500/80 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                {SIFAT_DISTRIBUSI_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          {/* BARIS 2: Kategori & Nomor Surat */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {KATEGORI_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-8">
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
                Nomor Surat
              </label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                placeholder="656/PW-IX/SR-01/I/2026"
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
              {errors.nomorSurat && <p className="text-red-500 text-[10px] mt-0.5">{errors.nomorSurat}</p>}
            </div>
          </div>

          {/* BARIS 3: Perihal / Tentang */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
              Perihal / Tentang
            </label>
            <input
              type="text"
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              placeholder="Perihal surat (dikosongkan jika tidak ada)"
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* BARIS 4: Baris Lampiran */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
              Baris Lampiran <span className="text-slate-400 font-normal">(Cth: 1 Berkas)</span>
            </label>
            <input
              type="text"
              value={barisLampiran}
              onChange={(e) => setBarisLampiran(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* BARIS 5: Kepada Yth. (Tujuan) */}
          <div>
            <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
              Kepada Yth. (Tujuan)
            </label>
            <input
              type="text"
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              placeholder="Bisa dipisah titik koma (Cth: Bakesbangpol)"
              className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {errors.tujuan && <p className="text-red-500 text-[10px] mt-0.5">{errors.tujuan}</p>}
          </div>

          {/* BARIS 6: di – Tempat / Alamat */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
              di – Tempat / Alamat
            </label>
            <input
              type="text"
              value={tempatAlamat}
              onChange={(e) => setTempatAlamat(e.target.value)}
              placeholder="T e m p a t"
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* BARIS 7: Template */}
          <div>
            <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <span>⚡ Template:</span>
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Pilih Template Isian --</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.code || tpl.category?.toUpperCase() || 'RUTIN'})
                </option>
              ))}
            </select>
          </div>

          {/* BARIS 8: Isi Teks Surat */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200">
              Isi Teks Surat (Bebas)
            </label>

            <div className="border border-slate-300 dark:border-zinc-700 rounded-md overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
              <div className="flex items-center gap-1 p-1.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 font-bold"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 italic"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<u>', '</u>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 underline"
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                <button
                  type="button"
                  onClick={() => insertFormatting('\n- ')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n1. ')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                <button
                  type="button"
                  onClick={() => insertFormatting('<div style="text-align: left;">\n', '\n</div>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<div style="text-align: center;">\n', '\n</div>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<div style="text-align: right;">\n', '\n</div>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<div style="text-align: justify;">\n', '\n</div>')}
                  className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                  title="Justify"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                <button
                  type="button"
                  onClick={insertTable}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-[#0b63e5] hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs"
                >
                  <Table className="w-3.5 h-3.5" />
                  Sisipkan Tabel
                </button>
              </div>

              <textarea
                id="isiTeksSuratTextarea"
                value={isiTeksSurat}
                onChange={(e) => setIsiTeksSurat(e.target.value)}
                rows={10}
                placeholder="Tuliskan isi surat di sini..."
                className="w-full p-3.5 text-xs sm:text-sm text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none resize-y min-h-[180px]"
              />
            </div>
          </div>

          {/* BARIS 9: Data Lampiran (Opsional) Persis Gambar */}
          <div className="border border-blue-200 dark:border-blue-900/60 rounded-md overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
            {/* Header Accordion Biru Muda / Hijau */}
            <button
              type="button"
              onClick={() => setShowLampiranSection(!showLampiranSection)}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/60 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-emerald-600 rotate-45" />
                Data Lampiran (Opsional)
              </span>
              {showLampiranSection ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
            </button>

            {showLampiranSection && (
              <div className="p-3.5 space-y-3.5 border-t border-blue-100 dark:border-zinc-800">
                {/* 1. Isi Tabel Lampiran (Kertas 2) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Isi Tabel Lampiran (Kertas 2)
                  </label>

                  <div className="border border-slate-300 dark:border-zinc-700 rounded-md overflow-hidden bg-white dark:bg-zinc-900">
                    {/* Toolbar Formatting untuk Tabel Lampiran */}
                    <div className="flex items-center gap-1 p-1.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex-wrap">
                      <button
                        type="button"
                        onClick={() => insertLampiranFormatting('**', '**')}
                        className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 font-bold"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertLampiranFormatting('*', '*')}
                        className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 italic"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertLampiranFormatting('<u>', '</u>')}
                        className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 underline"
                        title="Underline"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertLampiranFormatting('\n- ')}
                        className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertLampiranFormatting('\n1. ')}
                        className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertLampiranFormatting('<div style="text-align: left;">\n', '\n</div>')}
                        className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                        title="Align Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertLampiranFormatting('<div style="text-align: center;">\n', '\n</div>')}
                        className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                        title="Align Center"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertLampiranFormatting('<div style="text-align: right;">\n', '\n</div>')}
                        className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100"
                        title="Align Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                      {/* Tombol Buat Tabel (Warna Biru sesuai gambar) */}
                      <button
                        type="button"
                        onClick={insertLampiranTable}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-[#0b63e5] hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs"
                      >
                        <Table className="w-3.5 h-3.5" />
                        Buat Tabel
                      </button>
                    </div>

                    <textarea
                      id="lampiranTextarea"
                      value={dataLampiranText}
                      onChange={(e) => setDataLampiranText(e.target.value)}
                      rows={5}
                      placeholder=""
                      className="w-full p-3 text-xs sm:text-sm text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none resize-y min-h-[110px]"
                    />
                  </div>
                </div>

                {/* 2. Upload File External (PDF/JPG) untuk diselipkan di Amplop */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Upload File External (PDF/JPG) untuk diselipkan di Amplop
                  </label>
                  <div className="flex items-center border border-slate-300 dark:border-zinc-700 rounded-md overflow-hidden bg-white dark:bg-zinc-800 text-xs">
                    <label className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 border-r border-slate-300 dark:border-zinc-600 font-medium cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-600 shrink-0">
                      Pilih File
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAttachedFileName(file.name);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <span className="px-3 py-2 text-slate-500 dark:text-zinc-400 truncate flex-1">
                      {attachedFileName || 'Tidak ada file yang dipilih'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BARIS 10: Tembusan */}
          <div>
            <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
              Tembusan
            </label>
            <input
              type="text"
              value={tembusan}
              onChange={(e) => setTembusan(e.target.value)}
              placeholder="Bisa dipisah titik koma (;)"
              className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* BARIS 11: Tgl Masehi & Tgl Hijriyah */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
                Tgl Masehi
              </label>
              <input
                type="date"
                value={tglMasehi}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
                Tgl Hijriyah
              </label>
              <input
                type="text"
                value={tglHijriyah}
                onChange={(e) => setTglHijriyah(e.target.value)}
                placeholder="25 Rajab 1447 H"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Tombol */}
        <div className="p-3.5 px-5 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('Diajukan')}
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#0d7a6e] hover:bg-[#0b6a60] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Ajukan & Proses Surat
          </button>
        </div>
      </div>

      {/* ── SISI KANAN: Live Preview F4 Persis Sesuai Contoh Resmi GP Ansor ── */}
      <div className="w-full lg:w-[480px] xl:w-[540px] shrink-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden">
        {/* Preview Top Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Pratinjau Kertas A4 (Format Resmi Ansor)</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
            A4 (210 × 297 mm)
          </span>
        </div>

        {/* Paper Canvas Container */}
        <div className="flex-1 overflow-y-auto bg-slate-200/70 dark:bg-zinc-950 p-3 sm:p-5 flex justify-center items-start">
          <div
            className="bg-white text-[#111827] shadow-xl w-full max-w-[460px] flex flex-col justify-between"
            style={{
              aspectRatio: '210/297',
              fontFamily: "'Times New Roman', Times, serif",
              padding: '16px 24px 0px 24px',
              minHeight: '620px',
              boxSizing: 'border-box',
            }}
          >
            {/* Bagian Konten Atas & Tengah */}
            <div>
              {/* ── 1. KOP SURAT RESMI ANSOR (Logo 3.29cm, Ujung Bawah Sejajar Baris Alamat Kota Bandung) ── */}
              <div className="flex justify-between items-start gap-2 mb-3.5">
                <div className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/ansor-logo.png"
                    alt="Logo GP Ansor"
                    style={{ width: '3.29cm', maxWidth: '100px', height: 'auto', objectFit: 'contain' }}
                    className="block"
                  />
                </div>
                <div className="text-right flex-1 pt-0">
                  <p className="uppercase font-extrabold tracking-tight text-[#334155] leading-tight text-[12.5px] sm:text-[13.5px]">
                    {inst.kopHeader1 || 'PIMPINAN WILAYAH'}
                  </p>
                  <p className="uppercase font-extrabold tracking-tight text-[#334155] leading-tight text-[12.5px] sm:text-[13.5px] mt-0.5">
                    {inst.kopHeader2 || 'GERAKAN PEMUDA ANSOR'}
                  </p>
                  <p className="uppercase font-extrabold tracking-tight text-[#334155] leading-tight text-[12.5px] sm:text-[13.5px]">
                    {inst.kopSubheader || 'PROVINSI JAWA BARAT'}
                  </p>
                  <p className="text-[6.8px] sm:text-[7.2px] text-[#1e293b] leading-[1.25] mt-1.5 whitespace-nowrap">
                    Jl. Terusan Galunggung No.9, kel. Lkr. Sel., Kec. Lengkong, Kota Bandung, Jawa Barat 40263,
                  </p>
                  <p className="text-[6.8px] sm:text-[7.2px] text-[#1e293b] leading-[1.25]">
                    Telp. {inst.phone || '+62 823-2020-2374'}| email: {inst.email || 'Pusdatinansorjabar@Gmail.com'}
                  </p>
                </div>
              </div>

              {/* ── 2. METADATA SURAT (No, Lamp, Hal) & (Bandung : Tanggal Hijriyah / Masehi) - Standar 10pt ── */}
              <div className="flex justify-between items-start mb-3 text-[7.5px] sm:text-[8px] leading-tight">
                {/* Kolom Kiri: No, Lamp, Hal */}
                <div className="space-y-0.5">
                  <div className="flex">
                    <span className="w-10 shrink-0">No</span>
                    <span className="w-3 shrink-0">:</span>
                    <span className="font-normal">{nomorSurat || '656/PW-IX/SR-01/I/2026'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-10 shrink-0">Lamp</span>
                    <span className="w-3 shrink-0">:</span>
                    <span>{barisLampiran || ''}</span>
                  </div>
                  <div className="flex">
                    <span className="w-10 shrink-0">Hal</span>
                    <span className="w-3 shrink-0">:</span>
                    <span>{perihal || ''}</span>
                  </div>
                </div>

                {/* Kolom Kanan: Bandung : Tanggal Hijriyah bergaris bawah & Tanggal Masehi */}
                <div className="text-right">
                  <div className="flex justify-end items-baseline">
                    <span className="mr-3">{kotaSurat || 'Bandung'}</span>
                    <span>:</span>
                    <span className="underline ml-1 font-normal">{tglHijriyah || '25 Rajab 1447 H'}</span>
                  </div>
                  <div className="text-right mt-0.5">
                    <span>{displayDateGregorian} M</span>
                  </div>
                </div>
              </div>

              {/* ── 3. SELURUH ISI SURAT MENJOROK KE DALAM - Standar 10pt ── */}
              {/* Kolom isi surat diberi margin-left 50px sejajar dengan nilai Nomor Surat */}
              <div className="pl-[48px] sm:pl-[52px] space-y-2 text-[7.5px] sm:text-[8px] text-[#111827]">
                
                {/* Tujuan */}
                <div className="space-y-0.5">
                  <p>Yth.</p>
                  {tujuan && <p className="font-normal">{tujuan}</p>}
                  <p className="pt-0.5">di</p>
                  <p className="pl-4 tracking-[0.45em]">{tempatAlamat || 'T e m p a t'}</p>
                </div>

                {/* Salam Pembuka */}
                <div className="pt-1">
                  <p className="font-bold italic">Assalamualaikum Warhamatullah Wabarakatuh</p>
                </div>

                {/* Paragraf Isi Bebas */}
                <div className="space-y-1.5 text-justify leading-[1.45] whitespace-pre-line">
                  {isiTeksSurat}
                </div>

                {/* Salam Penutup */}
                <div className="space-y-0.5 pt-1">
                  <p className="font-bold">Wallahul Muwaffieq Ilaa Aqwamith Tharieq</p>
                  <p className="font-bold italic">Wassalamu’alaikum Warahmatullahi Wabarakatuh</p>
                </div>
              </div>

              {/* ── 4. BLOK TANDA TANGAN - Standar 10pt ── */}
              <div className="mt-3.5 text-[#111827]">
                <div className="text-center font-bold uppercase text-[7.8px] sm:text-[8.5px] tracking-wide mb-1 leading-tight">
                  <p>PIMPINAN WILAYAH</p>
                  <p>GERAKAN PEMUDA ANSOR</p>
                  <p>JAWA BARAT</p>
                </div>

                <div className="grid grid-cols-2 gap-6 text-center mt-2 px-4 sm:px-6">
                  {/* Ketua di Kiri */}
                  <div>
                    <p className="text-[7.5px] sm:text-[8px] mb-10 sm:mb-12 font-normal">Ketua,</p>
                    <p className="font-bold uppercase text-[7.8px] sm:text-[8.5px] text-gray-950">H. SUBHAN FAHMI</p>
                  </div>

                  {/* Sekretaris di Kanan */}
                  <div>
                    <p className="text-[7.5px] sm:text-[8px] mb-10 sm:mb-12 font-normal">Sekretaris,</p>
                    <p className="font-bold uppercase text-[7.8px] sm:text-[8.5px] text-gray-950">H. EDI RUSYANDI</p>
                  </div>
                </div>
              </div>

              {/* Tembusan jika ada */}
              {tembusan && (
                <div className="pl-[48px] sm:pl-[52px] mt-2 text-[7px] text-gray-700">
                  <p className="font-bold">Tembusan:</p>
                  <p>{tembusan}</p>
                </div>
              )}
            </div>

            {/* ── 5. FOOTER RESMI ASLI (Banner Gambar Menempel di Bagian Bawah Kertas Sesuai Gambar) ── */}
            <div className="mt-auto -mx-[24px] -mb-[0px] pt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ansor-footer.png"
                alt="Footer PW GP Ansor Jabar"
                className="w-full h-auto object-contain block"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
