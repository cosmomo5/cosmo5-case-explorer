import { describe, it, expect } from 'vitest';
import { classifyProofType, ProofType } from './proof-type';

describe('classifyProofType', () => {
  it('returns Engagement as fallback for empty metrics', () => {
    expect(classifyProofType([])).toBe(ProofType.Engagement);
  });

  it('classifies ROAS as Revenue', () => {
    expect(classifyProofType([{ label: 'ROAS', value: '' }])).toBe(ProofType.Revenue);
  });

  it('classifies conversion rate as Conversion', () => {
    expect(classifyProofType([{ label: 'conversion rate', value: '' }])).toBe(ProofType.Conversion);
  });

  it('classifies brand awareness as Awareness', () => {
    expect(classifyProofType([{ label: 'brand awareness', value: '' }])).toBe(ProofType.Awareness);
  });

  it('classifies CPM as CostEfficiency', () => {
    expect(classifyProofType([{ label: 'CPM', value: '' }])).toBe(ProofType.CostEfficiency);
  });

  it('classifies CTR as Engagement', () => {
    expect(classifyProofType([{ label: 'CTR', value: '' }])).toBe(ProofType.Engagement);
  });

  it('classifies cost per lead as Conversion (priority beats position)', () => {
    // "lead" matches Conversion before "cost per" matches CostEfficiency
    expect(classifyProofType([{ label: 'cost per lead', value: '' }])).toBe(ProofType.Conversion);
  });

  it('classifies CPA (cost per acquisition) as Conversion', () => {
    expect(classifyProofType([{ label: 'cpa (cost per acquisition)', value: '' }])).toBe(ProofType.Conversion);
  });

  it('dominant type wins: 2 Revenue + 1 Conversion → Revenue', () => {
    const metrics = [
      { label: 'ROAS', value: '' },
      { label: 'revenue growth', value: '' },
      { label: 'conversion rate', value: '' },
    ];
    expect(classifyProofType(metrics)).toBe(ProofType.Revenue);
  });

  it('tie: Revenue ties Conversion → Revenue (earlier in priority list wins)', () => {
    const metrics = [
      { label: 'ROAS', value: '' },
      { label: 'conversion rate', value: '' },
    ];
    expect(classifyProofType(metrics)).toBe(ProofType.Revenue);
  });

  it('labels with no keyword match contribute nothing', () => {
    const metrics = [
      { label: 'some unknown metric', value: '' },
      { label: 'another unknown', value: '' },
    ];
    // No matches → Engagement fallback
    expect(classifyProofType(metrics)).toBe(ProofType.Engagement);
  });
});
