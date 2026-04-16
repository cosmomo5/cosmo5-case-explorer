import { describe, it, expect } from 'vitest';
import { enrichCases } from './enrich';
import type { CaseStudy } from './types';
import { ProofType } from './proof-type';

describe('enrichCases', () => {
  it('returns empty array for empty input', () => {
    expect(enrichCases([])).toEqual([]);
  });

  it('each output case has proofType field', () => {
    const cases: CaseStudy[] = [{
      id: 'test-1', client: 'Test', year: 2024, services: [], countries: [],
      region: 'EMEA', permission: true, title: 'Test', challenge: '', approach: '',
      metrics: [{ label: 'ROAS', value: '+200%' }],
    }];
    const enriched = enrichCases(cases);
    expect(enriched[0].proofType).toBe(ProofType.Revenue);
  });

  it('each output case has impactScale field with value, band, maxPct', () => {
    const cases: CaseStudy[] = [{
      id: 'test-1', client: 'Test', year: 2024, services: [], countries: [],
      region: 'EMEA', permission: true, title: 'Test', challenge: '', approach: '',
      metrics: [{ label: 'clicks', value: '+50%' }],
    }];
    const enriched = enrichCases(cases);
    expect(enriched[0].impactScale).toHaveProperty('value');
    expect(enriched[0].impactScale).toHaveProperty('band');
    expect(enriched[0].impactScale).toHaveProperty('maxPct');
    expect(enriched[0].impactScale.band).toBe('notable');
  });

  it('EnrichedCaseStudy is assignable to CaseStudy', () => {
    const cases: CaseStudy[] = [{
      id: 'test-1', client: 'Test', year: 2024, services: ['SEO'], countries: ['DE'],
      region: 'EMEA', permission: true, title: 'Test', challenge: 'c', approach: 'a',
      metrics: [{ label: 'CTR', value: '+10%' }],
    }];
    const enriched = enrichCases(cases);
    // Structural assignability: enriched case can be used wherever CaseStudy is expected
    const asCase: CaseStudy = enriched[0];
    expect(asCase.id).toBe('test-1');
  });

  it('original case properties are preserved', () => {
    const cases: CaseStudy[] = [{
      id: 'orig-1', client: 'Acme', year: 2023, services: ['Media', 'Data'],
      countries: ['UK', 'DE'], region: 'EMEA', permission: false,
      title: 'Campaign', challenge: 'ch', approach: 'ap',
      metrics: [{ label: 'Revenue', value: '+300%' }],
    }];
    const enriched = enrichCases(cases);
    expect(enriched[0].id).toBe('orig-1');
    expect(enriched[0].client).toBe('Acme');
    expect(enriched[0].year).toBe(2023);
    expect(enriched[0].services).toEqual(['Media', 'Data']);
    expect(enriched[0].countries).toEqual(['UK', 'DE']);
    expect(enriched[0].permission).toBe(false);
  });

  it('processes sample case with known metrics to expected ProofType', () => {
    const cases: CaseStudy[] = [{
      id: 'known', client: 'Known', year: 2024, services: [], countries: [],
      region: 'EMEA', permission: true, title: 'T', challenge: '', approach: '',
      metrics: [
        { label: 'brand awareness lift', value: '+25%' },
        { label: 'ad recall', value: '+18%' },
        { label: 'CTR', value: '+3%' },
      ],
    }];
    const enriched = enrichCases(cases);
    // 2 Awareness labels vs 1 Engagement → Awareness wins
    expect(enriched[0].proofType).toBe(ProofType.Awareness);
  });
});
