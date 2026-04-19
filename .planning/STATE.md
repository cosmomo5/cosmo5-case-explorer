---
gsd_state_version: 1.0
milestone: v3.3
milestone_name: — Resolve the Observatory
status: phase-19-closed-ready-to-plan-phase-20
stopped_at: "Phase 19 (Remove Query Input — Filter Panel Only) complete at commit 2ff4869. 3/3 plans shipped in 2 waves via gsd-executor worktrees: Wave 1 parallel (19-01 UI/CSS removal `7c991a0`→`40b24de`→`83f4fad`; 19-02 data-layer removal `6798bdd`→`d871fb4`→`aba3d61`→`3f9a2c3`). Post-wave-1 cleanup `bee9284` drops unused anyHintMatched local. Wave 2 (19-03 test pruning `4972d31`→`2ff4869`). Automated gates green: 287/287 tests (down from 303, -13 query-specific tests + 3 phase14 pruned); tsc clean; build success at 237.32 KB gzipped (-2.05 KB from 239.37 baseline, landing in the predicted 2-5 KB window). FilterState.searchText field, matchesFilter search branch, keyword-map searchText wiring, persistence query-history functions, CSS .query-* rules, filter-searchtext.test.ts, and query-input test blocks in unified-column.test.ts and phase14-edge-states.test.ts all deleted. Phase 18 Tests 8-9 auto-expand/collapse wiring PRESERVED. gsd-tools phase complete 19 hit the v3.3-roadmap-grep quirk again (memory note: gsd_tools_v33_roadmap_grep.md) — falsely set is_last_phase:true and status:completed. Manually corrected here; ROADMAP marked [x] 19 correctly. Phase 20 (Gather as Staging Action) is next. 4/12 v3.3 phases shipped (16, 17, 18, 19); 8 remaining (20-27)."
last_updated: "2026-04-19T20:25:00.000Z"
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

Phase: 20 (Gather as Staging Action) — ready to discuss
Plan: Not started
**Phase 19 category (closed):** feature/removal. Repurposed 2026-04-19 from brainstorm spike (text-input-drives-stars) after Mo chose filter-panel-only at intake. 3/3 plans shipped in 2 waves. Tests 287/287, build 237.32 KB gzipped (-2.05 KB). Original spike preserved as SEED-001.
**Phase 18 category (closed):** feature — query-bar/filter-panel merge. 9/9 UAT tests pass; two E2E sub-gates deferred to Mo's trusted-pointer session.
**Phase 17 category (closed):** polish (primary) + feature sliver.
**Phase 20 category (opening):** feature — Gather as Staging Action. Filter narrows silently; Gather click stages. Remove "highlight filtered across all views." Category to be confirmed at discuss-phase (likely pure feature, no spike).
**Constraint set (project-wide):** `DESIGN-STATE.md` (project root).
**Milestone:** v3.3 opened 2026-04-17. MILESTONE-v3.3.md is the source of truth. 4 of 12 phases shipped (16, 17, 18, 19); 8 remaining (20-27).
**Status:** Phase 19 closed; ready to discuss Phase 20.
**Branch:** `draft` — all v3.3 work landed here. Revisit branch consolidation before milestone close (Phase 27).
**Last activity:** 2026-04-19

Progress: [████░░░░░░░░] v3.3: 4/12 phases shipped (33%). Phase 20 next.

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

**Open questions for Phase 20 discuss-phase:**

1. What exactly does "filter narrows silently" mean — opacity change only, no motion / scene reflow?
2. Does Gather work from the focused view only, or also from global?
3. How is the Gather button currently wired vs. how it should be wired post-phase?
4. Is there a cross-phase invariant with Phase 21 (reading panel → right drawer) — i.e., should Gather output go to the drawer eventually?

**Phase 18 outstanding (not blocking Phase 20):**

Two visual E2E sub-gates still need Mo's trusted-pointer pass (raycaster ignores synthetic PointerEvents):

1. Click a nucleus in global → T1 transition runs → column auto-expands to 232px.
2. Home (⌂) or Escape from focused → column auto-collapses back to tab.

Covered at CSS + listener + unit-test level. Not blocking Phase 20 either.

**Start Phase 20 with:** `/gsd-discuss-phase 20`

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

Last session: 2026-04-19 late (/gsd-execute-phase 18 end-to-end — 6 plans, 3 waves, post-execution cleanup + D-02 hotfix)

Stopped at: Phase 18 (Unified Left Column) code-complete. 6 plans × 3 waves executed via gsd-executor worktrees: Wave 1 (18-01 HTML/CSS cleanup `498390e`→`d222307`, 18-02 new unified-column CSS `d0df2a3`→`8f3fea5`). Wave 2 (18-03 filter-panel.ts absorbs input/readout/history/hint `97cc81f`→`8156f56`, 18-04 main.ts caller updates + auto-expand listener `5483bea`→`5b08ede`). Wave 3 (18-05 delete query-bar.ts `2052108`→`7e313b8`, 18-06 split tests unified-column.test.ts + delete dead query-bar.test.ts `b697609`→`b8dff3f`). Post-execution cleanup `1267706` drops dead clusters-count.test.ts + Wave-2 backward-compat branch in mountFilterPanel. Post-verify D-02 hotfix `e8fe08f`: moves `.collapsed` class add from dead boot-time check (initial viewState was 'planetary', not 'global') into the overture-complete callback — caught via Playwright UAT probe. gsd-verifier `a22892e` passed 13/13 must-haves + all 8 QRY-IDs at `718deaf` (pre-hotfix code-level PASS; hotfix was not re-verified). Automated gates green: 303/303 tests, tsc clean, build 239.37 KB gzipped (-0.43 KB from baseline 239.80). D-01 visual UAT confirmed via Playwright this session; D-02..D-05 deferred to Mo's Windows Chrome session. Feedback memories unchanged and still apply:

- `memory/feedback_playwright-wsl-prohibited.md`
- `memory/feedback_use-gsd-for-structured-work.md`
- `memory/playwright_mcp_windows_fix.md` (authoritative on the Playwright MCP config — use `mcp__plugin_playwright_playwright__*`, NOT raw `mcp__playwright__*`)

Known infrastructure quirk (worth flagging): `gsd-tools phase complete` used its roadmap fallback grep (`#{2,4}\s*Phase\s+N:`) which only matches `####` detail sections. v3.3 roadmap only has summary-list entries (`- [ ] **Phase X: ...**`) for phases ≥16 — so the fallback returned `is_last_phase: true` incorrectly, and STATE.md auto-wrote `Status: Milestone complete`. I manually fixed STATE.md frontmatter (`status: phase-18-code-complete-uat-pending`) and the Current Position block; ROADMAP.md correctly shows Phase 18 as `[x]`. Same bug affects `plan-phase roadmap.get-phase` which fails for v3.3 phases. Not patching — infrastructure-level fix belongs in gsd-tools itself.

Session before (2026-04-19 afternoon): Phase 18 discuss-phase and plan-phase. Captured CONTEXT.md (19 locked decisions D-01..D-19 across visibility, composition, mode-row, cleanup) and 6 plans with pattern-mapper output.

Session before that (2026-04-19 morning): Phase 17 closure (commit `c079b84`) — star-labels always-on + label-click nav + bottom-right panel view-scoping, 6 commits `0fcb9e5`→`13daa55`.

Session before that (2026-04-18 late): Phase 16 complete (planetary overture, 11 commits on draft).

Resume with: `/gsd-verify-work` (re-run 16-UAT.md gates against latest build via Playwright MCP → Windows Chrome). After UAT green: `/gsd-transition 16` → `/gsd-plan-phase 17`. If UAT red: capture failing gates, plan 16.x decimal insert to close.
