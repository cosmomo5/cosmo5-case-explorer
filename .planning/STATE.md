---
gsd_state_version: 1.0
milestone: v3.1
milestone_name: milestone
status: Phase 6.5 Plan 01 — Tasks 1-3 complete, awaiting checkpoint:human-verify (Task 4)
stopped_at: "06.5-01 Tasks 1-3 committed (36cdf54, 205b419, 71939b2). Awaiting Mo visual verification: star glows, twinkle, nebula depth, reading-state gold. Run npm run dev at case-study-explorer, open http://localhost:5173."
last_updated: "2026-04-13T22:10:00.000Z"
last_activity: "2026-04-13 — Phase 6.5 Plan 01 executed: MeshBasicMaterial stars, canvas-texture glow sprites, twinkle animation, blue-indigo nebula gradients. 190 tests pass."
progress:
  total_phases: 9
  completed_phases: 7
  total_plans: 18
  completed_plans: 18
  percent: 78
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-13)

**Core value:** A prospect-facing discovery tool that lets you build a pitch deck's worth of proof in 60 seconds.
**Current focus:** Phase 6.5 — restore visual warmth (star glows, twinkle, nebula atmosphere)

## Current Position

Phase: 6.5 (Visual Warmth) — Plan 01 tasks 1-3 committed, awaiting visual checkpoint
Plan: 06.5-01-PLAN.md (Task 4 checkpoint:human-verify pending)
Status: MeshBasicMaterial stars, glow sprites, twinkle animation, blue-indigo nebula all landed. 190 tests pass.
Last activity: 2026-04-13 — Visual warmth code complete. Awaiting Mo's visual verification before closing plan.

Progress: [███████░░░] 78%

## What Needs to Happen Next

### 1. Phase 6.5: Visual Warmth — CHECKPOINT PENDING

**Tasks 1-3 complete.** Mo needs to visually verify at `http://localhost:5173` (run `npm run dev`):
- Star glows: soft halo ~7x beyond mesh sphere
- Twinkle: individual stars flicker at different rates over 5-10 seconds
- Nebula: visible atmospheric blobs (not flat near-black)
- Reading state: click a case star, it glows gold; close panel, returns to normal
- Overall: first word should NOT be "cold"

After Mo types "approved," close the plan and advance to Phase 7.

### 2. Phase 7: Polish and Accessibility (AFTER 6.5)

Timing audit, reduced-motion, token audit, build verification, full-flow E2E test.

## Accumulated Context

### Decisions (Phases 0-4)

- camera-controls v3.1.2 replaces OrbitControls (Phase 3)
- GSAP proxy pattern for camera animation
- Concentric ring default dimension: auto-selected by normalized entropy
- Space expansion: non-focused nuclei fly outward × 4.5 during T1
- Click priority: star > ring line > nucleus > empty space
- Stars use MeshStandardMaterial + 3-light rig
- Ring labels at camera-right projection

### Decisions (Phase 5)

- Accordion filter panel (5 dims), not chip bar
- Staging sphere at centroid, coral color, 30% camera lean
- Focused view dims non-matching stars (opacity 0.12)
- Cross-filter: AND between dims, OR within dim

### Decisions (Phase 6)

- ReadingPanel targets #reading-panel-slot (not old #panel overlay)
- ViewStateMachine OPEN_READING/CLOSE_READING wired
- Tick loop fixed: MeshStandardMaterial cast, emissive gold for reading state
- ShortlistTrack in #track-zone, syncShortlistToStarState enforces precedence
- Arrow keys navigate ring cases when panel open

### Design Review Fixes Landed (2026-04-13)

- Filter panel: `display:none` by default, shown with `.on` only in constellation mode. Removed premature `.on` from boot path (main.ts:516).
- Reading panel: 200+ lines of observatory-register CSS for all `rp-*` classes (instrument readout, sections, metrics, shortlist button).
- Track zone: repositioned as 44px absolute bottom strip, gated on `body.constellation`, gold register.
- Hero/stats: `body.constellation .hero/.stats` set to `opacity:0; pointer-events:none`.
- Duplicate `.fchip` rules: Phase 5 re-declarations removed, gold-border active state preserved as single source.

### Remaining Visual Issues

- **Stars look cold** — bare MeshStandardMaterial spheres, no glow, no twinkle (Phase 6.5 scope)
- **Nebula lacks atmospheric depth** — gold at 4-6% opacity is perceptually invisible (Phase 6.5 scope)
- Nucleus halos may be oversized — check after glow sprites are added (may self-correct)

### Blockers/Concerns

- None blocking. Phase 6.5 is scoped and ready to plan.

## Session Continuity

Last session: 2026-04-13
Stopped at: CSS design review fixes landed (5 edits). Phase 6.5 context doc written, roadmap updated. 190/190 tests pass.
Resume with: Plan Phase 6.5 (`/gsd:plan-phase 6.5`), then execute. Three deliverables: star glow sprites, twinkle animation, nebula warmth.
