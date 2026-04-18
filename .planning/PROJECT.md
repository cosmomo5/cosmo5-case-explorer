# Case Study Explorer

## What This Is

A Three.js observatory for 116 marketing intelligence case studies. The Cosmo5 strategy and sales team navigates a dark field of stars organized into concentric orbital rings around cluster nuclei, queries the field conversationally, reads cases rendered as instrument readouts, and curates reading lists for later study. Used internally across multiple sessions as a showcase of the agency's accomplishments that the team itself inhabits when preparing for client conversations.

## Core Value

**A considered internal place where the Cosmo5 team builds, returns to, and studies their mental library of proof.** Closer to a museum's study room than a pitch deck. Functional, but a place worth inhabiting — the standard stays high because this is a showcase of the agency's own work, and the place that showcases it should earn that role.

## Aesthetic Premise (v3.2)

*"A cosmos of proof, navigable as an atlas — observed, not advertised."*

"Cosmos" names the space. "Navigable as an atlas" names the method. "Observed, not advertised" names the epistemic stance — rules out marketing-summary register, feature-card grids, celebratory metric typography.

## Current Milestone: v3.3 Resolve the Observatory

**Goal:** UI/UX polish pass. v3.2 shipped the feature set; none of the moves are resolved in actual use. v3.3 fixes position, hierarchy, consistency, and scene legibility so the 60–90s internal flow lands. Not a feature milestone — polish, removal, repositioning. Two exploratory brainstorm spikes (planetary overture, text-input-drives-stars) remain uncommitted until Mo selects a direction inside each phase.

**Source specification:** `.planning/MILESTONE-v3.3.md`

**Refactor posture:** After v3.3, not before. Several planned changes are deletions; refactoring code we are removing is wasted work. Option preserved for a v3.4 "Tighten" milestone.

**Imagery (P2-D):** Deferred. Schema hook preserved; visual treatment waits for content team.

## Previous Milestone: v3.2 The Observatory Experience (shipped 2026-04-17)

**Goal:** Migrate the 2026-04-12 design direction (Kunumi query-driven navigation + BYLD analog-era precision + Cosmo5 observatory foundation) into the v3.1 phase-1c codebase. Reframe for internal team use with persistent state across sessions, two distinct study surfaces (Review Mode for sequential immersion, Comparison Mode for simultaneous spatial comparison), and clean substrate with imagery integration.

**Source specification:** `.planning/MILESTONE-v3.2.md`

**Target features:**
- Query bar with conversational placeholder replaces filter panel as primary input
- CRT celestial graticule + instrument-calibrating loader (first paint)
- Reading panel as instrument readout (typography + real imagery from content project)
- Reading list → Review Mode (paginated full-viewport reader) + Comparison Mode (adapted gather → phyllotaxis formation of staged stars)
- localStorage persistence: reading list, query history, recently viewed, welcome-back
- Clean substrate: ~45 orphaned DOM nodes from v1/v2 removed
- Hero collapse: no marketing banner on land
- Full edge-state coverage (empty, no-matches, error, narrow-viewport, reduced-motion, keyboard, ARIA)

## Requirements

### Validated (shipped in v3.1)

- ✓ Three.js orbital engine with concentric rings by dimension (proofType/impactBand/year/country/region) — v3.1 Phase 4
- ✓ Camera-based focus transitions (T1 1200ms / T5 1400ms, camera-controls v3.1.2) — v3.1 Phase 3
- ✓ Split canvas layout (constellation zone + bottom track) — v3.1 Phase 2
- ✓ Reading panel (command-bridge right-slide, 340px) — v3.1 Phase 6
- ✓ Shortlist store + track component with sync-to-star-state — v3.1 Phase 6
- ✓ Ring-dimension switcher with live cross-filter — v3.1 Phase 5
- ✓ Staging sphere at focused nucleus centroid — v3.1 Phase 5
- ✓ Visual warmth: glow sprites, twinkle, blue-indigo nebula — v3.1 Phase 6.5
- ✓ Accessibility: no maximum-scale=1, prefers-reduced-motion gates, keyboard arrow navigation — v3.1 Phase 7
- ✓ CSS token system (teal/gold semantics, no purple, single --ease) — v3.1 foundation
- ✓ Typography stack (DM Mono, Noto Sans 900, Fraunces loaded) — v3.1 foundation

### Active (v3.3 — see MILESTONE-v3.3.md for full breakdown)

- [ ] Phase 16: Planetary overture (brainstorm spike — initial view, transition to clusters)
- [ ] Phase 17: Star labels always-on + label-click nav
- [ ] Phase 18: Unified left column (query-bar folds into filter-panel)
- [ ] Phase 19: Text-input-drives-stars behavior (brainstorm spike)
- [ ] Phase 20: Gather as explicit staging action (filter stays silent)
- [ ] Phase 21: Reading panel → right-side drawer (~380px)
- [ ] Phase 22: Contextual bottom-right panel (view-scoped controls)
- [ ] Phase 23: Star motion + dim/highlight polish (astrophotographic timing)
- [ ] Phase 24: Theme + token audit (coral replaced, opacity names)
- [ ] Phase 25: Font + size audit + overlap regression sweep
- [ ] Phase 26: Removals (gathered button, depth-per-year, label slider, old shortcuts, unused graticule)
- [ ] Phase 27: Final QA + Vercel ship gate (closes v3.2 P7-01 + P7-06)

### Completed (v3.2 — shipped 2026-04-17)

- [x] Clean substrate: remove orphaned v1/v2 DOM; preserve phyllotaxis for Comparison Mode
- [x] CRT graticule + instrument-calibrating loader on first paint
- [x] Query bar with keyword→dimension mapping + live field response
- [x] Advanced drawer (filter fallback for power users)
- [x] Reading panel as instrument readout with archive imagery integration
- [x] Reading List rename + persistence + Review Mode + Comparison Mode
- [x] Star flight animation (orbit→track on add, track→orbit on remove, orbit→formation on compare)
- [x] Hero collapse — remove marketing banner on land
- [x] Welcome-back state on return visit
- [x] Query history chips
- [x] Full edge state coverage
- [~] Imagery schema (in place) + integration (deferred to content project, not v3.3)

### Out of Scope (v3.2)

- **Kunumi conversational AI / LLM query layer** — keyword mapping is sufficient; LLM deferred to v3.3+
- **Mobile / narrow-viewport interactive support** — designed "desktop-only" message only; full mobile redesign is a separate project
- **Analytics / usage tracking** — internal tool, no tracking
- **Authentication / user accounts** — localStorage persistence only
- **Server-side compile, Google Slides integration, URL-encoded sharing** — not relevant to internal use (reframed 2026-04-14)
- **Gather as filter-result trigger** — adapted to Comparison Mode on reading list instead
- **Purple in UI chrome** — v3.2 scope; future iterations can reintroduce with intention
- **Backend / API / CMS** — cases.json remains single source of truth

## Context

**Two-branch history (important for v3.2).** The project has two parallel branches from 2026-04: `phase-1c` (v3.1, shipped) and `draft/v3-starmap` (13 commits implementing early direction-note moves: query input, affinity clustering, CRT grid, calibrating loader). v3.2 declares **phase-1c canonical**. v3-starmap serves as specification reference only — its moves are consulted and re-implemented in phase-1c with a guardrail: import a v3-starmap move only if the phase-1c re-implementation improves on or matches it.

**Design direction (authoritative).** `/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`. Three references, one execution: Kunumi Institute (structure), BYLD (register), Cosmo5 itself (foundation).

**Content-imagery project runs in parallel with v3.2 development.** Schema extended with optional `imagery?: { logo, key_visual }`. Assets land in `public/case-imagery/<case-slug>/`. Content team needs: named owner, cadence (batched 20/week preferred), format confirmation (SVG logo, 1200px JPG key visual), permission-false fallback policy.

## Constraints

- **Stack**: TypeScript 5, Three.js 0.170, GSAP 3.12, D3 7.9, Vite 6 — no framework changes
- **Data**: 116 cases in static cases.json — no backend, no API
- **Tokens**: No purple in UI chrome (v3.2 scope). Gold = navigation/active. Teal = confirmed/measured. Single `--ease`
- **Accessibility**: WCAG 2.1 AA. `prefers-reduced-motion` respected, no `maximum-scale=1`
- **Performance**: No new Vec3 allocations in hot loops; reuse scratch vectors. Lighthouse target ≥80 desktop. Bundle <800KB gzipped JS
- **Compatibility**: Desktop browsers; Chrome/Firefox/Safari primary targets
- **Persistence**: localStorage only — no accounts, no server

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| phase-1c is canonical branch | v3-starmap diverged; phase-1c has richer interaction model (concentric + reading list + 190 tests) | ✓ Pending v3.2 |
| Primary user = internal team, not external prospect | Reframed 2026-04-14; changes information architecture, persistence, terminal action | ✓ Pending v3.2 |
| Retire Compile + Share endpoints | Internal users stage for their own review, not handoff to strangers | ✓ Pending v3.2 |
| Adapt gather → Comparison Mode for reading list | Preserves phyllotaxis mechanic with sharper purpose (comparison vs filter-result) | ✓ Pending v3.2 |
| localStorage persistence | Internal tool, multi-session use, no server infrastructure needed | ✓ Pending v3.2 |
| Imagery in scope via parallel content project | Full Kunumi archive-as-texture move; content team commits to sourcing | ✓ Pending v3.2 + content |
| Minimal point nucleus (not rendered sphere) | Stars are content; nucleus is anchor. 3D from rings + depth, not nucleus volume | ✓ Validated v3.1 |
| Camera-based flattening (not geometry change) | Rings were always circular; camera rotates to face them. Conceptually honest | ✓ Validated v3.1 |
| Returns ~20% slower than entries | Expansion feels larger than compression. Psychological asymmetry | ✓ Validated v3.1 |
| v3.3 is polish, not features | v3.2 moves are all present but none are resolved in use. Polish pass before the 60–90s flow lands | ✓ Opened 2026-04-17 |
| Refactor after v3.3, not before | Several v3.3 changes are deletions; refactoring code being removed is wasted work | ✓ 2026-04-17 |
| Imagery deferred from v3.3 | Schema hook preserved; integration waits for content team delivery | ✓ 2026-04-17 |

---
*Last updated: 2026-04-17 — v3.2 shipped (Phases 13–15), v3.3 "Resolve the Observatory" opened (Phases 16–27, MILESTONE-v3.3.md finalized)*
