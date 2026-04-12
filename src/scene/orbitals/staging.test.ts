import { describe, it, expect } from 'vitest';
import { computeStagingPositions } from './staging';

describe('computeStagingPositions', () => {
  it('returns N positions for N stars', () => {
    const positions = computeStagingPositions(10, 80);
    expect(positions).toHaveLength(10);
  });
  it('first star is near center', () => {
    const positions = computeStagingPositions(5, 80);
    const r = Math.sqrt(positions[0].x**2 + positions[0].y**2 + positions[0].z**2);
    expect(r).toBeLessThan(20);
  });
  it('positions lie on a disk (z component is small)', () => {
    const positions = computeStagingPositions(20, 80);
    for (const p of positions) {
      expect(Math.abs(p.z)).toBeLessThan(5);
    }
  });
  it('radius grows with index', () => {
    const positions = computeStagingPositions(10, 80);
    const r0 = Math.sqrt(positions[0].x**2 + positions[0].y**2);
    const r9 = Math.sqrt(positions[9].x**2 + positions[9].y**2);
    expect(r9).toBeGreaterThan(r0);
  });
});
