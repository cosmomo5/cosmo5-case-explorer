# Domain Pitfalls — Case Study Explorer v3.1

**Domain:** Three.js + GSAP interactive visualization with hybrid DOM/WebGL layout and multi-view state management
**Researched:** 2026-04-13
**Codebase basis:** `phase-1c` branch (~2,700 lines TypeScript). Known issues: GC pressure in tick loop, regrouping mesh leak, staging world-origin bug, back-button desync.

---

## Critical Pitfalls

Mistakes in this tier cause visible broken behavior or silent state corruption that requires rewrites to fix.

---

### Pitfall 1: OrbitControls Target Desync After Programmatic Camera Move (T1/T5)

**What goes wrong:**
T1 animates the camera from free-orbit position to face-on with the target constellation's orbital plane. If GSAP tweens `camera.position` in Cartesian coordinates while `OrbitControls.update()` is running in the tick loop, one of two failure modes occurs:
- The camera snaps to an unexpected rotation the moment the tween completes (controls reconvergence).
- OrbitControls freezes entirely if the camera position lands too close to the `controls.target` point (the camera/target coincide, causing a degenerate lookAt matrix).

**Why it happens:**
OrbitControls maintains its own internal spherical coordinate representation of the camera. Tweening `camera.position.x/y/z` directly bypasses that representation. When `controls.update()` is called on the next frame after the tween ends, OrbitControls reasserts its internal spherical state, which was never updated — producing the jerk. The freeze variant occurs when the camera's computed vector to target has zero length.

**This project's specific risk:**
T1 rotates the camera to face the orbital plane head-on. The target nucleus is roughly at the scene center. If the camera position path passes through or near the controls target during the 800ms camera orbit, the freeze condition is reachable.

**Consequences:** Camera locks post-T1. User cannot orbit in focused mode. Requires page reload.

**Prevention:**
1. Set `controls.enabled = false` at the start of T1 and T5.
2. Tween in **spherical coordinates** (radius, phi, theta) rather than Cartesian (x, y, z). Convert back to position each frame in the GSAP `onUpdate` callback via `THREE.Spherical` + `setFromSpherical()`.
3. Never let phi reach exactly 0 or π — offset by 0.0001 to avoid the pole singularity.
4. After the tween completes, sync `controls.target` to the new lookAt target, then call `controls.update()` once, then set `controls.enabled = true`.

**Warning signs:**
- Camera jumps at the end of T1 animation.
- After T1, drag interaction no longer rotates the scene.
- Console errors mentioning NaN in camera matrix.

**Phase:** Implement in the T1/T5 transition phase. Do not defer — incorrect camera re-enable is undetectable in isolated tween testing but breaks interactive use immediately.

---

### Pitfall 2: GSAP Tweens Left Running on Disposed Meshes (Regrouping + View Switching)

**What goes wrong:**
When transitioning between constellations (T5 → T1 back into a new constellation), or when switching grouping mode during a focus transition, existing GSAP tweens still reference the old mesh objects. The meshes are removed from the scene, but the tweens keep running — calling `.position.set()` on objects that no longer exist in the scene graph. JavaScript's GC cannot collect the mesh because the tween holds a reference. GPU memory for the geometry/material is also not freed because `geometry.dispose()` / `material.dispose()` were never called.

**This project's specific risk:**
Already documented in CONCERNS.md as the regrouping mesh leak bug. The new transitions (T2 star-flies-to-track, T6 star-returns-to-orbit) add two more sites where this can occur: the ghost star's fade-in tween after the original star departs, and the star's return arc tween. Both create new tweens on mesh objects that might be simultaneously targeted by other tweens (filter-driven opacity tweens).

**Consequences:** GPU memory grows monotonically with each constellation visit. Browser tab crashes after ~10–15 navigation cycles on lower-memory devices.

**Prevention:**
1. **Kill before dispose:** Call `gsap.killTweensOf(mesh)` and `gsap.killTweensOf(mesh.position)` and `gsap.killTweensOf(mesh.material)` before any `scene.remove(mesh)`.
2. **Explicit disposal chain:** After remove, call `mesh.geometry.dispose()` and `mesh.material.dispose()`. Labels (DOM elements) must also be removed — `labelElement.remove()`.
3. **GSAP context or timeline scoping:** For each transition, create a named GSAP context or timeline. Kill that context when the transition is interrupted or overridden. This is safer than chasing individual `killTweensOf` calls.
4. **Monitor `renderer.info.memory`:** Log `renderer.info.memory.geometries` and `.textures` to the console during development. If they climb across constellation visits, there's a leak.

**Warning signs:**
- `renderer.info.memory.geometries` increases after each constellation switch.
- Chrome DevTools Memory tab shows Three.js mesh objects in heap snapshots after switching away from a constellation.
- Performance degrades after 5+ navigation cycles.

**Phase:** Fix the existing regrouping leak first (pre-transition work). Extend the same pattern to all new T2/T6 transition code. Do not build new transitions on top of the leaking foundation.

---

### Pitfall 3: Canvas Aspect Ratio Corruption When Reading Panel Slides In (T3/T4)

**What goes wrong:**
T3 slides the reading panel in from the right while the constellation+track region compresses leftward. The Three.js canvas occupies the full viewport width before T3. After T3, the canvas still occupies full width in the DOM but the visual layout shows only the left ~calc(100% - 340px). If the renderer is not updated to match the new drawable area, one of two things happens:
- The canvas is physically narrower but the renderer thinks it is still full-width → objects render at the wrong scale, raycasting uses wrong mouse coordinates, and stars appear at wrong positions.
- The CSS transition animates the container width but the resize event fires only when the transition completes → for 400ms the renderer aspect ratio is wrong, creating a stretching artifact during the slide.

**Why it happens:**
`window.resize` events do not fire when a CSS flex/grid container changes size due to an element entering the layout. The renderer only learns about the new canvas size if it is told explicitly.

**Consequences:** Raycasting is broken during and after T3/T4. Click targets are offset from visual star positions. The mismatch is invisible in screenshot testing but obvious in interactive use.

**Prevention:**
1. Use `ResizeObserver` on the canvas container element (not `window`). `ResizeObserver` fires on every layout change including CSS-driven resizing, not just window resize events.
2. In the observer callback, call `renderer.setSize(container.clientWidth, container.clientHeight, false)` and update `camera.aspect` + `camera.updateProjectionMatrix()`.
3. The `false` third argument to `setSize` prevents Three.js from overriding the canvas's CSS size with inline styles, which would fight the CSS panel animation.
4. Trigger the resize update synchronously at T3 start (when panel width begins animating), not at T3 end — so the renderer tracks the in-progress resize.

**Warning signs:**
- After T3, clicking a star in the constellation zone opens the wrong case.
- Stars appear shifted left or right relative to their hover targets.
- Console shows raycaster intersections at unexpected positions.

**Phase:** Implement during the split-canvas layout phase, before any transition code is written. The ResizeObserver pattern is infrastructure — all transitions depend on it.

---

### Pitfall 4: Non-Atomic Mode Transitions Allow Interruptible State Corruption

**What goes wrong:**
Already identified in CONCERNS.md as a fragile area ("Scene mode transition is not atomic"). The new transitions amplify this: T1 is 1200ms, T5 is 1400ms. If the user clicks a second nucleus during T1, or clicks the back button during T5, `objects.mode`, `objects.focusedKey`, camera position, DOM state, and now shortlist visibility are all mid-update. The incoming click starts a second transition on top of a running one, creating state that is neither global nor focused and cannot be recovered without a page reload.

**This project's new exposure:**
The shortlist introduces a third mode axis: shortlisted stars have ghost positions in the constellation zone AND positions on the staging track. If T5 is interrupted mid-flight (track fades out partially, camera partially rotated), ghosts may remain visible in the constellation zone of a constellation that is no longer focused, while the track state also thinks those stars are staged.

**Consequences:** Ghost stars appear in the wrong constellation. Track shows stars from a constellation that was never visited in this session. On the next T1, the camera transition animates to the new constellation but the shortlist data is from the previous interrupted visit. Silent corruption — no error thrown.

**Prevention:**
1. Introduce a transition lock: a `transitionInProgress: boolean` flag on `sceneObjects`. Set it to `true` at the start of any T1/T2/T3/T4/T5/T6, set back to `false` in the GSAP `onComplete` callback.
2. All user input handlers check this flag at entry and no-op if true. This is the minimum viable guard.
3. For a more user-friendly approach: queue the incoming intent and replay it after `onComplete`. Only worth doing if UX research shows users actually click during transitions — for an internal tool, the lock is sufficient.
4. The transition lock must also be checked in the raycaster's pointermove handler, not just click handlers. Raycasting during T1 hits objects at interpolated positions, producing wrong star identifications.

**Warning signs:**
- Stars from Constellation A appear in Constellation B after fast navigation.
- Back button returns to global but the shortlist track is still visible.
- Console shows `focusSphere` called while `objects.mode === 'focused'`.

**Phase:** Implement before any transition code. The lock is a precondition, not a refinement.

---

## Moderate Pitfalls

Mistakes in this tier produce visible glitches or performance degradation but do not require rewrites.

---

### Pitfall 5: Raycasting Accuracy Breaks After Camera Transition Completes

**What goes wrong:**
Three.js raycasting uses `camera.matrixWorldInverse` to project mouse coordinates into world space. After a camera animation, the matrix is only updated when the camera's `matrixWorldNeedsUpdate` flag is set and the next render pass runs. If the raycaster is called in a `pointermove` handler between the tween completing and the next render frame, it uses a stale matrix — producing misses or hits on wrong objects.

**This project's specific risk:**
The T1 camera rotation is 800ms. During that 800ms, the user may move the mouse. If raycasting is not suppressed during T1 (it currently is not suppressed — see CONCERNS.md performance section), raycasts run on every pointermove against a camera matrix that is changing frame by frame. The intersection results are unreliable throughout the transition.

**Consequences:** Tooltip appears on wrong star during T1. More seriously: if a user clicks during the last frames of T1 (camera nearly settled), the click may register on a star that is not at the cursor's apparent position in the fully-settled view.

**Prevention:**
1. Suppress raycasting during active transitions (use the transition lock from Pitfall 4 — the lock check in pointermove serves double duty).
2. After each transition `onComplete`, force one full render pass (`renderer.render(scene, camera)`) to ensure the camera matrix is current before re-enabling raycasting.
3. The existing "debounce raycasts when mouse hasn't moved >10px" optimization in CONCERNS.md pairs well with this: debounce prevents the performance hit of continuous raycasting during transitions even if the lock is briefly off.

**Warning signs:**
- Tooltip flashes on wrong star at the end of T1.
- Clicks at transition end select the wrong case.

**Phase:** Implement alongside the transition lock (same phase).

---

### Pitfall 6: GSAP Tween Batching Collapse Under High Star Count

**What goes wrong:**
Already partially documented in CONCERNS.md (GSAP tweens for every star during regroup). The new transitions create additional per-star tween volumes:
- T2 (star-to-track): one tween per star added to shortlist. Fine for 3 stars. If the user batch-selects 12 stars in rapid succession (clicking quickly), 12 simultaneous arc tweens run with ghost creation on each.
- T6 (track-to-orbit): same issue in reverse.
- T1 (global→constellation): currently the OTHER nuclei "fade to invisible" — that's up to N-1 nuclei receiving fade tweens simultaneously.

GSAP processes tweens synchronously per-tick. With 300+ cases (a realistic upper bound), a T1 fade-out of 30+ nuclei plus any in-flight T2 tweens from pre-focused shortlist additions can produce a single-frame spike of 500ms or more on mid-range hardware.

**Consequences:** Perceptible stutter at T1 entry. Worse on integrated graphics laptops, which are common for the internal sales audience.

**Prevention:**
1. T1 nuclei fade: use a single GSAP `stagger` timeline, not individual `gsap.to()` calls. Stagger 20–30ms per nucleus. Total duration increases by ~(N * stagger)ms but the per-frame tween count drops dramatically.
2. T2 star-to-track: if rapid multi-selection is possible, queue rather than spawn. Process one star's arc tween, then the next on `onComplete`.
3. For any operation that creates tweens on N > 20 objects: consider `gsap.quickSetter()` for the most performance-critical properties (position.x, position.y) — it bypasses the GSAP property lookup overhead on each tick.
4. If further optimization is needed: replace GSAP for the pure-position T1 fade-out with a `requestAnimationFrame` loop that lerps material opacity directly. GSAP's overhead per tween (property parsing, plugin lookup) is measurable at >100 simultaneous targets.

**Warning signs:**
- Frame rate drops to <30fps for 1–2 frames at T1 entry in Chrome DevTools Performance tab.
- `gsap.ticker.lagSmoothing` fires warnings in console.

**Phase:** Pre-optimize the T1 nuclei fade during its implementation. Defer T2/T6 queue optimization unless performance testing shows it's needed.

---

### Pitfall 7: Ghost Star Opacity Tween Conflicts with Filter-Driven Opacity Tween

**What goes wrong:**
Two systems write to `mesh.material.opacity`:
1. Filter: `applyFilter()` sets opacity to dimmed (~0.15) or full (~1.0) based on filter match.
2. Ghost mechanic: when a star is sent to the track, the ghost copy (or the remaining star at orbital position) is set to a specific ghost opacity (~0.25, dashed ring style).

If a filter is applied after a star has been ghosted, `applyFilter()` may overwrite the ghost opacity with either 0.15 (filter-dimmed) or 1.0 (filter-match full opacity). Neither is correct for a ghost.

**This project's specific risk:**
The existing `FilterState` mutability bug (CONCERNS.md: "Filter state is mutable and shared") means this interaction is already prone to race conditions. Adding ghost state makes the opacity management a three-way contention: ghost vs filter vs selected-white (T2 brightens star to white before it departs).

**Consequences:** Ghost stars appear too bright (filter re-brightens them) or invisible (filter dims them to match non-ghost dimmed stars). The visual cue that a star has been staged is lost.

**Prevention:**
1. Introduce a priority system for opacity targets. Star state enum with explicit opacity values and precedences:
   - `reading` (gold, ~1.0) > `selected` (white, ~1.0) > `ghost` (~0.25, not overridable by filter) > `filter-match` (full) > `filter-dim` (0.15) > `idle` (0.85)
2. `applyFilter()` must check `star.userData.state` before setting opacity. If state is `ghost`, skip the opacity write.
3. Single opacity-setter function that all systems route through, never writing `material.opacity` directly.

**Warning signs:**
- After applying a filter in focused mode, ghost stars suddenly glow at full opacity.
- Ghost stars disappear entirely when filter dims them.

**Phase:** Design the star state enum and single-setter pattern before implementing any of T2, T6, or filter-focused-mode. This is a data model decision.

---

### Pitfall 8: Vector3 Allocation Persisting into New Tick-Loop Code Paths

**What goes wrong:**
Already documented in CONCERNS.md: ~12,000 `{x, y, z}` object allocations per second from `starPositionAt()` return values. The new transitions add additional hot paths where Vec3 allocations can accumulate:
- T2 star arc computation: if the arc is calculated per-frame during tween (rather than pre-computed at tween start), it creates new intermediate vectors each frame.
- Ghost position update: if ghost position is computed by projecting the departed star's orbital position each frame, that projection creates scratch objects.

**Consequences:** GC pauses on Chrome/Firefox at 1–5 second intervals, producing stutter in the otherwise smooth orbital animation.

**Prevention:**
1. Fix the existing `starPositionAt()` allocations before building new transitions (pre-work item).
2. For the T2 arc: pre-compute start position, end position, and control point(s) at tween init time. Store in the tween's `onUpdate` closure. No per-frame computation.
3. Declare a module-level `_scratchVec3 = new THREE.Vector3()` for each new module that needs temporary position computation. Do not use `new THREE.Vector3()` inside loop bodies or animation callbacks.
4. Add `renderer.info` logging to the dev tick loop: `console.log(renderer.info.memory, renderer.info.render)` every 5 seconds. Allocations don't show there, but GC pauses do show in Performance tab. Make this a standard dev-mode diagnostic.

**Warning signs:**
- Chrome DevTools Performance tab shows GC events at regular intervals during orbital animation.
- Frame time spikes to 20–30ms periodically even when no user interaction is happening.

**Phase:** Fix existing allocations in pre-work phase. Apply the pattern consistently to all new T2/T6 code.

---

## Minor Pitfalls

Correctness issues with low probability of hitting unless specific conditions are met.

---

### Pitfall 9: Tooltip Viewport Clamping Breaks in Compressed Layout

**What goes wrong:**
Already documented in CONCERNS.md: tooltip clamping uses `innerWidth` / `innerHeight` for bounds. After T3 (panel slides in), `innerWidth` is still the full window width, but the visible scene area is `innerWidth - 340px`. Stars near the right edge of the compressed constellation zone get tooltips that render over or behind the reading panel.

**Prevention:**
Pass the scene container's `getBoundingClientRect()` to the tooltip clamp logic rather than `window.innerWidth`. Update the clamp bounds in the ResizeObserver callback (same observer as Pitfall 3).

**Phase:** Implement when building the reading panel (T3 phase).

---

### Pitfall 10: Track Line Draw Animation Race with Connector Redraw

**What goes wrong:**
T2 specifies the track line "extends from center outward" as the first star arrives. If a second star is added before the first star's arc completes (user clicks two stars rapidly), the track line's extend animation may restart or conflict with the connector draw triggered by the second star's arrival.

**Prevention:**
Track state (line length, connector positions) should be derived from the shortlist array, not animated independently. Animate only the most recently added star's arc. Recompute track line endpoints and connectors synchronously from the shortlist array on each T2 `onComplete` callback, then draw the delta with a short tween.

**Phase:** T2 implementation phase.

---

### Pitfall 11: `prefers-reduced-motion` Gate Missing on New Transitions

**What goes wrong:**
The existing codebase has 3 reduced-motion gates. T1–T6 add 6 new GSAP timelines. If reduced-motion is not checked for each new transition, users with motion sensitivity get the full 1200ms orbital camera rotation on T1, which is exactly the kind of vestibular-trigger content the preference exists to suppress.

**Prevention:**
Centralize the reduced-motion check as CONCERNS.md recommends: `matchesReducedMotion()` on boot, stored in `sceneObjects`. All new transitions check this flag. Reduced-motion behavior for T1: immediate camera reposition (no orbital sweep) — use `gsap.set()` or `duration: 0` branch. For T2/T6: cut transition. For T3/T4: allow — panel slide is not vestibular.

**Phase:** Implement for every new transition as it is built, not in a cleanup pass. It is easier to add the branch during initial implementation than to retrofit it.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Pre-work: fix existing mesh leak | Pitfall 2 (GSAP+dispose pattern) | Establish `killTweensOf` + `dispose` chain before any new meshes are added |
| Pre-work: fix Vec3 allocations | Pitfall 8 (GC pressure) | Module-level scratch vectors, fix `starPositionAt()` return |
| Split canvas layout + ResizeObserver | Pitfall 3 (canvas resize) | ResizeObserver on container, not window; `setSize(w, h, false)` |
| Star state model + opacity system | Pitfall 7 (opacity contention) | State enum + single-setter before T2/T6 |
| T1/T5 camera transition | Pitfall 1 (OrbitControls desync) | Spherical coords, disable/re-enable controls, phi offset |
| T1/T5 camera transition | Pitfall 4 (non-atomic transitions) | Transition lock on `sceneObjects` before any T-code |
| T1/T5 camera transition | Pitfall 6 (tween batching) | Stagger nuclei fade-out, not simultaneous `gsap.to()` |
| T2/T6 star arc transitions | Pitfall 2 (GSAP+dispose for ghosts) | killTweensOf ghost mesh on T6 before returning star |
| T2/T6 star arc transitions | Pitfall 8 (arc Vec3 allocation) | Pre-compute arc geometry at tween start, not per-frame |
| T2/T6 star arc transitions | Pitfall 10 (track line race) | Derive track state from shortlist array, not separate animation |
| Raycasting after T1 | Pitfall 5 (stale camera matrix) | Suppress raycasts during transition lock; force render on complete |
| T3/T4 reading panel | Pitfall 3 (aspect ratio in panel) | ResizeObserver already in place from split canvas phase |
| T3/T4 reading panel | Pitfall 9 (tooltip over panel) | Clamp to scene container bounds, not window bounds |
| All transitions | Pitfall 11 (reduced-motion missing) | Branch at transition init, not as a post-pass |

---

## Sources

- Three.js Discourse: [OrbitControls/GSAP camera animation conflict](https://discourse.threejs.org/t/need-help-with-gsap-camera-and-orbitcontrols-animations/17420)
- Three.js Discourse: [Sudden rotation after animating to overhead view](https://discourse.threejs.org/t/sudden-rotation-after-animating-to-overhead-view-using-orbitcontrols/52975)
- Three.js Discourse: [Animating camera target using GSAP](https://discourse.threejs.org/t/animating-camera-target-using-gsap/52486)
- GSAP Docs: [killTweensOf](https://gsap.com/docs/v3/GSAP/Timeline/killTweensOf/)
- GSAP Community: [Memory leaks during tweening multiple objects](https://gsap.com/community/forums/topic/10628-memory-leaks-during-tweening-multiple-objects/)
- Three.js How-to: [How to dispose of objects](https://yannliao.github.io/threejs.miniprogram/docs/manual/en/introduction/How-to-dispose-of-objects.html)
- WebGL Fundamentals: [WebGL Resizing the Canvas](https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html)
- MDN: [WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- Codrops (Feb 2026): [Smooth Horizontal Parallax Gallery DOM to WebGL](https://tympanus.net/codrops/2026/02/19/creating-a-smooth-horizontal-parallax-gallery-from-dom-to-webgl/)
- Three.js GitHub Issue #19917: [OrbitControls meddles with camera after disabled](https://github.com/mrdoob/three.js/issues/19917)
- Three.js Discourse: [GSAP and Three.js jerky tweens](https://gsap.com/community/forums/topic/33031-gsap-and-threejs-jerky-tweens/)
- Project: `.planning/codebase/CONCERNS.md` (2026-04-13) — pre-existing bugs and fragile areas cross-referenced throughout
