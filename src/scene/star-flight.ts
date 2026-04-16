import gsap from 'gsap';
import * as THREE from 'three';

/**
 * Star Flight Animation Module
 *
 * Implements the visual flight of stars when they are added to or removed from
 * the reading list. When a star is added (flyStarToTrack), it animates from its
 * orbital position to the track zone. A ghost (dimmed clone) remains at the
 * original position. On removal (returnStarToOrbit), the star animates back and
 * the ghost is disposed.
 *
 * Respects prefers-reduced-motion by swapping position instantly instead of
 * animating.
 */

/** Map of caseId → ghost mesh for tracking and cleanup */
const ghostMap = new Map<string, THREE.Mesh>();

/** Map of caseId → original position for return animations */
const originalPositions = new Map<string, THREE.Vector3>();

/** Check for prefers-reduced-motion at module load time */
const reducedMotion = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

/**
 * Animate a star from its orbital position to the track zone.
 * Creates a ghost (dimmed clone) at the original position.
 *
 * @param star - The star mesh to animate
 * @param caseId - Unique identifier for this case (used as ghost key)
 * @param trackPosition - Target position in world space (track zone center)
 * @param onGhostClick - Optional callback when ghost is clicked
 */
export function flyStarToTrack(
  star: THREE.Mesh,
  caseId: string,
  trackPosition: THREE.Vector3,
  onGhostClick?: () => void
): void {
  // Save original position for return animation
  const originalPos = star.position.clone();
  originalPositions.set(caseId, originalPos);

  // Create ghost at original position
  const ghost = star.clone();

  // Clone and modify material to be semi-transparent
  const ghostMat = (ghost.material as THREE.MeshBasicMaterial).clone();
  ghostMat.opacity = 0.15;
  ghostMat.transparent = true;
  ghost.material = ghostMat;

  // Position ghost at original location and mark it
  ghost.position.copy(originalPos);
  ghost.userData.isGhost = true;
  ghost.userData.caseId = caseId;
  if (onGhostClick) {
    ghost.userData.clickHandler = onGhostClick;
  }

  // Add ghost to scene
  star.parent?.add(ghost);
  ghostMap.set(caseId, ghost);

  // If reduced motion is enabled, instant position swap
  if (reducedMotion) {
    star.position.copy(trackPosition);
    return;
  }

  // Animate star to track position (700ms)
  gsap.to(star.position, {
    x: trackPosition.x,
    y: trackPosition.y,
    z: trackPosition.z,
    duration: 0.7,
    ease: 'power2.inOut',
  });
}

/**
 * Animate a star from the track zone back to its original orbital position.
 * Removes and disposes the ghost mesh.
 *
 * @param star - The star mesh to animate back
 * @param caseId - Unique identifier for this case
 */
export function returnStarToOrbit(
  star: THREE.Mesh,
  caseId: string
): void {
  // Get original position
  const originalPos = originalPositions.get(caseId);
  if (!originalPos) {
    console.warn(`[star-flight] No original position found for case ${caseId}`);
    return;
  }

  // Remove and dispose ghost
  const ghost = ghostMap.get(caseId);
  if (ghost) {
    ghost.parent?.remove(ghost);
    const ghostMat = ghost.material;
    if (ghostMat && typeof (ghostMat as THREE.Material).dispose === 'function') {
      (ghostMat as THREE.Material).dispose();
    }
    ghostMap.delete(caseId);
  }

  originalPositions.delete(caseId);

  // If reduced motion is enabled, instant position swap
  if (reducedMotion) {
    star.position.copy(originalPos);
    return;
  }

  // Animate star back to original position (900ms = 20% slower than entry)
  gsap.to(star.position, {
    x: originalPos.x,
    y: originalPos.y,
    z: originalPos.z,
    duration: 0.9,
    ease: 'power2.inOut',
  });
}

/**
 * Get the ghost mesh for a case (used by raycaster/interaction handlers).
 *
 * @param caseId - Unique identifier for this case
 * @returns The ghost mesh if it exists, undefined otherwise
 */
export function getGhost(caseId: string): THREE.Mesh | undefined {
  return ghostMap.get(caseId);
}

/**
 * Check if a ghost exists for a case.
 *
 * @param caseId - Unique identifier for this case
 * @returns true if ghost exists, false otherwise
 */
export function hasGhost(caseId: string): boolean {
  return ghostMap.has(caseId);
}

/**
 * Clean up all ghosts and state (useful for scene teardown).
 */
export function clearAllGhosts(): void {
  for (const ghost of ghostMap.values()) {
    ghost.parent?.remove(ghost);
    const mat = ghost.material;
    if (mat && typeof (mat as THREE.Material).dispose === 'function') {
      (mat as THREE.Material).dispose();
    }
  }
  ghostMap.clear();
  originalPositions.clear();
}
