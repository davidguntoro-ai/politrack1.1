import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, User, Star, MessageSquare, Tag, MapPin, CheckCircle, Camera,
  Loader2, AlertTriangle, Eye, ArrowLeft, Navigation, Briefcase
} from 'lucide-react';
import { ProfessionSelect } from './ProfessionSelect';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

type GpsStatus = 'idle' | 'fetching' | 'ok' | 'denied';

const ISSUE_OPTIONS = ['Economy', 'Health', 'Education', 'Infrastructure', 'Agriculture'];
const STATUS_OPTIONS = ['Strong Support', 'Weak Support', 'Undecided', 'Opponent'];

const STATUS_COLOR: Record<string, string> = {
  'Strong Support': 'text-green-400',
  'Weak Support': 'text-yellow-400',
  'Undecided': 'text-zinc-400',
  'Opponent': 'text-red-400',
};

export const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose, tenantId }) => {
  const [formData, setFormData] = useState({
    voter_name: '',
    voter_nik: '',
    voter_phone: '',
    volunteer_name: '',
    pekerjaan: '',
    loyalty_score: 5,
    sentiment_score: 5,
    voter_status: 'Undecided',
    issue_tag: 'Economy',
    photo_url: '',
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowReview(false);
      setSuccess(false);
      return;
    }
    fetchGps();

    const stored = localStorage.getItem('politrack_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setFormData(prev => ({ ...prev, volunteer_name: u.name || u.nama_lengkap || '' }));
      } catch {}
    }
  }, [isOpen]);

  const fetchGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('denied');
      return;
    }
    setGpsStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('ok');
      },
      () => setGpsStatus('denied'),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReview(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('politrack_token');
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          voter_name: formData.voter_name,
          voter_nik: formData.voter_nik || undefined,
          volunteer_name: formData.volunteer_name,
          pekerjaan: formData.pekerjaan || undefined,
          loyalty_score: formData.loyalty_score,
          sentiment_score: formData.sentiment_score,
          voter_status: formData.voter_status,
          issue_tag: formData.issue_tag,
          photo_url: formData.photo_url,
          latitude: location?.lat ?? null,
          longitude: location?.lng ?? null,
          tenant_id: tenantId,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setShowReview(false);
          setFormData({
            voter_name: '',
            voter_nik: '',
            voter_phone: '',
            volunteer_name: '',
            pekerjaan: '',
            loyalty_score: 5,
            sentiment_score: 5,
            voter_status: 'Undecided',
            issue_tag: 'Economy',
            photo_url: '',
          });
          setLocation(null);
          setGpsStatus('idle');
        }, 2000);
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.detail || 'Gagal menyimpan data survei.');
      }
    } catch (err) {
      console.error('Survey submit error:', err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const mapsUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {success ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Data Tersimpan!</h3>
                <p className="text-zinc-500 text-sm">Survei berhasil dikirim ke database beserta koordinat GPS.</p>
              </div>

            ) : showReview ? (
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tenant-primary/10 rounded-2xl flex items-center justify-center">
                    <Eye className="w-5 h-5 text-tenant-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Review Data</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Periksa sebelum mengirim</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800 space-y-3">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Identitas Pemilih</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Nama</span>
                      <span className="text-sm font-bold">{formData.voter_name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">NIK</span>
                      <span className="text-sm font-mono">{formData.voter_nik || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">No. HP</span>
                      <span className="text-sm font-mono">{formData.voter_phone || '—'}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800 space-y-3">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Data Survei</p>
                    {formData.pekerjaan && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-500">Pekerjaan</span>
                        <span className="text-sm font-bold flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-tenant-primary" />{formData.pekerjaan}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Isu Prioritas</span>
                      <span className="text-sm font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3 text-tenant-primary" />{formData.issue_tag}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Status Dukungan</span>
                      <span className={`text-sm font-bold ${STATUS_COLOR[formData.voter_status] || ''}`}>
                        {formData.voter_status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Loyalitas</span>
                      <span className="text-sm font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />{formData.loyalty_score}/10
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Sentimen</span>
                      <span className="text-sm font-bold">{formData.sentiment_score}/10</span>
                    </div>
                  </div>

                  <div className={`rounded-2xl p-5 border space-y-2 ${
                    gpsStatus === 'ok'
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-yellow-500/5 border-yellow-500/20'
                  }`}>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Lokasi Terdeteksi
                    </p>
                    {gpsStatus === 'ok' && location ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">Latitude</span>
                          <span className="text-sm font-mono text-green-400">{location.lat.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">Longitude</span>
                          <span className="text-sm font-mono text-green-400">{location.lng.toFixed(6)}</span>
                        </div>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-tenant-primary uppercase tracking-widest hover:underline mt-1"
                          >
                            <Navigation className="w-3 h-3" /> Lihat di Peta
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-yellow-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        GPS tidak tersedia — data akan disimpan tanpa koordinat.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReview(false)}
                    disabled={loading}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" /> Edit Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 py-4 bg-tenant-primary hover:bg-tenant-primary/90 text-white rounded-2xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-tenant-primary/20"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Konfirmasi & Kirim</>
                    )}
                  </button>
                </div>
              </div>

            ) : (
              <form onSubmit={handleSimpan} className="p-8 space-y-6">
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

                {gpsStatus === 'denied' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                    <p className="text-xs text-yellow-300">Mohon aktifkan GPS untuk akurasi data pemetaan.</p>
                    <button type="button" onClick={fetchGps} className="ml-auto text-[10px] font-bold uppercase text-yellow-400 hover:underline">Coba Lagi</button>
                  </div>
                )}
                {gpsStatus === 'fetching' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-2xl">
                    <Loader2 className="w-4 h-4 text-tenant-primary animate-spin shrink-0" />
                    <p className="text-xs text-zinc-400">Mendeteksi lokasi GPS otomatis...</p>
                  </div>
                )}
                {gpsStatus === 'ok' && location && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-2xl">
                    <MapPin className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-xs text-green-300 font-mono">
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                    <span className="ml-auto text-[10px] font-bold text-green-400 uppercase">GPS Terkunci</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nama Pemilih *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        required
                        type="text"
                        value={formData.voter_name}
                        onChange={e => setFormData(p => ({ ...p, voter_name: e.target.value }))}
                        placeholder="Nama lengkap pemilih"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-tenant-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> Pekerjaan Pemilih
                    </label>
                    <ProfessionSelect
                      value={formData.pekerjaan}
                      onChange={v => setFormData(p => ({ ...p, pekerjaan: v }))}
                      selectClassName="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm outline-none focus:border-tenant-primary transition-colors appearance-none"
                      inputClassName="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm outline-none focus:border-tenant-primary transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">NIK</label>
                      <input
                        type="text"
                        maxLength={16}
                        value={formData.voter_nik}
                        onChange={e => setFormData(p => ({ ...p, voter_nik: e.target.value }))}
                        placeholder="16 digit NIK"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm outline-none focus:border-tenant-primary transition-colors font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">No. HP</label>
                      <input
                        type="tel"
                        value={formData.voter_phone}
                        onChange={e => setFormData(p => ({ ...p, voter_phone: e.target.value }))}
                        placeholder="08xxxxxxxxxx"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm outline-none focus:border-tenant-primary transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Loyalitas (1-10)</label>
                      <div className="relative">
                        <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="number" min="1" max="10"
                          value={formData.loyalty_score}
                          onChange={e => setFormData(p => ({ ...p, loyalty_score: parseInt(e.target.value) || 5 }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-tenant-primary transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Sentimen (1-10)</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="number" min="1" max="10"
                          value={formData.sentiment_score}
                          onChange={e => setFormData(p => ({ ...p, sentiment_score: parseInt(e.target.value) || 5 }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-tenant-primary transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Status Dukungan</label>
                      <select
                        value={formData.voter_status}
                        onChange={e => setFormData(p => ({ ...p, voter_status: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm outline-none focus:border-tenant-primary transition-colors appearance-none"
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Isu Prioritas</label>
                      <select
                        value={formData.issue_tag}
                        onChange={e => setFormData(p => ({ ...p, issue_tag: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm outline-none focus:border-tenant-primary transition-colors appearance-none"
                      >
                        {ISSUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Foto Bukti Kunjungan</label>
                    <label className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl border cursor-pointer transition-all ${formData.photo_url ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-tenant-primary'}`}>
                      {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      <span className="text-xs font-bold uppercase">
                        {formData.photo_url ? 'Foto Terunggah ✓' : 'Ambil / Pilih Foto'}
                      </span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingPhoto || gpsStatus === 'fetching'}
                  className="w-full py-5 bg-tenant-primary hover:bg-tenant-primary/90 text-white rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-xl shadow-tenant-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" /> Review & Simpan
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
