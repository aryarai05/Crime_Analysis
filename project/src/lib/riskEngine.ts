import type { CrimeIncident, RiskLevel } from './types';
import { SEVERITY_VALUES, riskLevelFromScore } from './types';

export interface RiskComponent {
  name: string;
  weight: number;
  rawValue: number;
  normalized: number;
  contribution: number;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  trend: 'increasing' | 'decreasing' | 'stable';
  components: RiskComponent[];
  contributors: string[];
}

const WEIGHTS = {
  frequency: 0.25,
  severity: 0.20,
  recency: 0.20,
  hotspot: 0.15,
  temporal: 0.10,
  trend: 0.10,
};

const MAX_INCIDENTS_REF = 5000;

export function computeRiskScore(
  incidents: CrimeIncident[],
  hotspotCount: number,
  location: string
): RiskResult {
  if (incidents.length === 0) {
    return {
      score: 0,
      level: 'VERY LOW',
      trend: 'stable',
      components: [],
      contributors: ['No incidents recorded in the selected period'],
    };
  }

  const total = incidents.length;
  const now = new Date();

  // Frequency component
  const freqRaw = total;
  const freqNorm = Math.min(freqRaw / MAX_INCIDENTS_REF, 1);
  const freqContrib = freqNorm * WEIGHTS.frequency * 100;

  // Severity component
  const avgSeverity = incidents.reduce((s, i) => s + SEVERITY_VALUES[i.severity], 0) / total;
  const sevNorm = avgSeverity / 4;
  const sevContrib = sevNorm * WEIGHTS.severity * 100;

  // Recency component
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = incidents.filter((i) => new Date(i.date) >= thirtyDaysAgo).length;
  const recencyRaw = recentCount;
  const recencyNorm = Math.min(recencyRaw / 500, 1);
  const recencyContrib = recencyNorm * WEIGHTS.recency * 100;

  // Hotspot density component
  const hotspotRaw = hotspotCount;
  const hotspotNorm = Math.min(hotspotRaw / 10, 1);
  const hotspotContrib = hotspotNorm * WEIGHTS.hotspot * 100;

  // Temporal component (nighttime activity)
  const nightCount = incidents.filter((i) => {
    if (!i.time) return false;
    const h = parseInt(i.time.substring(0, 2));
    return h >= 20 || h < 4;
  }).length;
  const temporalRaw = nightCount / total;
  const temporalNorm = temporalRaw;
  const temporalContrib = temporalNorm * WEIGHTS.temporal * 100;

  // Trend component
  const monthlyMap = new Map<string, number>();
  for (const inc of incidents) {
    const key = inc.date.substring(0, 7);
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }
  const months = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let trendNorm = 0.5;
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (months.length >= 2) {
    const recent = months.slice(-3);
    const earlier = months.slice(-6, -3);
    const recentAvg = recent.reduce((s, m) => s + m[1], 0) / Math.max(recent.length, 1);
    const earlierAvg = earlier.length > 0 ? earlier.reduce((s, m) => s + m[1], 0) / earlier.length : recentAvg;
    if (recentAvg > earlierAvg * 1.1) {
      trend = 'increasing';
      trendNorm = Math.min(0.7 + (recentAvg / (earlierAvg || 1) - 1) * 0.3, 1);
    } else if (recentAvg < earlierAvg * 0.9) {
      trend = 'decreasing';
      trendNorm = Math.max(0.3 - (1 - recentAvg / (earlierAvg || 1)) * 0.2, 0);
    } else {
      trendNorm = 0.5;
    }
  }
  const trendContrib = trendNorm * WEIGHTS.trend * 100;

  const score = Math.round(
    freqContrib + sevContrib + recencyContrib + hotspotContrib + temporalContrib + trendContrib
  );

  const components: RiskComponent[] = [
    { name: 'Crime Frequency', weight: WEIGHTS.frequency, rawValue: freqRaw, normalized: freqNorm, contribution: freqContrib },
    { name: 'Crime Severity', weight: WEIGHTS.severity, rawValue: avgSeverity, normalized: sevNorm, contribution: sevContrib },
    { name: 'Recent Activity', weight: WEIGHTS.recency, rawValue: recencyRaw, normalized: recencyNorm, contribution: recencyContrib },
    { name: 'Hotspot Density', weight: WEIGHTS.hotspot, rawValue: hotspotRaw, normalized: hotspotNorm, contribution: hotspotContrib },
    { name: 'Nighttime Activity', weight: WEIGHTS.temporal, rawValue: temporalRaw, normalized: temporalNorm, contribution: temporalContrib },
    { name: 'Crime Trend', weight: WEIGHTS.trend, rawValue: trendNorm, normalized: trendNorm, contribution: trendContrib },
  ];

  const contributors: string[] = [];
  const sortedComponents = [...components].sort((a, b) => b.contribution - a.contribution);
  for (const c of sortedComponents.slice(0, 3)) {
    if (c.contribution > 5) {
      if (c.name === 'Crime Frequency' && c.normalized > 0.5) {
        contributors.push(`High crime frequency (${c.rawValue} incidents)`);
      } else if (c.name === 'Crime Severity' && c.normalized > 0.5) {
        contributors.push(`Elevated severity levels (avg ${c.rawValue.toFixed(2)}/4)`);
      } else if (c.name === 'Recent Activity' && c.normalized > 0.4) {
        contributors.push(`Increasing recent activity (${c.rawValue} incidents in last 30 days)`);
      } else if (c.name === 'Hotspot Density' && c.normalized > 0.5) {
        contributors.push(`High hotspot density (${c.rawValue} active hotspots)`);
      } else if (c.name === 'Nighttime Activity' && c.normalized > 0.3) {
        contributors.push(`High nighttime activity (${(c.rawValue * 100).toFixed(0)}% of incidents)`);
      } else if (c.name === 'Crime Trend' && trend === 'increasing') {
        contributors.push('Increasing crime trend over recent months');
      }
    }
  }
  if (contributors.length === 0) {
    contributors.push('Low overall risk factors across all components');
  }

  return {
    score: Math.min(score, 100),
    level: riskLevelFromScore(score),
    trend,
    components,
    contributors,
  };
}

export function predictRisk(
  incidents: CrimeIncident[],
  location: string,
  date: string,
  time: string,
  category: string
): RiskResult & { confidence: number; factors: string[] } {
  const locationIncidents = location
    ? incidents.filter((i) => i.location === location)
    : incidents;

  const categoryIncidents = category
    ? locationIncidents.filter((i) => i.category === category)
    : locationIncidents;

  let timeFiltered = categoryIncidents;
  if (time) {
    const hour = parseInt(time.substring(0, 2));
    const similarTime = categoryIncidents.filter((i) => {
      if (!i.time) return false;
      const incHour = parseInt(i.time.substring(0, 2));
      return Math.abs(incHour - hour) <= 3;
    });
    if (similarTime.length > 0) timeFiltered = similarTime;
  }

  let dateFiltered = timeFiltered;
  if (date) {
    const inputDate = new Date(date);
    const month = inputDate.getMonth();
    const sameMonth = timeFiltered.filter((i) => new Date(i.date).getMonth() === month);
    if (sameMonth.length > 0) dateFiltered = sameMonth;
  }

  const hotspotCount = location
    ? incidents.filter((i) => i.location === location).length / 500
    : 0;

  const baseRisk = computeRiskScore(dateFiltered, Math.round(hotspotCount), location);

  const factors: string[] = [];
  if (time) {
    const hour = parseInt(time.substring(0, 2));
    if (hour >= 20 || hour < 4) {
      factors.push('Nighttime activity pattern');
    }
  }
  if (category && categoryIncidents.length > 0) {
    factors.push(`${category} frequency in selected area (${categoryIncidents.length} historical incidents)`);
  }
  if (location && locationIncidents.length > 500) {
    factors.push(`High historical incident density in ${location}`);
  }
  factors.push(...baseRisk.contributors.slice(0, 2));

  const confidence = Math.min(
    50 + (dateFiltered.length / 100) * 30 + (locationIncidents.length / 1000) * 20,
    95
  );

  return {
    ...baseRisk,
    confidence: Math.round(confidence),
    factors,
  };
}
