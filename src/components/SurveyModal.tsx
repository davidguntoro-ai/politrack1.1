import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Star, MessageSquare, Tag, MapPin, CheckCircle, Camera, Loader2 } from 'lucide-react';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose, tenantId }) => {
  const [formData, setFormData] = useState({
    voter_name: '',
    volunteer_name: 'Relawan Test',
    loyalty_score: 5,
    sentiment_score: 5,
    voter_status: 'Undecided',
    issue_tag: 'Economy',
    photo_url: '',
  });
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleGetLocation = () => {
    setFetchingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setFetchingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setFetchingLocation(false);
          alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
        }
      );
    } else {
      alert("Geolocation tidak didukung di browser ini.");
      setFetchingLocation(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    // Simulate photo upload - in real app would upload to Firebase Storage
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert("Mohon ambil lokasi GPS terlebih dahulu.");
      return;
    }
    if (!formData.photo_url) {
      alert("Mohon unggah foto bukti kunjungan.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          ...formData,
          latitude: location.lat,
          longitude: location.lng,
          tenant_id: tenantId,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            voter_name: '',
            volunteer_name: 'Relawan Test',
            loyalty_score: 5,
            sentiment_score: 5,
            voter_status: 'Undecided',
            issue_tag: 'Economy',
            photo_url: '',
          });
          setLocation(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit survey:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {success ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Data Saved!</h3>
                <p className="text-zinc-500 text-sm">Voter information has been successfully persisted to the database.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tenant-primary/10 rounded-2xl flex items-center justify-center">
                      <Send className="w-5 h-5 text-tenant-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Voter Survey</h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">4-Pillar Data Entry</p>
                    </div>
                  </div>
                  <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Voter Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        required
                        type="text"
                        value={formData.voter_name}
                        onChange={e => setFormData({...formData, voter_name: e.target.value})}
                        placeholder="Full Name"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-tenant-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Loyalty (1-10)</label>
                      <div className="relative">
                        <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="number" min="1" max="10"
                          value={formData.loyalty_score}
                          onChange={e => setFormData({...formData, loyalty_score: parseInt(e.target.value)})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-tenant-primary transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Sentiment (1-10)</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="number" min="1" max="10"
                          value={formData.sentiment_score}
                          onChange={e => setFormData({...formData, sentiment_score: parseInt(e.target.value)})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-tenant-primary transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Status</label>
                      <select 
                        value={formData.voter_status}
                        onChange={e => setFormData({...formData, voter_status: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm outline-none focus:border-tenant-primary transition-colors appearance-none"
                      >
                        <option value="Strong Support">Strong Support</option>
                        <option value="Weak Support">Weak Support</option>
                        <option value="Undecided">Undecided</option>
                        <option value="Opponent">Opponent</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Primary Issue</label>
                      <select 
                        value={formData.issue_tag}
                        onChange={e => setFormData({...formData, issue_tag: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm outline-none focus:border-tenant-primary transition-colors appearance-none"
                      >
                        <option value="Economy">Economy</option>
                        <option value="Health">Health</option>
                        <option value="Education">Education</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Agriculture">Agriculture</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">GPS Validation</label>
                      <button 
                        type="button"
                        onClick={handleGetLocation}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${location ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-tenant-primary'}`}
                      >
                        {fetchingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                        <span className="text-xs font-bold uppercase">
                          {location ? 'Lokasi Terkunci' : 'Ambil Lokasi'}
                        </span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Photo Evidence</label>
                      <label className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl border cursor-pointer transition-all ${formData.photo_url ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-tenant-primary'}`}>
                        {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        <span className="text-xs font-bold uppercase">
                          {formData.photo_url ? 'Foto Terunggah' : 'Ambil Foto'}
                        </span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                <button 
                  disabled={loading || fetchingLocation || uploadingPhoto}
                  className="w-full py-5 bg-tenant-primary hover:bg-tenant-primary/90 text-white rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-xl shadow-tenant-primary/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Saving to Database...' : 'Submit Survey'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
