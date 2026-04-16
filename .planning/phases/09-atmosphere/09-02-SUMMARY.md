---
phase: 09-atmosphere
plan: "02"
subsystem: ui
tags: [loader, state-machine, css, animation, accessibility, prefers-reduced-motion]

# Dependency graph
requires:
  - phase: 09-atmosphere-01
    provides: CRT grid substrate (ATM-01) — this plan shares the atmosphere phase

provides:
  - LoaderController class (src/ui/loader.ts) with advance(step)/done() methods
  - Instrument-calibrating loader DOM with 4 DM Mono status lines
  - CSS step-end transitions on data-step attribute (sharp cuts, no fades)
  - ONLINE state in var(--gold) with 400ms hold before fade-out
  - Reduced-motion path: constructor skips to ONLINE immediately (ATM-04)

affects:
  - Any future plan touching the boot sequence or loader
  - Phase 09 atmosphere visual tests

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS-driven state machine via data-step attribute on loader element
    - Thin JS controller (LoaderController) toggling attribute at real async milestones
    - step-end timing for instant state cuts without interpolation

key-files:
  created:
    - src/ui/loader.ts
    - src/ui/loader.test.ts
  modified:
    - src/main.ts
    - index.html
    - src/style.css

key-decisions:
  - "CSS-driven state machine: data-step attribute + [data-step] selectors — JS is a thin driver only"
  - "step-end timing for loader transitions — sharp cuts match observatory instrument register"
  - "400ms hold at ONLINE before done() — readable but not theatrical"
  - "LoaderController handles reduced-motion check internally — main.ts reduceMotion gate untouched"

patterns-established:
  - "LoaderController pattern: advance(step) sets data-step attribute; CSS shows/hides lines via attribute selectors"
  - "Boot sequence milestones: constructor (INIT) → after fetch (DATA) → after buildOrbitalScene (SCENE) → tick start (ONLINE)"

requirements-completed: [ATM-02, ATM-04]

# Metrics
duration: 4min
completed: "2026-04-16"
---

# Phase 09 Plan 02: Instrument-Calibrating Loader Summary

**LoaderController state machine (INIT/DATA/SCENE/ONLINE) wired to 4 real boot milestones with step-end cuts and gold ONLINE state, with reduced-motion skip path**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-16T10:48:59Z
- **Completed:** 2026-04-16T10:52:59Z
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments

- LoaderController class exported from src/ui/loader.ts — thin JS driver for CSS-powered state machine
- 6 unit tests for state machine and reduced-motion skip (ATM-04) all passing
- CSS step-end transitions on 4 data-step states; ONLINE line renders in var(--gold)
- main.ts boot sequence wired to 4 real async milestones: constructor (INIT), fetch resolve (DATA), buildOrbitalScene complete (SCENE), tick start (ONLINE)
- 400ms hold at ONLINE before loader fades — readable without being theatrical

## Task Commits

1. **Task 1: LoaderController test stubs** - `e552672` (test)
2. **Tasks 2-5: Implementation** - `0b5d3f0` (feat)

## Files Created/Modified

- `src/ui/loader.ts` - LoaderController class with advance(step)/done() methods and reduced-motion constructor check
- `src/ui/loader.test.ts` - 6 vitest/jsdom tests covering state machine and ATM-04 reduced-motion skip
- `src/main.ts` - Import + loaderCtrl instantiation; 4 milestone advance calls; 400ms ONLINE hold; catch block updated
- `index.html` - Loader DOM replaced with 4 DM Mono status lines in .loader-status container; inline error scripts updated
- `src/style.css` - Old .lk/.bar rules removed; new .loader-status/.ls rules with step-end transitions; ONLINE gold

## Decisions Made

- CSS-driven state machine: the plan specified this and it's the right separation. JS only touches one attribute; CSS handles all visibility logic.
- step-end timing: matches the observatory/instrument register. No crossfade between states — each line appears instantly.
- LoaderController handles its own reduced-motion check rather than delegating to main.ts's reduceMotion gate — keeps the controller self-contained and testable in isolation.
- 400ms ONLINE hold: long enough to read, short enough to not feel theatrical.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed broken .lk references after DOM replacement**
- **Found during:** Review before Task 3 (advisor flagged this)
- **Issue:** Three places referenced `.lk` element: index.html 8-second diagnostic timeout, index.html module onerror handler, main.ts catch block. After Task 3 removes the `.lk` element, all three silently fail — no error display for users.
- **Fix:** Updated all three references to target `.ls1` (the first status line in the new DOM). Inline scripts in index.html retargeted; main.ts catch block updated from `.querySelector('.lk')` to `.querySelector('.ls1')`.
- **Files modified:** index.html, src/main.ts
- **Verification:** grep confirms no `.lk` references remain in either file; TypeScript clean
- **Committed in:** 0b5d3f0 (Tasks 2-5 feat commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking)
**Impact on plan:** Essential correctness fix. The diagnostic/error display paths would have silently broken after the DOM change. No scope creep.

## Issues Encountered

- `graticule.test.ts` (6 tests) failing with `HTMLCanvasElement.getContext()` not implemented in jsdom — these are pre-existing failures introduced in 09-01 Wave 0 test stubs, not caused by this plan. 201 tests pass (195 prior + 6 new loader tests). Graticule tests require `canvas` npm package for jsdom — that fix belongs to 09-01's implementation task.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ATM-02 and ATM-04 complete. Loader is wired and honest.
- Phase 09-01 graticule implementation task is the remaining open item in Phase 9.
- When 09-01 implementation runs, it should also fix graticule.test.ts by either installing the `canvas` npm package or mocking `getContext('2d')` in the test environment.

---
*Phase: 09-atmosphere*
*Completed: 2026-04-16*
