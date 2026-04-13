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
    const sMat = new THREE.MeshStandardMaterial({
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

// ── Focused-view filter dimming tests (FILT-07) ───────────────────────────────

describe('applyFilter — focused mode (FILT-07)', () => {
  const matchingCase  = makeCase('c1', ProofType.Awareness);
  const nonMatchingCase = makeCase('c2', ProofType.Conversion);
  let objects: SceneObjects;

  beforeEach(() => {
    objects = makeFocusedSceneObjects([matchingCase, nonMatchingCase]);
    vi.clearAllMocks();
  });

  it('non-matching star gets userData.starState === "filterDim"', () => {
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness); // only c1 matches

    applyFilter(objects, filter);

    const nonMatchingStar = objects.starMeshes.find(
      s => (s.userData.caseStudy as EnrichedCaseStudy).id === 'c2',
    )!;
    expect(nonMatchingStar.userData.starState).toBe('filterDim');
  });

  it('matching star stays at userData.starState === "idle"', () => {
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness); // c1 matches

    applyFilter(objects, filter);

    const matchingStar = objects.starMeshes.find(
      s => (s.userData.caseStudy as EnrichedCaseStudy).id === 'c1',
    )!;
    expect(matchingStar.userData.starState).toBe('idle');
  });

  it('clearing filter in focused mode — all stars return to starState "idle"', () => {
    // First apply a filter to dim non-matching stars
    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Awareness);
    applyFilter(objects, filter);

    const nonMatchingStar = objects.starMeshes.find(
      s => (s.userData.caseStudy as EnrichedCaseStudy).id === 'c2',
    )!;
    expect(nonMatchingStar.userData.starState).toBe('filterDim');

    // Now clear the filter
    applyFilter(objects, createFilterState());

    for (const star of objects.starMeshes) {
      expect(star.userData.starState).toBe('idle');
    }
  });

  it('star with state "selected" is NOT changed to filterDim — precedence respected', () => {
    // Pre-set c1 as selected (higher precedence than filterDim)
    const selectedStar = objects.starMeshes.find(
      s => (s.userData.caseStudy as EnrichedCaseStudy).id === 'c1',
    )!;
    selectedStar.userData.starState = 'selected';

    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Conversion); // c1 does NOT match

    applyFilter(objects, filter);

    // c1 has state 'selected' — should not be downgraded to 'filterDim'
    expect(selectedStar.userData.starState).toBe('selected');
  });

  it('star with state "reading" is NOT changed to filterDim — precedence respected', () => {
    const readingStar = objects.starMeshes.find(
      s => (s.userData.caseStudy as EnrichedCaseStudy).id === 'c1',
    )!;
    readingStar.userData.starState = 'reading';

    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Conversion); // c1 does NOT match

    applyFilter(objects, filter);

    expect(readingStar.userData.starState).toBe('reading');
  });

  it('star with state "ghost" is NOT changed to filterDim — precedence respected', () => {
    const ghostStar = objects.starMeshes.find(
      s => (s.userData.caseStudy as EnrichedCaseStudy).id === 'c1',
    )!;
    ghostStar.userData.starState = 'ghost';

    const filter = createFilterState();
    filter.proofTypes.add(ProofType.Conversion); // c1 does NOT match

    applyFilter(objects, filter);

    expect(ghostStar.userData.starState).toBe('ghost');
  });

  it('no staging sphere created in focused mode even when filter is active', () => {
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

  it('marks shortlisted star as "selected" when currently "filterMatch"', () => {
    starFor('a').userData.starState = 'filterMatch';

    syncShortlistToStarState(objects, entries('a'));

    expect(starFor('a').userData.starState).toBe('selected');
  });

  it('marks shortlisted star as "selected" when currently "filterDim"', () => {
    starFor('a').userData.starState = 'filterDim';

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

  it('leaves "filterDim" star unchanged when it is not shortlisted', () => {
    starFor('b').userData.starState = 'filterDim';

    // Only 'a' is shortlisted; 'b' is not
    syncShortlistToStarState(objects, entries('a'));

    // 'b' should remain filterDim — sync does NOT reset filter states
    expect(starFor('b').userData.starState).toBe('filterDim');
  });

  it('leaves "filterMatch" star unchanged when it is not shortlisted', () => {
    starFor('b').userData.starState = 'filterMatch';

    syncShortlistToStarState(objects, entries('a'));

    expect(starFor('b').userData.starState).toBe('filterMatch');
  });

  it('handles star with undefined starState (treated as idle) — sets selected when shortlisted', () => {
    // starState not set on 'c' (undefined)
    starFor('c').userData.starState = undefined;

    syncShortlistToStarState(objects, entries('c'));

    expect(starFor('c').userData.starState).toBe('selected');
  });
});
