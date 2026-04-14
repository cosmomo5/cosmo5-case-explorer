import { describe, it, expect } from 'vitest';
import { computePhyllotaxisPositions } from './phyllotaxis';

describe('computePhyllotaxisPositions', () => {
  it('is deterministic — same count returns identical arrays', () => {
    const a = computePhyllotaxisPositions(12);
    const b = computePhyllotaxisPositions(12);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].x).toBeCloseTo(b[i].x, 6);
      expect(a[i].y).toBeCloseTo(b[i].y, 6);
      expect(a[i].z).toBeCloseTo(b[i].z, 6);
    }
  });

  it('center of mass is near origin for count=20', () => {
    const positions = computePhyllotaxisPositions(20);
    const meanX = positions.reduce((s, p) => s + p.x, 0) / positions.length;
    const meanY = positions.reduce((s, p) => s + p.y, 0) / positions.length;
    const meanZ = positions.reduce((s, p) => s + p.z, 0) / positions.length;
    expect(Math.abs(meanX)).toBeLessThan(0.5);
    expect(meanY).toBe(0);
    expect(Math.abs(meanZ)).toBeLessThan(0.5);
  });

  it('minimum pairwise distance > 0.1 for count=10, radius=2.0', () => {
    const positions = computePhyllotaxisPositions(10, { radius: 2.0 });
    let minDist = Infinity;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dz = positions[i].z - positions[j].z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDist) minDist = dist;
      }
    }
    expect(minDist).toBeGreaterThan(0.1);
  });

  it('returns array of correct length', () => {
    const positions = computePhyllotaxisPositions(7);
    expect(positions.length).toBe(7);
  });

  it('all positions have y === 0 (flat XZ plane)', () => {
    const positions = computePhyllotaxisPositions(15);
    for (const p of positions) {
      expect(p.y).toBe(0);
    }
  });
});
