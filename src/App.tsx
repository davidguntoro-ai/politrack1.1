import React, { useState, useEffect } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
import { VoterInteractionModule } from './components/VoterInteractionModule';
import { PublicMicrosite } from './components/PublicMicrosite';
import { ToastProvider } from './components/Toast';
import { LoginPage } from './components/LoginPage';
import { User, UserRole, Tenant } from './types';
import { Settings2, Smartphone, LayoutDashboard, Globe } from 'lucide-react';

const MOCK_TENANT: Tenant = {
  id: 'tenant_1',
  name: 'PoliTrack AI Demo',
  candidate_name: 'Dr. H. Ahmad Fauzi, M.Si',
  candidate_photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200',
  primary_color: '#eab308',
  logo_url: 'https://picsum.photos/seed/politrack/200/200',
};

const ROLE_MAP: Record<string, UserRole> = {
  Admin: UserRole.KANDIDAT,
  KANDIDAT: UserRole.KANDIDAT,
  KOORCAM: UserRole.KOORCAM,
  DATA_ENTRY: UserRole.DATA_ENTRY,
  RELAWAN: UserRole.RELAWAN,
};

function buildUserFromSession(raw: any): User {
  return {
    id: raw.id || 'usr_001',
    email: raw.phone ? `${raw.phone}@politrack.id` : 'admin@politrack.id',
    role: ROLE_MAP[raw.role] || UserRole.KANDIDAT,
    tenantId: raw.tenantId || 'tenant_1',
    nama_lengkap: raw.name || 'Administrator',
  };
}

function getStoredAuth(): { token: string; user: User } | null {
  try {
    const token = localStorage.getItem('politrack_token');
    const rawUser = localStorage.getItem('politrack_user');
    if (!token || !rawUser) return null;
    return { token, user: buildUserFromSession(JSON.parse(rawUser)) };
  } catch {
    return null;
  }
}

export default function App() {
  const stored = getStoredAuth();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!stored);
  const [user, setUser] = useState<User>(stored?.user ?? buildUserFromSession({}));
  const [tenant, setTenant] = useState<Tenant>(MOCK_TENANT);
  const [currentRole, setCurrentRole] = useState<UserRole>(stored?.user?.role ?? UserRole.KANDIDAT);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [isPublicMicrosite, setIsPublicMicrosite] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--tenant-primary', tenant.primary_color);
  }, [tenant.primary_color]);

  useEffect(() => {
    setUser(prev => ({ ...prev, role: currentRole }));
  }, [currentRole]);

  const handleLoginSuccess = (_token: string, rawUser: any) => {
    const mappedUser = buildUserFromSession(rawUser);
    setUser(mappedUser);
    setCurrentRole(mappedUser.role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.replace(window.location.origin);
  };

  const handleUpdateTenant = (updatedTenant: Partial<Tenant>) => {
    setTenant(prev => ({ ...prev, ...updatedTenant }));
  };

  const handleUpdateUser = (patch: Partial<User>) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('politrack_user', JSON.stringify({
        id: updated.id,
        phone: updated.email?.split('@')[0],
        name: updated.nama_lengkap,
        role: updated.role,
        tenantId: updated.tenantId,
      }));
      return updated;
    });
  };

  if (!isLoggedIn) {
    return (
      <ToastProvider>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="relative">
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
