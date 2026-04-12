import * as THREE from 'three';

export interface RendererContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  dispose: () => void;
}

export function createRenderer(canvas: HTMLCanvasElement): RendererContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 3000);
  camera.position.set(0, 0, 900);

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener('resize', onResize);

  return {
    scene,
    camera,
    renderer,
    dispose: () => {
      removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
}
