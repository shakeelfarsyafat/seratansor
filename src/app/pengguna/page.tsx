'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUsers, saveUsers, logActivity } from '@/lib/storage';
import { User, Role } from '@/types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  FileCheck,
  Phone,
  Mail,
  X,
  Lock,
} from 'lucide-react';

export default function PenggunaPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    role: 'Operator' as Role,
    password: '',
    isActive: true,
  });

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      email: '',
      phone: '',
      position: '',
      role: 'Operator',
      password: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (targetUser: User) => {
    setEditingUser(targetUser);
    setFormData({
      username: targetUser.username || '',
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      position: targetUser.position,
      role: targetUser.role,
      password: '',
      isActive: targetUser.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = getUsers();
    const cleanUsername = (formData.username || formData.email.split('@')[0]).trim().toLowerCase().replace(/\s+/g, '_');

    if (editingUser) {
      // Update
      const updatedList = allUsers.map((u) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            username: cleanUsername,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            position: formData.position,
            role: formData.role,
            isActive: formData.isActive,
            password: formData.password ? formData.password : u.password,
          };
        }
        return u;
      });

      saveUsers(updatedList);
      setUsers(updatedList);
      logActivity('UPDATE_USER', `Memperbarui akun pengguna: ${formData.name} (@${cleanUsername})`, formData.email);
    } else {
      // Create
      const newUser: User = {
        id: 'usr-' + Date.now(),
        username: cleanUsername,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        role: formData.role,
        password: formData.password || 'password123',
        isActive: formData.isActive,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      };

      const newList = [...allUsers, newUser];
      saveUsers(newList);
      setUsers(newList);
      logActivity('CREATE_USER', `Menambahkan pengguna baru: ${formData.name} (@${cleanUsername})`, formData.email);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      alert('Anda tidak dapat menonaktifkan akun yang sedang digunakan saat ini.');
      return;
    }

    const allUsers = getUsers();
    const updated = allUsers.map((u) => (u.id === targetUser.id ? { ...u, isActive: !u.isActive } : u));
    saveUsers(updated);
    setUsers(updated);
    logActivity(
      'TOGGLE_USER_STATUS',
      `${!targetUser.isActive ? 'Mengaktifkan' : 'Menonaktifkan'} akun: ${targetUser.name}`,
      targetUser.email
    );
  };

  const handleDelete = (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    if (confirm(`Yakin ingin menghapus akun ${targetUser.name}? Data persuratan terkait akan tetap tersimpan.`)) {
      const allUsers = getUsers();
      const filtered = allUsers.filter((u) => u.id !== targetUser.id);
      saveUsers(filtered);
      setUsers(filtered);
      logActivity('DELETE_USER', `Menghapus akun pengguna: ${targetUser.name} (${targetUser.role})`, targetUser.email);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.position.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Manajemen Pengguna & Role</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Kelola hak akses pengurus, pimpinan penandatangan surat, serta staf administrasi PW GP Ansor Jabar
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama, email, atau jabatan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
          >
            <option value="ALL">Semua Peran (Role)</option>
            <option value="Admin">Admin</option>
            <option value="Ketua">Ketua</option>
            <option value="Sekretaris">Sekretaris</option>
            <option value="Operator">Operator / Staf</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-zinc-800/50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">Nama Lengkap & Kontak</th>
                <th className="px-6 py-4">Jabatan Organisasi</th>
                <th className="px-6 py-4">Peran (Role)</th>
                <th className="px-6 py-4">Tanda Tangan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Tidak ditemukan data pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-800 to-green-700 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-400/30">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span>{u.name}</span>
                            <span className="text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                              @{u.username || 'user'}
                            </span>
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {u.email}
                            </span>
                            {u.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {u.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{u.position || '-'}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          u.role === 'Admin'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : u.role === 'Ketua'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : u.role === 'Sekretaris'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-slate-50 text-slate-800 border-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {u.signaturePath ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4" /> Tersedia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <XCircle className="w-4 h-4" /> Belum Diunggah
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Ubah Data Pengguna"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-gray-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal Form Tambah / Ubah Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 dark:border-zinc-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {editingUser ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: H. Deni Ahmad Haidar, M.Si"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Contoh: ketua_pw"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  <p className="text-[10px] text-gray-400">Digunakan untuk masuk ke sistem persuratan</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@ansorjabar.or.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Jabatan di Organisasi</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Contoh: Wakil Sekretaris PW GP Ansor Jabar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Peran (Role) Akses</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="Operator">Operator / Staf (Buat Surat & Arsip)</option>
                    <option value="Sekretaris">Sekretaris (Penandatangan & Verifikasi)</option>
                    <option value="Ketua">Ketua (Penandatangan Utama)</option>
                    <option value="Admin">Admin (Akses Penuh Seluruh Sistem)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Kata Sandi</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? '(Kosongkan jika tetap)' : 'Min. 8 karakter'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Status Akun Aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
