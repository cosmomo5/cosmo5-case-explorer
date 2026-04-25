import * as THREE from 'three';
import { gsap } from 'gsap';
import type CameraControls from 'camera-controls';
import type { CaseStudy, GroupMode } from '../data/types';
import type { NucleusOrbitData } from './orbitals/nucleus-orbit';
import type { StarOrbit } from '../data/types';
import { groupBy } from '../data/grouping';
import { computeNucleusOrbits, nucleusPositionAt } from './orbitals/nucleus-orbit';
import { computeStarOrbit, starPositionAt } from './orbitals/star-orbit';
import { createFilterState, matchesFilter } from '../data/filter';
import type { FilterState } from '../data/filter';
import { resolveStarAppearance } from '../data/star-state';
import type { StarState } from '../data/star-state';
import { computeConcentricOrbits, ringPositionAt, autoSelectRingDimension, buildRingLine, disposeRingLines, getDimensionValue } from './orbitals/concentric';
import type { RingOrbit, RingDimension, ConcentricConfig } from './orbitals/concentric';
import { createStarLabel, type StarLabelHandlers } from './star-labels';
import type { EnrichedCaseStudy } from '../data/enrich';
import type { ShortlistEntry } from '../data/shortlist-store';
import { STAGING_KEY } from './staging';

export type SceneMode = 'global' | 'focused';

export interface ClusterLabelHandlers {
  onEnterFocus: (nucleusKey: string) => void;
  isClickEnabled: () => boolean;
}



/** Convert a THREE hex color int to "r,g,b" string for CSS rgba() usage */
function hexToRgb(hex: number): string {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8)  & 0xff;
  const b =  hex        & 0xff;
  return `${r},${g},${b}`;
}

const NUCLEUS_COLORS: Record<string, number> = {
  'Media':               0x5ecfc0,
  'Performance':         0xe8b15a,
  'Commerce':            0xa9f0d1,
  'Data & Intelligence': 0xb9e4ff,
  'Strategy':            0xffdba4,
  'GEO':                 0xffc6d9,
  'Creative':            0xffe29a,
};
const DEFAULT_COLOR = 0xfff4dd;

export interface SceneObjects {
  scene: THREE.Scene;
  nucleusMeshes: Map<string, THREE.Mesh>;
  nucleusLabels: Map<string, HTMLDivElement>;
  starMeshes: THREE.Mesh[];
  /** Phase 17: per-case .sl label, keyed by case id. Position + opacity updated each tick. */
  starLabels: Map<string, HTMLDivElement>;
  starOrbits: StarOrbit[];
  nucleusOrbits: Record<string, NucleusOrbitData>;
  filterState: FilterState;
  mode: SceneMode;
  focusedKey: string | null;
  groupMode: GroupMode;
  ringLineMeshes: THREE.LineLoop[];
  ringLineValues: string[];
  ringLabelEls: HTMLDivElement[];
  highlightedRingValue: string | null;
  currentRingDimension: RingDimension | null;
  _ringWasHighlighted: boolean;
  /**
   * Phase 16-03: true while the overture owns the viewport. When true, the
   * tick loop hides nucleus meshes and halos so the planet has the frame to
   * itself. Flipped to false by choreographPlanetaryToGlobal's final beat.
   */
  planetaryActive?: boolean;
  /** Timeout ID for delayed staging sphere disposal — prevents race when filter is re-applied within 700ms of clearing */
  _stagingDisposalTimeout: ReturnType<typeof setTimeout> | undefined;
  /** Optional camera-controls ref — set by main.ts after scene creation. Enables camera lean toward staging sphere (FILT-06). */
  controls?: CameraControls;
  /** Optional camera ref — set by main.ts. Used for star flight animation calculations. */
  camera?: THREE.PerspectiveCamera | THREE.OrthographicCamera;
}

// ── Star glow texture cache ───────────────────────────────────────────────────
const _glowCache: Map<number, THREE.CanvasTexture> = new Map();

function createGlowTexture(colorHex: number): THREE.CanvasTexture {
  if (_glowCache.has(colorHex)) return _glowCache.get(colorHex)!;
  const sz = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = sz;
  const ctx = canvas.getContext('2d')!;
  const h = sz / 2;
  const r = (colorHex >> 16) & 0xff;
  const g = (colorHex >> 8) & 0xff;
  const b = colorHex & 0xff;
  const grad = ctx.createRadialGradient(h, h, 0, h, h, h);
  grad.addColorStop(0,    `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(0.25, `rgba(${r},${g},${b},0.45)`);
  grad.addColorStop(0.6,  `rgba(${r},${g},${b},0.1)`);
  grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, sz, sz);
  const tex = new THREE.CanvasTexture(canvas);
  _glowCache.set(colorHex, tex);
  return tex;
}

function createGlowSprite(colorHex: number, starRadius: number, hasPermission: boolean): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: createGlowTexture(colorHex),
    transparent: true,
    opacity: hasPermission ? 0.65 : 0.2,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(starRadius * 7);
  sprite.userData.phase = Math.random() * Math.PI * 2;
  sprite.userData.baseOpacity = hasPermission ? 0.65 : 0.2;
  return sprite;
}

export function buildOrbitalScene(
  cases: CaseStudy[],
  groupMode: GroupMode,
  scene: THREE.Scene,
  labelContainer: HTMLElement,
  starLabelHandlers?: StarLabelHandlers,
  clusterLabelHandlers?: ClusterLabelHandlers,
): SceneObjects {
  const groups = groupBy(cases, groupMode);
  const nucleusOrbits = computeNucleusOrbits(groups);

  const nucleusMeshes = new Map<string, THREE.Mesh>();
  const nucleusLabels = new Map<string, HTMLDivElement>();
  const starMeshes: THREE.Mesh[] = [];
  const starLabels = new Map<string, HTMLDivElement>();
  const starOrbits: StarOrbit[] = [];
  // Handlers default to no-ops when not provided (test scenes don't need them).
  const resolvedStarLabelHandlers: StarLabelHandlers = starLabelHandlers ?? {
    onClick: () => {},
    isClickEnabled: () => false,
  };

  for (const [key, nucOrbit] of Object.entries(nucleusOrbits)) {
    const color = NUCLEUS_COLORS[key] ?? DEFAULT_COLOR;
    const nucPos = nucleusPositionAt(nucOrbit, 0);

    // Compute star orbital radii first (needed for halo sizing)
    const n = nucOrbit.cases.length;
    const rMin = Math.max(30, 15 + Math.sqrt(n) * 8);
    const rMax = Math.max(rMin + 20, rMin + Math.sqrt(n) * 12);

    // Nucleus glow mesh
    const geo = new THREE.SphereGeometry(6, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(nucPos.x, nucPos.y, nucPos.z);
    mesh.userData = { key, isNucleus: true, nucleusOrbit: nucOrbit, starRMax: rMax };
    mesh.userData.homePos = mesh.position.clone();
    scene.add(mesh);
    nucleusMeshes.set(key, mesh);

    // Nucleus halo — sized to contain the star orbital shell
    const haloGeo = new THREE.SphereGeometry(rMax + 10, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, side: THREE.BackSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(mesh.position);
    scene.add(halo);
    mesh.userData.halo = halo;

    // Nucleus label — position is set in the tick loop via projectToScreen
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;
    const glowRgb  = hexToRgb(color);
    const div = document.createElement('div');
    div.className = 'cl';
    div.style.setProperty('--cl-accent', colorHex);
    div.style.setProperty('--cl-glow', `rgba(${glowRgb},0.45)`);
    div.innerHTML = `<span class="cl-name">${key}</span><span class="cl-count">${nucOrbit.cases.length}</span>`;
    if (clusterLabelHandlers) {
      div.addEventListener('click', (e) => {
        if (!clusterLabelHandlers.isClickEnabled()) return;
        e.stopPropagation();
        clusterLabelHandlers.onEnterFocus(key);
      });
    }
    labelContainer.appendChild(div);
    nucleusLabels.set(key, div);

    // Stars for this nucleus
    const groupSize = nucOrbit.cases.length;
    for (const [idx, c] of nucOrbit.cases.entries()) {
      const starOrbit = computeStarOrbit(c, key, nucPos, rMin, rMax, idx, groupSize);
      const initPos = starPositionAt(starOrbit, 0);

      const sGeo = new THREE.SphereGeometry(2.5, 12, 12);
      const sMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const star = new THREE.Mesh(sGeo, sMat);
      star.position.set(initPos.x, initPos.y, initPos.z);
      const hasPermission = (c as any).permission !== false;
      const glowSprite = createGlowSprite(color, 2.5, hasPermission);
      star.add(glowSprite); // child at local (0,0,0) — follows star position automatically
      star.userData = {
        caseStudy: c,
        starOrbit,
        isFiltered: false,
        isStagingTarget: false,
        glowSprite,
        originalColor: color,
      };
      scene.add(star);
      starMeshes.push(star);
      starOrbits.push(starOrbit);

      // Phase 17: per-case star label
      const slDiv = createStarLabel(c, labelContainer, resolvedStarLabelHandlers);
      starLabels.set(c.id, slDiv);
    }
  }

  // Old staging center glow removed — replaced by concentric orbit layout (Phase 4)

  return {
    scene,
    nucleusMeshes,
    nucleusLabels,
    starMeshes,
    starLabels,
    starOrbits,
    nucleusOrbits,
    filterState: createFilterState(),
    mode: 'global',
    focusedKey: null,
    groupMode,
    ringLineMeshes: [],
    ringLineValues: [],
    ringLabelEls: [],
    highlightedRingValue: null,
    currentRingDimension: null,
    _ringWasHighlighted: false,
    _stagingDisposalTimeout: undefined,
    // Phase 16-03: boot in planetary-overture mode — overture owns the viewport
    // until choreographPlanetaryToGlobal's final beat flips this to false.
    planetaryActive: true,
  };
}

function matchesReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}









// Module-scope scratch objects — reused every tick, no allocations in the hot loop
const _tickScratch = new THREE.Vector3();
const _nucPosScratch = { x: 0, y: 0, z: 0 };
const _starPosScratch = { x: 0, y: 0, z: 0 };

export function tickOrbits(
  objects: SceneObjects,
  t: number,
  _camera: THREE.Camera,
): void {
  const { nucleusMeshes, nucleusOrbits, starMeshes } = objects;
  const prefersReduced = matchesReducedMotion();

  // Phase 16-03: while the overture owns the viewport, hide nucleus meshes +
  // halos and skip their per-frame tick updates. This is Gap 1's scene-geometry
  // closure — the planet has the frame to itself during Acts I–IV. The flag is
  // flipped off in choreographPlanetaryToGlobal's final beat.
  const planetaryHidden = objects.planetaryActive === true;

  // Update nucleus positions (outer orbital)
  for (const [key, nucOrbit] of Object.entries(nucleusOrbits)) {
    const mesh = nucleusMeshes.get(key)!;
    // Visibility gate fires regardless of focused/global mode.
    mesh.visible = !planetaryHidden;
    const haloObj = mesh.userData.halo as THREE.Object3D | undefined;
    if (haloObj) haloObj.visible = !planetaryHidden;
    if (planetaryHidden) continue;
    // Skip focused nucleus — let it stay where focusSphere positioned it
    if (objects.mode === 'focused' && key === objects.focusedKey) continue;
    const pos = nucleusPositionAt(nucOrbit, prefersReduced ? 0 : t, _nucPosScratch);
    mesh.position.set(pos.x, pos.y, pos.z);
    if (mesh.userData.halo) (mesh.userData.halo as THREE.Mesh).position.copy(mesh.position);
    // Update star orbit centers to follow nucleus — copy values, don't share reference
    for (const star of starMeshes) {
      const orbit = star.userData.starOrbit as StarOrbit;
      if (orbit.nucleusKey === key) {
        orbit.orbitCenter.x = pos.x;
        orbit.orbitCenter.y = pos.y;
        orbit.orbitCenter.z = pos.z;
      }
    }
  }

  // Update focused nucleus ring orbit centers to track nucleus mesh position
  if (objects.mode === 'focused' && objects.focusedKey) {
    const focusedMesh = nucleusMeshes.get(objects.focusedKey);
    if (focusedMesh) {
      for (const star of starMeshes) {
        const ringOrbit = star.userData.ringOrbit as RingOrbit | undefined;
        if (ringOrbit) {
          ringOrbit.orbitCenter.x = focusedMesh.position.x;
          ringOrbit.orbitCenter.y = focusedMesh.position.y;
          ringOrbit.orbitCenter.z = focusedMesh.position.z;
        }
      }
    }
  }

  // Update star positions (inner orbital, unless staging)
  const inFocused = objects.mode === 'focused';
  const hasHighlight = objects.highlightedRingValue !== null;
  for (const star of starMeshes) {
    if (star.userData.isStagingTarget || star.userData.isPlanetaryTarget) continue; // GSAP controls staging / planetary stars
    const ringOrbit = star.userData.ringOrbit as RingOrbit | undefined;
    if (inFocused && ringOrbit) {
      // Ring orbit path
      const pos = ringPositionAt(ringOrbit, prefersReduced ? 0 : t, _starPosScratch);
      _tickScratch.set(pos.x, pos.y, pos.z);
      star.position.lerp(_tickScratch, 0.08);
    } else {
      // Standard Rodrigues drift
      const orbit = star.userData.starOrbit as StarOrbit;
      const pos = starPositionAt(orbit, prefersReduced ? 0 : t, _starPosScratch);
      _tickScratch.set(pos.x, pos.y, pos.z);
      star.position.lerp(_tickScratch, 0.055);
    }
    // Opacity: ring highlight takes precedence, then filter chain
    const mat = star.material as THREE.MeshBasicMaterial;
    if (inFocused && hasHighlight && ringOrbit) {
      mat.opacity = ringOrbit.ringValue === objects.highlightedRingValue ? 1.0 : 0.2;
    } else if (inFocused) {
      // In focused mode, applyFilter() manages opacity via GSAP and writes
      // userData.starState. The tick loop defers to that stored state to avoid
      // overwriting GSAP tweens every frame.
      // Higher-precedence states (reading/selected/ghost) are never touched here.
      const storedState = (star.userData.starState ?? 'idle') as StarState;
      mat.opacity = resolveStarAppearance(storedState).opacity;
      // Apply gold color when star is in reading state (MeshBasicMaterial has no emissive)
      const originalColor = star.userData.originalColor as number;
      const glowSp = star.userData.glowSprite as THREE.Sprite | undefined;
      if (storedState === 'reading') {
        mat.color.setHex(0xe8b15a); // gold
        if (glowSp) {
          (glowSp.material as THREE.SpriteMaterial).map = createGlowTexture(0xe8b15a);
        }
      } else {
        mat.color.setHex(originalColor);
        if (glowSp) {
          (glowSp.material as THREE.SpriteMaterial).map = createGlowTexture(originalColor);
        }
      }
    } else {
      // Global mode: tick loop does not manage filter opacity — applyFilter() is a
      // pure state mutation; visual updates are handled by applyFilterWave().
      // Restore original color if star was left in a reading state after exiting focus.
      const origC = star.userData.originalColor as number | undefined;
      if (origC !== undefined) {
        const currentHex = mat.color.getHex();
        if (currentHex !== origC) {
          mat.color.setHex(origC);
          const gs = star.userData.glowSprite as THREE.Sprite | undefined;
          if (gs) {
            (gs.material as THREE.SpriteMaterial).map = createGlowTexture(origC);
          }
        }
      }
    }
  }

  // Update ring line highlight state (separate loop — not per-star).
  // Only override opacity when a highlight is active; otherwise let GSAP
  // handle the fade-in (and leave opacity alone once it has settled at 0.35).
  if (inFocused && hasHighlight) {
    objects._ringWasHighlighted = true;
    for (let i = 0; i < objects.ringLineMeshes.length; i++) {
      const lineMat = objects.ringLineMeshes[i].material as THREE.LineBasicMaterial;
      const lineValue = objects.ringLineValues[i];
      lineMat.opacity = lineValue === objects.highlightedRingValue ? 0.7 : 0.1;
    }
  } else if (inFocused && !hasHighlight && objects._ringWasHighlighted) {
    // Only restore defaults if a highlight was previously active, then cleared.
    // This avoids fighting the GSAP fade-in tween on initial ring creation.
    for (let i = 0; i < objects.ringLineMeshes.length; i++) {
      const lineMat = objects.ringLineMeshes[i].material as THREE.LineBasicMaterial;
      lineMat.opacity = 0.35;
    }
    objects._ringWasHighlighted = false;
  }

  // Twinkle pass — oscillate glow sprite opacity with per-sprite random phase.
  // Skip entirely when prefers-reduced-motion is active.
  if (!prefersReduced) {
    for (const star of starMeshes) {
      const sprite = star.userData.glowSprite as THREE.Sprite | undefined;
      if (!sprite) continue;
      const spriteMat = sprite.material as THREE.SpriteMaterial;
      const baseOpacity = (sprite.userData.baseOpacity as number) ?? 0.65;
      spriteMat.opacity = baseOpacity * (0.85 + 0.15 * Math.sin(t * 0.3 + (sprite.userData.phase as number)));
    }
  }
}

export function applyFilter(
  objects: SceneObjects,
  newFilter: FilterState,
): void {
  objects.filterState = newFilter;
}

export function clearFilter(objects: SceneObjects): void {
  applyFilter(objects, createFilterState());
}

/**
 * Wave-propagation filter animation (QRY-03).
 *
 * Dims non-matching stars in distance-sorted waves radiating outward from
 * matching cluster nuclei. Stars nearest the matching nuclei respond first;
 * the full field settles over ~600 ms.
 *
 * Precedence: stars in 'reading', 'selected', or 'ghost' state are skipped.
 * Existing tweens are killed before new ones are started (rapid re-query safety).
 */
export function applyFilterWave(
  objects: SceneObjects,
  filterState: FilterState,
): void {
  // 1. Collect positions of nuclei whose cluster contains at least one matching case
  const matchingNucleiPos: THREE.Vector3[] = [];
  for (const [key, nucOrbit] of Object.entries(objects.nucleusOrbits)) {
    const hasMatch = nucOrbit.cases.some(c => matchesFilter(c, filterState));
    if (hasMatch) {
      const nucleusMesh = objects.nucleusMeshes.get(key);
      if (nucleusMesh) matchingNucleiPos.push(nucleusMesh.position.clone());
    }
  }

  // 2. Sort stars by minimum distance to nearest matching nucleus.
  //    When no nucleus matches, all distances are treated as 0 (identical order).
  const sorted = [...objects.starMeshes].sort((a, b) => {
    if (matchingNucleiPos.length === 0) return 0;
    const distA = Math.min(...matchingNucleiPos.map(np => a.position.distanceTo(np)));
    const distB = Math.min(...matchingNucleiPos.map(np => b.position.distanceTo(np)));
    return distA - distB;
  });

  // 3. Staggered GSAP: ~600 ms total propagation
  const TOTAL_S = 0.6;
  const count = sorted.length;
  // No-match state (P6-02): when the query is active but nothing matches,
  // the whole field dims deeper than the normal non-match dim so the
  // empty result reads as "no observations" rather than "active filter".
  const isActive = filterState.isActive();
  const anyMatch = sorted.some(s => matchesFilter(s.userData.caseStudy as CaseStudy, filterState));
  const nonMatchOpacity = (isActive && !anyMatch) ? 0.08 : 0.12;

  sorted.forEach((star, i) => {
    const state = star.userData.starState as StarState | undefined;
    // Respect precedence: reading / selected / ghost are not owned by filter
    if (state === 'reading' || state === 'selected' || state === 'ghost') return;

    const c = star.userData.caseStudy as CaseStudy;
    const matches = matchesFilter(c, filterState);
    const targetOpacity = matches ? 0.85 : nonMatchOpacity;

    const mat = star.material as THREE.MeshBasicMaterial;
    // Kill any in-progress tween on this material so rapid re-queries don't stack
    gsap.killTweensOf(mat);
    const delay = count > 1 ? (i / (count - 1)) * TOTAL_S : 0;
    gsap.to(mat, { opacity: targetOpacity, duration: 0.15, delay, ease: 'power2.out' });
  });
}

// ── Staging push + camera lean ────────────────────────────────────────────────








// ── Focus: zoom into a nucleus sphere ────────────────────────────────────
export function focusSphere(
  objects: SceneObjects,
  key: string,
  scene: THREE.Scene,
  _camera: THREE.Camera,
  _controls?: CameraControls,
): void {
  objects.mode = 'focused';
  objects.focusedKey = key;
  const nucleus = objects.nucleusMeshes.get(key)!;
  const nucOrbit = objects.nucleusOrbits[key];
  const color = (nucleus.material as THREE.MeshBasicMaterial).color.getHex();

  // ── Compute concentric ring orbits ───────────────────────────────────
  const ownCases = nucOrbit.cases as EnrichedCaseStudy[];
  const ringDimension = autoSelectRingDimension(ownCases, objects.groupMode);
  objects.currentRingDimension = ringDimension;
  // Adapt spacing to ring count: fewer rings → more breathing room (max 30, min 12)
  const uniqueVals = new Set(ownCases.map(c => getDimensionValue(c, ringDimension)));
  const ringCount = Math.min(uniqueVals.size, 8);
  const ringSpacing = Math.max(12, Math.min(30, Math.round(120 / Math.max(ringCount, 1))));
  const config = {
    baseRadius: 40,
    ringSpacing,
    angularSpeedBase: 0.00003,
  };
  const ringOrbits = computeConcentricOrbits(ownCases, ringDimension, nucOrbit, config);

  // Build id → star mesh map for efficient matching
  const starById = new Map<string, THREE.Mesh>();
  for (const star of objects.starMeshes) {
    const c = star.userData.caseStudy as CaseStudy;
    if ((star.userData.starOrbit as StarOrbit).nucleusKey === key) {
      starById.set(c.id, star);
    }
  }

  // Assign ringOrbit to each star's userData
  for (const ringOrbit of ringOrbits) {
    const star = starById.get(ringOrbit.caseStudy.id);
    if (star) star.userData.ringOrbit = ringOrbit;
  }

  // ── Dispose old ring lines + labels, create new ones ──────────────────
  disposeRingLines(objects.ringLineMeshes, scene);
  objects.ringLineMeshes = [];
  objects.ringLineValues = [];
  for (const el of objects.ringLabelEls) el.remove();
  objects.ringLabelEls = [];

  const nucPos = new THREE.Vector3(nucleus.position.x, nucleus.position.y, nucleus.position.z);
  // Plane normal from orbitU × orbitV
  const u = new THREE.Vector3(nucOrbit.orbitU.x, nucOrbit.orbitU.y, nucOrbit.orbitU.z);
  const v = new THREE.Vector3(nucOrbit.orbitV.x, nucOrbit.orbitV.y, nucOrbit.orbitV.z);
  const planeNormal = new THREE.Vector3().crossVectors(u, v).normalize();

  // Collect unique rings in order
  const seenRings = new Map<string, number>(); // ringValue → ringRadius
  for (const ro of ringOrbits) {
    if (!seenRings.has(ro.ringValue)) {
      seenRings.set(ro.ringValue, ro.ringRadius);
    }
  }

  for (const [ringValue, ringRadius] of seenRings.entries()) {
    const line = buildRingLine(ringRadius, nucPos, planeNormal, color);
    // Start invisible; fade in after stars have started arranging
    (line.material as THREE.LineBasicMaterial).opacity = 0;
    scene.add(line);
    objects.ringLineMeshes.push(line);
    objects.ringLineValues.push(ringValue);
    gsap.to((line.material as THREE.LineBasicMaterial), {
      opacity: 0.35,
      duration: 0.8,
      delay: 0.6, // stars start arranging immediately; rings appear after 600ms
    });
  }

  // ── Ring labels (HTML overlays, positioned in tick loop) ───────────────
  const labelContainer = document.getElementById('star-labels');
  if (labelContainer) {
    for (const [ringValue, ringRadius] of seenRings.entries()) {
      const label = document.createElement('div');
      label.className = 'ring-label';
      label.textContent = ringValue;
      label.dataset.ringValue = ringValue;
      label.dataset.ringRadius = String(ringRadius);
      label.style.opacity = '0';
      labelContainer.appendChild(label);
      objects.ringLabelEls.push(label);
      // Fade in with ring lines
      gsap.to(label.style, { opacity: 0.7, duration: 0.6, delay: 0.8 });
    }
  }

  // ── Camera animation is handled by TransitionChoreographer (Phase 3) ──

  // ── Dissolve other nuclei, expand their positions ─────────────────────
  let dissolveIdx = 0;
  for (const [k, mesh] of objects.nucleusMeshes.entries()) {
    if (k === key) continue;
    gsap.to((mesh.material as THREE.MeshBasicMaterial), {
      opacity: 0, duration: 0.8, delay: dissolveIdx * 0.03,
    });
    if (mesh.userData.halo) {
      gsap.to(((mesh.userData.halo as THREE.Mesh).material as THREE.MeshBasicMaterial), {
        opacity: 0, duration: 0.8, delay: dissolveIdx * 0.03,
      });
    }
    // Expand nucleus away from origin
    const homePos = mesh.userData.homePos as THREE.Vector3;
    if (homePos) {
      gsap.to(mesh.position, {
        x: homePos.x * 4.5, y: homePos.y * 4.5, z: homePos.z * 4.5,
        duration: 1.6, ease: 'power1.inOut',
      });
      if (mesh.userData.halo) {
        gsap.to((mesh.userData.halo as THREE.Mesh).position, {
          x: homePos.x * 4.5, y: homePos.y * 4.5, z: homePos.z * 4.5,
          duration: 1.6, ease: 'power1.inOut',
        });
      }
    }
    dissolveIdx++;
  }

  // ── Boost focused nucleus ─────────────────────────────────────────────
  gsap.to((nucleus.material as THREE.MeshBasicMaterial), { opacity: 1.0, duration: 0.6 });

  // ── Stars: dim non-focused, animate own stars to ring positions ───────
  // Pitfall 3 (from research): when T1 focuses the staging sphere, all stars have
  // starOrbit.nucleusKey pointing to their original nucleus — none point to STAGING_KEY.
  // Stars that were staging targets must have their isStagingTarget flag cleared and their
  // position tweens killed so the tick loop can reclaim orbital motion ownership after T1.
  if (key === STAGING_KEY) {
    for (const star of objects.starMeshes) {
      gsap.killTweensOf(star.position);
      star.userData.isStagingTarget = false;
    }
  }
  for (const star of objects.starMeshes) {
    const starNucKey = (star.userData.starOrbit as StarOrbit).nucleusKey;
    if (starNucKey !== key) {
      // Expand non-focused stars with their nucleus
      const starNucMesh = objects.nucleusMeshes.get(starNucKey);
      if (starNucMesh) {
        const homePos = starNucMesh.userData.homePos as THREE.Vector3;
        if (homePos) {
          // Offset of star from nucleus homePos
          const starOrbit = star.userData.starOrbit as StarOrbit;
          const offsetX = starOrbit.orbitCenter.x - homePos.x;
          const offsetY = starOrbit.orbitCenter.y - homePos.y;
          const offsetZ = starOrbit.orbitCenter.z - homePos.z;
          star.userData.isStagingTarget = true;
          gsap.to(star.position, {
            x: homePos.x * 4.5 + offsetX,
            y: homePos.y * 4.5 + offsetY,
            z: homePos.z * 4.5 + offsetZ,
            duration: 1.6, ease: 'power1.inOut',
          });
        }
      }
      gsap.to((star.material as THREE.MeshBasicMaterial), { opacity: 0, duration: 0.6 });
    } else {
      // Own star: animate to ring orbit position
      const ringOrbit = star.userData.ringOrbit as RingOrbit | undefined;
      if (ringOrbit) {
        star.userData.isStagingTarget = true;
        const target = ringPositionAt(ringOrbit, 0);
        gsap.to(star.position, {
          x: target.x, y: target.y, z: target.z,
          duration: 1.1, ease: 'power1.inOut',
          onComplete: () => { star.userData.isStagingTarget = false; },
        });
      }
      gsap.to((star.material as THREE.MeshBasicMaterial), { opacity: 1.0, duration: 0.8 });
    }
  }
}

// ── Unfocus: return to global view ────────────────────────────────────────
export function unfocusSphere(
  objects: SceneObjects,
  scene: THREE.Scene,
  _camera: THREE.Camera,
  _controls?: CameraControls,
): void {
  // Capture before nulling so we know which nucleus was focused
  const prevKey = objects.focusedKey;

  objects.mode = 'global';
  objects.focusedKey = null;
  objects.currentRingDimension = null;
  objects.highlightedRingValue = null;
  objects._ringWasHighlighted = false;
  clearFilter(objects);

  // Fade out ring lines, then dispose — same pattern as switchRingDimension crossfade
  const linesToDispose = objects.ringLineMeshes;
  const labelsToRemove = objects.ringLabelEls;
  objects.ringLineMeshes = [];
  objects.ringLineValues = [];
  objects.ringLabelEls = [];

  for (const el of labelsToRemove) {
    gsap.to(el.style, { opacity: '0', duration: 0.3, onComplete: () => el.remove() });
  }

  if (linesToDispose.length === 0) {
    // Nothing to fade
  } else {
    let doneCount = 0;
    const total = linesToDispose.length;
    for (const line of linesToDispose) {
      gsap.to((line.material as THREE.LineBasicMaterial), {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          doneCount++;
          if (doneCount === total) disposeRingLines(linesToDispose, scene);
        },
      });
    }
  }

  for (const star of objects.starMeshes) {
    star.userData.ringOrbit = undefined;
    if ((star.userData.starOrbit as StarOrbit)?.nucleusKey === prevKey) {
      // Focused-nucleus stars: release to tick now
      star.userData.isStagingTarget = false;
    }
    // Non-focused stars: keep isStagingTarget=true until contraction completes
  }

  // Camera animation is handled by TransitionChoreographer (Phase 3)

  // Contract all nuclei back to homePos
  for (const [k, mesh] of objects.nucleusMeshes.entries()) {
    const homePos = mesh.userData.homePos as THREE.Vector3 | undefined;
    if (homePos) {
      gsap.to(mesh.position, {
        x: homePos.x, y: homePos.y, z: homePos.z,
        duration: 1.8, ease: 'power1.inOut',
        onComplete: () => {
          // Release this nucleus's stars to the tick loop now that it has returned home
          for (const star of objects.starMeshes) {
            if ((star.userData.starOrbit as StarOrbit)?.nucleusKey === k) {
              star.userData.isStagingTarget = false;
            }
          }
        },
      });
      if (mesh.userData.halo) {
        gsap.to((mesh.userData.halo as THREE.Mesh).position, {
          x: homePos.x, y: homePos.y, z: homePos.z,
          duration: 1.8, ease: 'power1.inOut',
        });
      }
    }
    gsap.to((mesh.material as THREE.MeshBasicMaterial), { opacity: 0.9, duration: 0.8 });
    if (mesh.userData.halo) {
      gsap.to(((mesh.userData.halo as THREE.Mesh).material as THREE.MeshBasicMaterial), { opacity: 0.06, duration: 0.8 });
    }
  }

  for (const star of objects.starMeshes) {
    gsap.to((star.material as THREE.MeshBasicMaterial), { opacity: 0.85, duration: 0.8 });
  }
}

export function switchRingDimension(
  objects: SceneObjects,
  scene: THREE.Scene,
  newDimension: RingDimension,
  config: ConcentricConfig,
): void {
  if (!objects.focusedKey || objects.currentRingDimension === newDimension) return;

  const key = objects.focusedKey;
  const nucleusOrbit = objects.nucleusOrbits[key];
  const nucleus = objects.nucleusMeshes.get(key)!;
  const color = (nucleus.material as THREE.MeshBasicMaterial).color.getHex();
  const enrichedCases = nucleusOrbit.cases as EnrichedCaseStudy[];

  // Step 1: Reset highlight state so tick loop doesn't fight opacity tweens
  objects.highlightedRingValue = null;
  objects._ringWasHighlighted = false;

  // Step 2: Capture old references, then immediately clear the live arrays so
  // the tick loop's highlight branch no longer touches these elements.
  const oldLines = objects.ringLineMeshes;
  const oldLabels = objects.ringLabelEls;
  objects.ringLineMeshes = [];
  objects.ringLineValues = [];
  objects.ringLabelEls = [];

  // Step 3: Recompute ring orbits + update star userData immediately so the
  // tick loop starts moving stars toward new ring positions during the crossfade.
  // Derive adaptive spacing from ring count, same formula as focusSphere.
  const switchUniqueVals = new Set(enrichedCases.map(c => getDimensionValue(c, newDimension)));
  const switchRingCount = Math.min(switchUniqueVals.size, 8);
  const adaptiveConfig: ConcentricConfig = {
    ...config,
    ringSpacing: Math.max(12, Math.min(30, Math.round(120 / Math.max(switchRingCount, 1)))),
  };
  const ringOrbits = computeConcentricOrbits(enrichedCases, newDimension, nucleusOrbit, adaptiveConfig);
  objects.currentRingDimension = newDimension;

  for (const star of objects.starMeshes) {
    if (star.userData.starOrbit?.nucleusKey !== key) continue;
    const caseId = (star.userData.caseStudy as CaseStudy).id;
    const ro = ringOrbits.find(r => r.caseStudy.id === caseId);
    if (ro) star.userData.ringOrbit = ro;
  }

  // Step 4: Build new ring geometry (needed in both the immediate and deferred paths)
  const nucCenter = new THREE.Vector3(nucleus.position.x, nucleus.position.y, nucleus.position.z);
  const u = new THREE.Vector3(nucleusOrbit.orbitU.x, nucleusOrbit.orbitU.y, nucleusOrbit.orbitU.z);
  const v = new THREE.Vector3(nucleusOrbit.orbitV.x, nucleusOrbit.orbitV.y, nucleusOrbit.orbitV.z);
  const planeNormal = new THREE.Vector3().crossVectors(u, v).normalize();

  const seenRadii = new Map<string, number>();
  for (const ro of ringOrbits) seenRadii.set(ro.ringValue, ro.ringRadius);

  // Step 5: Create new lines + labels — called after old ones have faded out
  const createNewRings = () => {
    for (const [ringValue, radius] of seenRadii.entries()) {
      const line = buildRingLine(radius, nucCenter, planeNormal, color);
      // Start invisible, replicate focusSphere fade-in pattern (lines 370-378)
      (line.material as THREE.LineBasicMaterial).opacity = 0;
      scene.add(line);
      objects.ringLineMeshes.push(line);
      objects.ringLineValues.push(ringValue);
      gsap.to((line.material as THREE.LineBasicMaterial), {
        opacity: 0.35,
        duration: 0.5,
      });
    }

    const labelContainer = document.getElementById('star-labels');
    if (labelContainer) {
      for (const [ringValue, ringRadius] of seenRadii.entries()) {
        const label = document.createElement('div');
        label.className = 'ring-label';
        label.textContent = ringValue;
        label.dataset.ringValue = ringValue;
        label.dataset.ringRadius = String(ringRadius);
        label.style.opacity = '0';
        labelContainer.appendChild(label);
        objects.ringLabelEls.push(label);
        // Replicate focusSphere label fade-in (line 394)
        gsap.to(label.style, { opacity: '0.7', duration: 0.5 });
      }
    }
  };

  // Step 6: Fade out old elements, then dispose and create new ones
  if (oldLines.length === 0) {
    // No old lines to fade — create immediately
    for (const el of oldLabels) el.remove();
    createNewRings();
  } else {
    // Fade old labels out in parallel (no disposal needed, just DOM removal)
    for (const el of oldLabels) {
      gsap.to(el.style, {
        opacity: '0',
        duration: 0.3,
        onComplete: () => el.remove(),
      });
    }

    // Fade old lines out; dispose and create new rings once all are done
    let completedCount = 0;
    const totalLines = oldLines.length;
    for (const line of oldLines) {
      gsap.to((line.material as THREE.LineBasicMaterial), {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          completedCount++;
          if (completedCount === totalLines) {
            disposeRingLines(oldLines, scene);
            createNewRings();
          }
        },
      });
    }
  }
}

/**
 * Reflect shortlist changes onto star visual states.
 *
 * Precedence rules (matches star-state.ts order):
 *   - 'reading' and 'ghost' are NEVER touched — they have higher precedence
 *   - Shortlisted stars: idle / selected / undefined → 'selected'
 *   - De-shortlisted stars: 'selected' → 'idle' (only exact 'selected' is reset)
 *
 * Called by main.ts on every ShortlistStore mutation (wired in 06-04).
 */
export function syncShortlistToStarState(
  objects: SceneObjects,
  entries: ShortlistEntry[],
): void {
  const shortlistedIds = new Set(entries.map(e => e.caseId));

  for (const star of objects.starMeshes) {
    const caseId = (star.userData.caseStudy as CaseStudy | undefined)?.id;
    if (!caseId) continue;

    const currentState = (star.userData.starState ?? 'idle') as StarState;

    // Never touch reading or ghost — they have higher precedence
    if (currentState === 'reading' || currentState === 'ghost') continue;

    if (shortlistedIds.has(caseId)) {
      // Promote idle / selected → selected
      star.userData.starState = 'selected';
    } else if (currentState === 'selected') {
      // Was shortlisted, now removed — restore to idle
      star.userData.starState = 'idle';
    }
  }
}
