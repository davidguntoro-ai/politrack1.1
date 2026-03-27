import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  UserPlus,
  ArrowRight,
  Download,
  Loader2,
  MapPin,
  AlertTriangle,
  Eye,
  ArrowLeft,
  Navigation,
  Phone,
  User,
  Briefcase,
  CreditCard
} from 'lucide-react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ProfessionSelect } from './ProfessionSelect';
import { getAddressFromCoords, type GeoAddress } from '../lib/geocoding';

export const BulkUploadComponent: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{status: string, message: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const response = await axios.post('/api/voters/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-tenant-id': 'tenant_1' // In real app, get from context
        }
      });
      
      const data = response.data;
      setUploadStatus({
        status: data.status,
        message: `${data.success} Berhasil, ${data.failed} Gagal. ${data.errors.length > 0 ? 'Lihat log di bawah.' : ''}`
      });
      
      // Trigger a refresh of the logs table (could use a shared state/context)
      window.dispatchEvent(new CustomEvent('refresh-upload-logs'));
    } catch (error: any) {
      setUploadStatus({
        status: 'Failed',
        message: error.response?.data?.detail || 'Gagal mengunggah file.'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/download-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'voter_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download template', error);
    }
  };

  return (
    <div className="dashboard-card border-dashed border-2 border-zinc-800 hover:border-tenant-primary/50 transition-all group flex flex-col items-center justify-center py-12 text-center relative">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
        accept=".csv, .xlsx, .xls"
      />
      
      <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {isUploading ? (
          <Loader2 className="w-8 h-8 text-tenant-primary animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-zinc-500 group-hover:text-tenant-primary transition-colors" />
        )}
      </div>
      
      <h3 className="text-xl font-bold mb-2">Unggah Data Pemilih Massal</h3>
      <p className="text-zinc-500 text-sm max-w-md mb-6">
        Seret dan lepas file .CSV atau .XLSX Anda di sini untuk memproses data pemilih secara massal.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-6 py-3 bg-tenant-primary text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isUploading ? 'Memproses...' : 'Pilih File'} <ArrowRight className="w-4 h-4" />
        </button>
        
        <button 
          onClick={downloadTemplate}
          className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-lg hover:bg-zinc-700 transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Unduh Template
        </button>
      </div>

      {uploadStatus && (
        <div className={`mt-6 p-4 rounded-lg border flex items-start gap-3 text-left max-w-md ${
          uploadStatus.status === 'Success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
          uploadStatus.status === 'Warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
          'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {uploadStatus.status === 'Success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
           uploadStatus.status === 'Warning' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
           <XCircle className="w-5 h-5 shrink-0" />}
          <div>
            <p className="font-bold text-sm uppercase tracking-wider">{uploadStatus.status}</p>
            <p className="text-sm opacity-90">{uploadStatus.message}</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-4 text-xs text-zinc-600">
        <div className="flex items-center gap-1"><FileText className="w-3 h-3" /> Format: .CSV, .XLSX</div>
        <div className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Maks: 50MB</div>
      </div>
    </div>
  );
};

type GpsState = 'idle' | 'fetching' | 'ok' | 'denied';

const INPUT_CLS = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-tenant-primary focus:outline-none transition-all';

const KECAMATAN_OPTIONS = ['Menteng', 'Gambir', 'Sawah Besar', 'Kemayoran', 'Senen', 'Cempaka Putih', 'Johar Baru', 'Tanah Abang', 'Palmerah', 'Grogol Petamburan', 'Tambora', 'Taman Sari', 'Penjaringan', 'Pademangan', 'Koja', 'Cilincing', 'Kelapa Gading', 'Tanjung Priok', 'Pulo Gadung', 'Jatinegara', 'Duren Sawit', 'Kramat Jati', 'Makasar', 'Pasar Rebo', 'Ciracas', 'Cipayung', 'Jagakarsa', 'Pasar Minggu', 'Pesanggrahan', 'Cilandak', 'Kebayoran Baru', 'Kebayoran Lama', 'Pesanggrahan', 'Mampang Prapatan', 'Pancoran', 'Tebet', 'Setiabudi'];

export const VoterInputForm: React.FC = () => {
  const [fields, setFields] = useState({
    name: '',
    nik: '',
    phone: '',
    pekerjaan: '',
    kecamatan: '',
    kelurahan: '',
    address: '',
  });
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<GeoAddress | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [showReview, setShowReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchGps();
  }, []);

  useEffect(() => {
    if (!location) return;
    setGeoStatus('loading');
    setDetectedAddress(null);
    getAddressFromCoords(location.lat, location.lng)
      .then(addr => { setDetectedAddress(addr); setGeoStatus('done'); })
      .catch(() => setGeoStatus('error'));
  }, [location]);

  const fetchGps = () => {
    if (!('geolocation' in navigator)) { setGpsState('denied'); return; }
    setGpsState('fetching');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsState('ok');
      },
      () => setGpsState('denied'),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields(p => ({ ...p, [k]: e.target.value }));

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setShowReview(true);
  };

  const handleConfirm = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('politrack_token');
      const res = await axios.post('/api/voters/register', {
        name: fields.name,
        nik: fields.nik,
        phone_number: fields.phone,
        pekerjaan: fields.pekerjaan,
        districtCode: fields.kecamatan || 'Tidak Diketahui',
        villageCode: fields.kelurahan || 'Tidak Diketahui',
        address: fields.address,
        detected_address: detectedAddress?.display ?? null,
        comment: 'Input Manual',
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
      }, {
        headers: {
          'x-tenant-id': 'tenant_1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 200 || res.status === 201) {
        setSuccessMsg(`Pemilih "${fields.name}" berhasil disimpan ke database.`);
        setShowReview(false);
        setFields({ name: '', nik: '', phone: '', pekerjaan: '', kecamatan: '', kelurahan: '', address: '' });
        setLocation(null);
        setDetectedAddress(null);
        setGeoStatus('idle');
        fetchGps();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Gagal menyimpan data.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const mapsUrl = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : null;

  return (
    <div className="dashboard-card relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-tenant-primary/10 text-tenant-primary">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Input Manual</h3>
          <p className="text-2xl font-bold">Data Pemilih Baru</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {gpsState === 'denied' && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-300">Mohon aktifkan GPS untuk akurasi data pemetaan.</p>
          <button onClick={fetchGps} className="ml-auto text-[10px] font-bold uppercase text-yellow-400 hover:underline">Coba Lagi</button>
        </div>
      )}
      {gpsState === 'fetching' && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
          <Loader2 className="w-4 h-4 text-tenant-primary animate-spin shrink-0" />
          <p className="text-xs text-zinc-400">Mendeteksi lokasi GPS otomatis...</p>
        </div>
      )}
      {gpsState === 'ok' && location && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-400 shrink-0" />
            {geoStatus === 'loading' ? (
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Memuat alamat...
              </span>
            ) : geoStatus === 'done' && detectedAddress ? (
              <span className="text-xs text-green-300 truncate">{detectedAddress.display}</span>
            ) : (
              <span className="text-xs text-green-300 font-mono">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
            )}
            <span className="ml-auto text-[10px] font-bold text-green-400 uppercase shrink-0">GPS Aktif</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSimpan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><User className="w-3 h-3" /> Nama Lengkap *</label>
          <input required type="text" value={fields.name} onChange={set('name')} className={INPUT_CLS} placeholder="Contoh: Budi Santoso" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><CreditCard className="w-3 h-3" /> NIK *</label>
          <input required type="text" maxLength={16} value={fields.nik} onChange={set('nik')} className={INPUT_CLS + ' font-mono'} placeholder="16 Digit NIK" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><Phone className="w-3 h-3" /> No. HP</label>
          <input type="tel" value={fields.phone} onChange={set('phone')} className={INPUT_CLS + ' font-mono'} placeholder="08xxxxxxxxxx" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3" /> Pekerjaan</label>
          <ProfessionSelect
            value={fields.pekerjaan}
            onChange={v => setFields(p => ({ ...p, pekerjaan: v }))}
            selectClassName={INPUT_CLS}
            inputClassName={INPUT_CLS + ' mt-2'}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> Kecamatan</label>
          <select value={fields.kecamatan} onChange={set('kecamatan')} className={INPUT_CLS}>
            <option value="">Pilih Kecamatan</option>
            {KECAMATAN_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase">Kelurahan</label>
          <input type="text" value={fields.kelurahan} onChange={set('kelurahan')} className={INPUT_CLS} placeholder="Nama kelurahan" />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase">Alamat Lengkap</label>
          <input type="text" value={fields.address} onChange={set('address')} className={INPUT_CLS} placeholder="Jl. Contoh No. 1, RT 01/RW 02" />
        </div>
        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            disabled={gpsState === 'fetching'}
            className="w-full py-3 bg-tenant-primary hover:bg-tenant-primary/90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" /> Review & Simpan Data Pemilih
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/95 backdrop-blur-sm rounded-2xl z-10 flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-tenant-primary/10 text-tenant-primary">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Konfirmasi Data</h3>
                <p className="text-xl font-bold">Review Sebelum Simpan</p>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Identitas Pemilih</p>
                {([['Nama', fields.name], ['NIK', fields.nik], ['No. HP', fields.phone]] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">{k}</span>
                    <span className={`font-bold ${k === 'NIK' ? 'font-mono' : ''}`}>{v || '—'}</span>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Profil & Wilayah</p>
                {([['Pekerjaan', fields.pekerjaan], ['Kecamatan', fields.kecamatan], ['Kelurahan', fields.kelurahan], ['Alamat', fields.address]] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">{k}</span>
                    <span className="font-bold text-right max-w-[60%] truncate">{v || '—'}</span>
                  </div>
                ))}
              </div>

              <div className={`rounded-xl p-4 border space-y-2 ${gpsState === 'ok' ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Lokasi Terdeteksi
                </p>
                {gpsState === 'ok' && location ? (
                  <div className="space-y-2">
                    {geoStatus === 'loading' && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        Koordinat Terkunci (Alamat memuat...)
                      </div>
                    )}
                    {geoStatus === 'done' && detectedAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3 h-3 text-tenant-primary shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-green-300 leading-snug">{detectedAddress.display}</p>
                      </div>
                    )}
                    {geoStatus === 'error' && (
                      <p className="text-xs text-yellow-400">Alamat tidak tersedia — koordinat tersimpan.</p>
                    )}
                    <div className="flex justify-between text-xs pt-1 border-t border-zinc-800/50">
                      <span className="font-mono text-zinc-500">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-tenant-primary uppercase tracking-widest hover:underline">
                          <Navigation className="w-3 h-3" /> Peta
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> GPS tidak aktif — data disimpan tanpa koordinat.
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  <XCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowReview(false); setErrorMsg(''); }}
                disabled={saving}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> Edit Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 py-3 bg-tenant-primary hover:bg-tenant-primary/90 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-tenant-primary/20"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Konfirmasi & Kirim Data</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const StatusTable: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/voters/upload-logs', {
        headers: { 'x-tenant-id': 'tenant_1' }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Listen for refresh events from the upload component
    const handleRefresh = () => fetchLogs();
    window.addEventListener('refresh-upload-logs', handleRefresh);
    return () => window.removeEventListener('refresh-upload-logs', handleRefresh);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Success': return { icon: CheckCircle2, color: 'text-green-500' };
      case 'Warning': return { icon: AlertCircle, color: 'text-yellow-500' };
      case 'Failed': return { icon: XCircle, color: 'text-red-500' };
      default: return { icon: AlertCircle, color: 'text-zinc-500' };
    }
  };

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Riwayat Aktivitas</h3>
          <p className="text-2xl font-bold">Log Status Input</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
        >
          <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Input Date</th>
              <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
              <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Summary</th>
              <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Error Log / Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-zinc-500 text-sm">Memuat data...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-zinc-500 text-sm">Belum ada riwayat unggahan.</td>
              </tr>
            ) : logs.map((log, i) => {
              const config = getStatusConfig(log.status);
              return (
                <tr key={log.id || i} className="group hover:bg-zinc-900/30 transition-colors">
                  <td className="py-4 text-sm font-mono text-zinc-400">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="py-4">
                    <div className={`flex items-center gap-2 text-sm font-bold ${config.color}`}>
                      <config.icon className="w-4 h-4" /> {log.status}
                    </div>
                  </td>
                  <td className="py-4 text-sm text-zinc-300">
                    {log.success_count} / {log.total_rows} Berhasil
                  </td>
                  <td className="py-4 text-sm text-zinc-400 max-w-xs truncate">
                    {log.errors && log.errors.length > 0 ? log.errors.join(', ') : 'Tidak ada kesalahan'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
