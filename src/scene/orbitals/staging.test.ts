// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn((_target: unknown, vars?: Record<string, unknown>) => {
      if (vars?.onComplete) (vars.onComplete as () => void)();
      return { kill: vi.fn() };
    }),
    killTweensOf: vi.fn(),
  },
}));

import { computeStagingPositions } from './staging';
import {
  applyFilter,
  type SceneObjects,
} from '../scene-state';
import type { EnrichedCaseStudy } from '../../data/enrich';
import { ProofType } from '../../data/proof-type';
import { createFilterState } from '../../data/filter';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal EnrichedCaseStudy factory */
function makeCase(id: string, proofType: ProofType = ProofType.Awareness): EnrichedCaseStudy {
  return {
    id,
    title: `Case ${id}`,
    client: 'Acme',
    services: ['Media'],
    countries: ['UK'],
    region: 'EMEA',
    year: 2023,
    permission: true,
    challenge: '',
    approach: '',
    metrics: [],
    proofType,
    impactScale: { value: 0.4, band: 'notable', maxPct: 50 },
  };
}

/** Minimal SceneObjects factory that avoids DOM + renderer */
function makeSceneObjects(cases: EnrichedCaseStudy[]): SceneObjects {
  const scene = new THREE.Scene();
  const nucleusMeshes = new Map<string, THREE.Mesh>();
  const nucleusOrbits: Record<string, import('../../data/types').GroupMode extends unknown ? any : never> = {};

  // Create one nucleus per case to give them nucleusMeshes to orbit around
  const geo = new THREE.SphereGeometry(6, 4, 4);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(200, 0, 0);
  mesh.userData = { key: 'Media', isNucleus: true, homePos: new THREE.Vector3(200, 0, 0) };
  scene.add(mesh);
  nucleusMeshes.set('Media', mesh);
  nucleusOrbits['Media'] = {
    key: 'Media',
    orbitR: 200,
    orbitU: { x: 1, y: 0, z: 0 },
    orbitV: { x: 0, y: 1, z: 0 },
    phase: 0,
    speed: 0,
    cases,
  };

  const starMeshes: THREE.Mesh[] = cases.map((c) => {
    const sGeo = new THREE.SphereGeometry(2.5, 4, 4);
    const sMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    const star = new THREE.Mesh(sGeo, sMat);
    star.position.set(210, 0, 0);
    star.userData = {
      caseStudy: c,
      starOrbit: { nucleusKey: 'Media', orbitCenter: { x: 200, y: 0, z: 0 } },
      isFiltered: false,
      isStagingTarget: false,
    };
    scene.add(star);
    return star;
  });

  return {
    scene,
    nucleusMeshes,
    nucleusLabels: new Map(),
    starMeshes,
    starOrbits: [],
    nucleusOrbits,
    filterState: createFilterState(),
    mode: 'global',
    focusedKey: null,
    groupMode: 'vertical',
    ringLineMeshes: [],
    ringLineValues: [],
    ringLabelEls: [],
    highlightedRingValue: null,
    currentRingDimension: null,
    _ringWasHighlighted: false,
    _stagingDisposalTimeout: undefined,
  };
}

// ── computeStagingPositions (existing tests — preserved) ─────────────────────

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
  it('respects center offset', () => {
    const center = { x: 100, y: 200, z: 50 };
    const positions = computeStagingPositions(5, 30, center);
    for (const p of positions) {
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      expect(Math.sqrt(dx**2 + dy**2)).toBeLessThanOrEqual(30 + 1);
    }
    for (const p of positions) {
      expect(p.z).toBe(center.z);
    }
  });
  it('defaults center to origin when not provided', () => {
    const withDefault = computeStagingPositions(5, 80);
    const withExplicit = computeStagingPositions(5, 80, { x: 0, y: 0, z: 0 });
    expect(withDefault).toEqual(withExplicit);
  });
});

// ── Staging sphere lifecycle (new — FILT-04, FILT-06, FILT-09) ──────────────

describe('staging sphere lifecycle', () => {
  let objects: SceneObjects;
  const cases = [makeCase('c1'), makeCase('c2'), makeCase('c3')];

  beforeEach(() => {
    objects = makeSceneObjects(cases);
    vi.clearAllMocks();
  });

  it('FILT-04: applyFilter() in global mode with active filter — nucleusMeshes has STAGING_KEY after call', () => {
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);
    applyFilter(objects, filter);
    expect(objects.nucleusMeshes.has('__staging__')).toBe(true);
  });

  it('FILT-04: applyFilter() in global mode with active filter — nucleusOrbits has STAGING_KEY after call', () => {
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);
    applyFilter(objects, filter);
    expect('__staging__' in objects.nucleusOrbits).toBe(true);
  });

  it('FILT-09: applyFilter() then clear filter — nucleusMeshes does NOT have STAGING_KEY', () => {
    vi.useFakeTimers();
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);
    applyFilter(objects, filter);
    expect(objects.nucleusMeshes.has('__staging__')).toBe(true);

    const clearFilter = createFilterState(); // inactive filter
    applyFilter(objects, clearFilter);
    vi.runAllTimers(); // flush the 700ms delayed disposal
    expect(objects.nucleusMeshes.has('__staging__')).toBe(false);
    vi.useRealTimers();
  });

  it('FILT-09: clearing filter calls geometry.dispose() on the staging mesh', () => {
    vi.useFakeTimers();
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);
    applyFilter(objects, filter);
    const stagingMesh = objects.nucleusMeshes.get('__staging__')!;
    const disposeSpy = vi.spyOn(stagingMesh.geometry, 'dispose');

    const clearFilter = createFilterState();
    applyFilter(objects, clearFilter);
    vi.runAllTimers();
    expect(disposeSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('FILT-04: applying filter twice (filter changes) creates only one staging sphere', () => {
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);
    applyFilter(objects, filter);
    expect(objects.nucleusMeshes.size).toBe(2); // 'Media' + '__staging__'

    // Apply again — should not add a second staging sphere
    applyFilter(objects, filter);
    expect(objects.nucleusMeshes.size).toBe(2);
    expect(objects.nucleusMeshes.has('__staging__')).toBe(true);
  });
});
