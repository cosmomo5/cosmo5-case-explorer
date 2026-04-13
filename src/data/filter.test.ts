import { describe, it, expect } from 'vitest';
import { matchesFilter, getFilterableAttrs, createFilterState } from './filter';
import type { CaseStudy } from './types';
import type { EnrichedCaseStudy } from './enrich';
import { ProofType } from './proof-type';

const c1: CaseStudy = { id: 'A', client: 'X', year: 2026, services: ['Video Ads', 'SEA'], countries: ['Spain', 'France'], region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: [] };
const c2: CaseStudy = { id: 'B', client: 'Y', year: 2025, services: ['Amazon'], countries: ['US'], region: 'Americas', permission: false, title: '', challenge: '', approach: '', metrics: [] };

const e1: EnrichedCaseStudy = { ...c1, proofType: ProofType.Revenue, impactScale: { value: 0.6, band: 'significant', maxPct: 150 } };
const e2: EnrichedCaseStudy = { ...c2, proofType: ProofType.Awareness, impactScale: { value: 0.1, band: 'incremental', maxPct: 10 } };

describe('matchesFilter', () => {
  it('matches all when filter is empty', () => {
    const f = createFilterState();
    expect(matchesFilter(c1, f)).toBe(true);
    expect(matchesFilter(c2, f)).toBe(true);
  });
  it('filters by country (OR within set)', () => {
    const f = createFilterState();
    f.countries.add('Spain');
    expect(matchesFilter(c1, f)).toBe(true);
    expect(matchesFilter(c2, f)).toBe(false);
  });
  it('filters by year', () => {
    const f = createFilterState();
    f.years.add(2026);
    expect(matchesFilter(c1, f)).toBe(true);
    expect(matchesFilter(c2, f)).toBe(false);
  });
  it('filters by service', () => {
    const f = createFilterState();
    f.services.add('Amazon');
    expect(matchesFilter(c1, f)).toBe(false);
    expect(matchesFilter(c2, f)).toBe(true);
  });
  it('ANDs across filter dimensions', () => {
    const f = createFilterState();
    f.countries.add('Spain');
    f.years.add(2025);
    expect(matchesFilter(c1, f)).toBe(false);
  });
  it('isActive returns false when empty', () => {
    expect(createFilterState().isActive()).toBe(false);
  });

  // --- New: proofTypes dimension ---
  it('matchesFilter returns false when proofTypes active and case.proofType does not match', () => {
    const f = createFilterState();
    f.proofTypes.add(ProofType.Revenue);
    expect(matchesFilter(e1, f)).toBe(true);   // Revenue matches
    expect(matchesFilter(e2, f)).toBe(false);  // Awareness does not match
  });

  it('matchesFilter returns true when proofTypes is empty (no filter on dimension)', () => {
    const f = createFilterState();
    expect(matchesFilter(e1, f)).toBe(true);
    expect(matchesFilter(e2, f)).toBe(true);
  });

  // --- New: impactBands dimension ---
  it('matchesFilter returns false when impactBands active and case.impactScale.band does not match', () => {
    const f = createFilterState();
    f.impactBands.add('significant');
    expect(matchesFilter(e1, f)).toBe(true);   // significant matches
    expect(matchesFilter(e2, f)).toBe(false);  // incremental does not match
  });

  // --- New: AND across proofTypes + impactBands ---
  it('matchesFilter with proofTypes AND impactBands: only passes if both match', () => {
    const f = createFilterState();
    f.proofTypes.add(ProofType.Revenue);
    f.impactBands.add('significant');
    expect(matchesFilter(e1, f)).toBe(true);   // Revenue + significant both match
    expect(matchesFilter(e2, f)).toBe(false);  // Awareness fails proofTypes
  });

  // --- New: isActive with new dimensions ---
  it('isActive returns true when proofTypes.size > 0', () => {
    const f = createFilterState();
    f.proofTypes.add(ProofType.Awareness);
    expect(f.isActive()).toBe(true);
  });

  it('isActive returns true when impactBands.size > 0', () => {
    const f = createFilterState();
    f.impactBands.add('notable');
    expect(f.isActive()).toBe(true);
  });

  // --- New: without() method ---
  it("FilterState.without('proofType') clears proofTypes, leaves countries/services/years intact", () => {
    const f = createFilterState();
    f.countries.add('Spain');
    f.services.add('Video Ads');
    f.years.add(2026);
    f.proofTypes.add(ProofType.Revenue);
    const cleared = f.without('proofTypes');
    expect(cleared.proofTypes.size).toBe(0);
    expect(cleared.countries.has('Spain')).toBe(true);
    expect(cleared.services.has('Video Ads')).toBe(true);
    expect(cleared.years.has(2026)).toBe(true);
  });

  it("FilterState.without('countries') clears countries, leaves proofTypes intact", () => {
    const f = createFilterState();
    f.countries.add('Spain');
    f.proofTypes.add(ProofType.Revenue);
    const cleared = f.without('countries');
    expect(cleared.countries.size).toBe(0);
    expect(cleared.proofTypes.has(ProofType.Revenue)).toBe(true);
  });
});

describe('getFilterableAttrs', () => {
  it('returns unique countries from cases', () => {
    const attrs = getFilterableAttrs([c1, c2]);
    expect(attrs.countries).toContain('Spain');
    expect(attrs.countries).toContain('France');
    expect(attrs.countries).toContain('US');
  });
  it('returns unique services from cases', () => {
    const attrs = getFilterableAttrs([c1, c2]);
    expect(attrs.services).toContain('Video Ads');
    expect(attrs.services).toContain('Amazon');
  });
  it('returns unique years sorted', () => {
    const attrs = getFilterableAttrs([c1, c2]);
    expect(attrs.years).toEqual([2025, 2026]);
  });
});
