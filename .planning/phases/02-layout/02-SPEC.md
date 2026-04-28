# Phase 2: Layout + ViewState Foundation — Specification

**Created:** 2026-04-28
**Ambiguity score:** 0.138 (gate: ≤ 0.20)
**Requirements:** 8 locked

## Goal

Establish the structural foundation for all subsequent v3.4 phases: a flex-row split-canvas shell with ResizeObserver-driven renderer resize, a LayoutController for CSS class mutations, a renamed ViewState machine (`entry | state1 | constellation | reading`) with `state1Mode`, and State 1 free-float behavior (116 stars drifting freely on Rodrigues noise with no nucleus grouping after `ENTER_FIELD`).

## Background

Phase 01.1 shipped a working Entry screen and planetary choreography. The current codebase has:

- `view-state.ts` with kinds `planetary | global | constellation | reading` — v3.3 naming, incompatible with v3.4 three-state model
- `renderer.ts` using `addEventListener('resize')` + `innerWidth/innerHeight` — breaks once canvas is no longer full-viewport
- `main.ts` with direct `document.body.classList.add/remove('constellation')` mutations — no central controller
- `star-orbit.ts` with Rodrigues drift per star, but all stars orbit a nucleus — no free-float (ungrouped) mode exists
- Two fully-written plans (02-01, 02-02) covering layout infrastructure only; a third plan (02-03) is needed for ViewState + free-float

Phase 2 delivers three independently verifiable things: (1) layout shell, (2) ViewState rename, (3) free-float wiring. All downstream phases depend on these contracts being stable.

## Requirements

1. **App-shell DOM structure**: `index.html` wraps `#main-canvas`, `#divider-line`, and `#star-labels` inside `#scene-container`, with `#reading-panel-slot` as a flex sibling inside `#app-shell`.
   - Current: bare `<canvas id="main-canvas" style="position:fixed;inset:0">` and `<div id="star-labels" style="position:fixed">` — no container hierarchy
   - Target: `#app-shell` (flex-row, fixed, z-index:3) > `#scene-container` (flex:1, position:relative) + `#reading-panel-slot` (width:0, expandable). Inline `style=` attributes removed from canvas and labels.
   - Acceptance: `document.getElementById('app-shell')` returns non-null; `#main-canvas` has no inline `style` attribute; `#reading-panel-slot` is a direct child of `#app-shell`

2. **CSS flex-row layout**: `#scene-container` fills available width; `#main-canvas` fills the container; `#reading-panel-slot` expands to 340px via CSS transition on `.open` class.
   - Current: canvas uses `position:fixed;inset:0` — cannot be compressed by a flex sibling
   - Target: `#app-shell { display:flex; flex-direction:row }`, `#scene-container { flex:1; min-width:0 }`, `#main-canvas { width:100%; height:100% }`, `#reading-panel-slot.open { width:340px; transition:width 400ms var(--ease) }`
   - Acceptance: In a jsdom environment, toggling `.open` on `#reading-panel-slot` does not throw; in the browser, canvas visibly compresses when the slot opens (Shift+P smoke test passes)

3. **Divider line**: A teal-gradient horizontal rule at `top:72%` inside `#scene-container`, visible only in `body.constellation` mode.
   - Current: no divider element exists
   - Target: `<div id="divider-line">` absolutely positioned at `top:72%`, `background: linear-gradient(to right, transparent, var(--teal) 20%, var(--teal) 80%, transparent)`, `opacity:0.35`, `display:none` by default, `body.constellation #divider-line { display:block }`
   - Acceptance: `document.body.classList.add('constellation')` makes `#divider-line` display:block; removing it hides it

4. **LayoutController**: A module at `src/layout/layout-controller.ts` centralizing all CSS class mutations that affect layout state.
   - Current: `main.ts` directly calls `document.body.classList.add/remove('constellation')` — no central controller
   - Target: `createLayoutController()` returns `{ setPanelOpen(bool), setViewMode('global'|'constellation'|'reading'), dispose() }`. `setPanelOpen(true)` adds `.open` to `#reading-panel-slot` and `panel-open` to `body`. `setViewMode('constellation')` adds `body.constellation`; `setViewMode('reading')` adds both `constellation` and `reading`; `setViewMode('global')` removes both.
   - Acceptance: `layout-controller.test.ts` covers all 6 behavior cases and passes

5. **ResizeObserver renderer**: `createRenderer(canvas, container)` uses a `ResizeObserver` on the container element instead of `addEventListener('resize')`. `renderer.setSize(w, h, false)` prevents canvas CSS override.
   - Current: `createRenderer(canvas)` calls `addEventListener('resize', onResize)` and uses `innerWidth/innerHeight` — breaks when canvas is narrower than viewport
   - Target: `createRenderer(canvas: HTMLCanvasElement, container: HTMLElement)` creates `new ResizeObserver(onContainerResize).observe(container)`. Calls `onContainerResize()` once synchronously. `dispose()` calls `resizeObserver.disconnect()`. No `addEventListener('resize')` remains.
   - Acceptance: `renderer.test.ts` — mock ResizeObserver observe called with container; camera.aspect set to container.clientWidth/clientHeight; disconnect called on dispose

6. **Mouse coordinate correctness**: All three `innerWidth/innerHeight` sites in `main.ts` and `tooltip.ts` use container-relative coordinates.
   - Current: `main.ts` lines ~159 and ~179 normalize pointer events with `innerWidth/innerHeight`; `tooltip.ts` `projectToScreen` uses `innerWidth/innerHeight` for 3D→2D projection — all produce wrong coordinates when canvas is narrower than viewport
   - Target: Both pointermove and pointerup handlers use `canvas.getBoundingClientRect()`. `projectToScreen` accepts `containerWidth, containerHeight` params. Call site in main.ts tick loop passes `sceneContainer.clientWidth, sceneContainer.clientHeight`.
   - Acceptance: With `#reading-panel-slot.open`, hovering a star shows tooltip at correct position (not offset into panel area); raycasting selects the correct mesh

7. **ViewState rename**: `view-state.ts` kinds renamed `planetary→entry`, `global→state1`. `state1Mode: 'free' | 'gathered' | 'organized'` field added to `state1` kind. All callers in `main.ts` updated to use new names. `constellation` and `reading` kinds unchanged.
   - Current: kinds are `planetary | global | constellation | reading` — v3.3 naming incompatible with v3.4 three-state model
   - Target: kinds are `entry | state1 | constellation | reading`. `state1` shape: `{ kind: 'state1'; state1Mode: 'free' | 'gathered' | 'organized' }`. `ENTER_FIELD` transitions `entry → state1` (with `state1Mode: 'free'`). All `kind === 'global'` and `kind === 'planetary'` references in main.ts updated to `state1` / `entry`. TypeScript exhaustiveness guard still holds.
   - Acceptance: `view-state.test.ts` — dispatch `ENTER_FIELD` from `entry` → produces `{ kind: 'state1', state1Mode: 'free' }`; dispatch from non-`entry` still throws; existing constellation/reading transitions pass

8. **State 1 free-float**: After `ENTER_FIELD`, all 116 case-star meshes drift via Rodrigues noise with no nucleus grouping — no orbital rings, no nucleus meshes visible.
   - Current: after `ENTER_FIELD`, `choreographPlanetaryToGlobal` runs and stars end up orbiting nucleus meshes in `global` mode — orbital structure persists
   - Target: when `viewState` transitions to `{ kind: 'state1', state1Mode: 'free' }`, the scene renders without nucleus meshes and without orbital grouping. Each star uses its existing `StarOrbit` Rodrigues drift independently. Nucleus meshes and labels are hidden/removed from scene in free mode. `SceneObjects.mode` maps `state1.free → 'global'` for backward compat with downstream tick logic (or equivalent clean mapping).
   - Acceptance: After clicking "ENTER OBSERVATORY" CTA, no nucleus mesh is visible in the scene (`sceneObjects.nucleusMeshes` are either hidden or removed); at least 100 of 116 star meshes have `visible: true`; tick loop runs without error

## Boundaries

**In scope:**
- `index.html` restructuring (app-shell, scene-container, reading-panel-slot, divider-line DOM)
- `src/style.css` flex-row layout rules, divider visibility, canvas position:absolute
- `src/layout/layout-controller.ts` + `src/layout/layout-controller.test.ts`
- `src/scene/renderer.ts` ResizeObserver migration + `src/scene/renderer.test.ts`
- `src/main.ts` — createRenderer call site, mouse coord fixes, LayoutController wiring, Shift+P test shortcut
- `src/ui/tooltip.ts` — `projectToScreen` signature update
- `src/data/view-state.ts` — rename `planetary→entry`, `global→state1`, add `state1Mode`
- `src/data/view-state.test.ts` — update/extend tests for new kinds
- `src/main.ts` — update all `kind === 'planetary'` / `kind === 'global'` references to new names
- State 1 free-float wiring — hide nucleus meshes, run Rodrigues drift unattached to nuclei

**Out of scope:**
- `state2` kind in ViewState — deferred to Phase 8 (State 2 face-on rings). No stub needed.
- Inquiry sentence component (`src/ui/inquiry-sentence.ts`) — Phase 3
- Filter panel rebuild — Phase 4
- Gather animation and `state1Mode: 'gathered'` behavior — Phase 5 (type added here, behavior in Phase 5)
- `state1Mode: 'organized'` behavior — Phase 6 (type added here, behavior in Phase 6)
- Camera T1/T5 transitions — Phase 8 (camera-controls migration)
- Reading panel implementation — Phase 10 (Shift+P is a temporary smoke-test shortcut only)
- Atmosphere warm gradient — Phase 11

## Constraints

- No new npm dependencies — everything is vanilla TypeScript + native browser APIs (ResizeObserver is MDN baseline)
- `renderer.setSize(w, h, false)` — the `false` third argument is mandatory; omitting it causes Three.js to write inline `style` on the canvas, overriding CSS flex sizing
- `#star-labels` and `#main-canvas` must use `position:absolute` (not `position:fixed`) inside `#scene-container` — fixed escapes the flex container's bounds
- `src/style.css` is the active stylesheet (imported by `src/main.ts`). Do not edit `styles.css` at root (legacy, unused by v3 entry).
- All existing 321 tests must still pass after Phase 2
- Build must remain clean (`npm run build` zero errors, `tsc` zero errors)
- `state1Mode: 'gathered'` and `state1Mode: 'organized'` types are added to ViewState now but behavior is locked for downstream phases — no implementation of gathered/organized behavior in Phase 2

## Acceptance Criteria

- [ ] `document.getElementById('app-shell')` returns non-null in the browser
- [ ] `#main-canvas` has no inline `style=` attribute in `index.html`
- [ ] Toggling `body.constellation` makes `#divider-line` appear/disappear
- [ ] `layout-controller.test.ts` covers all 6 behaviors (setPanelOpen×2, setViewMode×3, dispose) and passes
- [ ] `renderer.test.ts` — ResizeObserver observe called, camera.aspect set, disconnect called on dispose — all pass
- [ ] `view-state.test.ts` — `ENTER_FIELD` from `entry` produces `{ kind: 'state1', state1Mode: 'free' }` — passes
- [ ] No `kind === 'global'` or `kind === 'planetary'` references remain in `src/main.ts` (grep returns empty)
- [ ] After CTA click in browser: no nucleus mesh visible; ≥100 star meshes have `visible: true`
- [ ] Shift+P opens `#reading-panel-slot` to 340px; canvas compresses leftward; tooltip positions remain correct
- [ ] `npm test -- --run` passes (all 321 existing + new phase tests)
- [ ] `npm run build` completes with zero errors

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                         |
|--------------------|-------|------|--------|---------------------------------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | Three deliverables, each with clear output artifact           |
| Boundary Clarity   | 0.88  | 0.70 | ✓      | state2 deferred; gathered/organized type-only; others named   |
| Constraint Clarity | 0.82  | 0.65 | ✓      | setSize false arg, position:absolute, active stylesheet named |
| Acceptance Criteria| 0.78  | 0.70 | ✓      | 11 pass/fail criteria; free-float done criterion measurable   |
| **Ambiguity**      | 0.138 | ≤0.20| ✓      | Gate passed after 3 interview rounds                          |

## Interview Log

| Round | Perspective      | Question summary                                 | Decision locked                                              |
|-------|------------------|--------------------------------------------------|--------------------------------------------------------------|
| 1     | Researcher       | Phase 2 scope vs existing plans                  | Full MILESTONE scope (layout + ViewState + free-float)       |
| 1     | Researcher       | Role of existing plans                           | Gate-check — plans cover layout only; gap confirmed          |
| 2     | Researcher       | ViewState migration strategy                     | Engineering call — clean rename, not additive                |
| 2     | Researcher       | Free-float current state                         | Rodrigues drift exists in star-orbit.ts; needs wiring only   |
| 2     | Simplifier       | Out-of-scope items                               | Inquiry sentence (Phase 3) confirmed out of scope            |
| 3     | Boundary Keeper  | state2 in Phase 2?                               | Deferred entirely — not even a type stub in Phase 2          |
| 3     | Boundary Keeper  | Free-float done criterion                        | Stars drift, no nucleus grouping, confirmed                  |
| 3     | Boundary Keeper  | Plans gap remediation                            | Add plan 02-03 for ViewState rename + free-float wiring      |

---

*Phase: 02-layout*
*Spec created: 2026-04-28*
*Next step: /gsd-discuss-phase 2 — implementation decisions (ViewState migration strategy, free-float mode wiring, SceneObjects.mode mapping)*
