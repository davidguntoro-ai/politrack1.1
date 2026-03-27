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
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { PROFESSIONS } from '../types';

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

export const VoterInputForm: React.FC = () => {
  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-tenant-primary/10 text-tenant-primary">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Input Manual</h3>
          <p className="text-2xl font-bold">Data Pemilih Baru</p>
        </div>
      </div>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase">Nama Lengkap</label>
          <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-tenant-primary focus:outline-none transition-all" placeholder="Contoh: Budi Santoso" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase">NIK</label>
          <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-tenant-primary focus:outline-none transition-all" placeholder="16 Digit NIK" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase">Pekerjaan</label>
          <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-tenant-primary focus:outline-none transition-all">
            <option value="">Pilih Pekerjaan</option>
            {PROFESSIONS.map(job => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase">Kecamatan</label>
          <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-tenant-primary focus:outline-none transition-all">
            <option>Pilih Kecamatan</option>
            <option>Menteng</option>
            <option>Gambir</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase">Kelurahan</label>
          <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-tenant-primary focus:outline-none transition-all">
            <option>Pilih Kelurahan</option>
          </select>
        </div>
        <div className="md:col-span-2 mt-2">
          <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Simpan Data Pemilih
          </button>
        </div>
      </form>
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
