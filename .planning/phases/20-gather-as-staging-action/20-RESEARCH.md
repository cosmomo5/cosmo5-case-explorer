# Phase 20: Gather as Staging Action — Validation Architecture Research

**Researched:** 2026-04-19  
**Domain:** Decouple filter mutation from scene staging; 5-state Gather button UI; test surface coverage  
**Confidence:** HIGH — plans locked, UI-SPEC approved, decisions frozen; research focuses on validation path only  

---

## Summary

Phase 20 decouples filter changes (silent) from scene staging (explicit via Gather button). The architecture splits into three independent plans: 
- **Plan 20-01** guts `applyFilter()` to pure state mutation and removes highlight-across-views behavior
- **Plan 20-02** adds `gather()` entry point composing existing lifecycle primitives (TDD discipline)
- **Plan 20-03** implements 5-state Gather button with view-state gating

All decisions are locked in CONTEXT.md (14 decisions: D-01..D-14). The UI-SPEC contracts 20 machine-verifiable assertions. Test infrastructure exists; no new frameworks needed.

**Primary recommendation:** Build test surface in three layers — unit (state functions), integration (applyFilter silence + gather composition), E2E (Playwright golden paths). Expected net test change: +8 to -5 (within ±15 of baseline 287).

---

## Validation Architecture

### Test Pyramid for Phase 20

**Unit Layer** — Pure functions, no Three.js machinery
- `determineGatherButtonState(filterState, sphereExists, matchedCount)` → returns one of 5 states
  - Test: each state condition and state transition
  - Coverage: Disabled (no-filter, zero-match), Armed, Staged-Current (no-op), Staged-Drifted, Stranded
  - Expected: ~12 unit tests (one per state + cross-state transitions)

- `matchesFilter(caseStudy, filterState)` — existing, unchanged; invariance test only
  - Test: filter application behavior is unchanged (only removed from tick loop, not the predicate itself)
  - Expected: 1 invariance test (confirm Phase 18/19 tests still pass)

**Integration Layer** — Component seams and wiring
- `applyFilter(objects, newFilter)` must produce zero scene side-effects
  - Test setup: sphere exists OR doesn't exist; filter active OR empty
  - Assertions: filterState mutates, nucleusMeshes.has(STAGING_KEY) unchanged, star positions unchanged, no GSAP tweens queued
  - Expected: ~8 integration tests (2² combinations of sphere/filter states)

- `gather(objects)` composes lifecycle correctly
  - Test 1: no matched cases → returns early, no sphere created
  - Test 2: matched cases, no sphere → creates sphere, calls createStagingNucleus + applyStagingPush + zoomTowardStaging + animateStarsToStaging in order
  - Test 3: matched cases, sphere exists → calls animateStarsToStaging with new matched set (no second createStagingNucleus)
  - Test 4: lifecycle functions receive correct case subset
  - Expected: ~6 tests (per TDD spec in Plan 20-02)

- View-state gating: Gather button DOM presence/absence per view
  - Test: body.planetary / body.reading classes toggle button visibility
  - Expected: ~4 tests (presence in global/constellation, absence in planetary/reading)

- Button click routing: Armed/Staged-Drifted → `gather()`, Stranded → `disposeStagingNucleus()`
  - Test: mock gather() and disposeStagingNucleus(); click button; verify correct function called
  - Expected: ~6 tests (one per state that triggers action)

**E2E / Playwright Layer** — User-observable golden paths (autonomous: false, manual verification)
- Load app, toggle Country filter → expect zero star motion, zero sphere, readout count updates
- Load app, activate filter matching 5 cases → click Gather → sphere appears with 5 members
- After Gather, change filter to 8 cases → button label shows `RE-GATHER · 5→8`, scene stays silent
- Click Gather again → sphere replaced with 8-member set
- Clear filter → button shows `DISMISS`, click → sphere disposed
- Enter planetary view → button absent from DOM; return to global → button present
- Enter reading view → button absent from DOM; close reading panel → button present
- Expected: 7–8 user flows, run once per phase (autonomous: false, manual spot-check OK)

### Golden Paths (User-Observable Flows)

| Flow | Setup | User action | Expected result | Test type | Command |
|------|-------|-------------|-----------------|-----------|---------|
| **F1: Filter silent** | Global view, no filters | Click Country: US | Stars stay in place, sphere absent, count updates to N | E2E (Playwright) | `browser_snapshot`, verify `.gather-button` state |
| **F2: Gather creates** | Global view, US filter (5 matches) | Click Gather button | Staging sphere appears with 5 stars, others push outward, camera zooms | E2E + visual | `browser_take_screenshot` (visual approval needed) |
| **F3: Filter drift** | Gathered (5 members) | Add filter chip (Service filter) → now 8 matches | Button label changes to `RE-GATHER · 5→8`, scene silent | Unit/E2E | grep `.gather-button` text, verify no star motion in tick loop |
| **F4: Re-gather** | Button showing `RE-GATHER · 5→8` | Click Gather | Sphere replaced, new 8 stars animate in, old 5 animate out, camera reframes | E2E + visual | snapshot before/after, verify star count = 8 |
| **F5: Dismiss** | Filter cleared (sphere exists) | Click Gather → shows `DISMISS` → click | Sphere disposed, stars return to spheres, button becomes Disabled | E2E | verify `nucleusMeshes.has(STAGING_KEY) === false` |
| **F6: View gate (planetary)** | Gathered, in global view | Enter planetary view (T1 transition) | Button absent from DOM (no visual clutter in overture) | Unit | test `body.planetary .gather-button { display: none }` rule fires |
| **F7: View gate (reading)** | Gathered, in global view | Click case star → reading opens | Button absent from DOM during read, reappears when reading closes | Unit | test body.reading toggle + CSS rule |
| **F8: Disabled states** | Global view, no filters | (start) / activate filter but zero matches | Button shows `GATHER` (ghosted) / `0 CASES — REFINE` | Unit + snapshot | verify label text + opacity per state |

### Reference Dataset / Fixtures

**No new fixtures needed.** Phase 20 reuses `cases.json` (116 entries, imported in every test that needs data):

- **Deterministic filter subset:** Country filter for Germany yields exactly 3 cases (IDs available in test setup). Use this throughout for exact count assertions.
- **Matched case computation:** Tests that verify `gather()` receives correct subset should mock `matchesFilter` to return a known 5-case array, then assert lifecycle functions are called with exactly that array.
- **Scene objects fixture:** Each test needing a `SceneObjects` mock should initialize:
  ```typescript
  {
    starMeshes: [...],
    nucleusMeshes: new Map(),
    filterState: new FilterState(),
    shortlist: new Set(),
    mode: 'global',
    // ... other required fields
  }
  ```

### Test Invariance

**Phase 18 Tests 8–9 (unified-column auto-expand/collapse) MUST still pass.**
- These tests verify that entering `constellation` view auto-expands the filter accordion.
- Plan 20-03 adds the Gather button inside the accordion but does NOT change expand/collapse behavior.
- Verification: `npm run test` includes tests/unified-column.test.ts; both tests named explicitly in CI or test output.
- Expected: 287 baseline + ~8 new tests for Gather button = ~295 total; passing.

**Phase 19 filter behavior invariance:**
- `applyFilter(objects, newFilter)` still mutates `objects.filterState` correctly (just removed scene side-effects).
- Readout count (`N CASES`) still updates live as filter changes.
- Tests in `src/data/filter.test.ts` should still pass (matchesFilter predicate unchanged).

### Coverage Matrix (Dimension × Test Type)

Each of Phase 20's 10 must-haves (from 20-01-PLAN.md) verified by test type:

| Must-Have | Unit | Integration | E2E | Automated command |
|-----------|------|-------------|-----|-------------------|
| **T1: Filter changes produce zero scene animation** | ✓ | ✓ | ✓ | `npm run test -- --grep "applyFilter.*silent"` + Playwright snapshot |
| **T2: applyFilter() mutates only filterState** | ✓ | ✓ | — | `npm run test -- --grep "applyFilter.*state.*mutation"` |
| **T3: StarState.filterMatch/filterDim removed** | ✓ | — | — | `grep -r "filterMatch\|filterDim" src/ \| grep -v node_modules \| wc -l` → 0 |
| **T4: Global tick-loop opacity block deleted** | ✓ | — | — | `grep -n "356-372\|filterMatch.*tick" src/scene/scene-state.ts \| wc -l` → 0 |
| **T5: Focused-mode filter dim gutted** | ✓ | ✓ | — | `npm run test -- --grep "focused.*filter.*silent"` |
| **T6: Tests rewritten; count within ±15** | — | ✓ | ✓ | `npm run test 2>&1 \| grep "passed"` → expect 280–295 |
| **T7: gather() entry point exists & testable** | ✓ | ✓ | — | `npm run test -- --grep "gather\(\)"` → ≥6 tests pass |
| **T8: Gather button 5 states implemented** | ✓ | ✓ | ✓ | `npm run test -- --grep "gather.*button.*state"` → 5 state tests |
| **T9: Button click routing correct** | — | ✓ | ✓ | `npm run test -- --grep "gather.*click"` → armed/drifted→gather, stranded→dispose |
| **T10: View-state gating works** | ✓ | ✓ | ✓ | `npm run test -- --grep "gather.*view.*gate"` → button absent in planetary/reading |

### Test File Structure

**New/Modified Test Files:**

| File | Scope | Changes |
|------|-------|---------|
| `src/scene/scene-state.test.ts` | applyFilter & tick-loop behavior | Rewrite global-branch tests to expect silent behavior; delete old staging-from-filter tests |
| `src/scene/orbitals/staging.test.ts` | gather() composition | Rewrite FILT-04/FILT-09 (lines 151–213) to use `gather()` directly; forward-compatible with Plan 20-02 |
| `src/tests/filter-wave.test.ts` | applyFilterWave disposition (D-14) | Rewrite to assert gather-traversal animation (stars animate toward sphere, not toward dim-opacity) |
| `src/ui/filter-panel.test.ts` (new/extended) | Gather button state machine | Add ~12 tests: 5-state determination, click routing, label rendering per state |
| `src/ui/unified-column.test.ts` | Phase 18 invariance | Verify Tests 8–9 still pass; button lives inside accordion |

---

## Risks & Mitigations

### Risk 1: Rewiring `applyFilterWave` without regressing stagger order
**Threat:** applyFilterWave currently animates stars to a dim-opacity target. Phase 20-01 removes the dim-opacity states, so the wave's target needs to change to "animate to staging sphere" (Phase 20-02's gather composite). If distance-sorted stagger is lost or inverted, Phase 23's star-motion polish will re-invent it.

**Mitigation:** 
- Locked by D-14 (REWIRE, don't delete). Plan 20-02 includes a test asserting star animation order matches distance sort.
- Unit test: mock matched stars at varying distances; run applyFilterWave; verify first-queued star is closest, last-queued is farthest.
- Reference: Phase 23 will inherit this wave and tune the easing/duration; the sort order is the contract Phase 23 depends on.

### Risk 2: Button state machine drift between filter events and sphere lifecycle events
**Threat:** Button state depends on three inputs: filterState, matchedCount, sphereExists. If these inputs update asynchronously (filter change event fires, then sphere created/disposed event fires separately), the button state can be inconsistent.

**Mitigation:**
- Single `determineGatherButtonState(filterState, matchedCount, sphereExists)` function called from all state-change paths.
- Unit tests verify all input combinations map to correct state.
- Integration test: sequence filter change + gather() call; assert button state is correct after each step.

### Risk 3: View-state gating body-class drift (Option A: CSS body-class approach)
**Threat:** View-state machine toggles body classes (body.planetary, body.constellation, body.global, body.reading). If body.reading class is added for Phase 20 but subsequent phases forget to toggle it, the Gather button will be hidden at wrong times.

**Mitigation:**
- Explicit unit test: run view-state machine through all transitions; verify body.reading class toggled at correct times (entering/exiting reading view).
- Add the body.reading toggle to `src/main.ts` view-state machine in Plan 20-03 Task 1, with comment: "Required by Phase 20 Gather button gating (D-10)."

### Risk 4: Test count volatility from FILT-04/FILT-09 rewrite
**Threat:** Baseline 287 tests. FILT-04/FILT-09 currently test filter-creates-staging coupling. After rewrite, they test gather()-creates-staging. If the new gather() has more test cases, count could spike beyond ±15.

**Mitigation:**
- Plan 20-02 specifies 6 gather() tests (no matched / created / updated / correct set). Plan 20-03 specifies ~12 button state tests. Total: ~18 new tests.
- Offset: old applyFilter staging tests (currently in scene-state.test.ts) are removed. Expected net: +8 to -5.
- Checkpoint: after Plan 20-01, run `npm run test` and record count. After each plan, diff against that baseline. If drift > ±15, pause and audit.

### Risk 5: Stale sphere + empty filter looks incoherent (D-13)
**Threat:** User clears all filters while a staging sphere exists. Per D-13, the sphere stays, and button shows `DISMISS` label. If the app doesn't render a visual cue that the sphere is orphaned, users might think it's still valid.

**Mitigation:**
- D-13 resolved this: the button label is the signal surface. No dim/border on the sphere itself (to keep scene silent).
- Playwright E2E test F5 (Dismiss flow) verifies the button label updates to `DISMISS` and the dismiss action disposes cleanly.
- Design reviewer sign-off needed post-execution (Phase 20-03 is not autonomous; planner gate).

---

## Existing Assets & Reuse

Plan 20-02 reuses from `src/scene/staging.ts`:

| Function | Signature | Used by gather() | TDD test level |
|----------|-----------|-----------------|-----------------|
| `createStagingNucleus` | `(objects, cases) → void` | Called when sphere doesn't exist | Integration (mocked) |
| `applyStagingPush` | `(objects) → void` | Called after create to push other spheres outward | Integration (mocked) |
| `zoomTowardStaging` | `(objects) → void` | Called after push to frame the staging sphere | Integration (mocked) |
| `animateStarsToStaging` | `(objects, cases) → void` | Called when sphere exists (re-gather); animates matched stars | Integration (mocked) |
| `disposeStagingNucleus` | `(objects) → void` | Existing; called by Stranded-state dismiss action | NOT CHANGED |
| `STAGING_KEY` | `'GATHERED'` (const) | Used by gather() to check sphere existence via `nucleusMeshes.has(STAGING_KEY)` | Unit (constant reference) |
| `_stagingDisposalTimeout` | `700ms debounce` | Applies to re-gather (dispose old sphere, create new one) to avoid flicker | Unchanged |

No rewrites needed to any of these. `gather()` is a new orchestrator function that composes them.

---

## Open Questions

**None — CONTEXT.md and UI-SPEC.md locked all implementation-critical questions.** 

Resolved decisions:
- D-04 (pure manual decoupling): Filter silent, Gather explicit. ✓
- D-10 (view-state gating): Button absent from planetary/reading. ✓
- D-12/D-13 (button state labels): 5 states with exact copy per state. ✓
- D-14 (applyFilterWave): Rewire as gather traversal, don't delete. ✓

Non-blocking planner discretion (already assigned to planner):
- Button DOM structure and CSS class naming convention (planner owned, not research-critical)
- Whether gather() lives in staging.ts or new gather.ts (planner owned, not research-critical)
- Plan split (2 vs. 3 plans) depends on whether applyFilterWave rewire is standalone or nested in another task (planner owned)

---

## Environment Availability

**Playwright MCP** — Verified working (Windows Chrome CDP + WSL MCP server per CLAUDE.md Playwright section). No additional dependencies needed for Phase 20 E2E tests.

**Test framework** — Vitest, already in use (v2.x); no upgrades needed. Configuration in `vitest.config.ts` covers existing test suites.

**TypeScript** — v5.x, npm run tsc clean after Phase 19. No new type challenges introduced by Phase 20 (gather() signature is straightforward).

---

## Metadata

**Confidence breakdown:**
- Standard stack (Three.js, GSAP, Vitest): HIGH — no changes, existing test patterns suffice
- Architecture (gather composition, filter decoupling): HIGH — locked in CONTEXT.md, verified by checker
- Validation strategy (test pyramid, golden paths): HIGH — plans already specify test structure; research confirms feasibility
- View-state gating (body-class toggle): MEDIUM-HIGH — Option A (CSS body-class) is established pattern; slight risk if body.reading class not added to view-state machine, mitigated by explicit unit test

**Research date:** 2026-04-19  
**Valid until:** 2026-05-03 (14 days; UI/UX stable, no library upgrades anticipated)

---

## RESEARCH COMPLETE
