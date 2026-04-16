# Phase 9: Atmosphere - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Source:** MILESTONE-v3.2.md Phase 1 spec + 09-RESEARCH.md

<domain>
## Phase Boundary

Phase 9 establishes the observatory register at first paint. Three deliverables: CRT celestial graticule (radial grid substrate behind starfield), instrument-calibrating loader (JS-milestone-driven DM Mono readouts with step-end transitions), and corner wordmark (COSMO5 / OBSERVATORY replacing the current header brand block).

All three are additive — no existing functionality is modified. The entry experience is layered in on top of Phase 8's clean substrate.

</domain>

<decisions>
## Implementation Decisions

### Graticule Placement
- **Starfield scene (Option A)** — camera-independent, no main scene contamination. PlaneGeometry at z=-300 in the starfield scene. Locked.

### Graticule Visual
- Canvas2D texture, 1024x1024, 24 radial spokes + 5 concentric circles
- Material opacity: 0.08 (within ATM-01 range 0.06-0.10). Adjustable during visual test.
- depthWrite: false (never occlude stars)

### Loader Timing
- JS-milestone-driven, NOT theatrical CSS timing. 4 real boot milestones: module exec, fetch resolve, buildOrbitalScene complete, tick start.
- 400ms hold at ONLINE before fade-out. Adjustable.

### Loader Visual
- DM Mono 400, 12px, step-end transitions (sharp cuts)
- Readout strings: OBSERVATORY INITIALIZING / LOCATING CATALOG / CALIBRATING STARMAP / ONLINE
- ONLINE in gold (var(--gold))

### Wordmark
- COSMO5 / OBSERVATORY in DM Mono (400 primary, 300 secondary)
- Top-left, z-index:10, max-width:80px, pointer-events:none
- Replaces entire .brand block

### Reduced Motion (ATM-04)
- LoaderController checks prefers-reduced-motion in constructor
- If true: skip directly to ONLINE state, then done()
- CSS universal gate (style.css:944) covers CSS animations separately

### Claude's Discretion
- Exact graticule circle radii (currently [80, 160, 240, 320, 400] on 1024 canvas)
- Exact wordmark font sizes (currently 11px/9px)
- Whether to dispose texture on HMR (dev-only concern)

</decisions>

<specifics>
## Specific Ideas

- v3-starmap's crtGridTexture() is the reference implementation for the graticule
- v3-starmap's loader CSS (step-end timing, DM Mono) is the visual spec — timing mechanism is different
- The z-index stack is documented in research: starfield(0) → nebula(1) → app-shell(3) → header(10) → loader(100)

</specifics>

<deferred>
## Deferred Ideas

None — milestone spec covers phase scope completely.

</deferred>

---

*Phase: 09-atmosphere*
*Context gathered: 2026-04-16 from MILESTONE-v3.2.md*
