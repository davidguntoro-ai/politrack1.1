import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Users, Send, CheckCircle, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IncidentReportModal } from './IncidentReportModal';
import { SurveyModal } from './SurveyModal';

interface RelawanDashboardProps {
  tenantId: string;
}

interface RelawanStats {
  votersRegistered: number;
  surveysSubmitted: number;
  reliabilityScore: number;
}

export const RelawanDashboard: React.FC<RelawanDashboardProps> = ({ tenantId }) => {
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [stats, setStats] = useState<RelawanStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('politrack_token');
        const res = await fetch('/api/relawan/my-stats', {
          headers: {
            'x-tenant-id': tenantId,
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch relawan stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [tenantId]);

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Emergency Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-950/20 border border-red-900/50 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 shadow-2xl shadow-red-900/10"
        >
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-red-600/30 rounded-full animate-ping" />
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-red-500">Emergency Protocol</h2>
            <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
              Gunakan tombol ini hanya untuk melaporkan kecurangan, intimidasi, atau kejadian darurat di lapangan.
            </p>
          </div>

          <button 
            onClick={() => setIsEmergencyModalOpen(true)}
            className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-xl shadow-red-600/30 active:scale-95"
          >
            LAPORKAN INSIDEN
          </button>
        </motion.div>

        {/* Survey Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-tenant-primary/10 border border-tenant-primary/20 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 shadow-2xl shadow-tenant-primary/5"
        >
          <div className="w-24 h-24 bg-tenant-primary rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-tenant-primary/30 rounded-full animate-ping" />
            <Send className="w-12 h-12 text-white" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-tenant-primary">Voter Survey</h2>
            <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
              Input data survei 4-Pilar (Loyalitas, Sentimen, Status, Isu) untuk pemilih yang Anda kunjungi.
            </p>
          </div>

          <button 
            onClick={() => setIsSurveyModalOpen(true)}
            className="w-full py-5 bg-tenant-primary hover:bg-tenant-primary/90 text-white rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-xl shadow-tenant-primary/30 active:scale-95"
          >
            INPUT DATA SURVEI
          </button>
        </motion.div>
      </div>

      {/* Quick Stats / Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dashboard-card bg-zinc-950 border-zinc-800 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-tenant-primary/10 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-tenant-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pemilih Didaftar</p>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin mt-1" />
            ) : (
              <p className="text-2xl font-black">{stats?.votersRegistered ?? 0}</p>
            )}
          </div>
        </div>

        <div className="dashboard-card bg-zinc-950 border-zinc-800 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Survei Dikirim</p>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin mt-1" />
            ) : (
              <p className="text-2xl font-black">{stats?.surveysSubmitted ?? 0}</p>
            )}
          </div>
        </div>

        <div className="dashboard-card bg-zinc-950 border-zinc-800 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Skor Keandalan</p>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin mt-1" />
            ) : (
              <p className="text-2xl font-black">{stats?.reliabilityScore ?? 100}%</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="dashboard-card bg-zinc-950 border-zinc-800 p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black uppercase tracking-tighter">Your Field Activity</h3>
          <button className="text-[10px] font-bold uppercase tracking-widest text-tenant-primary hover:underline">View All</button>
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-4 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold">Voter Visit: Budi Santoso</p>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">2h ago</span>
                </div>
                <p className="text-xs text-zinc-500">Sentiment: Positive | Issue: Infrastructure</p>
              </div>
              <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase">
                Verified
              </div>
            </div>
          ))}
        </div>
      </div>

      <IncidentReportModal 
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        tenantId={tenantId}
      />

      <SurveyModal 
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        tenantId={tenantId}
      />
    </div>
  );
};
