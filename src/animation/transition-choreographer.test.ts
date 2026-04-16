// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

// Capture onComplete callbacks so tests can trigger them manually
let capturedOnComplete: (() => void) | undefined;

vi.mock('gsap', () => ({
  gsap: {
    context: vi.fn((fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    }),
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      capturedOnComplete = vars.onComplete as (() => void) | undefined;
      return { kill: vi.fn() };
    }),
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
