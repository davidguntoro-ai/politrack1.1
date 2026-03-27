import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  MapPin, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Info,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import Map, { Source, Layer, Popup, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicG9saXRyYWNrIiwiYSI6ImNsc3R6eGZ6ZzB6Z3Yyam16eGZ6ZzB6Z3YifQ.politrack-placeholder';

interface WarRoomStats {
  totalVotesCandidate: number;
  totalVotesOthers: number;
  totalTPS: number;
  leadMargin: number;
  leadPercentage: number;
  turnoutPercentage: number;
  districtStats: Record<string, any>;
  velocity: Record<string, number>;
  incidents?: any[];
}

interface VictoryDashboardProps {
  userRole: string;
}

export const VictoryDashboard: React.FC<VictoryDashboardProps> = ({ userRole }) => {
  const [stats, setStats] = useState<WarRoomStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [showCrisisLayer, setShowCrisisLayer] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, incidentsRes, heatmapRes] = await Promise.all([
        fetch('/api/war-room/stats', {
          headers: { 'x-tenant-id': 'tenant_1', 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/incidents/stats', {
          headers: { 'x-tenant-id': 'tenant_1', 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/analytics/heatmap', {
          headers: { 'x-tenant-id': 'tenant_1', 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Only parse valid responses
      const statsData = statsRes.ok ? await statsRes.json() : {};
      const incidentsRaw = incidentsRes.ok ? await incidentsRes.json() : [];
      const incidentsData = Array.isArray(incidentsRaw) ? incidentsRaw : [];
      const heatmap = heatmapRes.ok ? await heatmapRes.json() : null;

      // Only update state when core stats has the expected shape
      if (statsData && typeof statsData.totalVotesCandidate === 'number') {
        setStats({ ...statsData, incidents: incidentsData });
        setHeatmapData(heatmap);
        setLastUpdate(new Date());
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch War Room stats:', err);
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/incidents/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant_1',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchStats();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  useEffect(() => {
    fetchStats();

    // WebSocket Connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'TPS_UPDATE') {
        fetchStats(); // Re-fetch to get aggregated stats
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-tenant-primary animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Initializing War Room...</p>
        </div>
      </div>
    );
  }

  const velocityData = Object.entries(stats.velocity ?? {}).map(([hour, count]) => ({
    hour: `${hour}:00`,
    count
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const leaderboardData = [
    { name: 'Your Candidate', votes: stats.totalVotesCandidate, color: 'var(--tenant-primary)' },
    { name: 'Competitor A', votes: stats.totalVotesOthers * 0.6, color: '#ef4444' },
    { name: 'Competitor B', votes: stats.totalVotesOthers * 0.3, color: '#f59e0b' },
    { name: 'Competitor C', votes: stats.totalVotesOthers * 0.1, color: '#3b82f6' },
  ].sort((a, b) => b.votes - a.votes);

  return (
    <div className="space-y-6">
      {/* Real-time Header */}
      <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
            <Zap className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Live Victory Monitor</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
              <Clock className="w-3 h-3" />
              Last Update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Total TPS Reported</p>
            <p className="text-2xl font-black">{stats.totalTPS.toLocaleString()}</p>
          </div>
          <div className="h-10 w-px bg-zinc-800" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Voter Turnout</p>
            <p className="text-2xl font-black text-tenant-primary">{stats.turnoutPercentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-card bg-zinc-950 border-zinc-800 p-8 flex flex-col items-center text-center space-y-4"
        >
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Grand Total Votes</p>
          <h3 className="text-5xl font-black tracking-tighter">{stats.totalVotesCandidate.toLocaleString()}</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase">
            <ArrowUpRight className="w-3 h-3" />
            Leading by {stats.leadMargin.toLocaleString()}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="dashboard-card bg-zinc-950 border-zinc-800 p-8 flex flex-col items-center text-center space-y-4"
        >
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Victory Probability</p>
          <h3 className={`text-5xl font-black tracking-tighter ${
            stats.leadPercentage > 50 ? 'text-green-500' :
            stats.leadPercentage > 45 ? 'text-yellow-500' :
            'text-red-500'
          }`}>
            {stats.leadPercentage.toFixed(1)}%
          </h3>
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.leadPercentage}%` }}
              className={`h-full ${
                stats.leadPercentage > 50 ? 'bg-green-500' :
                stats.leadPercentage > 45 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="dashboard-card bg-zinc-950 border-zinc-800 p-8 flex flex-col items-center text-center space-y-4"
        >
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Reporting Velocity</p>
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData}>
                <defs>
                  <linearGradient id="colorVel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--tenant-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--tenant-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" stroke="var(--tenant-primary)" fillOpacity={1} fill="url(#colorVel)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TPS Reports / Hour</p>
        </motion.div>
      </div>

      {/* Map and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 dashboard-card p-0 overflow-hidden relative min-h-[500px]">
          <div className="absolute top-6 left-6 z-10 bg-zinc-950/80 backdrop-blur border border-zinc-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Victory Heatmap</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-[10px] font-bold uppercase">Winning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-[10px] font-bold uppercase">Tight</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-[10px] font-bold uppercase">Losing</span>
              </div>
            </div>
          </div>

          <Map
            initialViewState={{
              longitude: 106.8456,
              latitude: -6.2088,
              zoom: 11
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            {/* Heatmap Layer for Swing Voters */}
            {showHeatmap && heatmapData && (
              <Source type="geojson" data={heatmapData}>
                <Layer
                  id="voter-heatmap"
                  type="heatmap"
                  paint={{
                    'heatmap-weight': ['get', 'intensity'],
                    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
                    'heatmap-color': [
                      'interpolate',
                      ['linear'],
                      ['heatmap-density'],
                      0, 'rgba(234, 179, 8, 0)',
                      0.2, 'rgba(234, 179, 8, 0.2)',
                      0.4, 'rgba(234, 179, 8, 0.4)',
                      0.6, 'rgba(234, 179, 8, 0.6)',
                      0.8, 'rgba(234, 179, 8, 0.8)',
                      1, 'rgba(234, 179, 8, 1)'
                    ],
                    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
                    'heatmap-opacity': 0.6
                  }}
                />
              </Source>
            )}

            {/* Crisis Map Layer */}
            {showCrisisLayer && stats.incidents?.map((inc, i) => (
              inc.location && (
                <Marker 
                  key={i} 
                  longitude={inc.location.longitude} 
                  latitude={inc.location.latitude}
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-red-500/40 rounded-full animate-ping" />
                    <AlertTriangle className="w-6 h-6 text-red-500 relative z-10 cursor-pointer" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl z-50">
                      <p className="text-[10px] font-bold text-red-500 uppercase mb-1">{inc.category}</p>
                      <p className="text-xs text-zinc-400 line-clamp-2">{inc.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-zinc-900 rounded">{inc.status}</span>
                        <span className="text-[8px] text-zinc-600">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </Marker>
              )
            ))}
          </Map>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="dashboard-card space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Leaderboard</h3>
              <p className="text-xl font-bold">Candidate Comparison</p>
            </div>

            <div className="space-y-6">
              {leaderboardData.map((cand, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                    <span className={cand.name === 'Your Candidate' ? 'text-tenant-primary' : 'text-zinc-500'}>
                      {cand.name}
                    </span>
                    <span>{cand.votes.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(cand.votes / leaderboardData[0].votes) * 100}%` }}
                      className="h-full"
                      style={{ backgroundColor: cand.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Tracker */}
          <div className="dashboard-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-red-500">Crisis Tracker</h3>
              <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-bold rounded-full uppercase">Live</span>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {stats.incidents?.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-4 italic">No incidents reported yet.</p>
              ) : (
                stats.incidents?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((inc, i) => (
                  <div key={i} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-zinc-400">{inc.category.replace('_', ' ')}</span>
                      {userRole === 'KANDIDAT' || userRole === 'KOORCAM' ? (
                        <select 
                          value={inc.status}
                          onChange={(e) => updateIncidentStatus(inc.id, e.target.value)}
                          className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded outline-none cursor-pointer ${
                            inc.status === 'NEW' ? 'bg-red-500/20 text-red-500' :
                            inc.status === 'RESOLVED' ? 'bg-green-500/20 text-green-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="UNDER_INVESTIGATION">INVESTIGATING</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="LEGAL_ACTION_TAKEN">LEGAL ACTION</option>
                        </select>
                      ) : (
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          inc.status === 'NEW' ? 'bg-red-500/20 text-red-500' :
                          inc.status === 'RESOLVED' ? 'bg-green-500/20 text-green-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          {inc.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-2">{inc.description}</p>
                    <div className="flex items-center justify-between text-[8px] text-zinc-600 font-bold uppercase">
                      <span>{new Date(inc.createdAt).toLocaleTimeString()}</span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-2 h-2" />
                        Signed
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCw: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
);
