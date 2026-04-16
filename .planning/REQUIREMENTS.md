# Requirements: Case Study Explorer v3.1

**Defined:** 2026-04-13
**Core Value:** A prospect-facing discovery tool that lets you build a pitch deck's worth of proof in 60 seconds.

## v1 Requirements

Requirements for the v3.1 Dimensional Explorer milestone. Each maps to roadmap phases.

### Pre-work — Bug Fixes

- [x] **FIX-01**: Mesh disposal chain — `gsap.killTweensOf()` before `scene.remove()`, then `geometry.dispose()` + `material.dispose()` on regroup
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
- [x] **READ-06**: ← → arrow navigation between cases (same ring or shortlist)
- [x] **READ-07**: Active case glows gold in orbit while being read
- [x] **READ-08**: Permission gating — locked state if `permission: false`
- [x] **READ-09**: Esc or close button closes panel (triggers T4)
- [x] **READ-10**: Shortlist track in bottom zone — cases can be added/removed; track persists across focus/unfocus

### Visual Warmth (Phase 6.5)

- [ ] **WARM-01**: Each star has a canvas-texture glow sprite child (SpriteMaterial + AdditiveBlending) extending ~7x star radius, colored by nucleus category
- [ ] **WARM-02**: Stars twinkle — per-star opacity oscillates at different phases in the tick loop (`baseOpacity * (0.7 + 0.3 * Math.sin(t * 0.7 + phase))`); no unison flicker
- [ ] **WARM-03**: Star material is MeshBasicMaterial (self-emissive, not lit by the 3-light rig); reading-state gold glow uses `mat.color.setHex` instead of emissive
- [ ] **WARM-04**: Nebula atmospheric gradients are perceptually visible on #0B0C10 — deep blue-indigo at 14% and 9% opacity (replaces gold at 4-6%)
- [ ] **WARM-05**: `prefers-reduced-motion` gates twinkle animation (sprite opacity static when reduced-motion is active)

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
| READ-06 | Phase 6 | Complete |
| READ-07 | Phase 6 | Complete |
| READ-08 | Phase 6 | Complete |
| READ-09 | Phase 6 | Complete |
| READ-10 | Phase 6 | Complete |
| WARM-01 | Phase 6.5 | Pending |
| WARM-02 | Phase 6.5 | Pending |
| WARM-03 | Phase 6.5 | Pending |
| WARM-04 | Phase 6.5 | Pending |
| WARM-05 | Phase 6.5 | Pending |
| POL-01 | Phase 7 | Pending |
| POL-02 | Phase 7 | Pending |
| POL-03 | Phase 7 | Pending |
| POL-04 | Phase 7 | Pending |
| POL-05 | Phase 7 | Pending |
| POL-06 | Phase 7 | Pending |
| POL-07 | Phase 7 | Pending |
| POL-08 | Phase 7 | Pending |

**Coverage (v3.1):**
- v3.1 requirements: 57 total — all shipped and complete
- v3.2 requirements: see below, mapped to phases 8–15

---

## v3.2 Requirements — The Observatory Experience

**Defined:** 2026-04-14
**Core Value:** A considered internal place where the Cosmo5 team builds, returns to, and studies their mental library of proof.
**Aesthetic premise:** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*
**Source:** `.planning/MILESTONE-v3.2.md`

### Clean Substrate (Phase 8)

- [x] **CLN-01**: Orphaned DOM removed from index.html (old `#panel`, `#panelScrim`, `#ctip`, `#countryRail`, `#globe-stage`, `#globe-canvas`, `#constellation-canvas`, duplicate `#searchWrap`). PRESERVE `#gatherStage`, `#gatherVignette`, `#gatherList` for Comparison Mode adaptation.
- [x] **CLN-02**: Orphaned CSS removed from style.css corresponding to removed DOM. Preserve gather-mode CSS for Phase 12 adaptation. Keep `.cl` (in use).
- [x] **CLN-03**: Orphaned main.ts code removed (old DetailPanel import if unused, unused element getters).
- [x] **CLN-04**: Phyllotaxis geometry + transition code isolated into `src/scene/phyllotaxis.ts` (or similar), documented "preserved for Comparison Mode (Phase 12)". Current gather wiring removed.
- [x] **CLN-05**: Hybrid branch strategy documented — phase-1c canonical, v3-starmap specification-only. Decision recorded in STATE.md with guardrail.
- [x] **CLN-06**: `CaseStudy` schema extended with optional `imagery?: { logo?: string; key_visual?: string }`. Empty asset directory `public/case-imagery/` created.

### Atmosphere (Phase 9)

- [ ] **ATM-01**: CRT celestial graticule rendered behind starfield. Thin white/teal lines at low opacity (~0.06–0.10). Radial or lat/long grid (prototype both, select one). Must read as substrate, not foreground.
- [x] **ATM-02**: Instrument-calibrating loader — sequential DM Mono text at center-screen (`OBSERVATORY INITIALIZING / LOCATING CATALOG / CALIBRATING STARMAP / ONLINE`). Uses `step-end` transitions (sharp cuts). Final `ONLINE` in gold before clearing. Timing tied to actual boot progress (not theatrical countdown).
- [ ] **ATM-03**: Corner wordmark `COSMO5 / OBSERVATORY` in DM Mono, ≤80px wide, does not overlap any other UI at any breakpoint. Replaces existing header+logo block.
- [x] **ATM-04**: Loader respects `prefers-reduced-motion` — skips to final state immediately when set.

### Query Bar (Phase 10)

- [ ] **QRY-01**: Central query input with placeholder `What kind of proof do you need?`. DM Mono. Gold bottom border on focus. Width ~480–560px at desktop.
- [ ] **QRY-02**: Keyword → dimension mapping table. Sectors → ServiceCategory, regions → Region, metrics → impactBand, temporal terms → year. Full-text fallback across client, title, challenge, approach.
- [ ] **QRY-03**: Query → field response — non-matching stars dim in waves (~600ms propagation), matching stars brighten. Debounced typing (~250ms).
- [ ] **QRY-04**: Live readout below input: `N MATCHES / M CLUSTERS`. Updates live as query changes.
- [ ] **QRY-05**: Advanced drawer (collapsible) exposes v3.1 filter-panel functionality at equal fidelity (all 5 dimensions). Default collapsed. Opening overrides query filters.
- [ ] **QRY-06**: Clear/reset — `x` button clears query and restores full field.
- [ ] **QRY-07**: Keyboard — Enter submits, Escape clears. Tab reaches advanced drawer controls in logical order.
- [ ] **QRY-08**: ARIA — input labeled `Case library query`. Readout announced via `aria-live="polite"`.

### Reading Panel as Instrument (Phase 11)

- [ ] **RP-01**: Header redesigned — structured block with CLIENT/SECTOR/REGION/YEAR/PROOF TYPE/IMPACT BAND in DM Mono, low-contrast labels + full-contrast values.
- [ ] **RP-02**: Archive imagery strip at panel top — logo inline with CLIENT readout, key visual at ~0.75 opacity. Graceful fallback when `imagery` absent.
- [ ] **RP-03**: Body sections (Challenge/Approach/Observed Impact) restructured — teal DM Mono uppercase labels, Noto Sans 400 body compressed to 40–80 words, "observed X" framing replaces marketing prose.
- [ ] **RP-04**: Impact section rendered as DM Mono readout grid (`CONVERSION +47% OBSERVED Q3 2025`). Teal values. No big-bold-number typography.
- [ ] **RP-05**: `ADD TO READING LIST` button in DM Mono, gold border at full opacity, teal fill on hover. Replaces "Add to Shortlist" label.
- [ ] **RP-06**: Fraunces italic opsz 144 deployed at one evidentiary moment (case title at panel top, or equivalent). Per `rejections/loading-fonts-you-dont-use.md` — font is already loaded.
- [ ] **RP-07**: Permission-false cases suppress imagery, show `[CONFIDENTIAL]` readout in place of imagery strip without breaking layout.

### Reading List + Review Mode + Comparison Mode (Phase 12)

- [ ] **RL-01**: Rename throughout — "Shortlist" → "Reading List" in all UI strings. Internal API (`shortlistStore`) unchanged.
- [ ] **RL-02**: Track redesign — empty state, populated state (client/sector/metric/timestamp cards with X), count indicator `N READINGS`, actions (`REVIEW`, `COMPARE`).
- [ ] **RL-03**: Star flight animation on add — star leaves orbital position, flies to track (~700ms eased). Ghost (dimmed star) remains at original position.
- [ ] **RL-04**: Remove-from-list — clicking X on card or ghost in orbit returns star to orbit (~900ms, 20% slower than entry).
- [ ] **RL-05**: localStorage persistence — reading list survives reloads. Schema: `{ caseIds: string[], addedAt: Record<string, timestamp> }`. Key: `cosmo5.readingList.v1`.
- [ ] **RL-06**: Query history — last 5 distinct queries stored under `cosmo5.queryHistory.v1`. Clickable chips below query input (Phase 10 integration).
- [ ] **RL-07**: Recently-viewed cases — last 10 case IDs opened in reading panel, stored under `cosmo5.recentlyViewed.v1` (API defined in Phase 12, consumed in Phase 14).
- [ ] **RL-08**: Welcome-back state — on land with non-empty list, readout below query input: `Welcome back. N readings in your list, last added X ago.` DM Mono.
- [ ] **RV-01**: Review Mode trigger — `REVIEW` button on track OR click any reading-list card. Opens full-viewport overlay surface.
- [ ] **RV-02**: Review Mode layout — one case fills viewport. Full instrument-readout with prominent logo + key visual. Metrics centerpiece.
- [ ] **RV-03**: Review Mode navigation — arrow keys advance through list. Progress indicator `CASE N OF M`. Esc returns to observatory with list intact.
- [ ] **RV-04**: Review Mode remove-from-list control — user can drop a case without leaving the mode.
- [ ] **CM-01**: Comparison Mode trigger — `COMPARE` button activates at ≥3 readings. Below threshold, button disabled with tooltip `Add 3+ readings to compare`.
- [ ] **CM-02**: Comparison Mode animation — staged stars fly from track into phyllotaxis formation at center (~900ms). Other stars dim heavily (~0.08 opacity). Formation geometry adapts to N (3–12 cases).
- [ ] **CM-03**: Gathered stars full-size, labeled, readable spacing. Hover opens reading panel without leaving Comparison Mode.
- [ ] **CM-04**: While in Comparison Mode, query bar, advanced drawer, ring-switcher hidden. Only reading list track (compressed) and EXIT COMPARISON visible.
- [ ] **CM-05**: Exit — stars return to reading list track (~700ms). Observatory returns to prior state.
- [ ] **CM-06**: Visual distinction from focus mode — focus = camera rotation + rings; comparison = star translation + heavy dimming. Must read as different operations.

### Hero Collapse (Phase 13)

- [ ] **HC-01**: Remove `#hero` block from index.html and `.hero` CSS.
- [ ] **HC-02**: Remove `#stats` strip from index.html and `.stats` CSS.
- [ ] **HC-03**: Remove `animateCount` boot-time wiring in main.ts.
- [ ] **HC-04**: Verify corner wordmark (from ATM-03) is adequate brand presence. If gap, add small ambient catalog readout (DM Mono, bottom corner).

### Edge States and Coverage (Phase 14)

- [ ] **EDG-01**: Empty query state — full field shown with gentle prompt below input `Or explore the full catalog — click a cluster to enter.`
- [ ] **EDG-02**: No-matches state — field dims entirely (~0.08 opacity), readout suggests broader terms from nearest-match dimension.
- [ ] **EDG-03**: Error state — cases.json fails → calibration freezes at `CATALOG / CONNECTION LOST [RETRY]` in DM Mono.
- [ ] **EDG-04**: Mid-transition interrupts — GSAP timelines chain cleanly; current transition completes before next starts. No freeze, no flash-cut.
- [ ] **EDG-05**: Narrow-viewport — at <768px width, designed `This observatory is desktop-only — please open on a larger screen.` message over the field. No interactive mobile fallback.
- [ ] **EDG-06**: `prefers-reduced-motion` audit — all new v3.2 animations gated. No missing gates.
- [ ] **EDG-07**: Keyboard completeness — Tab in logical order to every interactive element. Arrow keys in all states. Esc consistently steps back. Focus styling on every interactive element.
- [ ] **EDG-08**: ARIA completeness — labels on all interactive elements. `aria-live` regions for query readout and track count.

### Ship (Phase 15)

- [ ] **SHP-01**: Full-flow verification — internal user completes end-to-end flow (land → query → focus → read → stage → Review → Comparison → exit → return with state preserved). Timing observed, not prescribed.
- [ ] **SHP-02**: Visual regression check — ambient scene quality not degraded from v3.1 (nebula, stars, glow sprites intact).
- [ ] **SHP-03**: WCAG 2.1 Level AA compliance verified.
- [ ] **SHP-04**: Build clean, all tests pass. Lighthouse desktop ≥80. Bundle <800KB gzipped JS.
- [ ] **SHP-05**: OG meta tags + social image. OG image is an observatory still with cases visible.
- [ ] **SHP-06**: Vercel preview deployment. Mo reviews visually.
- [ ] **SHP-07**: Mo explicit approval before v3.2 declared shipped. STATE.md + card updated for milestone completion.

### v3.2 Out of Scope

| Feature | Reason |
|---------|--------|
| LLM-powered conversational AI query | Keyword mapping is sufficient for v3.2. LLM layer deferred to v3.3+ |
| Compile-to-PDF / URL-hash sharing | Primary user reframed to internal team — staging for self-review, not handoff |
| Google Slides integration | Moot after primary-user reframe |
| Interactive mobile / narrow-viewport support | Designed "desktop-only" message only. Full mobile is separate project |
| Analytics / usage tracking | Internal tool; no tracking needed |
| Authentication / user accounts | localStorage persistence only |
| Gather as filter-result trigger | Adapted to Comparison Mode for reading list instead |
| Purple in UI chrome (v3.2 scope) | Rejections canon restricts unreflective purple. Future iterations can reintroduce with intention |
| Email / external tool export (Notion, Google Doc) | Out of scope for internal staging use case |
| Backend / API / CMS | cases.json remains single source of truth |

### v3.2 Traceability

Filled during roadmap creation. Phases 8–15.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLN-01 through CLN-06 | Phase 8 | Pending |
| ATM-01 through ATM-04 | Phase 9 | Pending |
| QRY-01 through QRY-08 | Phase 10 | Pending |
| RP-01 through RP-07 | Phase 11 | Pending |
| RL-01 through RL-08 | Phase 12 | Pending |
| RV-01 through RV-04 | Phase 12 | Pending |
| CM-01 through CM-06 | Phase 12 | Pending |
| HC-01 through HC-04 | Phase 13 | Pending |
| EDG-01 through EDG-08 | Phase 14 | Pending |
| SHP-01 through SHP-07 | Phase 15 | Pending |

**Coverage (v3.2):**
- v3.2 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0 ✓

---
*v3.1 requirements defined: 2026-04-13. v3.1 shipped 2026-04-14.*
*v3.2 requirements defined: 2026-04-14 — from MILESTONE-v3.2.md after 5 open questions resolved with Mo.*
