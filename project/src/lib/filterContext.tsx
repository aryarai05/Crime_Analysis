import { createContext, useContext, useState, type ReactNode } from 'react';
import type { FilterState } from './types';
import { EMPTY_FILTERS } from './types';

interface FilterContextValue {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>(EMPTY_FILTERS);

  const setFilters = (newFilters: FilterState) => setFiltersState(newFilters);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFiltersState(EMPTY_FILTERS);

  return (
    <FilterContext.Provider value={{ filters, setFilters, updateFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
