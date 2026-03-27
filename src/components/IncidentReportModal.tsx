import React, { useState, useEffect } from 'react';
import { AlertTriangle, Camera, MapPin, Send, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

const CATEGORIES = [
  { id: 'VOTER_INTIMIDATION', label: 'Intimidasi Pemilih' },
  { id: 'BALLOT_TAMPERING', label: 'Kecurangan Surat Suara' },
  { id: 'MONEY_POLITICS', label: 'Politik Uang' },
  { id: 'VIOLENCE', label: 'Kekerasan / Kerusuhan' },
  { id: 'OTHER', label: 'Lainnya' }
];

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({ isOpen, onClose, tenantId }) => {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.error("Location error:", err)
      );
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/incidents/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          description,
          location,
          deviceId: navigator.userAgent // Simple device ID
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setCategory('');
          setDescription('');
        }, 2000);
      }
    } catch (err) {
      console.error("Report error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-zinc-950 border border-red-900/50 rounded-3xl overflow-hidden shadow-2xl shadow-red-900/20"
          >
            <div className="bg-red-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <h2 className="text-xl font-black uppercase tracking-tighter">Emergency Report</h2>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {success ? (
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Laporan Terkirim</h3>
                  <p className="text-zinc-500">Tim Hukum telah menerima laporan Anda. Data telah ditandatangani secara digital untuk keperluan hukum.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kategori Insiden</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-500 transition-all appearance-none"
                      required
                    >
                      <option value="">Pilih Kategori...</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Deskripsi Kejadian</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Jelaskan kronologi kejadian secara detail..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-500 transition-all min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                      <MapPin className={`w-5 h-5 ${location ? 'text-green-500' : 'text-zinc-600'}`} />
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">GPS Location</p>
                        <p className="text-xs font-mono">{location ? 'CAPTURED' : 'WAITING...'}</p>
                      </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-zinc-800 transition-all">
                      <Camera className="w-5 h-5 text-zinc-600" />
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Evidence</p>
                        <p className="text-xs">UPLOAD PHOTO</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !category || !description}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                  >
                    {loading ? 'SUBMITTING...' : 'KIRIM LAPORAN DARURAT'}
                    <Send className="w-5 h-5" />
                  </button>

                  <p className="text-[10px] text-zinc-600 text-center uppercase font-bold tracking-widest">
                    Laporan ini akan ditandatangani secara digital dan tidak dapat diubah (WORM Compliance).
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
