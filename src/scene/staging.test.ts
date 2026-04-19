/**
 * TDD tests for gather() — Phase 20-02
 *
 * Integration-style: uses real THREE.Scene, real GSAP, real FilterState factory.
 * Observes side effects on nucleusMeshes, nucleusOrbits, and star userData.
 * No vi.mock of sibling module functions — module-local bindings can't be intercepted.
 */

import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { gather, STAGING_KEY } from './staging';
import { createFilterState } from '../data/filter';
import type { FilterState } from '../data/filter';
import type { SceneObjects } from './scene-state';
import type { CaseStudy } from '../data/types';
import type { EnrichedCaseStudy } from '../data/enrich';

// ── Minimal fixture builders ──────────────────────────────────────────────────

function makeCase(id: string, countries: string[]): EnrichedCaseStudy {
  return {
    id,
    client: `Client ${id}`,
    year: 2023,
    services: ['Strategy'],
    countries,
    region: 'EMEA',
    permission: true,
    title: `Case ${id}`,
    challenge: 'challenge',
    approach: 'approach',
    metrics: [],
    proofType: 'anecdotal',
    impactScale: { band: 'none', score: 0, label: 'None' },
  } as unknown as EnrichedCaseStudy;
}

function makeStarMesh(caseStudy: EnrichedCaseStudy): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1),
    new THREE.MeshBasicMaterial(),
  );
  mesh.position.set(10, 0, 0);
  mesh.userData.caseStudy = caseStudy;
  return mesh;
}

function makeNucleusMesh(key: string, pos: THREE.Vector3): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(6),
    new THREE.MeshStandardMaterial(),
  );
  mesh.position.copy(pos);
  mesh.userData.key = key;
  mesh.userData.isNucleus = true;
  return mesh;
}

/** Build a minimal SceneObjects that exercises gather() */
function makeObjects(filterState: FilterState, cases: EnrichedCaseStudy[]): SceneObjects {
  const scene = new THREE.Scene();

  // One real nucleus so applyStagingPush has a target
  const nucleusMesh = makeNucleusMesh('Media', new THREE.Vector3(30, 0, 0));
  scene.add(nucleusMesh);

  const nucleusMeshes = new Map<string, THREE.Mesh>();
  nucleusMeshes.set('Media', nucleusMesh);

  const starMeshes = cases.map(c => {
    const m = makeStarMesh(c);
    scene.add(m);
    return m;
  });

  return {
    scene,
    nucleusMeshes,
    nucleusLabels: new Map(),
    starMeshes,
    starLabels: new Map(),
    starOrbits: [],
    nucleusOrbits: {
      Media: {
        key: 'Media',
        orbitR: 30,
        orbitU: { x: 1, y: 0, z: 0 },
        orbitV: { x: 0, y: 1, z: 0 },
        phase: 0,
        speed: 0,
        cases: cases as unknown as CaseStudy[],
      },
    },
    filterState,
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
    controls: undefined,
    camera: undefined,
  } as unknown as SceneObjects;
}

// ── Three cases: US only, CA × 2 ─────────────────────────────────────────────
const CASE_US = makeCase('case-us', ['US']);
const CASE_CA1 = makeCase('case-ca1', ['CA']);
const CASE_CA2 = makeCase('case-ca2', ['CA']);
const ALL_CASES = [CASE_US, CASE_CA1, CASE_CA2];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('gather(objects)', () => {
  // Test 1: no matched cases → early return, no sphere created
  it('returns early when no cases match the active filter', () => {
    const filter = createFilterState();
    filter.countries.add('NONEXISTENT');
    const objects = makeObjects(filter, ALL_CASES);

    gather(objects);

    expect(objects.nucleusMeshes.has(STAGING_KEY)).toBe(false);
    expect(objects.nucleusOrbits[STAGING_KEY]).toBeUndefined();
  });

  // Test 2: matched cases, sphere absent → create path
  it('creates staging sphere when sphere is not present', () => {
    const filter = createFilterState();
    filter.countries.add('CA');
    const objects = makeObjects(filter, ALL_CASES);

    gather(objects);

    expect(objects.nucleusMeshes.has(STAGING_KEY)).toBe(true);
    expect(objects.nucleusOrbits[STAGING_KEY]).toBeDefined();
  });

  // Test 3: create path → sphere stored in scene (create did the scene.add)
  it('adds staging sphere mesh to scene on first gather', () => {
    const filter = createFilterState();
    filter.countries.add('US');
    const objects = makeObjects(filter, ALL_CASES);

    gather(objects);

    const sphereMesh = objects.nucleusMeshes.get(STAGING_KEY);
    expect(sphereMesh).toBeDefined();
    expect(objects.scene.children).toContain(sphereMesh);
  });

  // Test 4: create path → nucleusMesh is pushed outward (applyStagingPush ran)
  it('marks nucleus preFilterPosition after create-path gather', () => {
    const filter = createFilterState();
    filter.countries.add('CA');
    const objects = makeObjects(filter, ALL_CASES);
    const mediaMesh = objects.nucleusMeshes.get('Media')!;

    // Before gather — no preFilterPosition
    expect(mediaMesh.userData.preFilterPosition).toBeUndefined();

    gather(objects);

    // After gather — applyStagingPush stored original pos
    expect(mediaMesh.userData.preFilterPosition).toBeDefined();
  });

  // Test 5: matched cases stored correctly in orbit data
  it('stores only matched cases in nucleusOrbits[STAGING_KEY].cases', () => {
    const filter = createFilterState();
    filter.countries.add('CA'); // matches case-ca1 and case-ca2
    const objects = makeObjects(filter, ALL_CASES);

    gather(objects);

    const orbitData = objects.nucleusOrbits[STAGING_KEY];
    expect(orbitData).toBeDefined();
    const storedIds = orbitData.cases.map((c: CaseStudy) => c.id);
    expect(storedIds).toContain('case-ca1');
    expect(storedIds).toContain('case-ca2');
    expect(storedIds).not.toContain('case-us');
  });

  // Test 6: sphere present → update path (animateStarsToStaging, not createStagingNucleus)
  it('does NOT recreate sphere if sphere already exists (uses update path)', () => {
    const filter = createFilterState();
    filter.countries.add('CA');
    const objects = makeObjects(filter, ALL_CASES);

    // First gather creates the sphere
    gather(objects);
    const originalMesh = objects.nucleusMeshes.get(STAGING_KEY);
    expect(originalMesh).toBeDefined();

    // Second gather: sphere exists → update path (mesh identity preserved)
    gather(objects);
    const updatedMesh = objects.nucleusMeshes.get(STAGING_KEY);

    // Same mesh object — no re-creation
    expect(updatedMesh).toBe(originalMesh);
  });

  // Test 7: update path → stars are marked as staging targets
  it('marks matched stars as isStagingTarget on update-path gather', () => {
    const filter = createFilterState();
    filter.countries.add('CA');
    const objects = makeObjects(filter, ALL_CASES);

    // First gather creates sphere
    gather(objects);
    // Second gather triggers animateStarsToStaging (update path)
    gather(objects);

    // CA stars should be marked isStagingTarget
    const ca1Star = objects.starMeshes.find(m => (m.userData.caseStudy as CaseStudy).id === 'case-ca1');
    const ca2Star = objects.starMeshes.find(m => (m.userData.caseStudy as CaseStudy).id === 'case-ca2');
    const usStar  = objects.starMeshes.find(m => (m.userData.caseStudy as CaseStudy).id === 'case-us');

    expect(ca1Star?.userData.isStagingTarget).toBe(true);
    expect(ca2Star?.userData.isStagingTarget).toBe(true);
    // US star was not matched — should not be a staging target
    expect(usStar?.userData.isStagingTarget).toBeFalsy();
  });

  // Test 8: filter inactive (empty sets) → no sphere created
  it('returns early when filter is inactive (no active dimensions)', () => {
    const filter = createFilterState(); // empty — isActive() === false
    const objects = makeObjects(filter, ALL_CASES);

    gather(objects);

    expect(objects.nucleusMeshes.has(STAGING_KEY)).toBe(false);
  });
});
