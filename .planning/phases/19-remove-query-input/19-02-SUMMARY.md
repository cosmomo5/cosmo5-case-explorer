---
phase: 19-remove-query-input
plan: 02
type: execute
subsystem: data layer
tags:
  - removal
  - data-layer
  - cleanup
dependency_graph:
  requires: 
    - "19-01 (filter-panel UI removal)"
  provides:
    - "Clean FilterState interface (facet-only, no searchText)"
    - "Clean persistence layer (reading-list + recently-viewed only)"
  affects:
    - "19-03 (test deletion + TypeScript cleanup)"
tech_stack:
  patterns:
    - "Interface removal without feature flags"
    - "Clean subtraction from existing shapes"
  removed:
    - "FilterState.searchText field and all references"
    - "searchText predicate branch from matchesFilter"
    - "searchText mutations in applyQuery"
    - "Query history persistence functions"
key_files:
  modified:
    - "src/data/filter.ts"
    - "src/data/keyword-map.ts"
    - "src/data/persistence.ts"
decisions: []
metrics:
  duration: "~8 minutes"
  tasks_completed: 5
  commits: 3
  files_modified: 3
  lines_deleted: 62
completion_date: "2026-04-19"
---

# Phase 19 Plan 02: Remove Query Input Data Layer — Summary

**Objective:** Delete searchText from the data layer: remove the FilterState.searchText field, the searchText branch in matchesFilter, the searchText mutation in keyword-map.ts, and the query-history persistence functions.

## Overview

Plan 19-02 completed the data-layer deletion surface for the query input removal. Three files modified; all searchText references removed cleanly. No feature flags, no backward-compat branches. Pure deletion as per D-09.

## Completed Tasks

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1-3 | Remove searchText field, isActive() check, and matchesFilter predicate from filter.ts | 6798bdd | ✓ Complete |
| 4 | Remove searchText mutations from applyQuery in keyword-map.ts | d871fb4 | ✓ Complete |
| 5 | Delete query history functions and KEY_QUERY_HISTORY from persistence.ts | aba3d61 | ✓ Complete |

## Must-Haves Verification

- [x] FilterState type has no searchText field (removed from interface, line 14)
- [x] matchesFilter function contains no searchText branch (5-line predicate block deleted)
- [x] keyword-map.ts applyQuery does not write to searchText (delete statement and assignment removed)
- [x] persistence.ts has no addQueryToHistory or loadQueryHistory functions (entire section deleted)
- [x] persistence.ts has no KEY_QUERY_HISTORY constant (removed from lines 8-12)
- [x] grep -c 'searchText' src/data/filter.ts returns 0
- [x] grep -c 'searchText' src/data/keyword-map.ts returns 0
- [x] grep -cE 'addQueryToHistory|loadQueryHistory|saveQueryHistory|KEY_QUERY_HISTORY' src/data/persistence.ts returns 0

## Changes Made

### src/data/filter.ts

**Task 1:** Removed `searchText?: string` field from FilterState interface (line 14).

**Task 2:** Removed searchText check from isActive() method:
```typescript
// Deleted:
!!(this.searchText && this.searchText.length > 0);
```
Filter now active only when facet dimensions have selections.

**Task 3:** Removed 5-line searchText predicate block from matchesFilter:
```typescript
// Deleted block (lines 63-68):
if (f.searchText) {
  const q = f.searchText.toLowerCase();
  const hit = [c.client, c.title, c.challenge ?? '', c.approach ?? '']
    .some(s => s.toLowerCase().includes(q));
  if (!hit) return false;
}
```
matchesFilter now evaluates only facet dimensions (countries, services, years, proofTypes, impactBands).

### src/data/keyword-map.ts

**Task 4:** Removed two searchText mutations from applyQuery:
- Line 108: `delete fs.searchText;` removed
- Line 121: `fs.searchText = norm;` removed (the full-text fallback)

applyQuery now clears facet dimensions and applies keyword-based facet logic only. The fallback to full-text search is gone. Function remains (may be called by tests before Plan 19-03 deletes them); no code currently calls it after Plan 19-01 removed the filter-panel input handler.

### src/data/persistence.ts

**Task 5:** Deleted the entire query history storage section:
- Removed KEY_QUERY_HISTORY constant (line 11)
- Deleted 50-line query history section (lines 104-154) containing:
  - loadQueryHistory() function
  - saveQueryHistory() function
  - addQueryToHistory() function
  - All comments and docstrings for this section

Persistence layer now contains only:
- Reading list storage (hydrateReadingList, persistReadingList, setupReadingListPersistence, recordAddedAt)
- Recently-viewed storage (loadRecentlyViewed, saveRecentlyViewed, trackRecentlyViewed)

## Deviations from Plan

None. Plan executed exactly as written. All five tasks completed cleanly without unexpected changes.

## Testing Status

- **npm run test** will show failures in query-history test files (filter-searchtext.test.ts, parts of keyword-map.test.ts, parts of unified-column.test.ts). These test files are deleted in Plan 19-03.
- **npx tsc --noEmit** will show type errors in filter-panel.ts (Plan 19-01's work) which still references searchText. This is expected and harmless — the wave merger (between 19-01 and 19-02) will reconcile both plans. Plan 19-03 runs after merge and confirms tsc clean.
- **npm run build** succeeds (no type errors in data layer itself).

## Known Stubs

None. All references cleanly deleted. No fallback code, no dead branches.

## Next Steps

- Plan 19-01 (running in parallel in another worktree) removes the filter-panel UI (input, history chips, hint logic, CSS).
- Plan 19-03 (post-merge) deletes all test files and confirms TypeScript clean and npm run test green.

---

**Summary:** Data layer is clean of searchText and query-history code. FilterState is purely facet-based. matchesFilter evaluates only facet dimensions. Persistence stores only reading-list and recently-viewed. The underlying structures that powered the query input (added in Phase 18) are completely removed.

