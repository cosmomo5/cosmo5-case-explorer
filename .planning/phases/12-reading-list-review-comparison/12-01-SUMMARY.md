---
phase: 12-reading-list-review-comparison
plan: 01
subsystem: persistence
tags: [localStorage, hydration, debounce, query-history, recently-viewed]
status: complete
duration_minutes: 45
completed_date: 2026-04-16T15:30:00Z
dependency_graph:
  requires: []
  provides: [localStorage-persistence, query-history-api, recently-viewed-api, reading-list-hydration]
  affects: [12-02, 12-03, 12-04, 12-05]
tech_stack:
  added: []
  patterns: [debounced-writes, try-catch-wrappers, localStorage-versioning]
key_files:
  created:
    - src/data/persistence.ts
  modified:
    - src/data/shortlist-store.ts
    - src/main.ts
    - src/ui/query-bar.ts
    - src/ui/reading-panel.ts
    - index.html
    - src/style.css
decisions:
  - "Use three independent localStorage keys (cosmo5.readingList.v1, cosmo5.queryHistory.v1, cosmo5.recentlyViewed.v1) for separation of concerns and independent versioning"
  - "Implement 300ms debounce on store mutations to batch writes and prevent quota thrashing"
  - "Track addedAt as Map internal to store with property getter/setter for JSON serialization"
  - "Limit query history to 5 unique queries (FIFO) and recently-viewed to 10 case IDs"
  - "Render query history chips on mount and re-render on Enter, Escape, or chip click"
metrics:
  tests_passing: 239
  typescript_errors: 0
  files_created: 1
  files_modified: 6
---

# Phase 12 Plan 01: localStorage Persistence Layer Summary

**Objective:** Implement the localStorage persistence layer for reading list, query history, and recently-viewed cases. This is the data foundation that all other Phase 12 features depend on.

## Completed

### Task 1: Create persistence module
- Created `src/data/persistence.ts` with three independent subsystems
- **Reading list persistence**: `hydrateReadingList()`, `persistReadingList()`, `setupReadingListPersistence()` with 300ms debounce
- **Query history**: `loadQueryHistory()`, `saveQueryHistory()`, `addQueryToHistory()` (max 5, deduplicated)
- **Recently-viewed**: `loadRecentlyViewed()`, `saveRecentlyViewed()`, `trackRecentlyViewed()` (max 10, prepended, deduplicated)
- All localStorage calls wrapped in try/catch for quota/parse errors
- Verified: All key patterns present (cosmo5.readingList.v1, cosmo5.queryHistory.v1, cosmo5.recentlyViewed.v1)

### Task 2: Extend ShortlistStore and wire persistence
- Extended `ShortlistStore` in `src/data/shortlist-store.ts` to track `addedAt` timestamps
  - Timestamps recorded on add, cleared on remove
  - Exposed as `_addedAt` property (JSON-serializable object) for hydration
  - Internal `_addedAtMap` (Map) for fast lookups
- Updated `src/main.ts` to:
  - Import `hydrateReadingList` and `setupReadingListPersistence`
  - Hydrate store from localStorage immediately after creation
  - Subscribe to store mutations with debounced persistence
- Updated `src/ui/reading-panel.ts` to:
  - Import `trackRecentlyViewed` from persistence module
  - Call `trackRecentlyViewed(caseId)` in `open()` method before panel renders

### Task 3: Add query history chips to query bar
- Added `.query-history` container to `index.html` (below query-bar, inside query-wrap)
- Created `renderQueryHistory()` function in `src/ui/query-bar.ts` to render chips from localStorage
- Render chips on mount with history loaded from localStorage
- On Enter key: save query to history, re-render chips
- On chip click: set input value, trigger wave, add to history if new
- Added CSS styling for `.query-history` (flex, gap 6px, wrap) and `.query-chip` (DM Mono, 10px, rgba borders, hover state)
- Verified: Chips render correctly and are clickable

## Verification

### Automated Checks
- TypeScript: **clean** (0 errors)
- Test suite: **239 tests passing** (all v3.1 baseline tests still passing)
- localStorage keys: all three keys present in code
- Hydration: wired in main.ts
- Query history: rendering logic verified
- Recently-viewed: tracking call added to reading-panel

### Manual Spot-Checks
- Persistence module exports all required functions
- ShortlistStore addedAt tracking works (Date.now() on add)
- Debounce timeout set to 300ms (prevents quota thrashing)
- Query history max 5 entries enforced
- Recently-viewed max 10 entries enforced
- Query chip click handler re-runs the query

## Deviations from Plan

None — plan executed exactly as written.

## Known Limitations / Deferred

1. **Ghost star mesh lifecycle** — deferred to Phase 12 Task 3 (star flight animations, RL-03/RL-04)
2. **Welcome-back timestamp bucketing** — deferred to Phase 12 Task 4 (welcome-back readout, RL-08)
3. **Narrow viewport handling for Comparison Mode** — deferred to Phase 14 (EDG-05)
4. **Recently-viewed consumption in UI** — deferred to Phase 14 (not yet required in Phase 12)

## Next Steps

1. **Phase 12 Plan 02**: Extend ShortlistStore API with `getAddedAt()` if needed for welcome-back readout
2. **Phase 12 Plan 03**: Star flight animations (700ms add, 900ms remove)
3. **Phase 12 Plan 04**: Review Mode overlay + pagination
4. **Phase 12 Plan 05**: Comparison Mode (phyllotaxis gather, dimming, UI hide)

## Notes

- The 300ms debounce on store mutations is crucial to prevent localStorage quota errors under rapid click-add/click-remove cycles
- Query history deduplication uses exact string match (case-sensitive)
- Recently-viewed prepends (most recent first) to enable "just opened" UX signal
- All localStorage reads are defensive (empty array/object fallbacks) to handle corruption or quota scenarios
- The ShortlistStore's `_addedAt` property uses a getter/setter pattern for seamless hydration
