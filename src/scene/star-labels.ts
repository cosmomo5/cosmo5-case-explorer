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

// Distance thresholds measured in world units. These values assume the
// existing camera ranges (VIEW_DISTANCE = 200, global view ~300–500 from
// origin). Tune empirically during Playwright UAT if labels read too crowded
// near camera or disappear too early.
export const STAR_LABEL_FALLOFF_NEAR = 250;
export const STAR_LABEL_FALLOFF_FAR = 700;
export const STAR_LABEL_MAX_OPACITY = 0.12;

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

    const opacity = STAR_LABEL_MAX_OPACITY * factor;
    // Format to 2 decimals to keep the style string stable across frames.
    label.style.opacity = opacity === 0 ? '0' : opacity.toFixed(2);

    // Position — use projectToScreen which handles the NDC → pixel math and
    // returns bounded {x, y} in container-space. Offset matches the v2
    // cosmos.js positioning (+10, -7).
    const screen = projectToScreen(_scratchWorldPos, camera, containerWidth, containerHeight);
    label.style.transform = `translate(${(screen.x + 10) | 0}px, ${(screen.y - 7) | 0}px)`;
  }
}
