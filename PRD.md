# Case Study Explorer — PRD

## What It Does

A dimensional explorer for 116 agency case studies. The user navigates through three levels of focus, each a reduction in spatial dimension:

1. **3D Global Orbital** — all constellations (verticals/countries/regions) orbit in space. Free camera: rotate, zoom, pan. Stars orbit their nucleus on unique tilted planes.
2. **2D Constellation Focus** — one constellation fills the screen, flattened to its orbital plane. Stars still orbit. A staging track runs along the bottom. Click stars to build a shortlist.
3. **1D Shortlist + Reading Panel** — selected stars align on a horizontal track. A reading panel slides in from the right showing the full case study in instrument-readout format.

The metaphor is a spaceship command bridge. The left viewport shows the observatory (constellation + staging track). The right panel is the instrument readout.

## Who It's For

Internal sales and strategy teams. Discovery aid for finding relevant case study precedents before pitching clients. The tool helps answer: "show me proof that we've done this kind of work before."

## User Journey

1. User arrives at the globe intro → camera dives into the 3D orbital field
2. User rotates, zooms, explores the constellations. Hovers stars for tooltips.
3. User clicks a nucleus (e.g., "Beauty") → camera rotates to face the orbital plane. Rings flatten. Other constellations fade. Split canvas appears: constellation above, staging track below.
4. User filters by country/service/year/proof type/impact scale → non-matching stars dim
5. User clicks interesting stars → each flies from its orbit, across the divider, to the staging track below. A ghost remains at the orbital position.
6. User clicks a track star → reading panel slides in from the right. Scene compresses left. Full case study in instrument readout format: challenge, approach, results with metric cards.
7. User navigates the shortlist with ← → arrows (both track and panel update simultaneously)
8. User goes back to global, enters another constellation, adds more cases to the shortlist
9. Shortlist is now cross-vertical: a curated pitch deck of proof

## Features

### Global Orbital View (State 1)
- All nucleus points orbit a central staging ground on tilted elliptical paths
- Stars orbit their nucleus on unique tilted orbital planes (electron mechanic)
- Free camera: OrbitControls with damping, zoom limits, tilt constraints
- Grouping mode switch: Vertical (default, 7 groups) / Country / Region
- Hover star: tooltip (client name + case title)
- Click nucleus: enter constellation (T1 transition)
- Filter panel: minimal constellation picker + orbit-by switcher

### Constellation Focus (State 2) — Split Canvas
- **Top zone (~72%)**: one constellation's orbital plane, face-on. Stars still orbit. Click to select.
- **Bottom zone (~28%)**: staging track. Selected stars align horizontally. Connectors between them.
- **Divider line**: the floor of the constellation, ceiling of the track. Stars cross it on selection.
- **Star states**: idle (gold), selected (white + ring), dimmed (filtered out), ghost (star sent to track), reading (gold glow, case open in panel)
- **Filter panel (focused)**: country, service, year, proof type, impact scale. Chip counts update live. Already-staged stars unaffected by filter changes.
- **Shortlist persistence**: survives navigation between constellations

### Reading Panel (State 3) — Command Bridge
- 340px panel slides in from right on track star activation
- Constellation + track compress leftward
- **Instrument readout strip**: region/vertical/year in DM Mono grid cells
- **Sections**: services chips, challenge, approach, results (metric cards with big numbers)
- **Navigation**: ← → arrows control both track and panel. Dot indicators in footer.
- **Permission gating**: locked state if `permission: false`
- Active star glows gold in constellation while being read

### Transitions
- T1 (Global → Constellation, ~1200ms): camera rotates to face orbital plane, others fade
- T2 (Star → Track, ~600ms): star crosses divider, ghost remains, track extends
- T3 (Panel open, ~400ms): slides in, scene compresses
- T4 (Panel close, ~350ms): slides out, scene expands
- T5 (Constellation → Global, ~1400ms): camera pulls back + rotates, nuclei fade in
- T6 (Remove from shortlist, ~400ms): star returns from track to orbit

All use single `--ease`. Returns ~20% slower than entries.

### Filter Dimensions

| Dimension | Global view | Focused view |
|---|---|---|
| Orbit by (vertical/country/region) | Yes — switches grouping | No — already inside a constellation |
| Country | No | Yes — scoped to constellation |
| Service | No | Yes — scoped to constellation |
| Year | No | Yes — scoped to constellation |
| Proof Type | No | Yes — Revenue/ROAS, Conversion, Awareness, Engagement, Cost efficiency |
| Impact Scale | No | Yes — range slider, incremental → transformative |

Filter logic: AND between dimensions, OR within each dimension. Chip counts update live.

## Data

116 case studies in `cases.json`. Fields: `id`, `client`, `year`, `services[]`, `countries[]`, `region`, `permission`, `title`, `challenge`, `approach`, `metrics[]`.

**Derived fields needed:** `proofType` (categorized from metrics) and `impactScale` (magnitude from metrics).

## Token System

```css
--bg:    #0B0C10   /* deep space */
--teal:  #5ecfc0   /* confirmed / observed / measured */
--gold:  #e8b15a   /* navigation / wayfinding / active */
--ease:  cubic-bezier(0.16, 1, 0.3, 1)   /* one easing, everywhere */
```

No purple. DM Mono for instrument readings. Noto Sans 900 for identification. Fraunces italic for the hero "proof."

## Current Codebase State (branch: phase-1c)

~2,700 lines (TypeScript + CSS). Orbital mechanics, Three.js rendering, GSAP animations, filter panel, tooltip, and detail panel exist. Key gaps between current code and this PRD:

| Area | Current | Target |
|---|---|---|
| Focus model | Sphere expands to fill (single zone) | Split canvas (constellation + track zones) |
| Camera transition | Zoom in/out | Rotate to face orbital plane (rings flatten by perspective) |
| Star selection | No selection model | Click to toggle, ghost at orbit, fly to track |
| Staging | Phyllotaxis cluster at (0,0,0) | Horizontal 1D track below divider |
| Reading | Modal detail panel with scrim | Command bridge panel from right, scene compresses |
| Filter (focused) | Country, service, year | + Proof Type, Impact Scale |
| Shortlist | Does not exist | Cross-constellation persistent shortlist |

## Not In Scope (This Version)

- Kunumi conversational query interface (future direction, not v3.1)
- BYLD CRT grid atmospheric layer (consider for v3.2)
- Archive artifact thumbnails in starmap (depends on case study imagery)
- Global search → staging integration
- Offline support / caching
- Analytics / usage tracking

## Done Criteria

- [ ] Global orbital view: nuclei orbit, stars orbit, free camera, grouping mode switch works
- [ ] Click nucleus: T1 transition, camera rotates to face plane, rings flatten by perspective
- [ ] Split canvas: constellation top zone + track bottom zone + visible divider
- [ ] Click star: T2 transition, star crosses divider to track, ghost remains at orbit
- [ ] Track grows/contracts as stars added/removed
- [ ] Filter panel global: constellation picker + orbit-by switcher
- [ ] Filter panel focused: country, service, year, proof type, impact scale
- [ ] Chip counts update live with current filter combination
- [ ] Shortlist persists across constellation visits
- [ ] Click track star: T3, reading panel slides in, scene compresses
- [ ] Reading panel: instrument readout strip + challenge/approach/results + metric cards
- [ ] Active star glows gold while being read
- [ ] ← → navigates track + panel simultaneously
- [ ] Esc closes panel (T4), back returns to global (T5)
- [ ] Remove from shortlist: T6, star returns to orbit
- [ ] All transitions use `--ease`; returns ~20% slower than entries
- [ ] `prefers-reduced-motion` respected (3 gates)
- [ ] No purple tokens
- [ ] Single `cubic-bezier` in CSS
- [ ] `npm run build` zero errors
