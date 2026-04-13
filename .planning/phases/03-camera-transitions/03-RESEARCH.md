# Phase 3: Camera Transitions - Research

**Researched:** 2026-04-13
**Domain:** Three.js camera animation, camera-controls v3.1.2 migration, GSAP integration
**Confidence:** HIGH (primary sources: Context7, official camera-controls docs, direct codebase reads)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAM-01 | T1: Global→Constellation (~1200ms), camera rotates to face orbital plane, other nuclei dissolve | GSAP proxy + `setLookAt(false)` pattern; face-on direction = `cross(orbitU, orbitV)`; nuclei fade-out via GSAP stagger |
| CAM-02 | T5: Constellation→Global (~1400ms, ~20% slower than T1), pulls back + rotates away, nuclei fade in | Same proxy pattern; restore camera position to `{80, 880, 280}`; fade nuclei back in |
| CAM-03 | Other nuclei dissolve (opacity→0) during T1 — not fly away | GSAP opacity tween with stagger; do NOT move nucleus meshes |
| CAM-04 | `transitionInProgress` flag; all input handlers check it; input locked until transition completes | `controls.enabled = false` during flight; `transitionInProgress` boolean guards remaining input paths |
| CAM-05 | Replace OrbitControls with camera-controls v3.1.2; no observable regression in orbit/zoom | Migration checklist in Architecture Patterns section; `CameraControls.install({ THREE })` required |
| CAM-06 | TransitionChoreographer: one GSAP timeline per transition, killed via `gsap.context().revert()` | `src/animation/transition-choreographer.ts`; context created per transition, stored, reverted on interrupt |
</phase_requirements>

---

## Summary

Phase 3 replaces OrbitControls with camera-controls v3.1.2 and implements two camera transitions: T1 (global→constellation, ~1200ms) where the camera drops to face a nucleus's orbital plane, and T5 (constellation→global, ~1400ms) where it pulls back to the home position. The migration is surgical — camera-controls is API-compatible with OrbitControls for orbit/zoom/pan, but the `update()` call signature changes from `update()` to `update(deltaSeconds)`, requiring a THREE.Clock in the tick loop.

The critical GSAP integration pattern is the proxy approach: tween a plain `{px, py, pz, tx, ty, tz}` object and call `controls.setLookAt(px, py, pz, tx, ty, tz, false)` (with `enableTransition=false`) inside `onUpdate`. Direct property tweening of `controls.azimuthAngle` or `controls.polarAngle` silently fails — these are getter-only properties. This pattern gives GSAP exact timing control (precise 1200ms/1400ms) while camera-controls handles matrix updates cleanly.

The face-on camera position for T1 is computed from the nucleus's orbital plane: `cross(orbitU, orbitV)` in `nucleus-orbit.ts` gives the orbital plane normal. The camera lands at `nucleus.position + normalize(cross(orbitU, orbitV)) * viewDistance`. The new `TransitionChoreographer` module lives at `src/animation/transition-choreographer.ts` and owns all GSAP timelines for T1/T5. The tick loop calls `controls.update(clock.getDelta())` with a `THREE.Clock` added in Phase 3.

**Primary recommendation:** Install camera-controls v3.1.2, add THREE.Clock, implement TransitionChoreographer with the GSAP proxy pattern, migrate renderer.ts/scene-state.ts/main.ts in a single wave.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| camera-controls | 3.1.2 | Replaces OrbitControls; smooth camera control with programmatic API | Per project decision (STATE.md). Provides `setLookAt()`, `rotateTo()`, clean damping. |
| gsap | (already installed) | Drives all transition timelines via proxy pattern | Already project dependency; GSAP proxy + `setLookAt(false)` is the correct integration |
| three | (already installed) | THREE.Clock provides deltaSeconds for `controls.update(delta)` | Clock is built-in to three |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| THREE.Clock | built-in | Provides `getDelta()` in seconds for camera-controls tick | Required — camera-controls `update(delta)` needs delta in seconds, not ms |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP proxy + `setLookAt(false)` | camera-controls native smoothTime | Native is approximate (SmoothDamp), can't guarantee exact 1200ms/1400ms. GSAP proxy gives exact duration. |
| camera-controls | OrbitControls (stay) | OrbitControls has no programmatic `setLookAt` or `rotateTo`; can't implement clean transitions without camera-controls |
| `controls.enabled = false` | `transitionInProgress` flag only | `enabled = false` blocks all OrbitControl-style drag at the controls level; flag handles remaining input paths (keyboard, raycaster). Both needed. |

**Installation:**
```bash
npm install camera-controls
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 3 additions)

```
src/
├── animation/
│   └── transition-choreographer.ts   # NEW: owns all T1/T5 GSAP timelines
├── scene/
│   ├── renderer.ts                   # MODIFY: OrbitControls → CameraControls
│   ├── scene-state.ts                # MODIFY: focusSphere/unfocusSphere → choreographer calls
│   └── orbitals/
│       └── nucleus-orbit.ts          # READ-ONLY: orbitU/orbitV for T1 face-on computation
└── main.ts                           # MODIFY: controls.update() → controls.update(clock.getDelta())
```

### Pattern 1: GSAP Proxy + setLookAt (CORRECT Integration)

**What:** Tween a plain proxy object; call `controls.setLookAt(px,py,pz, tx,ty,tz, false)` inside `onUpdate`. The `false` arg disables camera-controls' own smoothing — GSAP owns the timing.

**When to use:** Any programmatic camera move requiring exact duration (T1, T5).

**Example:**
```typescript
// Source: camera-controls official docs + advisor verification
import CameraControls from 'camera-controls';
import * as THREE from 'three';
import { gsap } from 'gsap';

// CORRECT: proxy pattern
function flyTo(
  controls: CameraControls,
  targetPos: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  duration: number,
  onComplete?: () => void,
): gsap.Context {
  const proxy = {
    px: controls.getPosition(new THREE.Vector3()).x,
    py: controls.getPosition(new THREE.Vector3()).y,
    pz: controls.getPosition(new THREE.Vector3()).z,
    tx: controls.getTarget(new THREE.Vector3()).x,
    ty: controls.getTarget(new THREE.Vector3()).y,
    tz: controls.getTarget(new THREE.Vector3()).z,
  };

  const ctx = gsap.context(() => {
    gsap.to(proxy, {
      px: targetPos.x, py: targetPos.y, pz: targetPos.z,
      tx: targetLookAt.x, ty: targetLookAt.y, tz: targetLookAt.z,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        controls.setLookAt(proxy.px, proxy.py, proxy.pz, proxy.tx, proxy.ty, proxy.tz, false);
      },
      onComplete,
    });
  });
  return ctx;
}

// WRONG — silently fails (azimuthAngle is getter-only):
// gsap.to(controls, { azimuthAngle: targetAzimuth, polarAngle: targetPolar, duration: 0.8 });
```

### Pattern 2: TransitionChoreographer Module

**What:** A module that owns transition state, creates GSAP contexts, exposes `startT1()` / `startT5()` / `cancel()`.

**When to use:** All T1/T5 transitions flow through this module — never call GSAP directly for camera moves from main.ts.

**Example:**
```typescript
// src/animation/transition-choreographer.ts
import CameraControls from 'camera-controls';
import * as THREE from 'three';
import { gsap } from 'gsap';

export interface TransitionState {
  inProgress: boolean;
  currentCtx: gsap.Context | null;
}

export function createTransitionChoreographer(controls: CameraControls) {
  const state: TransitionState = { inProgress: false, currentCtx: null };

  function cancel(): void {
    if (state.currentCtx) {
      state.currentCtx.revert(); // kills all tweens in this context
      state.currentCtx = null;
    }
    state.inProgress = false;
    controls.enabled = true;
  }

  function startT1(
    nucleusPosition: THREE.Vector3,
    faceOnDirection: THREE.Vector3, // normalize(cross(orbitU, orbitV))
    viewDistance: number,
    onComplete?: () => void,
  ): void {
    cancel(); // kill any in-flight transition
    state.inProgress = true;
    controls.enabled = false;

    const camTarget = nucleusPosition.clone();
    const camPos = camTarget.clone().addScaledVector(faceOnDirection.normalize(), viewDistance);

    state.currentCtx = flyTo(controls, camPos, camTarget, 1.2, () => {
      state.inProgress = false;
      controls.enabled = true;
      onComplete?.();
    });
  }

  function startT5(
    homePos: THREE.Vector3,  // { 80, 880, 280 }
    homeTarget: THREE.Vector3, // { 0, 0, 0 }
    onComplete?: () => void,
  ): void {
    cancel();
    state.inProgress = true;
    controls.enabled = false;

    state.currentCtx = flyTo(controls, homePos, homeTarget, 1.4, () => {
      state.inProgress = false;
      controls.enabled = true;
      onComplete?.();
    });
  }

  return { state, startT1, startT5, cancel };
}
```

### Pattern 3: camera-controls Installation in renderer.ts

**What:** `CameraControls.install({ THREE })` must be called once before constructing any instance.

**When to use:** Top of renderer.ts, before any CameraControls constructor call.

**Example:**
```typescript
// src/scene/renderer.ts (migrated)
import CameraControls from 'camera-controls';
import * as THREE from 'three';

CameraControls.install({ THREE }); // REQUIRED — must come before any new CameraControls(...)

export interface RendererContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: CameraControls;          // was: OrbitControls
  dispose: () => void;
}

export function createRenderer(canvas: HTMLCanvasElement, container: HTMLElement): RendererContext {
  // ...
  const controls = new CameraControls(camera, canvas);
  controls.dampingFactor = 0.06;
  controls.draggingDampingFactor = 0.25; // replaces dampingFactor on drag
  controls.minDistance = 150;
  controls.maxDistance = 1800;
  controls.polarRotateSpeed = 0.55;  // was: rotateSpeed
  controls.azimuthRotateSpeed = 0.55;
  // ...
}
```

### Pattern 4: THREE.Clock in Tick Loop

**What:** camera-controls `update(delta)` requires delta in seconds. `requestAnimationFrame` timestamp is in milliseconds.

**When to use:** Any tick loop using camera-controls.

**Example:**
```typescript
// src/main.ts (migrated tick loop)
import * as THREE from 'three';

const clock = new THREE.Clock(); // add in boot()

function tick(t: number) {
  requestAnimationFrame(tick);
  const delta = clock.getDelta();   // seconds since last frame
  controls.update(delta);           // was: controls.update()
  tickOrbits(sceneObjects, t, camera);
  // ...
}
```

### Pattern 5: T1 Face-On Direction from nucleus-orbit.ts

**What:** The orbital plane normal is reconstructable from `NucleusOrbitData.orbitU` and `orbitV`.

**When to use:** Computing camera target position for T1.

**Example:**
```typescript
// From src/scene/orbitals/nucleus-orbit.ts analysis:
// NucleusOrbitData has orbitU: Vec3 and orbitV: Vec3 (orbital plane basis vectors)
// cross(orbitU, orbitV) = orbital plane normal = face-on direction

import * as THREE from 'three';
import type { NucleusOrbitData } from './orbitals/nucleus-orbit';

function computeFaceOnDirection(nucOrbit: NucleusOrbitData): THREE.Vector3 {
  const u = new THREE.Vector3(nucOrbit.orbitU.x, nucOrbit.orbitU.y, nucOrbit.orbitU.z);
  const v = new THREE.Vector3(nucOrbit.orbitV.x, nucOrbit.orbitV.y, nucOrbit.orbitV.z);
  return new THREE.Vector3().crossVectors(u, v).normalize();
  // NOTE: May need negation if camera lands behind the plane.
  // Verify empirically in first test run — if the view is "from behind",
  // negate the result: return normal.negate()
}
```

### Anti-Patterns to Avoid

- **Direct property tweening of camera-controls:** `gsap.to(controls, { azimuthAngle })` silently fails — `azimuthAngle` and `polarAngle` are getter-only. Always use the GSAP proxy pattern.
- **Calling `controls.update()` without delta:** camera-controls v3+ requires `update(deltaSeconds)`. `update()` with no args may work but produces undefined behavior — always pass the THREE.Clock delta.
- **Omitting `CameraControls.install({ THREE })`:** Construction will throw at runtime.
- **Forgetting `enableTransition=false` in setLookAt:** If you pass `true`, camera-controls applies its own smoothing on top of GSAP's — double-easing produces mushy transitions.
- **Moving nucleus meshes during T1 dissolve (CAM-03):** Spec says "dissolve", not "fly away". Only opacity changes; mesh positions stay fixed.
- **Running GSAP tweens against `controls` properties during transition:** While `controls.enabled = false` blocks user input, GSAP can still queue tweens on controls properties. All camera animation must go through TransitionChoreographer.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth camera interpolation | Custom lerp/slerp on camera.position | GSAP proxy + `setLookAt(false)` | Handles quaternion slerp, target coherence, easing curves correctly |
| Orbital damping after transition | Manual velocity decay | camera-controls damping (`dampingFactor`) | Already handles damping on resume; custom code risks desync |
| Delta time calculation | `performance.now()` subtraction | `THREE.Clock.getDelta()` | THREE.Clock handles pausing, page visibility, and float precision correctly |

**Key insight:** camera-controls exists precisely to prevent the OrbitControls desync problem. Use its `setLookAt` API cleanly rather than fighting it with direct property access.

---

## Common Pitfalls

### Pitfall 1: OrbitControls Target Desync (Primary T1/T5 Risk)
**What goes wrong:** Tweening `camera.position` directly while the orbit controls' internal `target` stays at world origin. After the tween, orbit interaction pivots around the wrong point — camera snaps or spins erratically.
**Why it happens:** OrbitControls (and camera-controls) maintain an internal target point. Moving only the camera position breaks the camera-target relationship.
**How to avoid:** Use `controls.setLookAt(px, py, pz, tx, ty, tz, false)` — this updates both position and target atomically.
**Warning signs:** Camera "snaps" when user starts dragging after T1 completes.

### Pitfall 2: getter-only Property Tween (Silent Failure)
**What goes wrong:** `gsap.to(controls, { azimuthAngle: targetAzimuth })` does nothing — no error, no tween, no movement.
**Why it happens:** `azimuthAngle` and `polarAngle` on camera-controls are getter-only computed properties.
**How to avoid:** Always use the GSAP proxy pattern. Never tween controls properties directly.
**Warning signs:** Camera doesn't move at all during T1/T5, but no console error appears.

### Pitfall 3: Missing THREE.Clock → NaN delta
**What goes wrong:** `controls.update(clock.getDelta())` is added but `clock` is created outside `boot()`, or `getDelta()` is called in the wrong scope — delta is 0 or NaN, damping breaks.
**Why it happens:** THREE.Clock starts timing from construction. If created at module level and then boot() runs much later, the first delta is large (startup lag).
**How to avoid:** Create `new THREE.Clock()` inside `boot()`, after renderer setup, before `requestAnimationFrame(tick)`.
**Warning signs:** Camera damping feels instant (delta=0) or wildly overshoots (large delta on first frame).

### Pitfall 4: Non-Atomic Transitions (Input During Flight)
**What goes wrong:** User clicks a nucleus during T1 flight; a new T1 starts, creating overlapping GSAP timelines — camera goes to undefined position.
**Why it happens:** No transition lock; two `gsap.to()` calls compete on the same proxy values.
**How to avoid:** `controls.enabled = false` immediately at T1/T5 start. `transitionInProgress` flag gates remaining input handlers. `cancel()` in TransitionChoreographer kills previous context before starting new one.
**Warning signs:** Camera position becomes NaN or undefined mid-transition.

### Pitfall 5: GSAP Tween Spike at T1 Entry
**What goes wrong:** Entering T1 triggers N-1 nucleus dissolve tweens simultaneously (one per other nucleus). At N=7, this is 6 tweens in a single frame — may cause stutter.
**Why it happens:** All dissolve tweens start at the same moment in the same tick.
**How to avoid:** Use GSAP `stagger: 0.03` on the nucleus opacity tweens. Spreads the load across 3-4 frames.
**Warning signs:** Frame drop on T1 entry visible in DevTools performance timeline.

### Pitfall 6: Stale Camera Matrix After Transition
**What goes wrong:** After T5 completes, the first click ray-cast misses objects that should be hit.
**Why it happens:** Camera matrix is updated inside `controls.update()` but the render call that uses the new matrix hasn't fired yet when the click handler processes.
**How to avoid:** In `onComplete` of T5, call `renderer.render(scene, camera)` once synchronously before re-enabling input, or suppress raycasting during transition lock.
**Warning signs:** First click after T5 produces no hit; second click works.

### Pitfall 7: prefers-reduced-motion Gate Missing on New Transitions
**What goes wrong:** T1/T5 animate normally even with `prefers-reduced-motion: reduce` — violates CAM-01 spec and project accessibility requirement.
**Why it happens:** Phase 3 adds new GSAP timelines that weren't present when the `gsap.globalTimeline.timeScale(0)` gate was written.
**How to avoid:** The existing gate in `main.ts` (`if (matchMedia('prefers-reduced-motion: reduce').matches) gsap.globalTimeline.timeScale(0)`) handles ALL GSAP timelines globally — including any created by TransitionChoreographer. This works correctly for the existing gate. Verify that T1/T5 GSAP contexts are created under the global timeline (not a separate timeline with `paused: true`).
**Warning signs:** T1/T5 animate under `prefers-reduced-motion: reduce` when they should be instant.

---

## Code Examples

Verified patterns from codebase analysis and official docs:

### current focusSphere — what T1 REPLACES
```typescript
// src/scene/scene-state.ts (lines 264-276) — BEFORE Phase 3
// This pattern animates camera.position + orbitControls.target separately.
// Phase 3 replaces this with TransitionChoreographer.startT1()

gsap.to(camera.position, { ...camPos, duration: 1.3, ease: 'power2.inOut' });
gsap.to(orbitControls.target, {
  x: targetPos.x * 0.2,
  y: targetPos.y * 0.2,
  z: targetPos.z * 0.2,
  duration: 1.3, ease: 'power2.inOut',
  onUpdate() { orbitControls.update(); },
});
```

### nucleusOrbits access for face-on direction
```typescript
// From src/scene/orbitals/nucleus-orbit.ts — NucleusOrbitData interface
// orbitU and orbitV are the orbital plane basis vectors
// cross(orbitU, orbitV) recovers the orbital plane normal

const nucOrbit = sceneObjects.nucleusOrbits[nucleusKey]; // NucleusOrbitData
const u = new THREE.Vector3(nucOrbit.orbitU.x, nucOrbit.orbitU.y, nucOrbit.orbitU.z);
const v = new THREE.Vector3(nucOrbit.orbitV.x, nucOrbit.orbitV.y, nucOrbit.orbitV.z);
const faceOn = new THREE.Vector3().crossVectors(u, v).normalize();
const camPos = nucleus.position.clone().addScaledVector(faceOn, VIEW_DISTANCE);
// VIEW_DISTANCE: start with 200, tune empirically
```

### GSAP context cleanup
```typescript
// gsap.context().revert() kills all tweens created inside that context
// and restores tweened properties to original values

const ctx = gsap.context(() => {
  gsap.to(proxy, { /* ... */ });
});

// On cancel or interrupt:
ctx.revert(); // kills the proxy tween, proxy returns to original values
```

---

## Migration Checklist (CAM-05)

Ordered by dependency — do not reorder:

1. **Install camera-controls:** `npm install camera-controls`
2. **renderer.ts:**
   - Add `CameraControls.install({ THREE })` at module top (before any import that might call it)
   - Replace `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'` with `import CameraControls from 'camera-controls'`
   - Change `controls: OrbitControls` in `RendererContext` to `controls: CameraControls`
   - Replace `new OrbitControls(camera, canvas)` with `new CameraControls(camera, canvas)`
   - Map property names: `rotateSpeed` → `polarRotateSpeed` + `azimuthRotateSpeed`; `enableDamping: true` → removed (always on in camera-controls)
3. **main.ts:**
   - Add `const clock = new THREE.Clock()` inside `boot()` after renderer creation
   - Change `controls.update()` to `controls.update(clock.getDelta())` in tick loop
   - Update `import type` for controls parameter in any helper functions
4. **scene-state.ts:**
   - Change `import type { OrbitControls }` to `import type CameraControls from 'camera-controls'`
   - Update all function signatures that accept `orbitControls?: OrbitControls` → `controls?: CameraControls`
   - The `focusSphere`/`unfocusSphere` functions will be largely replaced by TransitionChoreographer calls in Phase 3
5. **New file: src/animation/transition-choreographer.ts**

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OrbitControls `update()` | `controls.update(deltaSeconds)` | camera-controls v3+ | THREE.Clock required in tick loop |
| Direct position tweening | GSAP proxy + `setLookAt(false)` | camera-controls architecture | Cannot tween getter-only properties |
| `controls.dampingFactor` | `controls.dampingFactor` + `controls.draggingDampingFactor` | camera-controls v2+ | Two separate damping factors |
| `orbitControls.target.set()` | `controls.setTarget(x, y, z)` | camera-controls | Clean method API vs direct Vec3 mutation |

**Deprecated/outdated (do not use):**
- `OrbitControls` for this project: replaced by camera-controls v3.1.2 per project decision
- `controls.update()` (no args): will produce undefined behavior with camera-controls; always pass delta
- Direct camera.position tweening without updating controls.target: causes desync on resume

---

## Open Questions

1. **VIEW_DISTANCE for T1 face-on position**
   - What we know: camera should position itself looking at the orbital plane; existing `focusSphere` uses `camPos = { x: targetPos.x * 0.45, y: targetPos.y * 0.45, z: targetPos.z * 0.45 + 320 }` as a heuristic
   - What's unclear: the precise distance that makes rings "flatten by perspective" (CAM-01 spec) without clipping close stars; depends on actual orbital radii per nucleus
   - Recommendation: Start with VIEW_DISTANCE = 200, add a debug key binding in Wave 1 to adjust live; finalize in Wave 2

2. **faceOn direction sign**
   - What we know: `cross(orbitU, orbitV)` gives the orbital plane normal, but cross product sign depends on winding order of orbitU/orbitV in nucleus-orbit.ts
   - What's unclear: whether the resulting direction points toward viewer or away
   - Recommendation: In first test run, if camera ends up "behind" the orbital plane, negate the result: `faceOn.negate()`

3. **camera-controls property map for current OrbitControls settings**
   - What we know: current renderer.ts sets `rotateSpeed=0.55`, `zoomSpeed=0.9`, `panSpeed=0.6`, `zoomToCursor=true`, polar angle limits, mouse button mapping
   - What's unclear: exact camera-controls equivalents for all properties (especially `zoomToCursor` and `mouseButtons`)
   - Recommendation: Context7 covers camera-controls API fully; check during Wave 1 renderer migration. `zoomToCursor` exists as `controls.zoomToCursor`. `mouseButtons` is replaced by individual action configurations.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (confirmed from existing 95-test suite) |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAM-01 | T1 camera position after transition | integration/visual | manual (Three.js scene, no DOM in tests) | ❌ Wave 0 |
| CAM-02 | T5 camera returns to home position | integration/visual | manual | ❌ Wave 0 |
| CAM-03 | Nuclei opacity = 0 after T1 | integration | manual (GSAP + Three.js) | ❌ Wave 0 |
| CAM-04 | `transitionInProgress` prevents input re-entry | unit | `npm test -- transition-choreographer` | ❌ Wave 0 |
| CAM-05 | camera-controls instantiates with correct properties | smoke | `npm test -- renderer` | ❌ Wave 0 |
| CAM-06 | `cancel()` calls `ctx.revert()` and resets state | unit | `npm test -- transition-choreographer` | ❌ Wave 0 |

**Notes on test scope:**
- CAM-01, CAM-02, CAM-03: These are visual/integration outcomes requiring Three.js scene rendering. Not unit-testable without a headless WebGL environment. These are verified manually per the phase success criteria.
- CAM-04, CAM-06: TransitionChoreographer state machine IS unit-testable. Mock `CameraControls`, `gsap.context`, verify state transitions.
- CAM-05: Smoke test that camera-controls instantiates without throwing (mocked THREE context).

### Sampling Rate
- **Per task commit:** `npm test` (full 95-test suite + new Phase 3 tests, ~15s)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual visual verification of T1/T5 transitions before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/animation/transition-choreographer.test.ts` — covers CAM-04, CAM-06 (unit tests for state machine and cancel behavior)
- [ ] Smoke test for camera-controls in `src/scene/renderer.test.ts` (or new file) — covers CAM-05

*(CAM-01/02/03 are visual; test files not required, verified manually)*

---

## Sources

### Primary (HIGH confidence)
- Context7 (camera-controls library) — `setLookAt`, `update(delta)`, `enabled`, `install({ THREE })`, proxy pattern
- `src/scene/renderer.ts` (direct read) — current OrbitControls setup, migration scope
- `src/scene/scene-state.ts` (direct read) — current focusSphere/unfocusSphere patterns
- `src/scene/orbitals/nucleus-orbit.ts` (direct read) — `orbitU`/`orbitV` for face-on computation
- `src/main.ts` (direct read) — tick loop, controls.update() call site
- `.planning/REQUIREMENTS.md` (direct read) — CAM-01 through CAM-06 authoritative spec
- `package.json` (direct read) — camera-controls not yet installed; confirms `npm install` needed

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — project-specific pitfall documentation (cross-checked against official docs)
- `.planning/research/STACK.md` — WARNING: code example on lines 66-72 uses WRONG getter-only property tween pattern; do not copy

### Tertiary (LOW confidence — do not use without verification)
- `.planning/research/STACK.md` GSAP example: confirmed WRONG by advisor + Context7 verification

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — camera-controls v3.1.2 is the project decision; API verified via Context7
- Architecture (proxy pattern): HIGH — verified via Context7 + advisor; WRONG pattern in STACK.md explicitly documented
- T1 face-on computation: MEDIUM — `orbitU`/`orbitV` source verified from nucleus-orbit.ts; sign of cross product needs empirical check
- Migration checklist: HIGH — all source files read directly; property mapping verified via Context7
- Pitfalls: HIGH — primary pitfalls from Context7 + direct code analysis; GSAP tween spike is MEDIUM (observed pattern, not tested)

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (camera-controls stable; GSAP stable — 30 days)

---

## Critical Warning: STACK.md Code Example is Wrong

`.planning/research/STACK.md` lines 66-72 contains this example:

```typescript
// DO NOT USE — this silently fails
gsap.to(controls, {
  azimuthAngle: targetAzimuth,
  polarAngle: targetPolar,
  duration: 0.8,
  onUpdate: () => controls.update(clock.getDelta()),
});
```

`azimuthAngle` and `polarAngle` are getter-only properties in camera-controls. GSAP cannot tween them. This code runs without error but the camera does not move. Use the GSAP proxy pattern documented in Pattern 1 above.
