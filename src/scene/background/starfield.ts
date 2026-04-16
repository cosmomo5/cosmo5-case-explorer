import * as THREE from 'three';
import { createGraticule } from './graticule';

export function createStarfield(canvas: HTMLCanvasElement): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
  cam.position.z = 400;

  function layer(n: number, spread: number, sz: number, col: number): THREE.Points {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p[i*3]   = (Math.random() - 0.5) * spread;
      p[i*3+1] = (Math.random() - 0.5) * spread;
      p[i*3+2] = (Math.random() - 0.5) * spread;
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({
      color: col, size: sz, sizeAttenuation: true, transparent: true,
      opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
  }

  const far = layer(1400, 1600, 0.9, 0xfff4dd);
  const mid = layer(500,  900,  1.4, 0xffdba4);
  const nr  = layer(120,  600,  2.6, 0xe8b15a);
  scene.add(createGraticule(), far, mid, nr);

  let rafId: number;
  function tick(t: number) {
    t *= 0.0001;
    far.rotation.y = t * 0.3; far.rotation.x = t * 0.1;
    mid.rotation.y = t * 0.6; mid.rotation.x = t * 0.2;
    nr.rotation.y  = t * 0.9; nr.rotation.x  = t * 0.3;
    renderer.render(scene, cam);
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  const onResize = () => {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(rafId);
    removeEventListener('resize', onResize);
    renderer.dispose();
  };
}
