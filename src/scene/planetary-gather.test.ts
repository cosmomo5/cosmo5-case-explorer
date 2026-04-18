import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { fibonacciSphere, gatherStarsToPlanet, releaseStarsToHomes } from './planetary-gather';
import type { SceneObjects } from './scene-state';
import type { StarOrbit } from '../data/types';

// GSAP lives in the test env but runs against requestAnimationFrame which vitest
// doesn't advance automatically. We fire its ticker manually.
import { gsap } from 'gsap';

describe('fibonacciSphere', () => {
  it('returns the requested number of points', () => {
    expect(fibonacciSphere(0)).toHaveLength(0);
    expect(fibonacciSphere(1)).toHaveLength(1);
    expect(fibonacciSphere(48)).toHaveLength(48);
  });

  it('all points lie on the unit sphere (radius=1)', () => {
    for (const p of fibonacciSphere(100)) {
      const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      expect(r).toBeCloseTo(1, 5);
    }
  });

  it('scales to arbitrary radius', () => {
    for (const p of fibonacciSphere(50, 30)) {
      const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      expect(r).toBeCloseTo(30, 4);
    }
  });

  it('no two points are identical', () => {
    const pts = fibonacciSphere(48);
    const keys = new Set(pts.map(p => `${p.x.toFixed(4)}_${p.y.toFixed(4)}_${p.z.toFixed(4)}`));
    expect(keys.size).toBe(48);
  });
});

// Helpers for building a mock SceneObjects with just what gather/release need.
function makeFakeStar(home: { x: number; y: number; z: number }): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial());
  mesh.position.set(home.x, home.y, home.z);
  // Minimal starOrbit sufficient for starPositionAt(orbit, 0) → returns the home
  const orbit: StarOrbit = {
    caseStudy: { id: 'fake', client: 'fake' } as any,
    nucleusKey: 'fake',
    orbitCenter: { x: home.x, y: home.y, z: home.z },
    u: { x: 0, y: 0, z: 0 },
    v: { x: 0, y: 0, z: 0 },
    r: 1,
    phase: 0,
    speed: 0,
    _ax: { x: 1, y: 0, z: 0 },
  };
  mesh.userData = { starOrbit: orbit };
  return mesh;
}

function makeFakeSceneObjects(starCount: number): SceneObjects {
  const starMeshes: THREE.Mesh[] = [];
  for (let i = 0; i < starCount; i++) {
    // Distinct home positions (so the release targets differ)
    starMeshes.push(makeFakeStar({ x: i * 10, y: i * 5, z: -i * 3 }));
  }
  return {
    scene: new THREE.Scene(),
    nucleusMeshes: new Map(),
    nucleusLabels: new Map(),
    starMeshes,
    starOrbits: [],
    nucleusOrbits: {},
    filterState: { isActive: () => false } as any,
    mode: 'global' as const,
    focusedKey: null,
    groupMode: 'vertical' as const,
    ringLineMeshes: [],
    ringLineValues: [],
  } as any as SceneObjects;
}

describe('gatherStarsToPlanet', () => {
  it('positions every star within surfaceRadius of planet center', () => {
    const objects = makeFakeSceneObjects(48);
    gatherStarsToPlanet(objects, { x: 0, y: 0, z: 0 }, 30);
    for (const star of objects.starMeshes) {
      const d = star.position.length();
      expect(d).toBeCloseTo(30, 3);
    }
  });

  it('sets isPlanetaryTarget=true on every star', () => {
    const objects = makeFakeSceneObjects(10);
    gatherStarsToPlanet(objects, { x: 0, y: 0, z: 0 }, 30);
    for (const star of objects.starMeshes) {
      expect(star.userData.isPlanetaryTarget).toBe(true);
    }
  });

  it('stores planetaryReleaseTarget pointing to the orbital home', () => {
    const objects = makeFakeSceneObjects(3);
    gatherStarsToPlanet(objects, { x: 0, y: 0, z: 0 }, 30);
    const t0 = objects.starMeshes[0].userData.planetaryReleaseTarget as THREE.Vector3;
    expect(t0).toBeInstanceOf(THREE.Vector3);
    expect(t0.x).toBe(0);
    expect(t0.y).toBe(0);
    expect(t0.z).toBe(0);
    const t1 = objects.starMeshes[1].userData.planetaryReleaseTarget as THREE.Vector3;
    expect(t1.x).toBe(10);
    expect(t1.y).toBe(5);
    expect(t1.z).toBe(-3);
  });

  it('respects planet center offset', () => {
    const objects = makeFakeSceneObjects(12);
    gatherStarsToPlanet(objects, { x: 100, y: 50, z: -25 }, 30);
    for (const star of objects.starMeshes) {
      const dx = star.position.x - 100;
      const dy = star.position.y - 50;
      const dz = star.position.z + 25;
      expect(Math.sqrt(dx * dx + dy * dy + dz * dz)).toBeCloseTo(30, 3);
    }
  });
});

describe('releaseStarsToHomes', () => {
  it('is a no-op when no stars carry the planetary flag', async () => {
    const objects = makeFakeSceneObjects(5);
    // Stars have no isPlanetaryTarget set
    const p = releaseStarsToHomes(objects);
    await expect(p).resolves.toBeUndefined();
  });

  it('completes (promise resolves) and clears planetary flags on each star', async () => {
    // Drive GSAP forward by fast-ticking its internal timeline. GSAP uses
    // requestAnimationFrame in jsdom which doesn't tick automatically, so we
    // step the global timeline manually until the animation duration passes.
    const objects = makeFakeSceneObjects(3);
    gatherStarsToPlanet(objects, { x: 0, y: 0, z: 0 }, 30);

    const targets = objects.starMeshes.map(s => (s.userData.planetaryReleaseTarget as THREE.Vector3).clone());

    const done = releaseStarsToHomes(objects);

    // Fast-forward GSAP's global timeline past the 1.2s animation window.
    // Using gsap.ticker.tick with inflated delta pushes all tweens to end.
    const tl = gsap.globalTimeline;
    const start = tl.time();
    tl.time(start + 5); // jump 5s into the future — well past any 1.2s tween

    // Let the microtask queue flush so Promise.all resolves
    await done;

    for (let i = 0; i < objects.starMeshes.length; i++) {
      const star = objects.starMeshes[i];
      expect(star.userData.isPlanetaryTarget).toBe(false);
      expect(star.userData.planetaryReleaseTarget).toBeUndefined();
      expect(star.position.x).toBeCloseTo(targets[i].x, 2);
      expect(star.position.y).toBeCloseTo(targets[i].y, 2);
      expect(star.position.z).toBeCloseTo(targets[i].z, 2);
    }
  });
});
