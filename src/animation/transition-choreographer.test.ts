// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Capture onComplete callbacks so tests can trigger them manually
let capturedOnComplete: (() => void) | undefined;
/**
 * When true, gsap.to auto-invokes onComplete synchronously.
 * When false (default), onComplete is captured and must be fired manually via
 * `capturedOnComplete?.()` — matches the original 6-test behavior.
 */
let AUTO_FIRE_COMPLETE = false;

vi.mock('gsap', () => ({
  gsap: {
    context: vi.fn((fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    }),
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      const onComplete = vars.onComplete as (() => void) | undefined;
      capturedOnComplete = onComplete;
      if (AUTO_FIRE_COMPLETE) onComplete?.();
      return { kill: vi.fn() };
    }),
    set: vi.fn(),
    delayedCall: vi.fn((_delay: number, cb: () => void) => {
      if (AUTO_FIRE_COMPLETE) cb();
      return { kill: vi.fn() };
    }),
    killTweensOf: vi.fn(),
  },
}));

// Mock CameraControls — must be before import
vi.mock('camera-controls', () => {
  const MockCC = vi.fn().mockImplementation(() => ({
    enabled: true,
    getPosition: vi.fn((out: THREE.Vector3) => out.set(80, 880, 280)),
    getTarget: vi.fn((out: THREE.Vector3) => out.set(0, 0, 0)),
    setLookAt: vi.fn(),
  }));
  (MockCC as unknown as Record<string, unknown>).install = vi.fn();
  return { default: MockCC };
});

import CameraControls from 'camera-controls';
import { createTransitionChoreographer } from './transition-choreographer';

describe('TransitionChoreographer', () => {
  let controls: CameraControls;

  beforeEach(() => {
    capturedOnComplete = undefined;
    controls = new CameraControls(new THREE.PerspectiveCamera(), document.createElement('div'));
  });

  it('inProgress is false on creation', () => {
    const ch = createTransitionChoreographer(controls);
    expect(ch.state.inProgress).toBe(false);
  });

  it('after startT1, inProgress is true and controls.enabled is false', () => {
    const ch = createTransitionChoreographer(controls);
    ch.startT1(new THREE.Vector3(100, 0, 0), new THREE.Vector3(0, 0, 1), 200);
    expect(ch.state.inProgress).toBe(true);
    expect(controls.enabled).toBe(false);
  });

  it('after startT1 completes, inProgress is false and controls.enabled is true', () => {
    const ch = createTransitionChoreographer(controls);
    ch.startT1(new THREE.Vector3(100, 0, 0), new THREE.Vector3(0, 0, 1), 200);
    // Simulate GSAP onComplete
    capturedOnComplete?.();
    expect(ch.state.inProgress).toBe(false);
    expect(controls.enabled).toBe(true);
  });

  it('cancel sets inProgress to false and calls ctx.revert()', () => {
    const ch = createTransitionChoreographer(controls);
    ch.startT1(new THREE.Vector3(100, 0, 0), new THREE.Vector3(0, 0, 1), 200);
    ch.cancel();
    expect(ch.state.inProgress).toBe(false);
    expect(ch.state.currentCtx).toBeNull();
  });

  it('cancel on non-in-progress choreographer does not throw', () => {
    const ch = createTransitionChoreographer(controls);
    expect(() => ch.cancel()).not.toThrow();
  });

  it('startT1 while in progress calls cancel first', () => {
    const ch = createTransitionChoreographer(controls);
    ch.startT1(new THREE.Vector3(100, 0, 0), new THREE.Vector3(0, 0, 1), 200);
    expect(ch.state.inProgress).toBe(true);
    // Start another — should cancel first and re-start
    ch.startT1(new THREE.Vector3(200, 0, 0), new THREE.Vector3(0, 0, 1), 200);
    expect(ch.state.inProgress).toBe(true);
    expect(controls.enabled).toBe(false);
  });
});

// ── Phase 16-03: choreographPlanetaryToGlobal — final beat tests ─────────────

import { createPlanet } from '../scene/planet';
import { starPositionAt } from '../scene/orbitals/star-orbit';
import { createTransitionChoreographer as createChoreographer } from './transition-choreographer';

describe('choreographPlanetaryToGlobal — final beat (phase 16-03)', () => {
  let controls: CameraControls;

  beforeEach(() => {
    // Auto-fire onComplete + delayedCall so Promises resolve synchronously
    AUTO_FIRE_COMPLETE = true;
    capturedOnComplete = undefined;
    document.body.className = '';
    document.body.classList.add('planetary');
    controls = new CameraControls(new THREE.PerspectiveCamera(), document.createElement('div'));
    // jsdom doesn't implement matchMedia; default to full-motion unless a test overrides.
    if (!window.matchMedia) {
      (window as any).matchMedia = (q: string) => ({
        matches: false,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      });
    }
  });

  afterEach(() => {
    AUTO_FIRE_COMPLETE = false;
  });

  function makeFixture() {
    const scene = new THREE.Scene();
    const planet = createPlanet(scene);

    const labelDivs = ['a', 'b', 'c'].map((k) => {
      const div = document.createElement('div');
      div.className = 'cl';
      return [k, div] as const;
    });
    const nucleusLabels = new Map<string, HTMLDivElement>(labelDivs);

    const sceneObjects: any = {
      scene,
      camera: new THREE.PerspectiveCamera(),
      controls,
      starMeshes: [],
      nucleusMeshes: new Map(),
      nucleusLabels,
      planetaryActive: true,
    };

    const choreographer = createChoreographer(controls);
    return { sceneObjects, planet, choreographer, labelDivs };
  }

  it('sets sceneObjects.planetaryActive to false on resolve', async () => {
    const { sceneObjects, planet, choreographer } = makeFixture();
    await choreographer.choreographPlanetaryToGlobal(sceneObjects, planet);
    expect(sceneObjects.planetaryActive).toBe(false);
  }, 10000);

  it('removes "planetary" class from document.body on resolve', async () => {
    const { sceneObjects, planet, choreographer } = makeFixture();
    await choreographer.choreographPlanetaryToGlobal(sceneObjects, planet);
    expect(document.body.classList.contains('planetary')).toBe(false);
  }, 10000);

  it('invokes options.onComplete exactly once', async () => {
    const { sceneObjects, planet, choreographer } = makeFixture();
    const onComplete = vi.fn();
    await choreographer.choreographPlanetaryToGlobal(sceneObjects, planet, { onComplete });
    expect(onComplete).toHaveBeenCalledTimes(1);
  }, 10000);

  it('still adds .show to every nucleus label (16-02 regression guard)', async () => {
    const { sceneObjects, planet, choreographer, labelDivs } = makeFixture();
    await choreographer.choreographPlanetaryToGlobal(sceneObjects, planet);
    for (const [, div] of labelDivs) {
      expect(div.classList.contains('show')).toBe(true);
    }
  }, 10000);

  it('works with no options argument (back-compat)', async () => {
    const { sceneObjects, planet, choreographer } = makeFixture();
    await expect(
      choreographer.choreographPlanetaryToGlobal(sceneObjects, planet, undefined as any),
    ).resolves.toBeUndefined();
  }, 10000);

  it('under prefers-reduced-motion, does NOT run star-migration tweens (locked decision: Act IV = fade-swap only)', async () => {
    const origMM = window.matchMedia;
    (window as any).matchMedia = (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    try {
      const { sceneObjects, planet, choreographer } = makeFixture();
      // StarOrbit shape per src/data/types.ts:39. Home = starPositionAt(orbit, 0)
      // which reduces to orbitCenter + u when phase=0 and speed=0.
      const mockOrbit = {
        caseStudy: { id: 'fake', client: 'fake' } as any,
        nucleusKey: 'fake',
        orbitCenter: { x: 1, y: 2, z: 3 },
        u: { x: 4, y: 5, z: 6 },
        v: { x: 0, y: 0, z: 0 },
        r: 1,
        phase: 0,
        speed: 0,
        _ax: { x: 1, y: 0, z: 0 },
      };
      const star = new THREE.Mesh();
      star.position.set(50, 50, 50);
      star.userData.isPlanetaryTarget = true;
      star.userData.starOrbit = mockOrbit;
      sceneObjects.starMeshes.push(star);
      const expectedHome = starPositionAt(mockOrbit, 0);
      const p = choreographer.choreographPlanetaryToGlobal(sceneObjects, planet);
      // Synchronous snap: star position is home BEFORE the promise resolves
      expect(star.position.x).toBeCloseTo(expectedHome.x, 5);
      expect(star.position.y).toBeCloseTo(expectedHome.y, 5);
      expect(star.position.z).toBeCloseTo(expectedHome.z, 5);
      // Star's isPlanetaryTarget is cleared synchronously by snapStarsToHomes
      expect(star.userData.isPlanetaryTarget).toBe(false);
      await p;
    } finally {
      (window as any).matchMedia = origMM;
    }
  }, 10000);
});

// ── Plan 01.1-04: choreographPlanetaryToGlobal — offset-clearing tween (RED) ──

describe('choreographPlanetaryToGlobal offset clearing', () => {
  let controls: CameraControls;
  let origMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    AUTO_FIRE_COMPLETE = true;
    capturedOnComplete = undefined;
    document.body.className = '';
    document.body.classList.add('planetary');
    controls = new CameraControls(new THREE.PerspectiveCamera(), document.createElement('div'));
    // Default: full-motion (matchMedia returns false for reduce queries)
    origMatchMedia = window.matchMedia;
    (window as any).matchMedia = (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    // Clear gsap.to call history so tests can inspect only the calls they care about
    vi.mocked(gsap.to).mockClear();
  });

  afterEach(() => {
    AUTO_FIRE_COMPLETE = false;
    (window as any).matchMedia = origMatchMedia;
  });

  function makeOffsetFixture() {
    const scene = new THREE.Scene();
    const planet = createPlanet(scene);
    const nucleusLabels = new Map<string, HTMLDivElement>();

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 3000);
    camera.position.set(80, 880, 280);
    // Simulate Entry state: apply a view offset (cx:72%, cy:58% at 1280×800)
    camera.setViewOffset(1280, 800, -281.6, -64, 1280, 800);

    const sceneObjects: any = {
      scene,
      camera,
      controls,
      starMeshes: [],
      nucleusMeshes: new Map(),
      nucleusLabels,
      planetaryActive: true,
    };

    const choreographer = createChoreographer(controls);
    return { sceneObjects, planet, choreographer, camera };
  }

  it('fires offset-clearing GSAP proxy tween when camera has view offset', async () => {
    const { sceneObjects, planet, choreographer } = makeOffsetFixture();

    await choreographer.choreographPlanetaryToGlobal(sceneObjects, planet);

    // Find the call where gsap.to received a proxy object with dx and dy properties
    const calls = vi.mocked(gsap.to).mock.calls;
    const offsetCall = calls.find(
      ([target]) => target !== null && typeof target === 'object' && 'dx' in (target as object) && 'dy' in (target as object),
    );

    expect(offsetCall).toBeDefined();
    const [, config] = offsetCall!;
    expect((config as Record<string, unknown>).dx).toBe(0);
    expect((config as Record<string, unknown>).dy).toBe(0);
    expect((config as Record<string, unknown>).duration).toBe(1.2);
  });

  it('calls clearEntryFraming (clearViewOffset) on offset tween completion', async () => {
    const { sceneObjects, planet, choreographer, camera } = makeOffsetFixture();
    const clearSpy = vi.spyOn(camera, 'clearViewOffset');

    await choreographer.choreographPlanetaryToGlobal(sceneObjects, planet);

    // Find the offset proxy tween's onComplete and fire it manually
    // (AUTO_FIRE_COMPLETE fires it during the call, but we want to assert the spy was invoked)
    expect(clearSpy).toHaveBeenCalled();
  });

  it('offset-clearing tween duration scales to 0.4s under prefers-reduced-motion', async () => {
    // Override matchMedia to simulate reduced-motion preference
    (window as any).matchMedia = (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    });

    const { sceneObjects, planet, choreographer } = makeOffsetFixture();

    await choreographer.choreographPlanetaryToGlobal(sceneObjects, planet);

    const calls = vi.mocked(gsap.to).mock.calls;
    const offsetCall = calls.find(
      ([target]) => target !== null && typeof target === 'object' && 'dx' in (target as object) && 'dy' in (target as object),
    );

    expect(offsetCall).toBeDefined();
    const [, config] = offsetCall!;
    // 1.2s × 0.33 reduced-motion scale = 0.396s ≈ 0.4s
    expect((config as Record<string, unknown>).duration).toBeCloseTo(1.2 * 0.33, 5);
  });
});
