import React, { useState, useEffect, useMemo } from 'react';
import Map, { Source, Layer, Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Filter, 
  UserCheck, 
  Zap, 
  Home, 
  Phone, 
  Send, 
  X, 
  ChevronRight, 
  AlertCircle,
  Users,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWlzdHVkaW8iLCJhIjoiY2x0eGZ4Z2Z4MDB4ZzJpcGZ4Z2Z4MDB4eiJ9.Y2x0eGZ4Z2Z4MDB4ZzJpcGZ4Z2Z4MDB4ei';

interface VoterFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    name: string;
    phone: string;
    sentiment: string;
    sentimentScore: number;
    isHighInfluence: boolean;
    mainIssue: string;
    competitorActivity: number;
    supportStatus: string;
  };
}

export const MicroTargetingMap: React.FC = () => {
  const [viewState, setViewState] = useState({
    longitude: 106.8456,
    latitude: -6.2088,
    zoom: 12
  });
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVoter, setSelectedVoter] = useState<VoterFeature | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    swingOnly: false,
    highInfluenceOnly: false,
    issue: 'All'
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('politrack_token');
      const res = await fetch('/api/analytics/map-data', {
        headers: {
          'x-tenant-id': 'tenant_1',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        setData(null);
        setLoading(false);
        return;
      }
      const json = await res.json();
      // Only accept valid GeoJSON FeatureCollections
      if (json && Array.isArray(json.features)) {
        setData(json);
      } else {
        setData(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch map data:', err);
      setData(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return null;
    let features = [...data.features];

    if (filters.swingOnly) {
      features = features.filter(f => f.properties.supportStatus === 'Swing');
    }
    if (filters.highInfluenceOnly) {
      features = features.filter(f => f.properties.isHighInfluence);
    }
    if (filters.issue !== 'All') {
      features = features.filter(f => f.properties.mainIssue === filters.issue);
    }

    return {
      ...data,
      features
    };
  }, [data, filters]);

  const clusterLayer: any = {
    id: 'clusters',
    type: 'circle',
    source: 'voters',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        100,
        '#f1f075',
        750,
        '#f28cb1'
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        100,
        30,
        750,
        40
      ]
    }
  };

  const clusterCountLayer: any = {
    id: 'cluster-count',
    type: 'symbol',
    source: 'voters',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  };

  const unclusteredPointLayer: any = {
    id: 'unclustered-point',
    type: 'circle',
    source: 'voters',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'supportStatus'],
        'Loyal', '#22c55e',
        'Swing', '#f59e0b',
        'Opponent', '#ef4444',
        '#ccc'
      ],
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  };

  const handleDispatch = async (voterId: string) => {
    try {
      const token = localStorage.getItem('politrack_token');
      const res = await fetch('/api/admin/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant_1',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          voterId,
          volunteerId: 'vol_123', // Mock
          instruction: 'Re-visit to address infrastructure concerns.'
        })
      });
      if (res.ok) {
        alert('Volunteer dispatched successfully!');
      }
    } catch (err) {
      console.error('Dispatch failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] bg-zinc-950 rounded-2xl border border-zinc-800 items-center justify-center">
        <div className="text-center text-zinc-500">
          <Target className="w-10 h-10 mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-medium">Loading map data…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[600px] bg-zinc-950 rounded-2xl border border-zinc-800 items-center justify-center">
        <div className="text-center text-zinc-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-yellow-500/60" />
          <p className="text-sm font-medium text-zinc-400">Peta tidak tersedia</p>
          <p className="text-xs text-zinc-600 mt-1">Data wilayah belum dimuat atau sesi belum aktif.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden relative">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-72 bg-zinc-900 border-r border-zinc-800 p-6 z-20 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-tenant-primary" />
                <h3 className="font-bold">Strategic Filters</h3>
              </div>
              <button onClick={() => setShowSidebar(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Targeting</label>
                <button 
                  onClick={() => setFilters(f => ({ ...f, swingOnly: !f.swingOnly }))}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    filters.swingOnly ? 'bg-tenant-primary/10 border-tenant-primary text-tenant-primary' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="text-sm font-medium">Swing Voters Only</span>
                  <Zap className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setFilters(f => ({ ...f, highInfluenceOnly: !f.highInfluenceOnly }))}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    filters.highInfluenceOnly ? 'bg-purple-500/10 border-purple-500 text-purple-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="text-sm font-medium">High-Influence Figures</span>
                  <UserCheck className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Core Issues</label>
                <select 
                  value={filters.issue}
                  onChange={(e) => setFilters(f => ({ ...f, issue: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-tenant-primary outline-none"
                >
                  <option value="All">All Issues</option>
                  <option value="Infrastruktur">Infrastructure</option>
                  <option value="Ekonomi">Economy</option>
                  <option value="Kesehatan">Health</option>
                  <option value="Pendidikan">Education</option>
                </select>
              </div>
            </div>

            <div className="mt-auto p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-500">LEGEND</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> LOYAL SUPPORTER
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" /> SWING VOTER
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> OPPONENT
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSidebar && (
        <button 
          onClick={() => setShowSidebar(true)}
          className="absolute top-6 left-6 z-20 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white hover:bg-zinc-800 transition-all"
        >
          <Filter className="w-5 h-5" />
        </button>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          onClick={e => {
            const feature = e.features?.[0];
            if (feature && feature.layer.id === 'unclustered-point') {
              setSelectedVoter(feature as any);
            } else {
              setSelectedVoter(null);
            }
          }}
          interactiveLayerIds={['unclustered-point']}
        >
          <NavigationControl position="top-right" />
          
          {filteredData && (
            <Source
              id="voters"
              type="geojson"
              data={filteredData}
              cluster={true}
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              <Layer {...clusterLayer} />
              <Layer {...clusterCountLayer} />
              <Layer {...unclusteredPointLayer} />
            </Source>
          )}

          {selectedVoter && (
            <Popup
              longitude={selectedVoter.geometry.coordinates[0]}
              latitude={selectedVoter.geometry.coordinates[1]}
              anchor="bottom"
              onClose={() => setSelectedVoter(null)}
              closeButton={false}
              className="voter-popup"
            >
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl min-w-[240px] text-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{selectedVoter.properties.name}</h4>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedVoter.properties.phone || 'No Phone'}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    selectedVoter.properties.supportStatus === 'Loyal' ? 'bg-green-500/20 text-green-500' :
                    selectedVoter.properties.supportStatus === 'Swing' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {selectedVoter.properties.supportStatus}
                  </div>
                </div>

                <div className="space-y-3 py-3 border-y border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Core Issue</span>
                    <span className="text-xs font-medium">{selectedVoter.properties.mainIssue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Influence</span>
                    <span className="text-xs font-medium">{selectedVoter.properties.isHighInfluence ? 'High' : 'Normal'}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                      <span>Sentiment Score</span>
                      <span>{(selectedVoter.properties.sentimentScore * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-tenant-primary" 
                        style={{ width: `${selectedVoter.properties.sentimentScore * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-[10px] text-zinc-500 italic">"Ragu karena program infrastruktur belum menyentuh desa."</p>
                  <button 
                    onClick={() => handleDispatch(selectedVoter.properties.id)}
                    className="w-full py-2 bg-tenant-primary hover:bg-tenant-primary/90 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Send className="w-3 h-3" /> Dispatch Volunteer
                  </button>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
};
