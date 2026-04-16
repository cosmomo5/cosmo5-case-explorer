// Stub — implementation created in Plan 02 (Phase 10, query bar).
// This file exists only so Wave 0 test stubs (src/tests/keyword-map.test.ts)
// can resolve the import. Plan 02 will replace this with the real implementation.

import type { FilterState } from './filter';
import type { CaseStudy } from './types';

export interface KeywordHint {
  keyword: string;
  dimension: keyof FilterState;
  value: string | number;
}

export const KEYWORD_HINTS: KeywordHint[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function applyQuery(_query: string, _filterState: FilterState, _cases: CaseStudy[]): void {
  throw new Error('applyQuery: not yet implemented — see Plan 02');
}
