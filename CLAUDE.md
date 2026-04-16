# Case Study Explorer — Working Agreement

## What This Is

A Three.js dimensional explorer for navigating 116 case studies. The user moves through three dimensions: a 3D orbital field (global view), a 2D constellation plane (focused view), and a 1D staging track (shortlist). Stars orbit nucleus points grouped by vertical/country/region. The interaction model is a spaceship command bridge — navigation port, reading starboard.

## Stack

| Concern | Library | Version |
|---|---|---|
| 3D scene | Three.js | 0.170 |
| Animation | GSAP | 3.12 |
| Data vis | D3 | 7.9 |
| Bundler | Vite | 6 |
| Types | TypeScript | 5 |
| Tests | Vitest | 2 |

## Dev Commands

```bash
npm run dev      # dev server at localhost:5173
npm run build    # tsc + vite build → dist/
npm run test     # vitest run (unit tests in src/**/*.test.ts)
npm run preview  # preview dist/
```

## Design Spec

The authoritative design document is `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md`. It supersedes sections 3, 5, 6 of the prior spec (`2026-04-12-gravitational-spheres-design.md`). When in doubt, the 04-13 spec wins.

## Design Register

The visual register is analog-era precision — observatory instruments, not SaaS dashboards. Three references:
- **Cosmo5's own system**: astronomical metaphor, gather verb, teal semantic, single ease
- **Kunumi Institute** (`design/canon/web-apps/kunumi-institute.md`): structural model (inquiry over filtering)
- **BYLD** (`design/canon/web-apps/byld.md`): historical register (analog precision, CRT era, instrument panels)

Direction note: `design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`

## Three-State Dimensional Model

```
STATE 1: GLOBAL ORBITAL (3D)
  All constellations visible. Free camera. Stars orbit nuclei.
  Click nucleus → T1 transition → State 2.

STATE 2: CONSTELLATION FOCUS (split canvas)
  ┌─────────────────────────────────┐
  │ Constellation zone (top ~72%)   │  2D orbital plane, stars still moving
  │ Stars selectable by click       │  Selected stars leave orbit → ghost remains
  ├─ ─ ─ ─ divider ─ ─ ─ ─ ─ ─ ─ ─┤
  │ Staging track (bottom ~28%)     │  1D track, shortlisted stars aligned
  └─────────────────────────────────┘
  Click star → flies to track. Click track star → opens reading panel.

STATE 3: READING (command bridge)
  ┌────────────────────┬────────────┐
  │ Scene (compressed) │ Reading    │  Panel slides in from right
  │ Constellation      │ Panel      │  Instrument readout format
  │ + track            │ (340px)    │  ← → nav both track + panel
  └────────────────────┴────────────┘
```

## Transitions

All use `--ease: cubic-bezier(0.16, 1, 0.3, 1)`. Returns ~20% slower than entries.

| ID | Transition | Duration | Key move |
|---|---|---|---|
| T1 | Global → Constellation | ~1200ms | Camera rotates to face orbital plane; rings flatten by perspective |
| T2 | Star → Track | ~600ms | Star crosses divider, ghost remains at orbit |
| T3 | Panel open | ~400ms | Panel slides right-to-left, scene compresses |
| T4 | Panel close | ~350ms | Panel slides out, scene expands |
| T5 | Constellation → Global | ~1400ms | Camera pulls back + rotates, nuclei fade in |
| T6 | Remove from shortlist | ~400ms | Star returns from track to orbit, ghost dissolves |

## Token System

```css
--bg:    #0B0C10
--surf:  #1A1A1A
--teal:  #5ecfc0   /* confirmed / observed / measured */
--gold:  #e8b15a   /* navigation / wayfinding / active */
--ease:  cubic-bezier(0.16, 1, 0.3, 1)
```

No purple. One ease. Gold = active/navigation. Teal = data/measurement.

## Typography

- **DM Mono** — instrument readings, filter chips, case metadata, labels
- **Noto Sans 900** — client names, sphere labels, metric values
- **Fraunces** — hero H1 `<em>proof</em>` italic at opsz 144

## File Map

```
src/
  main.ts                        # Entry, boot, tick loop, raycasting, UI wiring
  style.css                      # All styles
  data/
    types.ts                     # CaseStudy, GroupMode, StarOrbit, NucleusOrbit, ProofType
    grouping.ts                  # groupBy(), getKeyForCase(), SERVICE_TO_VERTICAL map
    filter.ts                    # FilterState, matchesFilter(), proof type + impact scale
  scene/
    scene-state.ts               # Scene modes, transitions T1-T6, split canvas layout
    regroup.ts                   # regroupScene — mode switch
    renderer.ts                  # THREE renderer, camera, OrbitControls
    background/starfield.ts      # Ambient starfield
    orbitals/
      nucleus-orbit.ts           # Outer orbital mechanics
      star-orbit.ts              # Inner orbital mechanics
      staging.ts                 # Track layout (1D horizontal staging)
  ui/
    filter-panel.ts              # Global (constellation picker) + focused (multi-dimension)
    tooltip.ts                   # Hover tooltip + shortlist hint
    detail-panel.ts              # Command bridge reading panel (slides from right)
cases.json                       # 116 case studies
index.html                       # Entry HTML
```

## Key State: SceneObjects

The `SceneObjects` struct (in `scene-state.ts`) is the shared mutable state:

- `nucleusMeshes: Map<string, THREE.Mesh>`
- `nucleusLabels: Map<string, HTMLDivElement>`
- `starMeshes: THREE.Mesh[]`
- `nucleusOrbits: Record<string, NucleusOrbitData>`
- `filterState: FilterState`
- `mode: 'global' | 'focused'`
- `focusedKey: string | null`
- `groupMode: 'vertical' | 'country' | 'region'`
- `shortlist: Set<string>` — case IDs on the staging track (persists across constellations)
- `readingCaseId: string | null` — case currently open in reading panel

## Conventions

- **No new Vec3 allocations in hot loops** — reuse module-scope scratch `THREE.Vector3`
- **`isStagingTarget`** on `star.userData` gates whether GSAP or tick loop controls position
- **Nucleus halo** at `mesh.userData.halo`
- **Label divs** appended to `#star-labels`, positioned via `projectToScreen` in tick
- **`unfocusSphere` is the single exit path** from focused → global
- **Color map** (`NUCLEUS_COLORS`) only covers vertical-mode keys; other modes use `DEFAULT_COLOR`
- **Ghost stars**: when a star is on the shortlist, a ghost mesh remains at its orbital position (low opacity, dashed ring)
- **Shortlist is cross-constellation**: persists when navigating between constellations

## Known Limitations (Not Bugs)

- Country/region mode nucleus colors all use `DEFAULT_COLOR`
- Global search only tweaks opacity, doesn't integrate with filter/staging
- Proof Type and Impact Scale require derived fields — not in raw `cases.json`
