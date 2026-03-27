import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Phone, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void;
  onGoToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToRegister }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('politrack_token');
    localStorage.removeItem('politrack_user');
    sessionStorage.clear();
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login gagal. Periksa nomor telepon dan kata sandi Anda.');
        return;
      }

      localStorage.setItem('politrack_token', data.token);
      localStorage.setItem('politrack_user', JSON.stringify(data.user));
      onLoginSuccess(data.token, data.user);
    } catch {
      setError('Tidak dapat terhubung ke server. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-zinc-800 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA8A2E] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
              <span className="text-white font-black text-3xl">P</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              PoliTrack <span className="text-[#D4AF37]">AI</span>
            </h1>
            <p className="text-zinc-500 mt-1 uppercase text-[10px] font-bold tracking-[0.3em]">
              Intelligence for Victory
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                Nomor Telepon
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                  autoComplete="off"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-11 pr-4 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white placeholder-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  autoComplete="current-password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-11 pr-12 py-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white placeholder-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-xs font-semibold">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !phone || !password}
              className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-[#F1E5AC] shadow-xl shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk ke Dashboard
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-zinc-600 text-xs">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={onGoToRegister}
                  className="text-[#D4AF37] font-bold hover:underline transition-colors"
                >
                  Daftar jadi Relawan
                </button>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-zinc-700 text-[10px] uppercase tracking-widest mt-6 font-bold">
          PoliTrack AI &copy; 2025 · Sistem Manajemen Kampanye
        </p>
      </motion.div>
    </div>
  );
};
