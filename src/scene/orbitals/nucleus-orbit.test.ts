import { describe, it, expect } from 'vitest';
import { computeNucleusOrbits, nucleusPositionAt } from './nucleus-orbit';
import type { CaseStudy } from '../../data/types';

const cases: CaseStudy[] = [
  { id: 'A', client: 'X', year: 2026, services: ['Video Ads'], countries: ['Spain'], region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: '' },
  { id: 'B', client: 'Y', year: 2025, services: ['SEA'], countries: ['France'], region: 'Europe', permission: false, title: '', challenge: '', approach: '', metrics: '' },
];
const groups = { 'Media': [cases[0]], 'Performance': [cases[1]] };

describe('computeNucleusOrbits', () => {
  it('produces one NucleusOrbit per group key', () => {
    const orbits = computeNucleusOrbits(groups);
    expect(Object.keys(orbits)).toHaveLength(2);
    expect(orbits['Media']).toBeDefined();
    expect(orbits['Performance']).toBeDefined();
  });
  it('each nucleus orbit speed is in outer range', () => {
    const orbits = computeNucleusOrbits(groups);
    for (const key of Object.keys(orbits)) {
      const speed = Math.abs(orbits[key].speed);
      expect(speed).toBeGreaterThanOrEqual(0.00002);
      expect(speed).toBeLessThanOrEqual(0.00008);
    }
  });
  it('is deterministic', () => {
    const a = computeNucleusOrbits(groups);
    const b = computeNucleusOrbits(groups);
    expect(a['Media'].phase).toBe(b['Media'].phase);
    expect(a['Media'].orbitR).toBe(b['Media'].orbitR);
  });
  it('u and v are orthogonal', () => {
    const orbits = computeNucleusOrbits(groups);
    const o = orbits['Media'];
    const dot = o.orbitU.x*o.orbitV.x + o.orbitU.y*o.orbitV.y + o.orbitU.z*o.orbitV.z;
    expect(Math.abs(dot)).toBeLessThan(0.001);
  });
});

describe('nucleusPositionAt', () => {
  it('returns position on orbit at t=0', () => {
    const orbits = computeNucleusOrbits(groups);
    const o = orbits['Media'];
    const pos = nucleusPositionAt(o, 0);
    const expectedX = o.orbitR * (o.orbitU.x * Math.cos(o.phase) + o.orbitV.x * Math.sin(o.phase));
    expect(pos.x).toBeCloseTo(expectedX, 5);
  });
});
