import React from 'react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SupportData, Tenant, PROFESSIONS } from '../types';
import { TrendingUp, Users, Target, MapPin, MessageSquare, Save, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

export const VPIEngineComponent: React.FC = () => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedJob, setSelectedJob] = React.useState<string>('');

  const fetchVpi = React.useCallback((job: string = '') => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const url = new URL('/api/analytics/vpi', window.location.origin);
    if (job) url.searchParams.append('pekerjaan', job);

    fetch(url.toString(), {
      headers: {
        'x-tenant-id': 'tenant_1',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(json => {
      setData(json);
      setLoading(false);
    })
    .catch(err => {
      console.error("VPI fetch error:", err);
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    fetchVpi();
  }, [fetchVpi]);

  const handleJobChange = (job: string) => {
    setSelectedJob(job);
    fetchVpi(job);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-tenant-primary" />
          <h2 className="text-xl font-bold">Victory Probability Index (VPI)</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedJob}
            onChange={(e) => handleJobChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-300 focus:border-tenant-primary outline-none"
          >
            <option value="">Semua Pekerjaan</option>
            {PROFESSIONS.map(job => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
          
          <div className="px-3 py-1 bg-tenant-primary/10 text-tenant-primary rounded-full text-xs font-bold uppercase tracking-widest">
            Live Predictive Engine
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="dashboard-card animate-pulse h-40 bg-zinc-900" />)}
        </div>
      ) : data?.districts ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.districts.map((d: any) => (
            <div key={d.districtId} className={`dashboard-card relative overflow-hidden transition-all hover:scale-[1.02] ${d.alert ? 'border-red-500/50 bg-red-500/5 ring-1 ring-red-500/20' : ''}`}>
              {d.alert && (
                <div className="absolute top-0 right-0 p-2 bg-red-500 text-white animate-pulse z-10">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{d.districtName}</p>
                  <p className="text-2xl font-bold">{(d.vpi * 100).toFixed(1)}%</p>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  d.status === 'Green' ? 'bg-green-500/20 text-green-500' :
                  d.status === 'Yellow' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {d.status}
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${
                      d.status === 'Green' ? 'bg-green-500' :
                      d.status === 'Yellow' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${d.vpi * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
                  <span>Confidence: {(d.confidenceLevel * 100).toFixed(0)}%</span>
                  <span>Target: 50% + 1</span>
                </div>
              </div>

              {d.alert && (
                <div className="mt-4 p-2 bg-red-500/20 border border-red-500/50 rounded text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> IMMEDIATE ACTION: DROPPED FROM GREEN
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-card text-center py-12 text-zinc-500">
          Tidak ada data untuk kategori ini.
        </div>
      )}
    </div>
  );
};

// ... existing GlobalMapComponent and DapilSummaryCards ...

export const WhatsAppSettings: React.FC<{ tenant: Tenant; onUpdate: (t: Partial<Tenant>) => void }> = ({ tenant, onUpdate }) => {
  const [template, setTemplate] = React.useState(tenant.wa_greeting_template || 'Halo [VOTER_NAME], saya [VOLUNTEER_NAME] dari tim [CANDIDATE_NAME]. Terima kasih atas dukungannya terkait isu [VOTER_ISSUE]!');
  const [enabled, setEnabled] = React.useState(tenant.wa_greeting_enabled || false);
  const [summaryEnabled, setSummaryEnabled] = React.useState(tenant.isSummaryEnabled || false);
  const [summaryPhone, setSummaryPhone] = React.useState(tenant.summaryRecipientPhone || '');
  const [generating, setGenerating] = React.useState(false);

  const handleSave = () => {
    onUpdate({
      wa_greeting_enabled: enabled,
      wa_greeting_template: template,
      isSummaryEnabled: summaryEnabled,
      summaryRecipientPhone: summaryPhone,
    });
  };

  const triggerPreview = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/generate-summary', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'tenant_1',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.preview) {
        alert("Preview Laporan Harian:\n\n" + data.preview);
      }
    } catch (err) {
      console.error("Failed to generate summary:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-card space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-tenant-primary" />
            <h3 className="font-bold">WhatsApp Greeting</h3>
          </div>
          <button 
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-tenant-primary' : 'bg-zinc-800'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pesan Sapaan Otomatis</label>
          <textarea 
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:border-tenant-primary outline-none min-h-[120px] resize-none"
            placeholder="Tulis pesan sapaan..."
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {['[VOTER_NAME]', '[VOLUNTEER_NAME]', '[VOTER_ISSUE]', '[CANDIDATE_NAME]'].map(tag => (
              <button 
                key={tag}
                onClick={() => setTemplate(prev => prev + ' ' + tag)}
                className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400 hover:text-white transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-tenant-primary" />
            <h3 className="font-bold">Daily Executive Summary</h3>
          </div>
          <button 
            onClick={() => setSummaryEnabled(!summaryEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${summaryEnabled ? 'bg-tenant-primary' : 'bg-zinc-800'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${summaryEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nomor WhatsApp Penerima</label>
            <input 
              type="text"
              value={summaryPhone}
              onChange={(e) => setSummaryPhone(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-tenant-primary outline-none"
              placeholder="628123456789"
            />
            <p className="text-[10px] text-zinc-500">Laporan akan dikirim setiap pukul 07:00 pagi.</p>
          </div>

          <button 
            onClick={triggerPreview}
            disabled={generating || !summaryEnabled}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
            Preview Laporan Hari Ini
          </button>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-3 bg-tenant-primary hover:bg-tenant-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-tenant-primary/20"
      >
        <Save className="w-4 h-4" /> Simpan Semua Konfigurasi
      </button>
    </div>
  );
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWlzdHVkaW8iLCJhIjoiY2x0eGZ4Z2Z4MDB4ZzJpcGZ4Z2Z4MDB4eiJ9.Y2x0eGZ4Z2Z4MDB4ZzJpcGZ4Z2Z4MDB4ei'; // Placeholder

interface MapProps {
  data: SupportData[];
}

export const GlobalMapComponent: React.FC<MapProps> = ({ data }) => {
  // Mock GeoJSON for demonstration
  const geojson: any = {
    type: 'FeatureCollection',
    features: data.map((d, i) => ({
      type: 'Feature',
      properties: {
        id: d.district_id,
        name: d.district_name,
        support: d.support_percentage,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [106.8 + i * 0.1, -6.2],
          [106.9 + i * 0.1, -6.2],
          [106.9 + i * 0.1, -6.3],
          [106.8 + i * 0.1, -6.3],
          [106.8 + i * 0.1, -6.2],
        ]],
      },
    })),
  };

  const layerStyle: any = {
    id: 'data',
    type: 'fill',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'support'],
        0, '#ef4444',
        50, '#f59e0b',
        100, '#22c55e',
      ],
      'fill-opacity': 0.6,
    },
  };

  return (
    <div className="dashboard-card h-[500px] relative overflow-hidden">
      <div className="absolute top-6 left-6 z-10 bg-zinc-950/80 backdrop-blur-md p-4 rounded-lg border border-zinc-800">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Peta Dukungan Strategis</h3>
        <p className="text-2xl font-bold">Heatmap Dapil Utama</p>
      </div>
      <Map
        initialViewState={{
          longitude: 106.8456,
          latitude: -6.2088,
          zoom: 10,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Source type="geojson" data={geojson}>
          <Layer {...layerStyle} />
        </Source>
      </Map>
    </div>
  );
};

export { MicroTargetingMap } from './MicroTargetingMap';

export const DapilSummaryCards: React.FC = () => {
  const stats = [
    { label: 'Total Pemilih Tetap', value: '1.245.670', icon: Users, color: 'text-blue-400' },
    { label: 'Target Suara', value: '650.000', icon: Target, color: 'text-tenant-primary' },
    { label: 'Dukungan Saat Ini', value: '42%', icon: TrendingUp, color: 'text-green-400' },
    { label: 'Kecamatan Terdata', value: '12 / 15', icon: MapPin, color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="dashboard-card flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-zinc-950 border border-zinc-800 ${stat.color}`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
