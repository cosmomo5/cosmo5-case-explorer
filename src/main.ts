console.log('[v3] main.ts module executing');

import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { createStarfield } from './scene/background/starfield';
import { createRenderer } from './scene/renderer';
import { buildOrbitalScene, tickOrbits, focusSphere, unfocusSphere, switchRingDimension, syncShortlistToStarState } from './scene/scene-state';
import type { RingDimension } from './scene/orbitals/concentric';
import type { CaseStudy } from './data/types';
import { enrichCases } from './data/enrich';
import { createViewStateMachine } from './data/view-state';
import { createShortlistStore } from './data/shortlist-store';
import { createLayoutController } from './layout/layout-controller';
import { createTransitionChoreographer } from './animation/transition-choreographer';
import { mountFilterPanel } from './ui/filter-panel';
import { regroupScene } from './scene/regroup';
import { Tooltip, projectToScreen } from './ui/tooltip';
import { ReadingPanel } from './ui/reading-panel';
import { ShortlistTrack } from './ui/shortlist-track';

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(0);
}

const DIM_LABELS: Record<string, string> = {
  proofType: 'Proof type',
  impactBand: 'Impact',
  year: 'Year',
  country: 'Country',
  region: 'Region',
};
const ALL_DIMS: RingDimension[] = ['proofType', 'impactBand', 'year', 'country', 'region'];

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
    const rawCases: CaseStudy[] = await resp.json();
    const cases = enrichCases(rawCases);
    const caseById = new Map<string, CaseStudy>(cases.map(c => [c.id, c]));

    // ── State primitives (boot-level, never inside SceneObjects) ────────
    const viewState = createViewStateMachine();
    const shortlistStore = createShortlistStore();

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
    const sceneContainer = document.getElementById('scene-container') as HTMLElement;
    const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    const { scene, camera, renderer, controls } = createRenderer(mainCanvas, sceneContainer);
    const clock = new THREE.Clock();
    const choreographer = createTransitionChoreographer(controls);
    const VIEW_DISTANCE = 200; // T1 face-on distance; tune empirically
    const labelContainer = document.getElementById('star-labels') as HTMLElement;
    const layoutController = createLayoutController();

    const sceneObjects = buildOrbitalScene(cases, 'vertical', scene, labelContainer);
    sceneObjects.controls = controls;

    // ── ReadingPanel (wired to layoutController, viewState, shortlistStore) ──
    const readingPanel = new ReadingPanel(layoutController, viewState, shortlistStore, sceneObjects);

    // ── ShortlistTrack: mount into bottom track zone ─────────────────────
    const trackContainer = document.getElementById('track-zone')!;
    const shortlistTrack = new ShortlistTrack(
      trackContainer,
      shortlistStore,
      (caseId) => {
        const c = caseById.get(caseId);
        if (c && sceneObjects.focusedKey) readingPanel.open(c, sceneObjects.focusedKey);
      },
      (caseId) => caseById.get(caseId)?.client ?? caseId,
    );
    void shortlistTrack; // consumed by ShortlistStore subscription internally

    // ── Subscribe ShortlistStore → syncShortlistToStarState ──────────────
    shortlistStore.subscribe((entries) => {
      syncShortlistToStarState(sceneObjects, entries);
    });

    // ── Sync ViewState → SceneObjects.mode for backward compatibility ───
    viewState.subscribe((next) => {
      sceneObjects.mode = next.kind === 'global' ? 'global' : 'focused';
      sceneObjects.focusedKey = next.kind === 'constellation' ? next.nucleusKey : null;
    });

    // ── Filter panel (inside filters sidebar) ───────────────────────────
    const filterPanelEl = document.getElementById('filters') as HTMLElement;
    mountFilterPanel(filterPanelEl, sceneObjects, (newMode) => {
      regroupScene(sceneObjects, newMode, scene);
    }, () => {
      exitFocus();
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
      controls.update(clock.getDelta()); // camera-controls requires delta
      tickOrbits(sceneObjects, t, camera);

      // Update cluster label positions every frame
      for (const [key, div] of sceneObjects.nucleusLabels.entries()) {
        const mesh = sceneObjects.nucleusMeshes.get(key);
        if (!mesh) continue;
        const screen = projectToScreen(mesh.position, camera, sceneContainer.clientWidth, sceneContainer.clientHeight);
        div.style.transform = `translate(${screen.x + 14}px, ${screen.y - 14}px)`;
        // Show/hide based on threshold
        const isFocused = sceneObjects.focusedKey === key;
        const showLabel = labelThreshold > 0 || isFocused;
        if (showLabel && !div.classList.contains('show')) div.classList.add('show');
        if (!showLabel && div.classList.contains('show') && !isFocused) div.classList.remove('show');
      }

      // Position ring labels at the rightmost screen-x point of each ring.
      // Analytically: project camera right vector onto the orbital plane, normalize
      // to get the direction that maximises screen-x on each ring.
      if (sceneObjects.mode === 'focused' && sceneObjects.ringLabelEls.length > 0) {
        const focusedNucleus = sceneObjects.focusedKey
          ? sceneObjects.nucleusMeshes.get(sceneObjects.focusedKey)
          : null;
        if (focusedNucleus) {
          const focusedOrbit = sceneObjects.focusedKey
            ? sceneObjects.nucleusOrbits[sceneObjects.focusedKey]
            : null;
          if (focusedOrbit) {
            // Camera right axis in world space
            const camRight = new THREE.Vector3();
            camRight.setFromMatrixColumn(camera.matrixWorld, 0);

            // Project camRight onto the orbit plane (spanned by orbitU and orbitV)
            const ou = new THREE.Vector3(focusedOrbit.orbitU.x, focusedOrbit.orbitU.y, focusedOrbit.orbitU.z);
            const ov = new THREE.Vector3(focusedOrbit.orbitV.x, focusedOrbit.orbitV.y, focusedOrbit.orbitV.z);
            const cosA = camRight.dot(ou);
            const cosB = camRight.dot(ov);
            const projLen = Math.sqrt(cosA * cosA + cosB * cosB);
            // Normalized direction within the plane that most aligns with camera right
            const dirCos = projLen > 0.001 ? cosA / projLen : 1;
            const dirSin = projLen > 0.001 ? cosB / projLen : 0;

            for (let li = 0; li < sceneObjects.ringLabelEls.length; li++) {
              const labelEl = sceneObjects.ringLabelEls[li];
              const radius = parseFloat(labelEl.dataset.ringRadius ?? '0');
              const pt = new THREE.Vector3(
                focusedNucleus.position.x + radius * (ou.x * dirCos + ov.x * dirSin),
                focusedNucleus.position.y + radius * (ou.y * dirCos + ov.y * dirSin),
                focusedNucleus.position.z + radius * (ou.z * dirCos + ov.z * dirSin),
              );
              const s = projectToScreen(pt, camera, sceneContainer.clientWidth, sceneContainer.clientHeight);
              labelEl.style.left = `${s.x + 6}px`;
              labelEl.style.top = `${s.y - 10}px`;
            }
          }
        }
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);

    // ── Raycasting ───────────────────────────────────────────────────────
    const tooltip = new Tooltip();
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line = { threshold: 3 };
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
      const moveRect = mainCanvas.getBoundingClientRect();
      mouse.set(
        ((e.clientX - moveRect.left) / moveRect.width) * 2 - 1,
        -((e.clientY - moveRect.top) / moveRect.height) * 2 + 1,
      );
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

      const upRect = mainCanvas.getBoundingClientRect();
      mouse.set(
        ((e.clientX - upRect.left) / upRect.width) * 2 - 1,
        -((e.clientY - upRect.top) / upRect.height) * 2 + 1,
      );
      raycaster.setFromCamera(mouse, camera);

      // Star click → open reading panel (check BEFORE ring lines — stars sit on rings)
      const starHits = raycaster.intersectObjects(sceneObjects.starMeshes);
      if (starHits.length > 0) {
        if (choreographer.state.inProgress) return; // CAM-04
        const hitMesh = starHits[0].object as THREE.Mesh;
        if (hitMesh.userData.caseStudy && sceneObjects.mode === 'focused') {
          const c = hitMesh.userData.caseStudy as CaseStudy;
          readingPanel.open(c, sceneObjects.focusedKey!);
          return;
        }
        // Global mode clicks fall through (no panel open — they trigger nucleus focus)
        return;
      }

      // Ring click → highlight all cases on that ring (only if no star was hit)
      if (sceneObjects.mode === 'focused' && sceneObjects.ringLineMeshes.length > 0) {
        const ringHits = raycaster.intersectObjects(sceneObjects.ringLineMeshes);
        if (ringHits.length > 0) {
          if (choreographer.state.inProgress) return;
          const hitLine = ringHits[0].object as THREE.LineLoop;
          const hitIndex = sceneObjects.ringLineMeshes.indexOf(hitLine);
          if (hitIndex >= 0) {
            const ringValue = sceneObjects.ringLineValues[hitIndex] ?? null;
            sceneObjects.highlightedRingValue =
              sceneObjects.highlightedRingValue === ringValue ? null : ringValue;
            return;
          }
        }
      }

      // Nucleus click → focus that sphere
      const nucleusMeshArr = [...sceneObjects.nucleusMeshes.values()];
      const nucHits = raycaster.intersectObjects(nucleusMeshArr);
      if (nucHits.length > 0) {
        const key = (nucHits[0].object as THREE.Mesh).userData.key as string;
        enterFocus(key);
        return;
      }

      // Click empty space while focused → unfocus
      if (sceneObjects.mode === 'focused') {
        if (choreographer.state.inProgress) return; // CAM-04
        exitFocus();
      }
    });

    // ── Focus / unfocus helpers ───────────────────────────────────────────
    function enterFocus(key: string): void {
      if (choreographer.state.inProgress) return; // CAM-04: ignore input during transition

      // If already in constellation (arrow-key cycling), exit first
      if (viewState.getState().kind === 'constellation') {
        viewState.dispatch({ type: 'EXIT_CONSTELLATION' });
      }
      viewState.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: key });

      // Compute face-on camera position from orbital plane basis vectors
      const nucOrbit = sceneObjects.nucleusOrbits[key];
      const nucleus = sceneObjects.nucleusMeshes.get(key)!;
      const u = new THREE.Vector3(nucOrbit.orbitU.x, nucOrbit.orbitU.y, nucOrbit.orbitU.z);
      const v = new THREE.Vector3(nucOrbit.orbitV.x, nucOrbit.orbitV.y, nucOrbit.orbitV.z);
      const faceOn = new THREE.Vector3().crossVectors(u, v).normalize();

      choreographer.startT1(nucleus.position, faceOn, VIEW_DISTANCE);
      focusSphere(sceneObjects, key, scene, camera, controls);

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

      // Show focused label only; hide non-focused labels
      for (const [k, div] of sceneObjects.nucleusLabels.entries()) {
        if (k === key) {
          div.classList.add('focused', 'show');
        } else {
          div.classList.remove('focused', 'show'); // hide non-focused labels
        }
      }

      // Body state drives all gated CSS (centralized via LayoutController)
      layoutController.setViewMode('constellation');

      // Show controls panel and filter sidebar
      elControls.classList.add('on');
      elFiltersWrap.classList.add('on');

      // Ring dimension switcher (ORB-03)
      const switcherEl = document.getElementById('ring-switcher')!;
      switcherEl.innerHTML = ALL_DIMS
        .map(d => `<button data-dim="${d}" class="${d === sceneObjects.currentRingDimension ? 'active' : ''}">${DIM_LABELS[d]}</button>`)
        .join('');

      const switcherAbort = new AbortController();
      switcherEl.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-dim]');
        if (!btn) return;
        const newDim = btn.getAttribute('data-dim') as RingDimension;
        if (newDim === sceneObjects.currentRingDimension) return;

        switchRingDimension(sceneObjects, scene, newDim, {
          baseRadius: 40,
          ringSpacing: 15,
          angularSpeedBase: 0.00003,
        });

        switcherEl.querySelectorAll<HTMLButtonElement>('[data-dim]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-dim') === newDim);
        });
      }, { signal: switcherAbort.signal });

      (sceneObjects as any)._switcherAbort = switcherAbort;

    }

    function exitFocus(): void {
      if (choreographer.state.inProgress) return; // CAM-04: ignore input during transition

      // Clean up ring switcher
      const abort = (sceneObjects as any)._switcherAbort as AbortController | undefined;
      abort?.abort();
      delete (sceneObjects as any)._switcherAbort;
      const switcherEl = document.getElementById('ring-switcher');
      if (switcherEl) switcherEl.innerHTML = '';

      if (viewState.getState().kind === 'constellation') {
        viewState.dispatch({ type: 'EXIT_CONSTELLATION' });
      }

      choreographer.startT5(
        new THREE.Vector3(80, 880, 280),
        new THREE.Vector3(0, 0, 0),
        () => { renderer.render(scene, camera); }, // force render after T5 for raycast matrix
      );
      unfocusSphere(sceneObjects, scene, camera, controls);

      elCrumb.classList.remove('on');
      elFocusHint.classList.remove('on');
      elHero.classList.remove('exit');
      elControls.classList.remove('on');

      // Hide all labels (they'll reappear if threshold > 0 in tick)
      for (const div of sceneObjects.nucleusLabels.values()) {
        div.classList.remove('focused', 'show');
      }

      layoutController.setViewMode('global');
    }

    // ── Keyboard shortcuts ────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (choreographer.state.inProgress) return; // CAM-04
        // Step-back: unwind one layer at a time
        if (readingPanel.isOpen()) { readingPanel.close(); return; }
        if (sceneObjects.highlightedRingValue !== null) {
          sceneObjects.highlightedRingValue = null;
          sceneObjects._ringWasHighlighted = true; // trigger restore in tick
          return;
        }
        if (sceneObjects.mode === 'focused') { exitFocus(); return; }
      }

      // TODO(Phase 5): remove Shift+P — reading panel replaces this
      if (e.key === 'P' && e.shiftKey) {
        const panelSlot = document.getElementById('reading-panel-slot');
        if (panelSlot) {
          const isOpen = panelSlot.classList.contains('open');
          layoutController.setPanelOpen(!isOpen);
        }
      }

      // Arrow keys: if reading panel is open, cycle cases on the current ring
      if (readingPanel.isOpen() && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        // Extract cases on the current ring, sorted by ringIndex then angleOffset
        const ringCases = sceneObjects.starMeshes
          .filter(s => s.userData.ringOrbit != null)
          .map(s => s.userData.caseStudy as CaseStudy)
          .sort((a, b) => {
            const ra = sceneObjects.starMeshes.find(s => (s.userData.caseStudy as CaseStudy)?.id === a.id)?.userData.ringOrbit;
            const rb = sceneObjects.starMeshes.find(s => (s.userData.caseStudy as CaseStudy)?.id === b.id)?.userData.ringOrbit;
            if (!ra || !rb) return 0;
            if (ra.ringIndex !== rb.ringIndex) return ra.ringIndex - rb.ringIndex;
            return ra.angleOffset - rb.angleOffset;
          });
        if (ringCases.length > 0) {
          readingPanel.navigate(e.key === 'ArrowRight' ? 'next' : 'prev', ringCases);
        }
        e.preventDefault();
        return;
      }

      // Arrow keys: cycle through nucleus groups (panel closed)
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
    elBack.addEventListener('click', () => {
      if (choreographer.state.inProgress) return;
      // Step-back: clear highlight first, then exit focus
      if (sceneObjects.highlightedRingValue !== null) {
        sceneObjects.highlightedRingValue = null;
        sceneObjects._ringWasHighlighted = true;
        return;
      }
      exitFocus();
    });

    // ── Home button — reset camera to default position ───────────────────
    const elHomeBtn = document.getElementById('homeBtn');
    if (elHomeBtn) {
      elHomeBtn.addEventListener('click', () => {
        if (sceneObjects.mode === 'focused') {
          exitFocus();
        } else {
          // Just reset camera to home
          controls.setLookAt(80, 880, 280, 0, 0, 0, true);
        }
      });
    }

    // ── Filter tab toggle ─────────────────────────────────────────────────
    // .on is added by enterConstellation (line 369); no need to add it on boot
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
