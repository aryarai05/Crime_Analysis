import type {
  CrimeIncident,
  FilterState,
  Severity,
} from './types';
import { SEVERITY_VALUES, CRIME_CATEGORIES, SEVERITIES, DAYS_OF_WEEK } from './types';

export function applyFilters(
  incidents: CrimeIncident[],
  filters: FilterState
): CrimeIncident[] {
  return incidents.filter((inc) => {
    if (filters.dateRangeStart && inc.date < filters.dateRangeStart) return false;
    if (filters.dateRangeEnd && inc.date > filters.dateRangeEnd) return false;
    if (filters.year && !inc.date.startsWith(filters.year)) return false;
    if (filters.month && !inc.date.startsWith(filters.month)) return false;
    if (filters.crimeType && inc.crime_type !== filters.crimeType) return false;
    if (filters.category && inc.category !== filters.category) return false;
    if (filters.severity && inc.severity !== filters.severity) return false;
    if (filters.location && inc.location !== filters.location) return false;
    if (filters.timeRangeStart && inc.time && inc.time < filters.timeRangeStart) return false;
    if (filters.timeRangeEnd && inc.time && inc.time > filters.timeRangeEnd) return false;
    return true;
  });
}

export interface KPIData {
  totalIncidents: number;
  incidentsThisMonth: number;
  highSeverity: number;
  activeHotspots: number;
  crimeRate: number;
  riskIndex: number;
  previousTotal: number;
  totalChange: number;
  previousMonth: number;
  monthChange: number;
  previousHighSeverity: number;
  highSeverityChange: number;
}

export function computeKPIs(incidents: CrimeIncident[], hotspotsCount: number): KPIData {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const totalIncidents = incidents.length;
  const incidentsThisMonth = incidents.filter((i) => i.date.startsWith(thisMonth)).length;
  const incidentsLastMonth = incidents.filter((i) => i.date.startsWith(lastMonth)).length;
  const highSeverity = incidents.filter(
    (i) => i.severity === 'High' || i.severity === 'Critical'
  ).length;

  const midPoint = Math.floor(totalIncidents / 2);
  const firstHalf = incidents.slice(0, midPoint);
  const secondHalf = incidents.slice(midPoint);
  const previousTotal = firstHalf.length;
  const totalChange = previousTotal > 0
    ? ((secondHalf.length - previousTotal) / previousTotal) * 100
    : 0;

  const monthChange = incidentsLastMonth > 0
    ? ((incidentsThisMonth - incidentsLastMonth) / incidentsLastMonth) * 100
    : 0;

  const firstHalfHigh = firstHalf.filter(
    (i) => i.severity === 'High' || i.severity === 'Critical'
  ).length;
  const highSeverityChange = firstHalfHigh > 0
    ? ((highSeverity - firstHalfHigh) / firstHalfHigh) * 100
    : 0;

  const avgSeverity =
    totalIncidents > 0
      ? incidents.reduce((sum, i) => sum + SEVERITY_VALUES[i.severity], 0) / totalIncidents
      : 0;
  const crimeRate = totalIncidents > 0 ? (totalIncidents / 100).toFixed(1) : '0';
  const riskIndex = computeRiskIndex(incidents, hotspotsCount);

  return {
    totalIncidents,
    incidentsThisMonth,
    highSeverity,
    activeHotspots: hotspotsCount,
    crimeRate: parseFloat(crimeRate as string),
    riskIndex,
    previousTotal,
    totalChange,
    previousMonth: incidentsLastMonth,
    monthChange,
    previousHighSeverity: firstHalfHigh,
    highSeverityChange,
  };
}

export function computeRiskIndex(incidents: CrimeIncident[], hotspotsCount: number): number {
  if (incidents.length === 0) return 0;
  const total = incidents.length;
  const avgSeverity =
    incidents.reduce((sum, i) => sum + SEVERITY_VALUES[i.severity], 0) / total;

  const recentDate = new Date();
  const thirtyDaysAgo = new Date(recentDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = incidents.filter(
    (i) => new Date(i.date) >= thirtyDaysAgo
  ).length;
  const recencyRatio = recentCount / total;

  const nighttimeCount = incidents.filter((i) => {
    if (!i.time) return false;
    const hour = parseInt(i.time.substring(0, 2));
    return hour >= 20 || hour < 4;
  }).length;
  const nightRatio = nighttimeCount / total;

  const severityComponent = Math.min((avgSeverity / 4) * 30, 30);
  const frequencyComponent = Math.min((total / 10000) * 25, 25);
  const recencyComponent = recencyRatio * 20;
  const hotspotComponent = Math.min((hotspotsCount / 10) * 15, 15);
  const temporalComponent = nightRatio * 10;

  return Math.round(
    severityComponent + frequencyComponent + recencyComponent + hotspotComponent + temporalComponent
  );
}

export interface TrendDataPoint {
  label: string;
  date: string;
  count: number;
}

export function computeTrend(
  incidents: CrimeIncident[],
  granularity: 'daily' | 'weekly' | 'monthly' | 'yearly'
): TrendDataPoint[] {
  const grouped = new Map<string, number>();

  for (const inc of incidents) {
    let key: string;
    const d = new Date(inc.date);
    if (granularity === 'daily') {
      key = inc.date;
    } else if (granularity === 'weekly') {
      const monday = new Date(d);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      monday.setDate(d.getDate() + diff);
      key = monday.toISOString().substring(0, 10);
    } else if (granularity === 'monthly') {
      key = inc.date.substring(0, 7);
    } else {
      key = inc.date.substring(0, 4);
    }
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  const sorted = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return sorted.map(([date, count]) => {
    let label = date;
    if (granularity === 'monthly') {
      const [y, m] = date.split('-');
      label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en', {
        month: 'short',
        year: '2-digit',
      });
    } else if (granularity === 'yearly') {
      label = date;
    } else if (granularity === 'weekly') {
      label = date;
    }
    return { label, date, count };
  });
}

export interface CategoryData {
  name: string;
  count: number;
  percentage: number;
}

export function computeCategoryDistribution(incidents: CrimeIncident[]): CategoryData[] {
  const total = incidents.length || 1;
  return CRIME_CATEGORIES.map((cat) => {
    const count = incidents.filter((i) => i.category === cat).length;
    return {
      name: cat,
      count,
      percentage: (count / total) * 100,
    };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

export interface SeverityData {
  name: Severity;
  count: number;
}

export function computeSeverityDistribution(incidents: CrimeIncident[]): SeverityData[] {
  return SEVERITIES.map((sev) => ({
    name: sev,
    count: incidents.filter((i) => i.severity === sev).length,
  }));
}

export function computeDayOfWeek(incidents: CrimeIncident[]): { day: string; count: number }[] {
  return DAYS_OF_WEEK.map((day) => {
    const dayIndex = DAYS_OF_WEEK.indexOf(day);
    const count = incidents.filter((i) => {
      const d = new Date(i.date);
      let jsDay = d.getDay();
      jsDay = jsDay === 0 ? 6 : jsDay - 1;
      return jsDay === dayIndex;
    }).length;
    return { day: day.substring(0, 3), count };
  });
}

export function computeHourlyDistribution(incidents: CrimeIncident[]): { hour: string; count: number }[] {
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    count: 0,
  }));
  for (const inc of incidents) {
    if (inc.time) {
      const h = parseInt(inc.time.substring(0, 2));
      if (h >= 0 && h < 24) hours[h].count++;
    }
  }
  return hours;
}

export function computeTopLocations(
  incidents: CrimeIncident[],
  limit = 10
): { location: string; count: number }[] {
  const grouped = new Map<string, number>();
  for (const inc of incidents) {
    grouped.set(inc.location, (grouped.get(inc.location) || 0) + 1);
  }
  return Array.from(grouped.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface Insight {
  type: 'trend' | 'category' | 'geographic' | 'severity' | 'time';
  title: string;
  text: string;
  icon: string;
}

export function generateInsights(incidents: CrimeIncident[]): Insight[] {
  const insights: Insight[] = [];
  if (incidents.length === 0) return insights;

  // Trend insight
  const monthlyTrend = computeTrend(incidents, 'monthly');
  if (monthlyTrend.length >= 2) {
    const last3 = monthlyTrend.slice(-3);
    if (last3.length >= 2) {
      const isIncreasing = last3[last3.length - 1].count > last3[0].count;
      const changePct =
        last3[0].count > 0
          ? ((last3[last3.length - 1].count - last3[0].count) / last3[0].count) * 100
          : 0;
      insights.push({
        type: 'trend',
        title: 'Trend Analysis',
        text: isIncreasing
          ? `Crime activity has increased ${Math.abs(changePct).toFixed(1)}% over the last ${last3.length} months.`
          : `Crime activity has decreased ${Math.abs(changePct).toFixed(1)}% over the last ${last3.length} months.`,
        icon: 'TrendingUp',
      });
    }
  }

  // Category insight
  const cats = computeCategoryDistribution(incidents);
  if (cats.length > 0) {
    const top = cats[0];
    insights.push({
      type: 'category',
      title: 'Category Analysis',
      text: `${top.name} accounts for the largest share of incidents (${top.percentage.toFixed(1)}%, ${top.count} incidents).`,
      icon: 'PieChart',
    });
    if (cats.length >= 2) {
      const fastestGrowing = cats[0];
      insights.push({
        type: 'category',
        title: 'Category Growth',
        text: `${fastestGrowing.name} is the most frequent category with ${fastestGrowing.count} recorded incidents.`,
        icon: 'BarChart3',
      });
    }
  }

  // Geographic insight
  const topLocs = computeTopLocations(incidents, 5);
  if (topLocs.length >= 2) {
    const ratio = (topLocs[0].count / topLocs[1].count).toFixed(1);
    insights.push({
      type: 'geographic',
      title: 'Geographic Analysis',
      text: `${topLocs[0].location} has ${ratio}× the incident density of ${topLocs[1].location}.`,
      icon: 'MapPin',
    });
  }

  // Severity insight
  const sevDist = computeSeverityDistribution(incidents);
  const highSev = sevDist.find((s) => s.name === 'High')?.count || 0;
  const criticalSev = sevDist.find((s) => s.name === 'Critical')?.count || 0;
  const highPct = ((highSev + criticalSev) / incidents.length) * 100;
  insights.push({
    type: 'severity',
    title: 'Severity Analysis',
    text: `High and critical severity incidents represent ${highPct.toFixed(1)}% of total recorded incidents.`,
    icon: 'AlertTriangle',
  });

  // Time insight
  const hourly = computeHourlyDistribution(incidents);
  const peakHour = hourly.reduce((max, h) => (h.count > max.count ? h : max), hourly[0]);
  const nightCount = hourly
    .filter((h) => {
      const hr = parseInt(h.hour.substring(0, 2));
      return hr >= 20 || hr < 4;
    })
    .reduce((sum, h) => sum + h.count, 0);
  const nightPct = (nightCount / incidents.length) * 100;
  insights.push({
    type: 'time',
    title: 'Time Analysis',
    text: `Incidents are most frequent around ${peakHour.hour}. Nighttime incidents (20:00–04:00) represent ${nightPct.toFixed(1)}% of total recorded incidents.`,
    icon: 'Clock',
  });

  return insights;
}
