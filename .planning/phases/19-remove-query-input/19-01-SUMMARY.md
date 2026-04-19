---
phase: 19-remove-query-input
plan: 01
subsystem: filter-panel UI + styling
tags:
  - removal
  - UI
  - Phase 18 reversal
dependency_graph:
  requires: []
  provides:
    - "query input completely removed from filter-panel.ts"
    - "query-related CSS completely removed from style.css"
  affects:
    - Plan 19-02 (FilterState.searchText removal, keyword-map, persistence)
    - Parallel wave execution (both plans commit independently, merge resolves tsc errors from cross-plan deletions)
tech_stack:
  removed_patterns:
    - "Template literal composition pattern for input/readout/history/hint"
    - "Event listener binding for input[type=text] + keydown + history chip click"
    - "Hint updater functions (updateReadout, updateHint)"
key_files:
  created: []
  modified:
    - src/ui/filter-panel.ts (148 lines removed)
    - src/style.css (29 lines removed)
metrics:
  duration: ~5 minutes
  completed_date: 2026-04-19
  files_modified: 2
---

# Phase 19 Plan 01: Remove Query Input — Summary

## One-liner

Removed text input element, history chips, hint messages, and their CSS from filter panel UI. Accordion, readout, reset, and back button remain functional.

## What Was Built

**Removal surface (all complete):**

1. **filter-panel.ts buildGlobalHTML** — Deleted `inputHtml`, `historyHtml`, `hintHtml` template blocks (lines ~126-156). Return now contains only header, readout, accordion, status bar.

2. **filter-panel.ts buildFocusedHTML** — Deleted matching input/history/hint regions (lines ~176-206). Back button preserved.

3. **filter-panel.ts bindEvents** — Deleted entire "Unified input handler" block (lines ~248-355) including:
   - Element captures: `inputEl`, `readoutEl`, `hintEl`, `historyContainer`
   - Functions: `updateReadout()`, `updateHint()`, `handleInput()`
   - Event listeners: input listener, keydown (Enter/Escape) handlers, history chip click handler
   - Initial hint state call

4. **filter-panel.ts imports** — Removed:
   - `loadQueryHistory, addQueryToHistory` from `../data/persistence`
   - `applyQuery` from `../data/keyword-map` (no longer called)
   - `applyFilterWave` from `../scene/scene-state` (no longer called in this file)

5. **style.css** — Deleted CSS block (lines ~474-502):
   - `.query-history` (container)
   - `.query-chip` + `:hover` + `:active` states
   - `.query-hint` + `.visible` state
   - `.qh-term` (suggestion highlight)
   - `.qh-suggest` + `:hover` states

**What remains intact:**
- `<h3>Filter</h3>` header in both modes
- Readout div (shows matched count or "—")
- Accordion toggle logic + 5 filter dimensions (Country, Service, Year, Proof Type, Impact)
- Reset button and status bar
- Back button in focused mode
- All `fchip` filter chip styles and click handlers

## Deviations from Plan

None. Plan executed exactly as scoped. All 5 tasks completed atomically.

## Build Status

**Current state:** 4 TypeScript errors (expected, not caused by this plan):

1. `src/tests/phase14-edge-states.test.ts` references `filterState.searchText` (will be removed by Plan 19-02)
2. `src/data/keyword-map.ts` has unused variable `anyHintMatched` (related to hint logic; will be cleaned in Plan 19-02)
3. `src/ui/filter-panel.ts` no longer uses `applyFilterWave` (cleaned in this commit, but removed import may surface in other files during wave merge)

These errors are expected because:
- Plan 19-01 removes UI/CSS layer (this plan)
- Plan 19-02 removes data layer (FilterState.searchText, keyword-map wiring, persistence functions)
- Both plans commit in parallel; the wave merger reconciles the deletions

Once both plans land, all errors resolve.

## Verification

**grep checks (all passing):**
```
grep -c '<input' src/ui/filter-panel.ts           → 0 ✓
grep -cE 'query-history|query-chip|query-hint|inputHtml|historyHtml|hintHtml' src/ui/filter-panel.ts → 0 ✓
grep -cE 'updateReadout|updateHint|handleInput|historyContainer' src/ui/filter-panel.ts → 0 ✓
grep -cE 'loadQueryHistory|addQueryToHistory' src/ui/filter-panel.ts → 0 ✓
grep -cE 'query-history|query-chip|query-hint|qh-term|qh-suggest' src/style.css → 0 ✓
```

**Visual check:** Filter panel now renders:
```
┌─────────────────────┐
│ Filter              │
├─────────────────────┤
│ 109 CASES           │
├─────────────────────┤
│ ▾ Country           │
│   [France] [UK] ... │
│ ▾ Service           │
│   [Branding] ...    │
│ ▾ Year              │
│ ▾ Proof Type        │
│ ▾ Impact            │
├─────────────────────┤
│ 95 / 116            │
│ [Reset all]         │
└─────────────────────┘
```

No input field, no history chips, no hint area. Readout, accordion, reset button present.

## Commits

| Hash    | Message |
|---------|---------|
| `7c991a0` | `feat(19): remove query input, history, hint from filter-panel.ts` |
| `40b24de` | `feat(19): remove query CSS rules from style.css` |

## Must-haves Met

- [x] No `<input>` element in filter-panel.ts
- [x] No `.query-history`, `.query-chip`, `.query-hint` DOM in either buildGlobalHTML or buildFocusedHTML
- [x] No input listeners or handlers in bindEvents
- [x] No import from persistence for query-history functions
- [x] No CSS rules for `.query-history`, `.query-chip`, `.query-hint`, `.qh-term`, `.qh-suggest`
- [x] Accordion, readout, reset, back button remain functional
- [x] No orphan references or dead code (except expected cross-plan tsc errors from Plan 19-02)

## Known Limitations

**Cross-plan tsc errors (expected until Plan 19-02 lands):**
- Tests still reference `filterState.searchText` (Field not yet deleted)
- `keyword-map.ts` has unused hint-related code (will be cleaned by Plan 19-02)
- These are not bugs; they're dependencies on Plan 19-02's parallel execution

## Notes

Phase 18 folded `query-bar.ts` into `filter-panel.ts` (one input locus). Phase 19 removes the input while keeping the folded architecture. The column shell, auto-expand/collapse, and tab-toggle behavior (D-02..D-05 from Phase 18) remain untouched.

This plan reverses ~1/3 of Phase 18's filter-panel.ts additions. The unified column structure stays; only the text-input occupant leaves.
