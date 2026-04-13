import type { EnrichedCaseStudy } from './enrich';
import type { FilterDimension, FilterState } from './filter';
import { matchesFilter } from './filter';

/**
 * The five user-facing filter dimensions (nucleusKeys is internal, not user-facing).
 */
export const FILTER_DIMENSIONS: FilterDimension[] = [
  'countries',
  'services',
  'years',
  'proofTypes',
  'impactBands',
];

/**
 * Returns the dimension values for a single case in a given dimension.
 * Multi-value dimensions (countries, services) return an array.
 * Single-value dimensions return a one-element array.
 */
function getDimValues(c: EnrichedCaseStudy, dim: FilterDimension): string[] {
  switch (dim) {
    case 'countries':   return c.countries;
    case 'services':    return c.services;
    case 'years':       return [String(c.year)];
    case 'proofTypes':  return [c.proofType];
    case 'impactBands': return [c.impactScale?.band ?? 'unknown'];
    default:            return [];
  }
}

/**
 * Computes per-value counts for each filter dimension using cross-filter logic:
 * when counting values for dimension D, the filter for D is removed so that all
 * cases that would match the OTHER active dimensions are counted.
 *
 * This drives live chip counts: a chip for "Spain" shows how many cases would
 * match if you added Spain to the current filter (ignoring the current country
 * selection).
 *
 * @param allCases All enriched case studies
 * @param currentFilter The current filter state
 * @returns Map from FilterDimension → Map from value string → count
 */
export function computeChipCounts(
  allCases: EnrichedCaseStudy[],
  currentFilter: FilterState,
): Map<FilterDimension, Map<string, number>> {
  const result = new Map<FilterDimension, Map<string, number>>();

  for (const dim of FILTER_DIMENSIONS) {
    const filterWithoutDim = currentFilter.without(dim);
    const valueCounts = new Map<string, number>();

    for (const c of allCases) {
      if (!matchesFilter(c, filterWithoutDim)) continue;
      for (const value of getDimValues(c, dim)) {
        valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1);
      }
    }

    result.set(dim, valueCounts);
  }

  return result;
}
