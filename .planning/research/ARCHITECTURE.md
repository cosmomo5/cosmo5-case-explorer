# Architecture Patterns

**Project:** Case Study Explorer v3.1 — Dimensional Explorer
**Domain:** Vanilla TypeScript + Three.js + GSAP hybrid WebGL/DOM application
**Researched:** 2026-04-13
**Confidence:** HIGH (all patterns verified against existing codebase + Three.js community sources)

---

## Recommended Architecture

The existing codebase follows a mutable shared-state model (`SceneObjects`) that works well for the rendering pipeline. The new features require three additions on top of it:

1. A **ViewState machine** that owns legal transitions between the three view modes
2. A **ShortlistStore** at the data layer, not the scene layer, so it outlives any view transition
3. A **TransitionChoreographer** that converts state transition requests into GSAP timelines

Everything else — orbital math, rendering pipeline, tick loop, filter logic — stays structurally unchanged. The additions slot alongside the existing architecture rather than replacing it.

---

## Component Boundaries

### Existing Components (unchanged structure)

| Component | Location | Responsibility |
|-----------|----------|---------------|
| Orbital math | `src/scene/orbitals/` | Deterministic star/nucleus position at time t. Pure functions. No state. |
| SceneObjects | `src/scene/scene-state.ts` | Central mutable container for all 3D geometry and derived state. |
| Tick loop | `src/main.ts: tick()` | Per-frame: update orbit positions, reproject labels, render frame. |
| FilterState | `src/data/filter.ts` | Immutable filter selection. New instance per interaction. |
| Starfield | `src/scene/background/starfield.ts` | Background particle layer. Independent of view state. |

### New Components

#### 1. ViewState — `src/state/view-state.ts`

A discriminated union with the three legal states and a typed event system for transitions.

```typescript
type ViewState =
  | { kind: 'global' }
  | { kind: 'constellation'; nucleusKey: string }
  | { kind: 'reading'; nucleusKey: string; activeCase: CaseStudy };

type ViewEvent =
  | { type: 'ENTER_CONSTELLATION'; nucleusKey: string }
  | { type: 'EXIT_TO_GLOBAL' }
  | { type: 'OPEN_READING'; caseStudy: CaseStudy }
  | { type: 'CLOSE_READING' };
```

**Responsibilities:**
- Owns current state + legal transitions (transition table enforces which events are valid per state)
- Exposes `dispatch(event)` — the only way to change state
- Notifies registered listeners on every state change
- Does NOT run animations — that is TransitionChoreographer's job

**Does NOT own:**
- ShortlistStore (shortlist outlives all view states)
- Any GSAP timeline (keeps state testable without animation)
- DOM mutation

**Communicates with:** TransitionChoreographer (receives state change notifications), GhostManager (receives state change notifications)

---

#### 2. ShortlistStore — `src/data/shortlist.ts`

```typescript
interface ShortlistedEntry {
  caseStudy: CaseStudy;
  starMesh: Mesh;
  starOrbit: StarOrbit;
  nucleusKey: string;  // which constellation this came from
}

interface ShortlistStore {
  add(entry: ShortlistedEntry): void;
  remove(caseId: string): void;
  clear(): void;
  has(caseId: string): boolean;
  getAll(): ShortlistedEntry[];
  getActive(): ShortlistedEntry | null;
  setActive(caseId: string): void;
  onChange(callback: (entries: ShortlistedEntry[]) => void): () => void;
}
```

**Responsibilities:**
- Persist the shortlist across constellation visits (this is the architectural key: it is not owned by any view state)
- `nucleusKey` on each entry enables multi-constellation shortlists
- Callbacks (not an event bus) for track redraw, ghost management, reading panel sync

**Why data layer, not scene layer:** The shortlist represents user curation intent — it is not a rendering concern. It needs to survive T1/T5 transitions that tear down and rebuild scene state for a given constellation. Placing it in `src/data/` rather than `src/scene/` enforces this boundary.

**Communicates with:** GhostManager (via onChange callback), StagingTrack (via onChange callback), ReadingPanel (via onChange + setActive), TransitionChoreographer (T2/T6 triggered by add/remove)

---

#### 3. TransitionChoreographer — `src/scene/transitions.ts`

The single place where GSAP timelines live. Enforces mutual exclusion — no two transitions run simultaneously.

```typescript
interface TransitionChoreographer {
  runT1(nucleusKey: string): Promise<void>;  // global → constellation (GSAP camera animation)
  runT2(entry: ShortlistedEntry, trackPosition: Vector3): Promise<void>;  // star → track (GSAP arc)
  runT5(): Promise<void>;  // constellation → global (GSAP camera animation)
  runT6(entry: ShortlistedEntry): Promise<void>;  // star returns from track (GSAP arc)
  isTransitioning(): boolean;
}
```

**Note on T3/T4:** Panel open/close are NOT in the choreographer. See ReadingPanel below — it owns T3/T4 directly because they are CSS transitions with no GSAP or Three.js dependency. The choreographer handles only transitions that require GSAP camera animation (T1/T5) or Three.js mesh animation (T2/T6).

**Responsibilities:**
- Each T-function returns a Promise that resolves when the timeline completes
- Blocks new T1/T5 while one is running (T2 can overlap with itself for rapid multi-star shortlisting)
- Calls `controls.enabled = false` at start of T1/T5, `controls.enabled = true` on complete
- Updates ViewState on transition completion (e.g., after T1 timeline ends, dispatches `ENTER_CONSTELLATION`)
- Returns (~20% slower) handled by scaling duration constants: `ENTRY_MS * 1.2`

**GSAP + OrbitControls coordination (critical):**

OrbitControls fights GSAP tweens when both try to write `camera.position` simultaneously. The established pattern:

```typescript
// At timeline start:
controls.enabled = false;

// Animate camera position directly:
gsap.to(camera.position, { x, y, z, duration, ease });

// Animate controls.target via a proxy Vector3 (not directly):
const targetProxy = controls.target.clone();
gsap.to(targetProxy, {
  x: newTargetX, y: newTargetY, z: newTargetZ,
  duration, ease,
  onUpdate: () => controls.target.copy(targetProxy)
});

// On complete:
controls.update();
controls.enabled = true;
```

The `controls.target` must be animated via a proxy vector with `onUpdate` — animating it directly can cause the damping system to fight back. `controls.update()` must be called once after the tween ends to sync internal OrbitControls state.

**Does NOT own:** ViewState transitions (fires them on completion), ShortlistStore mutations (receives them as input), panel slide animation

**Communicates with:** `camera`, `controls`, `SceneObjects`, `LayoutController`, `ViewState`

---

#### 4. LayoutController — `src/layout/layout.ts`

Manages the three CSS zones and the panel slide. DOM drives canvas sizing — the WebGL renderer responds to layout, not the reverse.

```
DOM container resizes → ResizeObserver fires → renderer.setSize(w, h) + camera.aspect = w/h
```

```typescript
interface LayoutController {
  enterSplitCanvas(): void;    // adds CSS classes for constellation zone + track
  exitSplitCanvas(): void;     // removes split layout, restores full viewport
  openPanel(): void;           // adds panel-open class, scene container width shrinks
  closePanel(): void;          // removes panel-open class, scene container width expands
  onResize(callback: () => void): () => void;  // for renderer to observe
}
```

**CSS zones managed:**

```
body.split-canvas:
  .scene-container: height ~72% (constellation + track coexist)
  .divider: 1px horizontal rule
  .track-zone: height ~28%

body.panel-open:
  .scene-container: width calc(100% - 340px)
  .reading-panel: width 340px, transform: translateX(0)
```

**Responsibilities:**
- CSS class mutations only — no GSAP, no direct canvas mutation
- Uses `ResizeObserver` on `.scene-container` to notify renderer of dimension changes
- Panel slide animation is CSS `transition: transform 400ms var(--ease)` — not a GSAP timeline, since it's purely DOM

**Why CSS for the panel slide, not GSAP:** The panel slide is a DOM transformation with no Three.js dependency. CSS transitions are simpler, respect `prefers-reduced-motion` via media query without additional code, and don't require choreographer coordination.

**Communicates with:** renderer (via resize callback), TransitionChoreographer (called during T1/T5), ReadingPanel (called during T3/T4)

---

#### 5. GhostManager — `src/scene/ghosts.ts`

Creates and manages dim meshes at orbital positions when stars are shortlisted.

```typescript
interface GhostManager {
  createGhost(entry: ShortlistedEntry): Mesh;
  removeGhost(caseId: string): void;
  showGhosts(): void;    // constellation mode — ghosts are visible
  hideGhosts(): void;    // global mode — ghosts not needed
  getGhostMesh(caseId: string): Mesh | null;
}
```

**Ghost mesh spec:**
- Same position as the original star's `starPositionAt(orbit, currentTime)`
- Material: `MeshBasicMaterial` with `opacity: 0.15`, `transparent: true`
- Dashed ring around ghost: a `LineLoop` using `LineDashedMaterial`
- Click on ghost → triggers T6 (via ShortlistStore.remove)

**Responsibilities:**
- Registered as a ShortlistStore `onChange` callback — ghosts are always in sync with shortlist
- `showGhosts()`/`hideGhosts()` called by ViewState listener

**Communicates with:** ShortlistStore (onChange callback), SceneObjects (adds meshes to scene), ViewState (show/hide based on state kind)

---

#### 6. StagingTrack — `src/ui/track.ts` (replaces staging.ts role)

The 1D horizontal track in the bottom zone. Manages star positions along the track and connector lines.

```typescript
interface StagingTrack {
  mount(container: HTMLElement): void;
  update(entries: ShortlistedEntry[], activeId: string | null): void;
  setActive(caseId: string): void;
  onStarClick(callback: (caseId: string) => void): void;
  onNavPrev(): void;
  onNavNext(): void;
}
```

**WebGL vs SVG decision — T2 animation handoff:**

The T2 transition requires a star to visually cross the divider from the constellation zone (WebGL) into the track zone. This creates an implementation boundary decision that must be resolved before building:

**Option A — Full-viewport canvas, SVG overlay:**
The Three.js canvas covers the full viewport (not clipped to the constellation zone). The track zone is an SVG/DOM overlay with `pointer-events: none` except for click targets. T2 animates the Three.js mesh all the way down past the divider Y-coordinate. When the mesh arrives at its track position, it is hidden (`mesh.visible = false`) and the SVG representation appears. The canvas "passes through" the DOM divider visually. This requires the canvas to remain full-viewport and the split-canvas layout to be achieved via overlay positioning, not canvas clipping.

**Option B — Track stars as Three.js meshes:**
The track is implemented entirely in Three.js. Track stars are meshes positioned in 3D space below the divider's world-space Y-coordinate. Connector lines are `Line` geometry. Raycasting handles clicks natively. No handoff problem exists — the animation is one continuous mesh movement. For a 1D line of ~7 stars, the raycasting and depth complexity the SVG approach was meant to avoid is negligible in practice.

**Recommendation: Option A for T2 continuity with Option B as fallback if T2 debugging is costly.** Option A preserves the visual continuity of the crossing — the mesh itself crosses the divider, then becomes its SVG representation. Option B is simpler to implement but the mesh handoff is still required for T6 (star returns from track to orbit, which must be a Three.js mesh animation). If using Option B, both T2 and T6 stay in Three.js mesh space throughout and no handoff is needed. The build plan for Phase 4 should start with Option B (simpler) and only introduce the SVG overlay if visual fidelity demands it.

**Communicates with:** ShortlistStore (renders from entries), ReadingPanel (notifies of active star change), TransitionChoreographer (triggers T2 when star added, T6 when removed via click)

---

#### 7. ReadingPanel — `src/ui/reading-panel.ts` (replaces detail-panel.ts)

The 340px right panel with instrument readout layout. Owns T3 and T4 directly — panel open/close is a DOM concern, not a scene concern.

```typescript
interface ReadingPanel {
  open(entry: ShortlistedEntry): void;   // T3: calls LayoutController.openPanel(), sets active star gold
  close(): void;                          // T4: calls LayoutController.closePanel(), clears gold glow
  navigateTo(entry: ShortlistedEntry): void;
  isOpen(): boolean;
}
```

**T3/T4 ownership:** `ReadingPanel.open()` and `close()` orchestrate the panel lifecycle directly:
1. Call `LayoutController.openPanel()` (toggles CSS class → CSS transition fires)
2. Set active star material color to gold (`#e8b15a`) on the Three.js mesh in `SceneObjects`
3. Dispatch `ViewState.OPEN_READING` / `CLOSE_READING` on `transitionend`
4. Fade panel content in after slide completes (setTimeout 200ms or `transitionend` listener)

The TransitionChoreographer is not involved in T3/T4. This is a deliberate boundary: the choreographer handles Three.js camera and mesh animations. The panel slide has no camera or mesh dependency.

**Communicates with:** ShortlistStore (getAll/setActive), StagingTrack (syncs navigation), LayoutController (openPanel/closePanel), ViewState (dispatches OPEN/CLOSE_READING), SceneObjects (sets star gold glow on active entry)

---

## Data Flow

### Startup Flow

```
main.ts boot()
  → fetch /cases.json → CaseStudy[]
  → ViewState.init('global')
  → ShortlistStore.init()
  → buildOrbitalScene(cases) → SceneObjects
  → LayoutController.mount()
  → GhostManager.register(ShortlistStore)
  → StagingTrack.mount()
  → requestAnimationFrame(tick)
```

### Transition: Global → Constellation (T1)

```
User clicks nucleus mesh (raycasting in main.ts)
  → if TransitionChoreographer.isTransitioning(): return
  → TransitionChoreographer.runT1(nucleusKey):
      controls.enabled = false
      GSAP: fade out other nuclei (0–400ms)
      GSAP: camera.position → face-on to orbital plane (0–800ms)
      GSAP: targetProxy → nucleus position (0–800ms, onUpdate: controls.target.copy)
      GSAP: track zone fade in (400–1200ms)
      LayoutController.enterSplitCanvas()
      timeline.onComplete:
        controls.update()
        controls.enabled = true
        ViewState.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey })
        FilterPanel.enterFocusedMode(nucleusKey)
```

### Interaction: Star → Track (T2)

```
User clicks star mesh in constellation zone
  → ShortlistStore.add(entry)
    → GhostManager.createGhost(entry)  [via onChange callback]
    → StagingTrack.update(entries)     [via onChange callback]
  → TransitionChoreographer.runT2(entry, trackPosition):
      star brightens to white
      ghost appears at orbital position (opacity 0.15)
      GSAP arc: star.mesh.position flies from orbit → across divider → trackPosition (600ms)
      [Option A: at arrival, mesh.visible = false, SVG representation appears]
      [Option B: mesh stays as Three.js, repositioned to track coordinates]
      track line extends to accommodate
      connector lines draw between adjacent stars
```

### Interaction: Track Star → Reading Panel (T3)

```
User clicks star on track (or ← → keys)
  → ShortlistStore.setActive(caseId)
  → StagingTrack.setActive(caseId)
  → star in constellation: mesh material.color → gold (#e8b15a)
  → ReadingPanel.open(entry):
      LayoutController.openPanel()  [CSS class: body.panel-open]
      CSS transition fires: panel slides in (400ms), scene container width shrinks
      ResizeObserver fires → renderer.setSize(newW, h) + camera.aspect update
      transitionend → ReadingPanel content fades in (setTimeout 200ms)
      ViewState.dispatch({ type: 'OPEN_READING', caseStudy })
```

### Cross-Constellation Shortlist Persistence (T5 detail)

```
User exits constellation → global (T5)
  → ShortlistStore unchanged (entries survive with their nucleusKey)
  → StagingTrack hides (CSS: track-zone hidden) but entries remain in ShortlistStore
  → GhostManager.hideGhosts() (global view has no orbital positions to ghost)
  → camera pulls back, rings tilt back to 3D
  → User navigates to different constellation (T1 to new nucleusKey)
  → GhostManager.showGhosts() — only shows ghosts for entries with matching nucleusKey
  → StagingTrack re-renders with ALL shortlisted entries (from all constellations)
```

### Filtering vs. Shortlist Independence

```
User changes filter in constellation mode
  → FilterState updated (new instance)
  → SceneObjects.starMeshes opacity updated based on matchesFilter()
  → ShortlistStore entries NOT affected (shortlist ignores filter state)
  → Ghost meshes NOT affected (ghosts are independent of filter visibility)
  → StagingTrack NOT affected (staged stars stay staged regardless of filter)
```

### Frame Loop (unchanged structure, new state reads)

```
tick(t):
  controls.update()  [skipped if TransitionChoreographer.isTransitioning()]
  tickOrbits(sceneObjects, t, camera)
    — orbital math is UNCHANGED regardless of ViewState
    — stars continue their sphere-surface Rodrigues orbits in all states
    — the visual "flattening" in constellation mode is a camera orientation effect,
      not a geometry change: tickOrbits runs identically, camera faces the plane
    — visibility: non-focused constellation stars hidden in constellation mode
    — shortlisted stars: skip tickOrbit position update (GSAP or track controls them)
    — ghosts: tickGhosts reads from ShortlistStore, updates ghost positions via starPositionAt
  labelContainer: project nucleus labels to screen
  renderer.render(scene, camera)
```

---

## Anti-Patterns to Avoid

### 1. Transition Logic Inside ViewState

**What goes wrong:** ViewState calls `gsap.to()` inside `dispatch()`. State becomes untestable without GSAP running; transitions can't be reused or sequenced.

**Instead:** ViewState owns the truth about which state the app is in. TransitionChoreographer owns how to get there. ViewState changes on transition *completion*, not request.

### 2. Shortlist Inside SceneObjects

**What goes wrong:** ShortlistStore as a field on SceneObjects. When `buildOrbitalScene` is called for a new constellation, SceneObjects gets rebuilt and the shortlist is lost.

**Instead:** ShortlistStore is instantiated once at boot and lives at the same level as SceneObjects. Pass it as a parameter to anything that needs it.

### 3. Panel Slide via GSAP / Choreographer

**What goes wrong:** T3/T4 routed through TransitionChoreographer. The choreographer handles Three.js mesh and camera animations — it has no business managing a DOM slide transition. The panel has no camera or orbital dependency.

**Instead:** ReadingPanel owns T3/T4. It calls LayoutController directly, listens for `transitionend`, sets star gold glow on the Three.js mesh, and dispatches ViewState events. CSS transition: `transform 400ms var(--ease)`. `prefers-reduced-motion` coverage automatic via media query.

### 4. OrbitControls Left Enabled During Camera Tweens

**What goes wrong:** Camera position oscillates between GSAP target and the position OrbitControls is trying to maintain. The fight produces jitter.

**Instead:** `controls.enabled = false` at tween start. Animate `controls.target` via a proxy Vector3 with `onUpdate: () => controls.target.copy(proxy)` — do not tween `controls.target` directly. Call `controls.update()` once on `onComplete` before re-enabling.

### 5. Assuming Orbital Geometry Changes in Constellation Mode

**What goes wrong:** Adding conditional logic to `tickOrbits` to "flatten" star positions in constellation mode (moving them to an XY disk). This contradicts the core concept and breaks the orbital math.

**Instead:** `tickOrbits` is geometry-blind to ViewState. The "flattening" is 100% a camera effect — T1 rotates the camera to face the orbital plane head-on. The rings were always circular; you were viewing them at an angle. In constellation mode, the camera is face-on to the plane: the rings look flat because they are flat from that angle, not because their geometry changed. The only geometry exclusion needed is hiding non-focused constellation stars (opacity, not position).

---

## Build Order

Dependencies determine order. Each phase can begin only when its dependencies are complete.

### Phase 1: Foundation (no rendering dependencies)

**Deliverables:**
- `src/state/view-state.ts` — discriminated union, dispatch, listener registration
- `src/data/shortlist.ts` — ShortlistStore with add/remove/has/getAll/onChange
- `src/data/filter.ts` additions — ProofType enum, ImpactScale range type
- `src/data/types.ts` additions — `proofType?: ProofType`, `impactScale?: number` derived fields

**Why first:** Pure TypeScript, no DOM, no Three.js. Unit-testable in isolation. All downstream components depend on these types existing.

**Tests:** ViewState transition table (invalid transitions throw), ShortlistStore add/remove/persistence, ProofType derivation from metrics.

---

### Phase 2: Layout Architecture

**Deliverables:**
- `src/layout/layout.ts` — LayoutController with CSS class mutations + ResizeObserver
- `src/style.css` additions — split canvas zones, divider, track zone, panel slide
- `src/scene/renderer.ts` update — resize handler wired to LayoutController callback

**Why second:** The split canvas is prerequisite to all visual transition work. T1, T2, T3 all require the zones to exist before animations can reference them.

**Dependency:** Phase 1 (ViewState drives when to call enterSplitCanvas/exitSplitCanvas)

---

### Phase 3: Camera Transitions (T1 and T5)

**Deliverables:**
- `src/scene/transitions.ts` — TransitionChoreographer skeleton with T1 and T5
- `src/scene/scene-state.ts` update — expose orbital plane normal per `NucleusOrbit` (needed for face-on camera target calculation)
- `src/main.ts` update — raycasting wires to TransitionChoreographer.runT1 instead of direct `focusSphere`

**T1 is the hardest single piece.** Getting camera orbital plane alignment right requires knowing the plane normal from the `NucleusOrbit` data and constructing the correct camera position + target such that the camera faces the orbital plane of the selected constellation. The existing `enterFocus` / `focusSphere` code is the reference, but the destination is different: face-on to the plane, not just zoomed in at an angle.

**T5 reuses T1 infrastructure** (same camera animation in reverse, 20% slower). Build T5 after T1 is proven.

**Dependency:** Phase 2 (LayoutController.enterSplitCanvas called during T1 completion)

---

### Phase 4: Star Selection + Ghost System (T2 and T6)

**Deliverables:**
- `src/scene/ghosts.ts` — GhostManager
- `src/ui/track.ts` — StagingTrack (start with Option B: Three.js meshes for track stars)
- `src/scene/transitions.ts` additions — T2 (star → track arc) and T6 (return arc)
- `src/main.ts` update — raycasting in constellation mode triggers ShortlistStore.add

**Start with Option B (Three.js track stars)** — no handoff complexity, T2/T6 are continuous mesh animations. Upgrade to Option A (SVG overlay) only if visual fidelity during T2 crossing demands it.

**Build T2 first, then T6** (T6 is the inverse, shorter, reuses ghost infrastructure).

**Dependency:** Phase 1 (ShortlistStore), Phase 2 (track zone CSS exists), Phase 3 (must be in constellation mode before stars can be selected)

---

### Phase 5: Reading Panel (T3 and T4)

**Deliverables:**
- `src/ui/reading-panel.ts` — command bridge panel with instrument readout, owns T3/T4
- Keyboard navigation: ← → simultaneously updates StagingTrack + ReadingPanel
- Star gold glow state: mesh material update when active in reading panel

**T3 and T4 are simpler than T1/T5** — the heavy lifting is CSS (panel slide) and HTML (readout structure). The Three.js side is only the gold glow material update on the active star mesh. ReadingPanel calls LayoutController directly; the TransitionChoreographer is not involved.

**Dependency:** Phase 4 (shortlist must exist before reading panel has anything to read), Phase 2 (panel slide CSS zones)

---

### Phase 6: Filter Enrichment (parallel-capable after Phase 4)

**Deliverables:**
- `src/ui/filter-panel.ts` update — ProofType chips + ImpactScale range slider
- Filter chip counts: live computation based on current filter state + constellation cases
- Proof Type and Impact Scale derivation applied to cases at load time

**Can be developed in parallel with Phase 5** since it has no dependency on the reading panel. Both depend on Phase 4 being stable (constellation mode must work before focused filter mode is testable).

**Dependency:** Phase 1 (ProofType type exists), Phase 3 (focused filter mode requires constellation state)

---

### Phase 7: Cross-Constellation Persistence + Polish

**Deliverables:**
- Verify shortlist survives T5 and repopulates correctly when re-entering any constellation
- Ghost visibility on re-entry: only ghosts for entries from the current constellation
- Track shows all shortlisted entries regardless of which constellation they came from
- `prefers-reduced-motion` gate audit across all six transitions
- GSAP timeline cleanup: `gsap.killTweensOf(target)` audit for any interrupted sequences

**Why last:** Requires all prior phases complete to be testable end-to-end. The cross-constellation path (enter Beauty → shortlist 2 → exit → enter Performance → shortlist 3 → track shows 5) can only be exercised after Phase 3, 4, and 5 are all working.

---

## Scalability Considerations

This is a desktop internal tool with 116 static cases. Scalability is not a constraint. The relevant concerns are:

| Concern | Approach |
|---------|----------|
| Ghost meshes accumulating | Max shortlist implicit (track width limits visible stars to ~7). Beyond ~15 ghosts, performance degrades in tick loop. Not a practical problem for 116 cases. |
| Raycasting in constellation mode | Existing pattern (intersectObjects on starMeshes) is fine. In constellation mode, only the focused constellation's stars are at full opacity; others are hidden or filtered. Narrow the raycast target array to owned stars only to avoid hitting hidden meshes. |
| GSAP timeline leaks | `gsap.killTweensOf(target)` before any new tween on a mesh that may already be animating. T6 in particular needs this — if a star is mid-T2 arc and T6 fires (user removes it), kill the T2 first. |
| Renderer resize frequency | ResizeObserver on panel open/close fires during CSS transition (multiple frames). Debounce the resize callback by 50ms or use `transitionend` to fire renderer resize only once. |

---

## Sources

- Three.js forum: OrbitControls + GSAP conflict pattern — https://discourse.threejs.org/t/gsap-orbitcontrols/35481
- Three.js forum: Camera target animation via proxy Vector3 — https://discourse.threejs.org/t/animating-camera-target-using-gsap/52486
- Existing codebase architecture analysis: `.planning/codebase/ARCHITECTURE.md`
- Design spec: `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md`
- TypeScript discriminated union FSM pattern: MEDIUM confidence — pattern is well-established in TypeScript community, implementation is straightforward without external libraries
