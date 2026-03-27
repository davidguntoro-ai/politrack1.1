import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  User, 
  CheckCircle2, 
  Camera, 
  MapPin, 
  Navigation, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  Loader2,
  Check,
  Cloud,
  RefreshCw,
  Star,
  CheckSquare,
  Square,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveReportLocally, SupportStatus, getProfile, setProfile, UserProfile } from '../services/db';
import { SyncManager } from '../services/syncManager';
import { applyWatermark } from '../services/watermarkService';
import { Tenant } from '../types';

interface Voter {
  id: string;
  name: string;
  nik: string;
  district: string;
  phone_number?: string;
}

const MOCK_VOTERS: Voter[] = [
  { id: 'v_1', name: 'Ahmad Subarjo', nik: '3171010101010001', district: 'Menteng', phone_number: '6281234567890' },
  { id: 'v_2', name: 'Siti Aminah', nik: '3171010101010002', district: 'Kemayoran', phone_number: '6289876543210' },
  { id: 'v_3', name: 'Budi Santoso', nik: '3171010101010003', district: 'Senen' },
];

export const VoterInteractionModule: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [supportStatus, setSupportStatus] = useState<SupportStatus | null>(null);
  const [awareness, setAwareness] = useState<string>('');
  const [programRating, setProgramRating] = useState<number>(0);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [swingReason, setSwingReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [watermarkedPhoto, setWatermarkedPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [regionInfo, setRegionInfo] = useState<{ kabupaten: string; kecamatan: string; desa: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMockLocation, setIsMockLocation] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncingState, setIsSyncingState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    SyncManager.start();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const initProfile = async () => {
      let profile = await getProfile();
      if (!profile) {
        profile = {
          id: 'usr_001',
          name: 'David Guntoro',
          assigned_kabupaten: 'Jakarta Pusat',
          assigned_kecamatan: 'Menteng',
          assigned_desa: 'Gondangdia'
        };
        await setProfile(profile);
      }
      setUserProfile(profile);
    };
    initProfile();

    const handleSyncUpdate = (count: number, syncing: boolean) => {
      setPendingCount(count);
      setIsSyncingState(syncing);
    };

    SyncManager.addListener(handleSyncUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      SyncManager.removeListener(handleSyncUpdate);
    };
  }, []);

  const filteredVoters = MOCK_VOTERS.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.nik.includes(searchQuery)
  );

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Akses kamera ditolak. Silakan aktifkan izin kamera.');
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const width = 1280; // Higher resolution for watermark
        const height = (videoRef.current.videoHeight / videoRef.current.videoWidth) * width;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        context.drawImage(videoRef.current, 0, 0, width, height);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        
        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());

        // Apply watermark if location is available
        if (location && userProfile) {
          const info = regionInfo || {
            kabupaten: userProfile.assigned_kabupaten,
            kecamatan: userProfile.assigned_kecamatan,
            desa: userProfile.assigned_desa
          };
          
          const watermarked = await applyWatermark(dataUrl, {
            userName: userProfile.name,
            timestamp: new Date().toLocaleString(),
            kabupaten: info.kabupaten,
            kecamatan: info.kecamatan,
            desa: info.desa,
            latitude: location.lat,
            longitude: location.lng
          });
          setWatermarkedPhoto(watermarked);
        }
      }
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung di perangkat ini.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const isMock = (pos as any).mocked || false; 
        setIsMockLocation(isMock);
        
        const newLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setLocation(newLocation);

        // Reverse Geocoding Mock / Fallback
        if (navigator.onLine) {
          // Simulate API call
          setTimeout(() => {
            setRegionInfo({
              kabupaten: 'Jakarta Pusat',
              kecamatan: 'Menteng',
              desa: 'Gondangdia'
            });
          }, 500);
        } else if (userProfile) {
          // Offline Fallback: Use assigned area
          setRegionInfo({
            kabupaten: userProfile.assigned_kabupaten,
            kecamatan: userProfile.assigned_kecamatan,
            desa: userProfile.assigned_desa
          });
        }
      },
      (err) => {
        console.error('Location error:', err);
        alert('Gagal mendapatkan lokasi GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!selectedVoter || !location || !watermarkedPhoto) return;
    
    if (isMockLocation) {
      alert('Peringatan: Lokasi palsu terdeteksi. Pengiriman diblokir.');
      return;
    }

    setIsSubmitting(true);

    const report = {
      voter_id: selectedVoter.id,
      voter_name: selectedVoter.name,
      voter_nik: selectedVoter.nik,
      support_status: supportStatus!,
      awareness,
      program_support_rating: programRating,
      issues: selectedIssues,
      swing_voter_reason: supportStatus === SupportStatus.SWING ? swingReason : undefined,
      note,
      photo_base64: watermarkedPhoto, // Save watermarked version
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy,
      timestamp: Date.now(),
      is_mock_location: isMockLocation,
    };

    try {
      await saveReportLocally(report);
      
      if (isOnline) {
        await SyncManager.sync();
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Gagal menyimpan laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppTrigger = () => {
    if (!selectedVoter?.phone_number || !tenant.wa_greeting_template) return;

    let message = tenant.wa_greeting_template;
    message = message.replace('[VOTER_NAME]', selectedVoter.name);
    message = message.replace('[VOLUNTEER_NAME]', userProfile?.name || 'Relawan');
    message = message.replace('[VOTER_ISSUE]', selectedIssues.join(', ') || 'aspirasi masyarakat');
    message = message.replace('[CANDIDATE_NAME]', tenant.name);

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${selectedVoter.phone_number}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const resetForm = () => {
    setStep(1);
    setSelectedVoter(null);
    setSearchQuery('');
    setSupportStatus(null);
    setAwareness('');
    setProgramRating(0);
    setSelectedIssues([]);
    setSwingReason('');
    setNote('');
    setPhoto(null);
    setWatermarkedPhoto(null);
    setLocation(null);
    setRegionInfo(null);
    setShowSuccess(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-tenant-primary flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight">PoliTrack Mobile</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isOnline ? (
            <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase tracking-widest">
              <Wifi className="w-3 h-3" /> Online
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase tracking-widest">
              <WifiOff className="w-3 h-3" /> Offline
            </div>
          )}
          
          {pendingCount > 0 ? (
            <div className="flex items-center gap-1 text-[9px] text-orange-500 font-bold uppercase tracking-tight bg-orange-500/10 px-2 py-0.5 rounded-full">
              {isSyncingState ? (
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Cloud className="w-2.5 h-2.5" />
              )}
              {pendingCount} Mengantre
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[9px] text-green-500 font-bold uppercase tracking-tight bg-green-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" /> Tersinkron
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Cari Pemilih</h2>
                <p className="text-zinc-500 text-sm">Masukkan Nama atau NIK untuk memulai interaksi.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Cari Nama atau NIK..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-lg focus:border-tenant-primary outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {searchQuery.length > 0 && filteredVoters.map((voter) => (
                  <button
                    key={voter.id}
                    onClick={() => {
                      setSelectedVoter(voter);
                      handleNext();
                    }}
                    className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-tenant-primary/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-tenant-primary transition-colors">
                        <User className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                      </div>
                      <div>
                        <p className="font-bold">{voter.name}</p>
                        <p className="text-xs text-zinc-500 font-mono">{voter.nik}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && selectedVoter && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="w-12 h-12 rounded-full bg-tenant-primary flex items-center justify-center font-bold text-lg">
                  {selectedVoter.name[0]}
                </div>
                <div>
                  <p className="font-bold text-lg">{selectedVoter.name}</p>
                  <p className="text-xs text-zinc-500">{selectedVoter.district}</p>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status Dukungan</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSupportStatus(SupportStatus.PENDUKUNG)}
                    className={`py-3 rounded-xl text-[10px] font-bold border transition-all ${
                      supportStatus === SupportStatus.PENDUKUNG 
                        ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    HIJAU: PENDUKUNG
                  </button>
                  <button
                    onClick={() => setSupportStatus(SupportStatus.SWING)}
                    className={`py-3 rounded-xl text-[10px] font-bold border transition-all ${
                      supportStatus === SupportStatus.SWING 
                        ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-500/20' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    KUNING: SWING
                  </button>
                  <button
                    onClick={() => setSupportStatus(SupportStatus.LAWAN)}
                    className={`py-3 rounded-xl text-[10px] font-bold border transition-all ${
                      supportStatus === SupportStatus.LAWAN 
                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    MERAH: LAWAN
                  </button>
                </div>
              </div>

              {/* Conditional Field for Swing Voter */}
              {supportStatus === SupportStatus.SWING && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Apa yang membuat ragu?</label>
                  <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-tenant-primary outline-none appearance-none"
                    value={swingReason}
                    onChange={(e) => setSwingReason(e.target.value)}
                  >
                    <option value="">Pilih Alasan...</option>
                    <option value="Belum kenal">Belum kenal</option>
                    <option value="Janji belum bukti">Janji belum bukti</option>
                    <option value="Pilih calon lain">Pilih calon lain</option>
                  </select>
                </motion.div>
              )}

              {/* Awareness Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tingkat Kenal (Awareness)</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-tenant-primary outline-none appearance-none"
                  value={awareness}
                  onChange={(e) => setAwareness(e.target.value)}
                >
                  <option value="">Pilih Tingkat Kenal...</option>
                  <option value="Sudah Kenal">Sudah Kenal</option>
                  <option value="Pernah Dengar">Pernah Dengar</option>
                  <option value="Tidak Kenal">Tidak Kenal</option>
                </select>
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Dukungan Program (1-5 Bintang)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setProgramRating(star)}
                      className="p-1 transition-transform active:scale-90"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          star <= programRating ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-700'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Select Issues */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Isu Utama (Multi-Select)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Infrastruktur', 'Ekonomi', 'Kesehatan', 'Pendidikan'].map((issue) => {
                    const isSelected = selectedIssues.includes(issue);
                    return (
                      <button
                        key={issue}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedIssues(selectedIssues.filter(i => i !== issue));
                          } else {
                            setSelectedIssues([...selectedIssues, issue]);
                          }
                        }}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                          isSelected 
                            ? 'bg-tenant-primary/10 border-tenant-primary text-tenant-primary' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {issue}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Catatan Khusus Relawan</label>
                <textarea 
                  rows={4}
                  placeholder="Misal: Tokoh masyarakat, butuh kursi roda, dll..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:border-tenant-primary outline-none transition-all resize-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleBack}
                  className="flex-1 py-4 bg-zinc-900 text-zinc-400 font-bold rounded-xl border border-zinc-800"
                >
                  Kembali
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!supportStatus || !awareness}
                  className="flex-1 py-4 bg-tenant-primary text-white font-bold rounded-xl shadow-lg shadow-tenant-primary/20 disabled:opacity-50 disabled:grayscale transition-all"
                >
                  Lanjut
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Verifikasi & GPS</h2>
                <p className="text-zinc-500 text-sm">Ambil foto bukti interaksi dan kunci lokasi GPS Anda.</p>
              </div>

              {/* Camera Section */}
              <div className="space-y-3">
                <div className="aspect-square bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden relative">
                  {!watermarkedPhoto ? (
                    <>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-dashed border-white/30 rounded-full" />
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                        <button 
                          onClick={startCamera}
                          className="p-4 bg-zinc-950/80 backdrop-blur-md rounded-full border border-zinc-800"
                        >
                          <Camera className="w-6 h-6 text-tenant-primary" />
                        </button>
                        <button 
                          onClick={capturePhoto}
                          disabled={!location}
                          className="w-16 h-16 bg-white rounded-full border-4 border-zinc-800 flex items-center justify-center shadow-2xl disabled:opacity-50"
                        >
                          <div className="w-12 h-12 bg-white rounded-full border-2 border-zinc-200" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <img src={watermarkedPhoto} alt="Captured" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          setPhoto(null);
                          setWatermarkedPhoto(null);
                        }}
                        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* GPS Section */}
              <div className="dashboard-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-5 h-5 ${location ? 'text-green-500' : 'text-zinc-500'}`} />
                    <span className="text-sm font-bold">Kunci Lokasi GPS</span>
                  </div>
                  <button 
                    onClick={captureLocation}
                    className="text-xs font-bold text-tenant-primary uppercase tracking-widest"
                  >
                    {location ? 'Refresh' : 'Dapatkan Lokasi'}
                  </button>
                </div>
                
                {location ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-zinc-500">
                      <span>Lat: {location.lat.toFixed(6)}</span>
                      <span>Lng: {location.lng.toFixed(6)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-500">
                      <CheckCircle2 className="w-3 h-3" /> Akurasi: {location.accuracy.toFixed(1)}m
                    </div>
                    {regionInfo && (
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        {regionInfo.kabupaten} | {regionInfo.kecamatan} | {regionInfo.desa}
                      </div>
                    )}
                    {isMockLocation && (
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 p-2 rounded">
                        <AlertTriangle className="w-3 h-3" /> Lokasi Palsu Terdeteksi!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-zinc-600 text-xs italic">
                    Lokasi belum terkunci...
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleBack}
                  className="flex-1 py-4 bg-zinc-900 text-zinc-400 font-bold rounded-xl border border-zinc-800"
                >
                  Kembali
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!watermarkedPhoto || !location || isSubmitting || isMockLocation}
                  className="flex-1 py-4 bg-tenant-primary text-white font-bold rounded-xl shadow-lg shadow-tenant-primary/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Laporan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-2xl shadow-green-500/20"
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">Laporan Disimpan!</h2>
            <p className="text-zinc-500 mb-8">
              {isOnline ? 'Data telah disinkronkan ke server.' : 'Data disimpan secara lokal dan akan disinkronkan saat online.'}
            </p>

            <div className="w-full space-y-3">
              {tenant.wa_greeting_enabled && (
                <button 
                  onClick={handleWhatsAppTrigger}
                  disabled={!selectedVoter?.phone_number}
                  className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 disabled:opacity-50 disabled:grayscale transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  {selectedVoter?.phone_number ? 'Kirim Pesan Sapaan' : 'No Phone Number'}
                </button>
              )}
              
              <button 
                onClick={resetForm}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl border border-zinc-800"
              >
                Selesai & Kembali
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Progress */}
      <footer className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800 flex justify-center gap-2 sticky bottom-0 z-20">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === i ? 'w-8 bg-tenant-primary' : 'w-2 bg-zinc-800'
            }`} 
          />
        ))}
      </footer>
    </div>
  );
};
