import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup, LayersControl, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Maximize, Minimize, MapPin, Flame, Shield, Layers } from 'lucide-react';
import { fetchMapIncidents, fetchHotspots } from '@/lib/queries';
import { useFilters } from '@/lib/filterContext';
import { applyFilters } from '@/lib/analytics';
import { SeverityBadge } from '@/components/ui/Badges';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { SEVERITY_COLORS } from '@/lib/types';
import type { CrimeIncident, Hotspot, Severity } from '@/lib/types';

const { BaseLayer, Overlay } = LayersControl;

const SEVERITY_RADIUS: Record<Severity, number> = { Low: 4, Medium: 6, High: 8, Critical: 10 };

function FullscreenControl({ map }: { map: L.Map | null }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      map?.getContainer().requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <button
      onClick={toggle}
      className="absolute top-2 right-2 z-[1000] glass-panel p-2 text-slate-300 hover:text-cyan-400"
      aria-label="Toggle fullscreen"
    >
      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
    </button>
  );
}

function MapRef({ setMap }: { setMap: (m: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { setMap(map); }, [map]);
  return null;
}

type LayerMode = 'normal' | 'heatmap' | 'hotspots' | 'risk';

export function CrimeMapPage() {
  const { filters } = useFilters();
  const [incidents, setIncidents] = useState<CrimeIncident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [layerMode, setLayerMode] = useState<LayerMode>('normal');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [inc, hs] = await Promise.all([fetchMapIncidents(undefined, 3000), fetchHotspots()]);
        if (cancelled) return;
        setIncidents(inc);
        setHotspots(hs);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load map data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredIncidents = useMemo(() => applyFilters(incidents, filters), [incidents, filters]);

  const hotspotLayerColor = (level: string) => {
    const map: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#fb923c', MODERATE: '#fbbf24', LOW: '#84cc16', 'VERY LOW': '#22c55e' };
    return map[level] || '#64748b';
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Layers className="w-4 h-4 text-cyan-400" />
        {(['normal', 'heatmap', 'hotspots', 'risk'] as LayerMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setLayerMode(mode)}
            className={`text-xs px-3 py-1.5 rounded ${
              layerMode === mode
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {mode === 'normal' ? 'NORMAL MAP' : mode === 'heatmap' ? 'HEATMAP' : mode === 'hotspots' ? 'HOTSPOTS' : 'RISK ZONES'}
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-auto">{filteredIncidents.length} incidents shown</span>
      </div>

      <div ref={containerRef} className="glass-card p-1 h-[600px] relative overflow-hidden">
        <MapContainer
          center={[40.76, -73.98]}
          zoom={12}
          className="w-full h-full rounded-lg"
          scrollWheelZoom
        >
          <MapRef setMap={setMap} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {layerMode === 'normal' && filteredIncidents.map((inc) => (
            <CircleMarker
              key={inc.id}
              center={[inc.latitude, inc.longitude]}
              radius={SEVERITY_RADIUS[inc.severity]}
              pathOptions={{
                color: SEVERITY_COLORS[inc.severity],
                fillColor: SEVERITY_COLORS[inc.severity],
                fillOpacity: 0.6,
                weight: 1,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-semibold">{inc.incident_id}</p>
                  <p>Type: {inc.crime_type}</p>
                  <p>Category: {inc.category}</p>
                  <p>Severity: <SeverityBadge severity={inc.severity} /></p>
                  <p>Date: {inc.date}</p>
                  <p>Time: {inc.time || 'N/A'}</p>
                  <p>Location: {inc.location}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {layerMode === 'heatmap' && filteredIncidents.map((inc) => (
            <CircleMarker
              key={inc.id}
              center={[inc.latitude, inc.longitude]}
              radius={12}
              pathOptions={{
                color: SEVERITY_COLORS[inc.severity],
                fillColor: SEVERITY_COLORS[inc.severity],
                fillOpacity: 0.15,
                weight: 0,
              }}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">{inc.incident_id}</p>
                  <p>{inc.crime_type} — {inc.severity}</p>
                  <p>{inc.location}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {(layerMode === 'hotspots' || layerMode === 'risk') && hotspots.map((hs) => (
            <CircleMarker
              key={hs.id}
              center={[hs.latitude, hs.longitude]}
              radius={layerMode === 'risk' ? 25 : 18}
              pathOptions={{
                color: hotspotLayerColor(hs.risk_level),
                fillColor: hotspotLayerColor(hs.risk_level),
                fillOpacity: layerMode === 'risk' ? 0.1 : 0.2,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-semibold">{hs.hotspot_id}</p>
                  <p>{hs.name}</p>
                  <p>Incidents: {hs.incident_count}</p>
                  <p>Dominant: {hs.dominant_crime}</p>
                  <p>Peak: {hs.peak_time}</p>
                  <p>Risk: {hs.risk_level} ({hs.risk_score}/100)</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        <FullscreenControl map={map} />
      </div>

      {filteredIncidents.length === 0 && layerMode === 'normal' && (
        <EmptyState title="No incidents" message="No incidents match the current filters" />
      )}
    </div>
  );
}
