import * as THREE from 'three';

/**
 * Entry-state camera framing via projection-frustum offset.
 *
 * Shifts the rendered viewport so the planet (at world origin) appears at
 * cx ≈ 72%, cy ≈ 58% of the visible area — matching the EntryQuiet handoff
 * coordinates (cx:72%, cy:58%, FRAME_W=1280, FRAME_H=800).
 *
 * Mechanism: camera.setViewOffset() manipulates the projection matrix directly.
 * Camera position (80, 880, 280) and lookAt target (0,0,0) remain unchanged.
 * camera-controls v3.1.2 does not touch camera.view — safe to use in parallel.
 *
 * Sign convention (THREE.js 0.170 PerspectiveCamera.js:172):
 *   positive offsetX shifts frustum's left edge right → scene shifts LEFT
 *   positive offsetY shifts frustum's top edge down → scene shifts DOWN
 *   so to move origin RIGHT and DOWN: use negative offsets.
 *
 * Formula:
 *   offsetX = -(0.72 - 0.50) * W = -0.22 * W
 *   offsetY = -(0.58 - 0.50) * H = -0.08 * H
 *
 * @see D-01.1-01, D-01.1-02 in .planning/phases/01.1-.../01.1-CONTEXT.md
 * @see 01.1-RESEARCH.md § "Camera Target Offset Math"
 */
export function applyEntryFraming(
  camera: THREE.PerspectiveCamera,
  viewportWidth: number,
  viewportHeight: number
): void {
  const offsetX = -(0.72 - 0.50) * viewportWidth;  // -0.22 * W
  const offsetY = -(0.58 - 0.50) * viewportHeight; // -0.08 * H
  camera.setViewOffset(
    viewportWidth,
    viewportHeight,
    offsetX,
    offsetY,
    viewportWidth,
    viewportHeight
  );
}

/**
 * Restores camera to normal projection (no offset).
 * Calls THREE's clearViewOffset(), which sets camera.view.enabled = false
 * and triggers a projection matrix recalculation on the next render.
 *
 * Call this at ENTER_FIELD dispatch (or after the offset-clearing tween
 * completes in choreographPlanetaryToGlobal).
 */
export function clearEntryFraming(camera: THREE.PerspectiveCamera): void {
  camera.clearViewOffset();
}
