import CameraControls from 'camera-controls';
import * as THREE from 'three';
import { gsap } from 'gsap';
import type { SceneObjects } from '../scene/scene-state';
import { disposePlanet, type PlanetGroup } from '../scene/planet';
import { releaseStarsToHomes } from '../scene/planetary-gather';

export interface TransitionState {
  inProgress: boolean;
  currentCtx: gsap.Context | null;
}

/** GSAP proxy pattern: tween a plain object, apply to camera-controls via setLookAt */
function flyTo(
  controls: CameraControls,
  targetPos: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  duration: number,
  onComplete?: () => void,
): gsap.Context {
  const currentPos = controls.getPosition(new THREE.Vector3());
  const currentTarget = controls.getTarget(new THREE.Vector3());
  const proxy = {
    px: currentPos.x, py: currentPos.y, pz: currentPos.z,
    tx: currentTarget.x, ty: currentTarget.y, tz: currentTarget.z,
  };

  return gsap.context(() => {
    gsap.to(proxy, {
      px: targetPos.x, py: targetPos.y, pz: targetPos.z,
      tx: targetLookAt.x, ty: targetLookAt.y, tz: targetLookAt.z,
      duration,
      ease: 'power1.inOut',
      onUpdate: () => {
        // enableTransition=false: GSAP owns timing, not camera-controls smoothing
        controls.setLookAt(proxy.px, proxy.py, proxy.pz, proxy.tx, proxy.ty, proxy.tz, false);
      },
      onComplete,
    });
  });
}

export function createTransitionChoreographer(controls: CameraControls) {
  const state: TransitionState = { inProgress: false, currentCtx: null };

  function cancel(): void {
    if (state.currentCtx) {
      state.currentCtx.revert();
      state.currentCtx = null;
    }
    state.inProgress = false;
    controls.enabled = true;
  }

  // P6-04: never freeze, never flash-cut. Callers guard user input during
  // in-flight transitions with `state.inProgress` (CAM-04 pattern at main.ts).
  // Clicks during T1/T5 are dropped, the current transition runs to its end
  // state — no mid-flight interruption is possible.
  function startT1(
    nucleusPosition: THREE.Vector3,
    faceOnDirection: THREE.Vector3,
    viewDistance: number,
    onComplete?: () => void,
  ): void {
    cancel();
    state.inProgress = true;
    controls.enabled = false;

    const camTarget = nucleusPosition.clone();
    const camPos = camTarget.clone().addScaledVector(faceOnDirection.clone().normalize(), viewDistance);

    state.currentCtx = flyTo(controls, camPos, camTarget, 1.6, () => {
      state.inProgress = false;
      controls.enabled = true;
      onComplete?.();
    });
  }

  function startT5(
    homePos: THREE.Vector3,
    homeTarget: THREE.Vector3,
    onComplete?: () => void,
  ): void {
    cancel();
    state.inProgress = true;
    controls.enabled = false;

    state.currentCtx = flyTo(controls, homePos, homeTarget, 1.8, () => {
      state.inProgress = false;
      controls.enabled = true;
      onComplete?.();
    });
  }

  /**
   * Planetary → global transition. Sequences:
   *   (1) Dim planet core (emissive + opacity)                @ 0.0–0.4s
   *   (2) Release stars from planet surface to their orbital homes @ 0.2–1.4s
   *   (3) Fade planet ring out                                 @ 0.4–1.0s
   *   (4) Fade planet sphere to 0                              @ 1.0–1.6s
   *   (5) Dispose planet + reveal cluster labels               @ 1.6s
   *
   * prefers-reduced-motion compresses everything to ~0.4s via a scale factor.
   * Returns a Promise resolved when the planet has been disposed and labels
   * have been revealed.
   */
  function choreographPlanetaryToGlobal(
    objects: SceneObjects,
    planet: PlanetGroup,
  ): Promise<void> {
    const prefersReduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const s = prefersReduced ? 0.33 : 1.0;

    // (1) Dim planet core
    gsap.to(planet.sphere.material as THREE.MeshStandardMaterial, {
      emissiveIntensity: 0.02,
      opacity: 0.35,
      duration: 0.4 * s,
      ease: 'power1.out',
    });

    // (2) Release stars after a 0.2s lead
    gsap.delayedCall(0.2 * s, () => {
      releaseStarsToHomes(objects);
    });

    // (3) Ring fade
    gsap.to(planet.ring.material as THREE.MeshBasicMaterial, {
      opacity: 0,
      duration: 0.6 * s,
      ease: 'power1.out',
      delay: 0.4 * s,
    });

    // (4) Planet sphere fade to 0 starting at t=1.0s
    const fadePromise = new Promise<void>((resolve) => {
      gsap.to(planet.sphere.material as THREE.MeshStandardMaterial, {
        opacity: 0,
        duration: 0.6 * s,
        delay: 1.0 * s,
        ease: 'power1.in',
        onComplete: () => resolve(),
      });
    });

    return fadePromise.then(() => {
      // (5) Dispose + reveal cluster labels
      disposePlanet(planet, objects.scene);
      for (const [, div] of objects.nucleusLabels.entries()) {
        div.classList.add('show');
      }
    });
  }

  return { state, startT1, startT5, cancel, choreographPlanetaryToGlobal };
}
