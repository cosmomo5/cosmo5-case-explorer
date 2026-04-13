---
phase: 05-filter-panel-staging-sphere
plan: "04"
subsystem: ui
tags: [three.js, gsap, filter, scene-state, vitest]

requires:
  - phase: 05-filter-panel-staging-sphere
    provides: "Plan 05-03: global-branch applyFilter (staging sphere) + SceneObjects.scene field"
  - phase: 05-filter-panel-staging-sphere
    provides: "Plan 05-01: FilterState cross-filter counts + matchesFilter()"

provides:
  - "applyFilter() focused branch: dims non-matching stars to opacity 0.12, respects StarState precedence chain"
  - "Tick loop fix: focused mode defers opacity to userData.starState instead of recomputing every frame"
  - "scene-state.test.ts: 7 focused-filter tests covering filterDim, idle restore, precedence (reading/selected/ghost), no staging sphere in focused mode"

affects: [phase-06-reading-panel, scene-state.ts consumers]

tech-stack:
  added: []
  patterns:
    - "userData.starState as tick-loop opacity authority in focused mode — applyFilter writes state, tick loop reads it"
    - "gsap.killTweensOf(mat) + gsap.to(mat, { opacity }) pattern for material transitions"

key-files:
  created:
    - src/scene/scene-state.test.ts
  modified:
    - src/scene/scene-state.ts

key-decisions:
  - "Tick loop's focused opacity must defer to userData.starState — recomputing every frame defeats GSAP material tweens (Deviation Rule 3 fix)"
  - "Precedence gate: only idle/filterDim/filterMatch are overwritten by applyFilter focused branch; reading/selected/ghost are untouched"
  - "State set immediately before GSAP tween: tick loop reads userData.starState on same frame as applyFilter call, no one-frame flicker"

patterns-established:
  - "StarState precedence chain (reading > selected > ghost > filterMatch > filterDim > idle) enforced in applyFilter focused branch"
  - "GSAP material tween + userData.starState write happen together; tick loop defers to stored state in focused mode"

requirements-completed: [FILT-07]

duration: 10min
completed: 2026-04-13
---

# Phase 05 Plan 04: Focused-View Filter Dimming Summary

**applyFilter() focused branch dims non-matching stars to opacity 0.12 via GSAP, respects StarState precedence chain, with tick-loop fix to prevent per-frame opacity overwrite**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-13T17:52:00Z
- **Completed:** 2026-04-13T18:02:00Z
- **Tasks:** 2/2 complete
- **Files modified:** 2

## Accomplishments

- Completed the focused branch of `applyFilter()` in `scene-state.ts` (FILT-07)
- Fixed tick loop opacity assignment in focused mode to defer to `userData.starState` (without this, GSAP tweens were overwritten every frame ~16ms)
- Added 7 focused-filter tests in `scene-state.test.ts`; full suite 153 tests green
- Visual checkpoint approved: all five test flows (accordion, global filter + staging sphere, staging sphere → T1 focus, focused dimming, orbit-by switcher) confirmed working

## Task Commits

1. **Task 1: Focused-view filter dimming (FILT-07)** - `e31c14d` (feat)
2. **Task 2: Visual verify — full Phase 5 filter flow** - approved by Mo (all flows pass)

## Files Created/Modified

- `src/scene/scene-state.ts` — focused branch added to `applyFilter()`; tick loop opacity fixed for focused mode
- `src/scene/scene-state.test.ts` — NEW: 7 tests covering focused filter dimming and state precedence

## Decisions Made

- **Tick loop fix (Deviation Rule 3 — blocking):** The tick loop's `else` branch recomputed filter opacity every frame for all stars in all modes. In focused mode this overwrote any GSAP material tween immediately. Fix: add `else if (inFocused)` branch that reads `userData.starState` instead of recomputing. Without this, the focused filter animation would be invisible.
- **State write before tween:** `mesh.userData.starState = targetState` is set before the GSAP `to()` call, so the tick loop reads the correct state even on the frame the filter is applied.
- **Precedence gate expanded:** Plan specified `idle || filterDim` check; also added `filterMatch` to the gate since the tick loop was previously setting that state in focused mode — without it, previously filterMatch-set stars would never be dimmed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Tick loop overwriting GSAP material tweens in focused mode**
- **Found during:** Task 1 (focused-view filter dimming)
- **Issue:** The tick loop's `else` branch ran every frame (60fps) and set `mat.opacity` directly for all stars in global AND focused mode. Any GSAP tween applied by `applyFilter()` focused branch would be overwritten ~16ms later, making the animation invisible.
- **Fix:** Added `else if (inFocused)` branch that reads `resolveStarAppearance(userData.starState)` instead of recomputing. The new branch is a direct parallel to the ring-highlight branch already above it.
- **Files modified:** `src/scene/scene-state.ts` (tickOrbits function, lines ~368-376)
- **Verification:** All 153 tests pass; tick loop change is testable only visually (checkpoint Task 2)
- **Committed in:** `e31c14d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking issue)
**Impact on plan:** Essential for correctness. Without the tick loop fix, the focused filter dimming feature would have no visible effect. No scope creep.

## Issues Encountered

None beyond the tick loop deviation documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 5 complete (all 4 plans done, all flows visually verified)
- Phase 6 (Reading Panel + Track Selection) can begin: click case → reading panel slides in from right; Shortlist track in bottom zone
- Tick loop now has three opacity paths in focused mode: ring highlight > stored starState > (global path unreachable in focused)

## Self-Check: PASSED

- `src/scene/scene-state.test.ts` — FOUND
- `.planning/phases/05-filter-panel-staging-sphere/05-04-SUMMARY.md` — FOUND
- Commit `e31c14d` — FOUND
- 153 tests passing — VERIFIED

---
*Phase: 05-filter-panel-staging-sphere*
*Completed: 2026-04-13*
