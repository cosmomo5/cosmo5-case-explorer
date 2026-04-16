---
phase: 09-atmosphere
plan: 01
subsystem: ui
tags: [three.js, canvas2d, graticule, crt-grid, atmosphere, starfield]

# Dependency graph
requires:
  - phase: 08-clean-substrate
    provides: clean codebase, 195 tests passing, createStarfield function
provides:
  - CRT celestial graticule mesh (24 radial spokes + 5 concentric circles, 1024x1024 canvas)
  - createGraticule() factory returning transparent Three.js Mesh at z=-300
  - crtGridTexture() returning CanvasTexture drawn via Canvas2D API
  - Graticule integrated into starfield scene, renders behind all star layers
affects: [09-atmosphere, 10-query-bar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "jsdom canvas mock via beforeAll patching HTMLCanvasElement.prototype.getContext with (HTMLCanvasElement.prototype as any) cast"
    - "Graticule added to scene before star points so it renders behind them regardless of depthWrite"

key-files:
  created:
    - src/scene/background/graticule.ts
    - src/scene/background/graticule.test.ts
  modified:
    - src/scene/background/starfield.ts

key-decisions:
  - "Canvas stub in tests uses (HTMLCanvasElement.prototype as any) cast to avoid overload-typing conflict — avoids installing canvas npm package"
  - "Graticule added first in scene.add() call before star layers — belt-and-suspenders alongside depthWrite:false"

patterns-established:
  - "Pattern: jsdom getContext stub — patch prototype with any cast, return minimal method stubs matching the calls actually made"

requirements-completed: [ATM-01]

# Metrics
duration: 15min
completed: 2026-04-16
---

# Phase 09 Plan 01: Atmosphere Summary

**CRT celestial graticule: 24-spoke radial grid on 1024x1024 CanvasTexture rendered as transparent Three.js Mesh behind the starfield at z=-300, opacity 0.08**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-16T10:48:00Z
- **Completed:** 2026-04-16T11:01:52Z
- **Tasks:** 3 (committed as 2: Task 1 standalone, Tasks 2+3 together)
- **Files modified:** 3

## Accomplishments
- `graticule.ts` exports `crtGridTexture()` (1024x1024 canvas, 24 spokes, 5 concentric circles) and `createGraticule()` (PlaneGeometry 800x800, opacity 0.08, depthWrite:false, position.z=-300)
- `starfield.ts` integrates graticule before star layers so the grid renders behind all star points
- 6 unit tests passing, full suite at 207 tests (up from 195), TypeScript clean

## Task Commits

1. **Task 1: Create graticule test stubs** - `09588f6` (test)
2. **Tasks 2+3: Implement graticule module + integrate into starfield** - `7c6bfa1` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/scene/background/graticule.ts` - crtGridTexture() and createGraticule() factory functions
- `src/scene/background/graticule.test.ts` - 6 unit tests with jsdom canvas stub
- `src/scene/background/starfield.ts` - imports createGraticule, adds mesh to scene before star layers

## Decisions Made
- Used `(HTMLCanvasElement.prototype as any).getContext` cast in test mock rather than installing the `canvas` npm package — keeps the test environment lightweight and the cast is localized to the test file
- Graticule position in `scene.add(createGraticule(), far, mid, nr)` before star layers for belt-and-suspenders ordering, though `depthWrite:false` already prevents occlusion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jsdom canvas getContext returns null — test mock required**
- **Found during:** Task 2 (implement graticule module)
- **Issue:** jsdom doesn't implement `HTMLCanvasElement.getContext('2d')`, returning null. `graticule.ts` immediately calls `ctx.strokeStyle = ...` which threw `Cannot set properties of null`. Tests that directly call `crtGridTexture()` fail at runtime.
- **Fix:** Added `beforeAll` in `graticule.test.ts` that stubs `HTMLCanvasElement.prototype.getContext` with a minimal method stub. Used `(HTMLCanvasElement.prototype as any)` cast to avoid TypeScript's overload-type conflict on `getContext`.
- **Files modified:** `src/scene/background/graticule.test.ts`
- **Verification:** All 6 tests pass, TypeScript clean, `tsc --noEmit` passes
- **Committed in:** `7c6bfa1` (Tasks 2+3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required — the test file as written in Task 1 could not pass without a canvas stub. The fix is minimal and localized.

## Issues Encountered
- Task 1 test stubs initially lacked the canvas mock (by design — tests were meant to fail). The mock was added as part of Task 2 when the implementation was written and the failure mode became clear (null context, not missing module).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Graticule substrate in place. ATM-01 complete.
- Phase 09 Plan 02 can proceed with the instrument-calibrating loader (ATM-02/ATM-03).
- Visual result: very faint radial grid behind stars, visible only on close look. If it draws attention, lower opacity from 0.08 toward 0.06.

---
*Phase: 09-atmosphere*
*Completed: 2026-04-16*
