# Codebase Structure

**Analysis Date:** 2026-04-13

## Directory Layout

```
case-study-explorer/
├── src/                          # Source code (TypeScript)
│   ├── main.ts                   # Entry point: boot, event wiring, interaction flow
│   ├── style.css                 # Stylesheet (imported in main.ts)
│   ├── data/                     # Data models and filtering logic
│   │   ├── types.ts              # Interfaces: CaseStudy, NucleusOrbit, StarOrbit
│   │   ├── cases.ts              # Loader stub (unused; data loaded via fetch in main.ts)
│   │   ├── filter.ts             # FilterState and matching logic
│   │   ├── filter.test.ts        # Unit tests for filter matching
│   │   ├── grouping.ts           # SERVICE_TO_VERTICAL mapping, groupBy()
│   │   └── grouping.test.ts      # Unit tests for grouping
│   ├── scene/                    # Three.js scene management
│   │   ├── renderer.ts           # WebGL renderer, camera, OrbitControls setup
│   │   ├── scene-state.ts        # SceneObjects struct, animation (buildOrbitalScene, tickOrbits, focusSphere)
│   │   ├── regroup.ts            # Regrouping animation when mode changes
│   │   ├── background/           # Background layers
│   │   │   └── starfield.ts      # Parallax starfield (3-layer rotating particles)
│   │   └── orbitals/             # Orbital mechanics and geometry
│   │       ├── nucleus-orbit.ts  # Nucleus orbital parameters, two-band spacing
│   │       ├── nucleus-orbit.test.ts
│   │       ├── star-orbit.ts     # Star positions on sphere, Rodrigues rotation
│   │       ├── star-orbit.test.ts
│   │       ├── staging.ts        # Golden-angle spiral for filter layout
│   │       ├── staging.test.ts
│   │       └── hash.ts           # Deterministic pseudorandom seeding
│   └── ui/                       # DOM interaction and UI panels
│       ├── filter-panel.ts       # Nucleus chips, country/service/year filters, mode toggles
│       ├── tooltip.ts            # Hover labels and 3D→2D projection helper
│       ├── detail-panel.ts       # Modal case study viewer with permission gating
│       └── filter.test.ts        # (Duplicate test filename — no test for filter UI itself)
├── index.html                    # HTML entry point, canvases, DOM structure
├── styles.css                    # Additional stylesheet
├── package.json                  # Dependencies: three, gsap, d3, topojson-client
├── vite.config.ts                # Vite + Vitest config (cacheDir to tmpdir)
├── tsconfig.json                 # TypeScript configuration (inferred from project)
├── .gitignore                    # Excludes node_modules, dist/
├── cases.json                    # Case study data (external JSON file, not in repo)
├── dist/                         # Built output (Vite build)
│   ├── index.html
│   └── assets/
│       └── index-[hash].css
├── .superpowers/                 # Design brainstorm artifacts (HTML mockups)
├── .planning/                    # Planning and analysis documents
│   └── codebase/                 # THIS LOCATION
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
└── cosmos.html                   # Legacy/alternate entry point (unused in phase-1c)
```

## Directory Purposes

**`src/`:**
- Purpose: All TypeScript source code
- Contains: Modules, tests, styles
- Key files: `main.ts` (entry), `scene/scene-state.ts` (state hub)

**`src/data/`:**
- Purpose: Data model definitions and filtering/grouping logic
- Contains: Interfaces, type definitions, filter predicates, grouping mappings
- Key files: `types.ts` (CaseStudy, NucleusOrbit, StarOrbit), `filter.ts` (FilterState, matchesFilter)

**`src/scene/`:**
- Purpose: Three.js scene setup and animation control
- Contains: Renderer initialization, orbital mathematics, animation state machine
- Key files: `scene-state.ts` (SceneObjects, buildOrbitalScene, tickOrbits, focusSphere), `renderer.ts` (WebGL setup)

**`src/scene/orbitals/`:**
- Purpose: Deterministic mathematical positioning for nucleus and star orbits
- Contains: Pure position calculation functions, orbital parameter computation, hashing
- Key files: `nucleus-orbit.ts` (two-band spacing), `star-orbit.ts` (Rodrigues rotation), `staging.ts` (golden spiral)

**`src/ui/`:**
- Purpose: DOM manipulation, event handling, user interaction
- Contains: Filter panel rendering, tooltip management, detail panel modal
- Key files: `filter-panel.ts` (nucleus/filter UI), `detail-panel.ts` (case modal)

**`src/scene/background/`:**
- Purpose: Background visual layer (parallax starfield)
- Contains: Separate Three.js instance for particles
- Key files: `starfield.ts` (three-layer rotating particle system)

**`.planning/codebase/`:**
- Purpose: Architecture and structure documentation
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md (to be written)

## Key File Locations

**Entry Points:**
- `index.html`: HTML entry (line 228 loads `src/main.ts`)
- `src/main.ts`: Module entry, bootstraps all systems

**Configuration:**
- `vite.config.ts`: Vite bundler + Vitest runner config
- `tsconfig.json`: TypeScript compiler options
- `package.json`: Dependencies and build scripts

**Core Logic:**
- `src/scene/scene-state.ts`: State hub (SceneObjects, animation, filtering)
- `src/scene/orbitals/nucleus-orbit.ts`: Nucleus orbit mathematics
- `src/scene/orbitals/star-orbit.ts`: Star position on sphere, Rodrigues rotation

**Interaction:**
- `src/main.ts`: Raycasting, keyboard input, focus/unfocus flow
- `src/ui/filter-panel.ts`: Filter UI and event binding
- `src/ui/detail-panel.ts`: Case study modal

**Testing:**
- `src/data/filter.test.ts`: Filter matching tests
- `src/data/grouping.test.ts`: Grouping logic tests
- `src/scene/orbitals/*.test.ts`: Orbital math tests

**Styles:**
- `src/style.css`: Imported in main.ts
- `styles.css`: Alternate/legacy stylesheet

## Naming Conventions

**Files:**
- Modules: `kebab-case.ts` (e.g., `scene-state.ts`, `nucleus-orbit.ts`)
- Tests: `[module].test.ts` (e.g., `filter.test.ts`)
- Styles: `style.css` or `styles.css`

**Functions:**
- Public APIs: `camelCase` (e.g., `buildOrbitalScene`, `tickOrbits`, `computeNucleusOrbits`)
- Private helpers: `camelCase` with underscore prefix for internal scratch vectors (e.g., `_tickScratch`)
- Callbacks: Descriptive names (e.g., `onGroupModeChange`, `onExitFocus`)

**Variables:**
- DOM elements: `el{PascalCase}` (e.g., `elSC`, `elCrumb`, `elHero`) or `el{descriptive}` (e.g., `elGlobalSearch`)
- Three.js objects: `camelCase` (e.g., `scene`, `camera`, `renderer`, `controls`)
- Orbital data: Descriptive + short (e.g., `nucleusOrbits`, `starOrbits`, `nucleusKey`, `orbitR`)

**Types:**
- Interfaces: `PascalCase` (e.g., `CaseStudy`, `NucleusOrbit`, `FilterState`, `SceneObjects`)
- Type aliases: `PascalCase` (e.g., `GroupMode`, `SceneMode`)

**CSS Classes:**
- Namespace prefixes: Single letter or short string (e.g., `.cl` for cluster labels, `.fchip` for filter chips, `.p-` for panel sections)
- State classes: Hyphenated (e.g., `.on`, `.visible`, `.focused`, `.constellation`, `.search-match`)

**HTML IDs:**
- Format: kebab-case (e.g., `main-canvas`, `star-labels`, `focus-hint`, `filtersWrap`, `labelSlider`)
- Structure: `s-c` (stat cases), `s-t` (stat territories), `s-s` (stat services), `s-y` (stat year), `p-*` (panel sections)

## Where to Add New Code

**New Feature (e.g., add a new interaction):**
- If interaction is geometric (new orbital animation, focus behavior):
  - Primary code: `src/scene/scene-state.ts` (new state field, new animation function)
  - Tests: `src/scene/orbitals/*.test.ts` (if math changes)
- If interaction is filtering/grouping:
  - Primary code: `src/data/filter.ts` or `src/data/grouping.ts`
  - Tests: `src/data/filter.test.ts` or `src/data/grouping.test.ts`
- If interaction is UI (new panel, new event):
  - Primary code: `src/ui/[feature].ts` or modify `src/ui/filter-panel.ts`
  - Wiring: `src/main.ts` (event listener registration)

**New Component/Module:**
- Data model: `src/data/[model].ts`
- Scene manipulation: `src/scene/[feature].ts` (e.g., `src/scene/lighting.ts` for custom lights)
- UI: `src/ui/[panel].ts` (e.g., `src/ui/info-panel.ts`)
- Background/visual: `src/scene/background/[layer].ts`

**Utilities:**
- Shared Three.js helpers: `src/scene/[helper].ts` (e.g., `src/scene/color-utils.ts`)
- Data transformation: `src/data/[util].ts`
- Math helpers: `src/scene/orbitals/[math].ts` (alongside existing orbit code)

**Tests:**
- Unit tests for pure functions: Co-located as `[module].test.ts` in same directory
- Integration tests: Would go in `src/` at root level if added (not present currently)
- Run all: `npm test` (vitest)

## Special Directories

**`.superpowers/brainstorm/`:**
- Purpose: Design brainstorm HTML mockups and state explorations
- Generated: Yes (by visual companion during design phase)
- Committed: No (gitignored)
- Example contents: `nucleus-3d-variants.html`, `filter-panel-comparison.html`

**`dist/`:**
- Purpose: Built output from Vite
- Generated: Yes (`npm run build`)
- Committed: No (gitignored)
- Contents: Minified bundle, asset hashes

**`.planning/codebase/`:**
- Purpose: Architecture documentation for code guidance
- Generated: Manually (this directory)
- Committed: No (typically gitignored in work/ subdirectory)
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md

**`node_modules/`:**
- Purpose: Dependencies
- Generated: Yes (`npm install`)
- Committed: No (gitignored)

## Import Patterns

**Absolute imports (via implicit TypeScript paths):**
```typescript
import { buildOrbitalScene } from './scene/scene-state';
import type { CaseStudy, GroupMode } from './data/types';
import { gsap } from 'gsap';
import * as THREE from 'three';
```

**Relative imports (same directory or subdirectories):**
```typescript
// In src/scene/scene-state.ts
import { nucleusPositionAt } from './orbitals/nucleus-orbit';
import { createFilterState, matchesFilter } from '../data/filter';
```

**No path aliases:** Project uses standard relative paths, no @ or ~ aliases configured.

**Third-party:**
- `three` and `three/examples/jsm/*` for 3D rendering
- `gsap` for animations
- `d3` and `topojson-client` imported but not actively used in v3

## File Size Patterns

**Large files (100+ lines):**
- `src/main.ts` (313 lines) — entry point, event wiring, interaction state machine
- `src/scene/scene-state.ts` (344 lines) — scene building, animation, filtering
- `src/ui/filter-panel.ts` (190 lines) — filter UI rendering and event binding

**Medium files (50-100 lines):**
- `src/scene/regroup.ts` (114 lines) — regrouping animation
- `src/ui/detail-panel.ts` (139 lines) — modal case panel
- `src/scene/orbitals/star-orbit.ts` (103 lines) — Rodrigues rotation math

**Small focused files (<50 lines):**
- `src/scene/orbitals/nucleus-orbit.ts` (80 lines)
- `src/scene/orbitals/staging.ts` (17 lines)
- `src/ui/tooltip.ts` (49 lines)

## Runtime Dependencies

**Critical at runtime:**
- `three` — 3D rendering engine
- `gsap` — Animation orchestration
- `/cases.json` — External data file (must exist at build/serve root)

**Development only:**
- `typescript` — Type checking
- `vite` — Build bundler
- `vitest` — Test runner
- `@types/*` — TypeScript type definitions

---

*Structure analysis: 2026-04-13*
