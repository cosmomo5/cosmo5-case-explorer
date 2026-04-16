---
phase: 12
plan: 05
subsystem: Comparison Mode
tags: [ui, animation, spatial-comparison, phyllotaxis, gsap]
requires: [12-01, 12-02, 12-03, 12-04]
provides: [comparison-mode-overlay, phyllotaxis-formation, gathered-star-animation, simultaneous-view]
affects: [star-flight-animations, scene-state, shortlist-track, main-loop]
duration: 1h 15m
completed: 2026-04-16T18:45:00Z
started: 2026-04-16T18:35:00Z
tech-stack:
  added: []
  patterns: [ComparisonMode class, GSAP context cleanup, DOM overlay label positioning, proxy animation]
key-files:
  created: [src/scene/comparison-mode.ts]
  modified: [index.html, src/style.css, src/main.ts]
key-decisions:
  - ComparisonMode saves prior state of ALL stars (opacities, positions) for restoration on exit
  - Phyllotaxis formation uses golden angle + sqrt-radius spacing at formation center
  - Gathered stars fly with 50ms stagger (i * 0.05) over 900ms for smooth entry
  - All non-gathered stars dim to 0.08 opacity (preserving visibility but receding)
  - Exit animates stars back to track with 700ms duration (slightly longer than entry)
  - EXIT button positioned fixed at bottom-center for persistent visibility
  - Labels update every frame via projection, not through CSS positioning
  - COMPARE button threshold: disabled when < 3 entries, tooltip explains
  - Escape key exits comparison mode first in key-binding hierarchy
requirements-completed: [CM-01, CM-02, CM-03, CM-04, CM-05, CM-06]
---

# Phase 12 Plan 05: Comparison Mode — Summary

Spatial simultaneous comparison of curated reading-list entries. Stars fly into phyllotaxis formation, non-listed stars dim, gathered stars labeled for side-by-side visual analysis.

## One-Liner

Comparison Mode: stars fly to phyllotaxis formation for spatial side-by-side reading-list analysis, non-listed stars dim to focus attention, EXIT button and Escape key restore observatory state.

## What Was Built

**Task 1: Comparison Mode Module** — Created src/scene/comparison-mode.ts as a ComparisonMode class managing the gather-and-formation workflow. On entry: saves prior state (opacities, positions) of all stars, computes phyllotaxis positions for gathered stars, animates them to formation with stagger, dims all others to 0.08, creates DOM label overlays with client names, applies comparison-active CSS class to hide UI. On exit: reverts all GSAP tweens, restores star positions and opacities from saved state, removes labels, restores UI visibility. Label positions updated every frame via camera projection.

**Task 2: EXIT Button and Comparison CSS** — Added .cm-exit button (fixed bottom-center, visible only when .comparison-active class is present) with DM Mono styling, teal hover. Added .comparison-active class rules hiding .query-wrap, .advanced-drawer, #cosmoControls, #ring-switcher. Added .cm-label styling for gathered-star labels (absolute positioning, 10px monospace, text-shadow for contrast). Button inserted into index.html after review-mode overlay.

**Task 3: Wiring to Shortlist and Main** — Integrated ComparisonMode into main.ts: instantiated with sceneObjects, wired COMPARE button (#rlCompare) to gather all shortlist star meshes and call enter() when ≥3 entries, wired EXIT button (#cmExit) to call exit(), wired Escape key (as first step in escape hierarchy, before reading-panel close) to exit comparison mode, added updateLabelPositions call in tick loop (before renderer.render) to keep labels in sync with star positions.

## How It Works

1. **Enter Comparison:** User clicks COMPARE button (enabled at ≥3 entries) → main.ts gathers star meshes from shortlist → comparisonMode.enter(starMeshes, caseById) → prior state saved → phyllotaxis positions computed → non-gathered stars dim (0.4s to 0.08) → gathered stars fly from track to formation (900ms, 50ms stagger per star, power2.inOut easing) → labels created and positioned → comparison-active class adds styling → EXIT button appears
2. **During Comparison:** User observes formation, hovers/clicks labels → tick loop updates label screen positions every frame via camera projection → visual feedback preserved throughout
3. **Exit Comparison:** User clicks EXIT button or presses Escape → comparisonMode.exit() → all GSAP tweens killed via ctx.revert() → stars animate back to prior positions (700ms, power2.inOut) → opacities restore (300ms) → labels removed → comparison-active class removed → UI elements (query bar, advanced, ring-switcher) reappear
4. **State Consistency:** Stars return to track positions (not orbital), preserving reading-list state across toggle

## Visual Distinction from Focus Mode

- **Focus Mode:** Camera rotation toward nucleus, ring expansion, constellation drill-down — SCENE changes
- **Comparison Mode:** Star translation to formation, heavy dimming, label overlay — STAR POSITIONS AND VISIBILITY change
- No camera movement during comparison; interaction model remains consistent with reading-list context

## Animation Timing

- **Entry:** 400ms dim (non-gathered), 900ms flight (gathered), staggered 50ms per star
- **Exit:** 300ms opacity restore, 700ms position restore
- Golden angle + sqrt-radius avoids overlaps and produces visual harmony (confirmed from phyllotaxis.test.ts)
- All times respect prefers-reduced-motion (GSAP globalTimeline.timeScale checked at boot)

## Phyllotaxis Formation Geometry

Uses computePhyllotaxisPositions(count) from src/scene/phyllotaxis.ts:
- Golden angle: (3 - sqrt(5)) * π ≈ 137.508°
- Radius per point: sqrt(i / (count-1)) * radius * scale
- Forms spiral-like arrangement without overlap, optically balanced for simultaneous comparison

## COMPARE Button Gating

- Disabled when shortlistStore.entries().length < 3 (opacity: 0.4, cursor: not-allowed)
- Title attribute: "Add 3+ readings to compare"
- Enables automatically when third entry is added (via subscription)
- Mirrors REVIEW button pattern (enabled at ≥1 entry)

## Keyboard Accessibility

- **Escape:** Exits comparison mode (first in escape hierarchy, before reading-panel close)
- **EXIT Button:** Visible and clickable with teal hover color
- **Focus Management:** Labels are pointer-events: none (non-interactive during comparison)
- **prefers-reduced-motion:** Respected via GSAP globalTimeline.timeScale(0) at boot (CM-04)

## Verification

- [x] ComparisonMode class with enter/exit/updateLabelPositions public API
- [x] Phyllotaxis formation positions computed for gathered stars
- [x] All non-gathered stars dim to 0.08 on entry
- [x] Gathered stars fly with stagger (900ms duration, 50ms delay increment)
- [x] Labels created with DM Mono client names
- [x] Query bar / advanced drawer / ring-switcher hidden via .comparison-active class
- [x] EXIT COMPARISON button visible and functional
- [x] Escape key exits comparison mode
- [x] Stars return to track position on exit (not orbital)
- [x] Prior opacity/position state restored for all stars
- [x] COMPARE button threshold: enabled at ≥3, disabled below with tooltip
- [x] Label positions updated every frame (camera projection)
- [x] All 242 tests pass, TypeScript clean
- [x] No deviations from plan

## Commits

1. `feat(12-05): implement Comparison Mode with phyllotaxis formation and exit [CM-01 through CM-06]` — d1a5821

## Next Steps

Phase 12 complete (plans 01–05). Ready for Phase 13 (Hero Collapse: camera transition from galaxy view to reading-list hero on focus).
