import { useMemo, useState } from 'react';
import { Brain, MapPin, Calendar, Clock, Tag, Shield, Route, AlertTriangle } from 'lucide-react';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { ChartCard } from '@/components/ui/ChartCard';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { useIncidentData } from '@/lib/useIncidentData';
import { predictRisk, computeRiskScore } from '@/lib/riskEngine';
import { computeHourlyDistribution } from '@/lib/analytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export function PredictionsPage() {
  const { filteredIncidents, hotspots, locations, loading, error } = useIncidentData();
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [showSafety, setShowSafety] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const prediction = useMemo(() => {
    if (!location && !date && !time && !category) return null;
    return predictRisk(filteredIncidents, location, date, time, category);
  }, [filteredIncidents, location, date, time, category]);

  const safetyInfo = useMemo(() => {
    if (!origin || !destination || origin === destination) return null;
    const originIncidents = filteredIncidents.filter((i) => i.location === origin);
    const destIncidents = filteredIncidents.filter((i) => i.location === destination);
    const originRisk = computeRiskScore(originIncidents, hotspots.filter((h) => h.location === origin).length, origin);
    const destRisk = computeRiskScore(destIncidents, hotspots.filter((h) => h.location === destination).length, destination);
    const nearbyHotspots = hotspots.filter((h) => h.location === origin || h.location === destination);
    return { originRisk, destRisk, originIncidents: originIncidents.length, destIncidents: destIncidents.length, nearbyHotspots };
  }, [filteredIncidents, hotspots, origin, destination]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorState message={error} />;

  const categories = ['Theft', 'Assault', 'Burglary', 'Robbery', 'Fraud', 'Vandalism', 'Drug-related', 'Vehicle Crime', 'Cybercrime', 'Other'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Predictive Analytics</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Input form */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white uppercase mb-4">Prediction Inputs</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Location</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="input-field text-sm">
                <option value="">All locations</option>
                {locations.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" /> Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Clock className="w-3 h-3" /> Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Tag className="w-3 h-3" /> Crime Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-sm">
                <option value="">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Prediction result */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-white uppercase mb-4">Predicted Risk</h3>
          {!prediction ? (
            <EmptyState title="Select inputs to predict" message="Choose a location, date, time, or category to generate a risk prediction" icon={Brain} />
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <RiskGauge score={prediction.score} level={prediction.level} size={200} />
              <div className="flex-1 w-full">
                <div className="mb-4">
                  <p className="text-xs text-slate-500">Confidence Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full">
                      <div className="h-2 bg-cyan-400 rounded-full" style={{ width: `${prediction.confidence}%` }} />
                    </div>
                    <span className="text-xs text-white font-semibold">{prediction.confidence}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-2">Main Factors</p>
                  <div className="space-y-2">
                    {prediction.factors.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">
            Predictions are analytical estimates based on historical patterns and should not be treated as guaranteed outcomes.
            This system performs aggregate geographic/time-based analysis and does not predict individual criminal behavior or use protected characteristics.
          </div>
        </div>
      </div>

      {/* Safety Intelligence */}
      <div className="glass-card p-5">
        <button onClick={() => setShowSafety(!showSafety)} className="flex items-center gap-2 text-sm font-semibold text-white w-full">
          <Route className="w-4 h-4 text-cyan-400" />
          Safety Intelligence — Route Area Analysis
          <span className="ml-auto text-xs text-slate-500">{showSafety ? 'Hide' : 'Show'}</span>
        </button>
        {showSafety && (
          <div className="mt-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Origin Area</label>
                <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="input-field text-sm">
                  <option value="">Select origin</option>
                  {locations.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Destination Area</label>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className="input-field text-sm">
                  <option value="">Select destination</option>
                  {locations.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
              </div>
            </div>

            {safetyInfo && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <p className="text-xs text-slate-500 uppercase mb-2">Origin: {origin}</p>
                  <RiskGauge score={safetyInfo.originRisk.score} level={safetyInfo.originRisk.level} size={160} />
                  <p className="text-xs text-slate-400 mt-2">{safetyInfo.originIncidents} historical incidents</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-slate-500 uppercase mb-2">Destination: {destination}</p>
                  <RiskGauge score={safetyInfo.destRisk.score} level={safetyInfo.destRisk.level} size={160} />
                  <p className="text-xs text-slate-400 mt-2">{safetyInfo.destIncidents} historical incidents</p>
                </div>
              </div>
            )}

            {safetyInfo && safetyInfo.nearbyHotspots.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase mb-2">Nearby Hotspots (Historical)</p>
                <div className="space-y-2">
                  {safetyInfo.nearbyHotspots.map((hs) => (
                    <div key={hs.id} className="flex items-center justify-between p-3 bg-slate-800/20 rounded border border-cyan-500/5">
                      <div>
                        <p className="text-xs text-white">{hs.name}</p>
                        <p className="text-[10px] text-slate-500">{hs.incident_count} incidents • {hs.dominant_crime}</p>
                      </div>
                      <span className="text-xs font-bold" style={{ color: hs.risk_level === 'CRITICAL' ? '#ef4444' : hs.risk_level === 'HIGH' ? '#fb923c' : '#fbbf24' }}>
                        {hs.risk_level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">
              HISTORICAL RISK INDICATOR — This analysis shows historical crime-risk patterns around selected areas.
              This does not claim any route is guaranteed safe. All data is from the synthetic demo dataset.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
