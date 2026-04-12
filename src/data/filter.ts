import type { CaseStudy } from './types';

export interface FilterState {
  countries: Set<string>;
  services: Set<string>;
  years: Set<number>;
  nucleusKeys: Set<string>;
  isActive(): boolean;
}

export interface FilterableAttrs {
  countries: string[];
  services: string[];
  years: number[];
}

export function createFilterState(): FilterState {
  return {
    countries: new Set(),
    services: new Set(),
    years: new Set(),
    nucleusKeys: new Set(),
    isActive() {
      return this.countries.size > 0 || this.services.size > 0 ||
             this.years.size > 0 || this.nucleusKeys.size > 0;
    },
  };
}

export function matchesFilter(c: CaseStudy, f: FilterState): boolean {
  if (f.countries.size > 0 && !c.countries.some(co => f.countries.has(co))) return false;
  if (f.services.size > 0 && !c.services.some(s => f.services.has(s))) return false;
  if (f.years.size > 0 && !f.years.has(c.year)) return false;
  return true;
}

export function getFilterableAttrs(cases: CaseStudy[]): FilterableAttrs {
  const countries = [...new Set(cases.flatMap(c => c.countries))].sort();
  const services  = [...new Set(cases.flatMap(c => c.services))].sort();
  const years     = [...new Set(cases.map(c => c.year))].sort((a, b) => a - b);
  return { countries, services, years };
}
