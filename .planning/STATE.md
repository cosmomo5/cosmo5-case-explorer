---
gsd_state_version: 1.0
milestone: v3.3
milestone_name: — Resolve the Observatory
status: executing
stopped_at: "Phase 16 code-complete + code-verified. 16-01 + 16-02 committed retroactively from the uncommitted working tree (16-01: `da6bd3d`; 16-02: `4ea66e6` — SUMMARY.md written this session, marked `shipped-with-known-gaps` since the 2 UAT gaps were deferred to 16-03 rather than shipped resolved). 16-03 executed via gsd-executor: 8 commits `a2ad68b` → `4d8ccdb` (plus plan-docs `1a649a1`) landing calibration overture, observatory header, skippable handler, reduced-motion variant, Gap 1 closure (body.planetary chrome-hide CSS + planetaryActive scene gate), Gap 2 closure (overtureComplete flag + tick-loop widened condition). gsd-verifier returned PASS-WITH-CONDITIONS (29/29 must_haves honored, all 12 PO-* requirements traced); VERIFICATION.md at .planning/phases/16-planetary-overture/VERIFICATION.md. Automated gates green: 285/285 tests, `tsc --noEmit` clean, build 239.01 KB gzipped (10.99 KB headroom). Feedback memories unchanged and still apply:"
last_updated: "2026-04-19T17:14:34.042Z"
last_activity: 2026-04-19
progress:
  total_phases: 17
  completed_phases: 9
  total_plans: 46
  completed_plans: 31
  percent: 67
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-17), `.planning/MILESTONE-v3.3.md` (finalized 2026-04-17), `.planning/MILESTONE-v3.2.md` (predecessor, shipped 2026-04-17).

**Core value (unchanged from v3.2):** A considered internal place where the Cosmo5 strategy/sales team builds, returns to, and studies their mental library of proof. A showcase of the agency's accomplishments that the team itself inhabits across sessions. Closer to a museum's study room than a pitch deck.

**Aesthetic premise (unchanged):** *"A cosmos of proof, navigable as an atlas — observed, not advertised."*

**Current focus (v3.3):** Resolve the Observatory. UI/UX polish pass. v3.2 shipped the moves but none are resolved in actual use. v3.3 fixes position, hierarchy, consistency, and scene legibility so the 60–90s internal flow lands. Not a feature milestone — polish, removal, repositioning.

## Current Position

Phase: 18 (Unified Left Column) — EXECUTING
Plan: 1 of 6
**Category (next phase 18):** feature — query-bar/filter-panel merge is structural consolidation with UX-visible reshape. Run the GSD spine: spec → discuss → plan → execute → verify → transition. See `work-technical/.claude/rules/work-categories.md` for the loop.
**Phase 17 category (closed):** polish (primary) + feature sliver. Closed via design-review apparatus + code-level tests; visual UAT deferred to end-of-milestone full check.
**Constraint set (project-wide):** `DESIGN-STATE.md` (project root).
**Phase:** 18 (Unified Left Column) — CONTEXT GATHERED. 19 decisions + 4 follow-ups across Visibility / Composition / Mode-row / Cleanup. Ready for /gsd-plan-phase 18.
**Milestone:** v3.3 opened 2026-04-17. MILESTONE-v3.3.md is the source of truth.
**Status:** Executing Phase 18
**Branch:** `draft` — Phase 16 + 17 both landed here; Phase 18 discuss commit (44845c5) also on draft. Revisit branch consolidation before milestone close (Phase 27).
**Last activity:** 2026-04-19

Progress: [██░░░░░░░░░░] Phases 16–17 of 12 complete. v3.3: 2/12 phases shipped (~17%). Phase 18 next.

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

Phase 16 is code-complete and code-verified. The only remaining gate is visual UAT via Playwright MCP → Windows Chrome.

**Step 0 (blocking) — UA probe.** First call: `mcp__plugin_playwright_playwright__browser_navigate` to `about:blank`, then `browser_evaluate` `() => ({ ua: navigator.userAgent, platform: navigator.platform })`. Pass: `ua` contains `Windows NT`, `platform === 'Win32'`. Fail: anything `Linux`/`X11` → stop, don't drive UAT.

**Step 1 — visual UAT.** `/gsd-verify-work` re-runs the 16-UAT.md gates:

- (a) **At boot**, `.wordmark-corner`, `#queryWrap`, `#catalogReadout`, `#crumb`, `#filtersWrap`, `#cosmoControls`, `#homeBtn`, `#gatherList` all invisible per `getBoundingClientRect` / computed `opacity: 0`. Observatory header + calibration overture visible.
- (b) **Acts I + II play.** Reticle + 4 DM Mono status lines fade in on schedule (0.3 / 0.9 / 1.5 / 2.1s). Scan-line sweep at 2.4s. Planet fades in at ~2.7s. Hint line at 3.5s.
- (c) **Skippable.** Click / Enter / Space on the overture commits ENTER_FIELD; input/textarea targets ignored.
- (d) **After reverse-gather**, exactly 7 `.cl` divs carry `.show` class (tick loop no longer strips them — overtureComplete flag verified).
- (e) **Tests 3 (global parity) + 4 (reduced-motion ≤0.5s)** previously blocked, should now run and pass.
- (f) **Planet scale.** Per 2026-04-18 decision: revisit only if the planet still reads undersized after the chrome hide reclaims the frame.

**Step 2 — transition.** If UAT green: `/gsd-transition 16` → `/gsd-plan-phase 17`. If UAT red: capture failing gates, plan 16-04 (or 16.x decimal insert) to close.

**Scale punt (still in force):** planet scale / camera framing NOT addressed in Phase 16. Will be evaluated post-UAT.

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

Last session: 2026-04-18 late (/gsd-execute-phase 16 end-to-end)
Stopped at: Phase 16 code-complete + code-verified. 16-01 + 16-02 committed retroactively from the uncommitted working tree (16-01: `da6bd3d`; 16-02: `4ea66e6` — SUMMARY.md written this session, marked `shipped-with-known-gaps` since the 2 UAT gaps were deferred to 16-03 rather than shipped resolved). 16-03 executed via gsd-executor: 8 commits `a2ad68b` → `4d8ccdb` (plus plan-docs `1a649a1`) landing calibration overture, observatory header, skippable handler, reduced-motion variant, Gap 1 closure (body.planetary chrome-hide CSS + planetaryActive scene gate), Gap 2 closure (overtureComplete flag + tick-loop widened condition). gsd-verifier returned PASS-WITH-CONDITIONS (29/29 must_haves honored, all 12 PO-* requirements traced); VERIFICATION.md at .planning/phases/16-planetary-overture/VERIFICATION.md. Automated gates green: 285/285 tests, `tsc --noEmit` clean, build 239.01 KB gzipped (10.99 KB headroom). Feedback memories unchanged and still apply:

- `memory/feedback_playwright-wsl-prohibited.md`
- `memory/feedback_use-gsd-for-structured-work.md`
- `memory/playwright_mcp_windows_fix.md` (authoritative on the Playwright MCP config)

Session before (2026-04-18 evening): Phase 16 gap-closure planning prep. 16-CONTEXT.md updated with three explicit additions to 16-03 (hide chrome, gate geometry, overtureComplete flag). Root causes confirmed via file reads. Stopped before plan authoring.

Session before that (2026-04-18 afternoon): QA workflow repair / Playwright MCP path correction. Authoritative fix captured in memory note.

Session before that (2026-04-18 morning): Phase 16 UAT run — surfaced the two gaps that 16-03 has now closed (code-level). Visual re-run pending.

Resume with: `/gsd-verify-work` (re-run 16-UAT.md gates against latest build via Playwright MCP → Windows Chrome). After UAT green: `/gsd-transition 16` → `/gsd-plan-phase 17`. If UAT red: capture failing gates, plan 16.x decimal insert to close.
