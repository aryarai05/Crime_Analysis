import { useMemo, useState } from 'react';
import { Shield, AlertTriangle, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterBar } from '@/components/ui/FilterBar';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { RiskBadge } from '@/components/ui/Badges';
import { ChartCard } from '@/components/ui/ChartCard';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { useIncidentData } from '@/lib/useIncidentData';
import { computeRiskScore } from '@/lib/riskEngine';
import { computeTopLocations } from '@/lib/analytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { RISK_LEVEL_COLORS } from '@/lib/types';

export function RiskIntelligencePage() {
  const { filteredIncidents, hotspots, locations, loading, error } = useIncidentData();
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showExplain, setShowExplain] = useState(false);

  const topLocs = useMemo(() => computeTopLocations(filteredIncidents, 10), [filteredIncidents]);

  const locationRisk = useMemo(() => {
    const loc = selectedLocation || topLocs[0]?.location || '';
    if (!loc) return null;
    const locIncidents = filteredIncidents.filter((i) => i.location === loc);
    const locHotspots = hotspots.filter((h) => h.location === loc).length;
    return {
      location: loc,
      ...computeRiskScore(locIncidents, locHotspots, loc),
    };
  }, [selectedLocation, filteredIncidents, hotspots, topLocs]);

  const allLocationRisks = useMemo(() => {
    return locations.map((loc) => {
      const locIncidents = filteredIncidents.filter((i) => i.location === loc.name);
      const locHotspots = hotspots.filter((h) => h.location === loc.name).length;
      const risk = computeRiskScore(locIncidents, locHotspots, loc.name);
      return { location: loc.name, score: risk.score, level: risk.level };
    }).sort((a, b) => b.score - a.score);
  }, [filteredIncidents, hotspots, locations]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorState message={error} />;

  if (filteredIncidents.length === 0) {
    return (
      <div className="space-y-4">
        <FilterBar />
        <EmptyState title="No data" message="No incidents match the current filters" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar />

      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Risk Intelligence</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Risk Gauge */}
        <div className="glass-card p-6 flex flex-col items-center">
          <p className="text-xs text-slate-500 uppercase mb-1">Risk Score</p>
          <p className="text-sm text-white mb-4">{locationRisk?.location || 'Overall'}</p>
          {locationRisk && (
            <>
              <RiskGauge score={locationRisk.score} level={locationRisk.level} size={220} />
              <div className="mt-4 flex items-center gap-2 text-xs">
                {locationRisk.trend === 'increasing' && <TrendingUp className="w-4 h-4 text-red-400" />}
                <span className="text-slate-400">Trend: <span className="text-white capitalize">{locationRisk.trend}</span></span>
              </div>
            </>
          )}
        </div>

        {/* Contributors + Components */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white uppercase mb-3">Main Contributors</h3>
            <div className="space-y-2">
              {locationRisk?.contributors.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/20 border border-cyan-500/5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white uppercase mb-3">Risk Components Breakdown</h3>
            <div className="space-y-3">
              {locationRisk?.components.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300">{c.name}</span>
                    <span className="text-white font-semibold">{c.contribution.toFixed(1)}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-2 rounded-full bg-cyan-400 transition-all"
                      style={{ width: `${(c.contribution / (c.weight * 100)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Location selector */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500">Select location:</span>
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.name)}
              className={`text-xs px-3 py-1 rounded ${
                (selectedLocation || topLocs[0]?.location) === loc.name
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* All locations comparison */}
      <ChartCard title="Risk Score by Location" subtitle="Comparative risk across all areas">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={allLocationRisks}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
            <XAxis dataKey="location" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {allLocationRisks.map((entry, i) => (
                <Cell key={i} fill={RISK_LEVEL_COLORS[entry.level]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Explanation */}
      <div className="glass-card p-5">
        <button
          onClick={() => setShowExplain(!showExplain)}
          className="flex items-center gap-2 text-sm font-semibold text-white w-full"
        >
          <Info className="w-4 h-4 text-cyan-400" />
          How this score is calculated
          {showExplain ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>
        {showExplain && (
          <div className="mt-4 space-y-3 text-xs text-slate-400">
            <p>The risk score (0-100) is calculated from six weighted components:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/20 rounded"><p className="text-cyan-400 font-semibold">Crime Frequency (25%)</p><p>Based on total incident count relative to a reference maximum.</p></div>
              <div className="p-3 bg-slate-800/20 rounded"><p className="text-cyan-400 font-semibold">Crime Severity (20%)</p><p>Average severity of incidents on a 1-4 scale (Low to Critical).</p></div>
              <div className="p-3 bg-slate-800/20 rounded"><p className="text-cyan-400 font-semibold">Recent Activity (20%)</p><p>Number of incidents in the last 30 days.</p></div>
              <div className="p-3 bg-slate-800/20 rounded"><p className="text-cyan-400 font-semibold">Hotspot Density (15%)</p><p>Number of active hotspots in the area.</p></div>
              <div className="p-3 bg-slate-800/20 rounded"><p className="text-cyan-400 font-semibold">Nighttime Activity (10%)</p><p>Proportion of incidents occurring 20:00-04:00.</p></div>
              <div className="p-3 bg-slate-800/20 rounded"><p className="text-cyan-400 font-semibold">Crime Trend (10%)</p><p>Recent vs earlier monthly average comparison.</p></div>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-3">
              {[['0-20', 'VERY LOW', '#22c55e'], ['21-40', 'LOW', '#84cc16'], ['41-60', 'MODERATE', '#fbbf24'], ['61-80', 'HIGH', '#fb923c'], ['81-100', 'CRITICAL', '#ef4444']].map(([range, level, color]) => (
                <div key={level} className="text-center p-2 rounded" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                  <p className="text-[10px] font-bold" style={{ color }}>{level}</p>
                  <p className="text-[10px] text-slate-500">{range}</p>
                </div>
              ))}
            </div>
            <p className="text-amber-400 mt-3">This is an aggregate analytical estimate based on historical patterns and should not be treated as a guaranteed outcome.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { Cell } from 'recharts';
