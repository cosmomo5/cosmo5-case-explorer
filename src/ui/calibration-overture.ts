import { gsap } from 'gsap';
import type { PlanetGroup } from '../scene/planet';
import * as THREE from 'three';

export interface CalibrationOvertureHandle {
  element: HTMLElement;
  cancel: () => void;   // kill all overture tweens + remove overlay
}

const STATUS_LINES = [
  { t: 0.3, text: 'OBSERVATORY INITIALIZING' },
  { t: 0.9, text: 'LOCATING CASE LIBRARY' },
  { t: 1.5, text: 'CALIBRATING STARMAP' },
  { t: 2.1, text: 'READY' },
];

/**
 * Mount the Act I + II overlay. Returns a handle whose `cancel()` tears
 * down the overlay and kills all in-flight tweens. Respects
 * prefers-reduced-motion: collapses to a static 0.4s reveal.
 *
 * Timing (full-motion):
 *   0.0s reticle fades in
 *   0.3 / 0.9 / 1.5 / 2.1s status lines fade in sequentially
 *   2.4s calibration text fades out, scan-line sweep begins (1.0s, top → bottom, 2° tilt)
 *   2.7s planet sphere fade-in starts (0.5s, as scan crosses viewport center)
 *   2.85s planet ring fade-in starts (0.5s, target opacity 0.12)
 *   3.5s hint `CLICK TO ENTER THE FIELD` fades in with infinite pulse
 *
 * Reduced-motion: static 0.4s reveal of everything simultaneously. Sphere and
 * ring opacity set directly (NOT via gsap timeline) because
 * gsap.globalTimeline.timeScale(0) at main.ts:29 freezes timeline tweens under
 * reduced-motion.
 */
export function mountCalibrationOverture(opts: {
  planet: PlanetGroup;
}): CalibrationOvertureHandle {
  const overlay = document.createElement('div');
  overlay.className = 'calibration-overture';

  const reticle = document.createElement('div');
  reticle.className = 'co-reticle';
  overlay.appendChild(reticle);

  const statusWrap = document.createElement('div');
  statusWrap.className = 'co-status';
  const lineEls = STATUS_LINES.map(({ text }) => {
    const el = document.createElement('div');
    el.className = 'co-status-line';
    el.textContent = text;
    statusWrap.appendChild(el);
    return el;
  });
  overlay.appendChild(statusWrap);

  const scan = document.createElement('div');
  scan.className = 'co-scan';
  overlay.appendChild(scan);

  const hint = document.createElement('div');
  hint.className = 'co-hint';
  hint.textContent = 'CLICK TO ENTER THE FIELD';
  overlay.appendChild(hint);

  document.body.appendChild(overlay);

  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const sphereMat = opts.planet.sphere.material as THREE.MeshStandardMaterial;
  const ringMat = opts.planet.ring.material as THREE.MeshBasicMaterial;
  const timeline = gsap.timeline({ paused: false });

  if (reduced) {
    // Static 0.4s reveal: reticle + all lines visible immediately.
    // Planet + ring opacity set directly (bypasses frozen globalTimeline).
    overlay.classList.add('reticle-on');
    lineEls.forEach((el) => el.classList.add('show'));
    sphereMat.opacity = 1;
    ringMat.opacity = 0.12;
    // Hint appears after the static reveal settles.
    window.setTimeout(() => {
      overlay.classList.add('hint-on');
    }, 400);
  } else {
    // Act I — reticle softens in, status lines stagger
    timeline.call(() => { overlay.classList.add('reticle-on'); }, [], 0.0);
    STATUS_LINES.forEach((line, i) => {
      timeline.call(() => {
        lineEls[i].classList.add('show');
        if (i > 0) lineEls[i - 1].classList.add('done');
      }, [], line.t);
    });
    // Fade calibration text out at 2.4s
    timeline.to(statusWrap, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 2.4);
    timeline.to(reticle, { opacity: 0.4, duration: 0.3, ease: 'power1.out' }, 2.4);

    // Act II — scan line sweep (top → bottom, 1.0s duration, starts 2.4s)
    gsap.set(scan, { opacity: 1, top: '-8%' });
    timeline.to(scan, {
      top: '108%',
      duration: 1.0,
      ease: 'none',
    }, 2.4);
    timeline.to(scan, { opacity: 0, duration: 0.15, ease: 'power1.out' }, 3.25);

    // Planet fades in as the scan crosses center (~2.7s); sphere 2.7-3.2s, ring 2.85-3.35s
    timeline.to(sphereMat, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 2.7);
    timeline.to(ringMat, { opacity: 0.12, duration: 0.5, ease: 'power2.out' }, 2.85);

    // Hint at 3.5s
    timeline.call(() => { overlay.classList.add('hint-on'); }, [], 3.5);
  }

  const cancel = () => {
    timeline.kill();
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  };

  return { element: overlay, cancel };
}
