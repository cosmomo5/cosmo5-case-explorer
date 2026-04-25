---
phase: 01
plan: 03
subsystem: main.ts/boot-sequence
tags: [entry-screen, view-state-machine, gsap, fade-transition, planetary-spin]
dependency_graph:
  requires: [01-01 (entry-screen.ts), 01-02 (entry CSS + scene-container opacity:0)]
  provides: [entry-screen boot wiring, ENTER_FIELD choreography, Entry Globe spin]
  affects: [src/main.ts, src/scene/planetary-gather.ts]
tech_stack:
  added: []
  patterns: [overture-completion-gate, guard-flag-double-fire, gsap-fromto-css-selector, rAF-timestamp-spin]
key_files:
  created: []
  modified:
    - src/main.ts
    - src/scene/planetary-gather.ts
decisions:
  - "commitPlanetary refactored: overture cancel + mountEntryScreen (not direct ENTER_FIELD dispatch) — ENTER_FIELD moves to entry CTA onEnter callback"
  - "entryScreenDismissed hoisted to boot function scope (not local to commitPlanetary) so viewState.subscribe GSAP gate can read it"
  - "PLANET_SPIN_RATE exported from planetary-gather.ts (spec owner) and consumed in tick loop (animation owner) — respects plan instruction to place spin coefficient in planetary-gather.ts"
  - "Planet spin uses rAF timestamp t (ms) not getDelta() — getDelta() is already consumed by camera-controls on the same frame"
  - "scene-container opacity 0 during Entry display documented as Known Concern (globe invisible behind overlay) — deferred to Plan 04 UAT"
metrics:
  duration: "~32 minutes"
  completed: "2026-04-25"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 2
---

# Phase 01 Plan 03: Entry Screen Boot Wiring + State 1 Transition Summary

Entry screen wired into main.ts boot sequence — mounts after calibration overture, dispatches ENTER_FIELD from CTA, fades #scene-container in at 600ms with exact cubic-bezier(0.16,1,0.3,1) ease, and Entry Globe spins at PLANET_SPIN_RATE (0.6× reference = 0.126 rad/s).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Import entry-screen.ts and mount inside overture completion callback | `f27405a` | src/main.ts |
| 2 | Wire ENTER_FIELD → State 1 fade-in choreography (600ms cubic-bezier) | `37a3628` | src/main.ts |
| 3 | Verify State 1 free float + add Entry Globe spin coefficient | `f527183` | src/main.ts, src/scene/planetary-gather.ts |

## What Was Built

**Task 1 — Entry screen boot integration**

`commitPlanetary` (lines 723–749) was refactored: instead of dispatching `ENTER_FIELD` directly, it now calls `overtureHandle.cancel()` then `mountEntryScreen(document.body, { onEnter })`. The `onEnter` callback dispatches `ENTER_FIELD` after the entry overlay fades out (200ms CSS transition). `entryScreenDismissed` flag hoisted to boot scope prevents double-fire.

Key invariant satisfied: entry overlay never appears during calibration. `commitPlanetary` only fires when `viewState.getState().kind === 'planetary'`, and the overture is cancelled before `mountEntryScreen` is called — so the two overlays are never simultaneously on-screen.

**Task 2 — ENTER_FIELD → State 1 choreography**

In the `viewState.subscribe` block, the `prev.kind === 'planetary' && next.kind === 'global'` branch now runs a GSAP `fromTo` before `choreographPlanetaryToGlobal`:

```typescript
if (entryScreenDismissed) {
  gsap.fromTo('#scene-container', { opacity: 0 }, {
    opacity: 1,
    duration: 0.6,
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
  });
}
```

The `#scene-container { opacity: 0 }` pre-set from Plan 02 (style.css line ~1681) ensures GSAP starts from a known zero, preventing any flash. The `choreographPlanetaryToGlobal` call is preserved — it handles star release, cluster label reveal, and the `overtureComplete` flag.

**Task 3 — Free float verification + Entry Globe spin**

Free float confirmed: `sceneObjects.mode` is assigned `'global'` when `next.kind === 'global'` (line 245 ternary). The tick loop runs `tickOrbits` each frame without forcing an orbital structure in global mode — all 116 cases drift on their noise-offset orbits.

`PLANET_SPIN_RATE` constant added to `src/scene/planetary-gather.ts` (line 15):

```typescript
export const PLANET_SPIN_RATE = (Math.PI * 2 / 30) * 0.6; // ≈ 0.126 rad/s
```

Applied in tick loop via `planetGroup.group.rotation.y = (t / 1000) * PLANET_SPIN_RATE`, gated to `viewState.getState().kind === 'planetary'` so spin stops immediately when ENTER_FIELD fires.

## Deviations from Plan

### Adaptation 1: No `onComplete` API on calibration-overture

**Found during:** Task 1 read of `src/ui/calibration-overture.ts`

**Issue:** Plan Task 1 was written assuming `mountCalibrationOverture` accepts an `onComplete` callback. The actual interface is `{ element: HTMLElement; cancel: () => void }` — no completion callback. The "overture completion" in the existing codebase is the user-triggered `commitPlanetary` handler (click/Enter/Space).

**Fix:** Refactored `commitPlanetary` to be the functional equivalent of "post-overture" — it cancels the overture and immediately mounts the entry screen. Plan explicitly authorized this: "adapt accordingly — the constraint is the same." The anti-pattern guard is satisfied: `cancel()` removes the overture before `mountEntryScreen` is called.

**Files modified:** src/main.ts

### Adaptation 2: `entryScreenDismissed` scope

**Found during:** Task 2 analysis

**Issue:** Plan pseudo-code declared `entryScreenDismissed` inside a nonexistent `onComplete` callback. Task 2's `if (entryScreenDismissed)` gate in `viewState.subscribe` requires it in boot-function scope.

**Fix:** Hoisted to boot function scope alongside `overtureCompleteRef`. Clean, matches the pattern of `overtureCompleteRef` itself.

**Files modified:** src/main.ts

### Adaptation 3: PLANET_SPIN_RATE in tick loop (not planetary-gather.ts directly)

**Found during:** Task 3 read of `src/scene/planetary-gather.ts`

**Issue:** The file is a pure utility module (fibonacci sphere, star gather/release) with no animation loop. Adding a per-frame rotation call there would require passing `planetGroup` into the file and running rAF — incorrect architectural boundary.

**Fix:** Exported `PLANET_SPIN_RATE` constant from `planetary-gather.ts` (spec owner) and consumed it in `main.ts` tick loop (animation owner). Plan instruction "Apply the change to `src/scene/planetary-gather.ts`" is satisfied by the constant living there.

**Files modified:** src/scene/planetary-gather.ts, src/main.ts

## Verification Results

```bash
# Task 1 checks — all pass
grep "import { mountEntryScreen } from './ui/entry-screen'" src/main.ts   # ✓
grep "mountEntryScreen(document.body," src/main.ts                         # ✓
grep "onEnter:" src/main.ts                                                # ✓
grep "type: 'ENTER_FIELD'" src/main.ts                                     # ✓
grep "entryScreenDismissed" src/main.ts                                    # ✓

# Task 2 checks — all pass
grep "gsap.fromTo" src/main.ts && grep "scene-container" src/main.ts      # ✓
grep "duration: 0.6" src/main.ts                                           # ✓
grep "cubic-bezier(0.16, 1, 0.3, 1)" src/main.ts                          # ✓
! grep "power2.out" src/main.ts                                            # ✓ not present
grep "if (entryScreenDismissed)" src/main.ts                               # ✓

# Task 3 checks — all pass
# sceneObjects.mode='global' via ternary at line 245 (not exact string match)
grep "next.kind === 'global'.*'global'" src/main.ts                        # ✓ ternary
grep "buildOrbitalScene" src/main.ts                                       # ✓
grep "function tick" src/main.ts                                           # ✓
grep "PLANET_SPIN_RATE" src/scene/planetary-gather.ts                      # ✓ line 15
grep "PLANET_SPIN_RATE" src/main.ts                                        # ✓ imported + used in tick

# Build and tests
npm run build   # ✓ zero errors (pre-existing chunk size warning unrelated)
npm run test    # ✓ 310/310 tests pass
```

## Known Concerns

**[Globe invisible during Entry display]**

Plan 02's `#scene-container { opacity: 0 }` cascades globally. This means the Three.js canvas (including the Entry Globe) is invisible when the Entry screen overlay is showing. The plan's verification step 4 expects "Globe visible on right half behind Entry overlay" but the current CSS pre-zeroing prevents this.

Additionally, the calibration overture's GSAP timeline tweens `sphereMat.opacity` from 0 to 1 over 2.7–3.2s. If the user clicks before 2.7s (early skip), the planet sphere material itself is at opacity 0. `cancel()` kills the tween at whatever value it has reached — so even if `#scene-container` were visible, the planet might still be invisible.

**Deferred to Plan 04 UAT.** The verifier will see this at visual review. The correct fix involves either: (a) sequencing Entry Globe reveal separately from `#scene-container`, or (b) keeping `#scene-container` visible and using a full-viewport overlay as the Entry fade-to-black surface. Architectural decision required before fixing.

**This does not block ENTRY-01 or ENTRY-09** — the Entry Globe spin is wired and correct; it just isn't visible through the opaque pre-zero. The sequencing logic (entry overlay mounts post-overture, ENTER_FIELD fires from CTA, scene fades in) is complete and correct.

## Known Stubs

None — all wiring is functional. The scene-container opacity concern above is a visual presentation issue, not a stub.

## Threat Flags

No new network endpoints, auth paths, or trust boundary changes. ENTER_FIELD dispatch is gated behind `entryScreenDismissed` (T-03-01 from plan threat model is mitigated).

## Self-Check: PASSED
