# Phase 02: Layout — Pattern Map (Plan 03 scope only)

**Mapped:** 2026-04-28
**Files analyzed:** 5 (Plan 03 only — ViewState rename + free-float wiring)
**Analogs found:** 5 / 5 (all analogs are the files themselves — modifications, not new files)

> Plans 01–02 (layout shell, ResizeObserver, LayoutController) are already fully specified.
> This document covers Plan 03 only per the pattern-mapping brief.

---

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/data/view-state.ts` | model (state machine) | event-driven | itself — extend existing discriminated union | exact |
| `src/data/view-state.test.ts` | test | event-driven | itself — update kind literals and helper | exact |
| `src/main.ts` | orchestrator | event-driven / request-response | itself — update subscriber and tick-loop kind checks | exact |
| `src/animation/transition-choreographer.ts` | animation service | event-driven | itself — add nucleus-hide tween alongside existing fades | exact |
| `src/scene/orbitals/star-orbit.ts` | utility (pure function) | transform | itself — called with `(0,0,0)` as nucleusCenter; no API change | exact (no change) |

> Note: CONTEXT.md refers to `createStarOrbit()`. The actual export is `computeStarOrbit()`.
> The planner must use the real name.

---

## Pattern Assignments

### `src/data/view-state.ts` (model, event-driven)

**Analog:** itself (lines 1–93)

**Discriminated union shape to preserve** (lines 1–8):
```typescript
export type ViewState =
  | { kind: 'planetary' }
  | { kind: 'global' }
  | { kind: 'constellation'; nucleusKey: string }
  | { kind: 'reading'; nucleusKey: string | null; caseId: string; origin: 'global' | 'constellation' };
```

**Target shape after rename** (R7):
```typescript
export type ViewState =
  | { kind: 'entry' }
  | { kind: 'state1'; state1Mode: 'free' | 'gathered' | 'organized' }
  | { kind: 'constellation'; nucleusKey: string }
  | { kind: 'reading'; nucleusKey: string | null; caseId: string; origin: 'global' | 'constellation' };
```

**Throw-on-illegal pattern to copy** (lines 33–37) — used for all transition guards:
```typescript
if (event.type === 'ENTER_FIELD') {
  if (current.kind !== 'planetary') {
    throw new Error(`Cannot ENTER_FIELD from "${current.kind}"`);
  }
  next = { kind: 'global' };
```
After rename: guard checks `current.kind !== 'entry'`; `next = { kind: 'state1', state1Mode: 'free' }`.

**Exhaustiveness guard** (lines 71–74) — this is the compile-time verification that no rename site is missed (D-04):
```typescript
// Exhaustiveness guard — TypeScript should catch this at compile time
const _exhaustive: never = event;
throw new Error(`Unknown event: ${JSON.stringify(_exhaustive)}`);
```
This guard fires at compile time if a new event type is added without a handler — and also catches any reference to an old kind name after rename. Leave it intact.

**`createViewStateMachine` default initial state** (line 26) — must update:
```typescript
// Before:
let current: ViewState = initial ?? { kind: 'planetary' };
// After:
let current: ViewState = initial ?? { kind: 'entry' };
```

**`CLOSE_READING` return path** (lines 54–56) — references `'global'`; must update:
```typescript
// Before:
next = current.origin === 'global'
  ? { kind: 'global' }
  : { kind: 'constellation', nucleusKey: current.nucleusKey as string };
// After:
next = current.origin === 'global'
  ? { kind: 'state1', state1Mode: 'free' }
  : { kind: 'constellation', nucleusKey: current.nucleusKey as string };
```

**`EXIT_CONSTELLATION` return** (lines 64–70) — also returns to global:
```typescript
// Before:
next = { kind: 'global' };
// After:
next = { kind: 'state1', state1Mode: 'free' };
```

**`OPEN_READING` guard** (lines 44–47) — checks `current.kind === 'global'`:
```typescript
} else if (current.kind === 'global') {
  next = { kind: 'reading', nucleusKey: null, caseId: event.caseId, origin: 'global' };
```
After rename: `current.kind === 'state1'`; `origin: 'global'` string stays unchanged (it is a semantic value, not a kind name).

---

### `src/data/view-state.test.ts` (test, event-driven)

**Analog:** itself (lines 1–251)

**`machineInGlobal()` helper** (lines 4–8) — must rename and update:
```typescript
// Before:
function machineInGlobal() {
  return createViewStateMachine({ kind: 'global' });
}
// After (name is Claude's Discretion; pattern below):
function machineInState1() {
  return createViewStateMachine({ kind: 'state1', state1Mode: 'free' });
}
```
Important: this is NOT a pure string swap. `state1` requires the `state1Mode` field; `{ kind: 'state1' }` alone is a TypeScript error. Every `machineInGlobal()` call site in the file also updates to `machineInState1()`.

**Kind literal replacement pattern** — every `{ kind: 'planetary' }` in assertions:
```typescript
// Before:
expect(machine.getState()).toEqual({ kind: 'planetary' });
// After:
expect(machine.getState()).toEqual({ kind: 'entry' });
```

**Every `{ kind: 'global' }` assertion** — requires the mode field:
```typescript
// Before:
expect(machine.getState()).toEqual({ kind: 'global' });
// After:
expect(machine.getState()).toEqual({ kind: 'state1', state1Mode: 'free' });
```

**Listener call assertion pattern** (lines 119–130) — shows `(next, prev, event)` shape the planner must match in new ENTER_FIELD test:
```typescript
expect(listener).toHaveBeenCalledWith(
  { kind: 'global' },       // → { kind: 'state1', state1Mode: 'free' }
  { kind: 'planetary' },    // → { kind: 'entry' }
  event
);
```

**New test to add per R7 acceptance** (`ENTER_FIELD` from `entry` → `state1.free`):
```typescript
// Copy ENTER_FIELD block pattern from lines 111–132, updating kind literals:
it('ENTER_FIELD from entry → { kind: "state1", state1Mode: "free" }', () => {
  const machine = createViewStateMachine();
  expect(machine.getState()).toEqual({ kind: 'entry' });
  machine.dispatch({ type: 'ENTER_FIELD' });
  expect(machine.getState()).toEqual({ kind: 'state1', state1Mode: 'free' });
});
```

---

### `src/main.ts` (orchestrator, event-driven)

**Analog:** itself — ViewState subscriber and tick-loop kind checks

**Primary subscriber block** (lines 264–292) — the canonical site for mode mapping (D-01):
```typescript
viewState.subscribe((next, prev) => {
  sceneObjects.mode = (next.kind === 'global' || next.kind === 'planetary') ? 'global' : 'focused';
  sceneObjects.focusedKey = next.kind === 'constellation' ? next.nucleusKey : null;

  if (prev.kind === 'planetary' && next.kind === 'global') {
    choreographer.choreographPlanetaryToGlobal(sceneObjects, planetGroup, { ... });
  }
});
```
After Plan 03:
```typescript
viewState.subscribe((next, prev) => {
  sceneObjects.mode = (next.kind === 'state1' || next.kind === 'entry') ? 'global' : 'focused';
  sceneObjects.focusedKey = next.kind === 'constellation' ? next.nucleusKey : null;

  if (prev.kind === 'entry' && next.kind === 'state1') {
    choreographer.choreographPlanetaryToGlobal(sceneObjects, planetGroup, { ... });
  }
});
```
The `'global'` string output of `sceneObjects.mode` is preserved (D-01 backward compat). Only the input kind names change.

**Tick-loop planetary kind check** (line 360):
```typescript
// Before:
if (viewState.getState().kind === 'planetary') {
// After:
if (viewState.getState().kind === 'entry') {
```

**`enterFocus` kind check** (line 557):
```typescript
// Before:
if (viewState.getState().kind === 'constellation') {
// After: unchanged — 'constellation' kind is not renamed
```

**`exitFocus` kind check** (line 637):
```typescript
// Before:
if (viewState.getState().kind === 'constellation') {
// After: unchanged
```

**Second subscriber block** (lines 310–320) — filter panel auto-expand:
```typescript
viewState.subscribe((_next, _prev, event) => {
  if (event?.type === 'ENTER_CONSTELLATION') { ... }
  else if (event?.type === 'EXIT_CONSTELLATION') { ... }
});
```
This block uses event type strings only, not kind names — no change needed. Document for planner awareness.

**TypeScript exhaustiveness at compile time** — after rename, `tsc` will surface any remaining `kind === 'global'` or `kind === 'planetary'` references as type errors. Run `npm run build` as the authoritative no-missed-site check (D-04).

---

### `src/animation/transition-choreographer.ts` (animation service, event-driven)

**Analog:** itself — extend `choreographPlanetaryToGlobal` with nucleus-hide tween

**Existing GSAP material-opacity tween pattern** (lines 159–164) — this is the template for the nucleus-hide tween:
```typescript
gsap.to(planet.sphere.material as THREE.MeshStandardMaterial, {
  emissiveIntensity: 0.02,
  opacity: 0.35,
  duration: 0.4 * s,
  ease: 'power1.out',
});
```

**`prefersReduced` scaling variable** (lines 125–126) — all new tween durations must multiply by `s`:
```typescript
const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const s = prefersReduced ? 0.33 : 1.0;
```

**Nucleus mesh iteration pattern** (lines 200–202 — `nucleusLabels` iteration inside the `.then()` block):
```typescript
for (const [, div] of objects.nucleusLabels.entries()) {
  div.classList.add('show');
}
```
Extended for mesh hide + label instant-hide (D-06/D-08). Both loops run in the same block, parallel to step (1) dim:

```typescript
// Nucleus mesh opacity-0 tween (fires once at transition start, parallel with step 1)
// D-06: opacity tween over 300ms, then set visible=false in onComplete
// D-07: mesh stays in scene graph (scene.remove() NOT called)
// D-08: fires once; guard prevents re-trigger
let nucleiHidden = false;
if (!nucleiHidden) {
  nucleiHidden = true;
  for (const [, mesh] of objects.nucleusMeshes.entries()) {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.transparent = true;
    gsap.to(mat, {
      opacity: 0,
      duration: 0.3 * s,
      ease: 'power1.out',
      onComplete: () => { mesh.visible = false; },
    });
  }
  // Nucleus labels: hide immediately, no animation
  for (const [, el] of objects.nucleusLabels.entries()) {
    el.style.display = 'none';
  }
}
```
The `nucleiHidden` guard satisfies D-08 (no re-trigger). Planner should decide if the guard lives as a closure variable inside `choreographPlanetaryToGlobal` or as a `SceneObjects` flag — either works given the function is called once per transition.

**Insertion point** — add immediately after the `s` variable declaration (line 127) and before step (0) camera-offset clear (line 129). This makes the nucleus hide fire in parallel with the camera and planet fades, consistent with "all Entry→State1 visual changes in one choreography function" (CONTEXT Specific Ideas).

**Function signature** — no change needed. `choreographPlanetaryToGlobal(objects, planet, options)` remains unchanged; the new tween reads from `objects.nucleusMeshes` and `objects.nucleusLabels` which are already available.

---

### `src/scene/orbitals/star-orbit.ts` (utility, transform)

**Analog:** itself — no API change; document call signature for free-float use

**Actual export name** (line 17):
```typescript
export function computeStarOrbit(
  c: CaseStudy,
  nucleusKey: string,
  nucleusCenter: Vec3,
  rMin: number,
  rMax: number,
  indexInGroup: number = 0,
  groupSize: number = 1,
): StarOrbit
```
> CONTEXT.md uses `createStarOrbit` — this name does not exist. The real export is `computeStarOrbit`.

**Free-float invocation pattern** (D-02, D-03) — pass `(0,0,0)` as nucleusCenter:
```typescript
// Free-float: all stars drift around world origin
// nucleusKey sentinel: '__free__' (doesn't match any real nucleus key)
const freeOrbit = computeStarOrbit(
  caseStudy,        // CaseStudy
  '__free__',       // nucleusKey sentinel
  { x: 0, y: 0, z: 0 },  // nucleusCenter = world origin
  rMin,             // existing orbital radius preserved (not hardcoded)
  rMax,             // existing orbital radius preserved
  indexInGroup,     // preserved from original buildOrbitalScene call
  groupSize,        // preserved from original buildOrbitalScene call
);
```
No changes to `computeStarOrbit` or `starPositionAt` are needed. The `orbitCenter` field on the returned `StarOrbit` will be `(0,0,0)`, so `starPositionAt` naturally drifts stars around the world origin.

**`starPositionAt` position computation** (lines 96–101) — shows how `orbitCenter` is added to the rotated position. With `orbitCenter = {0,0,0}`, these additions are no-ops and stars orbit the world origin:
```typescript
o.x = orbit.orbitCenter.x + base.x * cosA + cx * sinA + ax.x * dot * (1 - cosA);
o.y = orbit.orbitCenter.y + base.y * cosA + cy * sinA + ax.y * dot * (1 - cosA);
o.z = orbit.orbitCenter.z + base.z * cosA + cz * sinA + ax.z * dot * (1 - cosA);
```

---

## Shared Patterns

### GSAP opacity tween with prefersReduced scaling
**Source:** `src/animation/transition-choreographer.ts` lines 125–126, 159–164
**Apply to:** Nucleus-hide tween in `choreographPlanetaryToGlobal`
```typescript
const s = prefersReduced ? 0.33 : 1.0;
// ...
gsap.to(material, {
  opacity: 0,
  duration: N * s,   // always multiply duration by s
  ease: 'power1.out',
  onComplete: () => { /* optional side effect */ },
});
```

### Map iteration over nucleusMeshes / nucleusLabels
**Source:** `src/animation/transition-choreographer.ts` lines 200–202; `src/main.ts` tick loop lines 364–375
**Apply to:** Nucleus-hide tween loop and label instant-hide loop in `choreographPlanetaryToGlobal`
```typescript
for (const [key, mesh] of objects.nucleusMeshes.entries()) { /* ... */ }
for (const [key, el]   of objects.nucleusLabels.entries()) { /* ... */ }
```
Both maps are always in sync — the same nucleus keys appear in both. Iterate both for any operation that touches nucleus state.

---

## No Analog Found

None. All Plan 03 files are modifications of existing files with self-analogs.

---

## Metadata

**Analog search scope:** Plan 03 files only (ViewState rename + free-float wiring)
**Files scanned:** 5 source files + 1 test file
**Pattern extraction date:** 2026-04-28
**Out of scope (not mapped):** Plans 01–02 (layout shell, LayoutController, ResizeObserver, tooltip fix) — already fully specified in existing plans
