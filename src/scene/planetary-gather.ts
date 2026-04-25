import * as THREE from 'three';
import { gsap } from 'gsap';
import type { SceneObjects } from './scene-state';
import type { StarOrbit } from '../data/types';
import { starPositionAt } from './orbitals/star-orbit';

export interface Vec3 { x: number; y: number; z: number; }

/**
 * Entry Globe spin rate in radians per second.
 * Spec: 0.6× of a reference 1 rev/30s spin = (2π/30) × 0.6 ≈ 0.126 rad/s.
 * Applied in the main.ts tick loop while ViewState.kind === 'planetary'.
 * One full rotation every ~50 seconds — cinematic, unhurried.
 */
export const PLANET_SPIN_RATE = (Math.PI * 2 / 30) * 0.6; // 0.6× reference

/**
 * Fibonacci sphere — evenly distributes N points on the surface of a sphere.
 * Golden-angle + z-linear formulation; no pole clumping.
 */
export function fibonacciSphere(count: number, radius = 1): Vec3[] {
  const points: Vec3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const denom = Math.max(count - 1, 1);
  for (let i = 0; i < count; i++) {
    const z = 1 - (2 * i) / denom;
    const r = Math.sqrt(Math.max(1 - z * z, 0));
    const theta = goldenAngle * i;
    points.push({
      x: Math.cos(theta) * r * radius,
      y: z * radius,
      z: Math.sin(theta) * r * radius,
    });
  }
  return points;
}

/**
 * Place all case-stars on the planet surface. Instant (no animation).
 * Stores each star's orbital home in userData.planetaryReleaseTarget so
 * releaseStarsToHomes can return them. Sets isPlanetaryTarget=true so the
 * tick loop skips these stars until the flag is cleared.
 */
export function gatherStarsToPlanet(
  objects: SceneObjects,
  planetCenter: Vec3,
  surfaceRadius: number,
): void {
  const positions = fibonacciSphere(objects.starMeshes.length, surfaceRadius);
  objects.starMeshes.forEach((star, i) => {
    const orbit = star.userData.starOrbit as StarOrbit;
    const home = starPositionAt(orbit, 0);
    star.userData.planetaryReleaseTarget = new THREE.Vector3(home.x, home.y, home.z);
    const p = positions[i];
    star.position.set(planetCenter.x + p.x, planetCenter.y + p.y, planetCenter.z + p.z);
    star.userData.isPlanetaryTarget = true;
  });
}

/**
 * Phase 16-03 reduced-motion variant. Snaps every planetary-target star to
 * its orbital home synchronously — no tween, no delay. Used by
 * choreographPlanetaryToGlobal's reduced-motion branch per 16-CONTEXT.md
 * (Act IV = fade-swap only; no spatial migration). Home position is derived
 * via `starPositionAt(orbit, 0)` directly from userData.starOrbit — NOT from
 * userData.planetaryReleaseTarget (which may not be set in test fixtures).
 */
export function snapStarsToHomes(objects: SceneObjects): void {
  for (const star of objects.starMeshes) {
    if (!star.userData.isPlanetaryTarget) continue;
    const orbit = star.userData.starOrbit as StarOrbit | undefined;
    if (!orbit) {
      star.userData.isPlanetaryTarget = false;
      continue;
    }
    const home = starPositionAt(orbit, 0);
    star.position.set(home.x, home.y, home.z);
    star.userData.isPlanetaryTarget = false;
    delete star.userData.planetaryReleaseTarget;
  }
}

/**
 * Tween every planetary-target star from its current surface position to its
 * orbital home. Clears the flag on completion so tickOrbits resumes control.
 * Respects prefers-reduced-motion (0.2s instead of 1.2s).
 */
export function releaseStarsToHomes(objects: SceneObjects): Promise<void> {
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const duration = prefersReduced ? 0.2 : 1.2;

  const pending: Promise<void>[] = [];
  for (const star of objects.starMeshes) {
    if (!star.userData.isPlanetaryTarget) continue;
    const target = star.userData.planetaryReleaseTarget as THREE.Vector3 | undefined;
    if (!target) {
      star.userData.isPlanetaryTarget = false;
      continue;
    }
    pending.push(new Promise<void>((resolve) => {
      gsap.killTweensOf(star.position);
      gsap.to(star.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration,
        ease: 'power2.out',
        onComplete: () => {
          star.userData.isPlanetaryTarget = false;
          delete star.userData.planetaryReleaseTarget;
          resolve();
        },
      });
    }));
  }
  return Promise.all(pending).then(() => { /* void */ });
}
