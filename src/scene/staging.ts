/**
 * Staging sphere lifecycle management
 * 
 * The staging sphere is a temporary filter overlay that animates matched stars 
 * to a centroid sphere when filters are applied.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import type { CaseStudy } from '../data/types';
import type { EnrichedCaseStudy } from '../data/enrich';
import type { NucleusOrbitData } from './orbitals/nucleus-orbit';
import type { SceneObjects } from './scene-state';
import { matchesFilter } from '../data/filter';

// ── Staging sphere constants ──────────────────────────────────────────────────
export const STAGING_KEY = '__staging__';
const STAGING_COLOR = 0xff6b6b; // coral — distinct from teal and gold design tokens
const NUCLEUS_RADIUS = 6; // matches SphereGeometry radius used for nucleus meshes



/**
 * Create a synthetic "staging" nucleus at the centroid of existing nucleus positions.
 * Inserts it into nucleusMeshes and nucleusOrbits so the existing click handler
 * (main.ts) picks it up automatically — no new click-handling code required.
 */
export function createStagingNucleus(objects: SceneObjects, matchedCases: EnrichedCaseStudy[]): void {
  // Cancel any pending disposal — prevents a delayed disposal from destroying the
  // sphere we're about to create (race condition when filter changes within 700ms of clear).
  if (objects._stagingDisposalTimeout !== undefined) {
    clearTimeout(objects._stagingDisposalTimeout);
    objects._stagingDisposalTimeout = undefined;
  }

  // Compute centroid: average of all existing nucleus positions (excluding staging itself)
  let cx = 0, cy = 0, cz = 0, count = 0;
  for (const [key, mesh] of objects.nucleusMeshes.entries()) {
    if (key === STAGING_KEY) continue;
    cx += mesh.position.x;
    cy += mesh.position.y;
    cz += mesh.position.z;
    count++;
  }
  if (count > 0) { cx /= count; cy /= count; cz /= count; }

  const geo = new THREE.SphereGeometry(NUCLEUS_RADIUS, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: STAGING_COLOR,
    roughness: 0.45,
    metalness: 0.15,
    emissive: STAGING_COLOR,
    emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, cy, cz);
  mesh.userData = {
    key: STAGING_KEY,
    isNucleus: true,
    homePos: new THREE.Vector3(cx, cy, cz),
  };

  // NucleusOrbitData for staging: static (speed=0, phase=0) — positioned by mesh.position
  const orbitData: NucleusOrbitData = {
    key: STAGING_KEY,
    orbitR: 0,
    orbitU: { x: 1, y: 0, z: 0 },
    orbitV: { x: 0, y: 1, z: 0 },
    phase: 0,
    speed: 0,
    cases: matchedCases as CaseStudy[],
  };

  objects.nucleusMeshes.set(STAGING_KEY, mesh);
  objects.nucleusOrbits[STAGING_KEY] = orbitData;
  objects.scene.add(mesh);
}

/**
 * Remove the staging sphere, dispose its GPU resources, and clean up maps.
 */
export function disposeStagingNucleus(objects: SceneObjects): void {
  const mesh = objects.nucleusMeshes.get(STAGING_KEY);
  if (!mesh) return;

  gsap.killTweensOf(mesh.position);
  objects.scene.remove(mesh);
  mesh.geometry.dispose();
  (mesh.material as THREE.MeshStandardMaterial).dispose();
  objects.nucleusMeshes.delete(STAGING_KEY);
  delete objects.nucleusOrbits[STAGING_KEY];
  // Restore nucleus positions that were pushed out when staging appeared (FILT-05 reverse)
  restoreStagingPush(objects);
}

/**
 * GSAP-tween matched stars to the staging sphere surface.
 * Stores original positions in userData.originalPosition for the return journey.
 */
export function animateStarsToStaging(objects: SceneObjects, matchedCases: EnrichedCaseStudy[]): void {
  const stagingMesh = objects.nucleusMeshes.get(STAGING_KEY);
  if (!stagingMesh) return;

  const stagingPos = stagingMesh.position;
  const matchedIds = new Set(matchedCases.map(c => c.id));

  let idx = 0;
  for (const star of objects.starMeshes) {
    const c = star.userData.caseStudy as CaseStudy;
    if (!matchedIds.has(c.id)) continue;

    // Store original position before first tween
    if (!star.userData.isStagingTarget) {
      star.userData.originalPosition = star.position.clone();
    }

    // Target: distribute matched stars across sphere surface using golden angle
    const angle = idx * Math.PI * (3 - Math.sqrt(5));
    const r = NUCLEUS_RADIUS * 2 * Math.sqrt((idx + 1) / matchedCases.length);
    const target = {
      x: stagingPos.x + r * Math.cos(angle),
      y: stagingPos.y + r * Math.sin(angle),
      z: stagingPos.z,
    };

    gsap.killTweensOf(star.position);
    gsap.to(star.position, {
      x: target.x, y: target.y, z: target.z,
      duration: 0.8, ease: 'power2.out',
    });
    star.userData.isStagingTarget = true;
    idx++;
  }
}

/**
 * Return all staging-target stars to their original nucleus orbit positions.
 */
export function returnStarsFromStaging(objects: SceneObjects): void {
  for (const star of objects.starMeshes) {
    if (!star.userData.isStagingTarget) continue;
    const orig = star.userData.originalPosition as THREE.Vector3 | undefined;
    if (!orig) {
      star.userData.isStagingTarget = false;
      continue;
    }
    gsap.killTweensOf(star.position);
    gsap.to(star.position, {
      x: orig.x, y: orig.y, z: orig.z,
      duration: 0.6, ease: 'power2.in',
      onComplete: () => { star.userData.isStagingTarget = false; },
    });
  }
}

/**
 * Push other nuclei outward by ×1.15 radially when staging sphere appears (FILT-05).
 * Stores original positions in userData.preFilterPosition for restore on clear.
 */
export function applyStagingPush(objects: SceneObjects): void {
  for (const [key, mesh] of objects.nucleusMeshes.entries()) {
    if (key === STAGING_KEY) continue;
    // Store pre-filter position for restore
    if (!mesh.userData.preFilterPosition) {
      mesh.userData.preFilterPosition = mesh.position.clone();
    }
    const dir = mesh.position.clone().normalize();
    const target = mesh.position.clone().addScaledVector(dir, mesh.position.length() * 0.15);
    gsap.killTweensOf(mesh.position);
    gsap.to(mesh.position, {
      x: target.x, y: target.y, z: target.z,
      duration: 0.3, ease: 'power2.out',
    });
    if (mesh.userData.halo) {
      gsap.to((mesh.userData.halo as THREE.Mesh).position, {
        x: target.x, y: target.y, z: target.z,
        duration: 0.3, ease: 'power2.out',
      });
    }
  }
}

/**
 * Restore nuclei pushed by applyStagingPush back to their pre-filter positions.
 * Called from disposeStagingNucleus path.
 */
export function restoreStagingPush(objects: SceneObjects): void {
  for (const [key, mesh] of objects.nucleusMeshes.entries()) {
    if (key === STAGING_KEY) continue;
    const orig = mesh.userData.preFilterPosition as THREE.Vector3 | undefined;
    if (!orig) continue;
    gsap.killTweensOf(mesh.position);
    gsap.to(mesh.position, {
      x: orig.x, y: orig.y, z: orig.z,
      duration: 0.5, ease: 'power1.inOut',
      onComplete: () => { delete mesh.userData.preFilterPosition; },
    });
    if (mesh.userData.halo) {
      gsap.to((mesh.userData.halo as THREE.Mesh).position, {
        x: orig.x, y: orig.y, z: orig.z,
        duration: 0.5, ease: 'power1.inOut',
      });
    }
  }
}

/**
 * Entry point for staging filtered cases.
 * Computes matched cases from objects.filterState at call time, then either:
 *   - creates the staging sphere (createStagingNucleus + applyStagingPush + zoomTowardStaging) if sphere absent, or
 *   - animates the new matched set to the existing sphere (animateStarsToStaging) if sphere is already present.
 * Returns early with no side effects if filter is inactive or no cases match.
 * Called by the Gather button (Plan 20-03). Safe to call repeatedly.
 */
export function gather(objects: SceneObjects): void {
  // Safety: button should be disabled when filter inactive, but guard here too
  if (!objects.filterState.isActive()) return;

  // Compute matched cases from current filter state
  const matchedCases = objects.starMeshes
    .filter(s => matchesFilter(s.userData.caseStudy as CaseStudy, objects.filterState))
    .map(s => s.userData.caseStudy as EnrichedCaseStudy);

  if (matchedCases.length === 0) return;

  // Decide: create new sphere or update existing
  if (!objects.nucleusMeshes.has(STAGING_KEY)) {
    // First gather: create sphere, push nuclei outward, lean camera toward it
    createStagingNucleus(objects, matchedCases);
    applyStagingPush(objects);
    zoomTowardStaging(objects);
  } else {
    // Sphere already present: animate matched stars to it (replaces existing set)
    animateStarsToStaging(objects, matchedCases);
  }
}

/**
 * Partial camera lean toward the staging sphere position (FILT-06).
 * Uses GSAP proxy pattern (never tween camera-controls directly).
 * This is a 30% lean, NOT a full T1 focus — just a cosmetic hint toward the new sphere.
 */
export function zoomTowardStaging(objects: SceneObjects): void {
  const stagingMesh = objects.nucleusMeshes.get(STAGING_KEY);
  if (!stagingMesh || !objects.controls) return;

  const controls = objects.controls;
  const pos = stagingMesh.position;

  // Capture current camera target to interpolate from
  const startTarget = new THREE.Vector3();
  controls.getTarget(startTarget);

  // 30% lean toward staging sphere — cosmetic hint, not full T1 focus
  const leanTarget = new THREE.Vector3().lerpVectors(startTarget, pos, 0.3);

  const proxy = { t: 0 };
  gsap.to(proxy, {
    t: 1,
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: () => {
      const current = new THREE.Vector3().lerpVectors(startTarget, leanTarget, proxy.t);
      controls.moveTo(current.x, current.y, current.z, false);
    },
  });
}