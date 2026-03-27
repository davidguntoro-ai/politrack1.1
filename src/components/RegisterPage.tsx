import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  MapPin,
  BookOpen,
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { ProfessionSelect } from './ProfessionSelect';

const AGAMA_OPTIONS = [
  'Islam',
  'Kristen Protestan',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
];

const KECAMATAN_OPTIONS = [
  'Menteng', 'Gambir', 'Sawah Besar', 'Kemayoran', 'Senen',
  'Cempaka Putih', 'Johar Baru', 'Tanah Abang', 'Palmerah',
  'Grogol Petamburan', 'Tambora', 'Taman Sari', 'Penjaringan',
  'Pademangan', 'Koja', 'Cilincing', 'Kelapa Gading', 'Tanjung Priok',
  'Pulo Gadung', 'Jatinegara', 'Duren Sawit', 'Kramat Jati',
  'Makasar', 'Pasar Rebo', 'Ciracas', 'Cipayung', 'Jagakarsa',
  'Pasar Minggu', 'Pesanggrahan', 'Cilandak', 'Kebayoran Baru',
  'Kebayoran Lama', 'Mampang Prapatan', 'Pancoran', 'Tebet', 'Setiabudi',
];

const INPUT_CLS =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm focus:border-[#D4AF37] outline-none transition-all text-white placeholder-zinc-600';
const INPUT_ICON_CLS = INPUT_CLS + ' pl-11';

interface RegisterPageProps {
  onBack: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBack }) => {
  const [form, setForm] = useState({
    nama_lengkap: '',
    phone: '',
    agama: '',
    pekerjaan: '',
    kecamatan: '',
    desa: '',
    password: '',
    confirm_password: '',
    alasan: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (form.password.length < 8) {
      setError('Kata sandi minimal 8 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register-volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nama_lengkap,
          phone: form.phone,
          password: form.password,
          agama: form.agama,
          pekerjaan: form.pekerjaan,
          kecamatan: form.kecamatan,
          desa: form.desa,
          alasan: form.alasan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal mendaftar. Coba lagi.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Tidak dapat terhubung ke server. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl p-10 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">Pendaftaran Berhasil!</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-2">
                Akun Anda sedang diverifikasi oleh Admin.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                Kami akan menghubungi Anda via WhatsApp ke nomor{' '}
                <span className="text-[#D4AF37] font-bold">{form.phone}</span> setelah akun disetujui.
              </p>
              <div className="p-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-8">
                <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Status Akun</p>
                <p className="text-white font-black text-lg mt-1">Menunggu Verifikasi</p>
              </div>
              <button
                onClick={onBack}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Login
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-800">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali Login
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#AA8A2E] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 shrink-0">
                    <span className="text-white font-black text-xl">P</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white tracking-tight">
                      Daftar Jadi <span className="text-[#D4AF37]">Relawan</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">
                      PoliTrack AI · Intelligence for Victory
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Nama Lengkap *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      value={form.nama_lengkap}
                      onChange={set('nama_lengkap')}
                      placeholder="Nama sesuai KTP"
                      required
                      className={INPUT_ICON_CLS}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Nomor WhatsApp * <span className="text-zinc-600 normal-case font-normal">(digunakan sebagai username)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="08xxxxxxxxxx"
                      required
                      className={INPUT_ICON_CLS + ' font-mono'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" /> Agama *
                    </label>
                    <select
                      value={form.agama}
                      onChange={set('agama')}
                      required
                      className={INPUT_CLS + ' appearance-none'}
                    >
                      <option value="">-- Pilih Agama --</option>
                      {AGAMA_OPTIONS.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3" /> Pekerjaan *
                    </label>
                    <ProfessionSelect
                      value={form.pekerjaan}
                      onChange={v => setForm(p => ({ ...p, pekerjaan: v }))}
                      selectClassName={INPUT_CLS + ' appearance-none'}
                      inputClassName={INPUT_CLS + ' mt-2'}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Kecamatan *
                    </label>
                    <select
                      value={form.kecamatan}
                      onChange={set('kecamatan')}
                      required
                      className={INPUT_CLS + ' appearance-none'}
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {KECAMATAN_OPTIONS.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Desa / Kelurahan
                    </label>
                    <input
                      type="text"
                      value={form.desa}
                      onChange={set('desa')}
                      placeholder="Nama desa / kelurahan"
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Kata Sandi *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={set('password')}
                        placeholder="Min. 8 karakter"
                        required
                        minLength={8}
                        className={INPUT_ICON_CLS + ' pr-12'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Konfirmasi Sandi *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirm_password}
                        onChange={set('confirm_password')}
                        placeholder="Ulangi kata sandi"
                        required
                        className={INPUT_ICON_CLS + ' pr-12'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" /> Mengapa ingin bergabung?
                  </label>
                  <textarea
                    value={form.alasan}
                    onChange={set('alasan')}
                    placeholder="Ceritakan motivasi Anda menjadi relawan..."
                    rows={3}
                    className={INPUT_CLS + ' resize-none'}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-400 text-xs font-semibold">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-[#F1E5AC] shadow-xl shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : (
                    'Daftar Sekarang'
                  )}
                </button>

                <p className="text-center text-zinc-600 text-[10px] leading-relaxed">
                  Akun baru akan berstatus <span className="text-yellow-500 font-bold">PENDING</span> hingga disetujui oleh Admin.
                  Anda tidak dapat masuk sebelum diverifikasi.
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-zinc-700 text-[10px] uppercase tracking-widest mt-6 font-bold">
          PoliTrack AI &copy; 2025 · Sistem Manajemen Kampanye
        </p>
      </motion.div>
    </div>
  );
};
