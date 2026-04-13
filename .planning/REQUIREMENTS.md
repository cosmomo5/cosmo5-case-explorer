# Requirements: Case Study Explorer v3.1

**Defined:** 2026-04-13
**Core Value:** A prospect-facing discovery tool that lets you build a pitch deck's worth of proof in 60 seconds.

## v1 Requirements

Requirements for the v3.1 Dimensional Explorer milestone. Each maps to roadmap phases.

### Pre-work — Bug Fixes

- [x] **FIX-01**: Mesh disposal chain ��� `gsap.killTweensOf()` before `scene.remove()`, then `geometry.dispose()` + `material.dispose()` on regroup
- [x] **FIX-02**: Vec3 GC pressure — eliminate per-frame `new THREE.Vector3()` allocations in tick loop; reuse module-scope scratch vectors
- [x] **FIX-03**: Staging world-origin bug — `computeStagingPositions()` uses focused nucleus position as center, not (0,0,0)

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

### Concentric Orbit Layout + Expansion

- [ ] **ORB-01**: `computeConcentricOrbits(cases, masterDimension)` — distributes cases across concentric rings, each ring = one value of the auto-selected subdivision dimension
- [ ] **ORB-02**: Auto-dimension selection — picks the remaining dimension with most even distribution across ring values
- [ ] **ORB-03**: Ring-dimension switcher — user can override the auto-selected subdivision dimension in focused view
- [ ] **ORB-04**: Visible orbit lines — THREE.Line or similar for each concentric ring; clickable to highlight all cases on that ring
- [ ] **ORB-05**: Smooth orbital rotation — cases rotate along their ring at slow constant speed
- [ ] **ORB-06**: Space expansion on focus — other dimension-spheres scale outward (orbital radii multiply) during T1, exit viewport
- [ ] **ORB-07**: Space contraction on unfocus — spheres contract back during T5 to original positions
- [ ] **ORB-08**: Ring count adapts to case count — min 1 ring, max ~8 rings; single-value dimensions collapse to one ring

### Filter Panel + Staging Sphere

- [x] **FILT-01**: All-dimension filter panel — shows country, service, year, ProofType, ImpactScale chips in both global and focused view
- [x] **FILT-02**: Filter logic — AND between dimensions, OR within each dimension
- [x] **FILT-03**: Live chip counts per current filter combination; chips with 0 matches grey out
- [x] **FILT-04**: Global filter → staging sphere — selecting chips in global view creates a new sphere with distinct color; matched stars animate to it
- [x] **FILT-05**: Staging sphere behavior — clickable, focusable (same T1 + concentric orbit view as any dimension-sphere)
- [x] **FILT-06**: Other spheres push outward slightly when staging sphere appears; slight zoom toward staging
- [x] **FILT-07**: Focused filter — narrows within constellation (filters apply to ring contents, dimming non-matching cases)
- [x] **FILT-08**: Filter status display — `N / total visible` + `reset all`
- [x] **FILT-09**: Staging sphere dissolves when filter is cleared (stars return to their original spheres)
- [x] **FILT-10**: Orbit-by switcher (Vertical/Country/Region) — changes which dimension defines the spheres in global view

### Reading Panel + Track Selection

- [x] **READ-01**: Click case star → 340px reading panel slides in from right; scene compresses leftward
- [x] **READ-02**: T3 Panel open (~400ms) — CSS slide transition
- [x] **READ-03**: T4 Panel close (~350ms) — CSS slide out, scene expands
- [x] **READ-04**: Instrument readout strip — region/vertical/year in DM Mono grid cells, teal values
- [x] **READ-05**: Case sections — services chips, challenge, approach, results with metric cards (Noto 900)
- [ ] **READ-06**: ← → arrow navigation between cases (same ring or shortlist)
- [x] **READ-07**: Active case glows gold in orbit while being read
- [x] **READ-08**: Permission gating — locked state if `permission: false`
- [x] **READ-09**: Esc or close button closes panel (triggers T4)
- [x] **READ-10**: Shortlist track in bottom zone — cases can be added/removed; track persists across focus/unfocus

### Polish and Accessibility

- [ ] **POL-01**: All transitions use single `--ease: cubic-bezier(0.16, 1, 0.3, 1)`
- [ ] **POL-02**: Returns ~20% slower than entries (T5 > T1)
- [ ] **POL-03**: `prefers-reduced-motion` respected — CSS keyframes to 0.01ms, GSAP paused, orbital rotation stops
- [ ] **POL-04**: No `maximum-scale=1` in viewport meta
- [ ] **POL-05**: No purple tokens anywhere
- [ ] **POL-06**: Single `cubic-bezier` in CSS
- [ ] **POL-07**: `npm run build` zero errors
- [ ] **POL-08**: Full flow test: filter → stage → focus → read → shortlist across constellations

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
| FIX-01 | Phase 0 | Done |
| FIX-02 | Phase 0 | Done |
| FIX-03 | Phase 0 | Done |
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
| ORB-01 | Phase 4 | Pending |
| ORB-02 | Phase 4 | Pending |
| ORB-03 | Phase 4 | Pending |
| ORB-04 | Phase 4 | Pending |
| ORB-05 | Phase 4 | Pending |
| ORB-06 | Phase 4 | Pending |
| ORB-07 | Phase 4 | Pending |
| ORB-08 | Phase 4 | Pending |
| FILT-01 | Phase 5 | Complete |
| FILT-02 | Phase 5 | Pending |
| FILT-03 | Phase 5 | Pending |
| FILT-04 | Phase 5 | Complete |
| FILT-05 | Phase 5 | Complete |
| FILT-06 | Phase 5 | Complete |
| FILT-07 | Phase 5 | Complete |
| FILT-08 | Phase 5 | Complete |
| FILT-09 | Phase 5 | Complete |
| FILT-10 | Phase 5 | Complete |
| READ-01 | Phase 6 | Complete |
| READ-02 | Phase 6 | Complete |
| READ-03 | Phase 6 | Complete |
| READ-04 | Phase 6 | Complete |
| READ-05 | Phase 6 | Complete |
| READ-06 | Phase 6 | Pending |
| READ-07 | Phase 6 | Complete |
| READ-08 | Phase 6 | Complete |
| READ-09 | Phase 6 | Complete |
| READ-10 | Phase 6 | Complete |
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
