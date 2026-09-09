import { useEffect, useState, useCallback } from 'react';
import { fetchAllIncidentsForAnalytics, fetchHotspots, fetchLocations, fetchCategories } from '@/lib/queries';
import { useFilters } from '@/lib/filterContext';
import { applyFilters } from '@/lib/analytics';
import type { CrimeIncident, Hotspot, LocationInfo, CrimeCategory } from '@/lib/types';

interface DataState {
  allIncidents: CrimeIncident[];
  filteredIncidents: CrimeIncident[];
  hotspots: Hotspot[];
  locations: LocationInfo[];
  categories: CrimeCategory[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useIncidentData(): DataState {
  const { filters } = useFilters();
  const [allIncidents, setAllIncidents] = useState<CrimeIncident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [categories, setCategories] = useState<CrimeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [incidents, hs, locs, cats] = await Promise.all([
          fetchAllIncidentsForAnalytics(),
          fetchHotspots(),
          fetchLocations(),
          fetchCategories(),
        ]);
        if (cancelled) return;
        setAllIncidents(incidents);
        setHotspots(hs);
        setLocations(locs);
        setCategories(cats);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const filteredIncidents = applyFilters(allIncidents, filters);

  return {
    allIncidents,
    filteredIncidents,
    hotspots,
    locations,
    categories,
    loading,
    error,
    reload,
  };
}
