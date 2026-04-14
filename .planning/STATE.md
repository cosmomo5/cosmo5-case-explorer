---
gsd_state_version: 1.0
milestone: v3.2
milestone_name: — The Observatory Experience
status: completed
stopped_at: Completed 08-01-PLAN.md — orphaned DOM, CSS, and detail-panel.ts removed. 195 tests pass.
last_updated: "2026-04-14T20:59:28.352Z"
last_activity: "2026-04-14 — 08-02 phyllotaxis geometry module: camera-independent `computePhyllotaxisPositions`, 195 tests passing (190 + 5 new), CLN-04 complete."
progress:
  total_phases: 8
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 55
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-13) and `.planning/MILESTONE-v3.2.md` (finalized 2026-04-14).

**Core value (revised 2026-04-14):** A considered internal place where the Cosmo5 strategy/sales team builds, returns to, and studies their mental library of proof. A showcase of the agency's accomplishments that the team itself inhabits across sessions. Closer to a museum's study room than a pitch deck.

**Aesthetic premise:** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*

**Current focus (v3.2):** The Observatory Experience. Migrate the 2026-04-12 direction note moves (Kunumi query-driven navigation + BYLD analog-era precision + Cosmo5 observatory foundation) into the v3.1 phase-1c codebase, reframed for internal use with localStorage persistence, Review Mode (sequential deep reading), and Comparison Mode (adapted gather mechanic for simultaneous spatial comparison of the reading list).

## Current Position

**Phase:** 8 (Clean Substrate) — 2 of 3 plans complete
**Milestone:** v3.2 in progress. MILESTONE-v3.2.md is the source-of-truth reference.
**Status:** Phase 8 plans 01 (orphan removal) and 02 (phyllotaxis module) complete. Plan 03 (schema extension + branch strategy docs) remaining.
**Last activity:** 2026-04-14 — 08-02 phyllotaxis geometry module: camera-independent `computePhyllotaxisPositions`, 195 tests passing (190 + 5 new), CLN-04 complete.

Progress: [██████░░░░] 55% of v3.2 plans (12/22)

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
Run `/gsd:plan-phase 8`. Phase 8 (Clean Substrate) covers requirements CLN-01 through CLN-06 — orphan removal, phyllotaxis isolation for Phase 12 adaptation, schema extension for imagery, branch-strategy documentation. Expected ~3 plans.

### In Parallel (content side, not Claude's task)
Kick off content-imagery project. Name the owner. Agree cadence. Start sourcing the first batch of logos and key visuals.

### Milestone-Level
Sequence: Phase 0 → Phase 1 (atmosphere) → Phase 2 (query bar) → Phase 3 (reading panel + imagery integration) → Phase 4 (reading list + Review Mode + Comparison Mode + localStorage) → Phase 5 (hero collapse) → Phase 6 (edge states + accessibility) → Phase 7 (ship).

## Design Direction (Authoritative)

`/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`. Three references: Kunumi (structure), BYLD (register), Cosmo5 (foundation). v3.2 is the execution, reframed for internal use.

## v3.1 Context (Previous Milestone — Completed 2026-04-14)

Nine phases (0–7 + 6.5). Spatial engine: concentric orbital layout around cluster nuclei, camera-based T1/T5 transitions, ring-dimension switcher (proofType/impactBand/year/country/region), split canvas (constellation + bottom track), reading panel (command-bridge layout), shortlist track, visual warmth (star glow sprites, twinkle animation, blue-indigo nebula), accessibility audit (prefers-reduced-motion, no maximum-scale). 190 tests passing. Build clean.

## Session Continuity

Last session: 2026-04-14T20:59:28.301Z
Stopped at: Completed 08-01-PLAN.md — orphaned DOM, CSS, and detail-panel.ts removed. 195 tests pass.
Resume with: `/gsd:plan-phase 8` — or continue with content-imagery project owner assignment in parallel.
