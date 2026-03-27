import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VictoryDashboardAuthProps {
  onAuthenticated: () => void;
}

export const VictoryDashboardAuth: React.FC<VictoryDashboardAuthProps> = ({ onAuthenticated }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;

    setLoading(true);
    setError(false);

    try {
      const token = localStorage.getItem('politrack_token');
      const res = await fetch('/api/war-room/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant_1', // Mock
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });

      if (res.ok) {
        onAuthenticated();
      } else {
        setError(true);
        setPin('');
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-black/50"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-tenant-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-tenant-primary" />
          </div>
          
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">War Room Access</h2>
            <p className="text-zinc-500 text-sm mt-2">This dashboard contains sensitive real-time electoral data. Please enter your high-security Master PIN.</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter Master PIN"
                className={`w-full bg-zinc-900 border ${error ? 'border-red-500' : 'border-zinc-800'} rounded-2xl py-4 pl-12 pr-4 text-center text-2xl tracking-[1em] font-black focus:border-tenant-primary outline-none transition-all`}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-red-500 text-xs font-bold justify-center"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>INVALID PIN. ACCESS DENIED.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full py-4 bg-tenant-primary hover:bg-tenant-primary/90 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-tenant-primary/20 disabled:opacity-50"
            >
              {loading ? 'VERIFYING...' : 'AUTHORIZE ACCESS'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
            All access attempts are logged for security audit.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
