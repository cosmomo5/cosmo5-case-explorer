# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-13)

**Core value:** A prospect-facing discovery tool that lets you build a pitch deck's worth of proof in 60 seconds.
**Current focus:** Phase 5 planned — ready to execute

## Current Position

Phase: 5 planned (4 complete)
Plan: 4 plans in 3 waves, all created and committed
Status: Ready for `/gsd:execute-phase 5`
Last activity: 2026-04-13 (session 3) — Phase 5 plan created (4 plans, FILT-01 through FILT-10)

Progress: [██████░░░░] 68% (Phase 5 planned, not yet executed)

## Phase 5 Plan Structure

| Plan | Wave | Type | Requirements | Files |
|------|------|------|-------------|-------|
| 05-01 | 1 | tdd | FILT-02, FILT-03 | filter.ts, filter-counts.ts, tests |
| 05-02 | 2 | execute | FILT-01, FILT-08, FILT-10 | filter-panel.ts, style.css, filter-panel.test.ts |
| 05-03 | 2 | execute | FILT-04, FILT-05, FILT-06, FILT-09 | scene-state.ts, staging.test.ts |
| 05-04 | 3 | execute | FILT-07 | scene-state.ts + human checkpoint |

Wave 1 → Wave 2 (02 and 03 parallel) → Wave 3

## What Was Built (through Phase 4)

| Phase | Tests After | Key Deliverables |
|-------|-------------|-----------------|
| 0 Pre-work | 33 | GSAP tween cleanup, Vec3 GC fix, staging position unification |
| 1 Foundation | 89 | ViewState machine, ShortlistStore, ProofType, ImpactScale, StarState, EnrichedCaseStudy, boot wiring |
| 2 Layout | 95 | Split canvas (#app-shell flex), ResizeObserver, LayoutController, coordinate fixes, Shift+P test shortcut |
| 3 Camera Transitions | 101 | camera-controls v3.1.2, TransitionChoreographer (GSAP proxy pattern), T1/T5, transition lock on 6 input paths |
| 4 Concentric Orbits | 117 | Ring math (concentric.ts), expansion/contraction, ring lines (THREE.LineLoop), ring click highlight, ring labels, ring dimension switcher, ordinal sorting |

## Accumulated Context

### Decisions

- camera-controls v3.1.2 replaces OrbitControls (Phase 3, done)
- GSAP proxy pattern for camera animation — never tween camera-controls properties directly
- Concentric ring default dimension: auto-selected by normalized entropy; user can override
- Ordinal dimensions (year, impactBand) sort by scale; categorical sort by case count
- Space expansion: non-focused nuclei fly outward × 4.5 during T1
- Click priority order: star > ring line > nucleus > empty space
- Escape/Back = step-back (clear highlight → close panel → exit focus)
- Staging center glow mesh removed (was v1 artifact at origin)

### Decisions (added session 2, 2026-04-13)

- Stars use `MeshStandardMaterial` (roughness 0.45, metalness 0.15) + 3-light rig (ambient + cool key + warm rim) for volumetric shading
- Ring labels placed at camera-right projection of each ring, not arc spread
- Non-focused stars fade to opacity 0 (not 0.04) during focus expansion — cleaner edge behavior
- Ring lines/labels fade out (300ms) before disposal on unfocus — no instant vanish
- Ring dimension switch crossfades: 300ms out, 500ms in (implemented by Sonnet coder subagent)
- Adaptive ring spacing: `max(12, min(30, round(120 / ringCount)))` px — computed from actual unique values
- `getDimensionValue` exported from `concentric.ts` — used by scene-state.ts for spacing computation

### Pending Todos

None.

### Blockers/Concerns

None.

## UI/UX Polish Status

### Done (session 2, 2026-04-13)
- ✅ Ring labels: camera-right projection per ring (not 60° arc spread)
- ✅ Non-focused halos/stars fully invisible by the time they reach screen edges (opacity 0, not 0.04)
- ✅ Ring lines/labels fade out before disposal on T5 exit (no instant vanish)
- ✅ MeshStandardMaterial on stars + 3-light rig (was MeshBasicMaterial flat)
- ✅ Adaptive ring spacing (was fixed 15px)
- ✅ Ring dimension switch crossfade

### Still Open (visual test needed)
- **T5 camera snap** — the 1.4s T5 + 1.4s nucleus contraction should be sync'd but needs visual confirmation that the camera settle feels smooth
- **Nucleus labels contextual adaptation** — global: name + count; focused: name only larger; expanding nuclei fade with them
- **Home button styling** — functional but design language not integrated
- **Ring expansion on click** — neighboring rings spread slightly when one is clicked (nice-to-have)

## What's Next

### Immediate: Execute Phase 5
Run `/gsd:execute-phase 5` — Filter Panel + Staging Sphere.
Plans at: `.planning/phases/05-filter-panel-staging-sphere/`

### Phase 6: Reading Panel + Track Selection
- Click case → reading panel slides in from right; Shortlist track in bottom zone

### Phase 7: Polish + Accessibility

## Session Continuity

Last session: 2026-04-13 (session 3)
Stopped at: Phase 5 fully planned. 4 PLAN.md files committed.
Resume with: `/gsd:execute-phase 5`
