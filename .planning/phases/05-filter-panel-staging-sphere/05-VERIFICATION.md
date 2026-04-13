---
phase: 05-filter-panel-staging-sphere
verified: 2026-04-13T18:30:00Z
status: gaps_found
score: 9/10 must-haves verified
gaps:
  - truth: "Selecting filter chips in global view creates a staging sphere with a slight zoom toward it"
    status: partial
    reason: "Push effect (applyStagingPush) works and visually confirmed. zoomTowardStaging() is a no-op placeholder — function body contains void statements and a comment acknowledging it does nothing."
    artifacts:
      - path: "src/scene/scene-state.ts"
        issue: "zoomTowardStaging() at line ~554 is a confirmed no-op. The onUpdate callback contains only 'void pos; void proxy;' with comment: 'For now this function is a no-op placeholder. FILT-06 camera behavior wired in Plan 04 via TransitionChoreographer.' No TransitionChoreographer exists in scene-state.ts or main.ts."
    missing:
      - "Camera lean toward staging sphere position when filter is active in global mode. Either implement via camera.position GSAP tween in main.ts TransitionChoreographer, or accept the push-only behavior as sufficient and update FILT-06 scope."
---

# Phase 05: Filter Panel + Staging Sphere Verification Report

**Phase Goal:** The filter panel shows all dimensions in both global and focused view. Selecting filter chips in global view creates a staging sphere from matched cases. The staging sphere behaves like any other dimension-sphere (clickable, focusable). Filter panel in focused view narrows within the constellation.
**Verified:** 2026-04-13T18:30:00Z
**Status:** gaps_found — 1 gap (FILT-06 camera lean is no-op)
**Re-verification:** No — initial verification
**Tests run:** 153 tests passing across 17 files

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Filter panel visible in global mode with all 5 dimensions | VERIFIED | `buildGlobalHTML()` in filter-panel.ts renders FILTER_DIMENSIONS (countries, services, years, proofTypes, impactBands) as accordion sections |
| 2 | Filter panel visible in focused mode narrowing within constellation | VERIFIED | `buildFocusedHTML()` renders same 5 accordion sections; no mode-row/orbit-by switcher; applyFilter focused branch dims non-matching stars |
| 3 | Chip counts update cross-filter (count with other filters active) | VERIFIED | computeChipCounts in filter-counts.ts calls matchesFilter with filterState.without(dim) for each dimension; called once per render cycle in filter-panel.ts |
| 4 | 0-count chips are visually dimmed | VERIFIED | `class="${count === 0 ? 'fchip dim' : 'fchip'}"` pattern in filter-panel.ts; .fchip.dim in style.css |
| 5 | Selecting filter chips in global view creates a staging sphere | VERIFIED | applyFilter global branch calls createStagingNucleus() which inserts mesh into nucleusMeshes map + NucleusOrbitData into nucleusOrbits; 5 lifecycle tests pass |
| 6 | Staging sphere push effect: non-matching nuclei move outward ×1.15 | VERIFIED | applyStagingPush() applies GSAP tween to nuclei using preFilterPosition × 1.15; restoreStagingPush restores on clear |
| 7 | Staging sphere is clickable/focusable like other dimension spheres | VERIFIED | main.ts raycaster at line 276: `const nucleusMeshArr = [...sceneObjects.nucleusMeshes.values()]` auto-includes staging sphere; STAGING_KEY triggers enterFocus via existing click handler |
| 8 | Staging sphere cleared with GPU memory disposal after filter clear | VERIFIED | disposeStagingNucleus() calls geometry.dispose() + material.dispose(); 700ms delayed timeout; geometry.dispose() test in staging.test.ts passes |
| 9 | Focused view dims non-matching stars, respects state precedence | VERIFIED | applyFilter focused branch: sets filterDim for non-matching, idle for matching; gate allows only idle/filterDim/filterMatch to be overwritten; reading/selected/ghost untouched |
| 10 | Camera leans toward staging sphere when filter is active | PARTIAL | zoomTowardStaging() exists and is called but is a confirmed no-op (void statements, comment acknowledges placeholder). Push effect ✓. Camera lean ✗. |

**Score:** 9/10 truths verified

---

## Required Artifacts

| Artifact | Plan | Status | Details |
|----------|------|--------|---------|
| `src/data/filter.ts` | 05-01 | VERIFIED | FilterState.without(), isActive() covers all 6 dims, matchesFilter with ProofType/ImpactScaleBand guards |
| `src/data/filter-counts.ts` | 05-01 | VERIFIED | FILTER_DIMENSIONS (5 dims, excludes nucleusKeys), computeChipCounts cross-filter algorithm |
| `src/ui/filter-panel.ts` | 05-02 | VERIFIED | buildGlobalHTML/buildFocusedHTML, computeChipCounts per render, 5 accordion sections, orbit-by switcher in global, back button in focused |
| `src/style.css` | 05-02 | VERIFIED | .fgroup accordion with CSS max-height 180ms spring, .fchip/.on/.dim, .fchip-count, .filter-status; uses var(--teal), no purple tokens |
| `src/scene/scene-state.ts` | 05-03, 05-04 | PARTIAL | STAGING_KEY, createStagingNucleus, disposeStagingNucleus, applyStagingPush, restoreStagingPush all present and wired. SceneObjects.scene + _stagingDisposalTimeout fields added. zoomTowardStaging() is no-op. Focused branch and tick loop fix complete. |
| `src/scene/scene-state.test.ts` | 05-04 | VERIFIED | 7 focused-filter tests: filterDim/idle states, clear restores idle, reading/selected/ghost precedence, no staging sphere in focused mode |
| `src/scene/orbitals/staging.test.ts` | 05-03 | VERIFIED | 6 computeStagingPositions tests preserved + 5 lifecycle tests (STAGING_KEY in maps, cleared after 700ms, geometry.dispose() called, no duplicate on double apply) |
| `src/ui/filter-panel.test.ts` | 05-02 | VERIFIED | 11 DOM tests: 5 accordion groups, aria-expanded toggle, dim/on chips, status bar, reset button, orbit-by switcher, focused mode |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| filter-panel.ts | filter-counts.ts | computeChipCounts import | WIRED | Called in buildGlobalHTML + buildFocusedHTML render paths |
| filter-panel.ts | filter.ts | FilterState, applyFilter, clearFilter imports | WIRED | applyFilter called on chip click; clearFilter delegated to applyFilter(objects, createFilterState()) |
| applyFilter global branch | createStagingNucleus | direct call in scene-state.ts | WIRED | Called when objects.mode === 'global' and filter is active |
| applyFilter global branch | zoomTowardStaging | direct call in scene-state.ts | PARTIAL | Called, but function body is a no-op (FILT-06 gap) |
| main.ts raycaster | staging sphere | nucleusMeshes.values() spread | WIRED | Line 276: staging sphere auto-included in raycaster candidates |
| focusSphere STAGING_KEY | isStagingTarget clear | explicit guard in scene-state.ts | WIRED | `if (key === STAGING_KEY)` kills all star tweens + clears isStagingTarget before T1 expansion |
| tick loop (focused mode) | userData.starState | resolveStarAppearance read | WIRED | else-if inFocused branch reads stored state; prevents GSAP overwrite at 60fps |

---

## Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|---------|
| FILT-01 | 05-02 | Filter panel accordion renders all 5 user-facing dimensions | SATISFIED | 5 accordion sections in buildGlobalHTML; filter-panel.test.ts: "renders 5 accordion groups" passes |
| FILT-02 | 05-01 | matchesFilter covers proofType dimension | SATISFIED | matchesFilter in filter.ts guards proofTypes.size > 0, checks 'proofType' in cs; filter-counts.ts uses it cross-filter |
| FILT-03 | 05-01 | matchesFilter covers impactBand dimension | SATISFIED | matchesFilter guards impactBands.size > 0, checks cs.impactScale?.band |
| FILT-04 | 05-03 | applyFilter creates staging sphere in global mode | SATISFIED | nucleusMeshes.has('\_\_staging\_\_') test passes; staging sphere inserted into both maps |
| FILT-05 | 05-03 | Staging sphere clickable/focusable via existing raycaster | SATISFIED | main.ts line 276 auto-includes nucleusMeshes.values(); STAGING_KEY triggers enterFocus |
| FILT-06 | 05-03 | Slight camera zoom toward staging sphere | PARTIAL | applyStagingPush works (nuclei push outward). zoomTowardStaging() is confirmed no-op. Camera lean not implemented. |
| FILT-07 | 05-04 | Focused view: non-matching stars dim, precedence respected | SATISFIED | applyFilter focused branch + 7 tests in scene-state.test.ts all pass |
| FILT-08 | 05-02 | Live chip counts reflect cross-filter logic | SATISFIED | computeChipCounts called per render with filterState.without(dim) logic; chip-count test in filter-panel.test.ts passes |
| FILT-09 | 05-03 | Filter clear removes staging sphere with GPU disposal | SATISFIED | 700ms delayed disposal + geometry.dispose() call; both tests pass with fake timers |
| FILT-10 | 05-02 | Orbit-by switcher visible in global mode; absent in focused | SATISFIED | mode-row with orbit-by switcher in buildGlobalHTML; absent in buildFocusedHTML; filter-panel.test.ts confirms both |

**Documentation note (info-level):** REQUIREMENTS.md status table shows FILT-02 and FILT-03 as "Pending" but their checkboxes are marked [x]. This is a documentation inconsistency — the implementation is verified present in filter.ts and filter-counts.ts.

---

## Anti-Patterns Found

| File | Location | Pattern | Severity | Impact |
|------|----------|---------|----------|--------|
| `src/scene/scene-state.ts` | ~line 554 (zoomTowardStaging) | No-op function with void statements; comment confirms: "For now this function is a no-op placeholder" | WARNING | FILT-06 camera lean not delivered. Push effect works. Mo visually approved all 5 test flows in 05-04 checkpoint — the absence may not have been perceptible. |

---

## Human Verification

Mo approved all five test flows during the 05-04 visual checkpoint:
1. Accordion open/close
2. Global filter + staging sphere creation
3. Staging sphere → T1 focus (click on staging sphere enters focused view)
4. Focused view filter dimming
5. Orbit-by switcher

These required human eyes at interaction time. The 05-04-SUMMARY records: "Visual checkpoint approved: all five test flows confirmed working."

No additional human verification outstanding. The one automation gap (zoomTowardStaging no-op) is deterministic and captured above.

---

## Gaps Summary

One gap blocks complete FILT-06 delivery: `zoomTowardStaging()` in `src/scene/scene-state.ts` is a no-op. The function is called in the applyFilter global branch but its `onUpdate` callback does nothing (comment: "camera lean is applied by the choreographer layer in main.ts. For now this function is a no-op placeholder"). No TransitionChoreographer exists in the codebase that would provide this behavior.

The push effect (`applyStagingPush`) is fully implemented — non-staging nuclei move outward 15% with GSAP. The missing piece is the camera lean toward the staging sphere position.

All other Phase 05 deliverables are verified. 153 tests pass. The 9 remaining requirements (FILT-01 through FILT-05, FILT-07 through FILT-10) are fully satisfied.

---

_Verified: 2026-04-13T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
