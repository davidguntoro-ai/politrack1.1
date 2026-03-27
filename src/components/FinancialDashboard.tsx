import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Activity, 
  FileText, 
  Eye, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  CreditCard,
  DollarSign,
  Calendar,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart, 
  Area 
} from 'recharts';

// Premium Gold Theme Colors
const GOLD = '#D4AF37';
const GOLD_LIGHT = '#F1E5AC';
const GOLD_DARK = '#996515';

const spendingData = [
  { name: 'Billboard & APK', value: 40, color: GOLD },
  { name: 'Events & Logistics', value: 30, color: '#A67C00' },
  { name: 'Social Media Ads', value: 20, color: '#FFD700' },
  { name: 'Volunteer Honor', value: 10, color: '#B8860B' },
];

const burnRateData = [
  { date: 'Mar 20', spending: 12000000 },
  { date: 'Mar 21', spending: 15000000 },
  { date: 'Mar 22', spending: 8000000 },
  { date: 'Mar 23', spending: 25000000 },
  { date: 'Mar 24', spending: 18000000 },
  { date: 'Mar 25', spending: 32000000 },
  { date: 'Mar 26', spending: 28000000 },
];

const transactions = [
  { id: 1, date: '2026-03-26', desc: 'Sewa Billboard Menteng', cat: 'Billboard', amount: -15000000, status: 'Verified' },
  { id: 2, date: '2026-03-25', desc: 'Donasi Hamba Allah', cat: 'Donation', amount: 50000000, status: 'Verified' },
  { id: 3, date: '2026-03-25', desc: 'Konsumsi Rapat Relawan', cat: 'Events', amount: -2500000, status: 'Verified' },
  { id: 4, date: '2026-03-24', desc: 'FB & IG Ads Week 4', cat: 'Social Media', amount: -10000000, status: 'Verified' },
  { id: 5, date: '2026-03-23', desc: 'Cetak Kaos Kampanye', cat: 'Logistics', amount: -12000000, status: 'Verified' },
];

export const FinancialDashboard: React.FC = () => {
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-[#D4AF37]" />
            Financial Treasury
          </h2>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">Real-time Campaign Budget Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button className="px-6 py-3 bg-[#D4AF37] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#F1E5AC] transition-all shadow-xl shadow-[#D4AF37]/20">
            Add Transaction
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-24 h-24 text-[#D4AF37]" />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Total Donation</p>
          <h3 className="text-4xl font-black tracking-tighter text-white mb-4">{formatCurrency(1250000000)}</h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase">
            <ArrowUpRight className="w-3 h-3" /> +12% from last week
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingDown className="w-24 h-24 text-red-500" />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Total Spending</p>
          <h3 className="text-4xl font-black tracking-tighter text-white mb-4">{formatCurrency(485000000)}</h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase">
            <ArrowDownRight className="w-3 h-3" /> 38.8% of total budget
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-950 border border-[#D4AF37]/30 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-[#D4AF37]/5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldCheck className="w-24 h-24 text-[#D4AF37]" />
          </div>
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2">Net Balance</p>
          <h3 className="text-4xl font-black tracking-tighter text-white mb-4">{formatCurrency(765000000)}</h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#D4AF37] uppercase">
            <CreditCard className="w-3 h-3" /> Available for allocation
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Burn Rate Tracker */}
        <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Burn Rate Tracker</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Daily Spending Trends</p>
            </div>
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burnRateData}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000000}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: GOLD, fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="spending" stroke={GOLD} fillOpacity={1} fill="url(#colorSpend)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <p className="text-xs text-zinc-400 italic">
              "Prediksi: Dengan rata-rata pengeluaran saat ini, anggaran akan bertahan hingga <span className="text-white font-bold">15 April 2026</span> (H-2 Pencoblosan)."
            </p>
          </div>
        </div>

        {/* Spending Breakdown */}
        <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Spending Breakdown</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Allocation by Category</p>
            </div>
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[250px] w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {spendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              {spendingData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Recent Transactions</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Audit-ready Financial Logs</p>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:underline">View All History</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50">
                <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Description</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Category</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {transactions.map((tx) => (
                <tr key={tx.id} className="group hover:bg-zinc-900/30 transition-colors">
                  <td className="px-8 py-6 text-xs font-bold text-zinc-400 font-mono">{tx.date}</td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-white">{tx.desc}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded">{tx.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{tx.cat}</span>
                  </td>
                  <td className={`px-8 py-6 text-sm font-black text-right ${tx.amount > 0 ? 'text-green-500' : 'text-white'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => setSelectedEvidence(tx.desc)}
                      className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-[#D4AF37] transition-all group/btn"
                    >
                      <Eye className="w-4 h-4 text-zinc-500 group-hover/btn:text-[#D4AF37]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Modal Mockup */}
      <AnimatePresence>
        {selectedEvidence && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvidence(null)}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Evidence: {selectedEvidence}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Digital Audit Trail</p>
                </div>
                <button onClick={() => setSelectedEvidence(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <ExternalLink className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              <div className="p-12 flex flex-col items-center justify-center space-y-6">
                <div className="w-full aspect-video bg-zinc-950 border border-zinc-800 rounded-3xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                  <FileText className="w-20 h-20 text-zinc-800" />
                  <p className="absolute bottom-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Digital Receipt Preview</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                    <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Transaction ID</p>
                    <p className="text-xs font-mono text-white">TXN-99283-XJ-2026</p>
                  </div>
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                    <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Timestamp</p>
                    <p className="text-xs font-mono text-white">2026-03-26 14:22:01</p>
                  </div>
                </div>
                <button className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black text-lg uppercase tracking-widest transition-all hover:bg-[#F1E5AC]">
                  Download Original File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
