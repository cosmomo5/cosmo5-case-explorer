// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { matchesFilter, createFilterState } from '../data/filter';
import type { FilterState } from '../data/filter';
import type { EnrichedCaseStudy } from '../data/enrich';
import { ProofType } from '../data/proof-type';

// FilterState will gain a searchText?: string field in Plan 02.
// These tests use (fs as any).searchText to forward-reference that extension
// without changing the current FilterState type.

const mockCase: EnrichedCaseStudy = {
  id: 'mock-1',
  client: 'Acme Corp',
  title: 'Growth Campaign',
  challenge: 'Low retention',
  approach: 'Email automation',
  countries: ['Germany'],
  region: 'Europe',
  services: ['Email Marketing'],
  year: 2025,
  permission: true,
  metrics: [],
  proofType: ProofType.Revenue,
  impactScale: { value: 0.6, band: 'significant', maxPct: 150 },
};

// Helper: create a FilterState with optional searchText set
function withSearchText(text: string | undefined): FilterState & { searchText?: string } {
  const fs = createFilterState() as FilterState & { searchText?: string };
  fs.searchText = text;
  return fs;
}

// NOTE: matchesFilter will be extended in Plan 02 to handle the searchText field.
// Tests that require Plan 02's implementation are marked .skip — they will be
// unskipped when Plan 02 extends matchesFilter to handle searchText.
// The "without searchText" test passes now and must continue to pass after Plan 02.

describe('matchesFilter — searchText extension (Plan 02)', () => {
  it('matchesFilter with searchText matching client returns true', () => {
    const fs = withSearchText('acme');
    expect(matchesFilter(mockCase, fs)).toBe(true);
  });

  it('matchesFilter with searchText matching title returns true', () => {
    const fs = withSearchText('growth');
    expect(matchesFilter(mockCase, fs)).toBe(true);
  });

  it('matchesFilter with searchText matching challenge returns true', () => {
    const fs = withSearchText('retention');
    expect(matchesFilter(mockCase, fs)).toBe(true);
  });

  it('matchesFilter with searchText matching approach returns true', () => {
    const fs = withSearchText('email automation');
    expect(matchesFilter(mockCase, fs)).toBe(true);
  });

  it('matchesFilter with searchText not matching anything returns false', () => {
    const fs = withSearchText('xyz123');
    expect(matchesFilter(mockCase, fs)).toBe(false);
  });

  it('matchesFilter without searchText behaves as before (all match when empty)', () => {
    const fs = createFilterState();
    expect(matchesFilter(mockCase, fs)).toBe(true);
  });

  it('searchText matching is case-insensitive', () => {
    const fs = withSearchText('ACME');
    expect(matchesFilter(mockCase, fs)).toBe(true);
  });
});
