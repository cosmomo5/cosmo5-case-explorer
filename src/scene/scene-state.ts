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
import type { EnrichedCaseStudy } from '../data/enrich';
import type { ShortlistEntry } from '../data/shortlist-store';

export type SceneMode = 'global' | 'focused';

// ── Staging sphere constants ──────────────────────────────────────────────────
const STAGING_KEY = '__staging__';
const STAGING_COLOR = 0xff6b6b; // coral — distinct from teal and gold design tokens
const NUCLEUS_RADIUS = 6; // matches SphereGeometry radius used for nucleus meshes

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
  /** Timeout ID for delayed staging sphere disposal — prevents race when filter is re-applied within 700ms of clearing */
  _stagingDisposalTimeout: ReturnType<typeof setTimeout> | undefined;
  /** Optional camera-controls ref — set by main.ts after scene creation. Enables camera lean toward staging sphere (FILT-06). */
  controls?: CameraControls;
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
): SceneObjects {
  const groups = groupBy(cases, groupMode);
  const nucleusOrbits = computeNucleusOrbits(groups);

  const nucleusMeshes = new Map<string, THREE.Mesh>();
  const nucleusLabels = new Map<string, HTMLDivElement>();
  const starMeshes: THREE.Mesh[] = [];
  const starOrbits: StarOrbit[] = [];

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
    }
  }

  // Old staging center glow removed — replaced by concentric orbit layout (Phase 4)

  return {
    scene,
    nucleusMeshes,
    nucleusLabels,
    starMeshes,
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
  };
}

function matchesReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ── Staging sphere lifecycle ──────────────────────────────────────────────────

/**
 * Create a synthetic "staging" nucleus at the centroid of existing nucleus positions.
 * Inserts it into nucleusMeshes and nucleusOrbits so the existing click handler
 * (main.ts) picks it up automatically — no new click-handling code required.
 */
function createStagingNucleus(objects: SceneObjects, matchedCases: EnrichedCaseStudy[]): void {
  // Cancel any pending disposal — prevents a delayed disposal from destroying the
  // sphere we're about to create (race condition when filter changes within 700ms of clear).
  if (objects._stagingDisposalTimeout !== undefined) {
    clearTimeout(objects._stagingDisposalTimeout);
    objects._stagingDisposalTimeout = undefined;
  }

  // Compute centroid: average of all existing nucleus positions (excluding staging itself)
  let cx = 0, cy = 0, cz = 0, count = 0;
  for (const [key, mesh] of objects.nucleusMeshes.entries()) {
    if (key === STAGING_KEY) continue;
    cx += mesh.position.x;
    cy += mesh.position.y;
    cz += mesh.position.z;
    count++;
  }
  if (count > 0) { cx /= count; cy /= count; cz /= count; }

  const geo = new THREE.SphereGeometry(NUCLEUS_RADIUS, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: STAGING_COLOR,
    roughness: 0.45,
    metalness: 0.15,
    emissive: STAGING_COLOR,
    emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, cy, cz);
  mesh.userData = {
    key: STAGING_KEY,
    isNucleus: true,
    homePos: new THREE.Vector3(cx, cy, cz),
  };

  // NucleusOrbitData for staging: static (speed=0, phase=0) — positioned by mesh.position
  const orbitData: NucleusOrbitData = {
    key: STAGING_KEY,
    orbitR: 0,
    orbitU: { x: 1, y: 0, z: 0 },
    orbitV: { x: 0, y: 1, z: 0 },
    phase: 0,
    speed: 0,
    cases: matchedCases as CaseStudy[],
  };

  objects.nucleusMeshes.set(STAGING_KEY, mesh);
  objects.nucleusOrbits[STAGING_KEY] = orbitData;
  objects.scene.add(mesh);
}

/**
 * Remove the staging sphere, dispose its GPU resources, and clean up maps.
 */
function disposeStagingNucleus(objects: SceneObjects): void {
  const mesh = objects.nucleusMeshes.get(STAGING_KEY);
  if (!mesh) return;

  gsap.killTweensOf(mesh.position);
  objects.scene.remove(mesh);
  mesh.geometry.dispose();
  (mesh.material as THREE.MeshStandardMaterial).dispose();
  objects.nucleusMeshes.delete(STAGING_KEY);
  delete objects.nucleusOrbits[STAGING_KEY];
  // Restore nucleus positions that were pushed out when staging appeared (FILT-05 reverse)
  restoreStagingPush(objects);
}

/**
 * GSAP-tween matched stars to the staging sphere surface.
 * Stores original positions in userData.originalPosition for the return journey.
 */
function animateStarsToStaging(objects: SceneObjects, matchedCases: EnrichedCaseStudy[]): void {
  const stagingMesh = objects.nucleusMeshes.get(STAGING_KEY);
  if (!stagingMesh) return;

  const stagingPos = stagingMesh.position;
  const matchedIds = new Set(matchedCases.map(c => c.id));

  let idx = 0;
  for (const star of objects.starMeshes) {
    const c = star.userData.caseStudy as CaseStudy;
    if (!matchedIds.has(c.id)) continue;

    // Store original position before first tween
    if (!star.userData.isStagingTarget) {
      star.userData.originalPosition = star.position.clone();
    }

    // Target: distribute matched stars across sphere surface using golden angle
    const angle = idx * Math.PI * (3 - Math.sqrt(5));
    const r = NUCLEUS_RADIUS * 2 * Math.sqrt((idx + 1) / matchedCases.length);
    const target = {
      x: stagingPos.x + r * Math.cos(angle),
      y: stagingPos.y + r * Math.sin(angle),
      z: stagingPos.z,
    };

    gsap.killTweensOf(star.position);
    gsap.to(star.position, {
      x: target.x, y: target.y, z: target.z,
      duration: 0.8, ease: 'power2.out',
    });
    star.userData.isStagingTarget = true;
    idx++;
  }
}

/**
 * Return all staging-target stars to their original nucleus orbit positions.
 */
function returnStarsFromStaging(objects: SceneObjects): void {
  for (const star of objects.starMeshes) {
    if (!star.userData.isStagingTarget) continue;
    const orig = star.userData.originalPosition as THREE.Vector3 | undefined;
    if (!orig) {
      star.userData.isStagingTarget = false;
      continue;
    }
    gsap.killTweensOf(star.position);
    gsap.to(star.position, {
      x: orig.x, y: orig.y, z: orig.z,
      duration: 0.6, ease: 'power2.in',
      onComplete: () => { star.userData.isStagingTarget = false; },
    });
  }
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
  const { nucleusMeshes, nucleusOrbits, starMeshes, filterState } = objects;
  const prefersReduced = matchesReducedMotion();

  // Update nucleus positions (outer orbital)
  for (const [key, nucOrbit] of Object.entries(nucleusOrbits)) {
    // Skip focused nucleus — let it stay where focusSphere positioned it
    if (objects.mode === 'focused' && key === objects.focusedKey) continue;
    const mesh = nucleusMeshes.get(key)!;
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
  const anyFilter = filterState.isActive();
  const inFocused = objects.mode === 'focused';
  const hasHighlight = objects.highlightedRingValue !== null;
  for (const star of starMeshes) {
    if (star.userData.isStagingTarget) continue; // GSAP controls staging stars
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
      if (storedState === 'reading') {
        mat.color.setHex(0xe8b15a); // gold — same as appearance.colorOverride
      } else {
        mat.color.setHex(originalColor);
      }
    } else {
      const isMatch = !anyFilter || matchesFilter(star.userData.caseStudy as CaseStudy, filterState);
      const starState: StarState = isMatch ? 'filterMatch' : 'filterDim';
      mat.opacity = resolveStarAppearance(starState).opacity;
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
}

export function applyFilter(
  objects: SceneObjects,
  newFilter: FilterState,
): void {
  objects.filterState = newFilter;

  if (objects.mode === 'global') {
    // ── Global branch: staging sphere lifecycle ─────────────────────────
    const matchedCases = objects.starMeshes
      .filter(s => matchesFilter(s.userData.caseStudy as CaseStudy, newFilter))
      .map(s => s.userData.caseStudy as EnrichedCaseStudy);

    if (newFilter.isActive() && matchedCases.length > 0) {
      if (!objects.nucleusMeshes.has(STAGING_KEY)) {
        // First filter application: create sphere, push nuclei, lean camera
        createStagingNucleus(objects, matchedCases);
        applyStagingPush(objects);
        zoomTowardStaging(objects);
      } else {
        // Filter changed while staging sphere already present — update star positions
        animateStarsToStaging(objects, matchedCases);
      }
    } else {
      // Filter cleared or no matches: return stars, delayed sphere disposal
      if (objects.nucleusMeshes.has(STAGING_KEY)) {
        returnStarsFromStaging(objects);
        // Cancel any existing pending disposal before scheduling a new one
        if (objects._stagingDisposalTimeout !== undefined) {
          clearTimeout(objects._stagingDisposalTimeout);
        }
        // Delay disposal until return tweens complete (~700ms).
        // Track timeout ID: if a new filter is applied within 700ms of clearing,
        // createStagingNucleus will cancel this pending disposal before creating the sphere.
        objects._stagingDisposalTimeout = setTimeout(() => {
          objects._stagingDisposalTimeout = undefined;
          disposeStagingNucleus(objects);
        }, 700);
      }
    }
  }
  else if (objects.mode === 'focused') {
    // ── Focused branch: dim non-matching stars in place (FILT-07) ──────────
    // Staging sphere is NOT created in focused mode; filter dims stars only.
    const isActive = newFilter.isActive();
    for (const mesh of objects.starMeshes) {
      const caseStudy = mesh.userData.caseStudy as CaseStudy | undefined;
      if (!caseStudy) continue;

      const mat = mesh.material as THREE.MeshBasicMaterial;
      const currentState: StarState = (mesh.userData.starState ?? 'idle') as StarState;

      // Precedence: only apply filterDim/idle when star is in a filter-managed state.
      // Higher states (reading, selected, ghost) are unaffected.
      if (currentState === 'idle' || currentState === 'filterDim' || currentState === 'filterMatch') {
        const matches = !isActive || matchesFilter(caseStudy, newFilter);
        const targetOpacity = matches ? 1.0 : 0.12;
        const targetState: StarState = matches ? 'idle' : 'filterDim';

        // Set state immediately (tick loop reads this; GSAP transition adds smoothness)
        mesh.userData.starState = targetState;

        gsap.killTweensOf(mat);
        gsap.to(mat, {
          opacity: targetOpacity,
          duration: 0.2,
          ease: 'power2.out',
        });
      }
    }
  }
}

export function clearFilter(objects: SceneObjects): void {
  applyFilter(objects, createFilterState());
}

// ── Staging push + camera lean ────────────────────────────────────────────────

/**
 * Push other nuclei outward by ×1.15 radially when staging sphere appears (FILT-05).
 * Stores original positions in userData.preFilterPosition for restore on clear.
 */
function applyStagingPush(objects: SceneObjects): void {
  for (const [key, mesh] of objects.nucleusMeshes.entries()) {
    if (key === STAGING_KEY) continue;
    // Store pre-filter position for restore
    if (!mesh.userData.preFilterPosition) {
      mesh.userData.preFilterPosition = mesh.position.clone();
    }
    const dir = mesh.position.clone().normalize();
    const target = mesh.position.clone().addScaledVector(dir, mesh.position.length() * 0.15);
    gsap.killTweensOf(mesh.position);
    gsap.to(mesh.position, {
      x: target.x, y: target.y, z: target.z,
      duration: 0.3, ease: 'power2.out',
    });
    if (mesh.userData.halo) {
      gsap.to((mesh.userData.halo as THREE.Mesh).position, {
        x: target.x, y: target.y, z: target.z,
        duration: 0.3, ease: 'power2.out',
      });
    }
  }
}

/**
 * Restore nuclei pushed by applyStagingPush back to their pre-filter positions.
 * Called from disposeStagingNucleus path.
 */
function restoreStagingPush(objects: SceneObjects): void {
  for (const [key, mesh] of objects.nucleusMeshes.entries()) {
    if (key === STAGING_KEY) continue;
    const orig = mesh.userData.preFilterPosition as THREE.Vector3 | undefined;
    if (!orig) continue;
    gsap.killTweensOf(mesh.position);
    gsap.to(mesh.position, {
      x: orig.x, y: orig.y, z: orig.z,
      duration: 0.5, ease: 'power2.inOut',
      onComplete: () => { delete mesh.userData.preFilterPosition; },
    });
    if (mesh.userData.halo) {
      gsap.to((mesh.userData.halo as THREE.Mesh).position, {
        x: orig.x, y: orig.y, z: orig.z,
        duration: 0.5, ease: 'power2.inOut',
      });
    }
  }
}

/**
 * Partial camera lean toward the staging sphere position (FILT-06).
 * Uses GSAP proxy pattern (never tween camera-controls directly).
 * This is a 30% lean, NOT a full T1 focus — just a cosmetic hint toward the new sphere.
 */
function zoomTowardStaging(objects: SceneObjects): void {
  const stagingMesh = objects.nucleusMeshes.get(STAGING_KEY);
  if (!stagingMesh || !objects.controls) return;

  const controls = objects.controls;
  const pos = stagingMesh.position;

  // Capture current camera target to interpolate from
  const startTarget = new THREE.Vector3();
  controls.getTarget(startTarget);

  // 30% lean toward staging sphere — cosmetic hint, not full T1 focus
  const leanTarget = new THREE.Vector3().lerpVectors(startTarget, pos, 0.3);

  const proxy = { t: 0 };
  gsap.to(proxy, {
    t: 1,
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: () => {
      const current = new THREE.Vector3().lerpVectors(startTarget, leanTarget, proxy.t);
      controls.moveTo(current.x, current.y, current.z, false);
    },
  });
}


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
        duration: 1.2, ease: 'power2.inOut',
      });
      if (mesh.userData.halo) {
        gsap.to((mesh.userData.halo as THREE.Mesh).position, {
          x: homePos.x * 4.5, y: homePos.y * 4.5, z: homePos.z * 4.5,
          duration: 1.2, ease: 'power2.inOut',
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
            duration: 1.2, ease: 'power2.inOut',
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
          duration: 1.1, ease: 'power2.inOut',
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
        duration: 1.4, ease: 'power2.inOut',
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
          duration: 1.4, ease: 'power2.inOut',
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
 *   - Shortlisted stars: idle / filterMatch / filterDim / undefined → 'selected'
 *   - De-shortlisted stars: 'selected' → 'idle' (only exact 'selected' is reset)
 *   - filterMatch / filterDim states are owned by applyFilter — not reset here
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
      // Promote idle / filterMatch / filterDim / selected → selected
      star.userData.starState = 'selected';
    } else if (currentState === 'selected') {
      // Was shortlisted, now removed — restore to idle
      // filterDim / filterMatch are left alone (applyFilter owns them)
      star.userData.starState = 'idle';
    }
  }
}
