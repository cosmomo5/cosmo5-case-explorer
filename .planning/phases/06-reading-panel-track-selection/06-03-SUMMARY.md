---
phase: 06-reading-panel-track-selection
plan: "03"
subsystem: ui-track-scene-sync
tags: [shortlist-track, sync, star-state, tdd, jsdom]
dependency_graph:
  requires: [06-01-PLAN.md]
  provides: [ShortlistTrack component, syncShortlistToStarState]
  affects: [src/ui/shortlist-track.ts, src/scene/scene-state.ts, src/style.css]
tech_stack:
  added: []
  patterns: [store-subscriber pattern, precedence gate for star state]
key_files:
  created:
    - src/ui/shortlist-track.ts
    - src/ui/shortlist-track.test.ts
  modified:
    - src/scene/scene-state.ts
    - src/scene/scene-state.test.ts
    - src/style.css
decisions:
  - "ShortlistTrack accepts optional getCaseLabel fn; falls back to caseId — keeps component testable without CaseStudy objects"
  - "syncShortlistToStarState only resets 'selected' → 'idle' on de-shortlist; filterDim/filterMatch owned by applyFilter"
  - "CSS inserted before prefers-reduced-motion block to preserve cascade correctness"
metrics:
  duration: ~15min
  completed: "2026-04-13"
  tasks_completed: 2
  files_changed: 5
---

# Phase 06 Plan 03: ShortlistTrack + syncShortlistToStarState Summary

**One-liner:** ShortlistTrack DOM component subscribing to ShortlistStore + syncShortlistToStarState() helper enforcing reading/ghost precedence in the 3D scene.

## What Was Built

**Task 1: ShortlistTrack component + track zone CSS**

`src/ui/shortlist-track.ts` — a class that takes a container, ShortlistStore, onSelect callback, and optional getCaseLabel function. Subscribes to the store in the constructor and re-renders synchronously on every mutation. Renders `.track-card` chips into `#track-zone`; shows "No cases shortlisted" empty state when entries list is empty.

CSS added to `src/style.css` (before `prefers-reduced-motion` block): `#track-zone` flex row layout, `.track-card` teal border chips with DM Mono at 11px, `.track-empty` muted label.

**Task 2: syncShortlistToStarState() in scene-state.ts**

Exported function added to `src/scene/scene-state.ts`. Accepts `SceneObjects` and `ShortlistEntry[]`. Builds a Set of shortlisted IDs, then for each star mesh:
- Skips stars with `reading` or `ghost` state (higher precedence, never touched)
- Sets `selected` on shortlisted stars regardless of current idle/filterMatch/filterDim/undefined state
- Restores `selected` → `idle` on de-listed stars; leaves filterDim/filterMatch alone (owned by applyFilter)

Will be wired into ShortlistStore.subscribe() in main.ts by plan 06-04.

## Test Results

| Suite | Tests | Notes |
|-------|-------|-------|
| shortlist-track.test.ts | 8 new | render, re-render, empty state, click, container, getCaseLabel |
| scene-state.test.ts | 9 new + 7 existing | precedence gates, restore idle, filterDim ownership |
| Full suite | 190 total | All green (153 baseline + 17 new + 14 from 06-02) |

## Deviations from Plan

None — plan executed exactly as written. Added two extra tests beyond the 6 specified in Task 2 (filterMatch unchanged + undefined starState treated as idle) for completeness; these align with stated success criteria.

## Key Decisions

1. `getCaseLabel` optional parameter on ShortlistTrack constructor keeps the component testable without requiring full CaseStudy objects. Host (main.ts) can pass a lookup function in 06-04 wiring.
2. `syncShortlistToStarState` explicitly leaves `filterDim`/`filterMatch` states alone when not shortlisted — only `selected` is restored to `idle`. This preserves the separation of concerns: applyFilter owns filter states, syncShortlist owns selection states.
3. CSS inserted before the `@media (prefers-reduced-motion)` block at the bottom of style.css to keep that rule as the final override.

## Self-Check: PASSED

Files created/modified:
- FOUND: src/ui/shortlist-track.ts
- FOUND: src/ui/shortlist-track.test.ts
- FOUND: src/scene/scene-state.ts (syncShortlistToStarState appended)
- FOUND: src/scene/scene-state.test.ts (9 new tests appended)
- FOUND: src/style.css (track zone CSS inserted)

Commits:
- FOUND: 01cf150 (RED Task 1)
- FOUND: 77b522d (GREEN Task 1)
- FOUND: ceb61af (RED Task 2)
- FOUND: 4134ad2 (GREEN Task 2)
