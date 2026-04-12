import { describe, it, expect } from 'vitest';
import { groupBy, getKeyForCase, SERVICE_TO_VERTICAL } from './grouping';
import type { CaseStudy } from './types';

const cases: CaseStudy[] = [
  { id: 'A', client: 'X', year: 2026, services: ['Video Ads'], countries: ['Spain'], region: 'Europe', permission: true, title: 'T1', challenge: '', approach: '', metrics: '' },
  { id: 'B', client: 'Y', year: 2025, services: ['SEA'], countries: ['France'], region: 'Europe', permission: false, title: 'T2', challenge: '', approach: '', metrics: '' },
  { id: 'C', client: 'Z', year: 2026, services: ['Amazon'], countries: ['US'], region: 'Americas', permission: true, title: 'T3', challenge: '', approach: '', metrics: '' },
];

describe('groupBy', () => {
  it('groups by vertical', () => {
    const groups = groupBy(cases, 'vertical');
    expect(groups['Media']).toHaveLength(1);
    expect(groups['Performance']).toHaveLength(1);
    expect(groups['Commerce']).toHaveLength(1);
  });
  it('groups by country', () => {
    const groups = groupBy(cases, 'country');
    expect(groups['Spain']).toHaveLength(1);
    expect(groups['France']).toHaveLength(1);
    expect(groups['US']).toHaveLength(1);
  });
  it('groups by region', () => {
    const groups = groupBy(cases, 'region');
    expect(groups['Europe']).toHaveLength(2);
    expect(groups['Americas']).toHaveLength(1);
  });
  it('getKeyForCase returns correct key per mode', () => {
    const c = cases[0]; // services: ['Video Ads'], countries: ['Spain'], region: 'Europe'
    expect(getKeyForCase(c, 'vertical')).toBe('Media');
    expect(getKeyForCase(c, 'country')).toBe('Spain');
    expect(getKeyForCase(c, 'region')).toBe('Europe');
  });
  it('SERVICE_TO_VERTICAL covers all known services', () => {
    const services = ['Video Ads','Social Paid','Programmatic','Media','SEA','Search','SEO','Amazon','Marketplaces','Feed','Commerce','Data','Data Measurement','Business strategy','Consulting','Organization','GEO','Creative','Influence'];
    services.forEach(s => expect(SERVICE_TO_VERTICAL[s]).toBeDefined());
  });
});
