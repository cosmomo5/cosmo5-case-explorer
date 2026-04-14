# Milestones — Case Study Explorer

## v3.1 — Dimensional Explorer ✓ (Shipped 2026-04-14)

**Core Value (at time of v3.1):** A prospect-facing discovery tool that lets you build a pitch deck's worth of proof in 60 seconds.

**Shipped:**
- Three.js orbital engine with concentric ring layout (proofType/impactBand/year/country/region dimensions)
- Camera-based focus transitions (T1/T5 at 1200/1400ms, camera-controls v3.1.2)
- Split canvas (constellation zone + shortlist track)
- Reading panel (command-bridge right-slide, 340px)
- Shortlist store + track component with sync-to-star-state
- Ring-dimension switcher with live cross-filter
- Staging sphere at focused nucleus centroid
- Visual warmth: MeshBasicMaterial star cores, gold glow sprites, twinkle animation, blue-indigo nebula
- Accessibility: no `maximum-scale=1`, `prefers-reduced-motion` gates (3), keyboard arrow navigation
- 190 tests, clean build

**Phases (9):** 0 Pre-work · 1 Foundation · 2 Layout · 3 Camera · 4 Concentric · 5 Filter+Staging · 6 Reading+Track · 6.5 Visual Warmth · 7 Polish+A11y

**Final phase numbering ended at:** 7

## v3.2 — The Observatory Experience (Active, started 2026-04-14)

**Core Value (revised for v3.2):** A considered internal place where the Cosmo5 strategy/sales team builds, returns to, and studies their mental library of proof across sessions. A showcase of the agency's accomplishments that the team itself inhabits.

**Aesthetic premise:** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*

**Primary user reframed:** External prospect → Internal Cosmo5 strategy/sales team (2026-04-14).

**Targets:**
- Kunumi Institute structural direction: query-driven navigation replaces filter-panel browsing
- BYLD analog-era precision register: CRT graticule substrate, instrument-calibrating loader, extended DM Mono readouts
- Adapted gather mechanic → Comparison Mode for reading list (simultaneous spatial comparison)
- localStorage persistence (reading list, query history, recently viewed, welcome-back state)
- Review Mode (sequential paginated full-viewport reader)
- Clean substrate (remove orphaned v1/v2 DOM from index.html)
- Imagery integration (parallel content project — logo + key visual per case)

**Source document:** `.planning/MILESTONE-v3.2.md`

**Phases planned (8):** 8 Clean Substrate · 9 Atmosphere · 10 Query Bar · 11 Reading Panel · 12 Reading List + Review + Comparison · 13 Hero Collapse · 14 Edge States · 15 Ship
