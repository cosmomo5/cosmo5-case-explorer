---
phase: 20
plan: "03"
subsystem: ui/filter-panel
tags: [gather, filter-panel, css, 5-state-machine, view-state-gating, TDD]
status: awaiting-uat
dependency_graph:
  requires: [20-01-pure-state-applyFilter, 20-02-gather-entry-point]
  provides: [gather-button-UI, determineGatherButtonState, view-state-gating]
  affects:
    - src/style.css
    - src/ui/filter-panel.ts
    - src/ui/filter-panel.test.ts
tech_stack:
  added: []
  patterns: [5-state-machine, integration-tests-through-mount, CSS-token-only-styling]
key_files:
  created: []
  modified:
    - src/style.css
    - src/ui/filter-panel.ts
    - src/ui/filter-panel.test.ts
decisions:
  - "Fixed stranded-check ordering: stranded precedes disabled in determineGatherButtonState()"
  - "getAllCases() excludes STAGING_KEY orbit to prevent double-counting staging cases"
  - "Task 4 (body.reading toggle) is a no-op: layoutController.ts:17 already satisfies requirement"
  - "Integration tests observe DOM output through mountFilterPanel; no helper exports"
metrics:
  duration: "~35 minutes"
  completed: "2026-04-20T00:08:00Z"
  tasks_completed: 6
  files_modified: 3
---

# Phase 20 Plan 03: Gather Button UI Summary

5-state Gather button wired into filter-panel.ts — `determineGatherButtonState()` drives button label/class from filter+sphere state, CSS block uses only project tokens, body-class view-state gating confirmed via existing layoutController.

## What Was Built

### Task 1 — CSS block for `.gather-button` (commit: ed9a14e)

Added `.gather-button` CSS block to `src/style.css` after `.filters-readout`. Block uses only `var(--gold)` and `var(--teal)` tokens (no hex literals). Five state classes: default (gold border/text), `.disabled` (teal 0.35 opacity, cursor:not-allowed), `.staged-drifted` (gold 0.85), `.stranded` (teal 0.6), `.staged-current` (gold, labeled GATHERED).

View-state gating via two rules:
```css
body.planetary .gather-button,
body.reading .gather-button {
  display: none !important;
}
```

`prefers-reduced-motion` rule: `transition: none`.

### Tasks 2+3 — `determineGatherButtonState()` and click handler (commit: 12235ea)

Added to `src/ui/filter-panel.ts`:

- Import: `gather`, `disposeStagingNucleus`, `STAGING_KEY` from `../scene/staging`
- `determineGatherButtonState(obj: SceneObjects): GatherButtonState` — state ordering:
  1. `sphereExists && !isActive` → `'stranded'` (must precede disabled check)
  2. `!isActive || matchedCount === 0` → `'disabled'`
  3. `!sphereExists` → `'armed'`
  4. `matchedCount === stagedCount` → `'staged-current'`
  5. default → `'staged-drifted'`
- `buildGatherButtonHTML(obj)` — renders label + `data-gather-action` attribute per state
- Button inserted between `</div><!-- .filters-body -->` and `${statusBar}` in both `buildGlobalHTML` and `buildFocusedHTML`
- `bindEvents()` wires `data-gather-action="gather"` → `gather(objects); render()` and `data-gather-action="dismiss"` → `disposeStagingNucleus(objects); render()`

### Task 4 — body.reading toggle (no code change)

`src/layout/layout-controller.ts:17` already contains `document.body.classList.toggle('reading', mode === 'reading')`. `reading-panel.ts` calls `setViewMode('reading')` on open and `setViewMode(entryMode)` on close. Requirement fully satisfied by existing code — documented as deviation.

### Tasks 5+6 — Tests and getAllCases fix (commit: a2e7693)

9 new tests in `src/ui/filter-panel.test.ts`:

**Unit tests (6):** `determineGatherButtonState` covers all 5 states. Critical test: `stranded` when `sphereExists && !isActive` — verifies the fixed ordering (broken plan ordering would return `disabled`).

**Integration tests (3):** Through `mountFilterPanel` + DOM queries: disabled button present and `.disabled` classed when no filter; armed button has `data-gather-action="gather"` when filter active; stranded renders `DISMISS` text with `.stranded` class.

**Rule 1 fix:** `getAllCases()` now excludes `STAGING_KEY` orbit. Without this fix, adding STAGING_KEY to `nucleusOrbits` in tests caused double-counting — `matchedCount` exceeded `stagedCount` for every fixture, making `staged-current` unreachable. The fix is semantically correct: staging orbit is a view subset, not an additional case source.

## Deviations from Plan

### 1. [Rule 3 - Plan prerequisite] Task 4 is a no-op — body.reading already toggled

- **Found during:** Task 4 analysis
- **Issue:** Plan says to add `body.classList.toggle('reading')` to `main.ts`. Reality: `layoutController.ts:17` already does this; `reading-panel.ts` calls `setViewMode('reading')` on panel open.
- **Fix:** No code change. Documented as deviation.
- **Files modified:** None
- **Commit:** N/A

### 2. [Rule 1 - Bug] Fixed stranded-check ordering in determineGatherButtonState()

- **Found during:** Pre-implementation analysis (advisor consultation from previous session)
- **Issue:** Plan's sketched ordering checked `!isActive` for disabled before checking `sphereExists && !isActive` for stranded. Result: stranded state was unreachable.
- **Fix:** Moved stranded check to top of the chain.
- **Files modified:** `src/ui/filter-panel.ts`
- **Commit:** 12235ea

### 3. [Rule 1 - Bug] getAllCases() double-counted STAGING_KEY cases

- **Found during:** Task 5 (tests failing with staged-current/staged-drifted swapped)
- **Issue:** Test fixtures added STAGING_KEY to `nucleusOrbits`. `getAllCases()` returned Media+STAGING_KEY cases → double-counted matched cases → `matchedCount` exceeded `stagedCount` in staged-current fixture.
- **Fix:** `getAllCases()` filters out `STAGING_KEY` orbit via `Object.entries().filter([key] !== STAGING_KEY)`.
- **Files modified:** `src/ui/filter-panel.ts`
- **Commit:** a2e7693

## Verification

```
Test Files: 30 passed (30)
     Tests: 301 passed (301)  ← baseline 295 (20-02); net +6 within ±15 envelope
TypeScript: tsc --noEmit exits 0
```

Test delta breakdown:
- `filter-panel.test.ts`: +9 new tests (6 unit + 3 integration)
- `unified-column.test.ts` Phase 18 auto-expand tests: 2/2 still passing

## Known Stubs

None. The button renders from live SceneObjects state on every `render()` call. No placeholder data.

## Threat Flags

None. `determineGatherButtonState` is a pure read-only function. No new network endpoints, auth paths, or trust boundaries.

## UAT Status

**Awaiting visual UAT from Windows Chrome.** All automation complete. Playwright UAT must be run from Windows Chrome (WSL X11/GPU stack is unreliable per project CLAUDE.md). See checkpoint below.

## Self-Check

### Files exist
- [x] `src/style.css` — modified, contains `.gather-button` block with 5 state rules
- [x] `src/ui/filter-panel.ts` — modified, exports `determineGatherButtonState`, imports from staging.ts
- [x] `src/ui/filter-panel.test.ts` — modified, 9 new tests

### Commits exist
- [x] `ed9a14e` — feat(20-03): CSS block
- [x] `12235ea` — feat(20-03): determineGatherButtonState() + button HTML + handler
- [x] `a2e7693` — test(20-03): tests + getAllCases fix

### Must-have truths
| Truth | Verified by |
|-------|-------------|
| `.gather-button` class exists in CSS | grep `.gather-button` in style.css |
| `determineGatherButtonState()` exported | import in test file, tsc clean |
| `gather(objects)` called on button click | bindEvents() wires data-gather-action=gather → gather() |
| `disposeStagingNucleus()` called on dismiss | bindEvents() wires data-gather-action=dismiss → disposeStagingNucleus() |
| body.reading hides button | CSS rule `body.reading .gather-button { display: none !important }` |
| body.reading toggle exists | layoutController.ts:17 confirmed |
| Stranded state reachable | Unit test + fixed ordering in determineGatherButtonState() |
| 301 tests pass | npm run test output |

## Self-Check: PASSED
