import { describe, it, expect } from 'vitest';
import { deriveImpactScale } from './impact-scale';

describe('deriveImpactScale', () => {
  it('returns unknown for empty metrics', () => {
    expect(deriveImpactScale([])).toEqual({ value: 0, band: 'unknown', maxPct: 0 });
  });

  it('returns unknown for N/A value', () => {
    expect(deriveImpactScale([{ value: 'N/A', label: '' }])).toEqual({ value: 0, band: 'unknown', maxPct: 0 });
  });

  it('parses European comma decimal: +40,87% → notable', () => {
    const result = deriveImpactScale([{ value: '+40,87%', label: '' }]);
    expect(result.band).toBe('notable');
    expect(result.maxPct).toBeCloseTo(40.87);
  });

  it('parses 2x multiplier → 200% → significant', () => {
    const result = deriveImpactScale([{ value: '2x', label: '' }]);
    expect(result.band).toBe('significant');
    expect(result.maxPct).toBe(200);
  });

  it('+15% → incremental (≤20%)', () => {
    const result = deriveImpactScale([{ value: '+15%', label: '' }]);
    expect(result.band).toBe('incremental');
    expect(result.maxPct).toBe(15);
  });

  it('+50% → notable (20-100%)', () => {
    const result = deriveImpactScale([{ value: '+50%', label: '' }]);
    expect(result.band).toBe('notable');
    expect(result.maxPct).toBe(50);
  });

  it('200% → significant (100-300%)', () => {
    const result = deriveImpactScale([{ value: '200%', label: '' }]);
    expect(result.band).toBe('significant');
    expect(result.maxPct).toBe(200);
  });

  it('500% → transformative (>300%)', () => {
    const result = deriveImpactScale([{ value: '500%', label: '' }]);
    expect(result.band).toBe('transformative');
    expect(result.maxPct).toBe(500);
  });

  it('takes MAX across metrics: +10% and +400% → transformative', () => {
    const result = deriveImpactScale([
      { value: '+10%', label: '' },
      { value: '+400%', label: '' },
    ]);
    expect(result.band).toBe('transformative');
    expect(result.maxPct).toBe(400);
  });

  it('absolute numbers without % or x are skipped', () => {
    const result = deriveImpactScale([{ value: '10850', label: '' }]);
    expect(result).toEqual({ value: 0, band: 'unknown', maxPct: 0 });
  });

  it('value is continuous 0-1 within each band', () => {
    // incremental: maxPct=10 → 10/20 * 0.2 = 0.1
    const inc = deriveImpactScale([{ value: '+10%', label: '' }]);
    expect(inc.value).toBeCloseTo(0.1);

    // notable: maxPct=60 → 0.2 + (60-20)/80 * 0.3 = 0.2 + 0.15 = 0.35
    const not = deriveImpactScale([{ value: '+60%', label: '' }]);
    expect(not.value).toBeCloseTo(0.35);

    // significant: maxPct=200 → 0.5 + (200-100)/200 * 0.25 = 0.5 + 0.125 = 0.625
    const sig = deriveImpactScale([{ value: '200%', label: '' }]);
    expect(sig.value).toBeCloseTo(0.625);

    // transformative: maxPct=500 → 0.75 + (500-300)/5000 * 0.25 = 0.75 + 0.01 = 0.76
    const tra = deriveImpactScale([{ value: '500%', label: '' }]);
    expect(tra.value).toBeCloseTo(0.76);
  });
});
