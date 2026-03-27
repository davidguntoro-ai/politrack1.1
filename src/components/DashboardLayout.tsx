import React from 'react';
import { User, UserRole, Tenant } from '../types';
import { Sidebar, TopBar } from './Navigation';
import { MicroTargetingMap, DapilSummaryCards, WhatsAppSettings, VPIEngineComponent } from './KandidatDashboard';
import { VictoryDashboard } from './VictoryDashboard';
import { VictoryDashboardAuth } from './VictoryDashboardAuth';
import { RelawanDashboard } from './RelawanDashboard';
import { DistrictAnalyticsComponent, VolunteerLeaderboard, VolunteerAuditDashboard } from './KoorcamDashboard';
import { BulkUploadComponent, VoterInputForm, StatusTable } from './DataEntryDashboard';
import { PoliTrackIntelligence } from './PoliTrackIntelligence';
import { SpeechGenerator } from './SpeechGenerator';
import { LogisticsMap } from './LogisticsMap';
import { FinancialDashboard } from './FinancialDashboard';
import { VolunteerManagement } from './VolunteerManagement';
import { ShieldAlert, ArrowLeft, Settings, Flag, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  user: User;
  tenant: Tenant;
  onUpdateTenant: (updatedTenant: Partial<Tenant>) => void;
  onUpdateUser: (patch: Partial<User>) => void;
  onLogout: () => void;
}

const ForbiddenPage: React.FC = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
    <div className="w-20 h-20 rounded-full bg-red-950/30 border border-red-900 flex items-center justify-center mb-6">
      <ShieldAlert className="w-10 h-10 text-red-500" />
    </div>
    <h1 className="text-4xl font-bold mb-4 tracking-tight">Akses Ditolak (403)</h1>
    <p className="text-zinc-500 max-w-md mb-8">
      Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator sistem untuk informasi lebih lanjut.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold transition-all"
    >
      <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
    </button>
  </div>
);

const ComingSoonPage: React.FC<{ title: string; icon: React.ReactNode; description: string }> = ({ title, icon, description }) => (
  <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center space-y-4">
    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
      {icon}
    </div>
    <h3 className="text-xl font-black uppercase tracking-tighter text-white">{title}</h3>
    <p className="text-zinc-500 text-sm">{description}</p>
    <span className="inline-block px-4 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-xs font-bold uppercase tracking-widest">
      Segera Hadir
    </span>
  </div>
);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, tenant, onUpdateTenant, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [warRoomAuth, setWarRoomAuth] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const renderDashboard = () => {
    switch (user.role) {
      case UserRole.KANDIDAT:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-4 overflow-x-auto no-scrollbar">
              {['overview', 'targeting', 'logistics', 'intelligence', 'speech', 'finance', 'volunteers', 'war-room', 'campaign', 'witness', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-tenant-primary border-b-2 border-tenant-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <DapilSummaryCards />
                  <VPIEngineComponent />
                </motion.div>
              )}
              {activeTab === 'targeting' && (
                <motion.div key="targeting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-[600px] rounded-3xl overflow-hidden border border-zinc-800">
                  <MicroTargetingMap />
                </motion.div>
              )}
              {activeTab === 'logistics' && (
                <motion.div key="logistics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <LogisticsMap />
                </motion.div>
              )}
              {activeTab === 'intelligence' && (
                <motion.div key="intelligence" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <PoliTrackIntelligence />
                </motion.div>
              )}
              {activeTab === 'speech' && (
                <motion.div key="speech" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <SpeechGenerator />
                </motion.div>
              )}
              {activeTab === 'finance' && (
                <motion.div key="finance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <FinancialDashboard />
                </motion.div>
              )}
              {activeTab === 'volunteers' && (
                <motion.div key="volunteers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <VolunteerManagement />
                </motion.div>
              )}
              {activeTab === 'war-room' && (
                <motion.div key="war-room" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  {!warRoomAuth ? (
                    <VictoryDashboardAuth onAuthenticated={() => setWarRoomAuth(true)} />
                  ) : (
                    <VictoryDashboard userRole={user.role} />
                  )}
                </motion.div>
              )}
              {activeTab === 'campaign' && (
                <motion.div key="campaign" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <ComingSoonPage
                    title="Manajemen Kampanye"
                    icon={<Flag className="w-8 h-8 text-[#D4AF37]" />}
                    description="Kelola jadwal kampanye, materi promosi, dan koordinasi tim kampanye Anda."
                  />
                </motion.div>
              )}
              {activeTab === 'witness' && (
                <motion.div key="witness" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <ComingSoonPage
                    title="Saksi & Form C1"
                    icon={<ShieldCheck className="w-8 h-8 text-[#D4AF37]" />}
                    description="Manajemen saksi TPS, pengumpulan form C1, dan real-time monitoring hasil suara."
                  />
                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <WhatsAppSettings tenant={tenant} onUpdate={onUpdateTenant} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case UserRole.KOORCAM:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-4 overflow-x-auto no-scrollbar">
              {['overview', 'volunteers', 'audit'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-tenant-primary border-b-2 border-tenant-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {tab === 'overview' ? 'Analytics' : tab.replace('-', ' ')}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2"><DistrictAnalyticsComponent /></div>
                    <div className="lg:col-span-1"><VolunteerLeaderboard /></div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'volunteers' && (
                <motion.div key="volunteers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <VolunteerManagement />
                </motion.div>
              )}
              {activeTab === 'audit' && (
                <motion.div key="audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <VolunteerAuditDashboard />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case UserRole.DATA_ENTRY:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-4 overflow-x-auto no-scrollbar">
              {['overview', 'voters', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-tenant-primary border-b-2 border-tenant-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {tab === 'overview' ? 'Upload' : tab.replace('-', ' ')}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <BulkUploadComponent />
                </motion.div>
              )}
              {activeTab === 'voters' && (
                <motion.div key="voters" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <VoterInputForm />
                  <StatusTable />
                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center">
                    <Settings className="w-12 h-12 text-tenant-primary mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Data Entry Settings</h3>
                    <p className="text-zinc-500">Configuration options for data entry operators.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case UserRole.RELAWAN:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <RelawanDashboard tenantId={tenant.id} />
          </motion.div>
        );

      default:
        return <ForbiddenPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-[#D4AF37]/30">
      <Sidebar
        user={user}
        tenant={tenant}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onLogout={onLogout}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-72'}`}>
        <TopBar user={user} isCollapsed={isSidebarCollapsed} onUpdateUser={onUpdateUser} />
        <main className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {renderDashboard()}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
