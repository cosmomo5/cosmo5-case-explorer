# Case Study Explorer v3.1 — Dimensional Explorer

## What This Is

A Three.js dimensional explorer for navigating 116 marketing intelligence case studies. Users move through three levels of focus — 3D orbital field, 2D constellation plane, 1D shortlist track — building a curated set of proof for client pitches. Built for internal sales and strategy teams at Cosmo5 who need to find relevant case study precedents before presentations.

## Core Value

**A prospect-facing discovery tool that lets you build a pitch deck's worth of proof in 60 seconds.** If the shortlisting flow (browse → select → read → compare) doesn't work, nothing else matters.

## Requirements

### Validated

- ✓ Three.js orbital mechanics (nuclei orbit staging center, stars orbit nuclei) — existing
- ✓ GSAP animations (focus/unfocus, filter/staging, group switch) — existing
- ✓ Grouping modes (vertical/country/region) with SERVICE_TO_VERTICAL map — existing
- ✓ Filter panel with attribute chips (country, service, year) — existing
- ✓ Hover tooltip (client + title) — existing
- ✓ Case detail panel — existing (needs rework to command bridge)
- ✓ Ambient starfield background — existing
- ✓ CSS token system (teal, gold, no purple, single ease) — existing
- ✓ Typography (DM Mono, Noto Sans 900, Fraunces) — existing
- ✓ prefers-reduced-motion gates (3 gates) — existing
- ✓ 116 cases loaded from cases.json — existing

### Active

- [ ] Split canvas layout: constellation zone (top ~72%) + staging track (bottom ~28%)
- [ ] Camera-based flattening: T1 transition rotates camera to face orbital plane
- [ ] Star selection model: click to toggle, star leaves orbit, ghost remains
- [ ] Staging track: 1D horizontal line, stars align, connectors between them
- [ ] Cross-constellation shortlist: persists across constellation visits
- [ ] Reading panel: command bridge layout, slides in from right (340px), scene compresses
- [ ] Instrument readout format in reading panel: DM Mono grid cells, metric cards
- [ ] ← → navigation controls both track and panel simultaneously
- [ ] Enriched filter panel (focused mode): proof type + impact scale dimensions
- [ ] Live chip count updates based on current filter combination
- [ ] T1 transition: global → constellation (~1200ms), rings flatten by perspective
- [ ] T2 transition: star → track (~600ms), crosses divider, ghost at orbit
- [ ] T3 transition: panel open (~400ms), slides in, scene compresses
- [ ] T4 transition: panel close (~350ms), slides out, scene expands
- [ ] T5 transition: constellation → global (~1400ms), camera pulls back + rotates
- [ ] T6 transition: remove from shortlist (~400ms), star returns to orbit
- [ ] Ghost star mechanic: dimmed star at orbital position when original is on track
- [ ] Active star glows gold in constellation while being read in panel
- [ ] Returns ~20% slower than entries (expansion feels larger)
- [ ] Derived data fields: proofType (from metrics) and impactScale (from metrics magnitude)

### Out of Scope

- Kunumi conversational query interface — future v3.2+, not this pass
- BYLD CRT grid atmospheric layer — consider for v3.2, not blocking
- Archive artifact thumbnails in starmap — depends on case study imagery availability
- Global search → staging integration — deferred
- D3 globe intro rework — existing globe stays as-is
- Offline support / caching — not needed for internal tool
- Analytics / usage tracking — not this version
- Mobile/touch-first layout — desktop-first internal tool

## Context

**Existing codebase:** ~2,700 lines TypeScript + CSS on branch `phase-1c`. Orbital mechanics, rendering pipeline, filter panel, tooltip, and detail panel all exist but follow the old model (sphere-expands-to-fill, phyllotaxis staging at origin, modal detail panel).

**Design direction:** Three reference points — Cosmo5's own astronomical metaphor (foundation), Kunumi Institute (structural model: inquiry over filtering), BYLD (register: analog-era precision instruments). Direction note at `design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`.

**Key design decision from brainstorming:** The dimensional collapse (3D → 2D → 1D) is the central interaction concept. Each transition enacts a reduction in degrees of freedom. The flattening is a camera move, not a geometry change. The staging track coexists with the constellation (split canvas), not as a separate state.

**Codebase map:** `.planning/codebase/` — 7 documents covering stack, architecture, structure, conventions, testing, integrations, concerns.

## Constraints

- **Stack**: TypeScript 5, Three.js 0.170, GSAP 3.12, D3 7.9, Vite 6 — no framework changes
- **Data**: 116 cases in static cases.json — no backend, no API
- **Tokens**: No purple. Gold = navigation/active. Teal = confirmed/measured. Single `--ease`.
- **Accessibility**: `prefers-reduced-motion` respected (3 gates), no `maximum-scale=1`
- **Performance**: No new Vec3 allocations in hot loops; reuse scratch vectors
- **Compatibility**: Desktop browsers; Chrome/Firefox/Safari primary targets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Minimal point nucleus (not rendered sphere) | Stars are the content; nucleus is the anchor. 3D comes from rings + star depth, not nucleus volume. | — Pending |
| Split canvas (constellation + track coexist) | User can browse constellation while building shortlist. No state transition needed to add more. | — Pending |
| Command bridge reading panel (right slide) | Spaceship cockpit feel: navigation port, reading starboard. Scene stays visible when reading. | — Pending |
| Camera-based flattening (not geometry change) | Rings were always circular; camera rotates to face them. Conceptually honest dimensional collapse. | — Pending |
| Cross-constellation shortlist | Real use case: build a pitch with proof from multiple verticals. Shortlist must survive navigation. | — Pending |
| Stars fly direct to track (no gather step) | Faster, more direct. The divider crossing IS the animation event. No ceremony needed. | — Pending |
| Ghost at orbital position when star is staged | User can see what's been taken. Click ghost to return star. Orbit shows the gap. | — Pending |
| Proof Type + Impact Scale filter dimensions | Only meaningful inside a constellation. A CMO and a performance lead want different proof. | — Pending |
| Returns ~20% slower than entries | Expansion feels larger than compression. Psychological asymmetry in dimensional transitions. | — Pending |

---
*Last updated: 2026-04-13 after brainstorming session and GSD initialization*
