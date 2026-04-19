---
purpose: Autonomous decisions Claude makes during /gsd-autonomous and auto-advance pipelines, where Mo would normally be asked. Append-only log. Each entry must be defensible from prior conversation, STATE.md, ROADMAP.md, or DESIGN-STATE.md context.
review_cadence: At each /gsd-transition and at milestone boundary
escalation: If decision can't be defended from existing context, STOP and ask Mo
---

# Autonomous Decision Log — Case Study Explorer

> Created 2026-04-19 when auto-advance was enabled with Opus orchestrating + Budget subagents. Mo's directive: "test whether you can make decisions based on all we know/discussed previously. keep track of decisions somewhere. if you're really in a pickle you can stop."

## Entry format

```
### YYYY-MM-DD HH:MM — [PHASE-PLAN] Decision title

**Context:** What was being decided and why a decision was needed (vs. asking Mo).
**Options considered:** A / B / C with one-line tradeoff each.
**Chose:** X.
**Why:** Defensible from <source: STATE.md line, prior conversation, design canon ref, etc.>.
**Confidence:** high / medium / low.
**Rollback cost:** trivial / moderate / expensive — what undoing this would require.
**Surfaced to Mo:** session-end summary / next /gsd-progress / immediate flag.
```

Confidence-low or rollback-expensive decisions: surface immediately, don't bury in a session summary.

## When to STOP instead of decide

- Spec genuinely ambiguous and prior conversation gives no signal
- Visual / aesthetic call without an existing canon reference or DESIGN-STATE.md constraint
- Architectural choice that locks in a pattern across 3+ files
- Anything touching auth, secrets, or destructive ops (per workflow.md)
- Two recent attempts at the same thing failed differently (signal: I don't understand the problem)

---

## Decisions

### 2026-04-19 — Pre-flight setup

**Context:** /gsd-settings invoked, auto-advance enabled, Mo asked to track autonomous decisions.
**Chose:** Created this DECISIONS.md as the persistence target.
**Why:** Mo said "keep track somewhere" — STATE.md is execution state, this is a parallel append-only audit trail.
**Confidence:** high.
**Rollback cost:** trivial.
**Surfaced to Mo:** in this response.

### 2026-04-19 — DESIGN-STATE.md classified as canonical, not orphan

**Context:** /gsd-progress flagged untracked `DESIGN-STATE.md` at repo root. Initial read suggested possible Phase 16 byproduct. Investigated.
**Options considered:** A) Treat as scratch and delete. B) Treat as canonical and commit. C) Move under `.planning/` as a sub-artifact.
**Chose:** B — canonical at repo root.
**Why:** File matches the work-categories.md DESIGN-STATE.md template exactly (Current direction / Active constraints / Non-goals / Rejected options / Last reviewed / Open aesthetic questions / Sign-off log). Content is current — references draft-branch commits da6bd3d→1a649a1, v3.3 scope, Phase 16 PASS-WITH-CONDITIONS verdict. The work-categories.md template explicitly puts it at "project root, one per project, not per phase." Removing it would destroy a load-bearing polish-loop constraint set.
**Confidence:** high.
**Rollback cost:** trivial — file is uncommitted, can stage/unstage at will.
**Surfaced to Mo:** in this response. Recommendation: commit alongside Phase 16 closure, not as a standalone commit.

### 2026-04-19 — Playwright MCP topology: Direction A (CDP attach to Windows Chrome)

**Context:** Current `.mcp.json` runs `npx @playwright/mcp` from WSL pointing at Windows `chrome.exe` — broken per documented bugs (microsoft/playwright-mcp #883 `--no-sandbox` swallowing, #1172 POSIX file URL conversion, GPU/dxg crashes). Mo wants self-managing solution.

**Options considered:** A) CDP attach — Chrome running on Windows, MCP in WSL connects via `--cdp-endpoint http://localhost:9222`. B) Windows-side HTTP MCP server, WSL agent connects via SSE. C) Pure-WSL Chromium. D) Extension mode. E) Move Claude Code to native Windows.

**Chose:** A (CDP attach to Windows Chrome).

**Why:**
- A is the only architecture confirmed working in published field reports for WSL→Windows topology with mirrored networking (which Mo has per `.wslconfig`)
- B is blocked by open Anthropic bug claude-code#3426 (tools/list timeout in WSL→Windows HTTP MCP, P1, unresolved)
- C is Mo's current broken setup (the bug cluster above)
- D is broken from WSL (microsoft/playwright-mcp#941, partial PR merge but reports still describe failure)
- E loses Mo's WSL-native toolchain for everything else; not the right tradeoff

**Sub-decisions:**
- **Task Scheduler creation:** PowerShell-scripted from WSL via `powershell.exe Register-ScheduledTask` interop. Mo sees the command; persistent Windows state created. Most agent-managed of three options.
- **Chrome profile:** Fresh isolated at `C:\Tmp\PlaywrightProfile`. Clean state, no risk of agent polluting real browsing history. Right for case-study-explorer (public app). Compounds well for future public-facing projects.
- **Scope:** Leaf-local `.mcp.json` in `case-study-explorer/` first (prove it before promoting to Workshop). Workshop-level `Thales/.mcp.json` left alone for now.

**Confidence:** medium — architecture is sound and matches field-tested pattern, but no published recipe for the exact "WSL agent self-heals Windows Chrome via PowerShell interop" wrapper exists. We're writing the wrapper script ourselves.

**Rollback cost:** moderate.
- Revert leaf `.mcp.json` (or delete it) → Workshop-level config takes over
- Disable Task Scheduler job via `schtasks /Delete /TN "PlaywrightChromeCDP" /F`
- No persistent code dependencies created

**Surfaced to Mo:** in this response. Will document the operational runbook in `case-study-explorer/CLAUDE.md` so next session knows the topology.

### 2026-04-19 — Playwright MCP topology built and verified end-to-end

**Context:** Direction A architecture (above) implemented + verified.

**What was built:**
1. Installed `@playwright/mcp@latest` (v1.60.0-alpha) on Windows Node at `C:\nvm4w\nodejs\node_modules\@playwright\mcp\`
2. Wrapper script: `.claude/scripts/playwright-mcp-cdp.sh` (health-check + auto-relaunch + exec MCP)
3. Task Scheduler job `PlaywrightChromeCDP` (registered, State=Ready, fires at login)
4. Leaf-local `.mcp.json` pointing at the wrapper
5. CLAUDE.md "Playwright MCP" section documenting topology + verification + reset procedure

**Verification gates passed:**
- WSL2 mirrored networking confirmed live (Windows localhost reachable from WSL)
- Chrome 147 launches with isolated profile at `C:\Tmp\PlaywrightProfile`
- CDP endpoint responds on `http://localhost:9222/json/version` from WSL
- MCP `initialize` returns server capabilities (Playwright 1.60.0-alpha)
- MCP `tools/list` returns 22 Playwright tools including `browser_evaluate`, `browser_snapshot`, `browser_take_screenshot`, `browser_navigate`, `browser_console_messages` (all needed for Phase 16 UAT)

**Outstanding gotcha — MCP config precedence:**
- Workshop-level `Thales/.mcp.json` defines `playwright` (broken WSL hack)
- Leaf-local `case-study-explorer/.mcp.json` also defines `playwright` (working CDP)
- Per Claude Code config resolution, leaf-local wins when launched from this cwd
- ACTION: After 1-2 sessions of stable use, promote the leaf config to Workshop and delete the broken one. Tracked but not done now (intentional — prove stability first).

**Confidence:** high — all empirical gates passed.
**Rollback cost:** trivial. Delete `.mcp.json` (Workshop config takes over) + `Get-ScheduledTask 'PlaywrightChromeCDP' | Unregister-ScheduledTask`.
**Surfaced to Mo:** in the next response (summary + handoff).

<!-- Append new entries below this line -->
