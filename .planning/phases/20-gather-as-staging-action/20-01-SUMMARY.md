---
phase: 20
plan: "01"
subsystem: filter-decoupling
tags: [filter, scene-state, star-state, applyFilter, tick-loop, D-04, D-14]
dependency_graph:
  requires: []
  provides: [pure-state-applyFilter, filterMatch-filterDim-removed, applyFilterWave-rewired]
  affects: [src/scene/scene-state.ts, src/data/star-state.ts, src/tests/filter-wave.test.ts, src/scene/scene-state.test.ts, src/scene/orbitals/staging.test.ts]
tech_stack:
  added: []
  patterns: [pure-state-mutation, tick-loop-cleanup, TDD-negative-assertion]
key_files:
  created: []
  modified:
    - src/scene/scene-state.ts
    - src/data/star-state.ts
    - src/data/star-state.test.ts
    - src/scene/scene-state.test.ts
    - src/scene/orbitals/staging.test.ts
    - src/tests/filter-wave.test.ts
decisions:
  - "D-04: applyFilter collapsed to pure state mutation (objects.filterState = newFilter)"
  - "D-14: applyFilterWave rewired — starState writes removed, distance-sort stagger skeleton preserved for Phase 23"
  - "D-07: filterMatch/filterDim removed from StarState enum, leaving reading/selected/ghost/idle"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-19T21:49:54Z"
  tasks_completed: 3
  files_modified: 6
---

# Phase 20 Plan 01: Gut applyFilter() and Tick-Loop Opacity Block Summary

Pure-state decoupling of filter mutation from scene reaction — `applyFilter()` collapsed to one-liner, `filterMatch`/`filterDim` removed from `StarState` enum, tick-loop per-frame opacity block deleted, `applyFilterWave()` distance-sort skeleton preserved per D-14.

## What Was Done

### Task 1 — Gut applyFilter() and tick-loop else branch (commit: 73ca850)

`applyFilter()` in `src/scene/scene-state.ts` was collapsed from ~71 lines to a single `objects.filterState = newFilter` assignment:

- **Global branch removed**: All `createStagingNucleus`, `applyStagingPush`, `zoomTowardStaging`, `animateStarsToStaging`, `returnStarsFromStaging`, `disposeStagingNucleus` calls gone from `applyFilter`.
- **Focused branch removed**: All GSAP opacity tweens and `star.userData.starState = 'filterDim'` writes gone from `applyFilter`.
- **Tick-loop else branch deleted**: The global-mode per-frame block that wrote `filterMatch`/`filterDim` opacity each tick (lines ~356-372) was deleted entirely and replaced with a comment noting that `applyFilterWave()` owns visual updates.
- **Import cleanup**: Removed 6 staging function imports (kept `STAGING_KEY`), removed `anyFilter` and `filterState` from `tickOrbits` destructuring.

### Task 2 — Remove filterMatch/filterDim from StarState enum (commit: dc6bb73)

- `StarState` type in `src/data/star-state.ts` reduced from `'reading' | 'selected' | 'ghost' | 'filterMatch' | 'filterDim' | 'idle'` to `'reading' | 'selected' | 'ghost' | 'idle'`.
- `APPEARANCE` lookup table pruned accordingly.
- **[Rule 3 - Blocking] applyFilterWave() starState write stripped**: `star.userData.starState = matches ? 'filterMatch' : 'filterDim'` removed from the sorted stagger loop in `applyFilterWave()`. The distance-sort + GSAP stagger skeleton was preserved intact per D-14 (Phase 23 reuse). Without this fix, TypeScript would have failed to compile after the enum removal.
- `syncShortlistToStarState()` comments updated to remove stale `filterMatch`/`filterDim` references.
- `star-state.test.ts` updated: `filterMatch`/`filterDim` test cases removed (2 tests deleted).

### Task 3 — Rewrite filter-related tests (commit: 9e053e7)

**scene-state.test.ts FILT-07 block (7 tests → 7 tests rewritten):**
- Old: Asserted that `applyFilter()` writes `filterDim` to `userData.starState` and triggers GSAP tweens.
- New: Asserts `applyFilter()` sets `objects.filterState`, does NOT call `gsap.to`, does NOT modify `userData.starState` on any star.

**scene-state.test.ts syncShortlistToStarState (4 tests updated):**
- "marks shortlisted as selected when filterMatch/filterDim" → replaced with idempotent-selected and undefined-treated-as-idle tests.
- "leaves filterDim/filterMatch unchanged" → replaced with idle-preservation and undefined-preservation tests.

**staging.test.ts FILT-04/FILT-09 (4 tests rewritten):**
- Old: Asserted staging sphere IS created by `applyFilter()`.
- New: Asserts staging sphere is NOT created by `applyFilter()` (negative assertion per D-04).

**filter-wave.test.ts (2 tests rewritten, 4 kept):**
- "sets filterMatch/filterDim state" → "animates matching/non-matching stars to opacity via GSAP" (no starState writes).
- Skip/delay tests kept intact (behavior unchanged).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Strip applyFilterWave starState writes as part of Task 2**
- **Found during:** Task 2 planning (pre-identified by advisor before any edits)
- **Issue:** `applyFilterWave()` wrote `'filterMatch'`/`'filterDim'` to `star.userData.starState` at line ~536. After Task 2 removed those values from `StarState`, TypeScript compilation would have failed.
- **Fix:** Stripped the `star.userData.starState = matches ? 'filterMatch' : 'filterDim'` write from `applyFilterWave()`'s sorted stagger loop. Preserved the distance-sort mechanism and GSAP stagger delay per D-14.
- **Files modified:** `src/scene/scene-state.ts`
- **Commit:** dc6bb73 (folded into Task 2 commit per plan's instruction to keep compile-clean between commits)

**2. [Rule 2 - Missing cleanup] syncShortlistToStarState comment hygiene**
- **Found during:** Task 2
- **Issue:** JSDoc and inline comments in `syncShortlistToStarState()` still referenced `filterMatch`/`filterDim` as owned states, misleading future readers.
- **Fix:** Updated comments to reflect the reduced enum.
- **Files modified:** `src/scene/scene-state.ts`
- **Commit:** dc6bb73

## Verification

```
Test Files: 30 passed (30)
     Tests: 292 passed (292)   ← baseline 287; net +5 (within ±15 envelope)
TypeScript: tsc --noEmit exits 0
```

Test delta breakdown:
- FILT-07: 7 removed, 7 added (net 0)
- filterMatch/filterDim star-state tests: 2 removed (net -2)
- filter-wave: 2 removed, 2 added (net 0)
- syncShortlistToStarState: 2 removed, 3 added (net +1)  
- staging lifecycle FILT-04/FILT-09: 4 removed, 4 added (net 0)
- Additional tests from parallel agent 20-02: +6 (picked up from its commits already on branch)

Net actual change from this plan: -2 (from star-state.test.ts deletion) — within envelope.

## Known Stubs

None. `applyFilter()` is genuinely a one-liner; no placeholder data flows to the UI.

## Self-Check: PASSED

- `src/scene/scene-state.ts` exists and contains `export function applyFilter` as one-liner
- `src/data/star-state.ts` exists and StarState does not contain `filterMatch` or `filterDim`
- Commits 73ca850, dc6bb73, 9e053e7 exist in git log
- All 292 tests pass, TypeScript exits 0
