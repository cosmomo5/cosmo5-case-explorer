// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';

// jsdom doesn't implement getContext('2d') — stub it so our canvas-drawing code
// can run without the `canvas` npm package.
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = function () {
    return {
      strokeStyle: '',
      lineWidth: 1,
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
    };
  };
});

import { crtGridTexture, createGraticule } from './graticule';

describe('crtGridTexture', () => {
  it('returns a CanvasTexture', () => {
    const texture = crtGridTexture();
    expect(texture).toBeInstanceOf(THREE.CanvasTexture);
  });

  it('canvas is 1024x1024', () => {
    const texture = crtGridTexture();
    const canvas = texture.image as HTMLCanvasElement;
    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(1024);
  });
});

describe('createGraticule', () => {
  it('returns a Mesh', () => {
    const mesh = createGraticule();
    expect(mesh).toBeInstanceOf(THREE.Mesh);
  });

  it('material is transparent with depthWrite false', () => {
    const mesh = createGraticule();
    const material = mesh.material as THREE.MeshBasicMaterial;
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
  });

  it('opacity is within ATM-01 range (0.06-0.10)', () => {
    const mesh = createGraticule();
    const material = mesh.material as THREE.MeshBasicMaterial;
    expect(material.opacity).toBeGreaterThanOrEqual(0.06);
    expect(material.opacity).toBeLessThanOrEqual(0.10);
  });

  it('position.z is negative (behind stars)', () => {
    const mesh = createGraticule();
    expect(mesh.position.z).toBeLessThan(0);
  });
});
