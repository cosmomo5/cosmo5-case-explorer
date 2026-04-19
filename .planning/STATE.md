---
gsd_state_version: 1.0
milestone: v3.3
milestone_name: — Resolve the Observatory
status: phase-18-uat-complete-ready-to-transition
stopped_at: "Phase 18 (Unified Left Column) UAT complete at commit 9c0a8b7. Driven by Claude via Playwright MCP attached to Windows Chrome (UA Win32 confirmed). 9/9 tests pass: D-01 overture-hide, D-02 post-overture collapsed-to-tab (hotfix e8fe08f holds), D-03 focused-expanded (CSS cascade + listener + unit tests 8-9), D-04 reading-panel-and-column coexist (no overlap, wrap x:0-281, slot x:698-1038), D-05 auto-expand listener wiring (unified-column.test.ts tests 8-9 + CSS cascade), D-12 #ring-switcher visible (global probe + CSS rule), query input filter 116→109, no query-bar residue, cold-start clean. Two visual sub-gates deferred to Mo's trusted-pointer session (D-03 real canvas click → T1 → auto-expand; D-05 home-click → auto-collapse) — raycaster ignores synthetic PointerEvents so these require an OS-generated click; all covered by CSS cascade + unit tests. Full report at .planning/phases/18-unified-left-column/18-UAT.md. Ready for /gsd-transition 18 after Mo's ~10s trusted-pointer confirmation or defer-accept. 6 plans × 3 waves already executed; see prior STATE for commit trail. Automated gates still green: 303/303 tests, tsc clean, build 239.37 KB gzipped."
last_updated: "2026-04-19T19:50:00.000Z"
last_activity: 2026-04-19
progress:
  total_phases: 17
  completed_phases: 10
  total_plans: 46
  completed_plans: 37
  percent: 80
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-17), `.planning/MILESTONE-v3.3.md` (finalized 2026-04-17), `.planning/MILESTONE-v3.2.md` (predecessor, shipped 2026-04-17).

**Core value (unchanged from v3.2):** A considered internal place where the Cosmo5 strategy/sales team builds, returns to, and studies their mental library of proof. A showcase of the agency's accomplishments that the team itself inhabits across sessions. Closer to a museum's study room than a pitch deck.

**Aesthetic premise (unchanged):** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*

**Current focus (v3.3):** Resolve the Observatory. UI/UX polish pass. v3.2 shipped the moves but none are resolved in actual use. v3.3 fixes position, hierarchy, consistency, and scene legibility so the 60–90s internal flow lands. Not a feature milestone — polish, removal, repositioning.

## Current Position

Phase: 18 (Unified Left Column) — CODE-COMPLETE, UAT pending
Plan: All 6 plans shipped + cleanup + D-02 hotfix
**Phase 18 category (closing):** feature — query-bar/filter-panel merge. GSD spine ran full: spec→discuss→plan→execute→verify. Visual UAT for D-02..D-05 deferred to Mo's Windows Chrome session before `/gsd-transition 18`.
**Phase 17 category (closed):** polish (primary) + feature sliver. Closed via design-review apparatus + code-level tests; visual UAT deferred to end-of-milestone full check.
**Next phase:** 19 (Text-Input-Drives-Stars — brainstorm spike). Blocked on Phase 18 UAT sign-off.
**Constraint set (project-wide):** `DESIGN-STATE.md` (project root).
**Milestone:** v3.3 opened 2026-04-17. MILESTONE-v3.3.md is the source of truth. 3 of 12 phases shipped (16, 17, 18); 9 remaining (19–27).
**Status:** Phase 18 code-complete; UAT pending
**Branch:** `draft` — Phase 16, 17, 18 all landed here. Revisit branch consolidation before milestone close (Phase 27).
**Last activity:** 2026-04-19

Progress: [███░░░░░░░░░] Phases 16–18 of 12 complete. v3.3: 3/12 phases shipped (25%). Phase 19 next after UAT sign-off.

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

Phase 18 UAT closed by Claude via Playwright-MCP on Windows Chrome (commit `9c0a8b7`). 9/9 tests pass. Report at `.planning/phases/18-unified-left-column/18-UAT.md`.

**All automated gates:**

- (D-01) **Overture hides column:** `.filters-wrap` display:none, opacity:0, visibility:hidden. ✓ Confirmed 2026-04-19.
- (D-02) **Post-overture collapsed-to-tab:** `.filters-wrap.on.collapsed`, tab 49.5×71.4 at x:0 y:128, aside width ~0. ✓ Hotfix `e8fe08f` holds.
- (D-03) **Focused expanded (CSS + listener):** removing `.collapsed` yields 232px aside. Listener wiring at main.ts:274-285 + unit tests 8-9 in unified-column.test.ts. ✓ Component-level. E2E (real canvas click → T1 → auto-expand) deferred.
- (D-04) **Reading panel + column coexist:** slot open → 340px at x:698; wrap stays visible at x:0-281. No overlap. ✓
- (D-05) **Auto-expand/collapse wiring:** ✓ Component + CSS. E2E (home-click → auto-collapse) deferred.
- (D-12) **#ring-switcher both views:** Visible in global (294×12). CSS rule only hides in .comparison-active. ✓
- **Query input + no query-bar residue:** 116→109 on `ai`; 0 query-bar selectors; sole input inside .filters-wrap. ✓

**Two visual E2E sub-gates remain (need trusted pointer):**

1. Click a nucleus in global → T1 transition runs → column auto-expands to 232px with `◂ Filter` in the tab.
2. Home button (⌂) or Escape from focused → column auto-collapses back to 49.5px tab.

Raycaster ignores synthetic PointerEvents (isTrusted=false), so Claude cannot drive these from Playwright-MCP evaluate-based clicks. ~10 seconds of Mo's interactive clicking closes them.

**Step 1 — Mo's trusted-pointer pass (or defer-accept).** Start dev (`npm run dev`), open http://localhost:5173, skip overture, click a nucleus, click ⌂, done.

**Step 2 — transition.** `/gsd-transition 18` (v3.3-roadmap quirk: prior `/gsd-phase complete 18` set `next_phase: null`; Phase 19 is actually next). Then `/gsd-discuss-phase 19`.

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
