---
phase: 10-query-bar
plan: 01
subsystem: testing
tags: [vitest, tdd, wave-0, query-bar, keyword-map, filter, scene-state]

requires:
  - phase: 09-atmosphere
    provides: "207 passing tests baseline; scene-state.ts with applyFilter and SceneObjects shape"

provides:
  - "src/tests/keyword-map.test.ts — 7 tests for keyword→dimension mapping (applyQuery)"
  - "src/tests/filter-searchtext.test.ts — 7 tests for FilterState searchText extension (6 skipped, 1 live)"
  - "src/tests/filter-wave.test.ts — 6 tests for applyFilterWave wave propagation"
  - "src/tests/clusters-count.test.ts — 5 tests for countMatches/countMatchingClusters"
  - "src/tests/query-bar.test.ts — 7 DOM/ARIA structural tests for QRY-01 through QRY-08"
  - "src/data/keyword-map.ts — stub module (Plan 02 replaces)"
  - "src/ui/query-bar.ts — stub module (Plan 04 replaces)"

affects: [10-02, 10-03, 10-04]

tech-stack:
  added: []
  patterns:
    - "Wave 0 stubs: create minimal stub modules so Vite's import analysis can resolve not-yet-implemented paths"
    - "it.skip for Wave 0: tests that test future behavior get it.skip, with comment linking to the plan that will unskip them"
    - "vi.mock with spread of actual: vi.mock('../scene/scene-state', async importOriginal => ({ ...actual, applyFilterWave: vi.fn() })) pattern for adding mocked exports to existing modules"

key-files:
  created:
    - src/tests/keyword-map.test.ts
    - src/tests/filter-searchtext.test.ts
    - src/tests/filter-wave.test.ts
    - src/tests/clusters-count.test.ts
    - src/tests/query-bar.test.ts
    - src/data/keyword-map.ts
    - src/ui/query-bar.ts
  modified: []

key-decisions:
  - "Created stub modules (keyword-map.ts, query-bar.ts) rather than using vi.mock alone — Vite's import analysis runs before mock hoisting and fails on non-existent paths"
  - "Used it.skip for filter-searchtext tests that depend on Plan 02's matchesFilter extension — keeps suite clean while preserving contract"
  - "Fixed mock shape to match existing gsap mock pattern: { gsap: { to, killTweensOf } } not { default: { to } }"
  - "Fixed CaseStudy mock shape: countries (array) not country (string); removed non-existent direct proofType/impactBand fields from raw CaseStudy"

patterns-established:
  - "Wave 0 test pattern: stub module + vi.mock in test + it.skip for unimplemented behavior"
  - "All new test files in src/tests/ (separate from co-located module tests)"

requirements-completed: [QRY-02, QRY-03, QRY-04]

duration: ~20min
completed: 2026-04-16
---

# Phase 10 Plan 01: Wave 0 Query Bar Test Stubs Summary

**Five test contract files for keyword mapping, searchText filter extension, wave propagation, match/cluster counting, and DOM/ARIA structure — all 207 existing tests still passing.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-16T11:40:00Z
- **Completed:** 2026-04-16T11:54:43Z
- **Tasks:** 5 (all complete)
- **Files modified:** 7 created, 0 modified

## Accomplishments

- 5 test stub files in `src/tests/` covering all Wave 0 contracts (QRY-01 through QRY-08)
- 2 minimal stub implementation files so Vite resolves imports without breaking existing tests
- 207 pre-existing tests unchanged; new suite: 233 passing, 6 skipped
- Corrected plan's type errors before writing (CaseStudy shape, gsap mock pattern)

## Task Commits

All 5 tasks committed in a single batch per plan spec:

1. **All tasks** - `2fcbf0f` (test(10-01): add Wave 0 test stubs for query bar)

## Files Created/Modified

- `src/tests/keyword-map.test.ts` — 7 tests for applyQuery keyword→dimension mapping
- `src/tests/filter-searchtext.test.ts` — 7 tests for FilterState.searchText extension (6 skipped)
- `src/tests/filter-wave.test.ts` — 6 tests for applyFilterWave with gsap delay verification
- `src/tests/clusters-count.test.ts` — 5 tests for countMatches and countMatchingClusters
- `src/tests/query-bar.test.ts` — 7 DOM/ARIA structural tests (QRY-01, QRY-05, QRY-06, QRY-07, QRY-08)
- `src/data/keyword-map.ts` — stub: exports applyQuery (throws), KEYWORD_HINTS. Plan 02 replaces.
- `src/ui/query-bar.ts` — stub: exports countMatches, countMatchingClusters, mountQueryBar (all throw). Plan 04 replaces.

## Decisions Made

- **Stub modules over vi.mock-only:** Vite's import analysis runs before mock hoisting; non-existent paths fail at transform time regardless of vi.mock declarations. Stub files are the correct solution.
- **it.skip for future behavior:** filter-searchtext tests that require Plan 02's matchesFilter extension are skipped, not deleted. Comment links to the activating plan.
- **gsap mock corrected:** plan spec had `{ default: { to, killTweensOf } }` but existing codebase uses `{ gsap: { to, killTweensOf } }` (named export, not default). Fixed to match.
- **CaseStudy shape corrected:** plan's mock had `country: 'Germany'` (string) and direct `proofType`/`impactBand` fields — real type uses `countries: string[]` and those fields live on `EnrichedCaseStudy`. Fixed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CaseStudy mock shape in filter-searchtext.test.ts**
- **Found during:** Task 2 (filter-searchtext stubs)
- **Issue:** Plan spec had `country: 'Germany'` (string), `proofType: 'Revenue'`, `impactBand: 'significant'` as direct CaseStudy fields. Real CaseStudy uses `countries: string[]`; proofType/impactBand live on EnrichedCaseStudy.
- **Fix:** Used `EnrichedCaseStudy` type and correct field shapes
- **Files modified:** src/tests/filter-searchtext.test.ts
- **Committed in:** 2fcbf0f

**2. [Rule 1 - Bug] Fixed gsap mock pattern**
- **Found during:** Task 3 (filter-wave stubs)
- **Issue:** Plan spec used `{ default: { to, killTweensOf } }` but existing scene-state.test.ts uses `{ gsap: { to, killTweensOf } }`
- **Fix:** Matched existing mock pattern
- **Files modified:** src/tests/filter-wave.test.ts
- **Committed in:** 2fcbf0f

**3. [Rule 3 - Blocking] Created stub modules to satisfy Vite import resolution**
- **Found during:** First test run (keyword-map, clusters-count failures)
- **Issue:** `vi.mock('../data/keyword-map')` does not prevent Vite's import analysis from failing on non-existent files. `Failed to resolve import "../data/keyword-map"` at transform time.
- **Fix:** Created minimal stub `src/data/keyword-map.ts` and `src/ui/query-bar.ts` with typed stubs that throw on call
- **Files modified:** src/data/keyword-map.ts (created), src/ui/query-bar.ts (created)
- **Committed in:** 2fcbf0f

**4. [Rule 1 - Bug] Fixed await inside non-async test function (filter-wave.test.ts)**
- **Found during:** First test run (esbuild transform error)
- **Issue:** Test used `const { gsap } = await import('gsap')` inside a synchronous `it(...)` callback
- **Fix:** Changed callback to `async`, accessed `gsap` via `gsapMod.gsap` named export
- **Files modified:** src/tests/filter-wave.test.ts
- **Committed in:** 2fcbf0f

---

**Total deviations:** 4 auto-fixed (2 Rule 1 type corrections, 1 Rule 3 blocking, 1 Rule 1 syntax error)
**Impact on plan:** All fixes necessary for correctness and test suite stability. No scope creep.

## Issues Encountered

- `vi.mock` factory alone insufficient for non-existent modules in Vite — Vite resolves imports at transform time, before mock hoisting. Solution: create minimal stub files (standard Wave 0 pattern for this codebase).
- `it.skip` used on 6 of 7 filter-searchtext tests because they test behavior that doesn't exist yet. One test ("without searchText behaves as before") passes now and serves as a regression guard.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plans 02-05 can now implement against these test contracts
- Plan 02 (`filter.ts` + `keyword-map.ts` implementation): unskip the 6 filter-searchtext tests when `matchesFilter` handles `searchText`
- Plan 03 (`scene-state.ts` + `applyFilterWave`): replace the vi.mock stub with real implementation; all 6 filter-wave tests should pass
- Plan 04 (`query-bar.ts` UI): replace stub with real implementation; clusters-count and query-bar tests go live
- No blockers for any of the above plans

---
*Phase: 10-query-bar*
*Completed: 2026-04-16*
