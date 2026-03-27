import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Phone,
  MapPin,
  Clock,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  X,
  AlertTriangle,
  RefreshCw,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';

interface PendingVolunteer {
  id: number;
  name: string;
  phone: string;
  kecamatan?: string;
  desa?: string;
  agama?: string;
  pekerjaan?: string;
  alasan?: string;
  created_at: string;
}

interface ApprovalCandidate {
  volunteer: PendingVolunteer;
  generatedPassword: string;
}

function generateRandomPassword(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const VolunteerApproval: React.FC = () => {
  const { toast } = useToast();
  const [volunteers, setVolunteers] = useState<PendingVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalCandidate, setApprovalCandidate] = useState<ApprovalCandidate | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('politrack_token');
      const res = await fetch('/api/users/pending', {
        headers: {
          'x-tenant-id': 'tenant_1',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVolunteers(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending volunteers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApproveClick = (volunteer: PendingVolunteer) => {
    setApprovalCandidate({
      volunteer,
      generatedPassword: generateRandomPassword(8),
    });
    setCopied(false);
  };

  const handleCopyPassword = async () => {
    if (!approvalCandidate) return;
    try {
      await navigator.clipboard.writeText(approvalCandidate.generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast('Gagal menyalin — salin manual dari layar.', 'warning');
    }
  };

  const handleConfirmApprove = async () => {
    if (!approvalCandidate) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('politrack_token');
      const res = await fetch(`/api/users/approve/${approvalCandidate.volunteer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant_1',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: approvalCandidate.generatedPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Gagal mengaktifkan akun.', 'error');
        return;
      }

      toast(
        `Akun ${approvalCandidate.volunteer.name} aktif! Silakan teruskan detail login ke nomor WA mereka.`,
        'success'
      );
      setVolunteers(prev => prev.filter(v => v.id !== approvalCandidate.volunteer.id));
      setApprovalCandidate(null);
    } catch {
      toast('Gagal terhubung ke server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Approval Center</h2>
          <p className="text-2xl font-black">Pendaftaran Relawan Baru</p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-xs font-bold uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5" />
              {volunteers.length} Menunggu
            </span>
          )}
          <button
            onClick={fetchPending}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-card flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-tenant-primary animate-spin" />
        </div>
      ) : volunteers.length === 0 ? (
        <div className="dashboard-card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">Semua Bersih!</h3>
          <p className="text-zinc-500 text-sm">Tidak ada pendaftaran baru yang menunggu persetujuan.</p>
        </div>
      ) : (
        <div className="dashboard-card overflow-hidden p-0">
          <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-sm font-bold text-zinc-300">
              Tinjau setiap pendaftar secara individual. Klik <span className="text-tenant-primary">Setujui</span> untuk membuat password dan mengaktifkan akun.
            </p>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {volunteers.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 hover:bg-zinc-800/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-black text-white truncate">{v.name}</p>
                    <span className="shrink-0 px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-[9px] font-bold uppercase tracking-widest">
                      PENDING
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {v.phone}
                    </span>
                    {v.kecamatan && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {v.kecamatan}{v.desa ? `, ${v.desa}` : ''}
                      </span>
                    )}
                    {v.pekerjaan && (
                      <span className="text-zinc-600">{v.pekerjaan}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Daftar {formatDate(v.created_at)}
                    </span>
                  </div>
                  {v.alasan && (
                    <p className="mt-1.5 text-xs text-zinc-600 italic truncate max-w-md">
                      "{v.alasan}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleApproveClick(v)}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-tenant-primary hover:bg-tenant-primary/90 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-tenant-primary/20 active:scale-95"
                >
                  <UserCheck className="w-4 h-4" />
                  Setujui
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {approvalCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget && !saving) setApprovalCandidate(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tenant-primary/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-tenant-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Konfirmasi Aktivasi</p>
                    <p className="font-black text-white">Tinjau Sebelum Simpan</p>
                  </div>
                </div>
                {!saving && (
                  <button
                    onClick={() => setApprovalCandidate(null)}
                    className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Nama Relawan</span>
                    <span className="text-sm font-black text-white">{approvalCandidate.volunteer.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Nomor WhatsApp</span>
                    <span className="text-sm font-bold text-white font-mono">{approvalCandidate.volunteer.phone}</span>
                  </div>
                  {approvalCandidate.volunteer.kecamatan && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Wilayah</span>
                      <span className="text-sm font-bold text-white">{approvalCandidate.volunteer.kecamatan}</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]/70 mb-3">Password Baru</p>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-2xl font-black tracking-[0.18em] text-[#D4AF37]">
                      {approvalCandidate.generatedPassword}
                    </code>
                    <button
                      onClick={handleCopyPassword}
                      className={`shrink-0 p-2.5 rounded-xl transition-all ${
                        copied
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
                      }`}
                      title="Salin password"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300 leading-relaxed">
                    Harap <strong>catat / salin</strong> password ini dan kirimkan kepada Relawan via WhatsApp sebelum menekan tombol di bawah.
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => setApprovalCandidate(null)}
                  disabled={saving}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-40"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmApprove}
                  disabled={saving}
                  className="flex-1 py-3 bg-tenant-primary hover:bg-tenant-primary/90 text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-tenant-primary/20"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Simpan & Aktifkan</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
