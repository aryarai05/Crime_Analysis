import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/ui/ChartCard';
import { FilterBar } from '@/components/ui/FilterBar';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { useIncidentData } from '@/lib/useIncidentData';
import {
  computeTrend, computeCategoryDistribution, computeSeverityDistribution,
  computeDayOfWeek, computeHourlyDistribution, computeTopLocations,
  generateInsights,
} from '@/lib/analytics';
import { SEVERITY_COLORS } from '@/lib/types';

export function AnalyticsPage() {
  const { filteredIncidents, loading, error } = useIncidentData();
  const [yearlyView, setYearlyView] = useState(true);

  const yearlyTrend = useMemo(() => computeTrend(filteredIncidents, 'yearly'), [filteredIncidents]);
  const monthlyTrend = useMemo(() => computeTrend(filteredIncidents, 'monthly'), [filteredIncidents]);
  const weeklyTrend = useMemo(() => computeTrend(filteredIncidents, 'weekly'), [filteredIncidents]);
  const hourlyTrend = useMemo(() => computeHourlyDistribution(filteredIncidents), [filteredIncidents]);
  const categoryData = useMemo(() => computeCategoryDistribution(filteredIncidents), [filteredIncidents]);
  const severityData = useMemo(() => computeSeverityDistribution(filteredIncidents), [filteredIncidents]);
  const dayData = useMemo(() => computeDayOfWeek(filteredIncidents), [filteredIncidents]);
  const topLocs = useMemo(() => computeTopLocations(filteredIncidents, 10), [filteredIncidents]);
  const bottomLocs = useMemo(() => [...computeTopLocations(filteredIncidents, 100)].reverse().slice(0, 5), [filteredIncidents]);
  const insights = useMemo(() => generateInsights(filteredIncidents), [filteredIncidents]);

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

  const radarData = severityData.map((s) => ({ severity: s.name, count: s.count }));

  return (
    <div className="space-y-4">
      <FilterBar />

      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold text-white">Analytics Workspace</h2>
      </div>

      {/* Insights */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-white uppercase mb-3">Automated Insights</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((ins, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-800/20 border border-cyan-500/5">
              <p className="text-xs font-semibold text-cyan-400 mb-1">{ins.title}</p>
              <p className="text-xs text-slate-400">{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Temporal Analytics */}
      <div>
        <h3 className="text-sm font-semibold text-white uppercase mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-cyan-400 rounded" /> Temporal Analytics
        </h3>
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Yearly Trend" subtitle="Annual incident counts">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={yearlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Monthly Trend" subtitle="Monthly incident counts">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#monthlyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Hourly Trend" subtitle="24-hour distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#fbbf24" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Day of Week" subtitle="Weekly pattern">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Geographic Analytics */}
      <div>
        <h3 className="text-sm font-semibold text-white uppercase mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-cyan-400 rounded" /> Geographic Analytics
        </h3>
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Highest Crime Locations" subtitle="Top 10 by incident count">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topLocs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="location" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Safest Locations" subtitle="Lowest incident count">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bottomLocs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="location" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Category & Severity Analytics */}
      <div>
        <h3 className="text-sm font-semibold text-white uppercase mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-cyan-400 rounded" /> Category & Severity Analytics
        </h3>
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Category Distribution" subtitle="All crime categories">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Severity Radar" subtitle="Severity distribution radar">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(100,116,139,0.2)" />
                <PolarAngleAxis dataKey="severity" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar dataKey="count" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Comparative Analytics */}
      <div>
        <h3 className="text-sm font-semibold text-white uppercase mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-cyan-400 rounded" /> Comparative Analytics
        </h3>
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Category vs Severity" subtitle="Comparative overview">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Incident Count" />
                <Bar dataKey="percentage" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Percentage %" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Severity Breakdown" subtitle="Radial bars">
            <ResponsiveContainer width="100%" height={280}>
              <RadialBarChart data={severityData} innerRadius="30%" outerRadius="100%">
                <RadialBar dataKey="count" cornerRadius={6} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
