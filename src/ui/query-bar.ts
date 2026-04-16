// Stub — implementation created in Plan 04 (Phase 10, query bar).
// This file exists only so Wave 0 test stubs (src/tests/clusters-count.test.ts,
// src/tests/query-bar.test.ts) can resolve the import. Plan 04 will replace this
// with the real implementation.

import type { FilterState } from '../data/filter';
import type { EnrichedCaseStudy } from '../data/enrich';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function countMatches(_starMeshes: EnrichedCaseStudy[], _filter: FilterState): number {
  throw new Error('countMatches: not yet implemented — see Plan 04');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function countMatchingClusters(
  _nucleusOrbits: Record<string, { cases: EnrichedCaseStudy[] }>,
  _filter: FilterState,
): number {
  throw new Error('countMatchingClusters: not yet implemented — see Plan 04');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mountQueryBar(_container: HTMLElement): void {
  throw new Error('mountQueryBar: not yet implemented — see Plan 04');
}
