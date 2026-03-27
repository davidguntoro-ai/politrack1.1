import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, Info, TrendingUp, Target, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROFESSIONS, NEUTRAL_PROFESSIONS } from '../types';

// Mock GeoJSON for Kelurahan
const MOCK_GEOJSON: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Kelurahan 1' }, geometry: { type: 'Polygon', coordinates: [[[106.8, -6.2], [106.85, -6.2], [106.85, -6.25], [106.8, -6.25], [106.8, -6.2]]] } },
    { type: 'Feature', properties: { name: 'Kelurahan 2' }, geometry: { type: 'Polygon', coordinates: [[[106.85, -6.2], [106.9, -6.2], [106.9, -6.25], [106.85, -6.25], [106.85, -6.2]]] } },
    { type: 'Feature', properties: { name: 'Kelurahan 3' }, geometry: { type: 'Polygon', coordinates: [[[106.8, -6.25], [106.85, -6.25], [106.85, -6.3], [106.8, -6.3], [106.8, -6.25]]] } },
    { type: 'Feature', properties: { name: 'Kelurahan 4' }, geometry: { type: 'Polygon', coordinates: [[[106.85, -6.25], [106.9, -6.25], [106.9, -6.3], [106.85, -6.3], [106.85, -6.25]]] } },
    { type: 'Feature', properties: { name: 'Kelurahan 5' }, geometry: { type: 'Polygon', coordinates: [[[106.9, -6.25], [106.95, -6.25], [106.95, -6.3], [106.9, -6.3], [106.9, -6.25]]] } },
  ]
};

const PROFESSION_COLORS: Record<string, string> = {
  "Petani": "#22c55e", // Green
  "Nelayan": "#3b82f6", // Blue
  "Pedagang": "#eab308", // Yellow
  "Buruh": "#ef4444", // Red
  "IRT": "#ec4899", // Pink
  "Mahasiswa": "#a855f7", // Purple
  "Wiraswasta": "#f97316", // Orange
  "Guru Swasta": "#06b6d4", // Cyan
  "ASN": "#64748b", // Slate (Neutral)
  "TNI": "#475569", // Slate (Neutral)
  "POLRI": "#334155", // Slate (Neutral)
};

export const LogisticsMap: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'density' | 'dominant'>('dominant');
  const [densityData, setDensityData] = React.useState<any[]>([]);
  const [dominantData, setDominantData] = React.useState<any[]>([]);
  const [topLocations, setTopLocations] = React.useState<Record<string, any[]>>({});
  const [selectedJob, setSelectedJob] = React.useState<string>('Petani');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = {
      'x-tenant-id': 'tenant_1',
      'Authorization': `Bearer ${token}`
    };

    Promise.all([
      fetch('/api/analytics/logistics-map', { headers }).then(res => res.json()),
      fetch('/api/analytics/top-locations', { headers }).then(res => res.json()),
      fetch('/api/analytics/dominant-profession', { headers }).then(res => res.json())
    ]).then(([mapData, topData, domData]) => {
      setDensityData(mapData);
      setTopLocations(topData);
      setDominantData(domData);
      setLoading(false);
    }).catch(err => {
      console.error("Logistics fetch error:", err);
      setLoading(false);
    });
  }, []);

  const getStyle = (feature: any) => {
    const kelurahan = feature.properties.name;
    
    if (activeTab === 'density') {
      const jobData = densityData.find(d => d.kecamatan === kelurahan && d.pekerjaan === selectedJob);
      const percentage = jobData ? jobData.percentage : 0;
      return {
        fillColor: percentage > 30 ? '#D4AF37' : percentage > 15 ? '#D4AF3788' : '#333',
        weight: 1,
        opacity: 1,
        color: '#555',
        fillOpacity: 0.7
      };
    } else {
      const dom = dominantData.find(d => d.kelurahan === kelurahan);
      const color = dom ? PROFESSION_COLORS[dom.dominant_profession] : '#333';
      return {
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: '#555',
        fillOpacity: 0.7
      };
    }
  };

  const onEachFeature = (feature: any, layer: any) => {
    const kelurahan = feature.properties.name;
    
    if (activeTab === 'density') {
      const jobData = densityData.find(d => d.kecamatan === kelurahan && d.pekerjaan === selectedJob);
      const percentage = jobData ? jobData.percentage : 0;
      const count = jobData ? jobData.count : 0;

      layer.bindPopup(`
        <div class="text-zinc-900 p-2">
          <h4 class="font-bold border-b mb-2">${kelurahan}</h4>
          <p class="text-xs">Populasi <b>${selectedJob}</b>:</p>
          <p class="text-lg font-bold">${count} Orang (${percentage}%)</p>
        </div>
      `);
    } else {
      const dom = dominantData.find(d => d.kelurahan === kelurahan);
      if (dom) {
        layer.bindPopup(`
          <div class="text-zinc-900 p-2">
            <h4 class="font-bold border-b mb-2">${kelurahan}</h4>
            <p class="text-xs">Profesi Dominan:</p>
            <p class="text-lg font-bold text-tenant-primary">${dom.dominant_profession}</p>
            <p class="text-[10px] text-zinc-500 mt-1">${dom.percentage}% dari total ${dom.total_voters} pemilih</p>
            <div class="mt-2 p-2 bg-zinc-100 rounded text-[10px] leading-relaxed">
              <b>Rekomendasi:</b><br/>${dom.recommendation}
            </div>
          </div>
        `);
      }
    }
  };

  if (loading) return <div className="h-[600px] bg-zinc-900 animate-pulse rounded-3xl" />;

  const currentRecommendation = dominantData.find(d => d.dominant_profession === selectedJob)?.recommendation;

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('dominant')}
          className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'dominant' ? 'bg-tenant-primary text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Target className="w-4 h-4" /> Strategic Map
        </button>
        <button 
          onClick={() => setActiveTab('density')}
          className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'density' ? 'bg-tenant-primary text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <MapIcon className="w-4 h-4" /> Density Heatmap
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="dashboard-card">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-tenant-primary" />
              <h3 className="font-bold">Logistics Strategy</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Pilih Segmentasi</label>
                <select 
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-tenant-primary outline-none"
                >
                  {PROFESSIONS.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </select>
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedJob}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 bg-tenant-primary/10 border border-tenant-primary/20 rounded-2xl"
                >
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-tenant-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-tenant-primary uppercase tracking-widest mb-1">Targeting Recommendation</p>
                      <p className="text-sm font-medium leading-relaxed">
                        {currentRecommendation || "Pilih profesi untuk melihat strategi logistik spesifik."}
                      </p>
                      {NEUTRAL_PROFESSIONS.includes(selectedJob as any) && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-yellow-500 font-bold uppercase">
                          <Target className="w-3 h-3" /> Neutrality Required
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="font-bold">Top 3 Prioritas</h3>
            </div>
            <div className="space-y-3">
              {topLocations[selectedJob]?.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                      0{idx + 1}
                    </div>
                    <span className="text-xs font-bold">{loc.kecamatan}</span>
                  </div>
                  <span className="text-[10px] font-bold text-tenant-primary">{loc.count} Jiwa</span>
                </div>
              )) || (
                <p className="text-xs text-zinc-500 text-center py-4">Data tidak tersedia</p>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3 space-y-6">
          <div className="dashboard-card h-[600px] p-0 relative overflow-hidden">
            <div className="absolute top-6 left-6 z-[1000] bg-zinc-950/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-800">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                {activeTab === 'dominant' ? 'Dominant Profession Map' : 'Logistic Heatmap'}
              </h3>
              <p className="text-xl font-bold">
                {activeTab === 'dominant' ? 'Sebaran Profesi Terbesar' : `Kepadatan Populasi ${selectedJob}`}
              </p>
            </div>
            
            <MapContainer 
              center={[-6.2, 106.8]} 
              zoom={11} 
              style={{ height: '100%', width: '100%', background: '#0B0F19' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <GeoJSON 
                key={`${activeTab}-${selectedJob}`}
                data={MOCK_GEOJSON} 
                style={getStyle} 
                onEachFeature={onEachFeature}
              />
            </MapContainer>

            <div className="absolute bottom-6 right-6 z-[1000] bg-zinc-950/80 backdrop-blur-md p-3 rounded-xl border border-zinc-800 max-w-[300px]">
              <div className="flex flex-wrap gap-3">
                {activeTab === 'dominant' ? (
                  Object.entries(PROFESSION_COLORS).map(([job, color]) => (
                    <div key={job} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{job}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tinggi ({'>'}30%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#D4AF3788]" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sedang (15-30%)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
