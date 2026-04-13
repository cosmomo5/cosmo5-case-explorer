import { describe, it, expect } from 'vitest';
import { computeChipCounts, FILTER_DIMENSIONS } from './filter-counts';
import { createFilterState } from './filter';
import type { EnrichedCaseStudy } from './enrich';
import { ProofType } from './proof-type';

// Minimal EnrichedCaseStudy fixtures for count tests
const e1: EnrichedCaseStudy = {
  id: 'A', client: 'X', year: 2026,
  services: ['Video Ads', 'SEA'], countries: ['Spain', 'France'],
  region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: [],
  proofType: ProofType.Revenue,
  impactScale: { value: 0.6, band: 'significant', maxPct: 150 },
};

const e2: EnrichedCaseStudy = {
  id: 'B', client: 'Y', year: 2025,
  services: ['Amazon'], countries: ['US'],
  region: 'Americas', permission: false, title: '', challenge: '', approach: '', metrics: [],
  proofType: ProofType.Awareness,
  impactScale: { value: 0.1, band: 'incremental', maxPct: 10 },
};

const e3: EnrichedCaseStudy = {
  id: 'C', client: 'Z', year: 2025,
  services: ['Video Ads'], countries: ['Spain'],
  region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: [],
  proofType: ProofType.Revenue,
  impactScale: { value: 0.3, band: 'notable', maxPct: 60 },
};

describe('FILTER_DIMENSIONS', () => {
  it("contains exactly ['countries', 'services', 'years', 'proofTypes', 'impactBands']", () => {
    expect(FILTER_DIMENSIONS).toEqual(['countries', 'services', 'years', 'proofTypes', 'impactBands']);
  });
});

describe('computeChipCounts', () => {
  it('with no active filter returns all cases counted per value', () => {
    const f = createFilterState();
    const counts = computeChipCounts([e1, e2, e3], f);

    // countries: Spain appears in e1 + e3 = 2, France = 1, US = 1
    const countryCounts = counts.get('countries')!;
    expect(countryCounts.get('Spain')).toBe(2);
    expect(countryCounts.get('France')).toBe(1);
    expect(countryCounts.get('US')).toBe(1);

    // services: 'Video Ads' in e1 + e3 = 2, 'SEA' in e1 = 1, 'Amazon' in e2 = 1
    const serviceCounts = counts.get('services')!;
    expect(serviceCounts.get('Video Ads')).toBe(2);
    expect(serviceCounts.get('SEA')).toBe(1);
    expect(serviceCounts.get('Amazon')).toBe(1);

    // proofTypes: Revenue = 2 (e1+e3), Awareness = 1 (e2)
    const proofCounts = counts.get('proofTypes')!;
    expect(proofCounts.get(ProofType.Revenue)).toBe(2);
    expect(proofCounts.get(ProofType.Awareness)).toBe(1);

    // impactBands: significant=1, incremental=1, notable=1
    const bandCounts = counts.get('impactBands')!;
    expect(bandCounts.get('significant')).toBe(1);
    expect(bandCounts.get('incremental')).toBe(1);
    expect(bandCounts.get('notable')).toBe(1);
  });

  it('with active country filter: counts countries using full set (cross-filter excludes own dim), applies country filter when counting services', () => {
    const f = createFilterState();
    f.countries.add('Spain'); // only e1 and e3 pass country filter

    const counts = computeChipCounts([e1, e2, e3], f);

    // countries dim: cross-filter removes country constraint → all 3 cases counted
    const countryCounts = counts.get('countries')!;
    expect(countryCounts.get('Spain')).toBe(2);
    expect(countryCounts.get('US')).toBe(1);

    // services dim: country filter IS applied → only e1+e3 count (both have Spain)
    const serviceCounts = counts.get('services')!;
    expect(serviceCounts.get('Video Ads')).toBe(2);  // e1 + e3
    expect(serviceCounts.get('SEA')).toBe(1);        // e1 only
    expect(serviceCounts.get('Amazon')).toBeUndefined(); // e2 filtered out by country
  });

  it('returns 0 (or undefined) for values that have no matching cases under cross-filter', () => {
    const f = createFilterState();
    f.proofTypes.add(ProofType.Revenue); // only e1 + e3 pass

    const counts = computeChipCounts([e1, e2, e3], f);

    // services cross-filter: proofType removed → all 3 cases count → Amazon present
    const serviceCountsNoCrossFilter = counts.get('services')!;
    expect(serviceCountsNoCrossFilter.get('Amazon')).toBe(1);

    // impactBands cross-filter: proofType removed → all cases count
    const bandCounts = counts.get('impactBands')!;
    expect(bandCounts.get('incremental')).toBe(1); // e2 included (proofType removed for impactBands count)

    // years cross-filter: proofType removed → all cases count
    const yearCounts = counts.get('years')!;
    expect(yearCounts.get('2025')).toBe(2); // e2 + e3
    expect(yearCounts.get('2026')).toBe(1); // e1
  });

  it('cross-filter: value with 0 matches under other active dims is not present in counts map', () => {
    const f = createFilterState();
    f.countries.add('Spain');
    f.years.add(2026); // only e1 passes both country=Spain AND year=2026

    const counts = computeChipCounts([e1, e2, e3], f);

    // services: apply cross-filter excluding services dim → country=Spain AND year=2026 → only e1
    const serviceCounts = counts.get('services')!;
    expect(serviceCounts.get('Video Ads')).toBe(1); // e1
    expect(serviceCounts.get('SEA')).toBe(1);       // e1
    // Amazon: only in e2 which is filtered by country=Spain → not present
    expect(serviceCounts.has('Amazon')).toBe(false);
  });
});
