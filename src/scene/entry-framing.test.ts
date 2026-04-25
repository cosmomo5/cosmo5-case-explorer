import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { applyEntryFraming, clearEntryFraming } from './entry-framing';

describe('Entry framing (setViewOffset)', () => {
  let camera: THREE.PerspectiveCamera;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 3000);
    camera.position.set(80, 880, 280);
  });

  describe('applyEntryFraming', () => {
    it('computes offsetX correctly: -(0.72 - 0.50) * W', () => {
      const W = 1280;
      const H = 800;
      applyEntryFraming(camera, W, H);
      // Expected: -0.22 * W = -281.6
      expect(camera.view).toBeDefined();
      expect(camera.view?.offsetX).toBeCloseTo(-281.6, 1);
    });

    it('computes offsetY correctly: -(0.58 - 0.50) * H', () => {
      const W = 1280;
      const H = 800;
      applyEntryFraming(camera, W, H);
      // Expected: -0.08 * H = -64
      expect(camera.view).toBeDefined();
      expect(camera.view?.offsetY).toBeCloseTo(-64, 1);
    });

    it('sets view.enabled = true', () => {
      applyEntryFraming(camera, 1280, 800);
      expect(camera.view?.enabled).toBe(true);
    });

    it('re-applies with new viewport dimensions on resize', () => {
      // First application: 1280×800
      applyEntryFraming(camera, 1280, 800);
      const offset1X = camera.view?.offsetX;

      // Second application: 1920×1080 (resize)
      applyEntryFraming(camera, 1920, 1080);
      // Expected new offsets: -0.22*1920=-422.4, -0.08*1080=-86.4
      expect(camera.view?.offsetX).toBeCloseTo(-422.4, 1);
      expect(camera.view?.offsetY).toBeCloseTo(-86.4, 1);
      expect(camera.view?.offsetX).not.toBe(offset1X); // verify it changed
    });
  });

  describe('clearEntryFraming', () => {
    it('disables view offset after apply', () => {
      applyEntryFraming(camera, 1280, 800);
      expect(camera.view?.enabled).toBe(true);

      clearEntryFraming(camera);
      expect(camera.view?.enabled).toBe(false);
    });

    it('allows re-apply after clear', () => {
      applyEntryFraming(camera, 1280, 800);
      clearEntryFraming(camera);
      applyEntryFraming(camera, 1280, 800); // re-apply should work
      expect(camera.view?.enabled).toBe(true);
      expect(camera.view?.offsetX).toBeCloseTo(-281.6, 1);
    });
  });
});
