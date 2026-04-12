import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface RendererContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  dispose: () => void;
}

export function createRenderer(canvas: HTMLCanvasElement): RendererContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 3000);
  // Looking from above: Y-dominant position so z-variation in star orbits
  // projects as visible XZ positional spread (V1 used phi=0.15, ~top-down)
  camera.position.set(80, 880, 280);

  // Orbit controls — drag to rotate, scroll to zoom, right-click to pan
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping   = true;
  controls.dampingFactor   = 0.06;
  controls.rotateSpeed     = 0.55;
  controls.zoomSpeed       = 0.9;
  controls.panSpeed        = 0.6;
  controls.minDistance     = 150;
  controls.maxDistance     = 1800;
  controls.enablePan       = true;
  controls.zoomToCursor    = true;
  // Tilt limits — stop before flipping upside-down
  controls.minPolarAngle   = Math.PI * 0.15;
  controls.maxPolarAngle   = Math.PI * 0.85;
  controls.mouseButtons    = {
    LEFT:   THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT:  THREE.MOUSE.PAN,
  };

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
    controls,
    dispose: () => {
      removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
    },
  };
}
