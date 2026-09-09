export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type RiskLevel = 'VERY LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'Open' | 'Under Investigation' | 'Closed' | 'Arrested';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  theme: 'dark' | 'light';
  notification_prefs: {
    email: boolean;
    in_app: boolean;
    risk_alerts: boolean;
  };
  data_prefs: {
    default_date_range: string;
    synthetic_label: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface CrimeIncident {
  id: number;
  incident_id: string;
  date: string;
  time: string | null;
  crime_type: string;
  category: string;
  severity: Severity;
  location: string;
  latitude: number;
  longitude: number;
  status: IncidentStatus;
  is_synthetic: boolean;
  created_at: string;
}

export interface CrimeCategory {
  id: number;
  name: string;
  description: string | null;
  base_severity: Severity;
  severity_weight: number;
}

export interface LocationInfo {
  id: number;
  name: string;
  district: string | null;
  city: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  population: number | null;
  area_km2: number | null;
}

export interface Hotspot {
  id: number;
  hotspot_id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  incident_count: number;
  dominant_crime: string | null;
  avg_severity: number | null;
  peak_time: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  method: string;
  created_at: string;
}

export interface RiskScore {
  id: number;
  location: string;
  period: string;
  risk_score: number;
  risk_level: RiskLevel;
  trend: 'increasing' | 'decreasing' | 'stable';
  contributors: { factor: string; value: string }[];
  frequency_component: number | null;
  severity_component: number | null;
  recency_component: number | null;
  hotspot_component: number | null;
  temporal_component: number | null;
  trend_component: number | null;
  calculated_at: string;
}

export interface ReportRecord {
  id: string;
  user_id: string;
  title: string;
  report_type: string;
  date_range_start: string | null;
  date_range_end: string | null;
  summary: Record<string, unknown> | null;
  status: 'generated' | 'draft' | 'archived';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  read: boolean;
  created_at: string;
}

export interface FilterState {
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  year: string | null;
  month: string | null;
  crimeType: string | null;
  category: string | null;
  severity: Severity | null;
  location: string | null;
  timeRangeStart: string | null;
  timeRangeEnd: string | null;
}

export const EMPTY_FILTERS: FilterState = {
  dateRangeStart: null,
  dateRangeEnd: null,
  year: null,
  month: null,
  crimeType: null,
  category: null,
  severity: null,
  location: null,
  timeRangeStart: null,
  timeRangeEnd: null,
};

export const SEVERITY_VALUES: Record<Severity, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  Low: '#22d3ee',
  Medium: '#fbbf24',
  High: '#fb923c',
  Critical: '#ef4444',
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  'VERY LOW': '#22c55e',
  'LOW': '#84cc16',
  'MODERATE': '#fbbf24',
  'HIGH': '#fb923c',
  'CRITICAL': '#ef4444',
};

export function riskLevelFromScore(score: number): RiskLevel {
  if (score <= 20) return 'VERY LOW';
  if (score <= 40) return 'LOW';
  if (score <= 60) return 'MODERATE';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

export const CRIME_CATEGORIES = [
  'Theft',
  'Assault',
  'Burglary',
  'Robbery',
  'Fraud',
  'Vandalism',
  'Drug-related',
  'Vehicle Crime',
  'Cybercrime',
  'Other',
] as const;

export const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
