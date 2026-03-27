import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Phone, 
  MessageSquare, 
  Share2, 
  Download, 
  Instagram, 
  Twitter, 
  Facebook, 
  Send,
  CheckCircle2,
  Users,
  Target,
  Heart
} from 'lucide-react';
import { Tenant } from '../types';
import axios from 'axios';

import { VolunteerRegistrationFlow } from './VolunteerRegistrationFlow';

interface PublicMicrositeProps {
  tenant: Tenant;
}

export const PublicMicrosite: React.FC<PublicMicrositeProps> = ({ tenant }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    kecamatan: '',
    kelurahan: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'aspiration' | 'volunteer'>('aspiration');
  const [stats, setStats] = useState({ activities: 1240, solutions: 856 });

  // Mock stats update
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        activities: prev.activities + Math.floor(Math.random() * 2),
        solutions: prev.solutions + Math.floor(Math.random() * 1.2)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveContact = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:H. Ahmad Fauzi, S.T.
ORG:Calon Legislatif Dapil 3
TEL;TYPE=CELL:+628123456789
EMAIL:kontak@ahmadfauzi.id
URL:https://ahmadfauzi.id
END:VCARD`;
    
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Ahmad_Fauzi_Contact.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/public/aspiration', {
        ...formData,
        tenant_id: tenant.id
      });
      setIsSubmitted(true);
      setFormData({ name: '', phone: '', kecamatan: '', kelurahan: '', message: '' });
    } catch (error) {
      console.error('Error submitting aspiration:', error);
      alert('Gagal mengirim aspirasi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-tenant-primary/30">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex flex-col items-center justify-end pb-20 px-6 overflow-hidden">
        {/* Background Gradient & Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
          <img 
            src="https://picsum.photos/seed/candidate/1200/1600" 
            alt="Candidate" 
            className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
            referrerPolicy="no-referrer"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 text-center space-y-4 max-w-lg"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tenant-primary/10 border border-tenant-primary/20 text-tenant-primary text-[10px] font-bold uppercase tracking-[0.2em]">
            <Target className="w-3 h-3" /> Nomor Urut 3
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white">
            H. AHMAD <span className="text-tenant-primary">FAUZI</span>, S.T.
          </h1>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed">
            Berkhidmat untuk Rakyat, Membangun Wilayah dengan Teknologi dan Integritas.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button 
              onClick={handleSaveContact}
              className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 rounded-full font-bold text-sm hover:scale-105 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Simpan Kontak
            </button>
            <a 
              href="https://wa.me/628123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-full font-bold text-sm hover:bg-zinc-800 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-green-500" /> WhatsApp Me
            </a>
          </div>
        </motion.div>
      </section>

      {/* Stats Badge */}
      <div className="max-w-md mx-auto px-6 -mt-10 relative z-30">
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl flex justify-around items-center">
          <div className="text-center">
            <div className="text-2xl font-black text-tenant-primary">{stats.activities.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Aktivitas</div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">{stats.solutions.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Solusi Selesai</div>
          </div>
        </div>
      </div>

      {/* Vision & Mission */}
      <section className="py-24 px-6 max-w-xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold text-tenant-primary uppercase tracking-[0.3em]">Visi & Misi</h2>
          <p className="text-2xl font-bold text-white">3 Pilar Perubahan</p>
        </div>

        <div className="grid gap-6">
          {[
            { 
              title: "Ekonomi Digital", 
              desc: "Mendorong digitalisasi UMKM lokal untuk akses pasar yang lebih luas dan permodalan yang adil.",
              icon: Users
            },
            { 
              title: "Infrastruktur Pintar", 
              desc: "Pemerataan akses internet dan perbaikan infrastruktur dasar berbasis data kebutuhan warga.",
              icon: Target
            },
            { 
              title: "Pendidikan Inklusif", 
              desc: "Program beasiswa khusus untuk anak-anak berprestasi dari keluarga kurang mampu di wilayah.",
              icon: Heart
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl hover:border-tenant-primary/30 transition-all"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-tenant-primary/10 flex items-center justify-center text-tenant-primary shrink-0 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Forms Section */}
      <section className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-xs font-bold text-tenant-primary uppercase tracking-[0.3em]">Partisipasi</h2>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setActiveTab('aspiration')}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'aspiration' ? 'bg-tenant-primary text-white' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}
              >
                Suara Rakyat
              </button>
              <button 
                onClick={() => setActiveTab('volunteer')}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'volunteer' ? 'bg-tenant-primary text-white' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}
              >
                Jadi Relawan
              </button>
            </div>
          </div>

          {isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 p-12 rounded-3xl text-center space-y-4"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Terima Kasih!</h3>
              <p className="text-zinc-400 text-sm">
                {activeTab === 'aspiration' 
                  ? 'Aspirasi Anda telah kami terima dan akan segera kami tindaklanjuti.' 
                  : 'Pendaftaran Anda telah kami terima. Tim kami akan segera memvalidasi data Anda.'}
              </p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="text-tenant-primary font-bold text-sm underline underline-offset-4"
              >
                {activeTab === 'aspiration' ? 'Kirim Aspirasi Lain' : 'Kembali'}
              </button>
            </motion.div>
          ) : activeTab === 'aspiration' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Existing Aspiration Form */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-tenant-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">No. WhatsApp</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="0812..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-tenant-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Kecamatan</label>
                  <input 
                    required
                    type="text" 
                    value={formData.kecamatan}
                    onChange={e => setFormData({...formData, kecamatan: e.target.value})}
                    placeholder="Nama Kecamatan"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-tenant-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Kelurahan</label>
                  <input 
                    required
                    type="text" 
                    value={formData.kelurahan}
                    onChange={e => setFormData({...formData, kelurahan: e.target.value})}
                    placeholder="Nama Kelurahan"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-tenant-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Aspirasi / Keluhan</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  placeholder="Tuliskan apa yang ingin Anda sampaikan..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-tenant-primary outline-none transition-all resize-none"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-tenant-primary text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Kirim Aspirasi
                  </>
                )}
              </button>
            </form>
          ) : (
            <VolunteerRegistrationFlow 
              tenant={tenant} 
              onComplete={() => {
                setActiveTab('aspiration');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />
          )}
        </div>
      </section>

      {/* Social Media & Footer */}
      <footer className="py-20 px-6 text-center space-y-8">
        <div className="flex justify-center gap-6">
          {[Instagram, Twitter, Facebook].map((Icon, i) => (
            <a 
              key={i}
              href="#" 
              className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-tenant-primary hover:border-tenant-primary/30 transition-all"
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>
        
        <div className="space-y-2">
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Powered by</p>
          <div className="text-xl font-black text-white tracking-tighter">
            PoliTrack <span className="text-tenant-primary">AI</span>
          </div>
        </div>
        
        <p className="text-[10px] text-zinc-700 uppercase font-bold tracking-widest">
          &copy; 2026 Tim Pemenangan Ahmad Fauzi. All Rights Reserved.
        </p>
      </footer>

      {/* Share FAB */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-tenant-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 z-50">
        <Share2 className="w-6 h-6" />
      </button>
    </div>
  );
};
