# Roadmap: Case Study Explorer v3.1 — Dimensional Explorer

## Overview

A locked-stack TypeScript/Three.js codebase gets a six-transition dimensional collapse: 3D orbital field → 2D constellation plane → 1D staging track. Eight phases execute in strict dependency order. The shortlisting flow (browse → select → read → compare) is the only thing that matters — every phase either unblocks it or hardens it. Phase 0 clears three compounding bugs before any new transitions are built. Phases 5 and 6 can run in parallel once Phase 4 ships. Phase 7 verifies the integrated system and hardens accessibility.

## Phases

**Phase Numbering:**
- Integer phases (0-7): Planned milestone work
- Decimal phases: Urgent insertions only (created via `/gsd:insert-phase`)

- [x] **Phase 0: Pre-work** - Fix three existing bugs that compound under new transitions
- [ ] **Phase 1: Foundation** - State machine, ShortlistStore, derived data types
- [ ] **Phase 2: Layout** - Split canvas, divider, LayoutController, ResizeObserver
- [ ] **Phase 3: Camera Transitions** - T1/T5, camera-controls migration, TransitionChoreographer
- [ ] **Phase 4: Star Selection and Ghost System** - T2/T6, GhostManager, StagingTrack
- [ ] **Phase 5: Reading Panel** - T3/T4, instrument readout, keyboard navigation
- [ ] **Phase 6: Filter Enrichment** - ProofType + ImpactScale chips, live counts, AND/OR logic
- [ ] **Phase 7: Polish and Accessibility** - Timing asymmetry, prefers-reduced-motion audit, build verification

## Phase Details

### Phase 0: Pre-work
**Goal**: The codebase is clean enough to build on — three known bugs that compound under new transitions are eliminated
**Depends on**: Nothing (first phase)
**Requirements**: FIX-01, FIX-02, FIX-03
**Success Criteria** (what must be TRUE):
  1. Regrouping (vertical/country/region switch) produces no GPU memory leak — mesh disposal disposes geometry and material after killing tweens
  2. The tick loop allocates no new `THREE.Vector3` objects per frame — scratch vectors are module-scope
  3. Staging positions center on the focused nucleus, not world origin — existing staging behavior is visually correct
**Plans**: TBD

### Phase 1: Foundation
**Goal**: The data and state layer exists — ViewState machine, ShortlistStore with pub/sub, and ProofType/ImpactScale derivation are all independently testable before any UI touches them
**Depends on**: Phase 0
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05, FND-06
**Success Criteria** (what must be TRUE):
  1. The app has three named view states (`global`, `constellation`, `reading`) and dispatches typed events on transitions
  2. Adding a case to the shortlist from Constellation A, navigating away, entering Constellation B, and checking the shortlist still shows Constellation A's cases
  3. Every case in cases.json has a computed `proofType` and `impactScale` field accessible at runtime
  4. A star's rendered opacity is determined by a single precedence chain (reading > selected > ghost > filter-match > filter-dim > idle) with no contention between systems
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — ViewState machine + ShortlistStore (Wave 1)
- [ ] 01-02-PLAN.md — ProofType + ImpactScale + StarState classifiers (Wave 1)
- [ ] 01-03-PLAN.md — Enrichment and boot wiring (Wave 2)

### Phase 2: Layout
**Goal**: The split canvas exists as a structural fact — constellation zone (top ~72%) and staging track zone (bottom ~28%) are rendered and responsive, with the divider line visible and the scene correctly resizing when the reading panel slot is occupied
**Depends on**: Phase 1
**Requirements**: LAY-01, LAY-02, LAY-03, LAY-04, LAY-05
**Success Criteria** (what must be TRUE):
  1. The canvas is visibly divided: constellation occupies the upper portion, track zone the lower, separated by a teal-gradient divider line
  2. Resizing the browser window reflows both zones without distorting the Three.js renderer aspect ratio
  3. When the reading panel is open, the constellation and track compress leftward — the Three.js canvas occupies the remaining width, not the full viewport
**Plans**: TBD

### Phase 3: Camera Transitions
**Goal**: Clicking a nucleus drops the camera to face the orbital plane (T1) and pressing back pulls it out (T5) — the dimensional collapse is real and legible, the transition lock prevents input during flight, and camera-controls v3.1.2 manages orbital targeting cleanly
**Depends on**: Phase 2
**Requirements**: CAM-01, CAM-02, CAM-03, CAM-04, CAM-05, CAM-06
**Success Criteria** (what must be TRUE):
  1. Clicking a nucleus triggers T1: camera rotates to face the orbital plane (~1200ms), other nuclei dissolve, rings flatten by perspective
  2. Pressing back triggers T5: camera pulls back and rotates away (~1400ms, ~20% slower than T1), nuclei fade back in
  3. Clicking anything during an active T1 or T5 has no effect — input is locked until the transition completes
  4. OrbitControls is replaced by camera-controls v3.1.2 with no observable regression in normal orbit/zoom behavior
**Plans**: TBD

### Phase 4: Star Selection and Ghost System
**Goal**: Clicking a star in the constellation sends it to the staging track — a ghost remains at its orbital position, the track draws and extends as stars accumulate, and clicking the ghost returns the star to orbit
**Depends on**: Phase 3
**Requirements**: SEL-01, SEL-02, SEL-03, SEL-04, SEL-05, SEL-06, SEL-07, SEL-08, SEL-09, SEL-10
**Success Criteria** (what must be TRUE):
  1. Clicking a star toggles its selection state (white glow + ring) and the star leaves its orbital position, leaving a visible gap
  2. A dimmed ghost star appears at the orbital position; clicking the ghost removes the star from the shortlist and returns it to orbit via T6 arc
  3. The staging track line draws from center outward as the first star arrives; subsequent stars extend it with connector lines between adjacent entries
  4. The track contracts correctly when a star is returned — positions reflow, connectors update
  5. Filter changes do not affect already-staged stars on the track
**Plans**: TBD

### Phase 5: Reading Panel
**Goal**: Activating a staged star opens the command bridge reading panel — instrument readout, case content, and ← → navigation all work, the scene stays visible and compressed, and closing the panel returns it to full width
**Depends on**: Phase 4
**Can parallelize with**: Phase 6
**Requirements**: READ-01, READ-02, READ-03, READ-04, READ-05, READ-06, READ-07, READ-08, READ-09, READ-10
**Success Criteria** (what must be TRUE):
  1. Clicking a staged star opens the 340px reading panel from the right (T3 ~400ms); the constellation and track compress leftward to fill the remaining canvas
  2. The panel shows an instrument readout strip (region/vertical/year in DM Mono grid cells, teal values) and case sections (services chips, challenge, approach, results with Noto 900 metric cards)
  3. Pressing ← or → navigates both the panel content and the active star on the track simultaneously
  4. The star being read glows gold in the constellation (not white) while the panel is open
  5. Pressing Esc or the close button triggers T4 (~350ms) and restores the full canvas width
**Plans**: TBD

### Phase 6: Filter Enrichment
**Goal**: The focused filter panel (inside a constellation) gains ProofType and ImpactScale dimensions — chip counts update live per combination, AND/OR logic is correct, and the shortlist counter is visible
**Depends on**: Phase 4
**Can parallelize with**: Phase 5
**Requirements**: FILT-01, FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, FILT-08, FILT-09
**Success Criteria** (what must be TRUE):
  1. In global view, the filter panel shows only constellation picker and orbit-by switcher; inside a constellation it gains country/service/year + ProofType + ImpactScale dimensions
  2. Selecting multiple chips within one dimension (e.g., two service types) includes stars matching either; combining dimensions (e.g., service + year) requires both
  3. Chip labels show live counts for the current filter combination; chips with ×0 matches grey out
  4. Stars already on the staging track are unaffected by filter changes — they remain visible and selectable regardless of active filters
  5. The filter panel shows `N on shortlist` with a `clear ×` button and a `N / total visible` + `reset all` status line
**Plans**: TBD

### Phase 7: Polish and Accessibility
**Goal**: The complete system passes a timing audit (returns ~20% slower than entries), a prefers-reduced-motion audit (three gates verified), a token audit (no purple, single ease), and a clean production build — the cross-constellation shortlist scenario is verified end-to-end
**Depends on**: Phase 5, Phase 6
**Requirements**: POL-01, POL-02, POL-03, POL-04, POL-05, POL-06, POL-07, POL-08
**Success Criteria** (what must be TRUE):
  1. All return transitions are ~20% slower than their corresponding entry transitions (T5 > T1, T6 > T2, T4 ≈ T3 within 10%)
  2. With `prefers-reduced-motion: reduce` active: CSS keyframes run at 0.01ms, GSAP global timeline is paused, orbital motion stops
  3. No purple color tokens exist anywhere in the rendered output; all ease values in CSS resolve to the single `cubic-bezier(0.16, 1, 0.3, 1)`
  4. `npm run build` completes with zero TypeScript errors and zero Vite warnings
  5. Manual test: enter Beauty constellation, select 2 stars, return to global, enter Performance constellation, select 3 stars — shortlist shows 5 entries

## Progress

**Execution Order:**
Phases 0 → 1 → 2 → 3 → 4 → 5 + 6 (parallel) → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Pre-work | 3/3 | Complete | 2026-04-13 |
| 1. Foundation | 0/3 | Not started | - |
| 2. Layout | 0/TBD | Not started | - |
| 3. Camera Transitions | 0/TBD | Not started | - |
| 4. Star Selection and Ghost System | 0/TBD | Not started | - |
| 5. Reading Panel | 0/TBD | Not started | - |
| 6. Filter Enrichment | 0/TBD | Not started | - |
| 7. Polish and Accessibility | 0/TBD | Not started | - |
