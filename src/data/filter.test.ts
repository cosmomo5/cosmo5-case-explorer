import { describe, it, expect } from 'vitest';
import { matchesFilter, getFilterableAttrs, createFilterState } from './filter';
import type { CaseStudy } from './types';

const c1: CaseStudy = { id: 'A', client: 'X', year: 2026, services: ['Video Ads', 'SEA'], countries: ['Spain', 'France'], region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: '' };
const c2: CaseStudy = { id: 'B', client: 'Y', year: 2025, services: ['Amazon'], countries: ['US'], region: 'Americas', permission: false, title: '', challenge: '', approach: '', metrics: '' };

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
