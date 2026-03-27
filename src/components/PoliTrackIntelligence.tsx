import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  AlertTriangle, 
  Target, 
  Users, 
  Lightbulb, 
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface IntelligenceData {
  top_issue: string;
  dpt_count: number;
  target_kemenangan: number;
  activity_count: number;
  activity_density: number;
  alert_status: 'CRITICAL' | 'WARNING' | 'OPTIMAL';
  narratives: string[];
  timestamp: string;
}

export const PoliTrackIntelligence: React.FC = () => {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/intelligence/analysis', {
        headers: { 'x-tenant-id': 'tenant_1' }
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch intelligence analysis', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-card flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-10 h-10 text-tenant-primary animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Processing Intelligence Data...</p>
      </div>
    );
  }

  if (!data) return null;

  const getAlertConfig = (status: string) => {
    switch (status) {
      case 'CRITICAL': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldAlert, label: 'Kritis: Kurang Sosialisasi' };
      case 'WARNING': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle, label: 'Peringatan: Perlu Peningkatan' };
      default: return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: BrainCircuit, label: 'Optimal: Sosialisasi Terjaga' };
    }
  };

  const alert = getAlertConfig(data.alert_status);

  return (
    <div className="space-y-6">
      {/* Intelligence Header */}
      <div className="dashboard-card bg-zinc-950 border-zinc-800 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit className="w-32 h-32 text-tenant-primary" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-tenant-primary/10 rounded-2xl flex items-center justify-center">
              <BrainCircuit className="w-8 h-8 text-tenant-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Intelligence Engine</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Decision-Focused Strategic Analysis</p>
            </div>
          </div>
          
          <div className={`px-6 py-3 rounded-2xl border ${alert.bg} ${alert.border} flex items-center gap-3`}>
            <alert.icon className={`w-5 h-5 ${alert.color}`} />
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${alert.color}`}>{alert.label}</p>
              <p className="text-xs text-zinc-400">Kepadatan Aktivitas: {data.activity_density}% dari DPT</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Inputs Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="dashboard-card space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Data Input Analysis</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span className="text-xs font-bold uppercase text-zinc-400">Isu Lokal Utama</span>
                </div>
                <span className="text-sm font-black text-white">{data.top_issue}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold uppercase text-zinc-400">Data DPT Wilayah</span>
                </div>
                <span className="text-sm font-black text-white">{data.dpt_count.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-red-500" />
                  <span className="text-xs font-bold uppercase text-zinc-400">Target Kemenangan</span>
                </div>
                <span className="text-sm font-black text-white">{data.target_kemenangan.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-tenant-primary" />
                  <span className="text-xs font-bold uppercase text-zinc-400">Aktivitas (Day 5)</span>
                </div>
                <span className="text-sm font-black text-white">{data.activity_count.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card bg-tenant-primary/5 border-tenant-primary/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-tenant-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-tenant-primary">Strategic Gap</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Berdasarkan perbandingan aktivitas relawan 5 hari terakhir ({data.activity_count}) terhadap total DPT ({data.dpt_count}), 
              wilayah ini memiliki tingkat penetrasi sebesar <span className="text-white font-bold">{data.activity_density}%</span>. 
              {data.alert_status === 'CRITICAL' ? ' Diperlukan mobilisasi massa segera untuk mengejar ketertinggalan.' : 
               data.alert_status === 'WARNING' ? ' Diperlukan peningkatan intensitas kunjungan relawan.' : 
               ' Pertahankan ritme sosialisasi untuk mengunci suara.'}
            </p>
          </div>
        </div>

        {/* Strategic Narratives */}
        <div className="lg:col-span-2 space-y-6">
          <div className="dashboard-card h-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Strategic Narratives</h3>
                <p className="text-xl font-bold">Campaign Logic vs Competitor (CalegPro)</p>
              </div>
              <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold uppercase text-zinc-400">
                Focus: {data.top_issue}
              </div>
            </div>

            <div className="space-y-6">
              {data.narratives.map((narrative, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="group p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl hover:border-tenant-primary/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-tenant-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-tenant-primary group-hover:text-white transition-colors">
                      <span className="text-sm font-black">0{i + 1}</span>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-zinc-200 leading-relaxed">
                        {narrative}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-tenant-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Superior Strategy <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl border-dashed">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="w-4 h-4 text-zinc-500" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Competitive Edge Analysis</h4>
              </div>
              <p className="text-xs text-zinc-500 italic">
                "Narasi di atas dirancang untuk memukul titik lemah program standar CalegPro yang cenderung bersifat makro. 
                Dengan fokus pada solusi mikro-spesifik berbasis isu {data.top_issue}, kandidat akan terlihat lebih 'hadir' dan solutif bagi pemilih lokal."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
