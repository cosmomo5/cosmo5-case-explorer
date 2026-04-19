---
phase: 20
plan: "02"
subsystem: scene/staging
tags: [tdd, gather, staging, filter, entry-point]
dependency_graph:
  requires: []
  provides: [gather(SceneObjects)]
  affects: [src/scene/staging.ts, src/scene/staging.test.ts]
tech_stack:
  added: []
  patterns: [integration-style TDD with real THREE.Scene, isActive() guard before filter scan]
key_files:
  created: [src/scene/staging.test.ts]
  modified: [src/scene/staging.ts]
decisions:
  - "Integration-style tests instead of vi.mock: module-local sibling calls cannot be intercepted by vi.mock; observable side effects (nucleusMeshes, nucleusOrbits, userData) are the correct contract surface"
  - "isActive() guard placed before matchedCases computation to short-circuit when filter is fully inactive (matchesFilter returns true for all cases when filter has no active dimensions)"
  - "8 tests instead of 4: test splitting made each truth explicit (create-path and update-path each get two separate tests covering distinct observable effects)"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-19"
  tasks_completed: 3
  files_changed: 2
---

# Phase 20 Plan 02: gather() Entry Point Summary

**One-liner:** Pure `gather(objects)` function composing staging lifecycle primitives — creates sphere on first call, animates-to-existing on repeat, guarded by `isActive()` and `matchedCases.length` checks.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `e21d914` — `test(20-02): add failing tests for gather() entry point` | PASS — 8/8 tests failed with `gather is not a function` |
| GREEN | `8a37c57` — `feat(20-02): implement gather() entry point in staging.ts` | PASS — 8/8 tests passed, 295/295 full suite |
| REFACTOR | `71172a1` — `refactor(20-02): move isActive() guard before filter computation; remove unused test imports` | PASS — 8/8 tests still pass |

## What Was Built

`gather(objects: SceneObjects): void` exported from `src/scene/staging.ts`. The function:

1. Guards on `objects.filterState.isActive()` — returns early if no filter dimensions are active (matchesFilter returns true for all cases when filter is empty, so this guard is required separately from the length check)
2. Computes `matchedCases` by filtering `objects.starMeshes` through `matchesFilter`
3. Returns early if `matchedCases.length === 0`
4. **Create path** (`!nucleusMeshes.has(STAGING_KEY)`): calls `createStagingNucleus`, `applyStagingPush`, `zoomTowardStaging`
5. **Update path** (sphere present): calls `animateStarsToStaging` with new matched set

## Deviations from Plan

### Deviation 1 — Integration tests instead of vi.mock pattern

**Found during:** RED phase (task analysis, before writing)

**Issue:** The plan's test skeleton used `vi.mock('./staging', ...)` to intercept `createStagingNucleus`, `applyStagingPush` etc. This doesn't work because `gather()` calls those functions via module-local bindings, not via exported references. The mocked symbols and the ones `gather()` actually invokes are different references. Tests would silently pass while not testing anything real.

**Fix:** Wrote integration-style tests observing real side effects:
- `nucleusMeshes.has(STAGING_KEY)` — confirms sphere was created
- `nucleusOrbits[STAGING_KEY].cases` — confirms correct cases stored
- `mesh.userData.preFilterPosition` — confirms `applyStagingPush` ran
- `star.userData.isStagingTarget` — confirms `animateStarsToStaging` ran
- Sphere identity (`updatedMesh === originalMesh`) — confirms update path, not re-create

**Files modified:** `src/scene/staging.test.ts`

**Rule:** Deviation justified pre-execution; plan skeleton was a sketch, not a contract. Advisor confirmed this approach.

### Deviation 2 — `isActive()` guard added explicitly

**Found during:** GREEN phase (test 8 failed: inactive-filter → sphere created)

**Issue:** `matchesFilter` returns `true` for all cases when `FilterState` has no active dimensions (all Sets are empty). The plan's sketch relied on `matchedCases.length === 0` to catch the inactive-filter case, but an inactive filter actually matches everything (matchedCases.length === 3 for 3 stars).

**Fix:** Added `if (!objects.filterState.isActive()) return;` before the filter scan, consistent with plan truth #1: "gather() with no matched cases returns early."

**Files modified:** `src/scene/staging.ts`

**Rule 1 (Bug):** Behavioral correctness — without this guard, gather() would fire on a fully-cleared filter state.

### Deviation 3 — 8 tests instead of 4

**Found during:** RED phase (test design)

**Issue:** Plan specified 4 tests. The create/update paths each have two distinct observable effects (sphere presence vs. scene membership; sphere identity vs. star targeting), making them worth separate test cases.

**Fix:** 8 tests covering all 4 must_have.truths with more granular coverage. All pass.

**Rule:** Additive, no behavior change; strictly better coverage.

## Known Stubs

None. `gather()` is fully wired to real lifecycle primitives. Plan 20-03 will wire it to the button click handler.

## Threat Flags

None. `gather()` is a pure read-from-filterState + side-effect-via-existing-primitives function. No new network endpoints, auth paths, or trust boundaries introduced.

## Self-Check

### Files exist

- [x] `src/scene/staging.ts` — modified, exports `gather()`
- [x] `src/scene/staging.test.ts` — created, 8 tests

### Commits exist

- [x] `e21d914` — RED: `test(20-02): add failing tests for gather() entry point`
- [x] `8a37c57` — GREEN: `feat(20-02): implement gather() entry point in staging.ts`
- [x] `71172a1` — REFACTOR: `refactor(20-02): move isActive() guard before filter computation; remove unused test imports`

### Must-have truths verification

| Truth | Verified by |
|-------|-------------|
| `gather(objects)` computes matched cases from current filter | Test 5: storedIds === ['case-ca1', 'case-ca2'] for CA filter |
| `gather()` creates staging sphere if not present | Test 2: `nucleusMeshes.has(STAGING_KEY)` === true after first call |
| `gather()` updates sphere if present (no re-creation) | Test 6: `updatedMesh === originalMesh` (identity preserved) |
| `gather()` entry point is testable independently | All 8 tests pass without app bootstrap |
| `export function gather(objects: SceneObjects): void` | Present in staging.ts, tsc clean on this file |
| lifecycle_calls pattern satisfied | grep `createStagingNucleus\|applyStagingPush\|zoomTowardStaging\|animateStarsToStaging` present in gather() body |

### Test results

- `npm run test -- src/scene/staging.test.ts`: 8/8 passed
- `npm run test` (full suite): 295/295 passed, 30/30 files

## Self-Check: PASSED
