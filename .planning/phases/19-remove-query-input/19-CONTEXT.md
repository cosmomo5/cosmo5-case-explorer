# Phase 19: Remove Query Input — Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Repurposed:** from brainstorm spike "Text-Input-Drives-Stars" → feature/removal "Remove Query Input" (2026-04-19 session)

<domain>
## Phase Boundary

Remove the text-query input, its history chips, its hint states, and its backing `FilterState.searchText` field from the case explorer. After this phase, filtering is **facet-only**: users narrow the set via the Country / Service / Year / Proof Type / Impact accordion in the unified left column.

The unified column itself (shipped in Phase 18) stays. Filter panel tab + expand/collapse behavior stays. The underlying 80ms-debounced `applyFilterWave` stays — only the `searchText` predicate leg is cut. The original brainstorm-spike vision (typing-as-scene-force) is deferred to `SEED-001` for a future milestone.

**In scope:**
- Delete the `<input>` element, ENTER/Escape handlers, `.query-history` chips, `.query-hint` no-match/suggestion logic in `filter-panel.ts`.
- Drop `FilterState.searchText` and the `matchesFilter` search branch in `data/filter.ts`.
- Drop `searchText` wiring in `data/keyword-map.ts`.
- Drop `addQueryToHistory` / `loadQueryHistory` and their localStorage schema slot in `data/persistence.ts`.
- Drop `.query-history` / `.query-chip` CSS rules in `style.css`.
- Delete `src/tests/filter-searchtext.test.ts`.
- Drop query-input tests from `src/ui/unified-column.test.ts` (keep the column-shell tests).
- Verify `main.ts` + any other caller does not depend on `filterState.searchText`.

**Out of scope:**
- Reforming the filter panel structure. Accordion + counts + readout all stay.
- Reforming the column expand/collapse behavior from Phase 18. Keep the tab, keep D-02..D-05.
- Any user-facing change beyond the input's disappearance.
- Schema migration for existing users' localStorage query-history entries — the v3.3 audience is the Cosmo5 internal team on a fresh `draft` branch; clean delete is fine. If a persisted entry exists on an old key, it becomes dead data in localStorage — acceptable.

</domain>

<decisions>
## Implementation Decisions

### Removal Surface (scanned 2026-04-19)

- **D-01 filter-panel.ts template block.** Delete the "Input + readout + history + hint (unified input region)" block (lines ~126-155 and ~176-205, both branches). Keep the `<h3>Filter</h3>` header and readout `<div>` if they were independent — confirm in planning.
- **D-02 filter-panel.ts wiring block.** Delete the `inputEl` capture, `hintEl` capture, `historyContainer` capture, input listener, keydown Enter/Escape handlers, history-chip click handler, and suggestion-chip rebinding (lines ~249-355). Keep the accordion `toggleGroup` wiring.
- **D-03 filter.ts.** Remove the `searchText?: string` field from `FilterState` (line 14). Remove the `searchText` activeness check from `isActive` (line 37). Remove the `searchText` branch from `matchesFilter` (lines 63-64). Run tsc — expect failures in consumers; fix them in the same commit.
- **D-04 keyword-map.ts.** Remove the two `fs.searchText` lines (108, 121). If the whole `searchText` pathway is the only reason a helper exists, remove the helper too.
- **D-05 persistence.ts.** Remove `addQueryToHistory` + `loadQueryHistory` functions (starting line 140 + related constants). Remove the localStorage schema key if it is declared separately.
- **D-06 style.css.** Remove `.query-history` and `.query-chip` rules (475-485). Check for orphan selectors like `.qh-term`, `.qh-suggest`, `.visible` on hint — remove any that are now dead.
- **D-07 tests.** Delete `src/tests/filter-searchtext.test.ts` entirely. In `src/ui/unified-column.test.ts`, remove any test whose subject is the input, history chips, hint, or suggestion chips. Keep tests for the column shell, accordion, readout, tab toggle, view-state auto-expand (tests 8-9).
- **D-08 main.ts audit.** Grep for `searchText` in `src/main.ts` and anywhere else. Any caller that reads or writes it is part of this phase's delete set.
- **D-09 no feature flag, no backward-compat branch.** Pure deletion; no `if (QUERY_INPUT_ENABLED)` guards or `// Deprecated: remove in v3.4` comments. The code is gone in one phase.

### Post-removal verification

- **D-10 green gates.** `npm run test` → 303/303 minus the deleted search tests, ≤290/290. `npm run build` succeeds; bundle size ↓ (expected 2-5 kB gzipped reduction). `tsc` clean.
- **D-11 visual regression.** Column expanded in constellation view shows only the header, readout, and accordion — no input, no chips, no hint slot. Collapsed tab state unchanged.
- **D-12 UAT rerun is not required.** Phase 18 UAT test T8 ("query input filters stars") and the no-query-bar-residue T9 become invalid/vacuously-true respectively. Note in Phase 19 UAT that these are superseded.

### Claude's Discretion

- How to partition the work into plans. My guess is 2 plans (TS/data layer + UI/CSS/tests), possibly 3 if persistence cleanup is nontrivial. Planner decides.
- Whether to do a single commit per plan or finer-grained atomic commits (GSD-executor default is fine).
- Whether to delete `src/ui/unified-column.test.ts` tests one-by-one or rewrite the file around what remains. Planner decides based on test density.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### This Phase

- `.planning/seeds/SEED-001-text-input-drives-stars.md` — why the original spike was shelved and why the removal is the right call now; also documents the 3-axis future-reintroduction question. The planner does not need to honor any of the seed's build guidance, but it should NOT reintroduce the input under any other name.
- `.planning/phases/18-unified-left-column/18-SUMMARY.md` (all six) — what Phase 18 actually shipped. The input being removed was added in Plans 18-03 and 18-04. The planner's delete set should cross-check against these summaries.
- `.planning/phases/18-unified-left-column/18-UAT.md` — T8 evidence of the input working, T9 evidence of no query-bar residue. Post-removal, T8 is superseded and T9 is vacuously true.

### Phase 18 Work to Preserve (do NOT delete)

- `src/ui/unified-column.test.ts` Tests 8-9 (auto-expand/collapse on view-state events). These are D-05 wiring, not query wiring.
- `src/ui/filter-panel.ts` accordion + readout + tab-toggle logic. Only the query-input region is cut.

### Project Register

- `DESIGN-STATE.md` (project root) — observatory register, teal = observed, gold = navigation, single ease. A removal should not disturb any of these. No new visual tokens introduced.
- `.planning/MILESTONE-v3.3.md` — "Resolve the Observatory" premise. Removing the typing input aligns with the v3.3 goal of resolving what exists before adding new response behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `applyFilterWave(sceneObjects, filterState)` in scene-state.ts — the 80ms-debounced mutation path. Still used by the facet checkboxes; stays.
- Accordion `toggleGroup` logic in filter-panel.ts — stays.
- Readout element (`109 CASES` / `— CASES`) — stays; it just reflects facet filters now.
- `loadQueryHistory` / `addQueryToHistory` — deleted. Nothing else in the codebase uses them.

### Established Patterns

- The codebase has one `FilterState` type (data/filter.ts). `searchText` is one of several optional predicate fields. Removing it is subtraction from a shape, not a refactor of the shape.
- Tests live next to source (`filter-panel.ts` + `unified-column.test.ts`). `filter-searchtext.test.ts` is an outlier in `src/tests/` — the whole file is query-specific, so deletion is clean.
- CSS in `style.css` is append-only, loosely scoped. `.query-history` and `.query-chip` are localized to the 475-485 block. No dependent selectors outside this range.

### Integration Points

- `main.ts` constructs the `FilterState` and passes it to `mountFilterPanel`. Verify no direct `searchText` reads.
- `keyword-map.ts` converts keyword taxonomy → `FilterState`. Its two `searchText` mutations are the only writes outside the input handler; confirm nothing downstream relies on them being present.
- `persistence.ts` also holds unrelated localStorage state (shortlist, reading-progress?). Keep those; delete only the query-history functions and their key.

</code_context>

<specifics>
## Specifics

- Mo's explicit instruction (2026-04-19): "Let's put a pin on this feature. Capture what its meant to so and document it. Let's remove this typing thing completely. User filters with the filter panel only."
- Scope reversal against Phase 18: Phase 18 deliberately folded `query-bar.ts` INTO `filter-panel.ts` so there was one input locus. Phase 19 removes that input entirely. The folded architecture stays; the input's occupant is what leaves.
- The column itself and its auto-expand / collapsed-to-tab behavior are load-bearing (D-02..D-05). Do not touch the column shell.

</specifics>

<deferred>
## Deferred Ideas

- **Typing-as-scene-force** — full vision captured in `.planning/seeds/SEED-001-text-input-drives-stars.md`. Surfaces automatically on future `/gsd-new-milestone` when trigger condition fires.
- **localStorage schema cleanup for users who already have saved query history** — out of scope. v3.3 audience is internal on `draft`; dead keys are acceptable.
- **Readout text when no filters active** — currently shows the total count (`116 CASES`). No change needed, but planner should confirm behavior remains coherent without the input's "—" placeholder phase.

</deferred>

---

*Phase: 19-remove-query-input*
*Context gathered: 2026-04-19*
*Discussion path: workflow tool blocked by v3.3 roadmap-grep quirk → context captured manually by Claude from scanned surface + Mo's explicit instruction + design register.*
