import type { CaseStudy } from './types';
import type { ProofType } from './proof-type';
import type { ImpactScaleBand } from './impact-scale';

export type FilterDimension = 'countries' | 'services' | 'years' | 'nucleusKeys' | 'proofTypes' | 'impactBands';

export interface FilterState {
  countries: Set<string>;
  services: Set<string>;
  years: Set<number>;
  nucleusKeys: Set<string>;
  proofTypes: Set<ProofType>;
  impactBands: Set<ImpactScaleBand>;
  isActive(): boolean;
  without(dim: FilterDimension): FilterState;
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
    proofTypes: new Set(),
    impactBands: new Set(),
    isActive() {
      return this.countries.size > 0 || this.services.size > 0 ||
             this.years.size > 0 || this.nucleusKeys.size > 0 ||
             this.proofTypes.size > 0 || this.impactBands.size > 0;
    },
    without(dim: FilterDimension): FilterState {
      const copy = createFilterState();
      copy.countries    = dim === 'countries'   ? new Set() : new Set(this.countries);
      copy.services     = dim === 'services'    ? new Set() : new Set(this.services);
      copy.years        = dim === 'years'       ? new Set() : new Set(this.years);
      copy.nucleusKeys  = dim === 'nucleusKeys' ? new Set() : new Set(this.nucleusKeys);
      copy.proofTypes   = dim === 'proofTypes'  ? new Set() : new Set(this.proofTypes);
      copy.impactBands  = dim === 'impactBands' ? new Set() : new Set(this.impactBands);
      return copy;
    },
  };
}

export function matchesFilter(c: CaseStudy, f: FilterState): boolean {
  if (f.countries.size > 0 && !c.countries.some(co => f.countries.has(co))) return false;
  if (f.services.size > 0 && !c.services.some(s => f.services.has(s))) return false;
  if (f.years.size > 0 && !f.years.has(c.year)) return false;
  // proofType/impactBand only present on EnrichedCaseStudy — guard with 'in' check
  if (f.proofTypes.size > 0) {
    if (!('proofType' in c) || !f.proofTypes.has((c as CaseStudy & { proofType: ProofType }).proofType)) return false;
  }
  if (f.impactBands.size > 0) {
    if (!('impactScale' in c) || !f.impactBands.has((c as CaseStudy & { impactScale: { band: ImpactScaleBand } }).impactScale.band)) return false;
  }
  return true;
}

export function getFilterableAttrs(cases: CaseStudy[]): FilterableAttrs {
  const countries = [...new Set(cases.flatMap(c => c.countries))].sort();
  const services  = [...new Set(cases.flatMap(c => c.services))].sort();
  const years     = [...new Set(cases.map(c => c.year))].sort((a, b) => a - b);
  return { countries, services, years };
}
