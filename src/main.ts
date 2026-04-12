import './style.css';
import { createStarfield } from './scene/background/starfield';
import { createRenderer } from './scene/renderer';
import { buildOrbitalScene, tickOrbits } from './scene/scene-state';
import type { CaseStudy } from './data/types';
import { mountFilterPanel } from './ui/filter-panel';

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
}

boot();
