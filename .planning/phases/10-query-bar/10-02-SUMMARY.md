---
phase: 10-query-bar
plan: 02
subsystem: data
tags: [filter, search, keyword-map, qry-02]
dependency_graph:
  requires: [10-01]
  provides: [FilterState.searchText, matchesFilter-searchText, keyword-map]
  affects: [src/data/filter.ts, src/data/keyword-map.ts]
tech_stack:
  added: []
  patterns: [keyword-hint-table, exclusive-fallback-searchText, runtime-region-expansion]
key_files:
  created: [src/data/keyword-map.ts]
  modified: [src/data/filter.ts, src/tests/filter-searchtext.test.ts]
decisions:
  - "Use ProofType enum values in KEYWORD_HINTS (not string literals) for type safety"
  - "Region hints receive cases array and resolve to country names at runtime (no FilterState.region field)"
  - "apply() signature includes cases param on all hints for uniformity, even those not using it"
  - "searchText fallback is exclusive: only set when zero hints matched"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-16T12:03:50Z"
  tasks_completed: 2
  files_changed: 3
requirements: [QRY-02]
---

# Phase 10 Plan 02: FilterState searchText + Keyword Map Summary

FilterState extended with `searchText?: string` field and `matchesFilter()` updated with full-text fallback against client/title/challenge/approach. New `keyword-map.ts` exports `KEYWORD_HINTS` (29 hints) and `applyQuery` function that clears dimensions, applies matched hints, and falls back exclusively to `searchText` when nothing matched.

## What Was Built

### Task 1: FilterState searchText extension
- Added `searchText?: string` to `FilterState` interface in `src/data/filter.ts`
- Extended `matchesFilter()` with case-insensitive substring check against `c.client`, `c.title`, `c.challenge`, `c.approach`
- Unskipped 6 previously-skipped tests in `src/tests/filter-searchtext.test.ts` — all pass

### Task 2: Keyword mapping module
- Replaced stub `src/data/keyword-map.ts` with real implementation
- `KEYWORD_HINTS`: 29 hints covering services (17 entries: Performance Marketing, Paid Media, Social Media, Search SEO/SEM, Brand Strategy, Data Analytics, Content Strategy, Influencer Marketing, Programmatic, Email Marketing, Video Production, E-commerce, Market Research, UX & Web, Finance & Insurance, Media Planning, PR & Communications, Campaign Strategy), proofTypes (5: Revenue/Conversion/Awareness/CostEfficiency/Engagement), impactBands (2: transformative/significant), years (3: 2024/2025/2026), regions (3: Europe/Americas/Asia-Pacific)
- `applyQuery(q, fs, cases)`: clears all dimension sets + `searchText`, applies matching hints, sets `searchText = norm` only when no hint matched
- Region hints resolve to country names at runtime by filtering cases by region string

## Deviations from Plan

**1. [Rule 1 - Bug] Unskipped filter-searchtext.test.ts tests**
- **Found during:** Task 1 review (advisor call before writing)
- **Issue:** Plan action block did not mention unskipping the 6 `.skip` tests, but success criteria required them to pass. Without unskipping, verification would silently pass with 0 assertions.
- **Fix:** Changed all 6 `it.skip(...)` to `it(...)` in `filter-searchtext.test.ts`
- **Files modified:** `src/tests/filter-searchtext.test.ts`
- **Commit:** 424454f

**2. [Rule 2 - Enhancement] KeywordHint.apply receives cases parameter**
- **Found during:** Task 2 implementation
- **Issue:** Plan's `KeywordHint` interface showed `apply: (fs: FilterState) => void` but region hints need access to the cases array at apply time. Stub interface used a different shape (keyword/dimension/value flat structure).
- **Fix:** Added `cases: CaseStudy[]` as second parameter on all `apply` callbacks for uniformity. Non-region hints ignore it. No callers outside keyword-map.ts affected.
- **Files modified:** `src/data/keyword-map.ts`

## Deferred Items

**isActive() and without() do not account for searchText**
- `isActive()` only checks Set sizes — returns false when only `searchText` is set
- `without()` does not copy `searchText` to the clone
- Neither is tested or required by this plan
- Will surface when query bar wires `isActive()` to show/hide the clear button — log for Phase 10 Plan 05 or wherever `isActive()` is called from the query bar context

## Verification

- `npx vitest run src/tests/filter-searchtext.test.ts` — 7 tests pass (6 previously skipped, now active)
- `npx vitest run src/tests/keyword-map.test.ts` — 7 tests pass (all mocked, by Wave 0 design)
- `npx vitest run` — 239 tests pass, 0 skipped (was 233 passing + 6 skipped before this plan)
- `npx tsc --noEmit` — clean

## Self-Check: PASSED
