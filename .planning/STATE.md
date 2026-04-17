---
gsd_state_version: 1.0
milestone: v3.2
milestone_name: — The Observatory Experience
status: awaiting-human-gate
stopped_at: Phases 13, 14, and Phase 15 automatable portion complete. Blocked on P7-01 (Mo or internal-user flow verification) and P7-06 (Vercel preview visual approval). 248 tests passing, build 237KB gzipped (29% of 800KB budget), OG meta in place, tsc clean.
last_updated: "2026-04-17T13:50:00.000Z"
last_activity: "2026-04-17 — Phases 13 + 14 + Phase 15 (automatable) shipped in one session. Phase 13: hero + stats removed, ambient catalog readout added. Phase 14: empty-state hint, no-match dim to 0.08 with broader-term suggestions, error state (CATALOG / CONNECTION LOST [RETRY]), narrow-viewport fallback, motion/keyboard/ARIA audit. Phase 15: OG/Twitter meta added, bundle + tests + WCAG self-check clean. Advisor corrections applied: dead-code queue removed from choreographer, FilterState.isActive() ripple audited, 6 new edge-state tests added (248 total). Error state, narrow-viewport, and no-match state visually verified in Playwright."
progress:
  total_phases: 8
  completed_phases: 7
  total_plans: 30
  completed_plans: 30
  percent: 100
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-13) and `.planning/MILESTONE-v3.2.md` (finalized 2026-04-14).

**Core value (revised 2026-04-14):** A considered internal place where the Cosmo5 strategy/sales team builds, returns to, and studies their mental library of proof. A showcase of the agency's accomplishments that the team itself inhabits across sessions. Closer to a museum's study room than a pitch deck.

**Aesthetic premise:** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*

**Current focus (v3.2):** The Observatory Experience. Migrate the 2026-04-12 direction note moves (Kunumi query-driven navigation + BYLD analog-era precision + Cosmo5 observatory foundation) into the v3.1 phase-1c codebase, reframed for internal use with localStorage persistence, Review Mode (sequential deep reading), and Comparison Mode (adapted gather mechanic for simultaneous spatial comparison of the reading list).

## Current Position

**Phase:** 14 (Edge States) — COMPLETE. Six plans done: P14-01 empty-hint, P14-02 no-match, P14-03 error, P14-04 narrow-viewport, P14-05 motion/keyboard/ARIA audit, P14-06 choreographer queue.
**Milestone:** v3.2 in progress. MILESTONE-v3.2.md is the source-of-truth reference.
**Status:** Ready to ship (Phase 15)
**Last activity:** 2026-04-17 — Phases 13 + 14 shipped. Empty-state hint under query. No-match state deepens field dim to 0.08, offers three broader-term suggestions (performance / brand / social media) as clickable chips. Error state freezes loader at "CATALOG / CONNECTION LOST [RETRY]" with functional retry. Narrow-viewport (<768px) shows desktop-only notice. Motion/keyboard/ARIA audit: all v3.2 animations covered by global prefers-reduced-motion rule; focus-visible rings on new buttons; aria-live on queryHint; role=alert on loader error and narrow-viewport. Choreographer now supports queue-to-completion (guards preserve existing UX). Bug fix: FilterState.isActive() now includes searchText. 242 tests, build clean, Playwright visual verified.

Progress: [██████████████] 100% of v3.2 plans — Phases 13 + 14 complete (8 plans). Only Phase 15 (Ship) remains.

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

### Immediate — Blocked on Mo
Phase 15 automatable items complete:
- P7-02 visual regression: nebula/stars/glow intact (confirmed via Playwright screenshots of v3.2 vs v3.1 engine).
- P7-03 WCAG 2.1 AA self-check: no `maximum-scale`, `prefers-reduced-motion` gated globally, keyboard complete, ARIA labels on all interactive elements.
- P7-04 build + bundle: clean; 237KB gzipped JS (29% of 800KB budget); 7.76KB gzipped CSS; 248 tests green.
- P7-05 OG meta + social tags: added (og:title, og:description, og:image, og:type=website, twitter:card=summary_large_image). `/og-image.png` path is a placeholder — content team provides the asset.

Remaining — needs Mo:
- P7-01 full-flow verification. The spec says Mo or an internal-user tester opens a fresh browser, completes land → query → focus → read → add 3 to reading list → review / compare. Target ≤90s for first-time user, 60s for practiced. Claude cannot close this gate.
- P7-06 Vercel preview deploy + Mo's visual approval. The ship decision is Mo's.

Handoff: `/project-prime` picks this up; the work log + screenshots in `.playwright-mcp/` document what shipped.

### In Parallel (content side, not Claude's task)
Imagery sourcing for case studies. Schema: optional imagery field with logo + key_visual. Format: SVG logos + JPG visuals, 1200px longest edge. Fallback policy: if imagery unavailable within 2 weeks, ship case without imagery.

### Milestone-Level
Completed: Phase 0–8 (foundation), Phase 9 (instrument calibration), Phase 10 (query bar), Phase 11 (reading panel instrument), Phase 12 (reading list + review + comparison), Phase 13 (hero collapse), Phase 14 (edge states + accessibility).
Remaining: Phase 15 (ship).

## Design Direction (Authoritative)

`/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`. Three references: Kunumi (structure), BYLD (register), Cosmo5 (foundation). v3.2 is the execution, reframed for internal use.

## v3.1 Context (Previous Milestone — Completed 2026-04-14)

Nine phases (0–7 + 6.5). Spatial engine: concentric orbital layout around cluster nuclei, camera-based T1/T5 transitions, ring-dimension switcher (proofType/impactBand/year/country/region), split canvas (constellation + bottom track), reading panel (command-bridge layout), shortlist track, visual warmth (star glow sprites, twinkle animation, blue-indigo nebula), accessibility audit (prefers-reduced-motion, no maximum-scale). 190 tests passing. Build clean.

## Session Continuity

Last session: 2026-04-17
Stopped at: Phases 13, 14, and Phase 15 automatable portion shipped. 248 tests. Blocked on Mo for P7-01 (flow verification) and P7-06 (Vercel preview approval).
Resume with: Mo runs through the 60-90s flow and approves a Vercel preview, then v3.2 ships.
