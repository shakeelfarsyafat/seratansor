'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOutgoingLetters, getInstitution } from '@/lib/storage';
import { OutgoingLetter, Institution } from '@/types';
import {
  CheckCircle2, XCircle, Clock, Shield, AlertTriangle,
  FileText, Calendar, Building2, User, ChevronRight,
  QrCode, ExternalLink, Lock,
} from 'lucide-react';

// Mini QR SVG
function QRCodeSVG({ value, size = 100 }: { value: string; size?: number }) {
  const hash = Array.from(value).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cells = 9;
  const cell = size / (cells + 2);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" rx="4" />
      {Array.from({ length: cells }, (_, r) =>
        Array.from({ length: cells }, (_, c) => {
          const on = ((hash * (r + 1) * (c + 1) * 31 + r * 17 + c * 13) % 3) !== 0;
          return on ? <rect key={`${r}-${c}`} x={(c + 1) * cell} y={(r + 1) * cell} width={cell - 1} height={cell - 1} fill="#166534" rx="0.5" /> : null;
        })
      )}
      <rect x={cell} y={cell} width={cell * 3} height={cell * 3} fill="none" stroke="#166534" strokeWidth="2" rx="1" />
      <rect x={(cells - 2) * cell} y={cell} width={cell * 3} height={cell * 3} fill="none" stroke="#166534" strokeWidth="2" rx="1" />
      <rect x={cell} y={(cells - 2) * cell} width={cell * 3} height={cell * 3} fill="none" stroke="#166534" strokeWidth="2" rx="1" />
    </svg>
  );
}

export default function VerifikasiSuratPage() {
  const params = useParams();
  const kode = params?.kode as string;
  const [letter, setLetter] = useState<OutgoingLetter | null | 'not-found'>('not-found');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const all = getOutgoingLetters();
    const found = all.find((l) => l.verificationCode === kode);
    setLetter(found || 'not-found');
    setInstitution(getInstitution());
    setLoading(false);
  }, [kode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isValid = letter !== 'not-found' && letter !== null;
  const l = isValid ? (letter as OutgoingLetter) : null;
  const isSigned = l?.status === 'Ditandatangani';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 flex flex-col items-center justify-start py-12 px-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-green-500 p-0.5 shadow-lg">
          <div className="w-full h-full bg-emerald-900 rounded-[9px] flex items-center justify-center">
            <span className="text-amber-300 font-black text-base">GP</span>
          </div>
        </div>
        <div>
          <div className="font-extrabold text-white text-lg leading-tight">e-Serat Ansor</div>
          <div className="text-emerald-300 text-xs">Sistem Verifikasi Surat Digital</div>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg">
        {/* Status Banner */}
        <div className={`rounded-2xl p-6 text-center mb-4 shadow-2xl border ${
          !isValid
            ? 'bg-rose-900/40 border-rose-700/50 backdrop-blur-md'
            : isSigned
            ? 'bg-emerald-900/60 border-emerald-600/50 backdrop-blur-md'
            : 'bg-amber-900/40 border-amber-700/50 backdrop-blur-md'
        }`}>
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl ${
            !isValid ? 'bg-rose-700' : isSigned ? 'bg-emerald-600' : 'bg-amber-600'
          }`}>
            {!isValid ? (
              <XCircle className="w-10 h-10 text-white" />
            ) : isSigned ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : (
              <Clock className="w-10 h-10 text-white" />
            )}
          </div>

          {!isValid ? (
            <>
              <h1 className="text-xl font-black text-white mb-1">Surat Tidak Ditemukan</h1>
              <p className="text-rose-300 text-sm">Kode verifikasi tidak valid atau surat tidak terdaftar dalam sistem e-Serat.</p>
            </>
          ) : isSigned ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold mb-2">
                <Shield className="w-3.5 h-3.5" /> SURAT SAH & TERVERIFIKASI
              </div>
              <h1 className="text-xl font-black text-white mb-1">Surat Asli & Valid</h1>
              <p className="text-emerald-200 text-sm">Surat ini telah ditandatangani secara digital dan terdaftar resmi dalam sistem e-Serat PW GP Ansor Jawa Barat.</p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold mb-2">
                <Clock className="w-3.5 h-3.5" /> STATUS: {l?.status?.toUpperCase()}
              </div>
              <h1 className="text-xl font-black text-white mb-1">Surat Dalam Proses</h1>
              <p className="text-amber-200 text-sm">Surat ini terdaftar dalam sistem e-Serat namun belum selesai proses penandatanganan digital.</p>
            </>
          )}
        </div>

        {/* Letter Info Card */}
        {isValid && l && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 mb-4 shadow-xl">
            {/* QR + Kode */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/20">
              <div className="bg-white rounded-xl p-2 shadow-lg">
                <QRCodeSVG value={l.verificationCode} size={88} />
              </div>
              <div>
                <p className="text-emerald-300 text-xs mb-1 font-semibold">KODE VERIFIKASI</p>
                <code className="text-white font-mono font-bold text-sm block mb-2 break-all">{l.verificationCode}</code>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  isSigned
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : l.status === 'Diajukan'
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    : 'bg-slate-500/20 border-slate-400/40 text-slate-300'
                }`}>
                  {isSigned ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {l.status}
                </span>
              </div>
            </div>

            {/* Detail Surat */}
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">Perihal Surat</p>
                <p className="text-white font-bold leading-snug">{l.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">Nomor Surat</p>
                  <p className="text-white text-xs font-mono font-semibold">{l.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">Kategori</p>
                  <p className="text-white text-xs font-semibold">{l.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">Tanggal Surat</p>
                  <p className="text-white text-xs">{l.dateGregorian}</p>
                  <p className="text-emerald-300/70 text-[10px] italic">{l.dateHijri}</p>
                </div>
                <div>
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">Kepada</p>
                  <p className="text-white text-xs">{l.destination}</p>
                </div>
              </div>

              <div>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">Instansi Penerbit</p>
                <p className="text-white text-xs font-semibold">PW GP Ansor Jawa Barat</p>
              </div>
            </div>

            {/* Penandatangan */}
            {l.signers.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/20">
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-3">Status Penandatangan</p>
                <div className="space-y-2">
                  {l.signers.map((signer, idx) => (
                    <div key={signer.id} className={`flex items-center justify-between p-3 rounded-xl ${
                      signer.status === 'Ditandatangani' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                      signer.status === 'Ditolak' ? 'bg-rose-500/20 border border-rose-500/30' :
                      'bg-white/10 border border-white/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-5 h-5 rounded-full bg-white/20 text-white font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                        <div>
                          <p className="text-white text-xs font-semibold">{signer.userName}</p>
                          <p className="text-white/60 text-[10px]">{signer.role} — {signer.userPosition}</p>
                          {signer.signedAt && (
                            <p className="text-emerald-300 text-[10px] mt-0.5">
                              ✓ {new Date(signer.signedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        signer.status === 'Ditandatangani' ? 'bg-emerald-500 text-white' :
                        signer.status === 'Ditolak' ? 'bg-rose-500 text-white' :
                        'bg-amber-500 text-white'
                      }`}>{signer.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signed timestamp */}
            {isSigned && l.signedAt && (
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-xs text-emerald-300">
                <Lock className="w-3.5 h-3.5" />
                <span>Surat dikunci dan diarsipkan pada: <strong className="text-white">{new Date(l.signedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Invalid Card */}
        {!isValid && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-4 text-center">
            <QrCode className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <p className="text-white/80 text-sm mb-1">Kode yang dicari:</p>
            <code className="text-rose-300 font-mono font-bold text-sm break-all">{kode}</code>
            <p className="text-white/50 text-xs mt-3">
              Pastikan kode disalin dengan benar dari dokumen surat. Hubungi sekretariat PW GP Ansor Jabar untuk konfirmasi keaslian surat secara langsung.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6">
          <div className="flex items-start gap-2 text-xs text-white/60">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Halaman ini adalah sistem verifikasi resmi <strong className="text-white/80">e-Serat PW GP Ansor Jawa Barat</strong>.
              Setiap surat yang diterbitkan memiliki kode verifikasi unik yang dapat diverifikasi di halaman ini.
              Jika surat tidak ditemukan, dimungkinkan surat tersebut palsu.
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs">
          <Link href="/" className="text-emerald-300 hover:text-white transition-colors flex items-center gap-1.5 font-semibold">
            <ExternalLink className="w-3.5 h-3.5" /> Masuk ke Sistem e-Serat
          </Link>
          {isValid && l && (
            <Link href={`/surat/keluar/${l.id}`} className="text-emerald-300 hover:text-white transition-colors flex items-center gap-1.5 font-semibold">
              <FileText className="w-3.5 h-3.5" /> Lihat Detail Surat
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center text-emerald-700/60 text-[10px]">
        <p>© 2026 e-Serat · Pimpinan Wilayah Gerakan Pemuda Ansor Jawa Barat</p>
        <p className="mt-0.5">Sekretariat: Jl. Pasirkoja No. 248 Bandung · sekretariat@ansorjabar.or.id</p>
      </div>
    </div>
  );
}