---
phase: "05-filter-panel-staging-sphere"
plan: "03"
subsystem: "scene-state"
tags: ["staging-sphere", "filter", "gsap", "three.js", "tdd"]
dependency_graph:
  requires: ["05-01"]
  provides: ["staging-sphere-lifecycle", "FILT-04", "FILT-05", "FILT-06", "FILT-09"]
  affects: ["scene-state.ts", "main.ts raycaster", "applyFilter global branch"]
tech_stack:
  added: []
  patterns:
    - "Synthetic nucleus pattern: STAGING_KEY inserted into both nucleusMeshes + nucleusOrbits maps"
    - "GSAP kill-then-tween on all star position animations (no stale tweens)"
    - "Delayed disposal with timeout ID stored on SceneObjects (_stagingDisposalTimeout)"
    - "Function hoisting enables disposeStagingNucleus to call restoreStagingPush defined later"
key_files:
  created: []
  modified:
    - "src/scene/scene-state.ts"
    - "src/scene/orbitals/staging.test.ts"
decisions:
  - "scene field added to SceneObjects interface — enables applyFilter to add/remove meshes without scene parameter"
  - "restoreStagingPush is called from disposeStagingNucleus (not returnStarsFromStaging) — push restore fires at end of return journey"
  - "zoomTowardStaging is a GSAP proxy placeholder — full camera choreography wired in Plan 04 via TransitionChoreographer"
  - "NucleusOrbitData for staging has speed=0, orbitR=0 — sphere is static, positioned by mesh.position"
  - "isStagingTarget cleared immediately when T1 focuses STAGING_KEY — tick loop reclaims position ownership"
metrics:
  duration: "9 minutes"
  completed: "2026-04-13"
  tasks_completed: 2
  files_modified: 2
  tests_added: 5
  tests_total: 146
---

# Phase 5 Plan 03: Staging Sphere Lifecycle Summary

**One-liner:** Synthetic nucleus pattern with GSAP-managed star migration, 700ms delayed disposal, and automatic click-to-focus via existing raycaster.

## What Was Built

### Task 1: Staging sphere create/dispose + star animation (TDD — RED then GREEN)

**RED:** 5 new failing tests added to `staging.test.ts` covering:
- nucleusMeshes has STAGING_KEY after active filter applied in global mode
- nucleusOrbits has STAGING_KEY after active filter applied in global mode
- nucleusMeshes does NOT have STAGING_KEY after filter cleared (post 700ms)
- geometry.dispose() called on staging mesh when cleared
- Applying filter twice creates only one staging sphere (no duplicate)

**GREEN:** Implementation in `scene-state.ts`:
- `STAGING_KEY = '__staging__'`, `STAGING_COLOR = 0xff6b6b` (coral), `NUCLEUS_RADIUS = 6`
- `_stagingDisposalTimeout` field added to `SceneObjects` (race condition guard)
- `scene` field added to `SceneObjects` (required by `applyFilter` to add/remove meshes)
- `createStagingNucleus`: computes centroid of existing nuclei, builds SphereGeometry(6, 32, 32) with MeshStandardMaterial, inserts into both maps with NucleusOrbitData (speed=0, orbitR=0)
- `disposeStagingNucleus`: GPU dispose (geometry.dispose() + material.dispose()), map cleanup, calls restoreStagingPush
- `animateStarsToStaging`: golden-angle distribution on sphere surface, kill-then-tween, stores originalPosition
- `returnStarsFromStaging`: kill-then-tween back to originalPosition, clears flag on complete
- `applyFilter` bifurcated: global branch creates/updates/disposes staging sphere with 700ms delayed disposal
- `clearFilter` now delegates to `applyFilter(objects, createFilterState())`

### Task 2: Push effect + camera zoom toward staging

- `applyStagingPush`: GSAP tween non-staging nuclei outward 15% (300ms, power2.out), stores preFilterPosition
- `restoreStagingPush`: GSAP tween nuclei back to preFilterPosition on staging clear (500ms)
- `zoomTowardStaging`: GSAP proxy placeholder — full camera lean wired via TransitionChoreographer in Plan 04
- FILT-05 verified: `nucleusMeshes.values()` in main.ts:276 includes staging sphere automatically, `userData.key = STAGING_KEY` triggers `enterFocus('__staging__')` via existing click handler
- T1 focus on STAGING_KEY: kills all star position tweens and clears `isStagingTarget` before T1 expansion (Pitfall 3 from research)

## Test Results

Before: 130 tests (15 files)
After: 146 tests (16 files)
Added: 5 new lifecycle tests in staging.test.ts (existing 6 computeStagingPositions tests preserved)
Note: 11 additional tests (filter-panel accordion) came from parallel plan 05-02 execution.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] starMeshes is array not Map**
- **Found during:** Task 1 implementation (advisor flagged before writing)
- **Issue:** Plan's interfaces section showed `starMeshes: Map<string, THREE.Mesh>`. Actual type is `THREE.Mesh[]`. animateStarsToStaging needed `find/filter` not `get(id)`.
- **Fix:** Used `Set(matchedCases.map(c => c.id))` + array iteration with `matchedIds.has(c.id)`.
- **Files modified:** src/scene/scene-state.ts

**2. [Rule 2 - Missing functionality] NucleusOrbitData interface mismatch**
- **Found during:** Task 1 (advisor flagged)
- **Issue:** Plan referenced `center` and `radius` fields on NucleusOrbitData. Actual interface has `key, orbitR, orbitU, orbitV, phase, speed, cases`.
- **Fix:** Staging NucleusOrbitData uses `orbitR: 0, speed: 0` for static positioning. Sphere position comes from `mesh.position`.
- **Files modified:** src/scene/scene-state.ts

**3. [Rule 2 - Missing functionality] scene field not in SceneObjects**
- **Found during:** Task 1 (advisor flagged)
- **Issue:** applyFilter has no scene parameter. SceneObjects had no scene field. createStagingNucleus needs to call scene.add(mesh).
- **Fix:** Added `scene: THREE.Scene` field to SceneObjects; populated in buildOrbitalScene return.
- **Files modified:** src/scene/scene-state.ts

**4. [Rule 2 - Missing functionality] allCases field missing from SceneObjects**
- **Found during:** Task 1 (advisor flagged)
- **Issue:** Plan's bifurcated applyFilter used `objects.allCases.filter(...)`. No such field exists.
- **Fix:** Derived matched cases from `objects.starMeshes.filter(...).map(s => s.userData.caseStudy)`.
- **Files modified:** src/scene/scene-state.ts

**5. [Rule 2 - Missing functionality] isStagingTarget not cleared on T1 staging focus**
- **Found during:** Task 2 analysis
- **Issue:** When STAGING_KEY is focused via T1, all stars have `starOrbit.nucleusKey` pointing to their original nucleus — none point to STAGING_KEY. Stars staging targets would never have isStagingTarget cleared.
- **Fix:** Added explicit `if (key === STAGING_KEY)` guard in focusSphere that kills all star tweens and clears isStagingTarget before T1 expansion runs.
- **Files modified:** src/scene/scene-state.ts

**6. [Rule 3 - Blocking] TypeScript build errors in staging.test.ts + scene-state.ts**
- **Found during:** Post-completion build verification (`npm run build`)
- **Issue:** 9 TypeScript errors: unused `buildOrbitalScene` import, `'awareness'` string not assignable to `ProofType` enum (5 call sites), `score` not a field on `ImpactScale` (should be `value + band + maxPct`), unused `computeStagingPositions` import in scene-state.ts
- **Fix:** Removed unused imports; replaced all `'awareness'` string literals with `ProofType.Awareness` enum value; fixed `ImpactScale` object to use `{ value: 0.4, band: 'notable', maxPct: 50 }` shape
- **Files modified:** src/scene/orbitals/staging.test.ts, src/scene/scene-state.ts
- **Commit:** fdb511d

## Commits

| Hash | Message |
|------|---------|
| ebcba53 | test(05-03): add failing tests for staging sphere lifecycle (RED) |
| f2ddefd | feat(05-03): implement staging sphere lifecycle (GREEN) |
| 05fb77e | feat(05-03): implement staging push, camera lean, T1 staging focus cleanup |
| fdb511d | fix(05-03): resolve TypeScript build errors in staging tests and scene-state |

## Self-Check: PASSED

- FOUND: src/scene/scene-state.ts
- FOUND: src/scene/orbitals/staging.test.ts
- FOUND: 05-03-SUMMARY.md
- FOUND: commit ebcba53 (RED tests)
- FOUND: commit f2ddefd (GREEN lifecycle)
- FOUND: commit 05fb77e (push+zoom+T1)
- FOUND: commit fdb511d (TS build fixes)
- FOUND: STAGING_KEY, _stagingDisposalTimeout, createStagingNucleus, disposeStagingNucleus, applyStagingPush
- Tests: 146 passed (16 files)
- Build: tsc + vite pass clean
