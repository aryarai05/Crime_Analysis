import { useMemo, useState } from 'react';
import { Flame, MapPin, TrendingUp, Clock, Activity } from 'lucide-react';
import { FilterBar } from '@/components/ui/FilterBar';
import { RiskBadge } from '@/components/ui/Badges';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { useIncidentData } from '@/lib/useIncidentData';
import { runDBSCAN } from '@/lib/clustering';
import { RISK_LEVEL_COLORS } from '@/lib/types';
import type { Cluster } from '@/lib/clustering';

export function HotspotsPage() {
  const { filteredIncidents, hotspots, loading, error } = useIncidentData();
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  const clusters = useMemo(() => {
    if (filteredIncidents.length === 0) return [];
    if (filteredIncidents.length > 3000) {
      return runDBSCAN(filteredIncidents.slice(0, 3000), 0.3, 10);
    }
    return runDBSCAN(filteredIncidents, 0.3, 10);
  }, [filteredIncidents]);

  const dbHotspots = hotspots.length > 0 ? hotspots : [];

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <FilterBar />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">Hotspot Analysis</h2>
        </div>
        <div className="text-xs text-slate-500">
          {clusters.length} clusters detected (DBSCAN) • {dbHotspots.length} stored hotspots
        </div>
      </div>

      {clusters.length === 0 ? (
        <EmptyState title="No hotspots detected" message="Not enough data points to form clusters with current filters" />
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusters.slice(0, 12).map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCluster(c)}
                className="glass-card p-5 cursor-pointer hover:glow-red transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">{c.hotspotId}</p>
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                  </div>
                  <RiskBadge level={c.riskLevel as typeof c.riskLevel & 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY LOW'} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Incidents
                    </span>
                    <span className="text-white font-semibold">{c.incidentCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Dominant
                    </span>
                    <span className="text-white">{c.dominantCrime}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Peak Time
                    </span>
                    <span className="text-white">{c.peakTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Avg Severity
                    </span>
                    <span className="text-white">{c.avgSeverity.toFixed(2)} / 4</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-cyan-500/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Risk Score</span>
                    <span className="text-[10px] font-bold" style={{ color: RISK_LEVEL_COLORS[c.riskLevel as keyof typeof RISK_LEVEL_COLORS] || '#64748b' }}>
                      {c.riskScore} / 100
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${c.riskScore}%`, backgroundColor: RISK_LEVEL_COLORS[c.riskLevel as keyof typeof RISK_LEVEL_COLORS] || '#64748b' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedCluster && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">{selectedCluster.hotspotId}</p>
                  <p className="text-lg font-semibold text-white">{selectedCluster.name}</p>
                </div>
                <button onClick={() => setSelectedCluster(null)} className="text-xs text-slate-500 hover:text-white">Close</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-[10px] text-slate-500 uppercase">Incidents</p><p className="text-xl font-bold text-white">{selectedCluster.incidentCount}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Dominant Crime</p><p className="text-sm font-semibold text-white">{selectedCluster.dominantCrime}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Peak Time</p><p className="text-sm font-semibold text-white">{selectedCluster.peakTime}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Risk Score</p><p className="text-xl font-bold" style={{ color: RISK_LEVEL_COLORS[selectedCluster.riskLevel as keyof typeof RISK_LEVEL_COLORS] }}>{selectedCluster.riskScore} / 100</p></div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">Center coordinates: {selectedCluster.centerLat.toFixed(4)}, {selectedCluster.centerLng.toFixed(4)}</p>
                <p className="text-xs text-slate-500">Radius: {selectedCluster.radius.toFixed(2)} km</p>
                <p className="text-xs text-slate-500 mt-2">Method: DBSCAN (eps=0.3km, minPts=10)</p>
              </div>
            </div>
          )}
        </>
      )}

      {dbHotspots.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-white uppercase mb-3">Stored Hotspots (Database)</h3>
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="px-3 py-2 text-left text-slate-400 uppercase">ID</th>
                  <th className="px-3 py-2 text-left text-slate-400 uppercase">Name</th>
                  <th className="px-3 py-2 text-left text-slate-400 uppercase">Location</th>
                  <th className="px-3 py-2 text-left text-slate-400 uppercase">Incidents</th>
                  <th className="px-3 py-2 text-left text-slate-400 uppercase">Dominant</th>
                  <th className="px-3 py-2 text-left text-slate-400 uppercase">Peak Time</th>
                  <th className="px-3 py-2 text-left text-slate-400 uppercase">Risk</th>
                </tr>
              </thead>
              <tbody>
                {dbHotspots.map((hs) => (
                  <tr key={hs.id} className="border-b border-cyan-500/5 hover:bg-cyan-500/5">
                    <td className="px-3 py-2 text-slate-300">{hs.hotspot_id}</td>
                    <td className="px-3 py-2 text-slate-300">{hs.name}</td>
                    <td className="px-3 py-2 text-slate-300">{hs.location}</td>
                    <td className="px-3 py-2 text-white font-semibold">{hs.incident_count}</td>
                    <td className="px-3 py-2 text-slate-300">{hs.dominant_crime}</td>
                    <td className="px-3 py-2 text-slate-300">{hs.peak_time}</td>
                    <td className="px-3 py-2"><RiskBadge level={hs.risk_level} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
