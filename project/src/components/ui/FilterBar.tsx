import { RotateCcw, Filter, Calendar, Tag, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { useFilters } from '@/lib/filterContext';
import { CRIME_CATEGORIES, SEVERITIES } from '@/lib/types';

export function FilterBar() {
  const { filters, updateFilter, resetFilters } = useFilters();

  const locations = [
    'Downtown District',
    'Riverside',
    'Midtown North',
    'Harborfront',
    'Eastgate',
    'Westside Park',
    'Northpoint',
    'Industrial Zone',
  ];

  const hasActiveFilters = Object.values(filters).some((v) => v !== null);

  return (
    <div className="glass-card p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-white uppercase tracking-wider">Global Filters</span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" /> Start Date
          </label>
          <input
            type="date"
            value={filters.dateRangeStart || ''}
            onChange={(e) => updateFilter('dateRangeStart', e.target.value || null)}
            className="input-field text-xs py-1.5"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" /> End Date
          </label>
          <input
            type="date"
            value={filters.dateRangeEnd || ''}
            onChange={(e) => updateFilter('dateRangeEnd', e.target.value || null)}
            className="input-field text-xs py-1.5"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
            <Tag className="w-3 h-3" /> Crime Type
          </label>
          <select
            value={filters.crimeType || ''}
            onChange={(e) => updateFilter('crimeType', e.target.value || null)}
            className="input-field text-xs py-1.5"
          >
            <option value="">All Types</option>
            {CRIME_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3" /> Severity
          </label>
          <select
            value={filters.severity || ''}
            onChange={(e) => updateFilter('severity', (e.target.value || null) as typeof filters.severity)}
            className="input-field text-xs py-1.5"
          >
            <option value="">All Levels</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3" /> Location
          </label>
          <select
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value || null)}
            className="input-field text-xs py-1.5"
          >
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3" /> Time From
          </label>
          <input
            type="time"
            value={filters.timeRangeStart || ''}
            onChange={(e) => updateFilter('timeRangeStart', e.target.value || null)}
            className="input-field text-xs py-1.5"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3" /> Time To
          </label>
          <input
            type="time"
            value={filters.timeRangeEnd || ''}
            onChange={(e) => updateFilter('timeRangeEnd', e.target.value || null)}
            className="input-field text-xs py-1.5"
          />
        </div>
      </div>
    </div>
  );
}
