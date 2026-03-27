import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  MapPin, 
  TrendingUp,
  X,
  ChevronRight,
  Activity,
  UserCheck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { User } from '../types';

// Premium Gold Theme Colors
const GOLD = '#D4AF37';

interface Volunteer extends User {
  total_activities?: number;
  activity_history?: number[];
}

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data, 1);
  const width = 80;
  const height = 20;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={GOLD}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const VolunteerManagement: React.FC = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'validate', id: string, name: string } | null>(null);
  const [newVolunteer, setNewVolunteer] = useState({ 
    nama_lengkap: '', 
    nik: '', 
    no_telp: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    agama: '',
    pekerjaan: '',
    alamat: '',
    deskripsi_pribadi: '',
    ktp_url: 'https://picsum.photos/seed/ktp/800/500',
    foto_profil_url: 'https://picsum.photos/seed/profile/400/400'
  });

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/volunteers', {
        headers: { 
          'x-tenant-id': localStorage.getItem('tenantId') || 'tenant_1',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      setVolunteers(response.data);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(v => {
      const matchesSearch = v.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === 'all' || v.domisili === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [volunteers, searchTerm, regionFilter]);

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/register-relawan', newVolunteer, {
        headers: { 
          'x-tenant-id': localStorage.getItem('tenantId') || 'tenant_1',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      fetchVolunteers();
      setIsModalOpen(false);
      setNewVolunteer({ 
        nama_lengkap: '', 
        nik: '', 
        no_telp: '',
        jenis_kelamin: 'L',
        agama: '',
        pekerjaan: '',
        alamat: '',
        deskripsi_pribadi: '',
        ktp_url: 'https://picsum.photos/seed/ktp/800/500',
        foto_profil_url: 'https://picsum.photos/seed/profile/400/400'
      });
    } catch (error) {
      console.error('Error adding volunteer:', error);
      alert('Gagal menambah relawan');
    }
  };

  const handleValidate = async (nik: string) => {
    try {
      await axios.patch(`/api/validate-relawan/${nik}`, {}, {
        headers: { 
          'x-tenant-id': localStorage.getItem('tenantId') || 'tenant_1',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      fetchVolunteers();
      setIsConfirmModalOpen(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Error validating volunteer:', error);
      alert('Gagal memvalidasi relawan');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/users/${id}`, {
        headers: { 
          'x-tenant-id': localStorage.getItem('tenantId') || 'tenant_1',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      fetchVolunteers();
      setIsConfirmModalOpen(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      alert('Gagal menghapus relawan');
    }
  };

  const openConfirmModal = (type: 'delete' | 'validate', id: string, name: string) => {
    setConfirmAction({ type, id, name });
    setIsConfirmModalOpen(true);
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-[#D4AF37] transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <select 
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-[#D4AF37] transition-all appearance-none cursor-pointer"
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
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Activities</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-zinc-500 font-bold uppercase tracking-widest">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                      Loading Field Agents...
                    </div>
                  </td>
                </tr>
              ) : filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-zinc-500 font-bold uppercase tracking-widest">
                    No volunteers found
                  </td>
                </tr>
              ) : filteredVolunteers.map((v) => (
                <tr key={v.id} className="group hover:bg-zinc-900/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                        {v.foto_profil_url ? (
                          <img src={v.foto_profil_url} alt={v.nama_lengkap} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[#D4AF37] font-black">{v.nama_lengkap.charAt(0)}</span>
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
                      {v.is_active ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3 animate-pulse" />}
                      {v.is_active ? 'Active' : 'Pending'}
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
                  <td className="px-8 py-6 text-right">
                    <span className="text-sm font-black text-white">{(v.total_activities || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      {!v.is_active && (
                        <button 
                          onClick={() => openConfirmModal('validate', v.id, v.nama_lengkap)}
                          className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-all text-green-500"
                          title="Validate Volunteer"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-500 hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openConfirmModal('delete', v.id, v.nama_lengkap)}
                        className="p-2 hover:bg-red-500/10 rounded-xl transition-all text-zinc-500 hover:text-red-500"
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

      {/* Add Volunteer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Add New Volunteer</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Register Field Agent</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              
              <form onSubmit={handleAddVolunteer} className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input 
                      required
                      type="text" 
                      value={newVolunteer.nama_lengkap}
                      onChange={e => setNewVolunteer({...newVolunteer, nama_lengkap: e.target.value})}
                      placeholder="Nama Lengkap"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">NIK (16 Digit)</label>
                      <input 
                        required
                        type="text" 
                        maxLength={16}
                        value={newVolunteer.nik}
                        onChange={e => setNewVolunteer({...newVolunteer, nik: e.target.value})}
                        placeholder="3201..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          required
                          type="tel" 
                          value={newVolunteer.no_telp}
                          onChange={e => setNewVolunteer({...newVolunteer, no_telp: e.target.value})}
                          placeholder="0812..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                      <select 
                        value={newVolunteer.jenis_kelamin}
                        onChange={e => setNewVolunteer({...newVolunteer, jenis_kelamin: e.target.value as 'L' | 'P'})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all appearance-none"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Agama</label>
                      <input 
                        required
                        type="text" 
                        value={newVolunteer.agama}
                        onChange={e => setNewVolunteer({...newVolunteer, agama: e.target.value})}
                        placeholder="Agama"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pekerjaan</label>
                    <input 
                      required
                      type="text" 
                      value={newVolunteer.pekerjaan}
                      onChange={e => setNewVolunteer({...newVolunteer, pekerjaan: e.target.value})}
                      placeholder="Pekerjaan"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Alamat Domisili</label>
                    <input 
                      required
                      type="text" 
                      value={newVolunteer.alamat}
                      onChange={e => setNewVolunteer({...newVolunteer, alamat: e.target.value})}
                      placeholder="Alamat Lengkap"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Deskripsi Pribadi</label>
                    <textarea 
                      required
                      rows={3}
                      value={newVolunteer.deskripsi_pribadi}
                      onChange={e => setNewVolunteer({...newVolunteer, deskripsi_pribadi: e.target.value})}
                      placeholder="Ceritakan sedikit tentang relawan..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black text-lg uppercase tracking-widest transition-all hover:bg-[#F1E5AC] shadow-xl shadow-[#D4AF37]/20"
                >
                  Register Volunteer
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && confirmAction && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl text-center space-y-6"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                confirmAction.type === 'delete' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
              }`}>
                {confirmAction.type === 'delete' ? <AlertCircle className="w-8 h-8" /> : <UserCheck className="w-8 h-8" />}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  {confirmAction.type === 'delete' ? 'Confirm Deletion' : 'Confirm Validation'}
                </h3>
                <p className="text-sm text-zinc-400">
                  {confirmAction.type === 'delete' 
                    ? `Are you sure you want to delete ${confirmAction.name}? This action cannot be undone.`
                    : `Are you sure you want to validate and activate ${confirmAction.name}? This will generate their unique referral code.`}
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => confirmAction.type === 'delete' ? handleDelete(confirmAction.id) : handleValidate(confirmAction.id)}
                  className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                    confirmAction.type === 'delete' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
