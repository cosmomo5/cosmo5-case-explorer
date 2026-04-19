---
gsd_state_version: 1.0
milestone: v3.3
milestone_name: — Resolve the Observatory
status: phase-20-ui-spec-approved-ready-to-plan
stopped_at: "Phase 20 (Gather as Staging Action) UI-SPEC approved by gsd-ui-checker 6/6 dimensions at commit c050245. 5-state Gather button contract: disabled-no-filter / disabled-zero-match / armed / staged-current (inert) / staged-drifted / stranded. Uses only existing project tokens (--gold, --teal, DM Mono, single --ease). Hairline register per BYLD canon. No new color tokens, no third-party components. 20 machine-verifiable assertions for planner/executor/checker downstream. Non-blocking flag deferred to planner: view-state gating can be CSS body-class (requires adding body.reading toggle) or JS conditional render — planner picks based on existing-pattern consistency. Previous: Phase 20 CONTEXT.md (14 decisions) committed 0fc8501."
last_updated: "2026-04-19T21:30:00.000Z"
last_activity: 2026-04-19
progress:
  total_phases: 17
  completed_phases: 11
  total_plans: 49
  completed_plans: 40
  percent: 82
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-17), `.planning/MILESTONE-v3.3.md` (finalized 2026-04-17), `.planning/MILESTONE-v3.2.md` (predecessor, shipped 2026-04-17).

**Core value (unchanged from v3.2):** A considered internal place where the Cosmo5 strategy/sales team builds, returns to, and studies their mental library of proof. A showcase of the agency's accomplishments that the team itself inhabits across sessions. Closer to a museum's study room than a pitch deck.

**Aesthetic premise (unchanged):** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*

**Current focus (v3.3):** Resolve the Observatory. UI/UX polish pass. v3.2 shipped the moves but none are resolved in actual use. v3.3 fixes position, hierarchy, consistency, and scene legibility so the 60–90s internal flow lands. Not a feature milestone — polish, removal, repositioning.

## Current Position

Phase: 20 (Gather as Staging Action) — context + UI-SPEC ready, ready to plan
Plan: Not started — next command: `/gsd-plan-phase 20`
**UI-SPEC approved 2026-04-19 by gsd-ui-checker (6/6 dimensions passed).** See `.planning/phases/20-gather-as-staging-action/20-UI-SPEC.md` for the locked visual/interaction contract.
**Phase 19 category (closed):** feature/removal. Repurposed 2026-04-19 from brainstorm spike (text-input-drives-stars) after Mo chose filter-panel-only at intake. 3/3 plans shipped in 2 waves. Tests 287/287, build 237.32 KB gzipped (-2.05 KB). Original spike preserved as SEED-001.
**Phase 18 category (closed):** feature — query-bar/filter-panel merge. 9/9 UAT tests pass; two E2E sub-gates deferred to Mo's trusted-pointer session.
**Phase 17 category (closed):** polish (primary) + feature sliver.
**Phase 20 category (confirmed 2026-04-19 discuss-phase):** feature (decouple) + removal (highlight-across-views). 11 decisions D-01..D-11 captured autonomously per Mo's directive. Primary edit surfaces: `src/scene/scene-state.ts` `applyFilter` L408-478 + tick-loop L356-372 (gut both); `src/scene/staging.ts` (new `gather()` entry point composing existing lifecycle primitives); `src/ui/filter-panel.ts` (new 3-state Gather button); `src/data/star-state.ts` (remove `filterMatch`/`filterDim` enum values). Plan split 2-3 decided by planner based on `applyFilterWave` disposition.
**Constraint set (project-wide):** `DESIGN-STATE.md` (project root).
**Milestone:** v3.3 opened 2026-04-17. MILESTONE-v3.3.md is the source of truth. 4 of 12 phases shipped (16, 17, 18, 19); 8 remaining (20-27).
**Status:** Phase 20 context gathered autonomously; ready to plan.
**Branch:** `draft` — all v3.3 work landed here. Revisit branch consolidation before milestone close (Phase 27).
**Last activity:** 2026-04-19

Progress: [████░░░░░░░░] v3.3: 4/12 phases shipped (33%). Phase 20 context gathered, plan next.

## Decisions Locked In 2026-04-17 (v3.3 opening)

- **v3.3 premise:** The moves are all present; none of them are resolved. Polish before the flow can land.
- **Refactor posture:** After v3.3, not before. Several v3.3 changes are deletions (gathered button, depth-per-year, label slider, possibly graticule). Refactoring code being removed is wasted work. v3.4 "Tighten" option preserved but not committed.
- **Imagery (P2-D):** Deferred from v3.3. Schema hook (`imagery?: { logo, key_visual }`) preserved. Visual integration waits for content team.
- **Two brainstorm spikes:** Phase 16 (planetary overture) and Phase 19 (text-input-drives-stars) are uncommitted. Visual companion, 2–3 mockups, Mo selects, then execute inside the phase. If Mo rejects all options, phase can be deferred without disturbing the rest.
- **Kimi dispatch:** Phases 24, 25, 26 (mechanical: token audit, font audit, removals). Design-impacting phases (16, 21, 23) stay in Claude with `design-review-apparatus` at Stage 6.
- **Cross-phase invariant:** No two panels occupy the same spatial region. Verified at every phase gate from 18 onward, not just the phase's own surface.

## Branch Strategy

**Current reality (2026-04-18):** v3.3 phase-16 work landed on `draft` (11 commits). The earlier "phase-1c remains canonical" claim was v3.2 legacy — v3.3 picked up on `draft` by default and no rebase was done. Revisit branch consolidation before milestone close (phase 27).

## Carried-Forward Gates from v3.2

- **P7-01 full-flow verification:** 60–90s first-time flow (land → query → focus → read → add 3 to reading list → review / compare). Closed at v3.3 Phase 27.
- **P7-06 Vercel preview approval:** Closed at v3.3 Phase 27 after all phases ship.

## What Needs to Happen Next

### Immediate — Next Session

Phase 19 closed. Filter-panel-only is now the only filter mechanism. Bundle 237.32 KB gzipped (-2.05 KB), 287/287 tests, tsc clean.

**Phase 20 — Gather as Staging Action.** Per MILESTONE-v3.3.md §2: "Filter narrows silently; Gather click stages. Remove 'highlight filtered across all views.'" The filter no longer animates matches across all three views — it just narrows. The Gather button becomes the trigger for staging (moving selected stars to the track in focused view).

**Phase 20 discuss-phase answers (2026-04-19, autonomous):**

1. "Filter narrows silently" = zero scene reaction. No motion, no opacity change, no camera lean, no staging sphere. Only the readout count updates.
2. Gather works from both `global` and `constellation` views. Button absent from DOM in `planetary` and `reading`.
3. No Gather button exists today. This phase builds one inside the unified left column, bottom of the filter accordion, gold hairline + DM Mono, 3-state (disabled/armed/staged).
4. No direct coupling with Phase 21 (right drawer is for reading). Gather stages to the existing staging sphere. Phase 21 handles a separate surface (reading panel geometry).

Full decisions: `.planning/phases/20-gather-as-staging-action/20-CONTEXT.md` (11 decisions D-01..D-11).

**Phase 18 outstanding (not blocking Phase 20):**

Two visual E2E sub-gates still need Mo's trusted-pointer pass (raycaster ignores synthetic PointerEvents):

1. Click a nucleus in global → T1 transition runs → column auto-expands to 232px.
2. Home (⌂) or Escape from focused → column auto-collapses back to tab.

Covered at CSS + listener + unit-test level. Not blocking Phase 20 either.

**Start Phase 20 planning with:** `/gsd-plan-phase 20`

### Process notes

- **Playwright-from-Windows path (CORRECTED AGAIN 2026-04-18 evening — this one is verified).** The working path is the `playwright@claude-plugins-official` plugin, still enabled in `~/.claude/settings.json`. Its `.mcp.json` was hand-patched at `~/.claude/plugins/cache/claude-plugins-official/playwright/unknown/.mcp.json` to launch via Windows cmd.exe: `{ "command": "/mnt/c/Windows/System32/cmd.exe", "args": ["/c", "npx", "@playwright/mcp@latest"] }`. That routes the MCP server process through a Windows shell so Playwright picks up Windows Chrome. Tools surface as `mcp__plugin_playwright_playwright__browser_*`. Verified 2026-04-18 evening: `navigator.userAgent === 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Chrome/147.0.0.0'`, `navigator.platform === 'Win32'`. The earlier claim in this STATE.md that the plugin was disabled and a separate `Thales/.mcp.json` server was registered turned out to be wrong (the sanctioned server never registered; the plugin edit 7 minutes later is what actually worked). The plugin's patched `.mcp.json` is in the plugin cache and will be overwritten if the plugin updates — re-apply after any plugin reinstall. See memory note: `~/.claude/projects/-mnt-c-Users-moham-Documents-Thales-work-technical/memory/playwright_mcp_windows_fix.md`.
- **Allowlist.** `~/.claude/settings.json` permissions allowlist covers `mcp__playwright__*` (sanctioned path, unused) but not `mcp__plugin_playwright_playwright__*` (working path). Calls are permitted under auto mode; update the allowlist to match reality if auto mode is off and prompts get noisy.
- **Always verify before driving.** First call in any session that will drive UAT: `mcp__plugin_playwright_playwright__browser_navigate` to `about:blank`, then `browser_evaluate` UA probe. Pass: `ua` contains `Windows NT`, `platform === 'Win32'`. Fail: anything `Linux`/`X11` → stop, don't drive UAT. Don't assume Windows-Chrome is live just because tools are registered.
- **GSD rhythm:** UAT runs via `/gsd-verify-work` → gap discovery → UAT.md. No ad-hoc inline execution inside an active GSD phase.

Mockups reviewed: `.superpowers/brainstorm/632869-1776450920/content/index.html` (A+C combo selected).

### Milestone Arc (v3.3)

12 phases (16–27). Each = one commit surface, verification gate before next. Executed via `/gsd-execute-phase`. Design-impacting phases (16, 21, 23) in Claude; mechanical phases (24, 25, 26) dispatched to Kimi.

See MILESTONE-v3.3.md for the phase table, critical files, reuse opportunities, and milestone close criteria.

## Design Direction (Authoritative, unchanged)

`/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`. Three references: Kunumi (structure), BYLD (register), Cosmo5 (foundation). v3.3 is polish of the v3.2 execution — no new direction, resolution of existing moves.

## v3.2 Context (Predecessor — Completed 2026-04-17)

Phases 8–15. Shipped: clean substrate, CRT graticule + calibrating loader, query bar + keyword mapping, reading panel as instrument, reading list + Review Mode + Comparison Mode, hero collapse, edge states, accessibility audit. 248 tests passing. Build 237KB gzipped (29% of budget). OG meta in place. See MILESTONE-v3.2.md.

## Session Continuity

Last session: 2026-04-19T20:48:04.958Z

Stopped at: Phase 20 UI-SPEC approved 6/6 dimensions. Ready to plan.

- `memory/feedback_playwright-wsl-prohibited.md`
- `memory/feedback_use-gsd-for-structured-work.md`
- `memory/playwright_mcp_windows_fix.md` (authoritative on the Playwright MCP config — use `mcp__plugin_playwright_playwright__*`, NOT raw `mcp__playwright__*`)

Known infrastructure quirk (worth flagging): `gsd-tools phase complete` used its roadmap fallback grep (`#{2,4}\s*Phase\s+N:`) which only matches `####` detail sections. v3.3 roadmap only has summary-list entries (`- [ ] **Phase X: ...**`) for phases ≥16 — so the fallback returned `is_last_phase: true` incorrectly, and STATE.md auto-wrote `Status: Milestone complete`. I manually fixed STATE.md frontmatter (`status: phase-18-code-complete-uat-pending`) and the Current Position block; ROADMAP.md correctly shows Phase 18 as `[x]`. Same bug affects `plan-phase roadmap.get-phase` which fails for v3.3 phases. Not patching — infrastructure-level fix belongs in gsd-tools itself.

Session before (2026-04-19 afternoon): Phase 18 discuss-phase and plan-phase. Captured CONTEXT.md (19 locked decisions D-01..D-19 across visibility, composition, mode-row, cleanup) and 6 plans with pattern-mapper output.

Session before that (2026-04-19 morning): Phase 17 closure (commit `c079b84`) — star-labels always-on + label-click nav + bottom-right panel view-scoping, 6 commits `0fcb9e5`→`13daa55`.

Session before that (2026-04-18 late): Phase 16 complete (planetary overture, 11 commits on draft).

Resume with: `/gsd-verify-work` (re-run 16-UAT.md gates against latest build via Playwright MCP → Windows Chrome). After UAT green: `/gsd-transition 16` → `/gsd-plan-phase 17`. If UAT red: capture failing gates, plan 16.x decimal insert to close.
