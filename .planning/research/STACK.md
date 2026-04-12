# Technology Stack — Case Study Explorer v3.1

**Project:** Case Study Explorer — Dimensional Explorer milestone
**Researched:** 2026-04-13
**Scope:** Additions and patterns for the locked stack. Not a framework selection exercise.

---

## Locked Stack (do not change)

These are fixed per PROJECT.md. Research below assumes them as given.

| Technology | Version in use | Role |
|---|---|---|
| Three.js | 0.170.0 | 3D rendering, orbital mechanics, WebGL canvas |
| GSAP | 3.12.0 | All transition animation, star movement, camera tweening |
| TypeScript | 5.0+ | All source code |
| Vite | 6.0.0 | Dev server, build |
| D3 | 7.9.0 | In package.json, unused — available for track line drawing if needed |
| Vitest | 2.0.0 | Unit tests |

**Confidence:** HIGH — verified against project `package.json`.

---

## New Dependencies to Add

One addition is recommended. One is evaluated and rejected.

### Add: `camera-controls` v3.1.2

**Package:** `camera-controls` by yomotsu
**Version:** 3.1.2 (latest — verified via `npm view camera-controls version`)
**Peer dependency:** `three >= 0.126.1` — compatible with 0.170
**Install:** `npm install camera-controls`

**Why:** T1 requires rotating the camera to face-on the target constellation's orbital plane — not just flying to a new position. The existing `focusSphere()` in `scene-state.ts` already uses the correct OrbitControls + GSAP pattern: tween `camera.position` and `orbitControls.target` simultaneously, calling `controls.update()` in `onUpdate`. This avoids the known OrbitControls snap issue (which only occurs when you tween `camera.rotation` directly). The existing pattern works; the problem is that computing the face-on spherical angles manually for each constellation (different orbital plane orientations) and then driving them through GSAP is verbose. `camera-controls` provides `rotateTo(azimuthAngle, polarAngle, enableTransition)` as a first-class method, which is the exact API needed for T1/T5. Its delta-based update loop also handles interrupted transitions more cleanly than coordinating parallel GSAP tweens against `controls.target`.

This is an API quality decision, not a bug fix. The existing approach can work; camera-controls makes T1/T5 substantially cleaner.

**Confidence:** HIGH — version verified via npm registry. API confirmed against GitHub README. Three.js compatibility confirmed.

**Migration path from existing code:** camera-controls wraps a PerspectiveCamera the same way OrbitControls does. `createRenderer()` in `renderer.ts` instantiates OrbitControls — replace it with `CameraControls`. Set `CameraControls.install({ THREE })` once at app init. The controls still run in the animation loop via `cameraControls.update(delta)`.

```typescript
// Before (renderer.ts)
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// ... damping factor, rotate speed, etc.

// After
import CameraControls from 'camera-controls';
CameraControls.install({ THREE });
const controls = new CameraControls(camera, canvas);
// All same config properties available
```

For T1 (face-on rotation to orbital plane):
```typescript
// With enableTransition=true, camera-controls handles the easing internally.
// For synchronization with GSAP timelines, use enableTransition=false and
// drive azimuthAngle/polarAngle targets directly via GSAP:
gsap.to(controls, {
  azimuthAngle: targetAzimuth,
  polarAngle: targetPolar,
  duration: 0.8,
  ease: 'power2.inOut',
  onUpdate: () => controls.update(clock.getDelta()),
});
```

---

### Do NOT add: `XState` or any external FSM library

**Considered:** XState v5
**Verdict:** Skip.

The dimensional state machine has 3 states (global, constellation, shortlist-reading) and 6 transition types. XState earns its place in applications with dozens of states, parallel statecharts, and cross-system event routing. For 3 states, a hand-rolled FSM in a single TypeScript file is smaller, more readable, and easier to debug. No external dependency needed.

---

## Patterns (how to use the existing stack for new features)

These are not library choices. They are the architectural decisions that determine whether the milestone succeeds.

---

### Pattern 1: One GSAP Timeline Per Transition, Killed on Start

**What:** Each of the 6 transitions (T1–T6) is a named `gsap.timeline()`. The timeline reference is stored at module scope. When a new transition fires, kill the previous timeline before creating the new one.

**Why:** The existing `scene-state.ts` fires individual `gsap.to()` calls without tracking references. This creates competing tweens if a user clicks during an animation — the old transition keeps running while the new one starts, both animating `star.position` and `camera.position` simultaneously. For the existing global ↔ focused transitions this is survivable because the interactions are low-frequency. For T1–T6 with stars crossing a divider and a camera rotating to a new plane orientation, it is not.

```typescript
let activeTransition: gsap.core.Timeline | null = null;

function runT1(objects: SceneObjects, controls: CameraControls): void {
  if (activeTransition) activeTransition.kill();
  activeTransition = gsap.timeline({
    onComplete: () => { activeTransition = null; }
  });
  activeTransition
    .to(/* other nuclei opacity */, { opacity: 0, duration: 0.4 }, 0)
    .to(controls, {
      azimuthAngle: targetAzimuth, polarAngle: targetPolar,
      duration: 0.8, ease: 'power2.inOut',
      onUpdate: () => controls.update(clock.getDelta()),
    }, 0)
    // ... remaining T1 steps at labeled positions
}
```

**The overwrite rule:** Set `overwrite: 'auto'` on camera tweens (kills conflicting properties on the same target, preserves non-conflicting ones). For star position tweens in T2, use `overwrite: true` — kill all existing tweens on the star before flying it to the track.

**Confidence:** HIGH — GSAP overwrite documentation confirms this approach. Matches GSAP's documented guidance for user-interruptible animations.

---

### Pattern 2: Single Camera, Single Render Pass — World-Space Zones

**What:** The constellation zone (top) and staging track (bottom) occupy different Y ranges in world space. One camera, one `renderer.render()` call per frame. No `setScissor()` / `setViewport()` per-frame split.

**Why:** Stars fly from the constellation to the track during T2. They are the same Three.js mesh objects — not duplicates. If scissor/viewport were used with two separate render passes, a star mid-flight would be clipped by whichever viewport it temporarily falls outside. The simplest architecture that avoids this: position the track at a lower Y range in world space (e.g., `y < -dividerWorldY`), and let the camera see both zones in one render. The "divider" is a DOM overlay — a CSS `hr` or SVG line positioned absolute over the canvas at the 72%/28% split. No Three.js geometry needed.

When the reading panel slides in (T3/T4), the canvas's CSS `width` changes via CSS transition. Attach a `ResizeObserver` to the canvas container. On resize:

```typescript
const ro = new ResizeObserver(entries => {
  const { width, height } = entries[0].contentRect;
  renderer.setSize(width, height, false); // false = don't touch canvas style
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
ro.observe(canvasContainer);
```

**Note on viewport/scissor:** `setScissor()` + `setViewport()` remain valid if constellation and track need independent zoom/pan controls in a future version. The v3.1 spec does not require this — the camera is locked during constellation focus and the track is non-zoomable. Use the simpler single-render-pass approach now.

**Confidence:** HIGH — world-space zone separation is how the existing codebase already works (`computeStagingPositions` places staged stars at specific 3D coordinates, not at screen positions). Pattern 4 below explains how the track's world Y position is established.

---

### Pattern 3: Shortlist State as a Plain TypeScript Module

**What:** The cross-constellation shortlist is a plain TypeScript module: an array of `caseId` strings, with typed `add()`, `remove()`, `clear()`, and `subscribe()` methods. Subscribers are callbacks stored in a `Set`.

**Why:** The shortlist is read by three separate systems: the constellation (which stars show as selected/ghost), the staging track (what to render), and the reading panel (what to display). None of these systems should own the shortlist — it is shared state. The simplest mechanism that decouples producers from consumers without a framework is a pub/sub store.

```typescript
// src/state/shortlist.ts

type Listener = (ids: readonly string[]) => void;

const _ids: string[] = [];
const _listeners = new Set<Listener>();

function notify(): void {
  const frozen = Object.freeze([..._ids]);
  _listeners.forEach(fn => fn(frozen));
}

export const shortlist = {
  add(id: string): void {
    if (_ids.includes(id)) return;
    _ids.push(id);
    notify();
  },
  remove(id: string): void {
    const i = _ids.indexOf(id);
    if (i === -1) return;
    _ids.splice(i, 1);
    notify();
  },
  clear(): void {
    _ids.length = 0;
    notify();
  },
  getIds(): readonly string[] {
    return Object.freeze([..._ids]);
  },
  subscribe(fn: Listener): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn); // returns unsubscribe
  }
};
```

**Scene-state integration:** Subscribe to shortlist changes to trigger T2 (fly star to track) and T6 (return star to orbit). In the tick loop, `shortlist.getIds()` determines star visual state (idle vs. selected/ghost).

**Confidence:** HIGH — standard vanilla TS pub/sub pattern, zero dependencies.

---

### Pattern 4: Star Flight (T2/T6) — `gsap.to(star.position)` with Two-Step Arc

**What:** Flying a star from its orbital position to the track uses two chained `gsap.to()` calls on `star.position`, with a mid-arc dip to create a parabolic crossing of the divider.

**Why:** The divider crossing is the key animation event. A straight-line path is visually flat. A slight arc — like throwing an object across a threshold — makes the spatial transition feel physical. GSAP drives this directly without any additional libraries:

```typescript
function flyStarToTrack(star: THREE.Mesh, trackPos: THREE.Vector3): gsap.core.Timeline {
  const startPos = star.position.clone();
  const midY = Math.min(startPos.y, trackPos.y) - 40; // arc below the midpoint

  return gsap.timeline({ defaults: { overwrite: true } })
    .to(star.position, {
      x: (startPos.x + trackPos.x) / 2,
      y: midY,
      z: (startPos.z + trackPos.z) / 2,
      duration: 0.3,
      ease: 'power2.in',
    })
    .to(star.position, {
      x: trackPos.x,
      y: trackPos.y,
      z: trackPos.z,
      duration: 0.3,
      ease: 'power2.out',
    });
}
```

**Ghost star mechanic:** When T2 fires on a star, record `star.userData.ghostPosition = star.position.clone()` before the tween starts. The ghost is a separate Three.js mesh placed at `ghostPosition` and set to low opacity with a dashed ring material. The orbit tick loop skips stars with `isStagingTarget = true` (already implemented). When the star is on the track, the ghost renders at the captured position. T6 reverses: fly the track star back to `ghostPosition`, fade the ghost on arrival, `isStagingTarget = false`.

**Track Y position:** The track occupies a fixed world-space Y band below the current camera look direction. During constellation focus, the camera locks to face-on the orbital plane. The track Y is set as a function of that plane's world Y: `trackY = constellationPlaneY - trackOffset`. Establish this once at T1 completion; T2 targets use it.

**Confidence:** HIGH — direct extension of existing `gsap.to(star.position, {...})` pattern in `scene-state.ts`.

---

### Pattern 5: Derived Fields (`proofType`, `impactScale`) — Compute at Load, Store on Star `userData`

**What:** `proofType` and `impactScale` are derived from the `metrics` string at case-load time and stored on each star's `userData.derivedFields`. They are not added to `types.ts` or `cases.json`.

**Why:** These fields are presentation-layer filter concerns. Adding them to `CaseStudy` would require updating `convert.py` and the JSON schema. Deriving at runtime keeps the data pipeline clean and co-locates the derivation logic with the filter system.

```typescript
// In a new src/data/derived-fields.ts
export type ProofType = 'revenue_roas' | 'conversion' | 'awareness' | 'engagement' | 'cost_efficiency';
export type ImpactScale = 1 | 2 | 3 | 4 | 5; // 1=incremental, 5=transformative

export function deriveProofType(metrics: string): ProofType {
  const lower = metrics.toLowerCase();
  if (/roas|revenue|roi/.test(lower)) return 'revenue_roas';
  if (/conv|purchase|click/.test(lower)) return 'conversion';
  if (/reach|awareness|impression/.test(lower)) return 'awareness';
  if (/cost|cpa|efficiency|cpx/.test(lower)) return 'cost_efficiency';
  return 'engagement'; // default
}
```

**Confidence for pattern:** HIGH. **Confidence for regex values:** MEDIUM — the exact classification heuristics need iteration against the actual 116 metrics strings. Test coverage over `cases.json` will be necessary before these filters are production-ready.

---

### Pattern 6: `gsap.context()` for Transition Cleanup

**What:** Wrap each transition's GSAP setup in `gsap.context()`. When the transition is interrupted or the view is unmounted, call `ctx.revert()` to kill all animations and restore properties.

**Why:** Without this, killed transitions leave Three.js objects frozen at mid-animation positions. A star interrupted mid-flight between constellation and track stays at an arbitrary coordinate. `gsap.context().revert()` restores targets to their pre-animation state, which is the correct starting point for the new transition.

```typescript
let activeCtx: gsap.Context | null = null;

function runT1(/* ... */): void {
  if (activeCtx) activeCtx.revert(); // kills + restores all previous
  activeCtx = gsap.context(() => {
    gsap.to(/* ... */);
    gsap.to(/* ... */);
    // All tweens created here are tracked in this context
  });
}
```

**Note:** `revert()` is permanent — it kills the animations and restores inline styles. This is correct here because each transition completely replaces the previous one. If a future use case needs to pause and resume (not replace), use `ctx.kill()` instead, which stops without reverting.

**Confidence:** HIGH — confirmed against GSAP official documentation.

---

### Pattern 7: Track Decorations — SVG Overlay; Track Stars — Three.js at World Y

**What:** The track line and connectors between stars are an SVG element positioned absolute over the canvas (`pointer-events: none`, synchronized with the bottom 28% zone). The track stars themselves remain Three.js meshes at their world-space track position (below the divider Y, with `isStagingTarget = true`).

**Why:** The track line and connectors are screen-space decorations — they don't need 3D depth, they don't need to be raycasted, and their position in world space is not meaningful. SVG is the right tool. D3 is already in the stack and its `d3.line()` + transition API handles the "track line extends outward as stars are added" animation naturally. Stars on the track, however, must remain Three.js meshes because they flew there from 3D space (T2) and can fly back (T6). Rendering them as SVG circles would require projecting world positions to screen coordinates on every frame — that is the problem SVG-overlay solving is supposed to avoid.

**Track SVG pattern:**
```typescript
// A separate SVG element, sibling of the canvas, covering the bottom 28%
const trackSvg = document.querySelector<SVGElement>('#track-overlay');

function updateTrackLine(stagedPositions: DOMPoint[]): void {
  // Use D3 to draw the horizontal line and inter-star connectors
  // stagedPositions are screen-projected from Three.js world positions
  d3.select(trackSvg)
    .selectAll('.track-connector')
    .data(pairs(stagedPositions))
    .join('line')
    .attr('x1', d => d[0].x).attr('y1', d => d[0].y)
    .attr('x2', d => d[1].x).attr('y2', d => d[1].y)
    .attr('class', 'track-connector');
}
```

**Division of labor summary:** Three.js owns the star objects (position, selection state, GSAP animation targets). The SVG overlay owns the track decorations (line, connectors, divider). DOM owns the reading panel. No crossover.

**Confidence:** HIGH — clean separation. Matches the "DOM overlay zones" intent in the spec.

---

## What NOT to Use

| Rejected option | Why rejected |
|---|---|
| React Three Fiber | Codebase is vanilla TS. Adding React requires a full rewrite. |
| Babylon.js / PlayCanvas | Stack locked to Three.js. Not evaluated. |
| XState / Zustand / Jotai | 3-state machine doesn't justify framework overhead. |
| `setScissor`/`setViewport` per-frame splits | Stars mid-flight between zones get clipped. Single render pass avoids this. |
| Separate WebGL contexts | Objects cannot be shared across contexts. Stars could not fly between zones. |
| CSS animation for star transitions | Stars are WebGL objects. Only GSAP can coordinate CSS + Three.js simultaneously. |
| GPGPU / shader-based particle animation | 116 stars. Not remotely close to the threshold where GPGPU is needed. |
| D3 for star animation | GSAP already handles star position tweening. D3's transition model would conflict. |

---

## Installation Summary

```bash
# One new dependency
npm install camera-controls

# No @types needed — types are bundled with camera-controls
```

All other dependencies are already in `package.json`. No version upgrades required.

---

## Confidence Assessment

| Area | Confidence | Basis |
|---|---|---|
| Locked stack versions | HIGH | Verified against `package.json` |
| `camera-controls` v3.1.2 | HIGH | `npm view camera-controls version` |
| `camera-controls` Three.js compatibility | HIGH | Peer dep `>= 0.126.1`, dev dep `^0.178.0` |
| GSAP timeline/overwrite patterns | HIGH | GSAP official docs |
| `gsap.context()` cleanup | HIGH | GSAP official docs |
| Single render pass / world-space zones | HIGH | Direct consequence of Three.js object-sharing requirement |
| ResizeObserver canvas pattern | HIGH | Three.js forum + MDN |
| Shortlist pub/sub store | HIGH | Standard vanilla TS, no external dependency |
| Derived fields regex values | MEDIUM | Pattern is correct; regex needs iteration over actual `metrics` strings |
| SVG track overlay D3 pattern | HIGH | D3 is in stack; pattern is standard |

---

## Sources

- GSAP overwrite modes: [Handling Conflicting Tweens](https://gsap.com/resources/conflict/)
- GSAP timeline methods: [Timeline Docs](https://gsap.com/docs/v3/GSAP/Timeline/)
- GSAP context cleanup: [gsap.context() docs](https://gsap.com/docs/v3/GSAP/gsap.context/)
- OrbitControls + GSAP jitter pattern: [Three.js forum discussion](https://discourse.threejs.org/t/need-help-with-gsap-camera-and-orbitcontrols-animations/17420)
- OrbitControls post-disable snap issue: [GitHub Issue #19917](https://github.com/mrdoob/three.js/issues/19917)
- camera-controls library: [GitHub — yomotsu/camera-controls](https://github.com/yomotsu/camera-controls)
- Three.js multiple scenes / split render: [Three.js Manual](https://threejs.org/manual/en/multiple-scenes.html)
- WebGL multiple views technique: [WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-multiple-views.html)
- Three.js GSAP particle tweening: [Observable — Dea Bankova](https://observablehq.com/@deaxmachina/animating-lots-of-three-js-particles-with-gsap)
