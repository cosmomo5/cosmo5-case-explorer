# Architecture

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Three.js orbital visualizer with layered state management and functional composition.

**Key Characteristics:**
- Mutable shared state via `SceneObjects` struct — single source of truth for 3D geometry and UI coupling
- Declarative orbital mathematics — deterministic positioning via parameterized functions with no stateful animation loops
- Composition-based scene building — clear separation between nucleus orbital mechanics, star orbital mechanics, and staging (filter animation)
- Event-driven interaction — raycasting for hit detection, keyboard for navigation, filter panel for grouped operations
- Minimal re-render overhead — updates mutate geometry in-place within RAF tick loop, CSS-driven UI state for focus modes

## Layers

**Data Model:**
- Purpose: Define case study structure, filtering semantics, grouping modes
- Location: `src/data/`
- Contains: `types.ts` (CaseStudy, NucleusOrbit, StarOrbit interfaces), `filter.ts` (filter state and matching logic), `grouping.ts` (vertical/country/region mappings), `cases.ts` (loader stub)
- Depends on: Nothing — pure data structures
- Used by: Scene building, filtering, UI panels

**Scene Rendering:**
- Purpose: Three.js setup, WebGL state, input controls
- Location: `src/scene/renderer.ts`
- Contains: Renderer, camera, OrbitControls initialization, resize handler
- Depends on: three.js, three/examples/jsm/controls/OrbitControls
- Used by: main.ts entry point

**Orbital Mathematics:**
- Purpose: Compute deterministic 3D positions for nucleus and star orbits given time parameter
- Location: `src/scene/orbitals/`
- Contains: `nucleus-orbit.ts` (two-band spacing, evenly-spaced nucleus placement), `star-orbit.ts` (golden-angle spiral + Rodrigues drift), `staging.ts` (golden spiral arrangement for filter results), `hash.ts` (deterministic pseudorandom for seeding orbits)
- Depends on: data types (CaseStudy, GroupMode)
- Used by: scene-state for position updates every frame, regroup for transition animations

**Scene State & Animation:**
- Purpose: Maintain SceneObjects struct (nuclei, stars, labels, filter state, mode), drive animations via GSAP, apply filter transformations
- Location: `src/scene/scene-state.ts`
- Contains: `buildOrbitalScene` (initial mesh creation), `tickOrbits` (per-frame position updates), `applyFilter` (animate matched stars to staging positions), `focusSphere`/`unfocusSphere` (camera + nucleus animations)
- Depends on: orbital math, GSAP, three.js materials/lighting
- Used by: main.ts, filter-panel, regroup

**Scene Regrouping:**
- Purpose: Animate transition when nucleus grouping mode changes (vertical → country → region)
- Location: `src/scene/regroup.ts`
- Contains: `regroupScene` (recalculate nucleusOrbits, remove/create meshes, animate nucleus+star transitions)
- Depends on: orbital math, scene-state, GSAP
- Used by: filter-panel mode-change handler

**UI Layer:**
- Purpose: DOM interaction, event binding, visual state updates
- Location: `src/ui/`
- Contains: `filter-panel.ts` (nucleus/country/service/year chips, mode toggles, render+bind pattern), `tooltip.ts` (hover labels for stars), `detail-panel.ts` (modal for case details with permission-gated content)
- Depends on: scene state, three.js for screen projection
- Used by: main.ts for event hookup

**Background Layer:**
- Purpose: Parallax starfield canvas layer behind main scene
- Location: `src/scene/background/starfield.ts`
- Contains: Three-layer particle system with rotating planes
- Depends on: three.js
- Used by: main.ts initialization

**Entry Point:**
- Purpose: Bootstrap all systems, orchestrate data loading, wire events, manage focus/unfocus flow
- Location: `src/main.ts`
- Contains: Bootstrap fetch of cases.json, stats animation, scene construction, event listeners (raycasting, keyboard, filter), focus/unfocus state machine, label positioning
- Depends on: All layers
- Used by: HTML script tag

## Data Flow

**Initial Load:**

1. `main.ts` fetches `/cases.json` as `CaseStudy[]`
2. `buildOrbitalScene(cases, 'vertical', scene, labelContainer)` creates initial layout
   - `groupBy(cases, 'vertical')` → groups by service vertical
   - `computeNucleusOrbits(groups)` → assigns each group to an orbit around staging center
   - For each nucleus group, `computeStarOrbit(case, nucleusKey, ...)` assigns each case a position on sphere surface
   - Three.js meshes created and added to scene
   - HTML labels created for each nucleus
3. Scene objects returned as `SceneObjects` struct
4. `mountFilterPanel` wires UI controls
5. First `requestAnimationFrame(tick)` begins

**Per-Frame Animation:**

1. `tick(t)` called at ~60fps
2. `controls.update()` applies OrbitControls damping
3. `tickOrbits(sceneObjects, t, camera)` updates positions
   - For each nucleus: `nucleusPositionAt(nucleusOrbit, t)` → sine/cosine of orbital path
   - For each star: `starPositionAt(starOrbit, t)` → Rodrigues rotation on sphere surface
   - Stars not in staging lerp toward computed position
   - Stars in staging stay put (GSAP controls them)
   - Filter opacity applied based on `filterState` match
4. Label divs repositioned via `projectToScreen` (3D → 2D screen projection)
5. `renderer.render(scene, camera)` draws frame

**Interaction: Raycasting (Hit Detection):**

1. User moves mouse → `pointermove` updates `mouse` Vector2
2. `raycaster.setFromCamera(mouse, camera)` creates ray from camera through mouse
3. `raycaster.intersectObjects(sceneObjects.starMeshes)` returns sorted hits
4. Tooltip shows if star hit detected; `mainCanvas.style.cursor` updates
5. On `pointerup` (if not a drag):
   - If nucleus hit → `enterFocus(key)` (camera animate, nucleus boost, stars flatten)
   - If star hit → `DetailPanel.open(case)` (modal opens)
   - If empty space in focused mode → `exitFocus()` (camera return, nucleus recede)

**Interaction: Filtering (Nucleus Chips):**

1. User clicks nucleus chip in filter panel
2. `filter-panel` creates new `FilterState` with nucleus key toggled
3. Calls `applyFilter(objects, newFilter)`
4. `applyFilter` filters starMeshes to matched set
5. `computeStagingPositions(matchedStars.length, radius)` generates disk layout around staging center
6. GSAP animates each matched star from orbit to staging position (1.0s, power2.out)
7. Next tick: `tickOrbits` skips staging targets (GSAP controls them)
8. Unmatched stars opacity reduced to 0.15

**Interaction: Mode Change (Vertical → Country → Region):**

1. User clicks "country" mode chip
2. `filter-panel` calls `regroupScene(sceneObjects, 'country', scene)`
3. `regroupScene` regroups: `groupBy(allCases, 'country')` → new nucleus orbits
4. For each nucleus in new grouping:
   - If new: create mesh, label, halo
   - If removed: remove from scene
5. For each existing nucleus: GSAP animate to new orbital position (1.2s)
6. For each star: assign new `nucleusKey`, animate to new position relative to new nucleus

**Focus Flow:**

1. User clicks nucleus → `enterFocus(key, controls)` called
2. Sets `objects.mode = 'focused'`, `objects.focusedKey = key`
3. GSAP animates camera position + OrbitControls target
4. All nuclei except focused: recede (position 1.35×), opacity → 0.07
5. Focused nucleus: opacity → 1.0
6. All stars except owned: opacity → 0.04
7. Owned stars: flatten to XY disk via `computeStagingPositions(ownStars.length, starRMax)`
8. CSS class `body.constellation` enables focused UI (filter sidebar, search bar, controls)
9. Arrow keys cycle through nuclei via `enterFocus(nextKey)`
10. Escape or click empty space → `exitFocus()`:
    - Sets `objects.mode = 'global'`, `objects.focusedKey = null`
    - Clears filter
    - GSAP animates camera/controls back to global position
    - CSS classes removed

**State Management:**

- `SceneObjects` is mutable and shared across all modules
- No immutable state snapshots — mutations are in-place
- `tickOrbits` mutates star positions in-place each frame (no copy)
- Filter state mutations are coarse (toggle Sets, recompute visibility next tick)
- GSAP tweens mutate properties during animation; `userData.isStagingTarget` flag prevents conflict with tick updates

## Key Abstractions

**NucleusOrbit:**
- Purpose: Encapsulates orbital parameters for a nucleus group (center position, orbital radius, plane basis vectors, speed, phase)
- Examples: `{ key: 'Media', orbitR: 250, orbitU: {...}, orbitV: {...}, phase: 0.52, speed: 0.00004, cases: [...] }`
- Pattern: Pure data + functional accessor `nucleusPositionAt(orbit, t)` returns position at time t

**StarOrbit:**
- Purpose: Encodes position on sphere surface + drift axis (Rodrigues rotation)
- Examples: `{ caseStudy: Case, nucleusKey: 'Media', u: {...}, v: {...}, r: 45, phase: 1.2, speed: 0.00008, _ax: {...} }`
- Pattern: Deterministic seeding via `hash(caseStudy.id)` ensures same case always gets same position across regroups

**SceneObjects:**
- Purpose: Central mutable container — maps and state for all scene entities
- Fields:
  - `nucleusMeshes: Map<key, Mesh>` — lookup by group name
  - `nucleusLabels: Map<key, HTMLDivElement>` — HTML labels positioned each tick
  - `starMeshes: Mesh[]` — flat array for raycasting
  - `starOrbits: StarOrbit[]` — parallel array of orbital data
  - `nucleusOrbits: Record<key, NucleusOrbitData>` — grouping structure
  - `filterState: FilterState` — current filter selection
  - `mode: 'global' | 'focused'` — view state
  - `focusedKey: string | null` — which nucleus is zoomed
  - `groupMode: 'vertical' | 'country' | 'region'` — current grouping
- Pattern: All coordinate updates and visibility changes flow through this struct

**FilterState:**
- Purpose: Represent active filter selections (countries, services, years, nucleusKeys)
- Pattern: Sets for efficient lookup, `isActive()` method for quick check
- Mutation: Filters are immutable per interaction — new FilterState created, old replaced via `applyFilter`

## Entry Points

**HTML Entry:**
- Location: `index.html` line 228
- Triggers: Browser loads page
- Responsibilities: Module loader with error fallback (8s timeout shows diagnostic)

**Module Entry:**
- Location: `src/main.ts` lines 1-50 `boot()` function
- Triggers: Module loaded
- Responsibilities:
  1. Fetch `/cases.json`
  2. Animate stats counters
  3. Create starfield
  4. Build 3D scene via `buildOrbitalScene`
  5. Mount filter panel
  6. Start animation loop `requestAnimationFrame(tick)`
  7. Setup raycasting, tooltip, detail panel
  8. Wire keyboard shortcuts

**Tick Loop:**
- Location: `src/main.ts` lines 100-120 `tick(t)` function
- Triggers: Every frame (~60fps)
- Responsibilities:
  1. Update controls (damping)
  2. Update orbit positions (nuclei + stars)
  3. Reproject labels to screen
  4. Render frame

## Error Handling

**Strategy:** Graceful degradation with diagnostic reporting.

**Patterns:**

- **Module load failure:** HTML watches for module error event, displays "MODULE LOAD FAILED" in loader (line 228)
- **Boot timeout:** 8-second fallback (line 219) checks if loader still visible; if so, shows "STUCK" + collected errors (line 223)
- **Runtime errors:** Caught in try-catch at `boot()` (line 51), error logged to console and loader text updated with "Boot error — check console"
- **Missing DOM elements:** Detail panel, filter panel, etc. cast to HTMLElement without null checks — assumes HTML structure is correct. Raycasting gracefully handles no hits (empty array)
- **Invalid data:** Cases without services get mapped to 'Other' vertical; cases without region get 'Other'; fallback colors for unknown nucleus keys

## Cross-Cutting Concerns

**Logging:** Uses `console.log` for boot diagnostics (`[v3] main.ts module executing`, `[v3] boot() resolved`), `console.error` for failures.

**Validation:** Filter matching via `matchesFilter(case, filterState)` — returns false if any filter dimension excludes the case. No upfront data validation — relies on cases.json schema.

**Authentication:** Not applicable — all case data loaded client-side from `/cases.json`. Permission gating handled in `DetailPanel.open()` — if `case.permission === false`, hides challenge/approach/metrics sections.

**Accessibility:** 
- Motion reduction respected: `window.matchMedia('(prefers-reduced-motion: reduce)')` gates all GSAP animations (lines 15-17)
- Keyboard navigation: Escape to close modals, arrow keys to cycle focused nucleus
- Raycasting cursor feedback — pointer changes to 'pointer' on hit

---

*Architecture analysis: 2026-04-13*
