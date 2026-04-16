import CameraControls from 'camera-controls';
import * as THREE from 'three';
import { gsap } from 'gsap';

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

  return { state, startT1, startT5, cancel };
}
