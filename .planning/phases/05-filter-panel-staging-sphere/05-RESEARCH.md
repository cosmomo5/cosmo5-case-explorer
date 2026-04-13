# Phase 5: Filter Panel + Staging Sphere - Research

**Researched:** 2026-04-13
**Domain:** Three.js scene graph extension, filter state management, accordion UI, GSAP animation orchestration
**Confidence:** HIGH

## Summary

Phase 5 introduces two interconnected features: an accordion filter panel visible in both views, and a staging sphere that materializes in global view when filters are active. The codebase is well-prepared for both — FilterState exists but needs two dimensions added, the accordion replaces a flat chip layout, and the staging sphere can be implemented as a synthetic nucleus using the existing `enterFocus()` pipeline without new click-handling code.

The core architectural insight: the staging sphere is not a special case. By inserting `"__staging__"` into `nucleusMeshes` and `nucleusOrbits` at the right moment, the existing T1 focus + concentric orbit pipeline handles it identically to any dimension-sphere. The main new complexity is (1) the bifurcated `applyFilter()` — global mode creates/animates the staging sphere while focused mode dims in place — and (2) the cross-filter count algorithm for live chip counts.

No new libraries are needed. All implementation is TypeScript + Three.js + GSAP using patterns already established in the codebase.

**Primary recommendation:** Extend FilterState first (FILT-02), then build accordion UI (FILT-01/03), then implement staging sphere lifecycle (FILT-04/05/06/09), then focused-view filtering (FILT-07), then status bar + reset (FILT-08), then orbit-by switcher (FILT-10).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Filter panel layout**: Expandable accordion sections — one row per dimension, expands to show values as chips. Chosen over horizontal chip bar and hybrid approaches.
- **Dimensions**: country, service, year, ProofType, ImpactScale — visible in both global and focused views
- **Staging sphere behavior**: selecting chips in global view creates a staging sphere with distinct color; matched stars animate to the staging sphere; staging sphere is clickable — triggers same T1 focus + concentric orbit view as any dimension-sphere; other spheres push outward slightly when staging sphere appears; slight zoom toward staging
- **Focused view filtering**: filter panel narrows within the constellation (filters apply to ring contents); AND between dimensions, OR within each dimension
- **Live chip counts**: chips with 0 matches grey out (not hidden — grey-out to maintain spatial stability)
- **Specifics**: accordion should feel snappy (not slow drawer animation); chip counts update live as other dimensions change (cross-filtering); grey-out not hide for 0-match chips

### Claude's Discretion
- Accordion expand/collapse animation timing and easing
- Panel positioning (left side, right side, top)
- Chip visual design within accordion sections
- Staging sphere color choice and glow treatment
- Animation choreography for stars moving to staging sphere
- How existing ring lines/labels adapt when cases are filtered in focused view

### Deferred Ideas (OUT OF SCOPE)
- Search/type-ahead within a dimension (future polish)
- Saved filter presets
- Filter history / undo
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILT-01 | All-dimension filter panel (country, service, year, ProofType, ImpactScale) in both views | `src/ui/filter-panel.ts` requires accordion rewrite; `FilterState` needs proofType + impactScale added |
| FILT-02 | AND between dimensions, OR within each dimension | `matchesFilter()` in `filter.ts` needs extension for new dimensions; AND/OR logic pattern confirmed in existing code |
| FILT-03 | Live chip counts; 0-match chips grey out | Cross-filter count algorithm: count cases matching (currentFilter minus D) that also have value V in dimension D; pure function, no DOM coupling |
| FILT-04 | Global filter → staging sphere with distinct color; matched stars animate to it | Synthetic nucleus pattern: insert `"__staging__"` into `nucleusMeshes` and `nucleusOrbits`; GSAP tween star mesh positions |
| FILT-05 | Staging sphere clickable, focusable (same T1 + concentric orbit view) | `enterFocus("__staging__")` works automatically once synthetic nucleus maps are populated; ring dimension uses `autoSelectRingDimension` on filtered cases |
| FILT-06 | Other spheres push outward slightly when staging sphere appears; slight zoom toward staging | Reuse `focusSphere()` expansion pattern (×4.5) with smaller multiplier (1.1–1.2×); `lerpToCamera` GSAP proxy toward staging nucleus position |
| FILT-07 | Focused filter narrows within constellation (dims non-matching cases) | New `filterDim` star state (opacity 0.12); `applyFilter()` bifurcation: focused mode → set star state, no staging sphere |
| FILT-08 | Filter status display `N / total visible` + reset all | DOM element in filter panel header; reset clears `FilterState`, dissolves staging sphere |
| FILT-09 | Staging sphere dissolves when filter cleared; stars return to original spheres | Reverse GSAP tween stars back to `nucleusPositionAt(originalOrbit, t)`, then remove `"__staging__"` from both maps and dispose geometry/material |
| FILT-10 | Orbit-by switcher (Vertical/Country/Region) — changes sphere grouping in global view | Already partially implemented in current `filter-panel.ts` `buildHTML()`; migrate into accordion header or separate row |
</phase_requirements>

---

## Standard Stack

### Core (no new libraries)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | ^0.170.0 | Scene graph, Mesh, LineLoop, BufferGeometry, Raycaster | Already in use; staging sphere is a Mesh like any nucleus |
| gsap | ^3.12.0 | Star position tweening, accordion animation, staging sphere pulse | GSAP proxy pattern already established for all camera animation |
| camera-controls | ^3.1.2 | Camera zoom toward staging sphere (T1/T5) | Already integrated; `lerpToCamera` calls go through TransitionChoreographer |
| TypeScript | ^5.0.0 | FilterState extension, new types | Locked stack |

### Testing
| Library | Version | Purpose |
|---------|---------|---------|
| vitest | ^2.0.0 | Unit tests for filter logic, cross-filter counts, matchesFilter |
| jsdom | ^29.0.2 | DOM environment for filter-panel unit tests |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended File Changes
```
src/
├── data/
│   ├── filter.ts              # Extend FilterState + matchesFilter for proofType + impactScale
│   └── filter-counts.ts       # NEW: cross-filter count pure function
├── ui/
│   ├── filter-panel.ts        # Rewrite: accordion layout, both-view visibility, cross-filter counts
│   └── filter-panel.css       # NEW or extend style.css: accordion expand/collapse tokens
├── scene/
│   └── scene-state.ts         # applyFilter() bifurcation, staging sphere lifecycle, FILT-06 push
└── tests/
    ├── filter.test.ts          # Extend for proofType + impactScale
    ├── filter-counts.test.ts   # NEW: cross-filter count algorithm tests
    └── filter-panel.test.ts    # NEW or extend: accordion DOM tests
```

### Pattern 1: Synthetic Nucleus for Staging Sphere

**What:** Insert the staging sphere into the two maps (`nucleusMeshes`, `nucleusOrbits`) that gate all click-handling and focus transitions. No new pipeline code needed.

**When to use:** Any time a clickable/focusable sphere must be created dynamically at runtime.

**How it works:**
```typescript
// Source: pattern derived from src/scene/scene-state.ts buildOrbitalScene()
const STAGING_KEY = '__staging__';

function createStagingNucleus(
  scene: THREE.Scene,
  sceneObjects: SceneObjects,
  filteredCases: EnrichedCaseStudy[],
  stagingColor: number,
): void {
  // 1. Build mesh (same as regular nucleus)
  const geo = new THREE.SphereGeometry(NUCLEUS_RADIUS, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: stagingColor,
    roughness: 0.45,
    metalness: 0.15,
    emissive: stagingColor,
    emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  // Position at centroid of current nucleus positions or scene center
  mesh.position.copy(computeStagingCenter(sceneObjects));
  scene.add(mesh);

  // 2. Build synthetic NucleusOrbitData so ringPositionAt() works
  const orbitData: NucleusOrbitData = buildStagingOrbitData(mesh.position);

  // 3. Insert into both gating maps
  sceneObjects.nucleusMeshes.set(STAGING_KEY, mesh);
  sceneObjects.nucleusOrbits[STAGING_KEY] = orbitData;
}

function disposeStagingNucleus(
  scene: THREE.Scene,
  sceneObjects: SceneObjects,
): void {
  const mesh = sceneObjects.nucleusMeshes.get(STAGING_KEY);
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.MeshStandardMaterial).dispose();
    sceneObjects.nucleusMeshes.delete(STAGING_KEY);
    delete sceneObjects.nucleusOrbits[STAGING_KEY];
  }
}
```

### Pattern 2: applyFilter() Bifurcation

**What:** `applyFilter()` branches on `sceneObjects.mode` — global and focused views get completely different behaviors.

```typescript
// Source: extension of src/scene/scene-state.ts applyFilter()
function applyFilter(
  scene: THREE.Scene,
  sceneObjects: SceneObjects,
  filterState: FilterState,
  allCases: EnrichedCaseStudy[],
): void {
  const matchingCases = allCases.filter(c => filterState.matchesFilter(c));
  const isActive = filterState.isActive();

  if (sceneObjects.mode === 'global') {
    if (isActive && matchingCases.length > 0) {
      // Ensure staging sphere exists
      if (!sceneObjects.nucleusMeshes.has(STAGING_KEY)) {
        createStagingNucleus(scene, sceneObjects, matchingCases, STAGING_COLOR);
        applyStagingPush(sceneObjects);   // FILT-06: slight push outward
        zoomTowardStaging(sceneObjects);  // FILT-06: slight zoom
      }
      // Animate matched stars to staging sphere
      animateStarsToStaging(sceneObjects, matchingCases);
    } else {
      // Clear: return stars, dispose staging sphere
      if (sceneObjects.nucleusMeshes.has(STAGING_KEY)) {
        returnStarsFromStaging(sceneObjects);
        disposeStagingNucleus(scene, sceneObjects);
      }
    }
  } else if (sceneObjects.mode === 'constellation') {
    // Focused view: dim non-matching in place (no staging sphere)
    for (const [id, starMesh] of sceneObjects.starMeshes) {
      const caseStudy = getCaseById(allCases, id);
      if (!caseStudy) continue;
      const matches = !isActive || filterState.matchesFilter(caseStudy);
      setStarState(starMesh, matches ? 'idle' : 'filterDim');
    }
  }
}
```

### Pattern 3: Cross-Filter Count Algorithm

**What:** For each dimension D and value V, the chip count = cases that match the current filter WITH dimension D removed, AND that have value V in D. This gives "how many would be in this group if you toggle V".

```typescript
// Source: new src/data/filter-counts.ts
export function computeChipCounts(
  allCases: EnrichedCaseStudy[],
  currentFilter: FilterState,
): Map<string, Map<string, number>> {
  // Returns Map<dimensionKey, Map<value, count>>
  const result = new Map<string, Map<string, number>>();

  for (const dim of FILTER_DIMENSIONS) {
    const filterWithoutDim = currentFilter.without(dim); // returns new FilterState
    const valueCounts = new Map<string, number>();

    for (const c of allCases) {
      if (!filterWithoutDim.matchesFilter(c)) continue;
      const val = getDimValue(c, dim);
      valueCounts.set(val, (valueCounts.get(val) ?? 0) + 1);
    }

    result.set(dim, valueCounts);
  }
  return result;
}
```

The `FilterState.without(dim)` method returns a new FilterState with that dimension cleared — enables cross-filter counting without mutating state.

### Pattern 4: FilterState Extension

**What:** Add `proofType: Set<ProofType>` and `impactScale: Set<ImpactScaleBand>` to FilterState, extend `matchesFilter()` and `isActive()`.

```typescript
// Source: extension of src/data/filter.ts
export class FilterState {
  countries: Set<string> = new Set();
  services: Set<string> = new Set();
  years: Set<number> = new Set();
  nucleusKeys: Set<string> = new Set();
  proofTypes: Set<ProofType> = new Set();       // NEW
  impactBands: Set<ImpactScaleBand> = new Set(); // NEW

  matchesFilter(c: EnrichedCaseStudy): boolean {
    if (this.countries.size > 0 && !this.countries.has(c.countries[0])) return false;
    if (this.services.size > 0 && !this.services.has(c.service)) return false;
    if (this.years.size > 0 && !this.years.has(c.year)) return false;
    if (this.nucleusKeys.size > 0 && !this.nucleusKeys.has(c.nucleusKey)) return false;
    if (this.proofTypes.size > 0 && !this.proofTypes.has(c.proofType)) return false;   // NEW
    if (this.impactBands.size > 0 && !this.impactBands.has(c.impactScale?.band ?? 'unknown')) return false; // NEW
    return true;
  }

  isActive(): boolean {
    return this.countries.size > 0 || this.services.size > 0 ||
           this.years.size > 0 || this.nucleusKeys.size > 0 ||
           this.proofTypes.size > 0 || this.impactBands.size > 0; // NEW
  }

  without(dim: FilterDimension): FilterState {
    const copy = this.clone();
    copy[dim].clear();
    return copy;
  }
}
```

### Pattern 5: Accordion HTML Structure

**What:** One `<div class="fgroup">` per dimension. Each group has a header row (dimension label + chip count badge) and a collapsible body (chips). CSS handles expand/collapse via `max-height` transition.

```html
<!-- filter-panel.ts buildHTML() output structure -->
<div class="fgroup" data-dim="country">
  <button class="fgroup-header" aria-expanded="false">
    <span class="fgroup-label">Country</span>
    <span class="fgroup-badge">3</span>
    <span class="fgroup-arrow">▾</span>
  </button>
  <div class="fgroup-body">
    <div class="fchip" data-value="UK">UK <span class="fchip-count">12</span></div>
    <div class="fchip on" data-value="US">US <span class="fchip-count">8</span></div>
    <div class="fchip dim" data-value="DE">DE <span class="fchip-count">0</span></div>
  </div>
</div>
```

CSS for snappy accordion (no slow drawer):
```css
.fgroup-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.fgroup[data-open] .fgroup-body {
  max-height: 200px; /* enough for typical chip row */
}
```

### Anti-Patterns to Avoid

- **Tweening `camera-controls` properties directly:** The GSAP proxy pattern is established — always tween a proxy object, apply to controls in `onUpdate`. Mixing direct tween + proxy produces double-application.
- **Calling `applyFilter()` on every chip click without debouncing:** In focused view, dimming 50+ stars on each keystroke of rapid chip clicking creates visible jank. Debounce at 16ms (one frame) or batch the state update.
- **Leaving staging sphere in scene after focus transition:** When `enterFocus("__staging__")` completes the T1 transition, the staging sphere mesh is "inside" the concentric orbit view. Decide: keep it as the central nucleus (it is the nucleus of this synthetic constellation) or hide it.
- **Computing cross-filter counts inline in DOM render:** Put `computeChipCounts()` in a separate pure function. The DOM update reads from its output. Mixing count logic with DOM mutation makes testing impossible.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Star position tweening | Custom lerp loop | `gsap.to(mesh.position, {...})` | GSAP handles concurrent tweens, kill-on-conflict, easing curves; hand-rolled lerps fight the tick loop |
| Ring geometry for staging sphere focus | New ring builder | `buildRingLine()` from `concentric.ts` | Already handles arbitrary plane normals, segment count, material setup |
| Ring dimension auto-selection | Entropy calculation | `autoSelectRingDimension(filteredCases, 'proofType')` from `concentric.ts` | Already handles exclusion, fallback, normalization |
| Orbital position computation | Manual trig | `ringPositionAt(ring, t)` from `concentric.ts` | Handles orbit plane orientation (orbitU/orbitV), out-object reuse |
| Filter state serialization | Custom format | Extend existing `FilterState` class | Already tracks country/service/year; just add proofType/impactBand fields |
| Accordion animation | GSAP timeline | CSS `max-height` transition | Single-property CSS transition is faster and GPU-composited; GSAP overkill for this |

**Key insight:** The entire orbital math, ring geometry, and camera transition pipeline already exists and is tested. Phase 5 primarily wires new UI state (FilterState extension + accordion) into existing scene primitives.

---

## Common Pitfalls

### Pitfall 1: GSAP Tween Conflict on Star Positions

**What goes wrong:** When a filter is applied, GSAP tweens stars toward the staging sphere. If the filter is changed mid-tween (chips clicked rapidly), new tweens stack on old ones. Star positions become undefined mid-animation.

**Why it happens:** `gsap.to(mesh.position, {...})` creates a new tween without canceling the previous one by default.

**How to avoid:** Call `gsap.killTweensOf(mesh.position)` before creating a new tween on that target. Established pattern in the codebase — `applyFilter()` should always kill-then-tween.

**Warning signs:** Stars "snapping" or oscillating during rapid chip interaction.

### Pitfall 2: Staging Sphere Lifecycle Leak

**What goes wrong:** Disposing the staging sphere removes it from `nucleusMeshes` and `nucleusOrbits`, but the `THREE.Mesh` geometry and material are not disposed. Over repeated filter/clear cycles, WebGL context accumulates orphaned GPU allocations.

**Why it happens:** Three.js does not auto-dispose geometries/materials when a mesh is removed from the scene.

**How to avoid:** `disposeStagingNucleus()` must call `mesh.geometry.dispose()` and `(mesh.material as THREE.MeshStandardMaterial).dispose()` before clearing the maps. Same pattern as `disposeRingLines()` in `concentric.ts`.

**Warning signs:** GPU memory climbing on repeated filter cycles; eventually `WebGL: CONTEXT_LOST_WEBGL`.

### Pitfall 3: isStagingTarget Flag Not Cleared on Focus

**What goes wrong:** When `enterFocus("__staging__")` triggers, stars that have `isStagingTarget = true` have their positions owned by GSAP (not the tick loop). Once the concentric orbit view is active, the tick loop should own all star positions again. If `isStagingTarget` is not cleared on transition, stars float at their staging-sphere positions instead of entering the concentric orbit.

**Why it happens:** The `isStagingTarget` flag was introduced to let GSAP own the star position during the staging animation. After T1 completes, ownership must be returned to the tick loop.

**How to avoid:** In the T1 `onComplete` callback (or TransitionChoreographer), clear `isStagingTarget` for all stars and kill their position tweens. The tick loop then picks them up normally.

**Warning signs:** Stars frozen at wrong positions after clicking the staging sphere to focus.

### Pitfall 4: Nucleus Expansion During FILT-06 Fights Camera Transition

**What goes wrong:** FILT-06 says other spheres push outward when staging sphere appears. If this push multiplier (1.1–1.2×) is applied via GSAP at the same moment the camera zooms toward staging, the nuclei that are "pushing out" will fight the camera's zoom-toward animation — the camera is moving toward them while they move away.

**Why it happens:** Two concurrent GSAP tweens on related objects with opposite directions.

**How to avoid:** Sequence the animations: (1) nuclei push out (300ms), then (2) camera zoom begins. Or use a smaller push multiplier so the effect is cosmetic rather than geometric. The zoom-toward staging can happen simultaneously with the push-out if the timing is short.

**Warning signs:** Camera overshooting or oscillating on filter application.

### Pitfall 5: Cross-Filter Count Triggers On Every Chip Toggle

**What goes wrong:** Cross-filter counts for all 5 dimensions × all their values are recomputed on every chip click. For ~200 cases × 5 dimensions × ~15 values each = ~15,000 comparisons per click. This is fast but couples the count logic to the click handler.

**Why it happens:** Inlining the count computation in the event handler.

**How to avoid:** `computeChipCounts()` is a pure function that takes `(allCases, currentFilter)` and returns a static result. Call it once per filter state change, cache the result, pass it to the DOM update separately. This also makes it trivially testable.

---

## Code Examples

### Extending FilterState.matchesFilter()
```typescript
// Source: src/data/filter.ts (extension of existing pattern)
matchesFilter(c: EnrichedCaseStudy): boolean {
  if (this.countries.size > 0 && !c.countries.some(co => this.countries.has(co))) return false;
  if (this.services.size > 0 && !this.services.has(c.service)) return false;
  if (this.years.size > 0 && !this.years.has(c.year)) return false;
  if (this.proofTypes.size > 0 && !this.proofTypes.has(c.proofType)) return false;
  if (this.impactBands.size > 0 && !this.impactBands.has(c.impactScale?.band ?? 'unknown')) return false;
  return true;
}
```

### Star State Precedence (focused view filter)
```typescript
// Source: pattern from existing star state logic in scene-state.ts
// Precedence: reading > selected > ghost > filterMatch > filterDim > idle
// filterDim = opacity 0.12, no removal from scene
function setStarFilterState(
  mesh: THREE.Mesh,
  matches: boolean,
  currentTopState: StarState,
): void {
  // Only apply filterDim if star is currently idle or filterDim
  if (currentTopState === 'idle' || currentTopState === 'filterDim') {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    gsap.killTweensOf(mat);
    gsap.to(mat, {
      opacity: matches ? 1.0 : 0.12,
      duration: 0.2,
      ease: 'power2.out',
    });
  }
}
```

### Accordion Toggle (JS side)
```typescript
// Source: new src/ui/filter-panel.ts
function toggleGroup(groupEl: HTMLElement): void {
  const isOpen = groupEl.hasAttribute('data-open');
  const header = groupEl.querySelector('.fgroup-header') as HTMLButtonElement;
  if (isOpen) {
    groupEl.removeAttribute('data-open');
    header.setAttribute('aria-expanded', 'false');
  } else {
    groupEl.setAttribute('data-open', '');
    header.setAttribute('aria-expanded', 'true');
  }
  // CSS max-height transition handles the animation — no GSAP needed
}
```

### Staging Sphere Color Recommendation
```typescript
// Coral/warm-magenta — distinct from teal (#5ecfc0) and gold (#e8b15a) already in design tokens
// Source: design token rationale — avoid teal (used for axis), avoid gold (nucleus labels/UI)
const STAGING_COLOR = 0xff6b6b;  // Coral — warm, distinct, readable on dark bg
// Alternative: 0xe056a0 (magenta) if coral reads too close to error state
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat chip layout in filter panel | Accordion sections per dimension | Phase 5 | Scales to 5 dimensions without overflow; dimension headers are scannable |
| `filterState.nucleusKeys` as only filter | Full 5-dimension filter (country, service, year, proofType, impactBand) | Phase 5 | Enables cross-dimension exploration |
| Single `applyFilter()` behavior | Bifurcated: global (staging sphere) vs. focused (dim in place) | Phase 5 | Correct semantic behavior per view mode |
| No staging sphere concept | Synthetic nucleus inserted into existing maps | Phase 5 | Zero new click-handling code; reuses entire T1 pipeline |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.0 + jsdom 29 |
| Config file | `vite.config.ts` (vitest config inline) |
| Quick run command | `npm test` (= `vitest run`) |
| Full suite command | `npm test` |
| Current baseline | 117 tests across 14 files, ~13s |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FILT-01 | FilterPanel renders accordion sections for all 5 dimensions | unit (DOM) | `npm test -- filter-panel` | ❌ Wave 0 |
| FILT-02 | matchesFilter() enforces AND between dims, OR within dim | unit | `npm test -- filter` | ✅ extend existing |
| FILT-03 | computeChipCounts() returns correct cross-filter counts | unit | `npm test -- filter-counts` | ❌ Wave 0 |
| FILT-04 | applyFilter() in global mode creates staging nucleus in maps | unit | `npm test -- scene-state` | ✅ extend existing |
| FILT-05 | staging nucleus key triggers same enterFocus path | integration | manual visual test | manual |
| FILT-06 | applyStagingPush() moves nuclei outward by 1.1–1.2× | unit | `npm test -- scene-state` | ✅ extend existing |
| FILT-07 | applyFilter() in focused mode sets filterDim state, not staging | unit | `npm test -- scene-state` | ✅ extend existing |
| FILT-08 | Filter status bar shows N / total, reset clears FilterState | unit (DOM) | `npm test -- filter-panel` | ❌ Wave 0 |
| FILT-09 | Clearing filter disposes staging sphere + removes from maps | unit | `npm test -- scene-state` | ✅ extend existing |
| FILT-10 | Orbit-by switcher in accordion changes sceneMode correctly | unit | `npm test -- filter-panel` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (full suite, ~13s)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** All 117 existing tests green + new tests for FILT-02/03/04/07/09 before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/tests/filter-counts.test.ts` — covers FILT-03 cross-filter count algorithm
- [ ] `src/tests/filter-panel.test.ts` — covers FILT-01 accordion DOM, FILT-08 status bar, FILT-10 orbit-by switcher
- [ ] Extend `src/tests/filter.test.ts` — add proofType/impactBand to matchesFilter tests (FILT-02)
- [ ] Extend `src/tests/scene-state.test.ts` — staging sphere lifecycle (FILT-04/06/07/09)

---

## Open Questions

1. **Staging sphere position in 3D space**
   - What we know: it should appear "between" the existing nuclei, visually central
   - What's unclear: exact algorithm — centroid of all nucleus positions? Center of bounding box? Fixed origin?
   - Recommendation: use centroid of `nucleusMeshes` positions at time of filter application; this is dynamic and always feels central regardless of current camera angle

2. **isStagingTarget transition timing during enterFocus**
   - What we know: T1 is managed by TransitionChoreographer; `onComplete` callback exists
   - What's unclear: exactly when to clear `isStagingTarget` — at T1 start (so tick loop pulls stars into orbit during camera move) or at T1 complete (so stars hold position until camera arrives)
   - Recommendation: clear at T1 complete; stars should be "locked" in their staging position during the camera zoom, then released into orbital motion

3. **Ring dimension for staging sphere focus**
   - What we know: `autoSelectRingDimension(filteredCases, master)` picks the dimension with highest entropy
   - What's unclear: what should `master` be for the staging sphere (there's no "master dimension" — it's a filter result)
   - Recommendation: pass `'country'` as the master dimension to exclude it as a fallback, letting `proofType` or `impactBand` be selected — these are more likely to be informationally dense for a filtered subset

---

## Sources

### Primary (HIGH confidence)
- `src/data/filter.ts` — FilterState, matchesFilter, isActive, getFilterableAttrs — read directly
- `src/data/enrich.ts` — EnrichedCaseStudy, ProofType, ImpactScaleBand types — read directly
- `src/scene/scene-state.ts` — applyFilter, focusSphere, buildOrbitalScene, SceneObjects — read directly
- `src/scene/orbitals/concentric.ts` — getDimensionValue, buildRingLine, disposeRingLines, autoSelectRingDimension — read directly
- `src/ui/filter-panel.ts` — current flat chip layout, existing HTML structure — read directly
- `src/style.css` — existing CSS tokens and filter-panel classes — read directly (two chunks)
- `src/main.ts` — enterFocus(), click handler priority, DOM mount points — read directly
- `package.json` — confirmed stack versions: three 0.170, gsap 3.12, camera-controls 3.1.2, vitest 2.0

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — FILT-01 through FILT-10 requirement definitions
- `.planning/STATE.md` — Phase 4 complete decisions, GSAP proxy pattern, MeshStandardMaterial specs
- `.planning/phases/05-filter-panel-staging-sphere/05-CONTEXT.md` — locked decisions and discretion areas

### Tertiary (LOW confidence)
- None — all findings derived from direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json and direct source reads
- Architecture patterns: HIGH — derived from reading the exact source files they extend
- Pitfalls: HIGH — identified from reading applyFilter(), GSAP usage, and Three.js disposal patterns in the existing codebase
- Cross-filter count algorithm: HIGH — standard cross-filter pattern, no external library needed

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (stable stack; GSAP/Three.js APIs unlikely to change at patch level)
