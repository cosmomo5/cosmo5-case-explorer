---
phase: 10-query-bar
plan: "03"
subsystem: scene-state
tags: [filter, wave-propagation, gsap, animation, query-bar]
dependency_graph:
  requires: [10-01]
  provides: [applyFilterWave export in scene-state.ts]
  affects: [src/scene/scene-state.ts]
tech_stack:
  added: []
  patterns: [gsap-stagger, distance-sort, star-state-precedence]
key_files:
  created: []
  modified:
    - src/scene/scene-state.ts
decisions:
  - "Used objects.nucleusMeshes.get(key).position instead of nucOrbit.nucleus.position — NucleusOrbitData has no mesh reference, positions live on THREE.Mesh objects"
  - "applyFilterWave placed after clearFilter, before staging section — natural grouping with filter family"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-16T12:02:23Z"
  tasks_completed: 1
  files_modified: 1
requirements: [QRY-03]
---

# Phase 10 Plan 03: Wave-Propagation Filter Animation Summary

**One-liner:** Distance-sorted GSAP stagger over 600ms, radiating from matching cluster nuclei, with StarState precedence and rapid re-query kill safety.

## What Was Built

`applyFilterWave()` exported from `src/scene/scene-state.ts` — a standalone export alongside the existing `applyFilter` function, not a branch inside it.

**Algorithm:**
1. Collect positions of cluster nuclei whose `cases` array contains at least one filter match (via `matchesFilter`). Positions come from `objects.nucleusMeshes.get(key).position` (not `NucleusOrbitData`, which has no mesh reference).
2. Sort `objects.starMeshes` by minimum distance to the nearest matching nucleus position.
3. Iterate sorted stars: skip `reading`, `selected`, `ghost` states (precedence preserved). For eligible stars, set `starState` to `filterMatch` or `filterDim`, kill existing tweens, schedule `gsap.to` with delay proportional to sort index over 600ms total.

**Key parameters:**
- `TOTAL_S = 0.6` (600ms propagation)
- `targetOpacity`: `0.85` for matches, `0.12` for dims
- `duration: 0.15, ease: 'power2.out'` per tween
- `gsap.killTweensOf(mat)` before each new tween

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed incorrect nucleus position access**
- **Found during:** Pre-implementation review (advisor call)
- **Issue:** Plan template used `nucOrbit.nucleus.position` but `NucleusOrbitData` has no `.nucleus` field — only `key`, `orbitR`, `orbitU`, `orbitV`, `phase`, `speed`, `cases`
- **Fix:** Used `objects.nucleusMeshes.get(key)!.position.clone()` to get nucleus position from the THREE.Mesh map
- **Files modified:** src/scene/scene-state.ts
- **Commit:** fe8d268

## Test Results

- `src/tests/filter-wave.test.ts`: 6/6 passing
- Full suite: 239/239 passing (was 233 before — +6 new wave tests)
- `npx tsc --noEmit`: clean

## Self-Check

- [x] `applyFilterWave` exported from `src/scene/scene-state.ts` — confirmed via grep
- [x] All 9 original exported functions preserved — confirmed via grep
- [x] Commit fe8d268 exists — confirmed
- [x] 239 tests passing — confirmed

## Self-Check: PASSED
