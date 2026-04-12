import './style.css';
import * as THREE from 'three';
import { createStarfield } from './scene/background/starfield';
import { createRenderer } from './scene/renderer';
import { buildOrbitalScene, tickOrbits } from './scene/scene-state';
import type { CaseStudy } from './data/types';
import { mountFilterPanel } from './ui/filter-panel';
import { Tooltip } from './ui/tooltip';
import { DetailPanel } from './ui/detail-panel';

async function boot() {
  const resp = await fetch('/cases.json');
  const cases: CaseStudy[] = await resp.json();

  // Boot starfield (Layer 0)
  const starfieldCanvas = document.getElementById('starfield') as HTMLCanvasElement;
  if (starfieldCanvas) createStarfield(starfieldCanvas);

  // Boot orbital scene (Layer 3)
  const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  const { scene, camera, renderer } = createRenderer(mainCanvas);
  const labelContainer = document.getElementById('star-labels') as HTMLElement;

  const sceneObjects = buildOrbitalScene(cases, 'vertical', scene, labelContainer);

  const filterPanelEl = document.getElementById('filters') as HTMLElement;
  mountFilterPanel(filterPanelEl, sceneObjects, (newMode) => {
    // Stub — Task 14 will implement regroupScene
    sceneObjects.groupMode = newMode;
  });

  // Tick loop
  function tick(t: number) {
    requestAnimationFrame(tick);
    tickOrbits(sceneObjects, t, camera);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  // Raycasting — tooltip + detail panel
  const tooltip = new Tooltip();
  const detailPanel = new DetailPanel();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mainCanvas.addEventListener('pointermove', (e) => {
    if (sceneObjects.filterState.isActive()) { tooltip.hide(); return; }
    mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(sceneObjects.starMeshes);
    if (hits.length > 0) {
      const star = hits[0].object as THREE.Mesh;
      const c = star.userData.caseStudy as CaseStudy;
      const key = (star.userData.starOrbit?.nucleusKey ?? '') as string;
      tooltip.show(c, key, e.clientX, e.clientY);
    } else {
      tooltip.hide();
    }
  });

  mainCanvas.addEventListener('click', (e) => {
    mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    // Check nucleus click first
    const nucleusMeshArr = [...sceneObjects.nucleusMeshes.values()];
    const nucHits = raycaster.intersectObjects(nucleusMeshArr);
    if (nucHits.length > 0) {
      const key = (nucHits[0].object as THREE.Mesh).userData.key as string;
      sceneObjects.mode = 'focused';
      sceneObjects.focusedKey = key;
      // TODO: Task 12 will add focusSphere animation
      return;
    }
    // Star click
    const starHits = raycaster.intersectObjects(sceneObjects.starMeshes);
    if (starHits.length > 0) {
      const c = (starHits[0].object as THREE.Mesh).userData.caseStudy as CaseStudy;
      detailPanel.open(c);
    }
  });
}

boot();
