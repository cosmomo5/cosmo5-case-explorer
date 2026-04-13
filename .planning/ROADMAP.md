# Roadmap: Case Study Explorer v3.1 — Dimensional Explorer

## Overview

A locked-stack TypeScript/Three.js codebase gets a six-transition dimensional collapse: 3D orbital field → 2D constellation plane → 1D staging track. Eight phases execute in strict dependency order. The shortlisting flow (browse → select → read → compare) is the only thing that matters — every phase either unblocks it or hardens it. Phase 0 clears three compounding bugs before any new transitions are built. Phases 5 and 6 can run in parallel once Phase 4 ships. Phase 7 verifies the integrated system and hardens accessibility.

## Phases

**Phase Numbering:**
- Integer phases (0-7): Planned milestone work
- Decimal phases: Urgent insertions only (created via `/gsd:insert-phase`)

- [x] **Phase 0: Pre-work** - Fix three existing bugs that compound under new transitions
- [x] **Phase 1: Foundation** - State machine, ShortlistStore, derived data types
- [x] **Phase 2: Layout** - Split canvas, divider, LayoutController, ResizeObserver
- [x] **Phase 3: Camera Transitions** - T1/T5, camera-controls migration, TransitionChoreographer
- [x] **Phase 4: Concentric Orbit Layout + Expansion** - Concentric rings, space expansion, ring switcher
- [x] **Phase 5: Filter Panel + Staging Sphere** - ProofType/ImpactScale filters, staging sphere (completed 2026-04-13)
- [ ] **Phase 6: Reading Panel + Track Selection** - Reading panel, shortlist track
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
**Plans**: 3 plans

Plans:
- [x] 00-01-PLAN.md — GSAP kill + dispose chain (Wave 1)
- [x] 00-02-PLAN.md — Vec3 GC scratch vectors (Wave 1)
- [x] 00-03-PLAN.md — Staging world-origin fix (Wave 2)

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
- [x] 01-01-PLAN.md — ViewState machine + ShortlistStore (Wave 1)
- [x] 01-02-PLAN.md — ProofType + ImpactScale + StarState classifiers (Wave 1)
- [x] 01-03-PLAN.md — Enrichment and boot wiring (Wave 2)

### Phase 2: Layout
**Goal**: The split canvas exists as a structural fact — constellation zone (top ~72%) and staging track zone (bottom ~28%) are rendered and responsive, with the divider line visible and the scene correctly resizing when the reading panel slot is occupied
**Depends on**: Phase 1
**Requirements**: LAY-01, LAY-02, LAY-03, LAY-04, LAY-05
**Success Criteria** (what must be TRUE):
  1. The canvas is visibly divided: constellation occupies the upper portion, track zone the lower, separated by a teal-gradient divider line
  2. Resizing the browser window reflows both zones without distorting the Three.js renderer aspect ratio
  3. When the reading panel is open, the constellation and track compress leftward — the Three.js canvas occupies the remaining width, not the full viewport
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — HTML/CSS restructuring + LayoutController + divider (Wave 1)
- [x] 02-02-PLAN.md — ResizeObserver + coordinate fixes + wiring (Wave 2)

### Phase 3: Camera Transitions
**Goal**: Clicking a nucleus drops the camera to face the orbital plane (T1) and pressing back pulls it out (T5) — the dimensional collapse is real and legible, the transition lock prevents input during flight, and camera-controls v3.1.2 manages orbital targeting cleanly
**Depends on**: Phase 2
**Requirements**: CAM-01, CAM-02, CAM-03, CAM-04, CAM-05, CAM-06
**Success Criteria** (what must be TRUE):
  1. Clicking a nucleus triggers T1: camera rotates to face the orbital plane (~1200ms), other nuclei dissolve, rings flatten by perspective
  2. Pressing back triggers T5: camera pulls back and rotates away (~1400ms, ~20% slower than T1), nuclei fade back in
  3. Clicking anything during an active T1 or T5 has no effect — input is locked until the transition completes
  4. OrbitControls is replaced by camera-controls v3.1.2 with no observable regression in normal orbit/zoom behavior
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — camera-controls migration + TransitionChoreographer (Wave 1)
- [x] 03-02-PLAN.md — T1/T5 wiring + nuclei dissolve + visual verify (Wave 2)

### Phase 4: Concentric Orbit Layout + Expansion
**Goal**: Focused view shows cases on concentric orbital rings (each ring = a dimension value), with visible orbit lines, smooth rotation, and a ring-dimension switcher. Entering focus expands other spheres outward off-screen (space expansion metaphor). Exiting contracts them back.
**Depends on**: Phase 3
**Requirements**: ORB-01, ORB-02, ORB-03, ORB-04, ORB-05, ORB-06, ORB-07, ORB-08
**Success Criteria** (what must be TRUE):
  1. In focused view, cases are arranged on concentric circles — each ring corresponds to a value of one dimension (e.g., service types), outer ring has the most cases
  2. The ring dimension is auto-selected (best subdivision of master dimension) but the user can override via a switcher
  3. Visible orbit lines are drawn for each ring; clicking a ring highlights all cases on it
  4. Cases rotate slowly along their ring orbit
  5. Entering focus: other dimension-spheres expand outward and leave the screen; exiting: they contract back
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Ring math core (TDD): computeConcentricOrbits, ringPositionAt, autoSelectRingDimension (Wave 1)
- [x] 04-02-PLAN.md — Scene integration: expansion/contraction, ring lines, tick branch, ring click (Wave 2)
- [x] 04-03-PLAN.md — Ring switcher + visual verify (Wave 3)

### Phase 5: Filter Panel + Staging Sphere
**Goal**: The filter panel shows all dimensions in both global and focused view. Selecting filter chips in global view creates a staging sphere from matched cases. The staging sphere behaves like any other dimension-sphere (clickable, focusable). Filter panel in focused view narrows within the constellation.
**Depends on**: Phase 4
**Requirements**: FILT-01, FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, FILT-08, FILT-09, FILT-10
**Success Criteria** (what must be TRUE):
  1. Filter panel shows all dimensions (country, service, year, ProofType, ImpactScale) in both views
  2. In global view, selecting chips creates a staging sphere with a distinct color; matched stars animate to it
  3. The staging sphere is clickable — entering it triggers the same T1 focus + concentric orbit view as any dimension-sphere
  4. Other spheres push outward slightly when staging sphere appears; slight zoom toward staging
  5. In focused view, filter panel narrows within the constellation (filters apply to ring contents)
  6. AND between dimensions, OR within each dimension; live chip counts; chips with 0 matches grey out
**Plans**: 4 plans

Plans:
- [x] 05-01-PLAN.md — FilterState extension + cross-filter count algorithm (Wave 1, TDD)
- [x] 05-02-PLAN.md — Accordion filter panel rewrite: 5 dimensions, status bar, orbit-by switcher (Wave 2)
- [x] 05-03-PLAN.md — Staging sphere lifecycle: create/animate/push/dissolve (Wave 2)
- [x] 05-04-PLAN.md — Focused-view filter dimming + visual checkpoint (Wave 3)

### Phase 6: Reading Panel + Track Selection
**Goal**: Clicking a case in focused view opens the reading panel. Cases can be selected to a shortlist track. Reading panel shows case details with navigation. Track persists across constellation visits.
**Depends on**: Phase 5
**Requirements**: READ-01, READ-02, READ-03, READ-04, READ-05, READ-06, READ-07, READ-08, READ-09, READ-10
**Success Criteria** (what must be TRUE):
  1. Clicking a case star opens the 340px reading panel from the right; scene compresses leftward
  2. Panel shows instrument readout + case sections (services, challenge, approach, results with metric cards)
  3. ← → navigates between cases on the same ring or in the shortlist
  4. Active case glows gold in the orbit while being read
  5. Cases can be added to the shortlist track (bottom zone); track persists across focus/unfocus
  6. Esc or close button collapses panel and restores canvas width
**Plans**: 4 plans

Plans:
- [ ] 06-01-PLAN.md — ViewStateMachine reading transitions + emissive gold tick fix (Wave 1)
- [ ] 06-02-PLAN.md — ReadingPanel class + main.ts wiring (Wave 2)
- [ ] 06-03-PLAN.md — ShortlistTrack + syncShortlistToStarState (Wave 2, parallel)
- [ ] 06-04-PLAN.md — Integration: arrow-key nav + ShortlistTrack mount + visual checkpoint (Wave 3)

### Phase 7: Polish and Accessibility
**Goal**: Timing audit (returns ~20% slower than entries), reduced-motion audit, token audit (no purple, single ease), clean build, and end-to-end verification of the full flow: filter → stage → focus → read → shortlist
**Depends on**: Phase 6
**Requirements**: POL-01, POL-02, POL-03, POL-04, POL-05, POL-06, POL-07, POL-08
**Success Criteria** (what must be TRUE):
  1. All return transitions are ~20% slower than corresponding entries
  2. `prefers-reduced-motion: reduce` respected — CSS keyframes to 0.01ms, GSAP paused, orbital rotation stops
  3. No purple tokens; single `cubic-bezier` in CSS
  4. `npm run build` zero errors
  5. Full flow test: enter Media sphere, select 2 cases to track, return, enter Performance, select 3 → track shows 5

## Progress

**Execution Order:**
Phases 0 → 1 → 2 → 3 → 4 → 5 + 6 (parallel) → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Pre-work | 3/3 | Complete | 2026-04-13 |
| 1. Foundation | 3/3 | Complete | 2026-04-13 |
| 2. Layout | 2/2 | Complete | 2026-04-13 |
| 3. Camera Transitions | 2/2 | Complete | 2026-04-13 |
| 4. Concentric Orbit Layout + Expansion | 3/3 | Complete | 2026-04-13 |
| 5. Filter Panel + Staging Sphere | 4/4 | Complete   | 2026-04-13 |
| 6. Reading Panel + Track Selection | 0/4 | Not started | - |
| 7. Polish and Accessibility | 0/TBD | Not started | - |
