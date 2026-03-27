import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  User, 
  MapPin, 
  Clock, 
  Smartphone,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditResult {
  id: string;
  email: string;
  reliabilityScore: number;
  isFlagged: boolean;
  auditStatus: 'clean' | 'suspicious' | 'fraudulent';
}

export const VolunteerAuditDashboard: React.FC = () => {
  const [results, setResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAuditResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/audit-results', {
        headers: {
          'x-tenant-id': 'tenant_1', // Mock
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setResults(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch audit results:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditResults();
  }, []);

  const handleTriggerAudit = async () => {
    setTriggering(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/admin/trigger-audit', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'tenant_1',
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchAuditResults();
    } catch (err) {
      console.error('Audit trigger failed:', err);
    } finally {
      setTriggering(false);
    }
  };

  const filteredResults = results.filter(r => 
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-card space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Forensic Audit Module</h3>
          <p className="text-2xl font-bold">Volunteer Reliability Monitor</p>
        </div>
        <button 
          onClick={handleTriggerAudit}
          disabled={triggering}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${triggering ? 'animate-spin' : ''}`} />
          <span className="text-xs font-bold uppercase">Run Audit</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search by volunteer email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-tenant-primary outline-none"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-zinc-900 rounded-xl" />)}
          </div>
        ) : (
          filteredResults.map((res) => (
            <motion.div 
              key={res.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                res.auditStatus === 'fraudulent' ? 'bg-red-500/5 border-red-500/20' :
                res.auditStatus === 'suspicious' ? 'bg-yellow-500/5 border-yellow-500/20' :
                'bg-zinc-950/50 border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  res.auditStatus === 'fraudulent' ? 'bg-red-500/20 text-red-500' :
                  res.auditStatus === 'suspicious' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-green-500/20 text-green-500'
                }`}>
                  {res.auditStatus === 'fraudulent' ? <ShieldAlert className="w-6 h-6" /> :
                   res.auditStatus === 'suspicious' ? <AlertTriangle className="w-6 h-6" /> :
                   <ShieldCheck className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-sm">{res.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <User className="w-3 h-3" /> ID: {res.id.slice(0, 8)}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      res.auditStatus === 'fraudulent' ? 'bg-red-500/20 text-red-500' :
                      res.auditStatus === 'suspicious' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-green-500/20 text-green-500'
                    }`}>
                      {res.auditStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Reliability Score</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${
                      res.reliabilityScore < 40 ? 'text-red-500' :
                      res.reliabilityScore < 70 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {res.reliabilityScore}%
                    </span>
                  </div>
                </div>
                {res.reliabilityScore < 40 && (
                  <p className="text-[10px] font-bold text-red-500 uppercase mt-1 animate-pulse">
                    DATA EXCLUDED FROM VPI
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Smartphone className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">Device Integrity</span>
          </div>
          <p className="text-xs text-zinc-400">Comparing Device_ID & IP_Address to detect multi-account spoofing.</p>
        </div>
        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">Metadata Check</span>
          </div>
          <p className="text-xs text-zinc-400">Validating EXIF timestamps against server receipt times.</p>
        </div>
      </div>
    </div>
  );
};
