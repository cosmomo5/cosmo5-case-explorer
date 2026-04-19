// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ShortlistEntry } from '../data/shortlist-store';
import * as THREE from 'three';

vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn((_target: unknown, _vars?: Record<string, unknown>) => {
      return { kill: vi.fn() };
    }),
    killTweensOf: vi.fn(),
  },
}));

import {
  applyFilter,
  syncShortlistToStarState,
  tickOrbits,
  type SceneObjects,
} from './scene-state';
import type { EnrichedCaseStudy } from '../data/enrich';
import { ProofType } from '../data/proof-type';
import { createFilterState } from '../data/filter';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCase(
  id: string,
  proofType: ProofType = ProofType.Awareness,
): EnrichedCaseStudy {
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

/**
 * Build a focused SceneObjects with the given cases.
 * Stars are created with MeshStandardMaterial (matches production code).
 */
function makeFocusedSceneObjects(cases: EnrichedCaseStudy[]): SceneObjects {
  const scene = new THREE.Scene();
  const nucleusMeshes = new Map<string, THREE.Mesh>();

  const nucGeo = new THREE.SphereGeometry(6, 4, 4);
  const nucMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nucMesh = new THREE.Mesh(nucGeo, nucMat);
  nucMesh.position.set(0, 0, 0);
  nucMesh.userData = { key: 'Media', isNucleus: true, homePos: new THREE.Vector3(0, 0, 0) };
  scene.add(nucMesh);
  nucleusMeshes.set('Media', nucMesh);

  const nucleusOrbits: Record<string, any> = {
    Media: {
      key: 'Media',
      orbitR: 200,
      orbitU: { x: 1, y: 0, z: 0 },
      orbitV: { x: 0, y: 1, z: 0 },
      phase: 0,
      speed: 0,
      cases,
    },
  };

  const starMeshes: THREE.Mesh[] = cases.map((c) => {
    const sGeo = new THREE.SphereGeometry(2.5, 4, 4);
    const sMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });
    const star = new THREE.Mesh(sGeo, sMat);
    star.position.set(50, 0, 0);
    star.userData = {
      caseStudy: c,
      starOrbit: { nucleusKey: 'Media', orbitCenter: { x: 0, y: 0, z: 0 } },
      isFiltered: false,
      isStagingTarget: false,
      originalColor: 0xffffff,
      // starState not set initially — undefined, treated as 'idle'
    };
    scene.add(star);
    return star;
  });

  return {
    scene,
    nucleusMeshes,
    nucleusLabels: new Map(),
    starMeshes,
    starLabels: new Map(),
    starOrbits: [],
    nucleusOrbits,
    filterState: createFilterState(),
    mode: 'focused',          // <── focused mode
    focusedKey: 'Media',
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

// ── Pure-state applyFilter tests (FILT-07 rewired — D-04) ────────────────────
// applyFilter is now a pure state mutation: objects.filterState = newFilter.
// Visual updates are the responsibility of applyFilterWave (global) and
// gather() (Phase 20+). applyFilter itself does NOT touch starState or opacity.

describe('applyFilter — pure state mutation (FILT-07)', () => {
  const matchingCase  = makeCase('c1', ProofType.Awareness);
  const nonMatchingCase = makeCase('c2', ProofType.Conversion);
  let objects: SceneObjects;
  let gsapMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    objects = makeFocusedSceneObjects([matchingCase, nonMatchingCase]);
    const gsapMod = await import('gsap') as any;
    gsapMock = gsapMod.gsap.to as ReturnType<typeof vi.fn>;
    vi.clearAllMocks();
  });

  it('sets objects.filterState to the new filter (focused mode)', () => {
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);

    applyFilter(objects, filter);

    expect(objects.filterState).toBe(filter);
  });

  it('sets objects.filterState to the new filter (global mode)', () => {
    objects.mode = 'global';
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);

    applyFilter(objects, filter);

    expect(objects.filterState).toBe(filter);
  });

  it('does NOT call gsap.to (no visual side effects in focused mode)', () => {
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);

    applyFilter(objects, filter);

    expect(gsapMock).not.toHaveBeenCalled();
  });

  it('does NOT call gsap.to (no visual side effects in global mode)', () => {
    objects.mode = 'global';
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);

    applyFilter(objects, filter);

    expect(gsapMock).not.toHaveBeenCalled();
  });

  it('does NOT modify starState on any star (focused mode)', () => {
    for (const star of objects.starMeshes) {
      star.userData.starState = 'idle';
    }
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);

    applyFilter(objects, filter);

    for (const star of objects.starMeshes) {
      expect(star.userData.starState).toBe('idle');
    }
  });

  it('does NOT modify starState on any star (global mode)', () => {
    objects.mode = 'global';
    for (const star of objects.starMeshes) {
      star.userData.starState = 'idle';
    }
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);

    applyFilter(objects, filter);

    for (const star of objects.starMeshes) {
      expect(star.userData.starState).toBe('idle');
    }
  });

  it('does NOT create staging sphere (applyFilter no longer manages staging)', () => {
    objects.mode = 'global';
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);

    applyFilter(objects, filter);

    expect(objects.nucleusMeshes.has('__staging__')).toBe(false);
  });
});

// ── syncShortlistToStarState tests ───────────────────────────────────────────

describe('syncShortlistToStarState', () => {
  let objects: SceneObjects;

  const caseA = makeCase('a');
  const caseB = makeCase('b');
  const caseC = makeCase('c');

  beforeEach(() => {
    objects = makeFocusedSceneObjects([caseA, caseB, caseC]);
    vi.clearAllMocks();
  });

  function starFor(id: string): THREE.Mesh {
    return objects.starMeshes.find(
      s => (s.userData.caseStudy as ReturnType<typeof makeCase>).id === id,
    )!;
  }

  function entries(...ids: string[]): ShortlistEntry[] {
    return ids.map(id => ({ caseId: id, nucleusKey: 'Media' }));
  }

  it('marks shortlisted star as "selected" when currently "idle"', () => {
    starFor('a').userData.starState = 'idle';

    syncShortlistToStarState(objects, entries('a'));

    expect(starFor('a').userData.starState).toBe('selected');
  });

  it('marks shortlisted star as "selected" when currently "selected" (idempotent)', () => {
    starFor('a').userData.starState = 'selected';

    syncShortlistToStarState(objects, entries('a'));

    expect(starFor('a').userData.starState).toBe('selected');
  });

  it('marks shortlisted star as "selected" when starState is undefined (treated as idle)', () => {
    starFor('a').userData.starState = undefined;

    syncShortlistToStarState(objects, entries('a'));

    expect(starFor('a').userData.starState).toBe('selected');
  });

  it('does NOT overwrite a star with starState="reading"', () => {
    starFor('a').userData.starState = 'reading';

    syncShortlistToStarState(objects, entries('a'));

    expect(starFor('a').userData.starState).toBe('reading');
  });

  it('does NOT overwrite a star with starState="ghost"', () => {
    starFor('a').userData.starState = 'ghost';

    syncShortlistToStarState(objects, entries('a'));

    expect(starFor('a').userData.starState).toBe('ghost');
  });

  it('restores "selected" star to "idle" when case is removed from shortlist', () => {
    starFor('a').userData.starState = 'selected';

    // Pass empty shortlist — 'a' is no longer shortlisted
    syncShortlistToStarState(objects, entries());

    expect(starFor('a').userData.starState).toBe('idle');
  });

  it('leaves "idle" star unchanged when it is not shortlisted', () => {
    starFor('b').userData.starState = 'idle';

    // Only 'a' is shortlisted; 'b' is not
    syncShortlistToStarState(objects, entries('a'));

    // 'b' should remain idle — sync does not promote non-shortlisted stars
    expect(starFor('b').userData.starState).toBe('idle');
  });

  it('does not promote non-shortlisted star with undefined starState', () => {
    starFor('b').userData.starState = undefined;

    // Only 'a' is shortlisted; 'b' is not
    syncShortlistToStarState(objects, entries('a'));

    // 'b' was not shortlisted — starState stays undefined (not promoted to selected)
    expect(starFor('b').userData.starState).toBeUndefined();
  });

  it('handles star with undefined starState (treated as idle) — sets selected when shortlisted', () => {
    // starState not set on 'c' (undefined)
    starFor('c').userData.starState = undefined;

    syncShortlistToStarState(objects, entries('c'));

    expect(starFor('c').userData.starState).toBe('selected');
  });
});

// ── planetaryActive gate (phase 16-03, Gap 1 scene-geometry closure) ─────────

/**
 * Build a global-mode SceneObjects with a single nucleus that has a halo attached,
 * plus a small number of stars orbiting it. Mirrors the production buildOrbitalScene
 * shape closely enough for the tick-loop gate to be exercised.
 */
function makeGlobalSceneWithHalo(cases: EnrichedCaseStudy[]): {
  sceneObjects: SceneObjects;
  camera: THREE.PerspectiveCamera;
  halo: THREE.Mesh;
} {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();

  const nucleusMeshes = new Map<string, THREE.Mesh>();

  const nucGeo = new THREE.SphereGeometry(6, 4, 4);
  const nucMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nucMesh = new THREE.Mesh(nucGeo, nucMat);
  nucMesh.position.set(10, 20, 30);

  // Attach a halo (matches buildOrbitalScene's pattern — mesh.userData.halo)
  const haloGeo = new THREE.SphereGeometry(20, 8, 8);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.copy(nucMesh.position);
  scene.add(halo);

  nucMesh.userData = {
    key: 'Media',
    isNucleus: true,
    homePos: nucMesh.position.clone(),
    halo,
  };
  scene.add(nucMesh);
  nucleusMeshes.set('Media', nucMesh);

  // A single nucleus orbit (position is static since speed=0 and phase=0).
  const nucleusOrbits: Record<string, any> = {
    Media: {
      key: 'Media',
      orbitR: 200,
      orbitU: { x: 1, y: 0, z: 0 },
      orbitV: { x: 0, y: 1, z: 0 },
      phase: 0,
      speed: 0,
      cases,
      homePos: { x: 10, y: 20, z: 30 },
    },
  };

  const starMeshes: THREE.Mesh[] = cases.map((c) => {
    const sGeo = new THREE.SphereGeometry(2.5, 4, 4);
    const sMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });
    const star = new THREE.Mesh(sGeo, sMat);
    star.position.set(50, 0, 0);
    star.userData = {
      caseStudy: c,
      starOrbit: {
        nucleusKey: 'Media',
        orbitCenter: { x: 10, y: 20, z: 30 },
        u: { x: 1, y: 0, z: 0 },
        v: { x: 0, y: 1, z: 0 },
        r: 10,
        phase: 0,
        speed: 0,
        _ax: { x: 1, y: 0, z: 0 },
      },
      isFiltered: false,
      isStagingTarget: false,
      isPlanetaryTarget: false,
      originalColor: 0xffffff,
    };
    scene.add(star);
    return star;
  });

  const sceneObjects: SceneObjects = {
    scene,
    nucleusMeshes,
    nucleusLabels: new Map(),
    starMeshes,
    starLabels: new Map(),
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

  return { sceneObjects, camera, halo };
}

describe('planetaryActive gate', () => {
  const c1 = makeCase('p1');
  const c2 = makeCase('p2');

  beforeEach(() => {
    // jsdom doesn't implement matchMedia; tickOrbits calls it via matchesReducedMotion
    if (!window.matchMedia) {
      (window as any).matchMedia = (q: string) => ({
        matches: false,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      });
    }
  });

  it('hides every nucleus mesh when planetaryActive is true', () => {
    const { sceneObjects, camera } = makeGlobalSceneWithHalo([c1, c2]);
    sceneObjects.planetaryActive = true;
    tickOrbits(sceneObjects, 0, camera);
    for (const [, mesh] of sceneObjects.nucleusMeshes.entries()) {
      expect(mesh.visible).toBe(false);
    }
  });

  it('hides every nucleus halo when planetaryActive is true', () => {
    const { sceneObjects, camera } = makeGlobalSceneWithHalo([c1, c2]);
    sceneObjects.planetaryActive = true;
    tickOrbits(sceneObjects, 0, camera);
    for (const [, mesh] of sceneObjects.nucleusMeshes.entries()) {
      const halo = mesh.userData.halo as THREE.Object3D | undefined;
      if (halo) expect(halo.visible).toBe(false);
    }
  });

  it('restores nucleus + halo visibility when planetaryActive is false', () => {
    const { sceneObjects, camera } = makeGlobalSceneWithHalo([c1, c2]);
    sceneObjects.planetaryActive = false;
    tickOrbits(sceneObjects, 0, camera);
    for (const [, mesh] of sceneObjects.nucleusMeshes.entries()) {
      expect(mesh.visible).toBe(true);
      const halo = mesh.userData.halo as THREE.Object3D | undefined;
      if (halo) expect(halo.visible).toBe(true);
    }
  });

  it('does not interfere with isPlanetaryTarget star-position gate', () => {
    const { sceneObjects, camera } = makeGlobalSceneWithHalo([c1, c2]);
    sceneObjects.planetaryActive = true;
    const star = sceneObjects.starMeshes[0];
    star.userData.isPlanetaryTarget = true;
    const before = star.position.clone();
    tickOrbits(sceneObjects, 1000, camera);
    expect(star.position.equals(before)).toBe(true);
  });
});
