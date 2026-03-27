import React, { useState, useEffect } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
import { VoterInteractionModule } from './components/VoterInteractionModule';
import { PublicMicrosite } from './components/PublicMicrosite';
import { ToastProvider } from './components/Toast';
import { User, UserRole, Tenant } from './types';
import { Settings2, LogIn, Smartphone, LayoutDashboard, Globe } from 'lucide-react';

const MOCK_TENANT: Tenant = {
  id: 'tenant_1',
  name: 'PoliTrack AI Demo',
  candidate_name: 'Dr. H. Ahmad Fauzi, M.Si',
  candidate_photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200',
  primary_color: '#eab308',
  logo_url: 'https://picsum.photos/seed/politrack/200/200',
};

const MOCK_USERS: Record<UserRole, User> = {
  [UserRole.KANDIDAT]: {
    id: 'usr_001',
    email: 'kandidat@politrack.id',
    role: UserRole.KANDIDAT,
    tenantId: 'tenant_1',
    nama_lengkap: 'Dr. H. Ahmad Fauzi, M.Si',
  },
  [UserRole.KOORCAM]: {
    id: 'usr_002',
    email: 'koorcam@politrack.id',
    role: UserRole.KOORCAM,
    tenantId: 'tenant_1',
    nama_lengkap: 'Koordinator Kecamatan',
  },
  [UserRole.DATA_ENTRY]: {
    id: 'usr_003',
    email: 'dataentry@politrack.id',
    role: UserRole.DATA_ENTRY,
    tenantId: 'tenant_1',
    nama_lengkap: 'Operator Data Entry',
  },
  [UserRole.RELAWAN]: {
    id: 'usr_004',
    email: 'relawan@politrack.id',
    role: UserRole.RELAWAN,
    tenantId: 'tenant_1',
    nama_lengkap: 'Relawan Lapangan',
  },
};

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.KANDIDAT);
  const [user, setUser] = useState<User>(MOCK_USERS[UserRole.KANDIDAT]);
  const [tenant, setTenant] = useState<Tenant>(MOCK_TENANT);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [isPublicMicrosite, setIsPublicMicrosite] = useState(false);

  useEffect(() => {
    setUser(MOCK_USERS[currentRole]);
    document.documentElement.style.setProperty('--tenant-primary', tenant.primary_color);
  }, [currentRole, tenant.primary_color]);

  const handleUpdateTenant = (updatedTenant: Partial<Tenant>) => {
    setTenant(prev => ({ ...prev, ...updatedTenant }));
  };

  const handleUpdateUser = (patch: Partial<User>) => {
    setUser(prev => ({ ...prev, ...patch }));
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              PoliTrack <span className="text-yellow-500">AI</span>
            </h1>
            <p className="text-zinc-500 mb-8 uppercase text-xs font-bold tracking-widest">Intelligence for Victory</p>
            <button
              onClick={() => setIsLoggedIn(true)}
              className="w-full py-4 bg-yellow-500 text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" /> Masuk ke Dashboard
            </button>
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="relative">
        {/* View Switcher for Demo Purposes */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          <button
            onClick={() => {
              setIsPublicMicrosite(!isPublicMicrosite);
              setIsMobileMode(false);
            }}
            className={`flex items-center gap-2 p-3 rounded-full border shadow-2xl transition-all backdrop-blur-md ${
              isPublicMicrosite
                ? 'bg-tenant-primary text-white border-tenant-primary'
                : 'bg-zinc-900/80 text-white border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest pr-2">
              {isPublicMicrosite ? 'Public Site' : 'View Public'}
            </span>
          </button>

          {!isPublicMicrosite && (
            <button
              onClick={() => setIsMobileMode(!isMobileMode)}
              className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md p-3 rounded-full border border-zinc-800 shadow-2xl text-white hover:bg-zinc-800 transition-all"
            >
              {isMobileMode ? <LayoutDashboard className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              <span className="text-xs font-bold uppercase tracking-widest pr-2">
                {isMobileMode ? 'Dashboard' : 'Mobile App'}
              </span>
            </button>
          )}

          {!isMobileMode && !isPublicMicrosite && (
            <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md p-2 rounded-full border border-zinc-800 shadow-2xl">
              <div className="p-2 bg-zinc-800 rounded-full text-zinc-400">
                <Settings2 className="w-4 h-4" />
              </div>
              <div className="flex gap-1">
                {Object.values(UserRole).map((role) => (
                  <button
                    key={role}
                    onClick={() => setCurrentRole(role)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      currentRole === role
                        ? 'bg-tenant-primary text-white shadow-lg shadow-tenant-primary/20'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {isPublicMicrosite ? (
          <PublicMicrosite tenant={tenant} />
        ) : isMobileMode ? (
          <VoterInteractionModule tenant={tenant} />
        ) : (
          <DashboardLayout
            user={user}
            tenant={tenant}
            onUpdateTenant={handleUpdateTenant}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
          />
        )}
      </div>
    </ToastProvider>
  );
}
