import { describe, it, expect } from 'vitest';
import { hash } from './hash';
import { computeStarOrbit } from './star-orbit';
import type { CaseStudy } from '../../data/types';

const c: CaseStudy = { id: 'CASE-001', client: 'X', year: 2026, services: ['SEA'], countries: ['Spain'], region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: [] };
const center = { x: 100, y: 50, z: 30 };

describe('hash', () => {
  it('returns value in [0,1)', () => {
    const h = hash('test');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(1);
  });
  it('is deterministic', () => {
    expect(hash('abc')).toBe(hash('abc'));
  });
  it('returns different values for different strings', () => {
    expect(hash('abc')).not.toBe(hash('xyz'));
  });
});

describe('computeStarOrbit', () => {
  it('produces a StarOrbit with the correct nucleusKey', () => {
    const orbit = computeStarOrbit(c, 'Performance', center, 10, 60);
    expect(orbit.nucleusKey).toBe('Performance');
    expect(orbit.caseStudy.id).toBe('CASE-001');
  });
  it('orbital radius is within [rMin, rMax]', () => {
    const orbit = computeStarOrbit(c, 'Performance', center, 10, 60);
    expect(orbit.r).toBeGreaterThanOrEqual(10);
    expect(orbit.r).toBeLessThanOrEqual(60);
  });
  it('u and v vectors are orthogonal', () => {
    const orbit = computeStarOrbit(c, 'Performance', center, 10, 60);
    const dot = orbit.u.x * orbit.v.x + orbit.u.y * orbit.v.y + orbit.u.z * orbit.v.z;
    expect(Math.abs(dot)).toBeLessThan(0.001);
  });
  it('u is a unit vector', () => {
    const orbit = computeStarOrbit(c, 'Performance', center, 10, 60);
    const len = Math.sqrt(orbit.u.x**2 + orbit.u.y**2 + orbit.u.z**2);
    expect(len).toBeCloseTo(1, 5);
  });
  it('is deterministic — same inputs same output', () => {
    const a = computeStarOrbit(c, 'Performance', center, 10, 60);
    const b = computeStarOrbit(c, 'Performance', center, 10, 60);
    expect(a.r).toBe(b.r);
    expect(a.phase).toBe(b.phase);
    expect(a.speed).toBe(b.speed);
  });
});
