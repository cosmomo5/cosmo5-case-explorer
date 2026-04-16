---
phase: 10-query-bar
plan: "05"
subsystem: ui
tags: [filter-panel, advanced-drawer, aria, progressive-disclosure, animation, css-transition]

# Dependency graph
requires:
  - phase: 10-query-bar/10-04
    provides: mountQueryBar wired in query-bar.ts with #queryWrap DOM
  - phase: 10-query-bar/10-01
    provides: filter-panel.ts with mountFilterPanel baseline

provides:
  - "mountFilterPanel accepts optional hideModeSwitcher option"
  - "Advanced drawer DOM (#advancedDrawer) with ARIA (aria-expanded, aria-controls, aria-hidden)"
  - "CSS max-height transition for drawer open/close with prefers-reduced-motion gate"
  - "Toggle button (#queryAdvancedToggle) wired in mountQueryBar — lazy-mounts filter panel on first open"
  - "All 5 filter dimensions (countries, services, years, proofTypes, impactBands) accessible from drawer"
  - "Mode-chip (orbit-by switcher) excluded from drawer via hideModeSwitcher: true"

affects: [phase-11-reading-panel, phase-14-edge-states]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lazy-mount pattern: drawer filter panel is only mounted on first open (drawerMounted flag)"
    - "Additive options flag (hideModeSwitcher) on existing component — preserves all existing call sites"
    - "CSS max-height transition with prefers-reduced-motion override for collapse/expand"
    - "ARIA state machine: aria-expanded on toggle + aria-hidden on panel, toggled in sync"

key-files:
  created: []
  modified:
    - src/ui/filter-panel.ts
    - src/ui/query-bar.ts
    - index.html
    - src/style.css

key-decisions:
  - "Option A (additive flag) chosen over Option B (separate component) — lower risk, preserves existing call sites"
  - "Lazy mount: filter panel only instantiated on first open, not at mountQueryBar call time"
  - "drawerMounted guard prevents duplicate mountFilterPanel calls on repeated open/close"

patterns-established:
  - "Additive options: extend mountFilterPanel signature with optional options param, default behavior unchanged"
  - "Lazy UI mount: defer component mounting until first user interaction with its container"

requirements-completed: [QRY-05]

# Metrics
duration: 15min
completed: 2026-04-16
---

# Phase 10 Plan 05: Advanced Drawer + Filter Panel Integration Summary

**Progressive-disclosure Advanced drawer below the query bar: lazy-mounts the v3.1 filter panel with mode-chip excluded, CSS max-height transition, full ARIA state machine.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-16T13:49:36Z
- **Completed:** 2026-04-16T13:49:36Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `mountFilterPanel` extended with optional `FilterPanelOptions` (`hideModeSwitcher?: boolean`); mode-chip row conditionally excluded; all existing call sites unaffected
- Advanced drawer DOM added to `#queryWrap` in `index.html` with `aria-expanded="false"` on toggle button and `aria-hidden="true"` on drawer panel
- CSS max-height transition (`0 → 400px`) with `@media (prefers-reduced-motion: reduce)` override; `query-advanced-toggle` button styled inline with query bar register
- Toggle wired in `mountQueryBar` with `drawerMounted` guard (lazy-mount: filter panel instantiated only on first open, not re-mounted on subsequent opens)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add hideModeSwitcher option to mountFilterPanel** - `aca3b40` (feat)
2. **Tasks 2+3: Advanced drawer DOM, CSS, and query-bar wiring** - `3e90829` (feat)

## Files Created/Modified

- `src/ui/filter-panel.ts` - Added `FilterPanelOptions` interface; `buildGlobalHTML` accepts `options?` parameter; mode-chip row wrapped in `if (!options?.hideModeSwitcher)` conditional
- `src/ui/query-bar.ts` - Added drawer wiring: `toggleBtn`/`drawer` element refs, click handler toggling `.open` class + ARIA state, lazy `mountFilterPanel` call with `{ hideModeSwitcher: true }`
- `index.html` - Added `#queryAdvancedToggle` button and `#advancedDrawer` div inside `#queryWrap`, after `.query-bar`
- `src/style.css` - Added `.query-advanced-toggle` and `.advanced-drawer` rules with max-height transition and reduced-motion gate

## Decisions Made

- **Option A (additive flag) over Option B (separate component):** Filter panel already renders all 5 dimensions correctly. A flag is a single conditional; a new component would duplicate all rendering logic. Lower risk, zero regression surface.
- **Lazy mount:** Filter panel DOM is expensive to build (queries all cases, computes chip counts). Defer instantiation until first open rather than paying cost at `mountQueryBar` call time.
- **`drawerMounted` guard:** Prevents `mountFilterPanel` from being called again on repeated open/close cycles. The panel manages its own internal state after first mount.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 10 (Query Bar) is now complete. All 5 plans executed. 239 tests passing, TypeScript clean.
- Phase 11 (Reading Panel as Instrument) can begin: depends on schema extension (Phase 8, done) and atmosphere (Phase 9, done).
- The Advanced drawer exposes all 5 filter dimensions at full v3.1 fidelity. Mode-chip correctly excluded.

---
*Phase: 10-query-bar*
*Completed: 2026-04-16*
