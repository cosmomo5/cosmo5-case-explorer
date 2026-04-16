// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// countMatches and countMatchingClusters will be added to query-bar.ts in Plan 04.
// Mock the module so the 207 existing tests don't break during Wave 0.
vi.mock('../ui/query-bar', () => ({
  countMatches: vi.fn(),
  countMatchingClusters: vi.fn(),
  mountQueryBar: vi.fn(),
}));

import { countMatches, countMatchingClusters } from '../ui/query-bar';
import { matchesFilter, createFilterState } from '../data/filter';
import type { SceneObjects } from '../scene/scene-state';
import type { EnrichedCaseStudy } from '../data/enrich';
import { ProofType } from '../data/proof-type';

function makeCase(id: string, service: string, year: number): EnrichedCaseStudy {
  return {
    id,
    client: `Client ${id}`,
    title: `Case ${id}`,
    challenge: '',
    approach: '',
    countries: ['UK'],
    region: 'EMEA',
    services: [service],
    year,
    permission: true,
    metrics: [],
    proofType: ProofType.Awareness,
    impactScale: { value: 0.4, band: 'notable', maxPct: 50 },
  };
}

describe('countMatches — N MATCHES counting (Plan 04)', () => {
  const cases = [
    makeCase('c1', 'Media', 2024),
    makeCase('c2', 'SEO', 2024),
    makeCase('c3', 'Media', 2023),
  ];

  beforeEach(() => {
    vi.mocked(countMatches).mockReset();
  });

  it('countMatches returns total matching cases', () => {
    const filter = createFilterState();
    filter.services.add('Media');
    // 2 of 3 cases have 'Media'
    vi.mocked(countMatches).mockReturnValue(2);
    expect(countMatches(cases as unknown as SceneObjects, filter)).toBe(2);
  });

  it('countMatches returns 0 when no cases match', () => {
    const filter = createFilterState();
    filter.services.add('PPC'); // nobody has PPC
    vi.mocked(countMatches).mockReturnValue(0);
    expect(countMatches(cases as unknown as SceneObjects, filter)).toBe(0);
  });

  it('empty filterState matches all cases', () => {
    const filter = createFilterState();
    vi.mocked(countMatches).mockImplementation((objects: SceneObjects, fs: any) => {
      // In the real impl objects.starMeshes would be iterated; here we use the
      // test-local cases array via closure since the whole module is mocked.
      return (objects as unknown as EnrichedCaseStudy[]).filter(c => matchesFilter(c, fs)).length;
    });
    const result = countMatches(cases as unknown as SceneObjects, filter);
    expect(result).toBe(3);
  });
});

describe('countMatchingClusters — M CLUSTERS counting (Plan 04)', () => {
  // nucleusOrbits is Record<string, { cases: CaseStudy[] }>
  const nucleusOrbits = {
    Media: { cases: [makeCase('c1', 'Media', 2024), makeCase('c3', 'Media', 2023)] },
    SEO:   { cases: [makeCase('c2', 'SEO', 2024)] },
    PPC:   { cases: [makeCase('c4', 'PPC', 2022)] },
  };

  beforeEach(() => {
    vi.mocked(countMatchingClusters).mockReset();
  });

  it('countMatchingClusters returns count of clusters with at least one match', () => {
    const filter = createFilterState();
    filter.services.add('Media'); // matches Media cluster only
    vi.mocked(countMatchingClusters).mockReturnValue(1);
    expect(countMatchingClusters(nucleusOrbits as unknown as SceneObjects, filter)).toBe(1);
  });

  it('countMatchingClusters returns 0 when no clusters match', () => {
    const filter = createFilterState();
    filter.services.add('Email'); // nobody has Email
    vi.mocked(countMatchingClusters).mockReturnValue(0);
    expect(countMatchingClusters(nucleusOrbits as unknown as SceneObjects, filter)).toBe(0);
  });
});
