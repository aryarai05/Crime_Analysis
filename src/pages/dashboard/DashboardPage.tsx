import { useMemo, useState } from 'react';
import {
  Activity, Calendar, AlertTriangle, Flame, TrendingUp, Shield,
  Clock, MapPin, PieChart, BarChart3, Lightbulb,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { FilterBar } from '@/components/ui/FilterBar';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { useIncidentData } from '@/lib/useIncidentData';
import {
  computeKPIs, computeTrend, computeCategoryDistribution,
  computeSeverityDistribution, computeDayOfWeek, computeHourlyDistribution,
  computeTopLocations, generateInsights,
} from '@/lib/analytics';
import { SEVERITY_COLORS } from '@/lib/types';

const CATEGORY_COLORS = [
  '#22d3ee', '#3b82f6', '#06b6d4', '#fbbf24', '#fb923c',
  '#ef4444', '#a78bfa', '#22c55e', '#ec4899', '#64748b',
];

export function DashboardPage() {
  const { filteredIncidents, hotspots, loading, error } = useIncidentData();
  const [trendGranularity, setTrendGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const kpis = useMemo(() => computeKPIs(filteredIncidents, hotspots.length), [filteredIncidents, hotspots.length]);
  const trendData = useMemo(() => computeTrend(filteredIncidents, trendGranularity), [filteredIncidents, trendGranularity]);
  const categoryData = useMemo(() => computeCategoryDistribution(filteredIncidents), [filteredIncidents]);
  const severityData = useMemo(() => computeSeverityDistribution(filteredIncidents), [filteredIncidents]);
  const dayData = useMemo(() => computeDayOfWeek(filteredIncidents), [filteredIncidents]);
  const hourlyData = useMemo(() => computeHourlyDistribution(filteredIncidents), [filteredIncidents]);
  const topLocations = useMemo(() => computeTopLocations(filteredIncidents, 10), [filteredIncidents]);
  const insights = useMemo(() => generateInsights(filteredIncidents), [filteredIncidents]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <FilterBar />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Incidents" value={kpis.totalIncidents} icon={Activity} color="cyan" change={kpis.totalChange} changeLabel="vs previous period" />
        <KpiCard label="This Month" value={kpis.incidentsThisMonth} icon={Calendar} color="blue" change={kpis.monthChange} changeLabel="vs last month" />
        <KpiCard label="High Severity" value={kpis.highSeverity} icon={AlertTriangle} color="red" change={kpis.highSeverityChange} changeLabel="vs previous period" />
        <KpiCard label="Active Hotspots" value={kpis.activeHotspots} icon={Flame} color="amber" />
        <KpiCard label="Crime Rate" value={kpis.crimeRate} icon={TrendingUp} color="cyan" suffix=" /100" />
        <KpiCard label="Risk Index" value={kpis.riskIndex} icon={Shield} color={kpis.riskIndex > 60 ? 'red' : kpis.riskIndex > 40 ? 'amber' : 'green'} suffix=" /100" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard
          title="Crime Trend"
          subtitle="Incidents over time"
          className="lg:col-span-2"
          action={
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setTrendGranularity(g)}
                  className={`text-[10px] px-2 py-1 rounded ${
                    trendGranularity === g
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} fill="url(#trendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crime Categories" subtitle="Distribution by type">
          <ResponsiveContainer width="100%" height={280}>
            <RePieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </RePieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Severity Distribution" subtitle="By severity level">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crime By Day" subtitle="Monday to Sunday">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crime By Hour" subtitle="00:00 - 23:00">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#fbbf24" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Locations + Insights */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Top 10 Locations" subtitle="By incident count">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topLocations} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="location" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Automated Insights" subtitle="Generated from current data">
          <div className="space-y-3">
            {insights.length === 0 ? (
              <EmptyState title="No insights" message="Not enough data to generate insights" />
            ) : (
              insights.map((ins, i) => {
                const iconMap: Record<string, typeof TrendingUp> = {
                  TrendingUp, PieChart, MapPin, AlertTriangle, Clock, BarChart3,
                };
                const Icon = iconMap[ins.icon] || Lightbulb;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/20 border border-cyan-500/5">
                    <div className="p-2 bg-cyan-500/10 rounded-lg flex-shrink-0">
                      <Icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white mb-0.5">{ins.title}</p>
                      <p className="text-xs text-slate-400">{ins.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
