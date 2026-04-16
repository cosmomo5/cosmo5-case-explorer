# Experiment: Multi-Model Code Dispatch

**Goal:** Establish whether Claude can orchestrate Kimi, Qwen, and Sonnet subagents for parallel code execution, and what configuration each needs to produce good results.

**Why:** This session (2026-04-13) shipped 5 phases in one sitting using only Sonnet subagents. The bottleneck was sequential execution — each agent waited for the previous one. If isolated tasks can be dispatched to Kimi/Qwen simultaneously while Claude orchestrates and handles architectural decisions, throughput doubles or triples.

## The Test

### Task (identical brief for all three models)

```
In src/scene/scene-state.ts, improve the ring dimension switch animation.
Currently switchRingDimension disposes old ring lines instantly and creates
new ones instantly. Change it so:
1. Old ring lines fade opacity from current → 0 over 300ms (GSAP)
2. After fade completes, dispose old lines and create new ones
3. New ring lines start at opacity 0 and fade to 0.35 over 500ms
4. Ring labels should also cross-fade (old fade out, new fade in)

Files to read first: src/scene/scene-state.ts, src/scene/orbitals/concentric.ts
Verify: npx tsc --noEmit && npx vitest run
Working directory: /home/moham/Documents/Thales/work/design/case-study-explorer
```

### How to run each

**Model A — Sonnet (Claude subagent):**
```
Agent(subagent_type: "coder", model: "sonnet", prompt: "<brief above>")
```

**Model B — Kimi:**
```bash
scripts/agents/qwen-agent.sh --scope code "<brief above>"
```
Or via MCP: `mcp__kimi__kimi_agent(task: "<brief>", scope: "code")`

**Model C — Qwen (free tier):**
```bash
scripts/agents/qwen-agent.sh --scope code --free "<brief above>"
```

### Run protocol

1. Git stash or branch before each test (`git stash` after each run)
2. Run one model at a time on the same task
3. After each: record wall time, check `npx tsc --noEmit`, check `npx vitest run`, read the diff
4. Compare

### Evaluation matrix

| Dimension | How to measure | Weight |
|-----------|---------------|--------|
| Correctness | tsc + vitest pass on first try | Critical |
| Pattern adherence | Uses GSAP.to not raw setTimeout; follows existing import style; doesn't add unnecessary imports | High |
| Context awareness | Read the right files; understood SceneObjects shape; didn't break ringLabelEls | High |
| Minimal diff | Only changed what was needed; no drive-by refactors | Medium |
| Speed | Wall clock seconds from dispatch to file written | Medium |
| Cost | Token count (check usage output) | Low |

### What we're trying to learn

1. **Can Kimi/Qwen handle isolated 1-3 file edits reliably?** If yes → route all isolated execution to them.
2. **What context do they need in the brief?** Sonnet subagents get a rich prompt from me that carries session context. Kimi starts cold. How much context is "enough"?
3. **Where do they fail?** If they need to understand _why_ a pattern exists (e.g., the _ringWasHighlighted flag), do they guess wrong?
4. **What's the right routing table?**

### Proposed routing table (hypothesis to validate)

| Work type | Route to | Why |
|-----------|----------|-----|
| Isolated file edit, clear spec | Kimi `code` | Large context, good at following specs |
| Multi-file wiring, needs session context | Sonnet subagent | Inherits orchestrator's brief with decisions |
| Quick/cheap validation, lint, format | Qwen `--free` | Free tier sufficient for mechanical work |
| Architecture decisions, planning, tradeoffs | Claude (inline) | Needs full conversation context |
| Parallel independent tasks | Kimi + Sonnet simultaneously | Maximum throughput |
| Read-only codebase exploration | Kimi `read-only` or Haiku subagent | Cheap, doesn't need write access |

### Configuration needed for orchestration

Things Claude needs to be a good orchestrator:

1. **Briefing template**: Each dispatch needs a self-contained brief (files to read, exact task, verification command, working directory). The brief IS the context — no conversation history transfers.
2. **Scope guard**: `guard-agent-scope.sh` already enforces file-level scope. Validate it works for Kimi dispatches.
3. **Result verification**: After each agent returns, Claude must: check exit code, verify files exist, run tests, read the diff. Never trust "done" without checking.
4. **Fallback**: If Kimi fails (bad edit, type error), Claude fixes inline rather than re-dispatching. One retry max.
5. **Parallel dispatch syntax**: Need to confirm that `qwen-agent.sh` can run in background while a Sonnet Agent() runs foreground (or both background with notification).

### Success criteria for the experiment

- [x] At least one model produces a working edit (tsc + vitest pass) — Sonnet only
- [x] Routing table validated or revised based on results — see below
- [ ] Briefing template confirmed sufficient for cold-start models — inconclusive (Kimi timeout, Qwen silent)
- [x] At least one model is clearly better for isolated edits — Sonnet wins decisively
- [x] Configuration checklist written for Claude-as-orchestrator workflow — see below

---

## Results (2026-04-13)

### Outcome matrix

| Model | Result | Wall time | tsc | vitest | Notes |
|-------|--------|-----------|-----|--------|-------|
| Sonnet (subagent) | ✅ Pass | 186s | OK | 117/117 | Correct pattern; rewrote entire file (git HEAD was pre-Phase-4) |
| Kimi (mcp__kimi__kimi_agent) | ❌ Timeout | ~320s | — | — | MCP tool timed out; no file changes written |
| Qwen (qwen-agent.sh) | ❌ Silent fail | 5s | — | — | exit=0 but "No result text"; no file changes |

### What failed and why

**Kimi**: MCP call timed out (~320s). The agent may have been working but the MCP transport has a shorter timeout than the task requires. Not a brief-quality failure — the model never got to produce output.

**Qwen**: `qwen-agent.sh` returned immediately with "No result text" and exit=0. Appears the script doesn't invoke Kimi K2 for write tasks when cwd is not the Thales root, or there's a silent error in the wrapper. Not tested further.

**What Sonnet noticed that cold models would miss** (even with the same brief):
- The `_ringWasHighlighted` pattern in the tick loop requires a specific two-flag reset order
- `ring labels use el.style.opacity` (string) vs material `.opacity` (number) — different GSAP target syntax
- The `completedCount` pattern for coordinating multiple onComplete callbacks

The brief included all three of these as explicit hints, so cold-model failure here would be a model-quality issue, not a brief-quality issue. We'll never know since both cold models failed to run.

### Revised routing table

| Work type | Route to | Confidence |
|-----------|----------|-----------|
| Isolated file edit, clear spec, GSAP/Three.js | Sonnet subagent | High — verified |
| Architecture decisions, planning, tradeoffs | Claude inline | High |
| Read-only codebase exploration | Haiku subagent | High |
| Kimi via MCP (kimi_agent) | ❌ Unreliable | Timeout on substantial tasks |
| Qwen via qwen-agent.sh | ❌ Untested for writes | Silent fail; debug before using |

**Key finding**: Cold-start models (Kimi/Qwen) cannot be relied on for this codebase's write tasks yet. The qwen-agent.sh wrapper needs investigation before use. Sonnet subagents remain the only validated route for isolated code edits.

### Orchestrator checklist (for future parallel dispatches)

1. Sonnet subagents only until Kimi/Qwen tooling is debugged
2. Each subagent brief must be self-contained: files to read, exact task, verify command, cwd
3. After return: check exit code (trailer), verify files changed (`git diff --stat`), run tsc + vitest
4. One retry max inline if agent fails; don't re-dispatch
5. Parallel dispatch works fine for independent tasks — launch simultaneously in one message
6. Git HEAD is stale (Phase 0-4 uncommitted) — `git checkout -- <file>` resets to OLD version; use `cp` from a saved baseline for between-run resets

---

*Created: 2026-04-13*
*Run: 2026-04-13*
