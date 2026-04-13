---
phase: 05-filter-panel-staging-sphere
plan: 02
subsystem: ui
tags: [vitest, jsdom, typescript, css, filter-panel, accordion]

# Dependency graph
requires:
  - phase: 05-01
    provides: "FilterState with proofTypes/impactBands, computeChipCounts cross-filter algorithm, FILTER_DIMENSIONS"
provides:
  - "filter-panel.ts rewritten as accordion with 5 dimensions (countries/services/years/proofTypes/impactBands)"
  - "11 DOM tests covering accordion structure, chip dim/on states, status bar, orbit-by switcher"
  - "Accordion CSS tokens: fgroup, fgroup-header (max-height 180ms spring), fchip/dim/on, filter-status"
affects:
  - "05-03 (shares filter panel state model)"
  - "05-04 (staging sphere uses same SceneObjects)"

# Tech tracking
tech-stack:
  added: ["@vitest-environment jsdom (per-file directive)"]
  patterns:
    - "Accordion pattern: CSS max-height transition on [data-open], no GSAP"
    - "computeChipCounts called once per render cycle (outside DOM loop)"
    - "dim class for 0-count chips (spatial stability) — never display:none"
    - "Filter state toggled by copying all dimensions then toggling one value"

key-files:
  created:
    - "src/ui/filter-panel.test.ts"
  modified:
    - "src/ui/filter-panel.ts"
    - "src/style.css"

key-decisions:
  - "mountFilterPanel signature kept unchanged: (container, objects, onGroupModeChange, onExitFocus?) — no onFilterChange callback added"
  - "allCases derived from Object.values(objects.nucleusOrbits).flatMap(n => n.cases) — covers both modes cleanly"
  - "Test file uses // @vitest-environment jsdom per-file directive (vite.config.ts default is node)"
  - "Dim chips (count=0) are non-interactive (early return on click) — spatial stability preserved"
  - "Orbit-by switcher uses .mode-chip[data-mode] divs, hidden in focused mode where #focusBack appears"

patterns-established:
  - "Filter panel render: buildGlobalHTML / buildFocusedHTML — two separate builders, same accordion sections"
  - "Chip counts computed once before building accordion HTML, passed into chip renderer"
  - "CSS uses --teal variable with hardcoded fallback #5ecfc0; no purple tokens"

requirements-completed: [FILT-01, FILT-08, FILT-10]

# Metrics
duration: 6min
completed: 2026-04-13
---

# Phase 5 Plan 02: Filter Panel Accordion Summary

**Five-dimension accordion filter panel with live cross-filter chip counts, CSS max-height transitions, and 11 DOM tests using jsdom**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-13T17:38:37Z
- **Completed:** 2026-04-13T17:44:21Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Rewrote filter-panel.ts from flat nucleus chips to accordion with 5 dimensions (countries, services, years, proofTypes, impactBands)
- All 146 tests pass (130 original + 11 new filter-panel + 5 staging that passed after 05-03 impl)
- Accordion CSS tokens appended to style.css with spring easing, teal accents, no purple tokens

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Write filter-panel.test.ts** - `9abf373` (test)
2. **Task 1 GREEN: Rewrite filter-panel.ts** - `68173eb` (feat)
3. **Task 2: Accordion CSS + TS fix** - `26316c2` (feat)

**Plan metadata:** (docs commit below)

_Note: TDD task had two commits (test RED → implementation GREEN)_

## Files Created/Modified
- `src/ui/filter-panel.test.ts` - 11 DOM tests: accordion structure, chip dim/on states, status bar, orbit-by switcher, focused mode
- `src/ui/filter-panel.ts` - Rewritten: buildGlobalHTML/buildFocusedHTML, 5 accordion sections, computeChipCounts integration
- `src/style.css` - Appended accordion CSS tokens (fgroup, fgroup-header, fgroup-body, fchip, filter-status)

## Decisions Made
- Kept `mountFilterPanel(container, objects, onGroupModeChange, onExitFocus?)` signature unchanged to avoid main.ts changes
- `allCases` derived from `Object.values(nucleusOrbits).flatMap(n => n.cases)` rather than from starMeshes — cleaner typing, works in both modes
- Per-file jsdom directive `// @vitest-environment jsdom` used rather than global config change (vite.config.ts stays node)
- CSS uses `var(--teal, #5ecfc0)` fallback pattern matching existing style conventions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors in test file**
- **Found during:** Task 2 (after running tsc --noEmit)
- **Issue:** Unused `FilterState` import and invalid `vi.fn<[GroupMode], void>()` generic syntax
- **Fix:** Removed unused import; replaced with `vi.fn() as (mode: GroupMode) => void`
- **Files modified:** src/ui/filter-panel.test.ts
- **Verification:** tsc --noEmit shows no errors in filter-panel files
- **Committed in:** 26316c2

---

**Total deviations:** 1 auto-fixed (1 bug - TypeScript type error in test)
**Impact on plan:** Minor fix, no scope creep.

## Issues Encountered
- vite.config.ts defaults to `environment: 'node'` but tests need DOM APIs. Resolved with per-file `// @vitest-environment jsdom` directive (advisor flagged this before implementation).
- staging.test.ts had 5 pre-existing failures from Plan 05-03 RED phase — confirmed not caused by this plan's changes. They passed after 05-03 GREEN impl was completed concurrently.

## Self-Check: PASSED

- FOUND: src/ui/filter-panel.test.ts
- FOUND: src/ui/filter-panel.ts
- FOUND: src/style.css
- FOUND: .planning/phases/05-filter-panel-staging-sphere/05-02-SUMMARY.md
- FOUND: commit 9abf373 (test RED)
- FOUND: commit 68173eb (feat GREEN)
- FOUND: commit 26316c2 (feat CSS + TS fix)

## Next Phase Readiness
- Filter panel accordion ready for visual testing in browser
- Plans 05-03 (staging sphere) is parallel wave 2 plan — execute together
- CSS tokens are additive, no breaking changes to existing filter styles
- Plan 05-04 (wave 3) can proceed once 05-02 and 05-03 are both complete

---
*Phase: 05-filter-panel-staging-sphere*
*Completed: 2026-04-13*
