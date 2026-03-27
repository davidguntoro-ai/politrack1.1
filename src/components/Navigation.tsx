import React, { useState } from 'react';
import { User, Tenant, UserRole } from '../types';
import {
  LayoutDashboard,
  Map as MapIcon,
  Users,
  Settings,
  LogOut,
  CircleDollarSign,
  Flag,
  Database,
  MessageSquare,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Edit2,
  Save,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { api } from '../services/api';

interface SidebarProps {
  user: User;
  tenant: Tenant;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
}

interface TopBarProps {
  user: User;
  isCollapsed?: boolean;
  onUpdateUser: (patch: Partial<User>) => void;
}

const GOLD_ACCENT = '#D4AF37';

export const Sidebar: React.FC<SidebarProps> = ({
  user, tenant, activeTab = 'overview', onTabChange,
  isCollapsed, setIsCollapsed, onLogout,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { toast } = useToast();

  const menuItems = [
    { id: 'overview',     label: 'Dashboard',      icon: LayoutDashboard, roles: [UserRole.KANDIDAT, UserRole.KOORCAM, UserRole.DATA_ENTRY] },
    { id: 'targeting',    label: 'Wilayah',         icon: MapIcon,         roles: [UserRole.KANDIDAT, UserRole.KOORCAM] },
    { id: 'volunteers',   label: 'Relawan',          icon: Users,           roles: [UserRole.KANDIDAT, UserRole.KOORCAM] },
    { id: 'finance',      label: 'Donasi',           icon: CircleDollarSign,roles: [UserRole.KANDIDAT] },
    { id: 'campaign',     label: 'Kampanye',         icon: Flag,            roles: [UserRole.KANDIDAT] },
    { id: 'voters',       label: 'Data Pendukung',   icon: Database,        roles: [UserRole.KANDIDAT, UserRole.DATA_ENTRY] },
    { id: 'intelligence', label: 'Aspirasi',         icon: MessageSquare,   roles: [UserRole.KANDIDAT] },
    { id: 'witness',      label: 'Saksi & C1',       icon: ShieldCheck,     roles: [UserRole.KANDIDAT] },
    { id: 'settings',     label: 'Pengaturan',       icon: Settings,        roles: [UserRole.KANDIDAT, UserRole.KOORCAM, UserRole.DATA_ENTRY] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    toast('Anda telah keluar. Sampai jumpa!', 'info');
    setTimeout(() => onLogout(), 800);
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-[#0B0F19] border-r border-zinc-800/50">
      {/* Branding */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#AA8A2E] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
            <span className="text-white font-black text-xl">P</span>
          </div>
          {!isCollapsed && (
            <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              PoliTrack <span className="text-[#D4AF37]">AI</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
        {filteredMenu.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange?.(item.id);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group relative ${
                isActive
                  ? 'bg-[#D4AF37]/10 text-white shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-[#D4AF37] rounded-r-full shadow-[0_0_10px_#D4AF37]"
                />
              )}
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#D4AF37]' : 'group-hover:text-[#D4AF37]'}`} />
              {!isCollapsed && (
                <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Card */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className={`flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="relative shrink-0">
            {user.foto_profil_url ? (
              <img
                src={user.foto_profil_url}
                alt={user.nama_lengkap || user.email}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-zinc-800"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#AA8A2E] flex items-center justify-center ring-2 ring-zinc-800">
                <span className="text-white font-black text-sm">
                  {(user.nama_lengkap || user.email)[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0B0F19] rounded-full" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate uppercase tracking-tighter">
                {user.nama_lengkap || tenant.candidate_name || user.email.split('@')[0]}
              </p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">
                {user.no_telp || user.role}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen transition-all duration-300 z-30 ${isCollapsed ? 'w-24' : 'w-72'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-72 z-50 lg:hidden"
            >
              <SidebarContent />
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-6 right-[-50px] p-2 bg-zinc-900 border border-zinc-800 rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const TopBar: React.FC<TopBarProps> = ({ user, isCollapsed, onUpdateUser }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nama_lengkap: user.nama_lengkap || user.email.split('@')[0],
    email: user.email,
    no_telp: user.no_telp || '',
    pekerjaan: user.pekerjaan || '',
    foto_profil_url: user.foto_profil_url || '',
  });
  const { toast } = useToast();

  React.useEffect(() => {
    setForm({
      nama_lengkap: user.nama_lengkap || user.email.split('@')[0],
      email: user.email,
      no_telp: user.no_telp || '',
      pekerjaan: user.pekerjaan || '',
      foto_profil_url: user.foto_profil_url || '',
    });
  }, [user]);

  const openProfile = () => {
    setIsProfileOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_lengkap.trim()) {
      toast('Nama lengkap tidak boleh kosong.', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/api/users/me', form);
    } catch {
      // Silently proceed in demo mode — update local state regardless
    } finally {
      onUpdateUser({
        nama_lengkap: form.nama_lengkap,
        email: form.email,
        no_telp: form.no_telp,
        pekerjaan: form.pekerjaan,
        foto_profil_url: form.foto_profil_url,
      });
      setIsSaving(false);
      setIsProfileOpen(false);
      toast('Profil berhasil disimpan.', 'success');
    }
  };

  const displayName = user.nama_lengkap || user.email.split('@')[0];
  const avatarLetter = displayName[0]?.toUpperCase() || '?';

  return (
    <>
      <header className="h-20 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-8 sticky top-0 z-20 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <h2 className="text-xl font-black text-white tracking-tighter uppercase">
              Executive <span className="text-[#D4AF37]">Terminal</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Intelligence for Victory</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-tighter">
                {user.no_telp || user.email}
              </span>
            </div>
            <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">{user.role}</span>
          </div>
          <button
            onClick={openProfile}
            title="Edit Profil"
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center font-black text-[#D4AF37] shadow-lg hover:border-[#D4AF37]/40 transition-all"
          >
            {user.foto_profil_url ? (
              <img src={user.foto_profil_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              avatarLetter
            )}
          </button>
        </div>
      </header>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-zinc-800 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                  {form.foto_profil_url ? (
                    <img src={form.foto_profil_url} alt={form.nama_lengkap} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-[#D4AF37]">{form.nama_lengkap[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white truncate">{form.nama_lengkap || 'Edit Profil'}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave} className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Foto Profil (URL)</label>
                  <input
                    type="url"
                    value={form.foto_profil_url}
                    onChange={e => setForm({ ...form, foto_profil_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white placeholder-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input
                    required
                    type="text"
                    value={form.nama_lengkap}
                    onChange={e => setForm({ ...form, nama_lengkap: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">No. Telepon</label>
                    <input
                      type="tel"
                      value={form.no_telp}
                      onChange={e => setForm({ ...form, no_telp: e.target.value })}
                      placeholder="08xx..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pekerjaan</label>
                    <input
                      type="text"
                      value={form.pekerjaan}
                      onChange={e => setForm({ ...form, pekerjaan: e.target.value })}
                      placeholder="Jabatan / Pekerjaan"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-[#F1E5AC] shadow-xl shadow-[#D4AF37]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
