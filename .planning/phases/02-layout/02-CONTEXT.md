# Phase 2: Layout + ViewState Foundation — Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the structural foundation for all subsequent v3.4 phases: a flex-row split-canvas shell (Requirements 1–6, covered by Plans 01–02), a renamed ViewState machine (`entry | state1 | constellation | reading`) with `state1Mode`, and State 1 free-float behavior (Plans 01–02 existing; Plan 03 needed for R7–R8).

**Requirements are locked by SPEC.md — discussing implementation decisions only.**

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**8 requirements are locked.** See `02-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `02-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
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

**Out of scope (from SPEC.md):**
- `state2` kind in ViewState — deferred to Phase 8
- Inquiry sentence component — Phase 3
- Filter panel rebuild — Phase 4
- Gather animation and `state1Mode: 'gathered'` behavior — Phase 5 (type added here, behavior in Phase 5)
- `state1Mode: 'organized'` behavior — Phase 6 (type added here, behavior in Phase 6)
- Camera T1/T5 transitions — Phase 8
- Reading panel implementation — Phase 10 (Shift+P is a temporary smoke-test shortcut only)

</spec_lock>

<decisions>
## Implementation Decisions

These decisions are specific to Plan 03 (ViewState rename + free-float). Plans 01–02 are already specified and require no context decisions.

### SceneObjects.mode mapping
- **D-01:** `state1.free` maps to `sceneObjects.mode = 'global'` (the string `'global'` is preserved as the runtime value). This is explicit backward compatibility — all tick-loop checks (`mode === 'global'`, `mode === 'focused'`) continue to work with zero changes. The string `'global'` is an internal implementation detail for Phase 2's scope; downstream phases that add `'gathered'` / `'organized'` modes will update the mapping at their own boundary.

### Free-float wiring
- **D-02:** Free-float stars use `(0, 0, 0)` as the pseudo-nucleus center passed to `createStarOrbit()`. No new factory needed. All 116 stars drift on spheres anchored to world origin — consistent with "free galactic drift" aesthetics where stars wander around the scene center.
- **D-03:** `createStarOrbit()` is called once per star at the moment `ENTER_FIELD` fires (or in the `state1.free` activation logic), passing the star's appropriate radius and `(0,0,0)` as `nucleusCenter`. The `nucleusKey` field can be set to `''` (empty string) or a sentinel like `'__free__'` — Claude's Discretion on the exact string as long as it doesn't match any real nucleus key.

### ViewState rename scope in main.ts
- **D-04:** All `kind === 'planetary'` references rename to `kind === 'entry'`; all `kind === 'global'` references rename to `kind === 'state1'`, atomically in a single plan. Comments referencing v3.3 phase numbers (e.g., `// Phase 16-03`) are left untouched — they are historical context, not type references. TypeScript's exhaustiveness guard confirms no sites are missed at compile time.
- **D-05:** `view-state.test.ts` — all test cases that reference `{ kind: 'planetary' }` or `{ kind: 'global' }` are updated to `{ kind: 'entry' }` and `{ kind: 'state1' }` in the same plan. No test stubs or aliases.

### Nucleus hide mechanism
- **D-06:** Nucleus meshes are hidden via a GSAP opacity-0 tween over 300ms with `power1.out` easing. On `onComplete`, set `mesh.visible = false` (removes from render path, avoids draw-call overhead). Nucleus HTML label divs are hidden immediately (`el.style.display = 'none'`) without animation — labels are not Three.js objects and don't benefit from opacity tweening.
- **D-07:** Nucleus meshes remain in the scene graph (`scene.remove()` is NOT called). This makes Phase 6 restoration straightforward: set `mesh.visible = true` and tween opacity back.
- **D-08:** The tween fires once, at the moment `viewState` transitions to `{ kind: 'state1', state1Mode: 'free' }`. It is NOT triggered on every tick. A guard prevents re-triggering if `state1.free` is entered again (shouldn't happen, but defensive).

### Claude's Discretion
- Exact sentinel string for `nucleusKey` in free-float orbit objects (`'__free__'` suggested above, planner decides).
- Whether the nucleus-hide tween fires inside the ViewState subscriber in `main.ts` or inside `choreographPlanetaryToGlobal` — planner picks the location that keeps it closest to the transition choreography.
- Whether `state1Mode` field is added directly to the `state1` union member or as a separate derived accessor — SPEC says add the field, so direct union member is the baseline.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements (MANDATORY)
- `.planning/phases/02-layout/02-SPEC.md` — Locked requirements, boundaries, constraints, acceptance criteria. **Read this first.**

### Prior phase context (relevant decisions)
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-06/D-07 establish the `ENTER_FIELD` dispatch wiring and State 1 boot semantics. D-01 confirms the scope redirect from inquiry sentence.
- `.planning/phases/01.1-entry-scene-composition-globe-framing-gather-state-camera-tr/01.1-CONTEXT.md` — D-01.1-01/02 establish the `setViewOffset` framing pattern; D-01.1-04/05 document `entryFramingActive` flag and `choreographPlanetaryToGlobal` as the canonical transition choreography location.

### Design authority
- `~/Desktop/Case Study Explorer - design_handoff/README.md` — Authoritative for visual design. Phase 2 is infrastructure, but free-float aesthetic must match "free galactic drift" description in handoff.
- `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md` — Transition timing and easing curves (use for any new tween timing decisions).

### Existing code under modification
- `src/data/view-state.ts` — Current ViewState types (`planetary | global | constellation | reading`), `createViewStateMachine`, exhaustiveness guard. Plan 03 renames `planetary→entry`, `global→state1`, adds `state1Mode`.
- `src/scene/orbitals/star-orbit.ts` — `createStarOrbit(nucleusKey, nucleusCenter, ...)` factory. Plan 03 calls this with `(0,0,0)` as `nucleusCenter` for free-float mode.
- `src/main.ts` — ViewState subscriber (~line 261–320), tick loop mode checks, `kind === 'planetary'` / `kind === 'global'` sites (~8 total). Plan 03 updates all.
- `src/animation/transition-choreographer.ts` — `choreographPlanetaryToGlobal` function. Plan 03 may add nucleus-hide tween here (Claude's Discretion on exact location).

### Token reference
- `src/style.css` — `--ease: cubic-bezier(0.16, 1, 0.3, 1)` (single easing token). Nucleus tween uses `power1.out` (GSAP native) per D-06 — not `--ease` because the disappear doesn't need the snappy spring feel.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createStarOrbit(nucleusKey, nucleusCenter, radius, speed, phase)` — already exists; free-float reuse with `(0,0,0)` center requires no API change
- `choreographPlanetaryToGlobal(objects, prefersReduced)` — already contains GSAP tween orchestration; nucleus-hide tween slots in naturally
- `sceneObjects.nucleusMeshes: Map<string, THREE.Mesh>` — directly iterable for the hide tween
- `sceneObjects.nucleusLabels: Map<string, HTMLDivElement>` — directly iterable for label hide

### Established Patterns
- ViewState subscriber in `main.ts` listens via `viewState.subscribe(listener)` — Plan 03's rename updates all `kind` checks inside this listener
- GSAP tween targeting `mesh.material.opacity` is the established pattern for Three.js material animation (see Phase 01.1 star-reveal tween)
- `prefersReduced` scaling: duration × `s` where `s = prefersReduced ? 0.33 : 1.0` — apply to nucleus-hide tween duration

### Integration Points
- ViewState subscriber at `main.ts` ~line 265 is where `sceneObjects.mode` is set — Plan 03's mapping decision (D-01) implements here
- `ENTER_FIELD` from `entry` kind → `{ kind: 'state1', state1Mode: 'free' }` is the trigger for nucleus hide
- Existing `isStagingTarget` flag on `star.userData` gates tick-loop control — free-float stars use this same gate; no change needed

</code_context>

<specifics>
## Specific Ideas

- Nucleus-hide tween location: user said "you decide" — recommendation is inside `choreographPlanetaryToGlobal` right after the planet-sphere fade starts (parallel tween), so all Entry→State1 visual changes live in one choreography function.
- `state1Mode` type values: `'free' | 'gathered' | 'organized'` — types added in Phase 2, `gathered` and `organized` behaviors in Phases 5–6 per SPEC.
- Free-float orbit radius: each star should use its existing orbital radius (preserved from v3.3 initialization), not a hardcoded value.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-layout*
*Context gathered: 2026-04-28*
