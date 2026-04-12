console.log('[v3] main.ts module executing');

import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { createStarfield } from './scene/background/starfield';
import { createRenderer } from './scene/renderer';
import { buildOrbitalScene, tickOrbits, focusSphere, unfocusSphere } from './scene/scene-state';
import type { CaseStudy } from './data/types';
import { mountFilterPanel } from './ui/filter-panel';
import { regroupScene } from './scene/regroup';
import { Tooltip, projectToScreen } from './ui/tooltip';
import { DetailPanel } from './ui/detail-panel';

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(0);
}

// ── DOM refs ──────────────────────────────────────────────────────────────
// elStats kept for future use (contains s-c/s-t/s-s/s-y children)
document.getElementById('stats'); // reference to keep DOM wiring clear
const elSC       = document.getElementById('s-c')           as HTMLElement;
const elST       = document.getElementById('s-t')           as HTMLElement;
const elSS       = document.getElementById('s-s')           as HTMLElement;
const elSY       = document.getElementById('s-y')           as HTMLElement;
const elCrumb    = document.getElementById('crumb')         as HTMLElement;
const elHere     = document.getElementById('here')          as HTMLElement;
const elHereCnt  = document.getElementById('hereCount')     as HTMLElement;
const elBack     = document.getElementById('back')          as HTMLElement;
const elFocusHint= document.getElementById('focus-hint')    as HTMLElement;
const elHero     = document.getElementById('hero')          as HTMLElement;
const elControls = document.getElementById('cosmoControls') as HTMLElement;
const elFiltersWrap = document.getElementById('filtersWrap') as HTMLElement;
const elFiltersTab  = document.getElementById('filtersTab')  as HTMLElement;
const elSearchWrap  = document.getElementById('searchWrap')  as HTMLElement;
const elGlobalSearch= document.getElementById('globalSearch') as HTMLInputElement;
const elGlobalClear = document.getElementById('globalSearchClear') as HTMLElement;
const elLabelSlider = document.getElementById('labelSlider') as HTMLInputElement;
const elLabelVal    = document.getElementById('labelVal')    as HTMLElement;

// ── Animate a count up from 0 to target ───────────────────────────────────
function animateCount(el: HTMLElement, target: number, duration = 1.2): void {
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target, duration, ease: 'power2.out',
    onUpdate: () => { el.textContent = Math.round(obj.val).toString(); },
  });
}

async function boot() {
  try {
    const resp = await fetch('/cases.json');
    if (!resp.ok) throw new Error(`cases.json ${resp.status}`);
    const cases: CaseStudy[] = await resp.json();

    // ── Populate stats strip ─────────────────────────────────────────────
    const territories = new Set(cases.flatMap(c => c.countries));
    const services    = new Set(cases.flatMap(c => c.services));
    const years       = [...new Set(cases.map(c => c.year))].sort();
    const yearRange   = years.length > 1
      ? `${years[0]}–${years[years.length - 1]}`
      : `${years[0]}`;

    // Stagger the count-up slightly for each stat
    animateCount(elSC, cases.length, 1.4);
    setTimeout(() => animateCount(elST, territories.size, 1.2), 120);
    setTimeout(() => animateCount(elSS, services.size, 1.2), 240);
    setTimeout(() => { elSY.textContent = yearRange; }, 300);

    // ── Starfield ────────────────────────────────────────────────────────
    const starfieldCanvas = document.getElementById('starfield') as HTMLCanvasElement;
    if (starfieldCanvas) createStarfield(starfieldCanvas);

    // ── 3D Scene ─────────────────────────────────────────────────────────
    const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    const { scene, camera, renderer, controls } = createRenderer(mainCanvas);
    const labelContainer = document.getElementById('star-labels') as HTMLElement;

    const sceneObjects = buildOrbitalScene(cases, 'vertical', scene, labelContainer);

    // ── Filter panel (inside filters sidebar) ───────────────────────────
    const filterPanelEl = document.getElementById('filters') as HTMLElement;
    mountFilterPanel(filterPanelEl, sceneObjects, (newMode) => {
      regroupScene(sceneObjects, newMode, scene);
    });

    // ── Label opacity control ────────────────────────────────────────────
    let labelThreshold = 0; // 0 = auto (show on hover only), 100 = all visible

    elLabelSlider.addEventListener('input', () => {
      labelThreshold = parseInt(elLabelSlider.value);
      elLabelVal.textContent = labelThreshold === 0 ? 'Auto'
        : labelThreshold === 100 ? 'All'
        : `${labelThreshold}%`;
    });

    // ── Tick loop ─────────────────────────────────────────────────────────
    function tick(t: number) {
      requestAnimationFrame(tick);
      controls.update(); // applies damping
      tickOrbits(sceneObjects, t, camera);

      // Update cluster label positions every frame
      for (const [key, div] of sceneObjects.nucleusLabels.entries()) {
        const mesh = sceneObjects.nucleusMeshes.get(key);
        if (!mesh) continue;
        const screen = projectToScreen(mesh.position, camera);
        div.style.transform = `translate(${screen.x + 14}px, ${screen.y - 14}px)`;
        // Show/hide based on threshold
        const isFocused = sceneObjects.focusedKey === key;
        const showLabel = labelThreshold > 0 || isFocused;
        if (showLabel && !div.classList.contains('show')) div.classList.add('show');
        if (!showLabel && div.classList.contains('show') && !isFocused) div.classList.remove('show');
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);

    // ── Raycasting ───────────────────────────────────────────────────────
    const tooltip = new Tooltip();
    const detailPanel = new DetailPanel();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Suppress click if the user dragged (OrbitControls moves camera)
    let pointerDownPos = new THREE.Vector2();
    let didDrag = false;

    mainCanvas.addEventListener('pointerdown', (e) => {
      pointerDownPos.set(e.clientX, e.clientY);
      didDrag = false;
    });
    mainCanvas.addEventListener('pointermove', (e) => {
      // Track drag threshold
      if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 4) {
        didDrag = true;
      }

      // Tooltip hover
      if (sceneObjects.filterState.isActive()) { tooltip.hide(); return; }
      mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(sceneObjects.starMeshes);
      if (hits.length > 0) {
        const star = hits[0].object as THREE.Mesh;
        const c = star.userData.caseStudy as CaseStudy;
        const key = (star.userData.starOrbit?.nucleusKey ?? '') as string;
        tooltip.show(c, key, e.clientX, e.clientY);
        mainCanvas.style.cursor = 'pointer';
      } else {
        // Check nucleus hover
        const nucHits = raycaster.intersectObjects([...sceneObjects.nucleusMeshes.values()]);
        tooltip.hide();
        mainCanvas.style.cursor = nucHits.length > 0 ? 'pointer' : '';
      }
    });

    mainCanvas.addEventListener('pointerup', (e) => {
      if (didDrag) return; // was a drag, not a click

      mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      raycaster.setFromCamera(mouse, camera);

      // Nucleus click → focus that sphere
      const nucleusMeshArr = [...sceneObjects.nucleusMeshes.values()];
      const nucHits = raycaster.intersectObjects(nucleusMeshArr);
      if (nucHits.length > 0) {
        const key = (nucHits[0].object as THREE.Mesh).userData.key as string;
        enterFocus(key, controls);
        return;
      }

      // Star click → open detail panel
      const starHits = raycaster.intersectObjects(sceneObjects.starMeshes);
      if (starHits.length > 0) {
        const c = (starHits[0].object as THREE.Mesh).userData.caseStudy as CaseStudy;
        detailPanel.open(c);
      }
    });

    // ── Focus / unfocus helpers ───────────────────────────────────────────
    function enterFocus(key: string, orbitCtl = controls): void {
      focusSphere(sceneObjects, key, camera, orbitCtl);

      // Update crumb breadcrumb
      const groupCount = sceneObjects.nucleusOrbits[key]?.cases.length ?? 0;
      elHere.textContent    = key;
      elHereCnt.textContent = `${groupCount} case${groupCount !== 1 ? 's' : ''}`;
      elCrumb.classList.add('on');

      // Hide hero text
      elHero.classList.add('exit');

      // Focus hint bottom-center
      elFocusHint.classList.add('on');
      const fhText = document.getElementById('fh-text');
      if (fhText) fhText.textContent = key;

      // Show all labels, highlight the focused one
      for (const [k, div] of sceneObjects.nucleusLabels.entries()) {
        div.classList.toggle('focused', k === key);
        div.classList.add('show');
      }

      // Body state drives all gated CSS
      document.body.classList.add('constellation');

      // Show controls panel, search bar, filter sidebar
      elControls.classList.add('on');
      elSearchWrap.classList.add('on');
      elFiltersWrap.classList.add('on');

      // Keep pan available in focused mode too — useful for inspection
      orbitCtl.enablePan = true;
    }

    function exitFocus(): void {
      unfocusSphere(sceneObjects, camera, controls);

      elCrumb.classList.remove('on');
      elFocusHint.classList.remove('on');
      elHero.classList.remove('exit');
      elControls.classList.remove('on');
      elSearchWrap.classList.remove('on');

      // Hide all labels (they'll reappear if threshold > 0 in tick)
      for (const div of sceneObjects.nucleusLabels.values()) {
        div.classList.remove('focused', 'show');
      }

      document.body.classList.remove('constellation');
    }

    // ── Keyboard shortcuts ────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (detailPanel.isOpen()) { detailPanel.close(); return; }
        if (sceneObjects.mode === 'focused') { exitFocus(); return; }
      }

      // Arrow keys: cycle through nucleus groups
      if (sceneObjects.mode === 'focused' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const keys = Object.keys(sceneObjects.nucleusOrbits);
        const idx  = keys.indexOf(sceneObjects.focusedKey ?? '');
        if (idx < 0) return;
        const next = e.key === 'ArrowRight'
          ? keys[(idx + 1) % keys.length]
          : keys[(idx - 1 + keys.length) % keys.length];
        enterFocus(next);
      }
    });

    // ── Back button (breadcrumb) ──────────────────────────────────────────
    elBack.addEventListener('click', () => exitFocus());

    // ── Filter tab toggle ─────────────────────────────────────────────────
    elFiltersWrap.classList.add('on'); // always show the tab
    elFiltersTab.addEventListener('click', () => {
      elFiltersWrap.classList.toggle('collapsed');
    });

    // ── Global search (constellation mode search bar) ─────────────────────
    elGlobalSearch.addEventListener('input', () => {
      const q = elGlobalSearch.value.trim().toLowerCase();
      for (const star of sceneObjects.starMeshes) {
        const c = star.userData.caseStudy as CaseStudy;
        const mat = star.material as THREE.MeshBasicMaterial;
        if (!q) {
          mat.opacity = 0.85;
        } else {
          const match = c.client.toLowerCase().includes(q)
            || c.title.toLowerCase().includes(q)
            || c.services.some(s => s.toLowerCase().includes(q))
            || c.countries.some(co => co.toLowerCase().includes(q));
          mat.opacity = match ? 1.0 : 0.08;
        }
      }
      elSearchWrap.classList.toggle('search-match', q.length > 0);
    });

    elGlobalClear.addEventListener('click', () => {
      elGlobalSearch.value = '';
      elGlobalSearch.dispatchEvent(new Event('input'));
    });

    // ── Dismiss loader ────────────────────────────────────────────────────
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('done');

  } catch (err) {
    console.error('[v3 boot error]', err);
    const loader = document.getElementById('loader');
    if (loader) {
      const lk = loader.querySelector('.lk') as HTMLElement | null;
      if (lk) lk.textContent = `Boot error — check console`;
    }
  }
}

console.log('[v3] about to call boot()');
boot()
  .then(() => console.log('[v3] boot() resolved'))
  .catch(e => console.error('[v3] boot() rejected', e));
