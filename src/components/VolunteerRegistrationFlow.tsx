import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  BookOpen, 
  FileText, 
  Camera, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Upload,
  AlertCircle,
  X
} from 'lucide-react';
import axios from 'axios';
import { Tenant } from '../types';

interface VolunteerRegistrationFlowProps {
  tenant: Tenant;
  onComplete?: () => void;
}

type Step = 'form' | 'review' | 'success';

export const VolunteerRegistrationFlow: React.FC<VolunteerRegistrationFlowProps> = ({ tenant, onComplete }) => {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nik: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    agama: '',
    pekerjaan: '',
    alamat: '',
    no_telp: '',
    deskripsi_pribadi: '',
  });

  const [files, setFiles] = useState<{
    ktp: File | null;
    foto: File | null;
  }>({
    ktp: null,
    foto: null,
  });

  const [previews, setPreviews] = useState<{
    ktp: string | null;
    foto: string | null;
  }>({
    ktp: null,
    foto: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ktpInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'foto') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = () => {
    const { nama_lengkap, nik, no_telp, alamat } = formData;
    return (
      nama_lengkap.length > 0 &&
      nik.length === 16 &&
      no_telp.length > 0 &&
      alamat.length > 0 &&
      files.ktp !== null &&
      files.foto !== null
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // In a real app, we'd upload files to storage first
      // For this demo, we'll use the previews as URLs
      const payload = {
        ...formData,
        ktp_url: previews.ktp || 'https://picsum.photos/seed/ktp/800/500',
        foto_profil_url: previews.foto || 'https://picsum.photos/seed/profile/400/400',
      };

      await axios.post('/api/register-relawan', payload, {
        headers: { 'x-tenant-id': tenant.id }
      });
      
      setStep('success');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Gagal mendaftarkan relawan. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Formulir Pendaftaran Relawan</h2>
              <p className="text-zinc-500 text-sm">Lengkapi data diri Anda untuk bergabung bersama Tim Pemenangan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 text-gold-primary mb-2">
                  <User className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Informasi Pribadi</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <div className="relative">
                      <input 
                        name="nama_lengkap"
                        value={formData.nama_lengkap}
                        onChange={handleInputChange}
                        placeholder="Sesuai KTP"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">NIK (16 Digit)</label>
                    <input 
                      name="nik"
                      maxLength={16}
                      value={formData.nik}
                      onChange={handleInputChange}
                      placeholder="3201..."
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                    <select 
                      name="jenis_kelamin"
                      value={formData.jenis_kelamin}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all appearance-none"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Agama</label>
                    <input 
                      name="agama"
                      value={formData.agama}
                      onChange={handleInputChange}
                      placeholder="Agama"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Work */}
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 text-gold-primary mb-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Kontak & Pekerjaan</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">No. WhatsApp</label>
                    <input 
                      name="no_telp"
                      value={formData.no_telp}
                      onChange={handleInputChange}
                      placeholder="0812..."
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Pekerjaan</label>
                    <input 
                      name="pekerjaan"
                      value={formData.pekerjaan}
                      onChange={handleInputChange}
                      placeholder="Pekerjaan"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Alamat Domisili</label>
                  <textarea 
                    name="alamat"
                    rows={2}
                    value={formData.alamat}
                    onChange={handleInputChange}
                    placeholder="Alamat Lengkap"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Deskripsi Pribadi</label>
                  <textarea 
                    name="deskripsi_pribadi"
                    rows={3}
                    value={formData.deskripsi_pribadi}
                    onChange={handleInputChange}
                    placeholder="Ceritakan sedikit tentang motivasi Anda bergabung..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Uploads */}
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 text-gold-primary mb-2">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Dokumen Pendukung</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* KTP Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Foto KTP (Wajib)</label>
                    <div 
                      onClick={() => ktpInputRef.current?.click()}
                      className={`relative aspect-[1.6/1] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 ${
                        previews.ktp ? 'border-gold-primary/50' : 'border-zinc-800 hover:border-gold-primary/30 bg-zinc-900/30'
                      }`}
                    >
                      {previews.ktp ? (
                        <img src={previews.ktp} className="w-full h-full object-cover" alt="KTP Preview" />
                      ) : (
                        <>
                          <CreditCard className="w-8 h-8 text-zinc-700" />
                          <span className="text-[10px] font-bold text-zinc-600 uppercase">Klik untuk Unggah</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={ktpInputRef}
                        onChange={(e) => handleFileChange(e, 'ktp')}
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                  </div>

                  {/* Foto Profil Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Pas Foto (Wajib)</label>
                    <div 
                      onClick={() => fotoInputRef.current?.click()}
                      className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 ${
                        previews.foto ? 'border-gold-primary/50' : 'border-zinc-800 hover:border-gold-primary/30 bg-zinc-900/30'
                      }`}
                    >
                      {previews.foto ? (
                        <img src={previews.foto} className="w-full h-full object-cover" alt="Foto Profil Preview" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-zinc-700" />
                          <span className="text-[10px] font-bold text-zinc-600 uppercase">Klik untuk Unggah</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fotoInputRef}
                        onChange={(e) => handleFileChange(e, 'foto')}
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('review')}
              disabled={!isFormValid()}
              className="w-full py-4 bg-gold-primary text-zinc-950 font-black rounded-2xl hover:bg-gold-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-primary/20"
            >
              Lanjut ke Peninjauan <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div
            key="review"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Konfirmasi Data</h2>
              <p className="text-zinc-500 text-sm">Pastikan seluruh data yang Anda masukkan sudah benar.</p>
            </div>

            <div className="bg-zinc-900/50 border border-gold-primary/20 rounded-3xl p-8 space-y-8 shadow-2xl shadow-gold-primary/5">
              {/* Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                {[
                  { label: 'Nama Lengkap', value: formData.nama_lengkap, icon: User },
                  { label: 'NIK', value: formData.nik, icon: FileText },
                  { label: 'Jenis Kelamin', value: formData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan', icon: User },
                  { label: 'Agama', value: formData.agama, icon: BookOpen },
                  { label: 'No. WhatsApp', value: formData.no_telp, icon: Phone },
                  { label: 'Pekerjaan', value: formData.pekerjaan, icon: Briefcase },
                  { label: 'Alamat', value: formData.alamat, icon: MapPin, full: true },
                  { label: 'Deskripsi', value: formData.deskripsi_pribadi, icon: FileText, full: true },
                ].map((item, i) => (
                  <div key={i} className={`${item.full ? 'md:col-span-2' : ''} space-y-1`}>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <item.icon className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
                    </div>
                    <p className="text-sm text-white font-medium">{item.value || '-'}</p>
                  </div>
                ))}
              </div>

              {/* Previews */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Preview KTP</span>
                  <div className="aspect-[1.6/1] rounded-xl overflow-hidden border border-zinc-800">
                    <img src={previews.ktp!} className="w-full h-full object-cover" alt="KTP Review" />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Preview Foto</span>
                  <div className="aspect-square rounded-xl overflow-hidden border border-zinc-800">
                    <img src={previews.foto!} className="w-full h-full object-cover" alt="Foto Review" />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => setStep('form')}
                className="flex-1 py-4 bg-zinc-900 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 border border-zinc-800"
              >
                <ChevronLeft className="w-4 h-4" /> Batal / Edit Kembali
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[1.5] py-4 bg-gold-primary text-zinc-950 font-black rounded-2xl hover:bg-gold-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold-primary/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                ) : (
                  <>Simpan & Daftar <CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-8 py-12"
          >
            <div className="relative w-24 h-24 mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="absolute inset-0 bg-gold-primary rounded-full flex items-center justify-center text-zinc-950"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-gold-primary/20 rounded-full -z-10"
              />
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <h3 className="text-2xl font-black text-white">Pendaftaran Berhasil!</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Data Relawan Telah Tersimpan. Akun Anda saat ini sedang dalam proses peninjauan. 
                Mohon menunggu validasi dari atasan/kandidat.
              </p>
            </div>

            <button
              onClick={() => onComplete?.()}
              className="px-12 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all border border-zinc-800"
            >
              Selesai
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
