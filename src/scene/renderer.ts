import * as THREE from 'three';
import CameraControls from 'camera-controls';
import { applyEntryFraming } from './entry-framing';

CameraControls.install({ THREE });

export interface RendererContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: CameraControls;
  dispose: () => void;
}

export function createRenderer(canvas: HTMLCanvasElement, container: HTMLElement): RendererContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();

  // Lighting — required for MeshStandardMaterial on star spheres.
  // Dim ambient (fill) + directional key from upper-front: gives volumetric shading
  // without washing out the dark-space aesthetic.
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xb0d8ff, 1.4); // cool-blue key
  keyLight.position.set(200, 600, 400);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xffeedd, 0.4); // warm rim from below
  rimLight.position.set(-100, -300, -200);
  scene.add(rimLight);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 3000);
  // Looking from above: Y-dominant position so z-variation in star orbits
  // projects as visible XZ positional spread (V1 used phi=0.15, ~top-down)
  camera.position.set(80, 880, 280);

  // Camera controls — drag to rotate, scroll to zoom, right-click to pan
  const controls = new CameraControls(camera, canvas);
  controls.dampingFactor    = 0.06;
  controls.polarRotateSpeed = 0.55;
  controls.azimuthRotateSpeed = 0.55;
  controls.dollySpeed       = 0.9;
  controls.truckSpeed       = 0.6;
  controls.minDistance       = 150;
  controls.maxDistance       = 1800;
  controls.dollyToCursor    = true;
  // Tilt limits — stop before flipping upside-down
  controls.minPolarAngle    = Math.PI * 0.15;
  controls.maxPolarAngle    = Math.PI * 0.85;
  controls.mouseButtons.left   = CameraControls.ACTION.ROTATE;
  controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
  controls.mouseButtons.right  = CameraControls.ACTION.TRUCK;

  // ResizeObserver on container — fires on window resize AND panel open/close (LAY-04, LAY-05)
  const onContainerResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Re-apply Entry framing if camera has view offset active (Entry state).
    // Pattern B (D-01.1-06): read camera.view?.enabled directly — the authoritative
    // source. During State 1/2, clearViewOffset() sets enabled=false, so this
    // guard is automatically inactive post-Entry. Offsets are absolute pixels and
    // must be re-derived at the new viewport size (RESEARCH.md § "Resize safety").
    if (camera.view?.enabled) {
      applyEntryFraming(camera, w, h);
    }

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); // false = don't override canvas CSS dimensions
  };
  const resizeObserver = new ResizeObserver(onContainerResize);
  resizeObserver.observe(container);
  onContainerResize(); // initialize synchronously — prevents 300x150 flash

  return {
    scene,
    camera,
    renderer,
    controls,
    dispose: () => {
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    },
  };
}
