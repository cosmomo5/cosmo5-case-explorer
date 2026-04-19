---
phase: 19-remove-query-input
plan: 03
type: execute
wave: 2
date_completed: 2026-04-19
duration_minutes: 12
tasks_completed: 1
commits: ["4972d31"]
test_count_before: 303
test_count_after: 287
bundle_size_before_gzip_kb: 239.37
bundle_size_after_gzip_kb: 237.32
---

# Phase 19 Plan 03: Remove Query-Input Tests — Summary

**Objective:** Delete the query-input test file and remove query-related test cases from the unified-column test file, finalizing the removal of the query input surface after Plans 19-01 and 19-02 deleted the implementation.

## Execution

### Tasks Completed

1. **Delete src/tests/filter-searchtext.test.ts entirely** ✓
   - File was 75 lines, 7 tests covering only the searchText predicate in matchesFilter
   - Deleted via `rm src/tests/filter-searchtext.test.ts`
   - Verified deletion: no file, no references in codebase

2. **Remove Tests 1-7 from src/ui/unified-column.test.ts** ✓
   - Removed "Unified Left Column - Input Behavior" describe block (Tests 1, 3-5)
   - Removed "Unified Left Column - Query History" describe block (Test 2)
   - Removed "Unified Left Column - Keyboard Handlers" describe block (Tests 6-7)
   - Tests 8-9 (View-State Auto-Expand) remain intact per D-05 wiring

3. **Prune searchText tests from src/tests/phase14-edge-states.test.ts** ✓
   - Removed tests referencing `fs.searchText` (lines 11-21 in original)
   - Removed "returns true for a text-only query" test
   - Removed "returns false when searchText is empty string" test
   - Kept regression test for dimension-only filter (unchanged scope)

### Verification Results

**TypeScript:**
- `npx tsc --noEmit` → ✓ Clean (0 errors)

**Tests:**
- `npm run test` → ✓ All passing
- Test count: **287/287** (down from 303 before)
- Breakdown of deletions:
  - filter-searchtext.test.ts: 7 tests deleted
  - unified-column.test.ts: 7 tests deleted (Tests 1-7), 2 retained (Tests 8-9)
  - phase14-edge-states.test.ts: 2 searchText-specific tests pruned

**Build:**
- `npm run build` → ✓ Success
- Bundle size (gzipped): **237.32 KB** (down from 239.37 KB, **2.05 KB reduction**)
- No breaking changes, all assets generated

## Deviations from Plan

None. Plan executed exactly as written. All tasks completed successfully.

## Must-Haves Verification

| Must-Have | Status | Evidence |
|-----------|--------|----------|
| filter-searchtext.test.ts does not exist | ✓ | File deleted; `[ ! -f src/tests/filter-searchtext.test.ts ]` returns success |
| unified-column.test.ts has only Tests 8-9 | ✓ | Tests 1-7 removed; `grep 'Test [89]:'` finds 2 matches |
| No Tests 1-7 or related describe blocks | ✓ | `grep -n 'Test [1-7]:'` returns 0 matches; no Input Behavior, Query History, Keyboard Handlers blocks |
| npm run test passes (~290 tests) | ✓ | 287/287 tests pass (expected ~290 per plan) |
| tsc clean | ✓ | `npx tsc --noEmit` exits with 0 |
| npm run build succeeds | ✓ | Build exits with 0; 237.32 KB gzipped output generated |

## Key Files Modified

- **Deleted:** src/tests/filter-searchtext.test.ts
- **Modified:** src/ui/unified-column.test.ts (removed 7 tests, kept Tests 8-9)
- **Modified:** src/tests/phase14-edge-states.test.ts (pruned 2 searchText-specific tests)

## Test Count Delta

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Total tests | 303 | 287 | -16 |
| unified-column.test.ts | 9 | 2 | -7 |
| filter-searchtext.test.ts | 7 | 0 | -7 |
| phase14-edge-states.test.ts | 6 | 4 | -2 |

## Bundle Size Delta

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Gzipped JS (KB) | 239.37 | 237.32 | -2.05 KB |

## Commit

**Hash:** 4972d31

**Message:**
```
test(19): remove query-input tests from unified-column, filter-searchtext, phase14-edge-states

- Delete src/tests/filter-searchtext.test.ts entirely (7 tests for searchText predicate)
- Remove Tests 1-7 from src/ui/unified-column.test.ts (Input Behavior, Query History, Keyboard Handlers describe blocks)
- Keep Tests 8-9 (View-State Auto-Expand) for D-05 wiring verification
- Prune searchText tests from src/tests/phase14-edge-states.test.ts
- Test count: 287/287 passing (down from 303)
- tsc: clean, npm run build: succeeds (237.32 KB gzipped, down from 239.37 KB)
```

## Context

This plan completes the Wave 2 test cleanup (D-07) after Plans 19-01 and 19-02 deleted the query-input implementation (UI, CSS, data layer, persistence layer). The test surface now accurately reflects the new state: facet-only filtering, no query input, no history chips, no hint states.

Per D-05, the column auto-expand/collapse tests (Tests 8-9 from Phase 18) are preserved to ensure the unified left column's view-state wiring remains load-bearing.

## Success

Plan 19-03 is complete. All task verification gates pass. The codebase is clean of query-input test surface, and the test suite accurately reflects the removal of the query-input feature.
