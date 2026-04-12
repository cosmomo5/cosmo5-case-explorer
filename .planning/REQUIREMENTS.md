# Requirements: Case Study Explorer v3.1

**Defined:** 2026-04-13
**Core Value:** A prospect-facing discovery tool that lets you build a pitch deck's worth of proof in 60 seconds.

## v1 Requirements

Requirements for the v3.1 Dimensional Explorer milestone. Each maps to roadmap phases.

### Pre-work — Bug Fixes

- [ ] **FIX-01**: Mesh disposal chain ��� `gsap.killTweensOf()` before `scene.remove()`, then `geometry.dispose()` + `material.dispose()` on regroup
- [ ] **FIX-02**: Vec3 GC pressure — eliminate per-frame `new THREE.Vector3()` allocations in tick loop; reuse module-scope scratch vectors
- [ ] **FIX-03**: Staging world-origin bug — `computeStagingPositions()` uses focused nucleus position as center, not (0,0,0)

### Foundation — State and Types

- [ ] **FND-01**: ViewState discriminated union type (`global | constellation | reading`) with typed event dispatch
- [ ] **FND-02**: ShortlistStore at data layer — `add(caseId, nucleusKey)`, `remove(caseId)`, `clear()`, `has(caseId)`, `entries()`, pub/sub callbacks
- [ ] **FND-03**: ShortlistStore persists across constellation visits (survives T1/T5 transitions)
- [ ] **FND-04**: ProofType enum derived from case metrics (Revenue/ROAS, Conversion, Awareness, Engagement, Cost efficiency)
- [ ] **FND-05**: ImpactScale numeric value derived from case metrics magnitude (incremental → transformative)
- [ ] **FND-06**: Star state enum with precedence: reading > selected > ghost > filter-match > filter-dim > idle

### Layout — Split Canvas

- [ ] **LAY-01**: Split canvas layout — constellation zone (top ~72%) + staging track zone (bottom ~28%)
- [ ] **LAY-02**: Divider line between zones — visible, teal gradient, the floor of constellation and ceiling of track
- [ ] **LAY-03**: LayoutController manages CSS class mutations for zone visibility and transitions
- [ ] **LAY-04**: ResizeObserver on scene container drives renderer resize (not `window.resize`)
- [ ] **LAY-05**: Scene compression when reading panel is open — constellation + track compress leftward

### Camera Transitions — T1 and T5

- [ ] **CAM-01**: T1 Global→Constellation (~1200ms) — camera rotates to face orbital plane; rings flatten by perspective, not geometry change
- [ ] **CAM-02**: T5 Constellation→Global (~1400ms) — camera pulls back + rotates away; nuclei fade in; ~20% slower than T1
- [ ] **CAM-03**: Other nuclei fade to invisible during T1 (dissolve, not fly away)
- [ ] **CAM-04**: Transition lock — `transitionInProgress` flag checked by all input handlers during T1/T5
- [ ] **CAM-05**: camera-controls migration — replace OrbitControls with camera-controls v3.1.2 for `rotateTo()` API
- [ ] **CAM-06**: TransitionChoreographer — one tracked GSAP timeline per transition, killed via `gsap.context().revert()` on new transition start

### Star Selection and Ghost System — T2 and T6

- [ ] **SEL-01**: Click star in constellation to toggle selection — star state changes to `selected` (white, bright glow, ring)
- [ ] **SEL-02**: Selected star leaves orbital position — orbit shows gap
- [ ] **SEL-03**: Ghost star remains at orbital position (dimmed, faint) when original is on track
- [ ] **SEL-04**: Click ghost to remove star from shortlist and return it to orbit
- [ ] **SEL-05**: T2 Star→Track (~600ms) — star flies in arc across divider to track position
- [ ] **SEL-06**: T6 Remove→Orbit (~400ms) — star returns from track to orbital position; ghost dissolves on arrival
- [ ] **SEL-07**: Track line draws from center outward as first star arrives (doesn't pre-exist)
- [ ] **SEL-08**: Connector lines between adjacent staged stars on track
- [ ] **SEL-09**: Track extends/contracts as stars added/removed
- [ ] **SEL-10**: Single `material.opacity` setter respecting star state precedence (no opacity contention)

### Reading Panel — T3 and T4

- [ ] **READ-01**: Reading panel (340px) slides in from right on track star activation
- [ ] **READ-02**: T3 Panel open (~400ms) — CSS slide transition, scene compresses leftward
- [ ] **READ-03**: T4 Panel close (~350ms) — CSS slide out, scene expands
- [ ] **READ-04**: Instrument readout strip — region/vertical/year in DM Mono grid cells, teal values
- [ ] **READ-05**: Case sections — services chips, challenge, approach, results with metric cards (Noto 900 numbers)
- [ ] **READ-06**: ← → arrow navigation controls both track active star and panel content simultaneously
- [ ] **READ-07**: Active star glows gold in constellation while being read (not white — gold signals "being read")
- [ ] **READ-08**: Permission gating — locked state if `permission: false`
- [ ] **READ-09**: Esc or close button closes panel (triggers T4)
- [ ] **READ-10**: Dot indicators in panel footer showing position in shortlist

### Filter Enrichment

- [ ] **FILT-01**: Global filter panel — minimal constellation picker + orbit-by switcher (Vertical/Country/Region)
- [ ] **FILT-02**: Focused filter panel — country, service, year chips scoped to current constellation
- [ ] **FILT-03**: Focused filter panel — Proof Type chips (Revenue/ROAS, Conversion, Awareness, Engagement, Cost efficiency)
- [ ] **FILT-04**: Focused filter panel — Impact Scale range slider (incremental → transformative)
- [ ] **FILT-05**: Filter logic — AND between dimensions, OR within each dimension
- [ ] **FILT-06**: Live chip count updates based on current filter combination (chips with ×0 grey out)
- [ ] **FILT-07**: Already-staged stars on track unaffected by filter changes
- [ ] **FILT-08**: Filter status display — `N / total visible` + `reset all`
- [ ] **FILT-09**: Shortlist counter in filter panel — `N on shortlist` + `clear ×`

### Polish and Accessibility

- [ ] **POL-01**: All transitions use single `--ease: cubic-bezier(0.16, 1, 0.3, 1)`
- [ ] **POL-02**: Returns ~20% slower than entries (T5 > T1, T6 > T2, T4 ≈ T3)
- [ ] **POL-03**: `prefers-reduced-motion` respected — CSS keyframes to 0.01ms, GSAP globalTimeline paused, orbital motion stops
- [ ] **POL-04**: No `maximum-scale=1` in viewport meta
- [ ] **POL-05**: No purple tokens anywhere
- [ ] **POL-06**: Single `cubic-bezier` in CSS
- [ ] **POL-07**: `npm run build` zero errors
- [ ] **POL-08**: Cross-constellation shortlist verified — enter Beauty, select 2, go back, enter Performance, select 3, shortlist has 5

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Interaction Enhancements
- **INT-01**: Kunumi conversational query interface — replace/augment filter panel with natural language input
- **INT-02**: Global search → staging integration
- **INT-03**: Export/share shortlist as link or PDF
- **INT-04**: Side-by-side comparison of 2 staged cases

### Visual Enhancements
- **VIS-01**: BYLD CRT grid atmospheric layer behind starmap
- **VIS-02**: Archive artifact thumbnails floating in starmap
- **VIS-03**: Per-nucleus color palette for country/region modes

### Platform
- **PLT-01**: Mobile/touch-first layout
- **PLT-02**: Offline support / caching
- **PLT-03**: Analytics / usage tracking

## Out of Scope

| Feature | Reason |
|---------|--------|
| D3 globe intro rework | Working as-is; not part of dimensional navigation redesign |
| Backend / API | Static site serving cases.json; no data layer changes |
| Real-time collaboration | Internal single-user tool |
| Drag-lasso selection | Click-to-toggle is sufficient for 14-24 stars per constellation |
| AI-powered search | v2+ (Kunumi direction); breaks spatial browse loop |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 | Phase 0 | Pending |
| FIX-02 | Phase 0 | Pending |
| FIX-03 | Phase 0 | Pending |
| FND-01 | Phase 1 | Pending |
| FND-02 | Phase 1 | Pending |
| FND-03 | Phase 1 | Pending |
| FND-04 | Phase 1 | Pending |
| FND-05 | Phase 1 | Pending |
| FND-06 | Phase 1 | Pending |
| LAY-01 | Phase 2 | Pending |
| LAY-02 | Phase 2 | Pending |
| LAY-03 | Phase 2 | Pending |
| LAY-04 | Phase 2 | Pending |
| LAY-05 | Phase 2 | Pending |
| CAM-01 | Phase 3 | Pending |
| CAM-02 | Phase 3 | Pending |
| CAM-03 | Phase 3 | Pending |
| CAM-04 | Phase 3 | Pending |
| CAM-05 | Phase 3 | Pending |
| CAM-06 | Phase 3 | Pending |
| SEL-01 | Phase 4 | Pending |
| SEL-02 | Phase 4 | Pending |
| SEL-03 | Phase 4 | Pending |
| SEL-04 | Phase 4 | Pending |
| SEL-05 | Phase 4 | Pending |
| SEL-06 | Phase 4 | Pending |
| SEL-07 | Phase 4 | Pending |
| SEL-08 | Phase 4 | Pending |
| SEL-09 | Phase 4 | Pending |
| SEL-10 | Phase 4 | Pending |
| READ-01 | Phase 5 | Pending |
| READ-02 | Phase 5 | Pending |
| READ-03 | Phase 5 | Pending |
| READ-04 | Phase 5 | Pending |
| READ-05 | Phase 5 | Pending |
| READ-06 | Phase 5 | Pending |
| READ-07 | Phase 5 | Pending |
| READ-08 | Phase 5 | Pending |
| READ-09 | Phase 5 | Pending |
| READ-10 | Phase 5 | Pending |
| FILT-01 | Phase 6 | Pending |
| FILT-02 | Phase 6 | Pending |
| FILT-03 | Phase 6 | Pending |
| FILT-04 | Phase 6 | Pending |
| FILT-05 | Phase 6 | Pending |
| FILT-06 | Phase 6 | Pending |
| FILT-07 | Phase 6 | Pending |
| FILT-08 | Phase 6 | Pending |
| FILT-09 | Phase 6 | Pending |
| POL-01 | Phase 7 | Pending |
| POL-02 | Phase 7 | Pending |
| POL-03 | Phase 7 | Pending |
| POL-04 | Phase 7 | Pending |
| POL-05 | Phase 7 | Pending |
| POL-06 | Phase 7 | Pending |
| POL-07 | Phase 7 | Pending |
| POL-08 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-13 after research synthesis*
