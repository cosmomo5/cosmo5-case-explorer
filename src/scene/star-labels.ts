// Phase 17 slice 2 — star-label DOM creation, positioning, distance falloff.
//
// The `.sl` CSS class has existed since v2 but v3's TypeScript refactor never
// ported the DOM logic. This module builds the labels, positions them each
// frame via projectToScreen, and applies a distance-based opacity falloff so
// 116 labels at once don't crowd the observatory view.
//
// Rationale (see DESIGN-STATE.md Phase 17 constraint set):
//  - Near-camera baseline = .12 (registers as "observed, not advertised")
//  - Far-camera baseline = 0 (labels out of reading distance disappear)
//  - Linear ramp between NEAR and FAR — no discrete breakpoints, no popping
//  - Hover ignores falloff (handled by CSS .sl.hover, not here)
//  - Click is gated by an `isClickEnabled` predicate (overture completion)

import * as THREE from 'three';
import type { CaseStudy } from '../data/types';
import { projectToScreen } from '../ui/tooltip';

// Distance thresholds measured in world units. Tuned empirically during
// Playwright UAT on 2026-04-19: the renderer's default camera sits at
// (80, 880, 280) ≈ 927 units from origin in global view, and stars orbit
// nuclei that can be ~300 from origin. So the effective star-to-camera
// distance in global view ranges ~700–1300. In constellation view the
// camera zooms to VIEW_DISTANCE=200 from the focused nucleus, so star
// distance is ~30–80 (well inside NEAR).
//
// NEAR must cover the closest stars in global view so they read visibly;
// FAR must clip the backside of the field so it doesn't advertise.
//
// UAT telemetry (2026-04-19): actual star-to-camera distance distribution
// in global view is min=745, median=986, max=1113. Tuned so closest stars
// sit just above NEAR (full .12 opacity) and farthest stars reach ~0 near FAR.
export const STAR_LABEL_FALLOFF_NEAR = 700;
export const STAR_LABEL_FALLOFF_FAR = 1150;
/**
 * Default baseline opacity for .sl labels at near-camera distance. The
 * observatory register sits at .12 ("observed, not advertised"). The slider
 * in the bottom-right panel sets this live via setStarLabelMaxOpacity().
 */
export const STAR_LABEL_MAX_OPACITY_DEFAULT = 0.12;
export const STAR_LABEL_MAX_OPACITY_CEILING = 0.35; // slider at 100%

let _starLabelMaxOpacity = STAR_LABEL_MAX_OPACITY_DEFAULT;
/** Get the current ceiling. Used by tests and by UI readouts. */
export function getStarLabelMaxOpacity(): number {
  return _starLabelMaxOpacity;
}
/** Set the ceiling. Called by the slider input handler in main.ts. */
export function setStarLabelMaxOpacity(value: number): void {
  _starLabelMaxOpacity = Math.max(0, Math.min(STAR_LABEL_MAX_OPACITY_CEILING, value));
}
/**
 * Map slider value (0–100) to a max-opacity ceiling.
 * 0 = hidden at rest (hover-only); 30 = .12 observed register; 100 = .35 fully readable.
 */
export function sliderValueToMaxOpacity(sliderValue: number): number {
  const clamped = Math.max(0, Math.min(100, sliderValue));
  // Piecewise linear: 0 → 0, 30 → 0.12 (default), 100 → 0.35 (ceiling)
  if (clamped <= 30) {
    return (clamped / 30) * STAR_LABEL_MAX_OPACITY_DEFAULT;
  }
  const t = (clamped - 30) / 70;
  return STAR_LABEL_MAX_OPACITY_DEFAULT + t * (STAR_LABEL_MAX_OPACITY_CEILING - STAR_LABEL_MAX_OPACITY_DEFAULT);
}

export interface StarLabelHandlers {
  onClick: (c: CaseStudy) => void;
  isClickEnabled: () => boolean;
}

export interface StarLabelEntry {
  star: THREE.Mesh;
  label: HTMLDivElement;
}

export function createStarLabel(
  c: CaseStudy,
  container: HTMLElement,
  handlers: StarLabelHandlers,
): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'sl';
  div.textContent = c.client;
  div.dataset.caseId = c.id;

  div.addEventListener('click', (e) => {
    // Guard the overture gate (D-09). During planetary overture, clicks are
    // no-ops. Post-overture they dispatch OPEN_READING.
    if (!handlers.isClickEnabled()) return;
    e.stopPropagation();
    handlers.onClick(c);
  });

  container.appendChild(div);
  return div;
}

// Reused scratch vectors — allocated once, not per tick
const _scratchWorldPos = new THREE.Vector3();
const _scratchCameraPos = new THREE.Vector3();
const _scratchNdc = new THREE.Vector3();

/**
 * Phase 17 slice 3 — in-cluster visibility rule.
 *
 * Inside a focused constellation, only that cluster's star labels get the
 * .show class. Rationale (DESIGN-STATE Phase 17 constraint set): inside a
 * cluster, the user is studying a group; the other 100 stars' labels would
 * crowd without adding signal. Label visibility mirrors star visibility.
 *
 * Called each tick, AFTER .show is added by the main visibility loop. This
 * function filters that set down to the focused cluster when applicable.
 */
export function applyInClusterVisibility(
  entries: StarLabelEntry[],
  viewState: { mode: 'global' | 'focused'; focusedKey: string | null },
): void {
  if (viewState.mode !== 'focused' || !viewState.focusedKey) {
    // Global mode: no filtering, every label keeps its .show state
    return;
  }
  for (const { star, label } of entries) {
    const nucleusKey = star.userData.starOrbit?.nucleusKey as string | undefined;
    if (nucleusKey !== viewState.focusedKey) {
      label.classList.remove('show');
    }
  }
}

export function updateStarLabels(
  entries: StarLabelEntry[],
  camera: THREE.Camera,
  containerWidth: number,
  containerHeight: number,
): void {
  camera.getWorldPosition(_scratchCameraPos);

  for (const { star, label } of entries) {
    star.getWorldPosition(_scratchWorldPos);

    // NDC projection — if z > 1, star is behind the camera; hide.
    _scratchNdc.copy(_scratchWorldPos).project(camera);
    if (_scratchNdc.z > 1 || _scratchNdc.z < -1) {
      label.style.opacity = '0';
      continue;
    }

    // Distance falloff. Use straight-line distance from camera — cheap and
    // visually correct: a star that's farther reads dimmer regardless of
    // which axis it's on.
    const distance = _scratchCameraPos.distanceTo(_scratchWorldPos);
    let factor: number;
    if (distance <= STAR_LABEL_FALLOFF_NEAR) {
      factor = 1.0;
    } else if (distance >= STAR_LABEL_FALLOFF_FAR) {
      factor = 0;
    } else {
      const t = (distance - STAR_LABEL_FALLOFF_NEAR) / (STAR_LABEL_FALLOFF_FAR - STAR_LABEL_FALLOFF_NEAR);
      factor = 1 - t;
    }

    const opacity = _starLabelMaxOpacity * factor;
    // Format to 2 decimals to keep the style string stable across frames.
    label.style.opacity = opacity === 0 ? '0' : opacity.toFixed(2);

    // Position — use projectToScreen which handles the NDC → pixel math and
    // returns bounded {x, y} in container-space. Offset matches the v2
    // cosmos.js positioning (+10, -7).
    const screen = projectToScreen(_scratchWorldPos, camera, containerWidth, containerHeight);
    label.style.transform = `translate(${(screen.x + 10) | 0}px, ${(screen.y - 7) | 0}px)`;
  }
}
