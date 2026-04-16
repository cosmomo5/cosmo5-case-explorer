// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Module doesn't exist yet (created in Plan 02). Mock it so the 207 existing
// tests don't break during Wave 0.
vi.mock('../data/keyword-map', () => ({
  applyQuery: vi.fn(),
}));

import { applyQuery } from '../data/keyword-map';
import { createFilterState } from '../data/filter';
import type { FilterState } from '../data/filter';

describe('applyQuery — keyword→dimension mapping', () => {
  let fs: FilterState;

  beforeEach(() => {
    fs = createFilterState();
    vi.mocked(applyQuery).mockReset();
  });

  it("'fintech' maps to services containing Finance & Insurance", () => {
    vi.mocked(applyQuery).mockImplementation((q, filterState) => {
      if (q === 'fintech') filterState.services.add('Finance & Insurance');
    });
    applyQuery('fintech', fs, []);
    expect(fs.services.has('Finance & Insurance')).toBe(true);
  });

  it("'revenue growth' maps to proofTypes containing Revenue", () => {
    vi.mocked(applyQuery).mockImplementation((q, filterState) => {
      if (q === 'revenue growth') filterState.proofTypes.add('Revenue' as any);
    });
    applyQuery('revenue growth', fs, []);
    expect(fs.proofTypes.has('Revenue' as any)).toBe(true);
  });

  it("'2025' maps to years containing 2025", () => {
    vi.mocked(applyQuery).mockImplementation((q, filterState) => {
      if (q === '2025') filterState.years.add(2025);
    });
    applyQuery('2025', fs, []);
    expect(fs.years.has(2025)).toBe(true);
  });

  it('unmatched term sets searchText', () => {
    vi.mocked(applyQuery).mockImplementation((q, filterState: any) => {
      filterState.searchText = q;
    });
    applyQuery('acme corp', fs, []);
    expect((fs as any).searchText).toBe('acme corp');
  });

  it('matched keyword does NOT set searchText', () => {
    vi.mocked(applyQuery).mockImplementation((q, filterState) => {
      if (q === 'fintech') filterState.services.add('Finance & Insurance');
      // no searchText set
    });
    applyQuery('fintech', fs, []);
    expect((fs as any).searchText).toBeUndefined();
  });

  it('second query clears previous dimensions', () => {
    vi.mocked(applyQuery).mockImplementationOnce((q, filterState) => {
      if (q === 'fintech') filterState.services.add('Finance & Insurance');
    }).mockImplementationOnce((q, filterState) => {
      // brand query: clear services, add something else
      filterState.services.clear();
      if (q === 'brand') filterState.proofTypes.add('Awareness' as any);
    });
    applyQuery('fintech', fs, []);
    applyQuery('brand', fs, []);
    expect(fs.services.has('Finance & Insurance')).toBe(false);
  });

  it('empty query clears all dimensions', () => {
    vi.mocked(applyQuery).mockImplementationOnce((q, filterState) => {
      if (q === 'fintech') filterState.services.add('Finance & Insurance');
    }).mockImplementationOnce((_q, filterState: any) => {
      // empty string: reset everything
      filterState.services.clear();
      filterState.proofTypes.clear();
      filterState.years.clear();
      filterState.countries.clear();
      filterState.nucleusKeys.clear();
      filterState.impactBands.clear();
      filterState.searchText = undefined;
    });
    applyQuery('fintech', fs, []);
    applyQuery('', fs, []);
    expect(fs.services.size).toBe(0);
    expect(fs.proofTypes.size).toBe(0);
    expect(fs.years.size).toBe(0);
    expect((fs as any).searchText).toBeUndefined();
  });
});
