import React, { useState } from 'react';
import { 
  Mic2, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  AlertCircle,
  Loader2,
  FileText,
  MessageSquare,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { PROFESSIONS } from '../types';

export const SpeechGenerator: React.FC = () => {
  const [judul, setJudul] = useState('');
  const [isu, setIsu] = useState('');
  const [pekerjaan, setPekerjaan] = useState('Petani');
  const [kataKunci, setKataKunci] = useState('');
  const [generatedSpeech, setGeneratedSpeech] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!judul || !isu || !kataKunci || !pekerjaan) {
      setError('Mohon isi semua field (Judul, Isu, Pekerjaan, dan Kata Kunci Detail).');
      return;
    }

    setError('');
    setIsGenerating(true);
    setGeneratedSpeech('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Buatkan naskah pidato politik yang kuat, persuasif, dan berorientasi pada solusi dalam Bahasa Indonesia.
        
        AUDIENS UTAMA:
        - Profesi/Pekerjaan: ${pekerjaan}

        INPUT:
        - JUDUL: ${judul}
        - ISU: ${isu}
        - KATA KUNCI DETAIL: ${kataKunci}

        PERSYARATAN STRUKTUR:
        1. Pembukaan (Exordium): Salam, koneksi emosional dengan audiens ${pekerjaan}, membangun kesamaan pandangan.
        2. Pemaparan Isu (Narratio): Akui isu [ISU] dengan kuat. Validasi rasa frustrasi audiens ${pekerjaan}. Gunakan "Kita" untuk menunjukkan persatuan.
        3. Tawaran Solusi (Propositio): SANGAT PENTING. Usulkan solusi spesifik dan dapat ditindaklanjuti berdasarkan [KATA KUNCI DETAIL] yang relevan bagi profesi ${pekerjaan}. Tunjukkan kepercayaan diri.
        4. Penutup (Peroratio): Ajakan bertindak (call to action), kobarkan semangat massa, slogan akhir yang kuat.

        NADA & GAYA BAHASA:
        - Sesuaikan diksi dengan audiens yang berprofesi sebagai ${pekerjaan}.
        - Empati namun kuat, otoritatif namun mudah diakses.
        - Gunakan perangkat retoris politik Indonesia yang umum (misal: "Saudara-saudara sekalian", "Merdeka!").
        - Bahasa Indonesia formal namun penuh gairah. Hindari jargon teknis yang membosankan.
        - Fokus berat pada memberikan SOLUSI, bukan hanya mendeskripsikan masalah.`,
        config: {
          systemInstruction: "Anda adalah Penulis Pidato Politik Senior & Pakar Retorika (Konteks Indonesia). Tugas Anda adalah menghasilkan pidato yang kuat, persuasif, dan berorientasi pada solusi berdasarkan input pengguna.",
          temperature: 0.8,
        }
      });

      setGeneratedSpeech(response.text || '');
    } catch (err) {
      console.error('Error generating speech:', err);
      setError('Gagal menghasilkan pidato. Silakan coba lagi nanti.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSpeech);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-card bg-zinc-950 border-zinc-800 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Mic2 className="w-32 h-32 text-gold-primary" />
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-gold-primary/10 rounded-2xl flex items-center justify-center border border-gold-primary/20">
            <Mic2 className="w-8 h-8 text-gold-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Political Speechwriter AI</h2>
            <p className="text-[10px] font-bold text-gold-primary uppercase tracking-widest">Senior Rhetoric Expert & Strategic Communication</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="dashboard-card space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-gold-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Speech Parameters</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Judul Orasi / Acara</label>
                <input 
                  type="text" 
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Orasi di Pasar Hewan"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Isu Utama (Masalah)</label>
                <input 
                  type="text" 
                  value={isu}
                  onChange={(e) => setIsu(e.target.value)}
                  placeholder="Contoh: Retribusi Mahal, Fasilitas Kumuh"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Target Audiens (Pekerjaan)</label>
                <select 
                  value={pekerjaan}
                  onChange={(e) => setPekerjaan(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-gold-primary outline-none transition-all text-white appearance-none"
                >
                  <option value="">Pilih Pekerjaan</option>
                  {PROFESSIONS.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Kata Kunci Detail & Solusi</label>
                <textarea 
                  rows={4}
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  placeholder="Contoh: Sebutkan Pak Lurah, janjikan atap baru, gunakan pendekatan emosional, turunkan biaya retribusi 50%."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-sm focus:border-gold-primary outline-none transition-all resize-none text-white"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-gold-primary text-black font-black rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-gold-glow"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    MENGHASILKAN PIDATO...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    GENERATE SPEECH
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="dashboard-card bg-zinc-900/50 border-dashed border-zinc-800 p-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Tips Retorika</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-primary mt-1.5 shrink-0" />
                Gunakan jeda (pausing) setelah poin-poin penting untuk memberikan efek dramatis.
              </li>
              <li className="flex items-start gap-2 text-xs text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-primary mt-1.5 shrink-0" />
                Kontak mata dengan audiens di berbagai sisi panggung sangat krusial.
              </li>
              <li className="flex items-start gap-2 text-xs text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-primary mt-1.5 shrink-0" />
                Tekankan pada kata "KITA" untuk membangun rasa kepemilikan bersama.
              </li>
            </ul>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <div className="dashboard-card h-full flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Generated Manuscript</h3>
              </div>
              {generatedSpeech && (
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Text
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                {!generatedSpeech && !isGenerating ? (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4"
                  >
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Belum Ada Naskah</p>
                      <p className="text-xs text-zinc-600 mt-1">Isi parameter di sebelah kiri dan klik Generate untuk membuat pidato politik Anda.</p>
                    </div>
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin" />
                      <Sparkles className="w-6 h-6 text-gold-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-xs font-bold text-gold-primary uppercase tracking-widest animate-pulse">AI sedang merangkai kata-kata...</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert max-w-none"
                  >
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 font-serif text-lg leading-relaxed text-zinc-200 whitespace-pre-wrap">
                      {generatedSpeech}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {generatedSpeech && (
              <div className="mt-6 flex items-center gap-4 p-4 bg-gold-primary/5 border border-gold-primary/10 rounded-2xl">
                <div className="w-10 h-10 bg-gold-primary/20 rounded-xl flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-gold-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-primary">Siap Disampaikan</p>
                  <p className="text-xs text-zinc-400">Naskah ini telah dioptimalkan untuk resonansi emosional dan dampak politik maksimal.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
