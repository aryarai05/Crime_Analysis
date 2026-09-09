import type { CrimeIncident } from './types';

export interface Cluster {
  id: number;
  hotspotId: string;
  name: string;
  centerLat: number;
  centerLng: number;
  points: { lat: number; lng: number; incident: CrimeIncident }[];
  incidentCount: number;
  dominantCrime: string;
  avgSeverity: number;
  peakTime: string;
  riskScore: number;
  riskLevel: string;
  radius: number;
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const SEVERITY_MAP: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

export function runDBSCAN(
  incidents: CrimeIncident[],
  eps = 0.3,
  minPts = 10
): Cluster[] {
  const points = incidents.map((inc) => ({
    lat: inc.latitude,
    lng: inc.longitude,
    incident: inc,
    visited: false,
    clusterId: -1,
  }));

  let clusterId = 0;

  for (let i = 0; i < points.length; i++) {
    if (points[i].visited) continue;
    points[i].visited = true;
    const neighbors = getNeighbors(points, i, eps);
    if (neighbors.length < minPts) {
      points[i].clusterId = -1;
    } else {
      expandCluster(points, i, neighbors, clusterId, eps, minPts);
      clusterId++;
    }
  }

  const clusters: Cluster[] = [];
  for (let c = 0; c < clusterId; c++) {
    const clusterPoints = points.filter((p) => p.clusterId === c);
    if (clusterPoints.length === 0) continue;

    const centerLat = clusterPoints.reduce((s, p) => s + p.lat, 0) / clusterPoints.length;
    const centerLng = clusterPoints.reduce((s, p) => s + p.lng, 0) / clusterPoints.length;

    const crimeCount = new Map<string, number>();
    const hourCount = new Map<string, number>();
    let severitySum = 0;

    const clusterIncidents = clusterPoints.map((p) => p.incident);
    for (const inc of clusterIncidents) {
      crimeCount.set(inc.crime_type, (crimeCount.get(inc.crime_type) || 0) + 1);
      if (inc.time) {
        const h = inc.time.substring(0, 2);
        hourCount.set(h, (hourCount.get(h) || 0) + 1);
      }
      severitySum += SEVERITY_MAP[inc.severity] || 2;
    }

    const dominantCrime =
      Array.from(crimeCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    const avgSeverity = severitySum / clusterIncidents.length;
    const peakHour =
      Array.from(hourCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '20';

    const maxDist = Math.max(
      ...clusterPoints.map((p) => haversineDistance(centerLat, centerLng, p.lat, p.lng))
    );
    const radius = Math.max(maxDist, 0.1);

    const riskScore = Math.min(
      Math.round(
        (clusterIncidents.length / 20) * 0.3 +
          (avgSeverity / 4) * 30 +
          (parseInt(peakHour) >= 20 || parseInt(peakHour) < 4 ? 15 : 5) +
          20
      ),
      100
    );

    const riskLevel =
      riskScore > 80 ? 'CRITICAL'
      : riskScore > 60 ? 'HIGH'
      : riskScore > 40 ? 'MODERATE'
      : riskScore > 20 ? 'LOW'
      : 'VERY LOW';

    const location = clusterIncidents[0]?.location || 'Unknown';

    clusters.push({
      id: c,
      hotspotId: `HS-${String(c + 1).padStart(3, '0')}`,
      name: `${location} Hotspot ${c + 1}`,
      centerLat,
      centerLng,
      points: clusterPoints,
      incidentCount: clusterIncidents.length,
      dominantCrime,
      avgSeverity,
      peakTime: `${peakHour}:00-${String(parseInt(peakHour) + 2).padStart(2, '0')}:00`,
      riskScore,
      riskLevel,
      radius,
    });
  }

  return clusters.sort((a, b) => b.incidentCount - a.incidentCount);
}

function getNeighbors(
  points: { lat: number; lng: number; visited: boolean; clusterId: number }[],
  idx: number,
  eps: number
): number[] {
  const neighbors: number[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i === idx) continue;
    const dist = haversineDistance(
      points[idx].lat,
      points[idx].lng,
      points[i].lat,
      points[i].lng
    );
    if (dist <= eps) neighbors.push(i);
  }
  return neighbors;
}

function expandCluster(
  points: { lat: number; lng: number; visited: boolean; clusterId: number }[],
  idx: number,
  neighbors: number[],
  clusterId: number,
  eps: number,
  minPts: number
): void {
  points[idx].clusterId = clusterId;
  const queue = [...neighbors];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (!points[curr].visited) {
      points[curr].visited = true;
      const currNeighbors = getNeighbors(points, curr, eps);
      if (currNeighbors.length >= minPts) {
        queue.push(...currNeighbors.filter((n) => !queue.includes(n) && n !== idx));
      }
    }
    if (points[curr].clusterId === -1) {
      points[curr].clusterId = clusterId;
    }
  }
}
