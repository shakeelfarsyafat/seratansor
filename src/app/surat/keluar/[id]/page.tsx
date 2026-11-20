'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getOutgoingLetters, getInstitution, saveOutgoingLetters, logActivity,
  addNotification, getUsers,
} from '@/lib/storage';
import { OutgoingLetter, Institution, User } from '@/types';
import {
  ArrowLeft, Printer, CheckCircle2, Clock, XCircle, Lock,
  Shield, FileText, User as UserIcon, Calendar, Send,
  FileEdit, ChevronRight, AlertTriangle,
} from 'lucide-react';
import AnsorLogo from '@/components/AnsorLogo';

// ---------- QR Code SVG (deterministic pattern) ----------
function QRCodeSVG({ value, size = 80 }: { value: string; size?: number }) {
  const hash = Array.from(value).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cells = 9;
  const cell = size / (cells + 2);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" rx="2" />
      {Array.from({ length: cells }, (_, r) =>
        Array.from({ length: cells }, (_, c) => {
          const on = ((hash * (r + 1) * (c + 1) * 31 + r * 17 + c * 13) % 3) !== 0;
          return on ? (
            <rect key={`${r}-${c}`} x={(c + 1) * cell} y={(r + 1) * cell}
              width={cell - 0.8} height={cell - 0.8} fill="#166534" rx="0.5" />
          ) : null;
        })
      )}
      {/* Finder pattern outlines */}
      <rect x={cell} y={cell} width={cell * 3} height={cell * 3} fill="none" stroke="#166534" strokeWidth="1.5" rx="1" />
      <rect x={(cells - 2) * cell} y={cell} width={cell * 3} height={cell * 3} fill="none" stroke="#166534" strokeWidth="1.5" rx="1" />
      <rect x={cell} y={(cells - 2) * cell} width={cell * 3} height={cell * 3} fill="none" stroke="#166534" strokeWidth="1.5" rx="1" />
    </svg>
  );
}

// ---------- Status Badge ----------
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Draft: 'bg-slate-100 text-slate-700 border-slate-300',
    Diajukan: 'bg-amber-100 text-amber-800 border-amber-300',
    Ditandatangani: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Ditolak: 'bg-rose-100 text-rose-800 border-rose-300',
  };
  const icons: Record<string, React.ReactNode> = {
    Draft: <FileEdit className="w-3 h-3" />,
    Diajukan: <Clock className="w-3 h-3" />,
    Ditandatangani: <CheckCircle2 className="w-3 h-3" />,
    Ditolak: <XCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || ''}`}>
      {icons[status]} {status}
    </span>
  );
}

// ---------- Print View (Surat Resmi A4) ----------
function PrintView({ letter, institution, signerUsers }: {
  letter: OutgoingLetter;
  institution: Institution;
  signerUsers: Record<string, User>;
}) {
  const d = letter.dynamicData || {};
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verifikasi/${letter.verificationCode}`
    : `/verifikasi/${letter.verificationCode}`;

  const renderBodyContent = () => {
    switch (letter.templateId) {
      case 'tpl-undangan':
        return (
          <>
            <p style={{ marginBottom: '10px', lineHeight: '1.8' }}>
              Dengan memohon ridho dan rahmat Allah SWT, Pimpinan Wilayah GP Ansor Jawa Barat
              mengharap kehadiran Sahabat pada kegiatan yang akan diselenggarakan pada:
            </p>
            <table style={{ marginBottom: '12px', borderSpacing: '0 3px', borderCollapse: 'separate' }}>
              <tbody>
                {[['Kegiatan', d.nama_kegiatan], ['Hari / Tanggal', d.hari_tanggal], ['Waktu', d.waktu], ['Tempat', d.tempat]].map(([k, v]) => (
                  <tr key={k as string}><td style={{ width: '140px', verticalAlign: 'top', paddingRight: '6px', fontWeight: 600 }}>{k}</td><td style={{ verticalAlign: 'top', width: '12px' }}>:</td><td style={{ verticalAlign: 'top', paddingLeft: '8px' }}>{v as string}</td></tr>
                ))}
              </tbody>
            </table>
            {d.agenda_detail && <p style={{ marginBottom: '10px', lineHeight: '1.8' }}>{d.agenda_detail}</p>}
            <p style={{ lineHeight: '1.8' }}>Demikian undangan ini kami sampaikan. Atas kehadiran Sahabat, kami ucapkan terima kasih.</p>
          </>
        );
      case 'tpl-tugas':
        return (
          <>
            <p style={{ marginBottom: '10px', lineHeight: '1.8' }}>
              Pimpinan Wilayah Gerakan Pemuda Ansor Jawa Barat memberikan tugas kepada kader/pengurus yang namanya tersebut di bawah ini:
            </p>
            <div style={{ marginBottom: '12px', paddingLeft: '16px', borderLeft: '3px solid #166534' }}>
              <pre style={{ fontFamily: 'inherit', fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0 }}>{d.nama_petugas}</pre>
            </div>
            <table style={{ marginBottom: '12px', borderSpacing: '0 3px', borderCollapse: 'separate' }}>
              <tbody>
                {[['Uraian Tugas', d.tugas_detail], ['Waktu', d.waktu_tugas], ['Lokasi', d.lokasi_tugas]].map(([k, v]) => (
                  <tr key={k as string}><td style={{ width: '140px', verticalAlign: 'top', paddingRight: '6px', fontWeight: 600 }}>{k}</td><td style={{ verticalAlign: 'top', width: '12px' }}>:</td><td style={{ verticalAlign: 'top', paddingLeft: '8px' }}>{v as string}</td></tr>
                ))}
              </tbody>
            </table>
            <p style={{ lineHeight: '1.8' }}>Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.</p>
          </>
        );
      case 'tpl-mandat':
        return (
          <>
            <p style={{ marginBottom: '10px', lineHeight: '1.8' }}>Pimpinan Wilayah Gerakan Pemuda Ansor Jawa Barat memberikan mandat penuh kepada:</p>
            <table style={{ marginBottom: '12px', borderSpacing: '0 3px', borderCollapse: 'separate' }}>
              <tbody>
                {[['Nama', d.nama_penerima_mandat], ['Jabatan', d.jabatan_penerima], ['Keperluan', d.keperluan_mandat], ['Masa Berlaku', d.berlaku_hingga]].map(([k, v]) => (
                  <tr key={k as string}><td style={{ width: '140px', verticalAlign: 'top', paddingRight: '6px', fontWeight: 600 }}>{k}</td><td style={{ verticalAlign: 'top', width: '12px' }}>:</td><td style={{ verticalAlign: 'top', paddingLeft: '8px' }}>{v as string}</td></tr>
                ))}
              </tbody>
            </table>
            <p style={{ lineHeight: '1.8' }}>Demikian Surat Mandat ini diberikan untuk dipergunakan sebagaimana mestinya.</p>
          </>
        );
      case 'tpl-rekomendasi':
        return (
          <>
            <p style={{ marginBottom: '10px', lineHeight: '1.8' }}>Pimpinan Wilayah GP Ansor Jawa Barat dengan ini memberikan rekomendasi kepada:</p>
            <table style={{ marginBottom: '12px', borderSpacing: '0 3px', borderCollapse: 'separate' }}>
              <tbody>
                {[['Nama / Lembaga', d.nama_kader], ['Asal Satuan', d.asal_cabang]].map(([k, v]) => (
                  <tr key={k as string}><td style={{ width: '140px', verticalAlign: 'top', paddingRight: '6px', fontWeight: 600 }}>{k}</td><td style={{ verticalAlign: 'top', width: '12px' }}>:</td><td style={{ verticalAlign: 'top', paddingLeft: '8px' }}>{v as string}</td></tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginBottom: '10px', lineHeight: '1.8' }}>Dengan pertimbangan:</p>
            <p style={{ paddingLeft: '16px', borderLeft: '3px solid #166534', lineHeight: '1.8', marginBottom: '12px' }}>{d.isi_rekomendasi}</p>
            <p style={{ lineHeight: '1.8' }}>Demikian Surat Rekomendasi ini kami berikan untuk dapat dipergunakan sebagaimana mestinya.</p>
          </>
        );
      default:
        return (
          <>
            {Object.entries(d).map(([k, v]) => (
              <p key={k} style={{ marginBottom: '6px' }}><strong className="capitalize">{k.replace(/_/g,' ')}</strong>: {v as string}</p>
            ))}
            <p style={{ lineHeight: '1.8', marginTop: '12px' }}>Demikian surat ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
          </>
        );
    }
  };

  return (
    <div
      id="surat-cetak"
      style={{
        background: 'white',
        color: '#111827',
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '13px',
        lineHeight: '1.45',
        width: '210mm',
        minHeight: '297mm',
        padding: '16mm 20mm 0mm 20mm',
        boxSizing: 'border-box',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* KOP SURAT RESMI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ansor-logo.png"
            alt="Logo GP Ansor"
            style={{ width: '3.29cm', height: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>
        <div style={{ textAlign: 'right', flex: 1, paddingLeft: '12px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#334155', letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: '1.15' }}>
            {institution.kopHeader1 || 'PIMPINAN WILAYAH'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#334155', letterSpacing: '0.02em', textTransform: 'uppercase', marginTop: '2px', lineHeight: '1.15' }}>
            {institution.kopHeader2 || 'GERAKAN PEMUDA ANSOR'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#334155', letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: '1.15' }}>
            {institution.kopSubheader || 'PROVINSI JAWA BARAT'}
          </div>
          <div style={{ fontSize: '8.5pt', color: '#1e293b', marginTop: '8px', lineHeight: '1.25' }}>
            {institution.address || 'Jl. Terusan Galunggung No.9, kel. Lkr. Sel., Kec. Lengkong, Kota Bandung, Jawa Barat 40263,'}
          </div>
          <div style={{ fontSize: '8.5pt', color: '#1e293b', lineHeight: '1.25' }}>
            Telp. {institution.phone || '+62 823-2020-2374'}| email: {institution.email || 'Pusdatinansorjabar@Gmail.com'}
          </div>
        </div>
      </div>

      {/* METADATA SURAT & TITI MANGSA (No, Lamp, Hal vs Bandung : Tanggal) - 10pt */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', fontSize: '10pt' }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
            <span style={{ width: '50px', flexShrink: 0 }}>No</span>
            <span>:</span>
            <span>{letter.referenceNumber}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
            <span style={{ width: '50px', flexShrink: 0 }}>Lamp</span>
            <span>:</span>
            <span></span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ width: '50px', flexShrink: 0 }}>Hal</span>
            <span>:</span>
            <span>{letter.subject}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>
            <span style={{ marginRight: '8px' }}>{letter.placeOfLetter}</span>
            <span>:</span>
            <span style={{ textDecoration: 'underline', marginLeft: '3px' }}>{letter.dateHijri}</span>
          </div>
          <div>{letter.dateGregorian} M</div>
        </div>
      </div>

      {/* SELURUH ISI SURAT MENJOROK KE DALAM (ALIGN DENGAN KOLOM NILAI NOMOR SURAT, TIDAK SEJAJAR DENGAN LABEL NO/LAMP/HAL) - 10pt */}
      <div style={{ paddingLeft: '58px', fontSize: '10pt' }}>
        {/* KEPADA YTH */}
        <div style={{ marginBottom: '14px' }}>
          <div>Yth.</div>
          <div style={{ fontWeight: 500, margin: '2px 0' }}>{d.tujuan || letter.destination}</div>
          <div>di</div>
          <div style={{ letterSpacing: '0.4em', paddingLeft: '16px' }}>T e m p a t</div>
        </div>

        {/* SALAM PEMBUKA & PENGANTAR */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 700, fontStyle: 'italic', margin: '0 0 6px 0' }}>Assalamualaikum Warhamatullah Wabarakatuh</p>
          <p style={{ lineHeight: '1.45', margin: 0, textAlign: 'justify' }}>
            Salam silaturahmi teriring doa kami sampaikan semoga Bapak/Ibu senantiasa dalam lindungan Allah Swt. Amiin
          </p>
        </div>

        {/* BODY KONTEN */}
        <div style={{ marginBottom: '14px', fontSize: '10pt' }}>
          {renderBodyContent()}
        </div>

        {/* SALAM PENUTUP */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>Wallahul Muwaffieq Ilaa Aqwamith Tharieq</p>
          <p style={{ fontWeight: 700, fontStyle: 'italic', margin: 0 }}>Wassalamu’alaikum Warahmatullahi Wabarakatuh</p>
        </div>
      </div>

      {/* TANDA TANGAN (MENYESUAIKAN ISI SURAT, TIDAK DIKUNCI KE BAWAH) - 10pt */}
      <div style={{ marginBottom: '24px', marginTop: '10px', fontSize: '10pt' }}>
        <div style={{ textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5pt', lineHeight: '1.3', marginBottom: '12px' }}>
          <div>PIMPINAN WILAYAH</div>
          <div>GERAKAN PEMUDA ANSOR</div>
          <div>JAWA BARAT</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
          {/* Ketua (Kiri) */}
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ fontSize: '10pt', marginBottom: '6px' }}>Ketua,</div>
            <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const ketuaSigner = letter.signers.find(s => s.role === 'Ketua');
                const su = ketuaSigner ? signerUsers[ketuaSigner.userId] : null;
                return ketuaSigner?.status === 'Ditandatangani' && su?.signaturePath ? (
                  <img src={su.signaturePath} alt="TTD Ketua" style={{ maxHeight: '75px', maxWidth: '160px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ border: '1px dashed #d97706', color: '#d97706', fontSize: '10pt', padding: '4px 10px', borderRadius: '4px' }}>
                    {ketuaSigner?.status === 'Menunggu' ? 'Menunggu TTD' : (ketuaSigner?.status || 'TTD Digital')}
                  </div>
                );
              })()}
            </div>
            <div style={{ fontWeight: 700, fontSize: '10.5pt', textTransform: 'uppercase', marginTop: '6px' }}>
              {letter.signers.find(s => s.role === 'Ketua')?.userName || 'H. SUBHAN FAHMI'}
            </div>
          </div>

          {/* Sekretaris (Kanan) */}
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ fontSize: '10pt', marginBottom: '6px' }}>Sekretaris,</div>
            <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const sekrSigner = letter.signers.find(s => s.role === 'Sekretaris');
                const su = sekrSigner ? signerUsers[sekrSigner.userId] : null;
                return sekrSigner?.status === 'Ditandatangani' && su?.signaturePath ? (
                  <img src={su.signaturePath} alt="TTD Sekretaris" style={{ maxHeight: '75px', maxWidth: '160px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ border: '1px dashed #d97706', color: '#d97706', fontSize: '10pt', padding: '4px 10px', borderRadius: '4px' }}>
                    {sekrSigner?.status === 'Menunggu' ? 'Menunggu TTD' : (sekrSigner?.status || 'TTD Digital')}
                  </div>
                );
              })()}
            </div>
            <div style={{ fontWeight: 700, fontSize: '10.5pt', textTransform: 'uppercase', marginTop: '6px' }}>
              {letter.signers.find(s => s.role === 'Sekretaris')?.userName || 'H. EDI RUSYANDI'}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER RESMI ASLI MENEMPEL DI BAWAH KERTAS EDGE-TO-EDGE */}
      <div style={{ marginTop: 'auto', marginLeft: '-20mm', marginRight: '-22mm', marginBottom: '0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ansor-footer.png"
          alt="Footer PW GP Ansor Jabar"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 20mm', fontSize: '8.5px', color: '#64748b' }}>
          <div>e-Serat Dokumen Elektronik PW GP Ansor Jawa Barat</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <QRCodeSVG value={letter.verificationCode} size={22} />
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{letter.verificationCode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function DetailSuratKeluarPage() {
  const params = useParams();
  const { user, isAdmin, isLeader, isKetua, isSekretaris } = useAuth();
  const [letter, setLetter] = useState<OutgoingLetter | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [signerUsers, setSignerUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const id = params?.id as string;
    const all = getOutgoingLetters();
    const found = all.find((l) => l.id === id);
    setLetter(found || null);
    setInstitution(getInstitution());
    const users = getUsers();
    const map: Record<string, User> = {};
    users.forEach((u) => { map[u.id] = u; });
    setSignerUsers(map);
    setLoading(false);
  }, [params?.id]);

  const handleSubmitForSignature = () => {
    if (!letter || !user) return;
    setProcessing(true);
    const all = getOutgoingLetters();
    const updated = all.map((l) => l.id === letter.id ? { ...l, status: 'Diajukan' as const } : l);
    saveOutgoingLetters(updated);
    logActivity('SUBMIT_LETTER', `Surat ${letter.referenceNumber} diajukan untuk TTD`, 'Detail Surat');
    addNotification({ title: 'Surat Menunggu Tanda Tangan', message: `Surat "${letter.subject}" telah diajukan.`, type: 'warning', targetRole: 'Ketua', letterId: letter.id });
    setLetter({ ...letter, status: 'Diajukan' });
    setSuccessMsg('Surat berhasil diajukan untuk penandatanganan!');
    setProcessing(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Surat Tidak Ditemukan</h2>
        <p className="text-slate-500 mt-2 mb-6">Surat dengan ID tersebut tidak ada atau sudah dihapus.</p>
        <Link href="/surat/keluar" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors">
          Kembali ke Daftar Surat
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`@media print { @page { size: 210mm 297mm; margin: 0; } body > * { display: none !important; } #surat-cetak { display: block !important; position: fixed; top: 0; left: 0; width: 210mm; min-height: 297mm; } }`}</style>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/surat/keluar" className="hover:text-emerald-700 font-medium flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Daftar Surat Keluar
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-mono text-slate-700 font-semibold">{letter.referenceNumber}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusBadge status={letter.status} />
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{letter.category}</span>
                {letter.isLocked && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Dikunci & Diarsipkan
                  </span>
                )}
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">{letter.subject}</h1>
              <p className="text-sm text-slate-500 mt-1">Kepada: <strong className="text-slate-700">{letter.destination}</strong></p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{letter.dateGregorian} — {letter.dateHijri}</span>
                <span className="flex items-center gap-1.5 font-mono"><FileText className="w-3.5 h-3.5" />{letter.referenceNumber}</span>
                <span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" />Dibuat: {letter.createdByName}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {letter.status === 'Draft' && (isAdmin || user?.role === 'Operator') && (
                <button onClick={handleSubmitForSignature} disabled={processing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-60">
                  <Send className="w-4 h-4" /> Ajukan TTD
                </button>
              )}
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm">
                <Printer className="w-4 h-4" /> Cetak Surat
              </button>
            </div>
          </div>
        </div>

        {/* Success / Rejection messages */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}
        {letter.status === 'Ditolak' && letter.rejectionNotes && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div><p className="font-semibold text-rose-800 mb-1">Catatan Penolakan:</p><p className="text-rose-700">{letter.rejectionNotes}</p></div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pratinjau Surat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Pratinjau Surat Resmi
                </h2>
                <span className="text-xs text-slate-400">Format F4 (Folio) · Kop PW GP Ansor Jabar</span>
              </div>
              <div className="p-3 bg-slate-100 overflow-x-auto">
                <div className="shadow-xl mx-auto w-fit">
                  {institution && <PrintView letter={letter} institution={institution} signerUsers={signerUsers} />}
                </div>
              </div>
            </div>
          </div>

          {/* Panel Kanan */}
          <div className="space-y-4">
            {/* Status TTD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" /> Status Penandatanganan
              </h3>
              <div className="space-y-3">
                {letter.signers.map((signer, idx) => (
                  <div key={signer.id} className={`p-3 rounded-xl border text-sm ${signer.status === 'Ditandatangani' ? 'bg-emerald-50 border-emerald-200' : signer.status === 'Ditolak' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center shrink-0">{idx + 1}</span>
                      {signer.status === 'Ditandatangani' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : signer.status === 'Ditolak' ? <XCircle className="w-4 h-4 text-rose-600" /> : <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
                      <span className="font-semibold text-xs text-slate-700">{signer.role}</span>
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${signer.status === 'Ditandatangani' ? 'bg-emerald-600 text-white' : signer.status === 'Ditolak' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>{signer.status}</span>
                    </div>
                    <p className="text-xs text-slate-800 font-semibold ml-8">{signer.userName}</p>
                    {signer.signedAt && <p className="text-[10px] text-emerald-600 mt-1 ml-8">{new Date(signer.signedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
                    {signer.notes && <p className="text-[10px] text-rose-600 mt-1 ml-8 italic">"{signer.notes}"</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Verifikasi */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-3">Kode Verifikasi Digital</h3>
              <div className="flex items-center gap-3 mb-3">
                <QRCodeSVG value={letter.verificationCode} size={60} />
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Kode unik surat:</p>
                  <code className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg font-mono block break-all">{letter.verificationCode}</code>
                </div>
              </div>
              <Link href={`/verifikasi/${letter.verificationCode}`}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-emerald-300 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition-colors">
                <Shield className="w-3.5 h-3.5" /> Halaman Verifikasi Publik
              </Link>
            </div>

            {/* Info Surat */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-3">Info Surat</h3>
              <div className="space-y-2 text-xs">
                {([
                  ['Template', letter.templateName],
                  ['Kategori', letter.category],
                  ['Tempat TTD', letter.placeOfLetter],
                  ['Dibuat Oleh', letter.createdByName],
                  ['Dibuat Pada', new Date(letter.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })],
                  ...(letter.signedAt ? [['Ditandatangani', new Date(letter.signedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })]] : []),
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-slate-500 w-24 shrink-0">{k}</span>
                    <span className="text-slate-800 font-medium flex-1">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}