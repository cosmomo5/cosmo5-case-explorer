---
gsd_state_version: 1.0
milestone: v3.2
milestone_name: — The Observatory Experience
status: planning
stopped_at: Completed 12-05-PLAN.md — Comparison Mode with phyllotaxis formation. 242 tests passing, tsc clean.
last_updated: "2026-04-16T15:41:51.734Z"
last_activity: "2026-04-16 — 12-05: Comparison Mode (stars fly to phyllotaxis formation for spatial side-by-side analysis). Entry animation (900ms flight, 0.08 dim), exit restoration, Esc support, EXIT button. 242 tests passing, tsc clean."
progress:
  total_phases: 8
  completed_phases: 5
  total_plans: 18
  completed_plans: 18
  percent: 86
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-13) and `.planning/MILESTONE-v3.2.md` (finalized 2026-04-14).

**Core value (revised 2026-04-14):** A considered internal place where the Cosmo5 strategy/sales team builds, returns to, and studies their mental library of proof. A showcase of the agency's accomplishments that the team itself inhabits across sessions. Closer to a museum's study room than a pitch deck.

**Aesthetic premise:** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*

**Current focus (v3.2):** The Observatory Experience. Migrate the 2026-04-12 direction note moves (Kunumi query-driven navigation + BYLD analog-era precision + Cosmo5 observatory foundation) into the v3.1 phase-1c codebase, reframed for internal use with localStorage persistence, Review Mode (sequential deep reading), and Comparison Mode (adapted gather mechanic for simultaneous spatial comparison of the reading list).

## Current Position

**Phase:** 12 (Reading List + Review Mode + Comparison Mode) — COMPLETE. Plans 12-01, 12-02, 12-03, 12-04, 12-05 done.
**Milestone:** v3.2 in progress. MILESTONE-v3.2.md is the source-of-truth reference.
**Status:** Ready to plan
**Last activity:** 2026-04-16 — 12-05: Comparison Mode (stars fly to phyllotaxis formation for spatial side-by-side analysis). Entry animation (900ms flight, 0.08 dim), exit restoration, Esc support, EXIT button. 242 tests passing, tsc clean.

Progress: [████████████░] 86% of v3.2 plans (28/30) — Phase 12 complete (5/5 plans)

## Decisions Locked In 2026-04-14 (Q1–Q5 resolutions)

- **Q1 — Premise:** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*
- **Q2 — Branch strategy:** phase-1c canonical. Hybrid approach: consult `draft/v3-starmap` as spec, rewrite in phase-1c. Guardrail: import v3-starmap moves only if phase-1c re-implementation improves on or matches them.
- **Q3 — Terminal action:** REFRAMED. Primary user = internal team, not prospect. No Compile/Share. Instead: Review Mode (sequential paginated reader) + localStorage persistence (reading list, query history, recently viewed). Welcome-back state on return.
- **Q4 — Imagery:** Commissioned as parallel content project. Schema extended with optional `imagery?: { logo, key_visual }`. Assets land in `public/case-imagery/<case-slug>/`. Permission-false cases suppress imagery, show `[CONFIDENTIAL]` readout.
- **Q5 — Gather:** NOT retired. Adapted to Comparison Mode for reading list (≥3 items). Phyllotaxis formation at center, other stars dim heavily, spatial simultaneous view of curated set. Complements Review Mode (sequential) vs Comparison (simultaneous).

## Branch Strategy (locked 2026-04-14, Q2 resolution)

phase-1c is canonical. draft/v3-starmap is specification-only.

Each v3.2 plan that imports a v3-starmap move names:
- What v3-starmap did (with commit SHA reference)
- What phase-1c will do (adapted implementation)
- Whether this improves or contorts phase-1c

Guardrail: if phase-1c contorts to match v3-starmap's shape, stop and design fresh.

Import decisions by move:
- Query input + keyword mapping → import as spec (Phase 10)
- CRT radial grid substrate → import as spec (Phase 9)
- Instrument-calibrating loader → import as spec (Phase 9)
- Phyllotaxis geometry → import as spec (Phase 8, for Phase 12 use)
- Affinity clustering → skip (concentric supersedes)
- Phyllotaxis gather as filter-trigger → skip (adapted for Comparison Mode in Phase 12)

## Blockers and Contingencies

**Content-imagery project (Q4) needs:**
- Named owner on Cosmo5 content side (blocker/unblocker reference for Phase 3 plans).
- Delivery cadence: batched 20/week preferred (enables progressive Phase 3 integration) vs all-at-once.
- Format confirmation: SVG logos + JPG key visuals, 1200px longest edge.
- Fallback policy: if imagery can't be sourced for a case within 2 weeks, that case ships without imagery rather than blocking the phase.

**Nothing blocks Phase 0.**

## What Needs to Happen Next

### Immediate
Phase 12 complete (5/5 plans). Next: Phase 13 (Hero Collapse) — camera transition from full-galaxy T1 view to reading-list hero on focus. Requires Phase 12 (done), Phase 10 (done), Phase 9 (done), Phase 8 (done).

### In Parallel (content side, not Claude's task)
Imagery sourcing for case studies. Schema: optional imagery field with logo + key_visual. Format: SVG logos + JPG visuals, 1200px longest edge. Fallback policy: if imagery unavailable within 2 weeks, ship case without imagery.

### Milestone-Level
Completed: Phase 0–8 (foundation), Phase 9 (instrument calibration), Phase 10 (query bar), Phase 11 (reading panel instrument), Phase 12 (reading list + review + comparison).
Remaining: Phase 13 (hero collapse), Phase 6 (edge states + accessibility), Phase 7 (ship).
Sequence unfolds as: Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (moved to Phase 13) → Phase 6 → Phase 7.

## Design Direction (Authoritative)

`/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`. Three references: Kunumi (structure), BYLD (register), Cosmo5 (foundation). v3.2 is the execution, reframed for internal use.

## v3.1 Context (Previous Milestone — Completed 2026-04-14)

Nine phases (0–7 + 6.5). Spatial engine: concentric orbital layout around cluster nuclei, camera-based T1/T5 transitions, ring-dimension switcher (proofType/impactBand/year/country/region), split canvas (constellation + bottom track), reading panel (command-bridge layout), shortlist track, visual warmth (star glow sprites, twinkle animation, blue-indigo nebula), accessibility audit (prefers-reduced-motion, no maximum-scale). 190 tests passing. Build clean.

## Session Continuity

Last session: 2026-04-16T18:45:00Z
Stopped at: Completed 12-05-PLAN.md — Comparison Mode with phyllotaxis formation. 242 tests passing, tsc clean.
Resume with: Phase 12 complete (5/5 plans). Run `/gsd:execute-phase 13 01` to begin Phase 13 (Hero Collapse).
