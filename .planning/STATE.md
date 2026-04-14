---
gsd_state_version: 1.0
milestone: v3.2
milestone_name: The Observatory Experience
status: v3.2 initialized — PROJECT.md, MILESTONES.md, REQUIREMENTS.md, ROADMAP.md written. Ready for /gsd:plan-phase 8.
stopped_at: "v3.2 formalized in GSD system 2026-04-14. 56 requirements mapped across 8 phases (8–15). Next: /gsd:plan-phase 8."
last_updated: "2026-04-14T18:00:00.000Z"
last_activity: "2026-04-14 — v3.2 milestone initialized via new-milestone workflow. All artifacts written. Phase numbering continues from v3.1 (ended at 7, new phases 8–15)."
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-13) and `.planning/MILESTONE-v3.2.md` (finalized 2026-04-14).

**Core value (revised 2026-04-14):** A considered internal place where the Cosmo5 strategy/sales team builds, returns to, and studies their mental library of proof. A showcase of the agency's accomplishments that the team itself inhabits across sessions. Closer to a museum's study room than a pitch deck.

**Aesthetic premise:** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*

**Current focus (v3.2):** The Observatory Experience. Migrate the 2026-04-12 direction note moves (Kunumi query-driven navigation + BYLD analog-era precision + Cosmo5 observatory foundation) into the v3.1 phase-1c codebase, reframed for internal use with localStorage persistence, Review Mode (sequential deep reading), and Comparison Mode (adapted gather mechanic for simultaneous spatial comparison of the reading list).

## Current Position

**Phase:** 8 (Clean Substrate) — ready to plan
**Milestone:** v3.2 formalized in GSD system. MILESTONE-v3.2.md is the source-of-truth reference.
**Status:** PROJECT.md updated, MILESTONES.md created (v3.1 archived), REQUIREMENTS.md appended with 56 v3.2 requirements, ROADMAP.md rewritten for v3.2 with 8 phases (8–15). Ready for `/gsd:plan-phase 8`.
**Last activity:** 2026-04-14 — v3.2 milestone initialized via new-milestone workflow. Phase numbering continues from v3.1 (0–7 + 6.5 shipped; new phases 8–15).

Progress: [░░░░░░░░░░] 0% of v3.2

## Decisions Locked In 2026-04-14 (Q1–Q5 resolutions)

- **Q1 — Premise:** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*
- **Q2 — Branch strategy:** phase-1c canonical. Hybrid approach: consult `draft/v3-starmap` as spec, rewrite in phase-1c. Guardrail: import v3-starmap moves only if phase-1c re-implementation improves on or matches them.
- **Q3 — Terminal action:** REFRAMED. Primary user = internal team, not prospect. No Compile/Share. Instead: Review Mode (sequential paginated reader) + localStorage persistence (reading list, query history, recently viewed). Welcome-back state on return.
- **Q4 — Imagery:** Commissioned as parallel content project. Schema extended with optional `imagery?: { logo, key_visual }`. Assets land in `public/case-imagery/<case-slug>/`. Permission-false cases suppress imagery, show `[CONFIDENTIAL]` readout.
- **Q5 — Gather:** NOT retired. Adapted to Comparison Mode for reading list (≥3 items). Phyllotaxis formation at center, other stars dim heavily, spatial simultaneous view of curated set. Complements Review Mode (sequential) vs Comparison (simultaneous).

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

Last session: 2026-04-14
Stopped at: v3.2 milestone formalized in GSD system. PROJECT.md, MILESTONES.md, REQUIREMENTS.md, ROADMAP.md all written. Ready for Phase 8 planning.
Resume with: `/gsd:plan-phase 8` — or continue with content-imagery project owner assignment in parallel.
