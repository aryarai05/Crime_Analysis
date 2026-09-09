import { useState, useMemo, useEffect } from 'react';
import {
  Search, Download, Eye, ChevronUp, ChevronDown, Table as TableIcon,
} from 'lucide-react';
import { fetchIncidents } from '@/lib/queries';
import { useFilters } from '@/lib/filterContext';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badges';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Misc';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import type { CrimeIncident } from '@/lib/types';

type SortField = 'date' | 'crime_type' | 'severity' | 'location' | 'status' | 'incident_id';
type SortDir = 'asc' | 'desc';

const COLUMNS = [
  { key: 'incident_id', label: 'Incident ID', visible: true },
  { key: 'date', label: 'Date', visible: true },
  { key: 'time', label: 'Time', visible: true },
  { key: 'crime_type', label: 'Crime Type', visible: true },
  { key: 'category', label: 'Category', visible: true },
  { key: 'severity', label: 'Severity', visible: true },
  { key: 'location', label: 'Location', visible: true },
  { key: 'latitude', label: 'Latitude', visible: false },
  { key: 'longitude', label: 'Longitude', visible: false },
  { key: 'status', label: 'Status', visible: true },
] as const;

export function CrimeExplorerPage() {
  const { filters } = useFilters();
  const { showToast } = useToast();
  const [data, setData] = useState<CrimeIncident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    Object.fromEntries(COLUMNS.map((c) => [c.key, c.visible]))
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const [selected, setSelected] = useState<CrimeIncident | null>(null);
  const pageSize = 50;

  useEffect(() => {
    setPage(0);
  }, [search, filters.dateRangeStart, filters.dateRangeEnd, filters.crimeType, filters.severity, filters.location]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, total } = await fetchIncidents(page, {
          dateRangeStart: filters.dateRangeStart,
          dateRangeEnd: filters.dateRangeEnd,
          crimeType: filters.crimeType,
          category: filters.category,
          severity: filters.severity,
          location: filters.location,
          search: search || null,
        });
        if (cancelled) return;
        setData(data);
        setTotal(total);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, search, filters.dateRangeStart, filters.dateRangeEnd, filters.crimeType, filters.category, filters.severity, filters.location]);

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      if (sortField === 'severity') {
        const sevMap = { Low: 1, Medium: 2, High: 3, Critical: 4 };
        aVal = sevMap[a.severity as keyof typeof sevMap];
        bVal = sevMap[b.severity as keyof typeof sevMap];
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const exportCSV = () => {
    const headers = COLUMNS.filter((c) => visibleCols[c.key]).map((c) => c.label);
    const rows = sortedData.map((inc) =>
      COLUMNS.filter((c) => visibleCols[c.key]).map((c) => inc[c.key as keyof CrimeIncident] ?? '')
    );
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crimewatch_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully', 'success');
  };

  const exportExcel = () => {
    import('xlsx').then((XLSX) => {
      const headers = COLUMNS.filter((c) => visibleCols[c.key]).map((c) => c.key);
      const rows = sortedData.map((inc) => {
        const row: Record<string, unknown> = {};
        headers.forEach((h) => { row[h] = inc[h as keyof CrimeIncident]; });
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Incidents');
      XLSX.writeFile(wb, `crimewatch_export_${Date.now()}.xlsx`);
      showToast('Excel exported successfully', 'success');
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incidents..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <TableIcon className="w-3 h-3" /> Columns
            </button>
            {showColMenu && (
              <div className="absolute top-full right-0 mt-1 glass-panel p-2 z-50 w-40">
                {COLUMNS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 text-xs text-slate-300 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols[c.key]}
                      onChange={(e) => setVisibleCols({ ...visibleCols, [c.key]: e.target.checked })}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button onClick={exportCSV} className="btn-secondary text-xs flex items-center gap-1">
            <Download className="w-3 h-3" /> CSV
          </button>
          <button onClick={exportExcel} className="btn-secondary text-xs flex items-center gap-1">
            <Download className="w-3 h-3" /> Excel
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-500">{total.toLocaleString()} total incidents</div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : error ? (
        <ErrorState message={error} />
      ) : sortedData.length === 0 ? (
        <EmptyState title="No incidents found" message="Try adjusting your filters or search query" />
      ) : (
        <>
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {COLUMNS.filter((c) => visibleCols[c.key]).map((c) => (
                    <th
                      key={c.key}
                      onClick={() => c.key !== 'latitude' && c.key !== 'longitude' && c.key !== 'time' && c.key !== 'category' && handleSort(c.key as SortField)}
                      className="px-3 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {c.label}
                        {sortField === c.key && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelected(inc)}
                    className="border-b border-cyan-500/5 hover:bg-cyan-500/5 cursor-pointer transition-colors"
                  >
                    {COLUMNS.filter((c) => visibleCols[c.key]).map((c) => (
                      <td key={c.key} className="px-3 py-2.5 text-slate-300 whitespace-nowrap">
                        {c.key === 'severity' ? <SeverityBadge severity={inc.severity} /> :
                         c.key === 'status' ? <StatusBadge status={inc.status} /> :
                         inc[c.key as keyof CrimeIncident]?.toString()}
                      </td>
                    ))}
                    <td className="px-3 py-2.5">
                      <Eye className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Incident Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <SeverityBadge severity={selected.severity} />
              <StatusBadge status={selected.status} />
              <span className="text-xs text-slate-500">{selected.incident_id}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Date', selected.date],
                ['Time', selected.time || 'N/A'],
                ['Crime Type', selected.crime_type],
                ['Category', selected.category],
                ['Location', selected.location],
                ['Latitude', selected.latitude.toString()],
                ['Longitude', selected.longitude.toString()],
                ['Status', selected.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] text-slate-500 uppercase">{label}</p>
                  <p className="text-sm text-white">{value}</p>
                </div>
              ))}
            </div>
            {selected.is_synthetic && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">
                This is a synthetic demo record, not real-world data.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
