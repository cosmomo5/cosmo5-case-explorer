---
phase: 10-query-bar
plan: 04
subsystem: ui
tags: [query-bar, keyword-map, filter, scene-state, three.js, aria, DM-Mono]

# Dependency graph
requires:
  - phase: 10-query-bar/10-02
    provides: applyQuery + FilterState.searchText in keyword-map.ts and filter.ts
  - phase: 10-query-bar/10-03
    provides: applyFilterWave + applyFilter exported from scene-state.ts
provides:
  - "src/ui/query-bar.ts: mountQueryBar, countMatches, countMatchingClusters"
  - "index.html: #queryInput / #queryReadout / #queryClear with full ARIA"
  - "src/style.css: .query-wrap / .query-bar / #queryInput / .query-readout / .query-clear rules"
  - "src/main.ts: mountQueryBar wired in boot sequence, legacy #globalSearch removed"
affects: [10-05, phase-11, phase-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "QueryBarDeps interface — dependency injection so mountQueryBar has no global references"
    - "Debounce pattern: immediate readout update + 80ms delayed wave animation"
    - "applyQuery clears searchText on empty string — clear path reuses existing filterState rather than creating fresh one, preserving other active filters"
    - "Test casts: mocked modules use 'as unknown as SceneObjects' when real signature diverges from stub"

key-files:
  created:
    - src/ui/query-bar.ts
  modified:
    - index.html
    - src/style.css
    - src/main.ts
    - src/tests/clusters-count.test.ts

key-decisions:
  - "countMatches/countMatchingClusters take SceneObjects (not decomposed arrays) — cleaner call site in mountQueryBar"
  - "Clear path: call applyQuery('') then applyFilter(sceneObjects, filterState) not createFilterState() — preserves sidebar filters"
  - "Escape key flushes debounce immediately (same as clear button) then blurs input"
  - "Dead .search-wrap .sc CSS removed along with the globalSearch button"

patterns-established:
  - "QueryBarDeps DI pattern: avoids global state, testable in isolation"
  - "Immediate readout + debounced wave: UI responsiveness without animation thrashing"

requirements-completed: [QRY-01, QRY-04, QRY-06, QRY-07, QRY-08]

# Metrics
duration: 25min
completed: 2026-04-16
---

# Phase 10 Plan 04: Query Bar Summary

**Centered conversational query input (DM Mono, gold focus border) wired to keyword mapping + wave propagation, with live N CASES / M CLUSTERS readout, keyboard shortcuts, and full ARIA — legacy #globalSearch removed**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-16T14:00:00Z
- **Completed:** 2026-04-16T14:25:00Z
- **Tasks:** 4
- **Files modified:** 5 (query-bar.ts, index.html, style.css, main.ts, clusters-count.test.ts)

## Accomplishments
- Replaced stub query-bar.ts with full implementation: mountQueryBar, countMatches, countMatchingClusters
- Query bar DOM centered in index.html with ARIA (role=searchbox, aria-label, aria-live=polite)
- CSS: .query-wrap fixed centered, gold :focus-within border, teal readout, DM Mono throughout
- main.ts: legacy direct-opacity globalSearch handler removed, mountQueryBar wired in boot sequence
- 239 tests passing, 0 skipped, TypeScript clean

## Task Commits

1. **Task 1+2: Query bar DOM and CSS** - `a7129dd` (feat)
2. **Task 3+4: query-bar.ts module + main.ts integration** - `62c1bfb` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/ui/query-bar.ts` — Full query bar component: mountQueryBar, countMatches, countMatchingClusters, updateReadout
- `index.html` — #queryInput / #queryReadout / #queryClear with ARIA; #globalSearch / #globalSearchClear removed
- `src/style.css` — .query-wrap / .query-bar / #queryInput / .query-readout / .query-clear rules; dead .sc rules removed
- `src/main.ts` — mountQueryBar import + boot-sequence call; elGlobalSearch/elGlobalClear + handlers removed
- `src/tests/clusters-count.test.ts` — Updated call-site casts to match new SceneObjects-based signatures (mocked, no behavior change)

## Decisions Made
- `countMatches` and `countMatchingClusters` operate on `SceneObjects` rather than decomposed arrays — this is the natural call site shape in `mountQueryBar` and avoids destructuring at the call site.
- Clear path preserves existing `filterState` instead of creating a fresh one — calling `applyQuery('')` sets `searchText` to empty, then `applyFilter(sceneObjects, filterState)` restores all stars while keeping sidebar chip filters intact.
- Escape key flushes the debounce timer immediately (same semantics as the clear button) then blurs the input.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Clear path would have reset all active sidebar filters**
- **Found during:** Task 3 (query-bar.ts implementation) + advisor review
- **Issue:** Plan's proposed code used `applyFilter(deps.sceneObjects, createFilterState())` on empty query — this creates a fresh FilterState, wiping any year/service/scope filters the user had selected in the sidebar.
- **Fix:** Call `applyQuery('', deps.filterState, deps.cases)` first (which sets `searchText = ''`), then `applyFilter(deps.sceneObjects, deps.filterState)` using the existing, now-cleared filterState.
- **Files modified:** src/ui/query-bar.ts
- **Verification:** TypeScript clean, 239 tests pass, logic review confirms no createFilterState() call on clear path
- **Committed in:** 62c1bfb

**2. [Rule 1 - Bug] Test call-site type mismatch after signature change**
- **Found during:** Task 3 verification (npx tsc --noEmit)
- **Issue:** clusters-count.test.ts passed `cases as any[]` to `countMatches` — valid for the old stub signature but TypeScript error under the new SceneObjects signature. (Module is fully mocked so runtime behavior unchanged.)
- **Fix:** Added `import type { SceneObjects }` to test and changed casts to `as unknown as SceneObjects`.
- **Files modified:** src/tests/clusters-count.test.ts
- **Verification:** npx tsc --noEmit exits 0
- **Committed in:** 62c1bfb

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes essential for correctness. No scope creep. Behavior contract unchanged for tests.

## Issues Encountered
None beyond the two auto-fixed deviations above.

## User Setup Required
None — no external services required.

## Next Phase Readiness
- Query bar fully wired. Plan 05 (Advanced Drawer toggle) can add `#queryAdvancedToggle` / `#advancedDrawer` DOM nodes and CSS to the existing `.query-wrap` container.
- The `QueryBarDeps.onFilterChange` callback is a no-op stub — Plan 05 or later phases can populate it with label sync if needed.
- ARIA structure for the advanced drawer (`aria-expanded`, `aria-controls`, `aria-hidden`) is already validated in query-bar.test.ts.

---
*Phase: 10-query-bar*
*Completed: 2026-04-16*

## Self-Check: PASSED
- `src/ui/query-bar.ts`: FOUND
- `index.html`: FOUND (globalSearch removed, queryInput present)
- `src/style.css`: FOUND (query-wrap CSS present)
- `src/main.ts`: FOUND (mountQueryBar present, globalSearch absent)
- Commit a7129dd: FOUND
- Commit 62c1bfb: FOUND
- 239 tests passing, 0 skipped: VERIFIED
- TypeScript clean: VERIFIED
