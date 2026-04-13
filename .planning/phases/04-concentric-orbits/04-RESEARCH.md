# Phase 4: Concentric Orbit Layout + Expansion — Research

**Researched:** 2026-04-13
**Domain:** Three.js orbital geometry, ring layout algorithms, dimension-based auto-selection, GSAP expansion choreography
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORB-01 | `computeConcentricOrbits(cases, masterDimension)` — distributes cases across concentric rings, each ring = one value of the auto-selected subdivision dimension | Ring layout math section; entropy-based selection algorithm |
| ORB-02 | Auto-dimension selection — picks the remaining dimension with most even distribution across ring values | Empirical entropy scores from real data; recommended algorithm |
| ORB-03 | Ring-dimension switcher — user can override the auto-selected subdivision dimension in focused view | Pattern 7: Ring-Dimension Switcher (ORB-03) |
| ORB-04 | Visible orbit lines — THREE.Line or similar for each concentric ring; clickable to highlight all cases | THREE.LineLoop API; raycaster threshold for lines |
| ORB-05 | Smooth orbital rotation — cases rotate along their ring at slow constant speed | New focused-mode tick model; decoupled from existing Rodrigues drift |
| ORB-06 | Space expansion on focus — other dimension-spheres scale outward (orbital radii multiply) during T1 | Expansion scope decision; GSAP integration with T1 choreographer |
| ORB-07 | Space contraction on unfocus — spheres contract back during T5 to original positions | Contraction mirrors expansion; homePos stored at build time |
| ORB-08 | Ring count adapts to case count — min 1 ring, max ~8 rings; single-value dimensions collapse to one ring | Clamping algorithm; degenerate cases |
</phase_requirements>

---

## Summary

Phase 4 replaces the focused view's flat golden-spiral disk (currently built by `computeStagingPositions`) with concentric circular rings, each ring representing one value of a chosen sub-dimension. Every case on a ring rotates slowly along it in the tick loop. The ring-dimension is auto-selected by maximizing distribution evenness, and the user can override via a switcher. Ring lines are drawn with `THREE.LineLoop` and made raycastable. Entering focus expands all non-focused nuclei (and their stars and halos) outward past the viewport edge; exiting contracts them back.

The dominant architectural change is a **full replacement of the focused-mode motion model**: the existing Rodrigues sphere-drift is only used in global view. In focused view, stars need a completely different representation — a ring index, an angular offset on that ring, a ring radius, and a constant angular speed. This is not a modification of `StarOrbit`; it requires a new data type and a new tick path.

**Primary recommendation:** Create `src/scene/orbitals/concentric.ts` for all ring math (pure functions, testable), add a `ringOrbit` field to star `userData` in focused mode, and branch the tick loop: if `mode === 'focused' && star.userData.ringOrbit` exists, use ring rotation; otherwise use existing Rodrigues drift. The expansion and contraction (ORB-06/07) live entirely in an updated `focusSphere`/`unfocusSphere` in `scene-state.ts`, replacing the current opacity-only dissolve.

---

## Critical Architecture Conflict: CAM-03 vs ORB-06

**This must be resolved before writing plans.**

The currently-implemented `focusSphere` (lines 258-270 of `scene-state.ts`) dissolves other nuclei via opacity only (`opacity: 0`). CAM-03 defined this as "dissolve, not fly away." ORB-06 replaces this with spatial expansion: nuclei physically move outward past the viewport edge.

**Resolution:** ORB-06 supersedes CAM-03's dissolve behavior. The additional context says "dramatic, not subtle" and "leave the screen." The expansion IS the visual exit — no separate opacity fade needed. The fade in CAM-03 was a placeholder pending Phase 4. The `focusSphere` function replaces opacity tweens on other nuclei with position tweens that multiply the orbital radius.

**Scope of expansion:** Expand nucleus mesh + halo + that nucleus's stars together. Stars of non-focused nuclei should move with their nucleus (offset preserved), not scatter independently. This keeps the "sphere moving away" metaphor coherent. Total GSAP tweens per nucleus: 1 (nucleus position) + 1 (halo position) + N (stars), where N = number of stars. For 6 nuclei with ~15 stars each, that is 6 × (2 + 15) = 102 tweens launched at once — well within GSAP's capacity.

**Store original positions at build time:** Each nucleus's canonical global-mode position must be stored once, when the scene is built, as `mesh.userData.homePos`. Contraction always targets `homePos`. Do NOT store `preExpansionPos` at focus time — if focus is triggered before a prior contraction completes, `preExpansionPos` would capture a mid-animation position and drift would accumulate across cycles.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | ^0.170.0 | 3D rendering, ring geometry, raycasting | Already in use |
| gsap | ^3.12.0 | Expansion/contraction tweens | Already wired for all transitions |
| camera-controls | ^3.1.2 | Camera transitions (T1/T5) | Already wired in Phase 3 |
| vitest | ^2.0.0 | Unit tests for ring math | Already in use |

### No new dependencies needed
All Phase 4 work is pure algorithmic code (ring math) and Three.js geometry creation with existing stack.

---

## Architecture Patterns

### Recommended Module Layout

```
src/scene/orbitals/
├── concentric.ts       # NEW: ring math — computeConcentricOrbits, ringPositionAt, autoSelectDimension
├── concentric.test.ts  # NEW: unit tests for pure functions
├── staging.ts          # UNCHANGED: still used for filter staging in global view
├── star-orbit.ts       # UNCHANGED: still used in global view (Rodrigues drift)
└── nucleus-orbit.ts    # UNCHANGED
```

The ring-dimension auto-selection is a data concern, co-located in `concentric.ts` rather than `src/data/`, because it directly drives geometry computation (ring count) and belongs alongside the functions that consume its output.

### New Data Type: `RingOrbit`

```typescript
// src/scene/orbitals/concentric.ts
export interface RingOrbit {
  caseStudy: EnrichedCaseStudy;
  nucleusKey: string;
  ringIndex: number;        // which concentric ring (0 = innermost)
  ringRadius: number;       // world-space radius of this ring
  ringValue: string;        // dimension value that defines this ring (e.g. "Europe")
  angleOffset: number;      // starting angle on the ring (radians), deterministic from hash
  angularSpeed: number;     // radians per millisecond tick, slow constant (e.g. 0.00004)
  orbitCenter: Vec3;        // nucleus world position (updated each tick)
  orbitU: Vec3;             // orbital plane basis vector U (from NucleusOrbitData)
  orbitV: Vec3;             // orbital plane basis vector V (from NucleusOrbitData)
}
```

`RingOrbit` carries `orbitU` and `orbitV` from the parent `NucleusOrbitData` so that `ringPositionAt` can compute positions on the correct tilted orbital plane. Orbital planes are tilted up to ~20 degrees (z component ±0.35); using hardcoded XY would place ring stars on the wrong plane while ring lines (which use a quaternion from `orbitU × orbitV`) are on the correct plane.

`RingOrbit` is stored in `star.userData.ringOrbit` during focused mode. The existing `star.userData.starOrbit` (Rodrigues) remains untouched — the tick loop branches on `objects.mode`.

### Pattern 1: Concentric Ring Layout

```typescript
// src/scene/orbitals/concentric.ts

export interface ConcentricOrbitResult {
  rings: Map<string, RingOrbit[]>;  // ringValue → stars on that ring
  ringRadii: Map<string, number>;   // ringValue → world-space radius
  ringOrder: string[];              // ordered by case count descending (outermost = most cases)
}

export function computeConcentricOrbits(
  cases: EnrichedCaseStudy[],
  dimension: RingDimension,
  nucleusOrbit: NucleusOrbitData,  // carries orbitU, orbitV for plane orientation
  baseRadius: number,   // inner ring radius
  ringSpacing: number,  // gap between consecutive rings
): ConcentricOrbitResult {
  // 1. Group cases by dimension value
  // 2. Sort groups descending by case count → outermost ring has most cases
  // 3. Assign ring index 0..k-1 (inner to outer)
  // 4. Assign ring radius = baseRadius + ringIndex * ringSpacing
  // 5. Evenly distribute cases on each ring with angle offset from hash(case.id)
  // 6. Populate RingOrbit.orbitU and .orbitV from nucleusOrbit
  // 7. Return RingOrbit[] for each case
}
```

**Note:** The signature takes `NucleusOrbitData` (not just `nucleusCenter: Vec3`) so that `orbitU` and `orbitV` are available for populating `RingOrbit`. This is the only source of those vectors.

**Radius sizing guidance from real data:**
- Largest nucleus (Media) has 50 cases. At 8 rings max, ring spacing of ~25 world units, base radius ~50 → outermost ring at ~225. Camera is at VIEW_DISTANCE=200 from nucleus, so rings fill most of the visible cone. Tune empirically.
- Spacing formula: `baseRadius = 40`, `ringSpacing = Math.max(20, (starRMax - 40) / ringCount)`

### Pattern 2: Ring Position Calculation (per-frame)

```typescript
// In concentric.ts — replaces starPositionAt for focused mode
export function ringPositionAt(
  ring: RingOrbit,
  t: number,
  out?: Vec3,
): Vec3 {
  const angle = ring.angleOffset + t * ring.angularSpeed;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const r = ring.ringRadius;
  const o = out ?? { x: 0, y: 0, z: 0 };
  // Same formula as nucleusPositionAt — orbit on the tilted orbital plane
  o.x = ring.orbitCenter.x + r * (ring.orbitU.x * cos + ring.orbitV.x * sin);
  o.y = ring.orbitCenter.y + r * (ring.orbitU.y * cos + ring.orbitV.y * sin);
  o.z = ring.orbitCenter.z + r * (ring.orbitU.z * cos + ring.orbitV.z * sin);
  return o;
}
```

This mirrors `nucleusPositionAt` exactly (see `src/scene/orbitals/nucleus-orbit.ts` line 76-81), but at the star level. The camera faces the orbital plane at T1 (oriented to `orbitU × orbitV`), so ring positions computed in the orbital plane will appear as circles from the camera's perspective.

**Why not hardcode XY:** Nucleus orbital planes are tilted up to ~20 degrees. If `ringPositionAt` computes in XY but `buildRingLine` uses `Quaternion.setFromUnitVectors(Z, planeNormal)` (correct), ring stars appear on the wrong plane — they will not lie on the visible ring lines.

### Pattern 3: Tick Loop Branch

The existing `tickOrbits` function adds a branch at the star update section:

```typescript
// In scene-state.ts tickOrbits — add after existing star loop condition
for (const star of starMeshes) {
  if (star.userData.isStagingTarget) continue;
  const ringOrbit = star.userData.ringOrbit as RingOrbit | undefined;
  if (objects.mode === 'focused' && ringOrbit) {
    // Ring rotation: flat circular orbit on the nucleus orbital plane
    const pos = ringPositionAt(ringOrbit, prefersReduced ? 0 : t, _starPosScratch);
    _tickScratch.set(pos.x, pos.y, pos.z);
    star.position.lerp(_tickScratch, 0.08); // slightly snappier lerp for ring coherence
  } else {
    // Global view: existing Rodrigues drift
    const pos = starPositionAt(orbit, prefersReduced ? 0 : t, _starPosScratch);
    _tickScratch.set(pos.x, pos.y, pos.z);
    star.position.lerp(_tickScratch, 0.055);
  }
  // Opacity: unchanged
}
```

**The `isStagingTarget` flag does not need to be set for ring-orbiting stars** because ring motion is tick-driven (not GSAP). It is only set for filter-staging (applyFilter) and during expansion of non-focused nuclei. This is a clean separation.

### Pattern 4: THREE.LineLoop for Visible Ring Lines (ORB-04)

```typescript
// Creating a visible ring line in Three.js r170
function buildRingLine(
  radius: number,
  center: THREE.Vector3,
  planeNormal: THREE.Vector3,  // face-on direction = orbitU × orbitV
  color: number,
): THREE.LineLoop {
  const segments = 128;
  const pts: THREE.Vector3[] = [];
  // Build in local XY frame, rotate to match the orbital plane
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    planeNormal.clone().normalize()
  );
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const local = new THREE.Vector3(radius * Math.cos(a), radius * Math.sin(a), 0);
    pts.push(local.applyQuaternion(q).add(center));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  return new THREE.LineLoop(geo, mat);
}
```

`planeNormal` is computed as `new THREE.Vector3(orbitU.x, orbitU.y, orbitU.z).cross(new THREE.Vector3(orbitV.x, orbitV.y, orbitV.z))` — same vectors already in `NucleusOrbitData`. This ensures ring lines lie exactly on the orbital plane that the camera faces during T1.

Ring lines are created when entering focused mode and disposed when exiting. Store them in `SceneObjects` as `ringLineMeshes: THREE.LineLoop[]` (new field, cleared on unfocus).

**Raycasting for ring click (ORB-04 — click ring → highlight):** `Raycaster.intersectObjects([...ringLineMeshes])` returns hits with the default `threshold` of ~1 pixel, which is too small for a thin line. Set `raycaster.params.Line.threshold = 3` for reliable ring click detection.

```typescript
// In main.ts, set once after raycaster creation:
raycaster.params.Line = { threshold: 3 };
```

Ring click stores the highlighted `ringValue` in `SceneObjects` (new field `highlightedRingValue: string | null`). The tick loop applies highlighted opacity to stars: matching ring stars get opacity 1.0, others get opacity 0.2.

### Pattern 5: Expansion / Contraction (ORB-06/07)

**Key invariant:** Each nucleus mesh has `mesh.userData.homePos: THREE.Vector3` stored at **scene build time** (in `buildOrbitalScene`), before any transitions. Contraction always targets `homePos`, never a position captured at focus time.

```typescript
// At scene build time in buildOrbitalScene — add alongside mesh creation:
nucleusMesh.userData.homePos = nucleusMesh.position.clone();

// Expansion during T1 — replaces the opacity-dissolve in focusSphere
const EXPANSION_MULTIPLIER = 4.5; // tune so nuclei leave the viewport

function expandNonFocusedNuclei(objects: SceneObjects, focusedKey: string): void {
  for (const [k, mesh] of objects.nucleusMeshes.entries()) {
    if (k === focusedKey) continue;

    // homePos is the canonical build-time position — always use this as the expansion origin
    const home = mesh.userData.homePos as THREE.Vector3;
    const expandedPos = home.clone().multiplyScalar(EXPANSION_MULTIPLIER);

    // Move nucleus
    gsap.to(mesh.position, { x: expandedPos.x, y: expandedPos.y, z: expandedPos.z,
      duration: 1.0, ease: 'power2.inOut' });

    // Move halo with it
    if (mesh.userData.halo) {
      gsap.to((mesh.userData.halo as THREE.Mesh).position,
        { x: expandedPos.x, y: expandedPos.y, z: expandedPos.z, duration: 1.0, ease: 'power2.inOut' });
    }

    // Move stars: preserve offset from nucleus home position
    for (const star of objects.starMeshes) {
      if ((star.userData.starOrbit as StarOrbit)?.nucleusKey !== k) continue;
      star.userData.isStagingTarget = true; // prevent tick loop from fighting GSAP
      const offset = star.position.clone().sub(home);
      const newStarPos = expandedPos.clone().add(offset);
      gsap.to(star.position, { x: newStarPos.x, y: newStarPos.y, z: newStarPos.z,
        duration: 1.0, ease: 'power2.inOut' });
    }
  }
}

function contractNonFocusedNuclei(objects: SceneObjects): void {
  for (const [k, mesh] of objects.nucleusMeshes.entries()) {
    if (k === objects.focusedKey) continue;
    const home = mesh.userData.homePos as THREE.Vector3;
    if (!home) continue;

    gsap.to(mesh.position, { x: home.x, y: home.y, z: home.z,
      duration: 1.4, ease: 'power2.inOut' });
    if (mesh.userData.halo) {
      gsap.to((mesh.userData.halo as THREE.Mesh).position,
        { x: home.x, y: home.y, z: home.z, duration: 1.4, ease: 'power2.inOut' });
    }
    // Stars of contracted nuclei return to Rodrigues-driven positions via the tick loop
    // — just clear isStagingTarget and let orbit math take over
    for (const star of objects.starMeshes) {
      if ((star.userData.starOrbit as StarOrbit)?.nucleusKey !== k) continue;
      star.userData.isStagingTarget = false;
      star.userData.ringOrbit = undefined;
    }
  }
}
```

**Why `homePos` over `preExpansionPos`:** Storing at focus time means a rapid focus→unfocus→focus cycle (or arrow-key constellation cycling) would capture a mid-animation position. `homePos` is set once at build time and never changes. Contraction is idempotent regardless of how many focus/unfocus cycles have occurred.

**T5 timing:** Contraction runs at 1.4s (matching T5's camera duration per CAM-02 / POL-02's 20% slower return rule). Expansion runs at 1.0s (T1 is 1.2s — start slightly earlier so spheres clear the frame as the camera arrives).

### Pattern 6: Auto-Dimension Selection (ORB-02)

**Algorithm:** For a given set of enriched cases, score each candidate dimension by normalized entropy:

```typescript
// src/scene/orbitals/concentric.ts
export type RingDimension = 'country' | 'region' | 'year' | 'proofType' | 'impactBand';

function entropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  return -counts.reduce((sum, n) => {
    const p = n / total;
    return sum + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
}

export function autoSelectRingDimension(
  cases: EnrichedCaseStudy[],
  masterDimension: GroupMode, // 'vertical' | 'country' | 'region'
): RingDimension {
  // Candidate dimensions (exclude the master grouping dimension)
  const candidates: RingDimension[] = ['country', 'region', 'year', 'proofType', 'impactBand'];
  if (masterDimension === 'country') {
    // If already grouped by country, exclude country and region from sub-dimensions
    return scoreAndSelect(cases, candidates.filter(d => d !== 'country' && d !== 'region'));
  }
  if (masterDimension === 'region') {
    return scoreAndSelect(cases, candidates.filter(d => d !== 'region'));
  }
  return scoreAndSelect(cases, candidates);
}

function scoreAndSelect(cases: EnrichedCaseStudy[], candidates: RingDimension[]): RingDimension {
  let bestDim: RingDimension = 'proofType';
  let bestScore = -1;

  for (const dim of candidates) {
    const groups = groupByConcentric(cases, dim);
    const k = Object.keys(groups).length;
    if (k < 2 || k > 8) continue; // skip degenerate or too-many-rings dimensions
    const counts = Object.values(groups).map(arr => arr.length);
    const e = entropy(counts);
    const score = e / Math.log2(k); // normalized: 1.0 = perfectly even
    if (score > bestScore) { bestScore = score; bestDim = dim; }
  }
  return bestDim;
}
```

**Empirical scores from real data (vertical master grouping):**

| Vertical | Best Auto-Dim | Score | Rings (k) | Notes |
|----------|--------------|-------|-----------|-------|
| Media (50) | proofType | 0.930 | 5 | Near-even across all 5 proof types |
| Performance (33) | impactBand | 0.780 | 5 | All bands represented; year is 0.797 but has only k=3 |
| Commerce (25) | impactBand | 0.957 | 4 | Very even 4-way split |
| Strategy (3) | year | N/A | 1 | Collapses to 1 ring |
| Data&Intel (2) | year | N/A | 1 | Collapses to 1 ring |

**Degenerate case handling (ORB-08):** If all candidates produce k=1 (every case has the same value), use `proofType` as fallback and collapse all into one ring. If k > 8, skip that dimension.

### Pattern 7: Ring-Dimension Switcher (ORB-03)

**What it is:** A set of `<button>` chips rendered inside `elControls` (the `.cosmo-controls` panel that becomes visible in constellation mode). Each button represents one `RingDimension`. The currently active dimension is highlighted. Clicking a different dimension triggers a full ring recompute and a smooth transition of stars to their new ring positions.

**DOM location:** Inside `#cosmoControls`, which already has `classList.add('on')` during `enterFocus`. Add a `<div id="ring-switcher">` with one button per dimension.

**Switch sequence (four steps):**
1. **Dispose old ring lines:** Call `disposeRingLines(objects, scene)` — remove `THREE.LineLoop` objects from scene, call `geometry.dispose()` + `material.dispose()` on each, clear `objects.ringLineMeshes = []`.
2. **Recompute orbits:** Call `computeConcentricOrbits(focusedCases, newDimension, nucleusOrbit, config)` to get new `RingOrbit[]`. Update `star.userData.ringOrbit` for each star in the focused nucleus.
3. **Create new ring lines:** Call `buildRingLine(...)` for each new ring value; add to scene; populate `objects.ringLineMeshes`.
4. **GSAP transition:** Stars are currently at their old ring positions. The tick loop will lerp them to new ring positions automatically (lerp factor 0.08 ≈ 8% per frame ≈ smooth ~50-frame glide). No explicit GSAP tweens needed for the star repositioning — the tick loop's existing lerp handles it.

**State to persist during switch:** `objects.currentRingDimension` (updated to `newDimension`). The switcher button states read from this field on render.

**Integration point in main.ts:**
```typescript
// In enterFocus — after ring orbits are computed, wire up switcher
const switcherEl = document.getElementById('ring-switcher');
if (switcherEl) {
  switcherEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-dim]');
    if (!btn) return;
    const newDim = btn.getAttribute('data-dim') as RingDimension;
    if (newDim === objects.currentRingDimension) return; // no-op
    switchRingDimension(objects, scene, newDim, nucleusOrbit);
    // Update button active state
    switcherEl.querySelectorAll('[data-dim]').forEach(b => b.classList.toggle('active', b === btn));
  });
}
```

**Cleanup:** On `unfocusSphere`, remove the switcher event listeners (use `AbortController` or replace the node) and reset `objects.currentRingDimension = null`.

### Anti-Patterns to Avoid

- **Reusing `computeStagingPositions` for ring layout.** The golden-spiral disk is center-packed with no ring identity. Concentric rings need cases sorted by their ring assignment, with ring radius driving position — fundamentally different math.
- **Applying Rodrigues drift to ring-orbiting stars.** In focused mode, ring coherence requires all stars on a ring to stay at the same radius. Rodrigues would drift them off-ring.
- **Creating LineLoop geometry in the tick loop.** Ring lines are static geometry (the ring doesn't move as stars rotate along it). Create once on `focusSphere`, dispose on `unfocusSphere`.
- **Hardcoding XY in `ringPositionAt`.** Orbital planes are tilted up to ~20 degrees. Stars computed in XY will visually float off the ring lines (which are correctly plane-oriented via quaternion). Always use `orbitU`/`orbitV` from the nucleus orbit data.
- **Storing expansion origin at focus time (`preExpansionPos`).** Rapid cycling causes drift. Store `homePos` once at build time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth camera transition during expansion | Custom RAF lerp | GSAP to proxy + TransitionChoreographer.startT1 | TransitionChoreographer already handles T1/T5 locking and cleanup |
| Circle geometry for ring lines | Custom vertex math | `THREE.BufferGeometry().setFromPoints(points)` | Standard Three.js pattern; no custom geometry needed |
| Raycasting for ring clicks | Custom distance-to-circle math | `raycaster.intersectObjects(ringLineMeshes)` with `params.Line.threshold` | Raycaster handles this natively |
| Entropy calculation for auto-selection | External statistics library | Pure JS `Math.log2` | Two-line function, no dependency justified |
| Star animation to new ring on switcher | Explicit GSAP tweens | Existing tick loop lerp (0.08 factor) | Stars smoothly glide to new ring positions automatically |

---

## Common Pitfalls

### Pitfall 1: Ring Lines Not Visible at Camera Distance

**What goes wrong:** `LineBasicMaterial` lines with low opacity look invisible when the camera is at VIEW_DISTANCE=200 from the nucleus, especially if ring geometry is created in world space but not accounting for the face-on camera angle.
**Why it happens:** Ring lines are created flat in the XY plane relative to nucleus center. If the orbital plane normal doesn't align with the camera's view direction (it's computed dynamically in `enterFocus` from `orbitU × orbitV`), the rings appear as ellipses or lines rather than circles.
**How to avoid:** Create ring geometry in local space relative to the nucleus, then use `mesh.position.copy(nucleusPosition)`. The ring plane should be perpendicular to the face-on direction (`orbitU × orbitV`), not hardcoded to XY. Use `Object3D.lookAt(faceOnDirection)` or orient the ring plane using the same basis vectors used to compute the face-on camera position.
**Warning signs:** Rings appear as lines or thin ellipses in the focused view.

### Pitfall 2: Expansion Leaves Stars Behind

**What goes wrong:** Non-focused nucleus meshes expand outward but their stars remain at their old positions, creating a visual disconnect where stars float free as the nucleus flies away.
**Why it happens:** `focusSphere` currently only moves `nucleus.position` for the focused nucleus (leaving others to tick). When expansion moves non-focused nuclei via GSAP, their `starOrbit.orbitCenter` references (which the tick loop uses) are not updated.
**How to avoid:** During expansion, also set `isStagingTarget = true` on stars of non-focused nuclei so the tick loop doesn't fight GSAP. After expansion completes (GSAP `onComplete`), leave them as staging targets — they're off-screen. On contraction (`unfocusSphere`), clear the flag so tick takes over again.
**Warning signs:** Stars from non-focused nuclei hover in a cluster at their pre-expansion positions while the nucleus has moved.

### Pitfall 3: Arrow-Key Cycling Between Constellations Misses Ring Cleanup

**What goes wrong:** When the user presses ArrowLeft/ArrowRight in focused mode, `enterFocus(nextKey)` is called on an already-focused state. The current implementation doesn't clean up ring lines, `ringOrbit` data, or expansion state from the previous focus.
**Why it happens:** `enterFocus` in main.ts calls `exitFocus`-then-`enterFocus` via ViewState dispatch, but the ring teardown needs explicit cleanup that's not in the current exit flow.
**How to avoid:** `unfocusSphere` must dispose and clear `objects.ringLineMeshes` and clear `ringOrbit` from all star userData before `focusSphere` assigns new ring orbits.
**Warning signs:** Ring lines accumulate — after cycling through 3 constellations, you see 3 overlapping sets of rings.

### Pitfall 4: `homePos` Not Stored at Build Time

**What goes wrong:** Storing the expansion origin at focus time (e.g., `preExpansionPos = mesh.position.clone()`) means rapid focus→unfocus→focus cycles capture a mid-animation position. After N cycles, nuclei end up slightly displaced from their true orbital positions.
**Why it happens:** GSAP tween to `homePos` may not have fully completed when the next focus is triggered. Position captured is partially-contracted, not the true home.
**How to avoid:** Store `mesh.userData.homePos = mesh.position.clone()` exactly once in `buildOrbitalScene`, right after the mesh is positioned. Contraction always targets `homePos`. Expansion origin is `homePos`. The expansion multiplier is always applied to `homePos`, not current position.
**Warning signs:** After multiple focus/unfocus cycles, non-focused nuclei end up slightly closer or farther from their true orbital positions; the error is cumulative.

### Pitfall 5: Ring Raycasting Misses Near-Miss Clicks

**What goes wrong:** User clicks near a ring line but the click doesn't register.
**Why it happens:** Default `raycaster.params.Line.threshold` is 1 (world units), which at typical ring radii of 40-200 translates to very small hit areas.
**How to avoid:** Set `raycaster.params.Line = { threshold: 3 }` immediately after raycaster creation. This is a one-line change in main.ts.

### Pitfall 6: `ringPositionAt` Star Plane Diverges from Ring Line Plane

**What goes wrong:** Stars appear to orbit correctly but float visibly off the ring line circles. Clicking a ring doesn't feel like clicking the star track.
**Why it happens:** `ringPositionAt` was implemented with hardcoded XY (`o.z = ring.orbitCenter.z`), while `buildRingLine` correctly uses `Quaternion.setFromUnitVectors(Z, orbitU × orbitV)`. The two geometries live on different planes.
**How to avoid:** `ringPositionAt` must use the same formula as `nucleusPositionAt`: `center + r*(cos(a)*orbitU + sin(a)*orbitV)`. The `RingOrbit` type carries `orbitU` and `orbitV` for exactly this purpose.
**Warning signs:** Stars orbit on slightly tilted circles relative to the ring line circles; the visual mismatch grows with the nucleus's orbital tilt angle.

---

## Code Examples

### Full `computeConcentricOrbits` Signature

```typescript
// src/scene/orbitals/concentric.ts

export interface RingOrbit {
  caseStudy: EnrichedCaseStudy;
  nucleusKey: string;
  ringIndex: number;
  ringRadius: number;
  ringValue: string;
  angleOffset: number;    // starting angle (radians)
  angularSpeed: number;   // rad/ms, constant per ring (all cases on a ring rotate together)
  orbitCenter: Vec3;      // updated each tick to follow the nucleus
  orbitU: Vec3;           // orbital plane basis vector (from NucleusOrbitData)
  orbitV: Vec3;           // orbital plane basis vector (from NucleusOrbitData)
}

export interface ConcentricConfig {
  baseRadius: number;     // inner ring world-space radius
  ringSpacing: number;    // gap between rings
  angularSpeedBase: number; // radians per millisecond for innermost ring (outer = slightly slower)
}

export function computeConcentricOrbits(
  cases: EnrichedCaseStudy[],
  dimension: RingDimension,
  nucleusOrbit: NucleusOrbitData,  // source of orbitU, orbitV, and center
  config: ConcentricConfig,
): RingOrbit[] {
  // group by dimension value
  // sort groups by count desc (outer = most)
  // assign ring radii, evenly space angles within each ring
  // populate orbitU/orbitV from nucleusOrbit on each RingOrbit
  // return flat array of RingOrbit (one per case)
}
```

### THREE.LineLoop Creation Pattern (verified Three.js r170)

```typescript
import * as THREE from 'three';

function buildRingLine(
  radius: number,
  center: THREE.Vector3,
  planeNormal: THREE.Vector3,  // = new THREE.Vector3(orbitU.x, orbitU.y, orbitU.z).cross(...)
  color: number,
): THREE.LineLoop {
  const segments = 128;
  const pts: THREE.Vector3[] = [];
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    planeNormal.clone().normalize()
  );
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const local = new THREE.Vector3(radius * Math.cos(a), radius * Math.sin(a), 0);
    pts.push(local.applyQuaternion(q).add(center));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false });
  return new THREE.LineLoop(geo, mat);
}
```

### SceneObjects Fields to Add

```typescript
// In scene-state.ts — additions to SceneObjects interface
export interface SceneObjects {
  // ... existing fields ...
  ringLineMeshes: THREE.LineLoop[];          // created on focusSphere, disposed on unfocusSphere
  highlightedRingValue: string | null;       // which ring is highlighted (click ring → set)
  currentRingDimension: RingDimension | null; // auto-selected or user-overridden
}
```

### `homePos` Storage at Build Time

```typescript
// In buildOrbitalScene, right after nucleus mesh is positioned:
nucleusMesh.userData.homePos = nucleusMesh.position.clone();
// Never overwrite homePos after this point.
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 4 |
|--------------|-----------------|-------------------|
| `computeStagingPositions` (golden spiral flat disk) | `computeConcentricOrbits` (concentric rings) | Full replacement in focused mode |
| Rodrigues drift on sphere surface | Flat ring rotation (constant angular speed on orbital plane) | New motion model; Rodrigues still used in global view |
| Opacity dissolve for non-focused nuclei (CAM-03) | Position expansion outward past viewport | More dramatic transition; changes what focusSphere does |
| `THREE.LineSegments` (legacy) | `THREE.LineLoop` + `BufferGeometry.setFromPoints()` | Cleaner ring primitive; standard Three.js r140+ pattern |

---

## Data Layer Findings

### Dimension Distribution in Real Data

For the three major verticals (vertical master grouping):

| Vertical | Cases | Best Auto-Dim | Score | k (rings) | Notes |
|----------|-------|--------------|-------|-----------|-------|
| Media | 50 | proofType | 0.930 | 5 | Near-perfectly even; all 5 proof types represented |
| Performance | 33 | impactBand | 0.780 | 5 | Year (0.797/k=3) is close second; impactBand has more rings |
| Commerce | 25 | impactBand | 0.957 | 4 | Only 4 bands present (no 'unknown'); most even split |
| Strategy | 3 | any | — | 1 | Collapse to single ring; too few cases |
| Data&Intel | 2 | any | — | 1 | Collapse to single ring |

`country` consistently scores poorly (Spain dominance: 24/33, 31/50, 22/25). `region` also skews toward Europe. The enriched dimensions (`proofType`, `impactBand`) produce the most evenly-distributed rings in this dataset.

**Consequence:** For the current dataset, auto-selection will almost always pick `proofType` or `impactBand`. The switcher (ORB-03) lets users override to `region`, `year`, or `country` if they want geographic or temporal grouping.

### Ring Count Limits (ORB-08)

- Min 1 ring: if all cases in a nucleus have the same dimension value
- Max 8 rings: skip any dimension that would produce > 8 distinct values (no current dimension does — max is 5)
- Outer ring = most cases (sorting by count descending)

---

## Open Questions

1. **Ring angular speed: same per ring or gradient?**
   - What we know: "slow constant speed" (ORB-05). All stars on a ring should rotate at the same speed (maintaining ring integrity).
   - What's unclear: Should outer rings rotate slower than inner ones (realistic orbital mechanics) or all at the same speed?
   - Recommendation: Outer rings slightly slower (`angularSpeed = BASE_SPEED / ringIndex^0.5`). Looks more physical and prevents outer-ring stars from lapping inner-ring stars. Cosmetic only — set BASE_SPEED = 0.00003 rad/ms.

2. **Ring line color: nucleus color, ring-value-coded, or uniform teal?**
   - What we know: The existing design uses nucleus accent colors for stars. The additional context doesn't specify ring line color.
   - What's unclear: Whether rings should be colored by their ring value (e.g. distinct color per proofType ring) or match the nucleus accent.
   - Recommendation: Use nucleus accent color at low opacity (0.25-0.35) for all rings in a nucleus. Ring value color-coding adds visual complexity before users understand the grouping. Keep it simple; the switcher label already communicates the dimension.

3. **`isStagingTarget` for expansion stars vs. letting tick fight GSAP**
   - What we know: Current pattern sets the flag to prevent tick from fighting GSAP on staged stars.
   - What's unclear: During expansion, both GSAP (moving stars off-screen) and the tick loop (trying to move stars to their Rodrigues positions) would fight. But the tick loop skips stars where `isStagingTarget` is set.
   - Recommendation: Set `isStagingTarget = true` on all non-focused stars during expansion. This fully delegates position to GSAP during the expansion tween. On contraction, clear the flag so the tick loop smoothly lerps them back to their Rodrigues positions.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vite.config.ts` (test environment: 'node') |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORB-01 | `computeConcentricOrbits` assigns each case to exactly one ring | unit | `npm test -- --reporter=verbose src/scene/orbitals/concentric.test.ts` | ❌ Wave 0 |
| ORB-01 | Outer ring has most cases | unit | same | ❌ Wave 0 |
| ORB-01 | Ring radii increase with index | unit | same | ❌ Wave 0 |
| ORB-01 | `RingOrbit` carries `orbitU`/`orbitV` matching source `NucleusOrbitData` | unit | same | ❌ Wave 0 |
| ORB-02 | `autoSelectRingDimension` returns highest-scoring dimension | unit | `npm test -- --reporter=verbose src/scene/orbitals/concentric.test.ts` | ❌ Wave 0 |
| ORB-02 | Score is entropy-normalized; picks proofType for Media data | unit | same | ❌ Wave 0 |
| ORB-03 | Switcher changes active dimension and re-computes rings | integration | manual visual verify | manual-only — requires DOM |
| ORB-03 | Old ring lines disposed before new ones created (no accumulation) | integration | manual visual verify | manual-only — requires Three.js scene |
| ORB-04 | Ring lines created in `focusSphere`, disposed in `unfocusSphere` | integration | manual visual verify | manual-only — requires Three.js scene |
| ORB-05 | `ringPositionAt` returns positions on a circle of the correct radius | unit | `npm test -- --reporter=verbose src/scene/orbitals/concentric.test.ts` | ❌ Wave 0 |
| ORB-05 | `ringPositionAt` uses `orbitU`/`orbitV` (not hardcoded XY) — verify Z component varies with tilt | unit | same | ❌ Wave 0 |
| ORB-05 | Angle increments by `angularSpeed * dt` each tick | unit | same | ❌ Wave 0 |
| ORB-06 | Expansion moves non-focused nuclei to `EXPANSION_MULTIPLIER × homePos` | integration | manual visual verify | manual-only — requires GSAP + Three.js |
| ORB-07 | Contraction returns nuclei to `homePos` | integration | manual visual verify | manual-only |
| ORB-07 | `homePos` matches mesh position set in `buildOrbitalScene` (not mid-animation) | unit | `npm test -- --reporter=verbose` | ❌ Wave 0 (test build-time storage) |
| ORB-08 | Ring count clamped to [1, 8] | unit | `npm test -- --reporter=verbose src/scene/orbitals/concentric.test.ts` | ❌ Wave 0 |
| ORB-08 | Single-value dimension collapses to 1 ring | unit | same | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual visual verify of rings/expansion/contraction/switcher before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/scene/orbitals/concentric.ts` — the module under test (must exist before tests run)
- [ ] `src/scene/orbitals/concentric.test.ts` — covers ORB-01, ORB-02, ORB-05, ORB-07 (homePos), ORB-08; includes plane-orientation test for `ringPositionAt`

---

## Sources

### Primary (HIGH confidence)
- Codebase direct read: `src/scene/scene-state.ts`, `src/scene/orbitals/staging.ts`, `src/scene/orbitals/star-orbit.ts`, `src/animation/transition-choreographer.ts`, `src/data/proof-type.ts`, `src/data/impact-scale.ts`, `src/data/enrich.ts`, `src/data/grouping.ts`, `src/data/types.ts`
- `src/scene/orbitals/nucleus-orbit.ts` — `nucleusPositionAt` formula confirmed at lines 76-81; `orbitU`/`orbitV` construction confirmed at lines 54-63; tilt angle confirmed (z clamped to ±0.35 = up to ~20°)
- Empirical data analysis: `cases.json` (116 cases, computed distribution entropy across all dimensions per vertical)
- Three.js r170 `BufferGeometry.setFromPoints()` and `LineLoop` — standard API, unchanged since r125; confirmed by codebase's existing use of Three.js geometry patterns
- `Raycaster.params.Line.threshold` — confirmed present in Three.js docs and unchanged in r170

### Secondary (MEDIUM confidence)
- GSAP `gsap.to(mesh.position, {...})` with `onComplete` — patterns used throughout codebase; trusted by project convention

### Tertiary (LOW confidence)
- `EXPANSION_MULTIPLIER = 4.5` — empirical estimate based on nucleus orbit radius (~300) × 4.5 = ~1350, which at camera VIEW_DISTANCE=200 should be well off-screen; needs empirical tuning
- Ring angular speed values — estimated to be visually slow; needs empirical tuning

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, verified against package.json
- Ring layout algorithm: HIGH — pure math, derived from data analysis
- Auto-selection algorithm: HIGH — entropy formula + empirical validation against real data
- THREE.js ring line API: HIGH — `LineLoop` + `setFromPoints` is stable Three.js r125+ API
- Expansion/contraction pattern: HIGH — follows established GSAP tween patterns in codebase; `homePos` pattern resolves drift accumulation
- `ringPositionAt` plane orientation: HIGH — formula verified against `nucleusPositionAt` in nucleus-orbit.ts lines 76-81
- Numeric constants (expansion multiplier, angular speed): LOW — need empirical tuning

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (stable stack, slow-moving libraries)
