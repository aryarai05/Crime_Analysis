import { supabase } from './supabase';
import type { CrimeIncident, Hotspot, LocationInfo, CrimeCategory, Notification, ReportRecord } from './types';

const INCIDENT_PAGE_SIZE = 50;

export async function fetchIncidents(
  page = 0,
  filters?: {
    dateRangeStart?: string | null;
    dateRangeEnd?: string | null;
    crimeType?: string | null;
    category?: string | null;
    severity?: string | null;
    location?: string | null;
    search?: string | null;
  }
): Promise<{ data: CrimeIncident[]; total: number }> {
  let query = supabase
    .from('crime_incidents')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .range(page * INCIDENT_PAGE_SIZE, (page + 1) * INCIDENT_PAGE_SIZE - 1);

  if (filters?.dateRangeStart) query = query.gte('date', filters.dateRangeStart);
  if (filters?.dateRangeEnd) query = query.lte('date', filters.dateRangeEnd);
  if (filters?.crimeType) query = query.eq('crime_type', filters.crimeType);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.location) query = query.eq('location', filters.location);
  if (filters?.search) {
    query = query.or(
      `incident_id.ilike.%${filters.search}%,crime_type.ilike.%${filters.search}%,location.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data || []) as CrimeIncident[], total: count || 0 };
}

export async function fetchAllIncidentsForAnalytics(): Promise<CrimeIncident[]> {
  const allIncidents: CrimeIncident[] = [];
  const pageSize = 1000;
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from('crime_incidents')
      .select('incident_id,date,time,crime_type,category,severity,location,latitude,longitude,status,is_synthetic')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allIncidents.push(...(data as CrimeIncident[]));
    if (data.length < pageSize) break;
    page++;
  }

  return allIncidents;
}

export async function fetchMapIncidents(
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  limit = 2000
): Promise<CrimeIncident[]> {
  let query = supabase
    .from('crime_incidents')
    .select('incident_id,date,time,crime_type,category,severity,location,latitude,longitude,status')
    .limit(limit);

  if (bounds) {
    query = query
      .gte('latitude', bounds.minLat)
      .lte('latitude', bounds.maxLat)
      .gte('longitude', bounds.minLng)
      .lte('longitude', bounds.maxLng);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as CrimeIncident[];
}

export async function fetchHotspots(): Promise<Hotspot[]> {
  const { data, error } = await supabase.from('hotspots').select('*').order('risk_score', { ascending: false });
  if (error) throw error;
  return (data || []) as Hotspot[];
}

export async function fetchLocations(): Promise<LocationInfo[]> {
  const { data, error } = await supabase.from('locations').select('*').order('name');
  if (error) throw error;
  return (data || []) as LocationInfo[];
}

export async function fetchCategories(): Promise<CrimeCategory[]> {
  const { data, error } = await supabase.from('crime_categories').select('*').order('name');
  if (error) throw error;
  return (data || []) as CrimeCategory[];
}

export async function fetchRiskScores(): Promise<import('./types').RiskScore[]> {
  const { data, error } = await supabase.from('risk_scores').select('*').order('risk_score', { ascending: false });
  if (error) throw error;
  return (data || []) as import('./types').RiskScore[];
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

export async function clearNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'danger' | 'success' = 'info'
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type });
  if (error) throw error;
}

export async function fetchReports(userId: string): Promise<ReportRecord[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ReportRecord[];
}

export async function createReport(
  userId: string,
  title: string,
  reportType: string,
  dateStart: string | null,
  dateEnd: string | null,
  summary: Record<string, unknown>
): Promise<ReportRecord> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      title,
      report_type: reportType,
      date_range_start: dateStart,
      date_range_end: dateEnd,
      summary,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ReportRecord;
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw error;
}

export async function searchIncidents(query: string): Promise<CrimeIncident[]> {
  const { data, error } = await supabase
    .from('crime_incidents')
    .select('*')
    .or(
      `incident_id.ilike.%${query}%,crime_type.ilike.%${query}%,location.ilike.%${query}%,category.ilike.%${query}%`
    )
    .limit(20);
  if (error) throw error;
  return (data || []) as CrimeIncident[];
}

export async function bulkInsertIncidents(
  incidents: Omit<CrimeIncident, 'id' | 'created_at'>[]
): Promise<{ inserted: number; error: string | null }> {
  const { data, error } = await supabase
    .from('crime_incidents')
    .insert(incidents)
    .select('id');
  if (error) return { inserted: 0, error: error.message };
  return { inserted: data?.length || 0, error: null };
}
