# Phase 20: Gather as Staging Action — Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Category:** feature (decouple) + removal (highlight-across-views)
**Preceding:** Phase 19 closed 2026-04-19 — filter is facet-only; no text input.
**Discussion path:** Mo delegated all four gray areas to Claude with directive "pick all you would recommend... don't stop." Decisions below are autonomous, defensible from DESIGN-STATE.md + MILESTONE-v3.3.md + v3.3 opening decisions. Logged to DECISIONS.md.

<domain>
## Phase Boundary

Separate filter mutation from scene reaction. After this phase:

- **Filter narrows the set silently.** Toggling Country/Service/Year/Proof Type/Impact updates the readout count and the internal matched set. It does not move stars, does not dim stars, does not create or modify the staging sphere, does not move the camera.
- **Gather is the explicit staging action.** A new `GATHER` button in the unified left column, when clicked, takes the currently-filtered set and creates/re-creates the staging sphere. This is the only path to the staging sphere going forward (beyond legacy return/disposal paths).
- **"Highlight filtered across all views" is gone.** The global-mode tick-loop block that dims non-matched stars and the focused-mode opacity tween on non-matched stars are both deleted. `StarState.filterMatch` / `StarState.filterDim` are removed as enum values.

**In scope:**
- New Gather button in `src/ui/filter-panel.ts` with three states (disabled / armed / staged).
- New `gather(objects)` entry point (likely in `src/scene/staging.ts`) — does what `applyFilter` currently does in the global branch when filter becomes active: `createStagingNucleus` + `applyStagingPush` + `zoomTowardStaging`, OR `animateStarsToStaging` if sphere already exists.
- Gut `applyFilter` in `src/scene/scene-state.ts` — collapse to: mutate `objects.filterState`, return. Remove both the global staging-creation branch and the focused-mode dim branch.
- Delete the global-mode `isMatch`/`filterMatch`/`filterDim` tick-loop block (~L356-372).
- Remove `filterMatch` / `filterDim` from `StarState`; remove their `resolveStarAppearance` mappings.
- Rewire or strip `applyFilterWave`'s dim-cascade writes (see D-08 — planner decides split).
- Rewrite tests in `src/scene/scene-state.test.ts`, `src/scene/orbitals/staging.test.ts`, `src/tests/filter-wave.test.ts`, `src/ui/filter-panel.test.ts` to match the new decoupled behavior.
- View-state gating: Gather button present only in `global` + `constellation` views. Absent from DOM in `planetary` + `reading`.
- Verify existing `unfocusSphere` / view-state-change disposal paths still dispose a staging sphere correctly even though filter no longer creates/updates it.

**Out of scope (deferred):**
- Redesigning the Gather animation (wave-sweep vs. direct travel, stagger timing). If `applyFilterWave`'s timing is repurposed for the gather traversal, its polish belongs in Phase 23.
- Removing dead UI stubs `#gatherList` / `#gatherStage` from `index.html` — Phase 26's scope.
- Keyboard shortcut for Gather — Phase 27 keyboard audit.
- Right-side "gathered button" removal — Phase 26.

</domain>

<decisions>
## Implementation Decisions

### Gather button — placement & register

- **D-01 placement.** Inline at the bottom of the filter accordion, inside the unified left column. Not a sticky bar, not a separate header. Rationale: the column is the filter instrument; Gather is the instrument's output action; the cognitive order is scan-facets → act, so bottom-of-accordion matches the flow. Honors Phase 18's one-pane-one-model contract.
- **D-02 visual register.** Gold (`--gold: #e8b15a`) for armed state; teal-ghosted for disabled; DM Mono uppercase label (`GATHER`). Hairline button (thin border, transparent fill), no solid pill. Rationale: DESIGN-STATE.md — gold = navigation/active, teal = observed/measured. Gather is an action → gold. Hairline + DM Mono matches BYLD analog-precision register; solid pills read as SaaS button-mashing (rejected register).
- **D-03 three states.**
  - **Disabled** — no filters active OR filtered set is empty. Ghosted, non-clickable. Small hint in readout area: `— CASES` or `0 CASES — REFINE`.
  - **Armed** — filters active, set ≥ 1. Gold hairline. Click → stages.
  - **Staged** — sphere currently exists. Label updates (e.g., `GATHERED · N` or equivalent — planner refines phrasing). Click → re-gathers with current filter (overwrites sphere).
- **D-06 empty-filter + zero-match Gather are forbidden.** Button disabled in both cases. No dead-press UI.

### Filter ↔ staging relationship

- **D-04 Pure manual decoupling.** Filter narrows set silently. Gather stages the currently-filtered set. Filter changes while sphere exists do NOT update the sphere — button returns to armed state and user must re-click to re-gather. Rejected: live-while-staged (smuggles the old coupling back); Gather-as-toggle with separate close button (adds chrome; existing disposal paths suffice).
- **D-05 disposal.** No new close button. Existing disposal paths stay:
  - `unfocusSphere` / view-state transitions still dispose the sphere.
  - Filter cleared to empty → planner decides: either button re-disables and sphere stays (user must click Gather again to restage), OR filter-clear auto-disposes. Default recommendation: sphere stays until user acts (consistent with pure-manual model), but VERIFY this doesn't create a stale-sphere-with-no-filter state that looks incoherent. Planner confirms via Playwright pass.
  - Gather button re-click when sphere exists → restages (replaces) with current filter.
- **D-11 view-state transitions.** Entering `reading` or `constellation` with a staging sphere present → existing paths dispose it; Phase 20 adds a test that verifies this still fires correctly now that filter no longer triggers creation.

### Highlight-across-views removal

- **D-07 full strip.** No dead-code retention. Delete:
  - `src/scene/scene-state.ts` L356-372 — global-mode per-frame `isMatch`/`filterMatch`/`filterDim` opacity writes in the tick loop.
  - `src/scene/scene-state.ts` L448-477 — focused-mode GSAP opacity tween on non-matched stars inside `applyFilter`.
  - `applyFilter` collapses to: `objects.filterState = newFilter; return;` (plus recompute of `matchedCases` if needed for readout count — planner decides if that lives in filter-panel or filter-counts).
- **D-08 StarState cleanup.** Remove `filterMatch` and `filterDim` from `StarState` enum. Remove their entries in `resolveStarAppearance`. If `applyFilterWave` writes these states, either (a) rewire the wave as the gather traversal animation, or (b) delete the wave entirely if the new gather doesn't need the staggered timing. Planner decides based on whether the gather pipeline wants distance-sorted staggering. Plan split:
  - Plan 20-A: strip highlight behavior + StarState cleanup.
  - Plan 20-B: add Gather button + `gather(objects)` entry point + view-state gating.
  - Plan 20-C (conditional): rewire or delete `applyFilterWave`; UI/scene tests rewrite.
- **D-09 readout stays live.** The `N CASES` count in the filter panel readout updates live as filters change, independent of Gather. Rationale: silent scene ≠ invisible feedback. The readout is the observation surface — it is how users know filter is doing something without watching stars react.

### View-state gating

- **D-10 Gather present in `global` + `constellation` only.** Absent from DOM in `planetary` and `reading` views. Follows the same hide-per-view pattern as the Phase 22 (merged into Phase 17) contextual bottom-right panel. Not disabled-but-visible — fully removed from the DOM in those view-states to avoid visual noise in the overture and reading registers.

### Claude's Discretion

- Exact button DOM structure + CSS selector naming (`.gather-button`? `.column-action`? match existing filter-panel selector conventions).
- Whether `gather(objects)` lives in `src/scene/staging.ts`, a new `src/scene/gather.ts`, or is exported directly from the button's click handler.
- Plan split (2 vs. 3 plans) based on what the planner finds when touching `applyFilterWave`.
- Readout copy when filter is active but set is empty (`0 CASES — REFINE` is a suggestion, not a mandate).
- Whether staged-state label is `GATHERED · N` vs. `RE-GATHER` vs. something else — copy tuning can happen during execution.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### This Phase

- `.planning/MILESTONE-v3.3.md` §2 "Filtering and gathering — one model, staged once" (L57-66) — the source intent for Phase 20. Explicit language: "Filter narrows the set silently; clicking Gather is what stages the filtered cases. Highlighting filtered cases across all views goes away — visual noise."
- `.planning/ROADMAP.md` Phase 20 bullet (L27) — one-line mandate.
- `.planning/MILESTONE-v3.3.md` Phase Breakdown table row 20 (L114) — verification gate: "Filter mutation does not animate; Gather click triggers staging sphere."
- `.planning/phases/19-remove-query-input/19-CONTEXT.md` — filter-panel-only model this phase builds on top of.
- `.planning/phases/18-unified-left-column/18-SUMMARY.md` — unified column architecture Gather button lives inside.

### Design Authority

- `DESIGN-STATE.md` (project root) — active direction, gold/teal tokens, analog-precision register, rejected options.
- `design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md` — design authority for v3.3.
- `design/canon/web-apps/kunumi-institute.md` — structural model (inquiry-over-filtering; one pane; cognitive order).
- `design/canon/web-apps/byld.md` — register (analog precision, instrument panels, not SaaS dashboards).
- `design/rejections/*.md` — non-negotiables. Dashboard chrome, solid button pills, and multi-pane UI are all rejected registers.

### Code — Primary Edit Surface

- `src/scene/scene-state.ts` L308-478 — `applyFilter` and the global-mode tick-loop opacity block. Gutting target.
- `src/scene/scene-state.ts` L494-544 — `applyFilterWave`. Rewire or delete (Plan 20-C).
- `src/scene/staging.ts` — existing `createStagingNucleus` / `disposeStagingNucleus` / `animateStarsToStaging` / `applyStagingPush` / `zoomTowardStaging` / `returnStarsFromStaging`. New `gather(objects)` entry point likely exports from here.
- `src/ui/filter-panel.ts` — host for the new Gather button + three-state logic + view-state visibility gating.
- `src/data/star-state.ts` — remove `filterMatch` / `filterDim` enum members and their `resolveStarAppearance` entries.
- `src/data/view-state.ts` — confirms view-state kinds; Gather button visibility gates on these.

### Code — Verify/Test Surface

- `src/scene/scene-state.test.ts` — global-branch filter tests will fail; rewrite to expect NO staging from `applyFilter`.
- `src/scene/orbitals/staging.test.ts` L151-213 — FILT-04 / FILT-09 fixtures expect filter→staging coupling; rewrite to exercise `gather()` directly.
- `src/tests/filter-wave.test.ts` L63-72 — `filterMatch`/`filterDim` writes; rewrite or delete per D-08.
- `src/ui/filter-panel.test.ts` — add tests for three-state button, view-state gating, click→gather wiring.
- `src/ui/unified-column.test.ts` — verify Gather button lives inside the column shell; Tests 8-9 (Phase 18 auto-expand) must still pass.

### Project Register

- `.planning/PROJECT.md` — v3.3 goals.
- `.planning/STATE.md` — current position (phase-19-closed-ready-to-plan-phase-20).
- `.planning/DECISIONS.md` — autonomous-decision audit log; Phase 20 decisions D-01..D-11 logged there.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`createStagingNucleus` / `applyStagingPush` / `zoomTowardStaging` / `animateStarsToStaging` / `returnStarsFromStaging` / `disposeStagingNucleus`** in `src/scene/staging.ts` — all the lifecycle primitives already exist. Phase 20 adds a new entry function that composes them; does not rewrite them.
- **`STAGING_KEY` nucleus identity** — used by click handler in main.ts to recognize staging sphere clicks. No change needed.
- **`_stagingDisposalTimeout` debounce** (700ms) — still applies to disposal path (e.g., when user re-gathers with a different filter). Keep the debounce so re-gather with different filter doesn't cause sphere flicker.
- **`resolveStarAppearance`** in `src/data/star-state.ts` — opacity lookup stays; only the `filterMatch`/`filterDim` entries go away.
- **`matchesFilter`** in `src/data/filter.ts` — stays; Gather uses it to compute matched set at click-time. Not called in tick loop anymore.
- **Filter-panel accordion + readout + tab-toggle** — Phase 18/19 architecture unchanged. Gather button is added inside this existing shell.
- **View-state hide-per-view pattern** — already established for Phase 17's merged bottom-right panel. Gather follows the same mechanism.

### Established Patterns

- **Filter state is one mutable object on `SceneObjects`.** `objects.filterState` — Gather reads from it at click time. Pure-manual decoupling (D-04) means no observer/subscription pattern is needed; the button just asks "what's the current filter?" when clicked.
- **CSS tokens only — no hex literals in new code.** `--gold`, `--teal`, `--ease`. Gather button CSS uses named tokens.
- **DM Mono for all labels in the column.** Gather button label follows.
- **Tests live alongside source.** New gather-related tests colocate with the new gather entry point + in filter-panel.test.ts for the button.

### Integration Points

- **Filter-panel facet change handlers** currently call `applyFilter` (which does the heavy visual lifting). After Phase 20, they still call `applyFilter`, but `applyFilter` is now a trivial state mutation — no visual effect. The readout count is updated separately (either inside `applyFilter` or via a separate recount call). Planner chooses.
- **Click routing in `main.ts`** — clicking the staging-sphere nucleus today focuses into its ring. That path stays intact — Phase 20 doesn't change what clicking the sphere does, only how the sphere comes into existence.
- **View-state transitions** — existing `onViewStateChange` or equivalent (already gates column auto-expand from Phase 18) is where Gather button visibility gating registers. One more subscriber.

### Risk & Gotchas

- **Dead-code residue risk.** If `applyFilterWave` is left partially gutted ("remove the dim writes, keep the wave timing for future use"), it becomes a mystery function. Plan 20-C must resolve it either way.
- **Test-suite shift is nontrivial.** The scout estimate says ~4 test files are affected. Expect some test count reduction as filter-causes-staging tests collapse; expect some additions for the new button behavior. Net may be flat.
- **Stale sphere + empty filter.** If user clears all filters while sphere is present, the sphere represents a now-empty filter. Pure-manual says sphere stays until next Gather click; planner should verify via Playwright that this is not visually incoherent. If it is, either (a) auto-dispose on filter-empty (exception to D-04), or (b) the button transitions to a "DISMISS" affordance. Flag for planner's UAT pass.
- **Wave timing in gather.** If the new gather animation reuses `applyFilterWave`'s distance-sorted stagger, the stars still travel in a wave — but now toward the sphere, not toward a dim-opacity target. Verify this reads as "gathering" rather than the old "highlighting." Phase 23 polish can tune; Phase 20 needs it to be at-least-not-wrong.

</code_context>

<specifics>
## Specifics

- **Mo's directive 2026-04-19 (discuss-phase):** "Pick all you would recommend or what you would think I would do and continue. Don't stop. Go." All four gray areas resolved autonomously by Claude. Decisions defended from DESIGN-STATE.md, MILESTONE-v3.3.md §2, and v3.3 opening decisions (STATE.md L31-37). Audit trail in `.planning/DECISIONS.md`.
- **Observatory metaphor applies to Gather.** You compose a question (filter), then *observe* by gathering. Gather is the shutter release, not a continuous reaction. This framing is why D-04 (pure manual) wins over live-while-staged.
- **BYLD register applies to the button.** Hairline + DM Mono uppercase. No filled pill. No gradient. No shadow.
- **Phase 20 is load-bearing for Phase 23.** Star motion polish (Phase 23) depends on the gather animation having a clean entry point it can tune. Leaving `applyFilterWave` in an ambiguous state makes Phase 23 harder.

</specifics>

<deferred>
## Deferred Ideas

- **Gather animation polish** — wave-sweep vs. direct travel, stagger timing, arrival easing. Phase 23 (Star Motion + Dim/Highlight Polish).
- **Dead UI stub removal** — `#gatherList`, `#gatherStage`, right-side "gathered button". Phase 26 (Removals, Kimi dispatch).
- **Keyboard shortcut for Gather** — Phase 27 keyboard-path audit.
- **Readout copy refinement** (e.g., `0 CASES — REFINE` vs. alternatives) — tune during execution; not a discussion blocker.
- **Auto-dispose on filter-empty** — flagged as a Playwright-time decision for the planner (see "Stale sphere + empty filter" in Risk & Gotchas). If it needs to become a real decision, captured as a CHECKPOINT during execution rather than blocking here.

</deferred>

---

*Phase: 20-gather-as-staging-action*
*Context gathered: 2026-04-19*
*Discussion path: Autonomous — Mo delegated full decision authority. All 11 decisions defended from existing canon. Audit trail in DECISIONS.md 2026-04-19 entry.*
