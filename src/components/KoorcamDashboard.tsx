import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Users, Award, TrendingUp, UserCheck } from 'lucide-react';

const data = [
  { name: 'Kec. Menteng', voters: 45000, support: 32000 },
  { name: 'Kec. Gambir', voters: 38000, support: 21000 },
  { name: 'Kec. Senen', voters: 52000, support: 41000 },
  { name: 'Kec. Sawah Besar', voters: 31000, support: 15000 },
  { name: 'Kec. Kemayoran', voters: 65000, support: 48000 },
];

export { VolunteerAuditDashboard } from './VolunteerAuditDashboard';

export const DistrictAnalyticsComponent: React.FC = () => {
  return (
    <div className="dashboard-card h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Analitik Kecamatan</h3>
          <p className="text-2xl font-bold">Sebaran Suara Per Wilayah</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-3 h-3 bg-zinc-700 rounded-sm" /> Total Pemilih
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-3 h-3 bg-tenant-primary rounded-sm" /> Target Suara
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#71717a" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Bar dataKey="voters" fill="#27272a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="support" fill="var(--tenant-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const VolunteerLeaderboard: React.FC = () => {
  const volunteers = [
    { name: 'Ahmad Subarjo', district: 'Menteng', points: 1240, status: 'Active', avatar: 'AS' },
    { name: 'Siti Aminah', district: 'Kemayoran', points: 1150, status: 'Active', avatar: 'SA' },
    { name: 'Budi Santoso', district: 'Senen', points: 980, status: 'Active', avatar: 'BS' },
    { name: 'Dewi Lestari', district: 'Gambir', points: 840, status: 'Away', avatar: 'DL' },
  ];

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Performa Relawan</h3>
          <p className="text-2xl font-bold">Leaderboard Koordinator</p>
        </div>
        <Award className="w-8 h-8 text-yellow-500 opacity-50" />
      </div>
      <div className="space-y-4">
        {volunteers.map((v, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-900 group hover:border-tenant-primary/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-400 group-hover:bg-tenant-primary group-hover:text-white transition-colors">
                {v.avatar}
              </div>
              <div>
                <p className="font-semibold">{v.name}</p>
                <p className="text-xs text-zinc-500">{v.district}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-tenant-primary">{v.points} pts</p>
              <div className="flex items-center gap-1 justify-end">
                <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'Active' ? 'bg-green-500' : 'bg-zinc-600'}`} />
                <span className="text-[10px] text-zinc-500 uppercase">{v.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
