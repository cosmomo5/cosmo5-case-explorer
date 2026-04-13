---
phase: 05-filter-panel-staging-sphere
plan: 01
subsystem: data-layer
tags: [filter, tdd, data-layer, cross-filter]
dependency_graph:
  requires: []
  provides: [FilterState.proofTypes, FilterState.impactBands, FilterState.without, computeChipCounts, FILTER_DIMENSIONS]
  affects: [05-02-PLAN.md, 05-03-PLAN.md, src/scene/scene-state.ts]
tech_stack:
  added: []
  patterns: [cross-filter-counts, tdd-red-green]
key_files:
  created: [src/data/filter-counts.ts, src/data/filter-counts.test.ts]
  modified: [src/data/filter.ts, src/data/filter.test.ts]
decisions:
  - matchesFilter accepts CaseStudy (backward-compat) with 'in' guards for proofType/impactBand
  - cross-filter removes only the dimension being counted, not other active filters
  - FilterState.without() uses createFilterState() + selective Set copy for clean cloning
metrics:
  duration: ~15 minutes
  completed: 2026-04-13
  tasks: 2 (RED + GREEN)
  files: 4 (2 modified, 2 created)
---

# Phase 5 Plan 01: FilterState Extension + Cross-Filter Counts Summary

**One-liner:** Extended FilterState with proofTypes/impactBands/without() and new cross-filter chip-count algorithm in filter-counts.ts.

## What Was Built

### Extended filter.ts

- Added `proofTypes: Set<ProofType>` and `impactBands: Set<ImpactScaleBand>` to `FilterState` interface
- Added `FilterDimension` type export: `'countries' | 'services' | 'years' | 'nucleusKeys' | 'proofTypes' | 'impactBands'`
- Added `without(dim: FilterDimension): FilterState` method — shallow-clones all sets, clears the target dimension
- Updated `isActive()` to include the two new dimensions
- Updated `matchesFilter()` with `'in'` guards for `proofType` and `impactBand` fields — accepts `CaseStudy` parameter, safely handles `EnrichedCaseStudy` at runtime

### New filter-counts.ts

- `FILTER_DIMENSIONS: FilterDimension[]` — the five user-facing dimensions (excludes `nucleusKeys`)
- `computeChipCounts(allCases, currentFilter)` — cross-filter algorithm: for each dimension D, call `currentFilter.without(D)`, run all cases through `matchesFilter`, accumulate value counts
- `getDimValues(c, dim)` — internal helper maps each dimension to its string values (multi-value for countries/services, single for years/proofTypes/impactBands)

## TDD Commit Sequence

| Commit | Hash | Description |
|--------|------|-------------|
| RED    | `0ce0b77` | Failing tests: proofTypes/impactBands/without() in filter.test.ts + new filter-counts.test.ts |
| GREEN  | `0cdc306` | Implementation: extended filter.ts + new filter-counts.ts |

## Test Results

- Before: 117 tests, 14 files
- After: 130 tests, 15 files (+13 new tests)
- All 130 pass. No TypeScript errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect cross-filter test expectation**
- **Found during:** GREEN phase (test run)
- **Issue:** `filter-counts.test.ts` test "returns 0 (or undefined) for values that have no matching cases under cross-filter" had a wrong expectation: it expected Amazon to appear in service counts when `proofTypes=Revenue` was active, commenting "proofType removed → all 3 cases count". But cross-filter only removes the dimension being counted (services removes services filter), not all other filters. The proofTypes filter stays active when counting services.
- **Fix:** Corrected the test to accurately reflect cross-filter semantics. Amazon is correctly absent from service counts when proofTypes=Revenue is active (e2 has Awareness, filtered out). Added clearer assertions for proofTypes count (where own dim IS removed → all 3 cases).
- **Files modified:** `src/data/filter-counts.test.ts`
- **Commit:** `0cdc306` (bundled with GREEN commit)

## Key Decisions

1. **`matchesFilter` stays CaseStudy-typed** — uses `'proofType' in c` guards. This avoids touching `scene-state.ts` which casts `userData.caseStudy as CaseStudy`. Plans 2 and 3 can pass `EnrichedCaseStudy` objects directly since it extends `CaseStudy`.

2. **Cross-filter semantics clarified** — each dimension's count removes only its own filter, not others. This is what makes the UI meaningful: a country chip count shows "how many cases match your OTHER active filters AND this country".

3. **`without()` uses `createFilterState()` base** — ensures the returned state has all methods (isActive, without) rather than manually constructing an object literal.

## Self-Check

Files created/modified:
- FOUND: src/data/filter.ts
- FOUND: src/data/filter-counts.ts
- FOUND: src/data/filter.test.ts
- FOUND: src/data/filter-counts.test.ts
- FOUND: .planning/phases/05-filter-panel-staging-sphere/05-01-SUMMARY.md

Commits:
- FOUND: 0ce0b77 (test RED)
- FOUND: 0cdc306 (feat GREEN)

## Self-Check: PASSED
