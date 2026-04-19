---
phase: 20
slug: gather-as-staging-action
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `20-RESEARCH.md` `## Validation Architecture` section.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npm run test -- --run --reporter=dot` (single pass, compact output) |
| **Full suite command** | `npm run test` (vitest run mode) |
| **Type check** | `npx tsc --noEmit` |
| **Build verification** | `npm run build` |
| **Estimated runtime** | ~12 seconds (287 tests baseline) → ~14 seconds (post-Phase-20 target) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run <affected-file>` (single-file smoke)
- **After every plan wave:** Run `npm run test` (full suite) + `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite green + build success + bundle size within ±2 KB of 237.32 KB baseline
- **Max feedback latency:** ~15 seconds (full suite + tsc)

---

## Per-Task Verification Map

Task ID format: `{plan}-{task}`. Plans are 20-01, 20-02, 20-03. Plan 20-03 is `autonomous: false` (Playwright UAT requires Mo's Windows Chrome session).

### Plan 20-01 — Gut filter→scene coupling (Wave 1A, autonomous)

| Task ID | Requirement | Test Type | Automated Command | Status |
|---------|-------------|-----------|-------------------|--------|
| 20-01-01 | D-07: Delete global tick-loop opacity block (L356-372) | grep | `! grep -nE "filterMatch\|filterDim" src/scene/scene-state.ts` (expect exit 0) | ⬜ pending |
| 20-01-02 | D-07: Delete focused-mode dim branch (L448-477) of applyFilter | grep | `! grep -A 40 "mode === 'focused'" src/scene/scene-state.ts \| grep -q "0.12"` | ⬜ pending |
| 20-01-03 | D-04: applyFilter collapses to state mutation only | unit | `npm run test -- --run src/scene/scene-state.test.ts -t "applyFilter"` | ⬜ pending |
| 20-01-04 | D-08: Remove StarState.filterMatch + filterDim | grep | `! grep -E "'filterMatch'\|'filterDim'" src/data/star-state.ts` | ⬜ pending |
| 20-01-05 | D-08: Remove resolveStarAppearance mappings for removed states | unit | `npm run test -- --run src/data/star-state.test.ts` | ⬜ pending |
| 20-01-06 | D-14: Rewire applyFilterWave as gather traversal (distance-sorted) | unit | `npm run test -- --run src/tests/filter-wave.test.ts -t "distance-sorted"` | ⬜ pending |
| 20-01-07 | Rewrite scene-state.test.ts global-branch tests to expect silent filter | unit | `npm run test -- --run src/scene/scene-state.test.ts` passes | ⬜ pending |
| 20-01-08 | Rewrite staging.test.ts FILT-04/FILT-09 to use gather() (forward-compatible with 20-02) | unit | `npm run test -- --run src/scene/orbitals/staging.test.ts` passes | ⬜ pending |

### Plan 20-02 — gather() entry point TDD (Wave 1B, autonomous, type: tdd)

| Task ID | Requirement | Test Type | Automated Command | Status |
|---------|-------------|-----------|-------------------|--------|
| 20-02-01 RED | Write failing test: gather() with no matched cases returns early | unit | `npm run test -- --run src/scene/staging.test.ts -t "gather.*no.*matched"` → red | ⬜ pending |
| 20-02-02 RED | Write failing test: gather() creates sphere + calls lifecycle in order | unit | test file has 4 failing tests for gather() | ⬜ pending |
| 20-02-03 GREEN | Implement gather(objects) composing lifecycle primitives | unit | all 4 gather() tests pass (GREEN gate) | ⬜ pending |
| 20-02-04 GREEN | gather() handles existing-sphere case (animate update) | unit | test for "gather with existing sphere → animateStarsToStaging, no second createStagingNucleus" passes | ⬜ pending |
| 20-02-05 REFACTOR | Extract shared helpers if present; clean up | unit | all tests still pass post-refactor | ⬜ pending |
| 20-02-06 | Verify gather() uses existing staging.ts primitives (no duplication) | grep | `grep -E "createStagingNucleus\|applyStagingPush\|zoomTowardStaging\|animateStarsToStaging" src/scene/staging.ts` (matches ≥4 internal calls from new gather) | ⬜ pending |

### Plan 20-03 — Gather button UI (Wave 2, autonomous: false, depends on 20-01 + 20-02)

| Task ID | Requirement | Test Type | Automated Command / Manual | Status |
|---------|-------------|-----------|----------------------------|--------|
| 20-03-01 | Add body.reading class toggle to view-state machine in main.ts | unit | `npm run test -- --run src/data/view-state.test.ts -t "body.reading"` | ⬜ pending |
| 20-03-02 | Add .gather-button CSS block per UI-SPEC state contract | grep | all 20 UI-SPEC verification hooks (VH#1-#20) pass via grep; no hex literals; no box-shadow; no gradient | ⬜ pending |
| 20-03-03 | Button DOM renders in filter-panel.ts | unit | `npm run test -- --run src/ui/filter-panel.test.ts -t "gather button renders"` | ⬜ pending |
| 20-03-04 | determineGatherButtonState() pure function, 5 states | unit | `npm run test -- --run src/ui/filter-panel.test.ts -t "determineGatherButtonState"` → ≥12 tests pass | ⬜ pending |
| 20-03-05 | Click routing: armed/staged-drifted → gather(); stranded → disposeStagingNucleus(); staged-current/disabled → no-op | unit | `npm run test -- --run src/ui/filter-panel.test.ts -t "gather button click"` → 5 tests pass | ⬜ pending |
| 20-03-06 | View-state gating works via body-class CSS | unit | `npm run test -- --run src/ui/filter-panel.test.ts -t "view.*state.*gating"` → 4 tests (global/constellation present; planetary/reading absent) | ⬜ pending |
| 20-03-07 | Phase 18 Tests 8-9 invariance preserved | unit | `npm run test -- --run src/ui/unified-column.test.ts -t "auto.*expand\|auto.*collapse"` → 2 tests pass | ⬜ pending |
| 20-03-08 | UAT F1: Filter toggles produce zero scene motion | E2E | **Playwright manual** (Mo's Windows Chrome): `browser_snapshot` before/after filter toggle; diff shows only count text change | 🛑 manual |
| 20-03-09 | UAT F2: Gather click creates sphere with correct N members | E2E | **Playwright manual**: verify `nucleusMeshes.has(STAGING_KEY) === true` + star count via browser_evaluate | 🛑 manual |
| 20-03-10 | UAT F3+F4: Filter drift shows `RE-GATHER · N→M`; re-click replaces | E2E | **Playwright manual**: label text assertion + snapshot after re-click | 🛑 manual |
| 20-03-11 | UAT F5: Dismiss flow (clear filter → click → sphere disposed) | E2E | **Playwright manual**: label `DISMISS`, click, verify `nucleusMeshes.has(STAGING_KEY) === false` | 🛑 manual |
| 20-03-12 | UAT F6+F7: View-state gating (planetary + reading) | E2E | **Playwright manual**: `document.querySelector('.gather-button')` returns null in each view | 🛑 manual |
| 20-03-13 | UAT F8: Disabled-state labels render correctly | E2E | **Playwright manual**: compare label text + opacity against Copy Specification table | 🛑 manual |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · 🛑 manual (Playwright UAT, non-autonomous)*

---

## Wave 0 Requirements

Wave 0 is complete — no new test infrastructure needed.

- [x] Vitest 2.x already installed and configured (`vitest.config.ts`, `package.json`).
- [x] Test files exist for all surfaces being modified (`scene-state.test.ts`, `staging.test.ts`, `filter-wave.test.ts`, `filter-panel.test.ts`, `unified-column.test.ts`).
- [x] No new fixtures needed — existing `cases.json` (116 entries) is the reference dataset.
- [x] `SceneObjects` mock pattern already used in existing tests (see `scene-state.test.ts` setup).

**Deterministic test fixture:** Country filter for Germany yields exactly 3 cases — use this throughout for exact-count assertions.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| **F1: Filter silence (visual)** | D-04, D-07 | Raycaster behavior + GSAP tween behavior need visual confirmation that stars truly don't move. Unit tests catch opacity-state writes but not first-frame paint lag. | Playwright from Windows Chrome: open app, toggle any filter chip, `browser_take_screenshot` before/after. No star motion visible. Only readout count changes. |
| **F2: Gather visual** | D-04 click→stage | Sphere creation animation is visual. Unit tests assert nucleusMeshes.has(STAGING_KEY) but not that the sphere *looks right*. | Playwright from Windows Chrome: filter to Germany (3 cases), click Gather. Screenshot shows 3 stars at staging sphere center + other nuclei pushed outward. |
| **F3: Filter drift label** | D-12 button label signals | Label copy is the only drift signal; need eye-on to confirm `RE-GATHER · N→M` renders legibly in context | Playwright: after F2, toggle an additional filter facet. `browser_evaluate: document.querySelector('.gather-button').textContent` → matches `/RE-GATHER · \d+→\d+/` |
| **F4: Re-gather replaces** | D-04 re-click behavior | Sphere replacement animation is visual | Playwright: after F3, click Gather. Screenshot shows sphere updated with new count. |
| **F5: Dismiss** | D-13 stranded state | Stranded button + dispose flow need visual confirmation that the sphere truly disposes and stars return to orbit | Playwright: after F2, clear all filters. Label reads `DISMISS`. Click. Sphere disappears; stars return to original orbits. |
| **F6: Planetary view gate** | D-10 | DOM absence test is unit-level but visual confirmation prevents CSS specificity surprises | Playwright: with sphere staged, trigger planetary transition (click wordmark). Gather button is gone. |
| **F7: Reading view gate** | D-10 | Same as F6 for reading mode | Playwright: click a case star, reading panel opens. Gather button absent. Close reading; button returns. |
| **F8: Disabled states copy** | UI-SPEC Copy Spec | Legibility of "ghosted" `GATHER` vs active `GATHER` at teal 0.35 vs gold 1.0 needs human eye | Playwright: screenshot no-filter state + zero-match state. Labels visually distinct; hit-testing confirms pointer-events: none. |

All manual verifications require Mo's Windows Chrome session — Playwright MCP cannot drive from WSL.

---

## Coverage Matrix Summary

Each of Phase 20's 10 must-haves (from `20-01-PLAN.md`, `20-02-PLAN.md`, `20-03-PLAN.md` frontmatter) maps to at least one automated verification:

| Must-Have | Plan | Automated Coverage | Manual Coverage |
|-----------|------|--------------------|--------------------|
| 1. Filter changes produce zero scene animation | 20-01 | unit + integration (8 tests) | F1 Playwright |
| 2. applyFilter() mutates only filterState | 20-01 | grep + unit | — |
| 3. StarState.filterMatch/filterDim removed | 20-01 | grep (must return 0) | — |
| 4. Global tick-loop opacity block deleted | 20-01 | grep on scene-state.ts L356-372 surface | — |
| 5. Focused-mode filter dim gutted | 20-01 | unit test for focused-mode silence | — |
| 6. Tests rewritten; count within ±15 of 287 baseline | 20-01 + 20-02 + 20-03 | full-suite run; CI logs count | — |
| 7. gather() entry point exists & testable | 20-02 | 6 TDD tests + grep for export | — |
| 8. Gather button 5 states implemented | 20-03 | 12+ unit tests on determineGatherButtonState | F8 Playwright |
| 9. Button click routing correct | 20-03 | 5 unit tests on click handler | F2, F4, F5 Playwright |
| 10. View-state gating works | 20-03 | 4 unit tests on body-class CSS | F6, F7 Playwright |

---

## Test Count Management

| Milestone | Test count | Change |
|-----------|------------|--------|
| Phase 19 baseline | 287/287 | — |
| After Plan 20-01 | ~280-285 (net -2 to -7) | Old filter-causes-staging tests removed; rewrites neutral |
| After Plan 20-02 | ~286-291 (+6 gather tests) | TDD adds the gather() test block |
| After Plan 20-03 | ~295-305 (+12-20 button tests) | Button state machine + view-state gating + UAT unit stubs |
| Target acceptance | 280-305 (±15 of 287) | Any drift beyond ±15 → pause and audit |

Checkpoint protocol: after each plan merges, record `npm run test 2>&1 | tail -5` in the plan's SUMMARY.md. If drift exceeds ±15, planner audit required before next plan starts.

---

## Bundle Size Envelope

- Baseline: 237.32 KB gzipped (post-Phase-19)
- Expected: 237-239.5 KB gzipped (+1 to +2 KB from button CSS + gather() export; offset by enum removal)
- Hard ceiling: 240 KB gzipped. Exceeding triggers audit before Phase 21.

---

## Risks → Test Coverage Map

| Risk (from 20-RESEARCH.md) | Mitigation test | Task ID |
|----------------------------|-----------------|---------|
| R1: applyFilterWave stagger order regression | Unit test: distance-sort invariance after rewire | 20-01-06 |
| R2: Button state drift from async filter/sphere events | Single determineGatherButtonState() + sequence test | 20-03-04 + integration |
| R3: body.reading class drift | Explicit unit test on view-state machine toggle | 20-03-01 |
| R4: Test count volatility from FILT-04/FILT-09 rewrite | Checkpoint after each plan; ±15 audit trigger | all plans |
| R5: Stale sphere + empty filter incoherence | F5 Playwright confirms label + dispose | 20-03-11 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify OR are flagged as manual (Playwright UAT, autonomous: false)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (manual UAT tasks are all at end of Plan 20-03 — separated from autonomous tasks)
- [x] Wave 0 covered by existing infrastructure (Vitest already present)
- [x] No watch-mode flags in automated commands (`--run` mode)
- [x] Feedback latency < 15s for full suite
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending — awaiting plan-checker re-verification with VALIDATION.md present.
