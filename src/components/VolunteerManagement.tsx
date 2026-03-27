import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  MapPin,
  X,
  Activity,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from './Toast';
import { User } from '../types';

const GOLD = '#D4AF37';

interface Volunteer extends User {
  total_activities?: number;
  activity_history?: number[];
}

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data, 1);
  const width = 80;
  const height = 20;
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const EMPTY_VOLUNTEER = {
  nama_lengkap: '',
  nik: '',
  no_telp: '',
  jenis_kelamin: 'L' as 'L' | 'P',
  agama: '',
  pekerjaan: '',
  alamat: '',
  deskripsi_pribadi: '',
  ktp_url: 'https://picsum.photos/seed/ktp/800/500',
  foto_profil_url: 'https://picsum.photos/seed/profile/400/400',
};

export const VolunteerManagement: React.FC = () => {
  const { toast } = useToast();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVolunteer, setNewVolunteer] = useState(EMPTY_VOLUNTEER);

  const [editTarget, setEditTarget] = useState<Volunteer | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({ nama_lengkap: '', no_telp: '', alamat: '' });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'validate'; id: string; name: string } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/volunteers');
      setVolunteers(res.data);
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        toast('Gagal memuat data relawan.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVolunteers(); }, []);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(v => {
      const matchesSearch = (v.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === 'all' || v.domisili === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [volunteers, searchTerm, regionFilter]);

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newVolunteer.nik.length !== 16 || !/^\d+$/.test(newVolunteer.nik)) {
      toast('NIK harus tepat 16 digit angka.', 'warning');
      return;
    }
    if (!/^(?:\+62|08)\d{8,13}$/.test(newVolunteer.no_telp)) {
      toast('Format nomor WhatsApp tidak valid (+62 atau 08).', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/register-relawan', newVolunteer);
      toast('Relawan berhasil didaftarkan!', 'success');
      setIsModalOpen(false);
      setNewVolunteer(EMPTY_VOLUNTEER);
      fetchVolunteers();
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        toast(err?.response?.data?.error || 'Gagal menambah relawan.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (v: Volunteer) => {
    setEditTarget(v);
    setEditForm({ nama_lengkap: v.nama_lengkap || '', no_telp: v.no_telp || '', alamat: v.alamat || '' });
    setIsEditOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsEditSaving(true);
    try {
      await api.patch(`/api/users/${editTarget.id}`, editForm);
      toast('Data relawan berhasil diperbarui.', 'success');
      setIsEditOpen(false);
      fetchVolunteers();
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        toast('Gagal menyimpan perubahan.', 'error');
      }
    } finally {
      setIsEditSaving(false);
    }
  };

  const openConfirmModal = (type: 'delete' | 'validate', id: string, name: string) => {
    setConfirmAction({ type, id, name });
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setIsConfirmLoading(true);
    try {
      if (confirmAction.type === 'delete') {
        await api.delete(`/api/users/${confirmAction.id}`);
        toast(`${confirmAction.name} berhasil dihapus.`, 'success');
      } else {
        await api.patch(`/api/validate-relawan/${confirmAction.id}`);
        toast(`${confirmAction.name} berhasil divalidasi!`, 'success');
      }
      fetchVolunteers();
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        toast(
          confirmAction.type === 'delete'
            ? 'Gagal menghapus relawan.'
            : 'Gagal memvalidasi relawan.',
          'error'
        );
      }
    } finally {
      setIsConfirmLoading(false);
      setIsConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-[#D4AF37]" />
            Volunteer Management
          </h2>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">Executive Control Panel for Field Operations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-[#D4AF37] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#F1E5AC] transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Add New Volunteer
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by volunteer name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-[#D4AF37] transition-all text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-[#D4AF37] transition-all appearance-none cursor-pointer text-white"
          >
            <option value="all">All Regions</option>
            <option value="reg_01">Menteng</option>
            <option value="reg_02">Gambir</option>
            <option value="reg_03">Senen</option>
          </select>
        </div>
      </div>

      {/* Volunteer Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Volunteer Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Domisili / TPS</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Referral Code</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="flex items-center justify-center gap-3 text-zinc-500 font-bold uppercase tracking-widest text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      Loading Field Agents...
                    </div>
                  </td>
                </tr>
              ) : filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-zinc-500 font-bold uppercase tracking-widest text-sm">
                    No volunteers found
                  </td>
                </tr>
              ) : filteredVolunteers.map(v => (
                <tr key={v.id} className="group hover:bg-zinc-900/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                        {v.foto_profil_url ? (
                          <img src={v.foto_profil_url} alt={v.nama_lengkap} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[#D4AF37] font-black">{(v.nama_lengkap || '?').charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{v.nama_lengkap}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{v.no_telp}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <MapPin className="w-3 h-3 text-[#D4AF37]" />
                        {v.domisili || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold">
                        <Activity className="w-3 h-3 text-[#D4AF37]" />
                        {v.tps_target || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      v.is_active ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {v.is_active
                        ? <><CheckCircle2 className="w-3 h-3" /> Active</>
                        : <><Activity className="w-3 h-3 animate-pulse" /> Pending</>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {v.kode_relawan ? (
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                        <span className="text-xs font-mono font-bold text-white tracking-widest">{v.kode_relawan}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-600 font-bold italic">Awaiting Validation</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      {!v.is_active && (
                        <button
                          onClick={() => openConfirmModal('validate', v.id, v.nama_lengkap || v.id)}
                          className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-all text-green-500"
                          title="Validate Volunteer"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(v)}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-500 hover:text-white"
                        title="Edit Volunteer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openConfirmModal('delete', v.id, v.nama_lengkap || v.id)}
                        className="p-2 hover:bg-red-500/10 rounded-xl transition-all text-zinc-500 hover:text-red-500"
                        title="Delete Volunteer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Volunteer Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Add New Volunteer</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Register Field Agent</p>
                </div>
                <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleAddVolunteer} className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input required type="text" value={newVolunteer.nama_lengkap}
                    onChange={e => setNewVolunteer({ ...newVolunteer, nama_lengkap: e.target.value })}
                    placeholder="Nama Lengkap"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">NIK (16 Digit)</label>
                    <input required type="text" maxLength={16} value={newVolunteer.nik}
                      onChange={e => setNewVolunteer({ ...newVolunteer, nik: e.target.value.replace(/\D/g, '') })}
                      placeholder="3201..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input required type="tel" value={newVolunteer.no_telp}
                        onChange={e => setNewVolunteer({ ...newVolunteer, no_telp: e.target.value })}
                        placeholder="0812..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                    <select value={newVolunteer.jenis_kelamin}
                      onChange={e => setNewVolunteer({ ...newVolunteer, jenis_kelamin: e.target.value as 'L' | 'P' })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all appearance-none text-white">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Agama</label>
                    <input required type="text" value={newVolunteer.agama}
                      onChange={e => setNewVolunteer({ ...newVolunteer, agama: e.target.value })}
                      placeholder="Agama"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pekerjaan</label>
                  <input required type="text" value={newVolunteer.pekerjaan}
                    onChange={e => setNewVolunteer({ ...newVolunteer, pekerjaan: e.target.value })}
                    placeholder="Pekerjaan"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Alamat Domisili</label>
                  <input required type="text" value={newVolunteer.alamat}
                    onChange={e => setNewVolunteer({ ...newVolunteer, alamat: e.target.value })}
                    placeholder="Alamat Lengkap"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Deskripsi Pribadi</label>
                  <textarea required rows={3} value={newVolunteer.deskripsi_pribadi}
                    onChange={e => setNewVolunteer({ ...newVolunteer, deskripsi_pribadi: e.target.value })}
                    placeholder="Ceritakan sedikit tentang relawan..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all resize-none text-white" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black text-lg uppercase tracking-widest transition-all hover:bg-[#F1E5AC] shadow-xl shadow-[#D4AF37]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Mendaftarkan...</>
                  ) : 'Register Volunteer'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Volunteer Modal ── */}
      <AnimatePresence>
        {isEditOpen && editTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isEditSaving && setIsEditOpen(false)}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Edit Relawan</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{editTarget.nama_lengkap}</p>
                </div>
                <button onClick={() => !isEditSaving && setIsEditOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input required type="text" value={editForm.nama_lengkap}
                    onChange={e => setEditForm({ ...editForm, nama_lengkap: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">No. Telepon</label>
                  <input type="tel" value={editForm.no_telp}
                    onChange={e => setEditForm({ ...editForm, no_telp: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Alamat</label>
                  <input type="text" value={editForm.alamat}
                    onChange={e => setEditForm({ ...editForm, alamat: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white" />
                </div>
                <button
                  type="submit"
                  disabled={isEditSaving}
                  className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-widest transition-all hover:bg-[#F1E5AC] shadow-xl shadow-[#D4AF37]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isEditSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Simpan Perubahan</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Modal ── */}
      <AnimatePresence>
        {isConfirmOpen && confirmAction && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isConfirmLoading && setIsConfirmOpen(false)}
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl text-center space-y-6"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                confirmAction.type === 'delete' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
              }`}>
                {confirmAction.type === 'delete'
                  ? <AlertCircle className="w-8 h-8" />
                  : <UserCheck className="w-8 h-8" />}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter text-white">
                  {confirmAction.type === 'delete' ? 'Konfirmasi Hapus' : 'Konfirmasi Validasi'}
                </h3>
                <p className="text-sm text-zinc-400">
                  {confirmAction.type === 'delete'
                    ? `Hapus ${confirmAction.name} secara permanen? Tindakan ini tidak dapat dibatalkan.`
                    : `Validasi & aktifkan ${confirmAction.name}? Kode referral unik akan dibuat.`}
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => !isConfirmLoading && setIsConfirmOpen(false)}
                  disabled={isConfirmLoading}
                  className="flex-1 py-4 bg-zinc-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isConfirmLoading}
                  className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    confirmAction.type === 'delete'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isConfirmLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Proses...</>
                    : 'Konfirmasi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
