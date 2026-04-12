# Codebase Concerns

**Analysis Date:** 2026-04-13

## Tech Debt

**Duplicated color map (NUCLEUS_COLORS):**
- Issue: Color palette defined in two separate locations with identical mappings
- Files: `src/scene/scene-state.ts` (lines 24-32), `src/ui/tooltip.ts` (lines 4-12)
- Impact: Maintenance burden; changes must be made in both places or colors desynchronize between 3D scene and tooltip hover labels
- Fix approach: Extract single `NUCLEUS_COLORS` constant to `src/data/colors.ts` (or colors object in `types.ts`), import in both modules

**Redundant hexToRgb conversion:**
- Issue: `hexToRgb()` function implemented identically in two modules
- Files: `src/scene/scene-state.ts` (lines 16-22), `src/scene/regroup.ts` (lines 13-19)
- Impact: Code duplication; inconsistent if one is ever bugfixed
- Fix approach: Move to shared utility file `src/utils/color.ts`, export and import in both

**Label threshold state management:**
- Issue: `labelThreshold` variable held only in `main.ts` tick loop closure; not persisted or accessible to other modules
- Files: `src/main.ts` (line 90, used in lines 112-116)
- Impact: If label visibility logic needs to be extended (e.g., per-nucleus control, persistence), current design forces modification of main boot closure
- Fix approach: Move to `sceneObjects` state as optional property `labelThreshold: number`, update in same tick loop

**Reduced-motion is all-or-nothing:**
- Issue: When `prefers-reduced-motion: reduce` is set, GSAP timeline is globally paused (`gsap.globalTimeline.timeScale(0)`) AND all orbit animations freeze to t=0
- Files: `src/main.ts` (lines 15-17), `src/scene/scene-state.ts` (lines 135-148)
- Impact: Users with motion sensitivity get no animation at all—not a graceful degradation but a complete halt. Accesses `prefers-reduced-motion` twice (redundant check)
- Fix approach: Implement semantic reduction instead: slow animations (0.5-0.8s instead of 1.3s), disable rapid orbital drift, keep UI transitions at full speed. Single `matchesReducedMotion()` check on boot, store in sceneObjects

---

## Known Bugs

**Regrouping doesn't clean up old meshes reliably:**
- Symptoms: When switching group mode (vertical → country → region), old nucleus and star meshes occasionally persist in the scene or memory
- Files: `src/scene/regroup.ts` (lines 35-45 removal logic, lines 50-83 creation logic)
- Trigger: Rapidly switching modes multiple times; meshes with complex userData (halos, labels) more likely to leak
- Root cause: GSAP animations may still be running on meshes being removed. Cleanup happens synchronously but GSAP tweens reference old objects, preventing garbage collection
- Workaround: Manually call `regroup()` with same mode twice, or wait 2+ seconds between mode switches
- Fix approach: Kill all GSAP tweens on affected meshes before removal (`gsap.killTweensOf()`), dispose geometries and materials explicitly

**Staging targets world origin instead of focused nucleus:**
- Symptoms: In global mode, filter staging works correctly (constellates at origin). In focused mode, stars animate to wrong position—they spiral toward world origin instead of around focused nucleus
- Files: `src/scene/scene-state.ts` (lines 206-209, stagingCenter calculation)
- Trigger: Enter focus on any nucleus, then apply filter that matches some (not all) cases
- Root cause: `stagingCenter` computation depends on focused nucleus position, but `computeStagingPositions()` assumes center is at origin and returns relative coordinates. Code adds center to positions (line 304 in `focusSphere`) but `applyFilter()` at line 209 passes stagingCenter and expects it to be applied, creating double-offset
- Workaround: In focused mode, apply filters BEFORE entering focus, or use global mode to filter
- Fix approach: Make `computeStagingPositions()` accept either absolute center OR relative mode parameter; in focused mode, pass absolute=false and add center in caller

**Back button / breadcrumb desync after filter + focus transition:**
- Symptoms: Click nucleus to focus → apply filter → click back button → UI goes back to global but filter state is not cleared, scene shows partially-faded stars
- Files: `src/main.ts` (lines 226-241 exitFocus), `src/ui/filter-panel.ts` (lines 112-124 focusBack handler)
- Trigger: (1) Focused mode with no filter, (2) apply filter (stars stage), (3) click breadcrumb back button
- Root cause: `exitFocus()` in main.ts calls `unfocusSphere()` which calls `clearFilter()`, but filter-panel's focusBack button (line 112) calls `exitFocus()` AND THEN `requestAnimationFrame(() => render())` to re-render UI. During that frame, scene state was already updated but filter state cleanup races with re-render
- Workaround: Manually reset filter through filter panel clear button before exiting focus
- Fix approach: Synchronize: make `focusBack` handler await/guarantee `exitFocus()` completes before re-rendering, OR make filter state part of global mode entry invariant (enforce in `exitFocus()` before returning)

**Global search doesn't respect active filters:**
- Symptoms: With filter applied (e.g., only "Media" cases staged), typing in global search bar changes opacity of ALL stars matching search, including filtered-out ones
- Files: `src/main.ts` (lines 271-288 global search input handler)
- Trigger: Apply filter → nuclei or cases stage → type in global search
- Root cause: Global search loop (line 274) iterates ALL `starMeshes` and sets opacity based only on search match, overwriting filter-driven opacity that was set in `applyFilter()`
- Workaround: Clear filter before searching, or don't search while filtering
- Fix approach: Global search should respect filter state—only modify opacity of already-visible stars, or re-apply filter after search completes

**Tooltip clamping doesn't prevent off-screen display:**
- Symptoms: Tooltip can render completely or partially off-screen at viewport edges, especially on small screens or when hovering stars at canvas boundaries
- Files: `src/ui/tooltip.ts` (lines 23-32 show method)
- Trigger: Hover over stars near right edge or bottom edge of canvas
- Root cause: Positions are set with simple offset (`screenX + 14`, `screenY - 10`) but no bounds checking or clamping to viewport dimensions
- Workaround: Hover slower/earlier so tooltip appears before reaching edge
- Fix approach: In `tooltip.show()`, compute bounding box after setting position, clamp to `[0, innerWidth-tooltipWidth]` × `[0, innerHeight-tooltipHeight]`

---

## Performance Bottlenecks

**GC pressure from allocations in tick loop:**
- Problem: `tickOrbits()` creates new `_tickScratch` Vector3 per star for `lerp()` operation
- Files: `src/scene/scene-state.ts` (lines 140, 172-173)
- Cause: While one scratch vector is reused across the loop (good), `starPositionAt()` is called per star and returns a new plain object `{ x, y, z }` each frame. Over ~200 stars, this creates ~200 allocations per frame
- Current rate: ~12,000 allocations per second at 60fps with 200-star dataset
- Improvement path: (1) Return positions to pre-allocated buffer (index into shared Float32Array), (2) Reuse position objects in object pool, (3) Cache unchanged positions to skip lerp when not needed

**Nucleus label projection calculated every frame regardless of visibility:**
- Problem: Every nucleus label position recalculated via `projectToScreen()` each frame, even when label is hidden (off-screen or below threshold)
- Files: `src/main.ts` (lines 106-116, tick loop)
- Cause: No early exit—projects all labels then applies visibility based on threshold
- Impact: On wide screens with many nuclei (10+), ~15-20% CPU goes to projection math alone
- Improvement path: (1) Skip projection for hidden labels (check threshold+focused state first), (2) Cache projection result if nucleus position hasn't moved significantly (use dirty flag)

**Star mesh raycasting against full list every pointermove:**
- Problem: `raycaster.intersectObjects(sceneObjects.starMeshes)` called on EVERY mouse move, even when not hovering
- Files: `src/main.ts` (lines 136-158, pointermove handler)
- Cause: Unconditional raycasting; no spatial partitioning or frustum culling
- Impact: With 200 stars, ~500 raycasts per second during pan/idle mouse movement
- Improvement path: (1) Debounce raycasts (skip frames when mouse hasn't moved >10px), (2) Use octree for spatial queries, (3) Disable raycasting when filter is active (tooltip already hides)

**GSAP tweens for every star during regroup:**
- Problem: `regroupScene()` calls `gsap.to(star.position, ...)` for every star, queuing hundreds of tweens
- Files: `src/scene/regroup.ts` (lines 96-112)
- Cause: No batching; GSAP creates individual tween objects per star
- Impact: With 300+ cases, mode switch causes browser to parse and animate 300+ simultaneous tweens; noticeable slowdown on mobile
- Improvement path: (1) Batch tweens using GSAP timeline, (2) Stagger animations, (3) Use raw `requestAnimationFrame` loop for positions instead of GSAP for regroup-only

---

## Fragile Areas

**Filter state is mutable and shared across modules:**
- Files: `src/data/filter.ts` (FilterState interface), `src/scene/scene-state.ts` (stored in SceneObjects), `src/ui/filter-panel.ts` (mutated on every filter change)
- Why fragile: `FilterState` is a collection of `Set` objects; filter-panel code mutates sets in place before passing to `applyFilter()`, which then mutates again. No immutability guarantees. If UI code calls `applyFilter()` twice rapidly, race conditions can cause stale filter state
- Safe modification: Use immutable filter state API—create new FilterState objects, never mutate Sets in place. Or enforce single mutation point via `applyFilter()` only

**Scene mode transition (global ↔ focused) is not atomic:**
- Files: `src/scene/scene-state.ts` (focusSphere lines 242-243, unfocusSphere lines 318-319), `src/main.ts` (enterFocus lines 191-224, exitFocus lines 226-241)
- Why fragile: Transitioning mode sets `objects.mode`, `objects.focusedKey`, camera position, opacity, and DOM state across main.ts and scene-state.ts. If animation is interrupted (e.g., user clicks during 1.3s focus animation), state becomes inconsistent—mode might be 'focused' but DOM is still showing 'global' controls
- Safe modification: Wrap all mode transitions in atomic operation; disable user input during animation, or add state guard at entry points

**Nucleus position mutation in tickOrbits during focused mode:**
- Files: `src/scene/scene-state.ts` (lines 151-164)
- Why fragile: Loop mutates `star.userData.starOrbit.orbitCenter` during tick for non-focused nuclei. If `regroupScene()` is called mid-tick (user switches mode), iteration order and state consistency breaks
- Safe modification: Don't mutate orbit objects in tick loop; instead compute derived center at read time or store separately

**Label DOM creation unbounded:**
- Files: `src/scene/regroup.ts` (line 80, appendChild to labelContainer), `src/scene/scene-state.ts` (line 95)
- Why fragile: Every regroup creates new DOM nodes; old ones are removed (line 43) but if multiple regroups happen in quick succession, label elements can accumulate
- Safe modification: Implement label pool/cache, or use single `innerHTML` rebuild instead of appendChild

---

## Security Considerations

**XSS vulnerability in detail panel title/client display:**
- Risk: `DetailPanel.open()` sets `.textContent` for most fields but `.innerHTML` for meta chips (line 79-83) and metrics (line 97-101)
- Files: `src/ui/detail-panel.ts` (lines 76, 79-83, 97-101)
- Current mitigation: Case data comes from bundled JSON (`/cases.json`), not user input—risk is low if data source is trusted
- Recommendations: (1) Use `.textContent` for all user-visible strings; if HTML markup needed, sanitize via DOMPurify or markdown parser, (2) Template metric HTML safely using DOM methods instead of string concatenation

**XSS in tooltip generation:**
- Risk: Tooltip shows `c.client` and `c.title` as innerHTML (line 26)
- Files: `src/ui/tooltip.ts` (line 25-28)
- Current mitigation: Data is from bundled JSON
- Recommendations: Use `.textContent` instead of `.innerHTML`, or sanitize if dynamic content is added

**Color hex in style attribute (CSS injection):**
- Risk: `setProperty('--cl-accent', colorHex)` injects hex directly into CSS variable
- Files: `src/scene/regroup.ts` (line 77), `src/scene/scene-state.ts` (line 92)
- Current mitigation: Hex is generated internally from hardcoded palette in `NUCLEUS_COLORS`, not user input
- Recommendations: If colors ever become dynamic, validate format (`/^#[0-9a-f]{6}$/i`) before use

**Filter search string not escaped:**
- Risk: Global search query (line 272) applied directly in string matching
- Files: `src/main.ts` (lines 272-288)
- Current mitigation: Only performs `.includes()` comparison, no regex or eval
- Recommendations: Safe as-is

---

## Missing Critical Features

**No persistence of user filter/group state:**
- Problem: Filters and grouping mode are lost on page reload
- Blocks: Can't share a filtered view with teammates, can't save favorite groupings
- Impact: User resets their navigation every session

**No global search integration with filter panel:**
- Problem: Global search (line 272) and filter staging (lines 136-189) are independent systems; applying both causes unintended behavior
- Blocks: Can't meaningfully combine search + filter (search overwrites filter opacity)
- Impact: Search is disabled when filtering

**No per-nucleus label opacity control:**
- Problem: Label threshold (line 90) is global; can't show only one cluster's labels while hiding others
- Blocks: Can't selectively focus on one theme while exploring others
- Impact: Limited navigation for large datasets

**No viewport boundary clamping for tooltips:**
- Problem: Tooltip can render off-screen (see fragile areas)
- Blocks: Unreliable hover feedback on small screens or canvas edges
- Impact: Accessibility degradation at screen boundaries

---

## Test Coverage Gaps

**No tests for regroup cleanup:**
- What's not tested: Mesh removal in `regroupScene()` when nuclei disappear; no verification that old meshes are disposed or GSAP tweens killed
- Files: `src/scene/regroup.ts` (lines 35-45)
- Risk: Regrouping bugs go undetected until memory leak appears in production
- Priority: High

**No tests for filter + focus interaction:**
- What's not tested: `applyFilter()` called while in focused mode; staging position correctness; focused nucleus and filter state consistency
- Files: `src/scene/scene-state.ts` (applyFilter, focusSphere)
- Risk: Known bug (staging to world origin in focused mode) is not covered by tests
- Priority: High

**No tests for mode transitions:**
- What's not tested: global → focused → global cycle; state consistency across DOM and scene objects
- Files: `src/main.ts` (enterFocus, exitFocus), `src/scene/scene-state.ts` (focusSphere, unfocusSphere)
- Risk: Back button desync and mode state inconsistency not detected
- Priority: High

**No tests for reduced-motion behavior:**
- What's not tested: Reduced-motion preference is respected; animations are actually disabled or semantic fallback is applied
- Files: `src/main.ts` (line 15-17), `src/scene/scene-state.ts` (matchesReducedMotion)
- Risk: Users with motion sensitivity may experience unintended animations
- Priority: Medium

**No tests for label threshold visibility:**
- What's not tested: Label show/hide logic with threshold values (0, 50, 100); labels appear at correct threshold levels; focused state overrides threshold
- Files: `src/main.ts` (lines 112-116)
- Risk: Label visibility bugs go undetected
- Priority: Medium

**No tests for raycasting and tooltip interaction:**
- What's not tested: Tooltip correctly identifies star vs nucleus hits; tooltip hides when filter active; tooltip position is valid
- Files: `src/main.ts` (pointermove handler), `src/ui/tooltip.ts`
- Risk: Tooltip behavior is fragile and untested
- Priority: Medium

---

*Concerns audit: 2026-04-13*
