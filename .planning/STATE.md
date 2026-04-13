---
gsd_state_version: 1.0
milestone: v3.1
milestone_name: milestone
status: in-progress
stopped_at: Completed 06-02-PLAN.md (ReadingPanel component)
last_updated: "2026-04-13T19:31:22.109Z"
last_activity: "2026-04-13 (session 6) — Plan 06-02 executed: ReadingPanel class + main.ts wiring (190 tests)"
progress:
  total_phases: 8
  completed_phases: 1
  total_plans: 18
  completed_plans: 7
  percent: 39
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-13)

**Core value:** A prospect-facing discovery tool that lets you build a pitch deck's worth of proof in 60 seconds.
**Current focus:** Phase 6 in progress — 06-02 done (ReadingPanel component)

## Current Position

Phase: 6 in progress (2 of 4 plans done)
Plan: 06-02 complete — ReadingPanel class + main.ts wiring (star click, Esc, arrow guard)
Status: Execute Phase 6 plan 06-03 next (Track Selection / Shortlist)
Last activity: 2026-04-13 (session 6) — Plan 06-02 executed: ReadingPanel class + main.ts wiring (190 tests)

Progress: [████░░░░░░] 39%

## Phase 5 Plan Structure

| Plan | Wave | Type | Requirements | Files |
|------|------|------|-------------|-------|
| 05-01 | 1 | tdd | FILT-02, FILT-03 | filter.ts, filter-counts.ts, tests |
| 05-02 | 2 | execute | FILT-01, FILT-08, FILT-10 | filter-panel.ts, style.css, filter-panel.test.ts |
| 05-03 | 2 | execute | FILT-04, FILT-05, FILT-06, FILT-09 | scene-state.ts, staging.test.ts |
| 05-04 | 3 | execute | FILT-07 | scene-state.ts + human checkpoint |

Wave 1 → Wave 2 (02 and 03 parallel) → Wave 3

## What Was Built (through Phase 5)

| Phase | Tests After | Key Deliverables |
|-------|-------------|-----------------|
| 0 Pre-work | 33 | GSAP tween cleanup, Vec3 GC fix, staging position unification |
| 1 Foundation | 89 | ViewState machine, ShortlistStore, ProofType, ImpactScale, StarState, EnrichedCaseStudy, boot wiring |
| 2 Layout | 95 | Split canvas (#app-shell flex), ResizeObserver, LayoutController, coordinate fixes, Shift+P test shortcut |
| 3 Camera Transitions | 101 | camera-controls v3.1.2, TransitionChoreographer (GSAP proxy pattern), T1/T5, transition lock on 6 input paths |
| 4 Concentric Orbits | 117 | Ring math (concentric.ts), expansion/contraction, ring lines (THREE.LineLoop), ring click highlight, ring labels, ring dimension switcher, ordinal sorting |
| 5 Filter Panel + Staging Sphere | 153 | Accordion filter panel (5 dims), cross-filter counts, staging sphere (global filter), T1 via staging click, focused filter dimming, orbit-by switcher, status bar |

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
- [Phase 05-filter-panel-staging-sphere]: Filter panel signature kept unchanged; allCases from nucleusOrbits.flatMap; per-file jsdom directive
- [Phase 05-03]: scene field added to SceneObjects to enable applyFilter to add/remove staging sphere mesh without a scene parameter
- [Phase 05-03]: Staging NucleusOrbitData uses speed=0 orbitR=0 for static sphere positioned by mesh.position
- [Phase 05-filter-panel-staging-sphere]: Tick loop focused opacity defers to userData.starState — recomputing every frame defeated GSAP material tweens
- [Phase 05-filter-panel-staging-sphere]: StarState precedence gate in applyFilter focused branch: only idle/filterDim/filterMatch overwritten; reading/selected/ghost untouched
- [Phase 06-reading-panel-track-selection]: OPEN_READING/CLOSE_READING placed above ENTER/EXIT in dispatch chain; emissive gold written per-frame in tick loop (consistent with opacity-per-frame pattern); Phase 5 stub tests replaced alongside the stubs
- [Phase 06]: ShortlistTrack optional getCaseLabel keeps component testable without CaseStudy objects
- [Phase 06]: syncShortlistToStarState only resets 'selected'→'idle'; filterDim/filterMatch owned by applyFilter
- [Phase 06]: ReadingPanel targets #reading-panel-slot (flex child) not #panel (old overlay) — causes scene compression
- [Phase 06]: Star clicks in global mode fall through; only focused mode opens reading panel
- [Phase 06]: Arrow key guard is a stub in main.ts; full case cycling via arrow keys is Wave 3 (06-04)

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

### Immediate: Execute Phase 6 (Reading Panel + Track Selection)
Run `/gsd:execute-phase 6` to begin Phase 6.
- Click case → reading panel slides in from right; Shortlist track in bottom zone

### Phase 5 Complete
- 05-01: FilterState extended + cross-filter counts (130→153 tests), commits: 0ce0b77, 0cdc306
- 05-02: Accordion filter panel UI + chip counts in both views
- 05-03: Staging sphere lifecycle (global filter → coral sphere → T1 focus)
- 05-04: Focused filter dimming + tick loop fix (FILT-07), commit: e31c14d
- Visual checkpoint approved: all five flows confirmed working

### Phase 7: Polish + Accessibility

## Session Continuity

Last session: 2026-04-13T19:31:22.090Z
Stopped at: Completed 06-02-PLAN.md (ReadingPanel component)
Resume with: `/gsd:execute-phase 6`
