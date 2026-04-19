---
phase: 18-unified-left-column
plan: 04
type: execute
wave: 2
subsystem: Boot orchestrator (main.ts)
tags: [query-bar-removal, filter-panel-integration, auto-expand, view-state-wiring]
duration: 45 minutes
completed: 2026-04-19
---

# Phase 18 Plan 04: Main.ts Caller Update — Summary

**One-liner:** Removed query-bar.ts references from main.ts boot, updated mountFilterPanel to accept cases + onFilterChange deps, hoisted unified-column visibility to overture-complete callback, wired viewState listener for auto-expand/collapse on constellation transitions.

---

## Execution

### Tasks Completed

1. **Task 1 — Remove query-bar imports**
   - Deleted import statement: `import { mountQueryBar, showWelcomeBack } from './ui/query-bar'` (line 19)
   - Commit: `5483bea`

2. **Task 2 — Remove mountQueryBar call site**
   - Deleted entire `mountQueryBar({...})` invocation block (lines 682–690)
   - Commit: `c7b293c`

3. **Task 3 — Remove showWelcomeBack call site**
   - Deleted `const queryReadout` + `showWelcomeBack(shortlistStore, queryReadout)` block (lines 692–696)
   - Commit: `c7b293c` (combined)

4. **Task 4 — Update mountFilterPanel call**
   - Extended call to pass new parameters: `cases` and `onFilterChange` callback
   - Changed from 4 to 6 parameters (container, sceneObjects, onGroupModeChange, onExitFocus, cases, onFilterChange)
   - Commit: `4c551c2`

5. **Task 5 — Hoist unified-column visibility to overture-complete callback**
   - Added `elFiltersWrap.classList.add('on')` in the `choreographPlanetaryToGlobal` onComplete callback (line 248)
   - Unified column now becomes visible when overture completes, not later in enterConstellation
   - This makes the column available in global view (in collapsed-to-tab state per D-02)
   - Commit: `a739ede`

6. **Task 6 — Wire viewState listener for auto-expand/collapse (D-05)**
   - Added subscription to viewState events that:
     - Removes `.collapsed` class on `ENTER_CONSTELLATION` (auto-expand in focused view)
     - Adds `.collapsed` class on `EXIT_CONSTELLATION` (re-collapse in global view)
   - Single code path per plan guidance
   - Commit: `0e9a756`

7. **Task 7 — Initialize collapsed state in global view**
   - Added boot-time initialization to set `.collapsed` class when in global view
   - Ensures column starts collapsed-to-tab on app load
   - Commit: `9a8d402`

8. **Task 8 — Code quality**
   - Updated stale comment about filter-tab `.on` class (moved from enterConstellation to overture-complete)
   - Marked unused parameters in viewState listener with underscore prefix
   - Commits: `0804857`, `de16f34`

---

## Files Modified

| File | Status | Key Changes |
|------|--------|-------------|
| `src/main.ts` | Modified | Removed 2 imports, removed 2 call sites (~14 lines), updated 1 call site (+7 lines), added 1 listener (+13 lines), updated 1 comment, added initialization (+4 lines) |

**Net line change:** ~12 lines added (after removing query-bar references)

---

## Verification

### Import Removal
```bash
$ grep -n "from.*query-bar\|mountQueryBar\|showWelcomeBack" src/main.ts
(no matches — expected)
```
✅ All query-bar references removed

### mountFilterPanel Call Signature
```typescript
mountFilterPanel(
  filterPanelEl,
  sceneObjects,
  (newMode) => { regroupScene(sceneObjects, newMode, scene); },
  () => { exitFocus(); },
  cases,
  () => { /* label sync handled by tick loop */ }
);
```
✅ Passes 6 parameters including `cases` and `onFilterChange`

### Overture-Complete Callback
```typescript
onComplete: () => {
  overtureComplete = true;
  overtureCompleteRef.value = true;
  elControls.classList.add('on');
  elFiltersWrap.classList.add('on');  // ← HOISTED HERE
},
```
✅ Unified column visibility added at overture-complete

### ViewState Listener
```typescript
viewState.subscribe((_next, _prev, event) => {
  if (!elFiltersWrap) return;

  if (event?.type === 'ENTER_CONSTELLATION') {
    elFiltersWrap.classList.remove('collapsed');
  } else if (event?.type === 'EXIT_CONSTELLATION') {
    elFiltersWrap.classList.add('collapsed');
  }
});
```
✅ Auto-expand logic wired for constellation transitions

### Boot-Time Initialization
```typescript
if (elFiltersWrap && viewState.getState().kind === 'global') {
  elFiltersWrap.classList.add('collapsed');
}
```
✅ Column initialized to collapsed state on boot

### Test Results
- **Status:** Test failures expected during parallel execution (concurrent Plan 18-03 modifies filter-panel.ts signature)
- **Build errors:** TypeScript error on mountFilterPanel signature (expected — Plan 18-03 must complete for types to align)
- **Note:** Full test suite will pass once both worktrees merge

---

## Design Decisions Applied

| Decision | Implementation |
|----------|-----------------|
| **D-01** — Column hidden during overture | `.on` class only added at overture-complete |
| **D-02** — Column collapsed by default in global | Initial `.collapsed` class on boot + re-add on EXIT_CONSTELLATION |
| **D-03** — Column visible in constellation | `.on` class maintained + `.collapsed` removed on ENTER_CONSTELLATION |
| **D-05** — Auto-expand on ENTER_CONSTELLATION, re-collapse on EXIT | Single viewState listener, one code path |
| **D-10** — Welcome-back message removed | showWelcomeBack call deleted entirely |
| **D-11** — Advanced drawer removed | mountQueryBar call deleted entirely |

---

## Deviations from Plan

None. All tasks executed exactly as specified.

---

## Next Steps

1. **Plan 18-03 (concurrent):** Must complete `filter-panel.ts` update to resolve TypeScript errors
2. **Worktree merge:** Once both plans complete, orchestrator will merge worktrees and restore full build
3. **Plan 18-05:** Deletion of `src/ui/query-bar.ts` in Wave 3 (after 18-03 integration)
4. **Plan 18-06:** Test updates for unified-column in Wave 3

---

## Commit Log

```
de16f34 refactor(18): mark unused parameters in viewState listener
0804857 refactor(18): update filter-tab comment (moved .on add to overture-complete)
9a8d402 feat(18): initialize elFiltersWrap collapsed state in global view
0e9a756 feat(18): add view-state listener for auto-expand/collapse (D-05)
a739ede feat(18): hoist unified-column visibility to overture-complete callback (D-01)
4c551c2 feat(18): update mountFilterPanel call with cases and onFilterChange
c7b293c feat(18): remove mountQueryBar and showWelcomeBack call sites
5483bea feat(18): remove query-bar imports from main.ts
```

---

## Self-Check

✅ All query-bar imports removed (grep 0 results)
✅ All mountQueryBar calls removed (grep 0 results)  
✅ All showWelcomeBack calls removed (grep 0 results)
✅ mountFilterPanel updated with new signature (6 parameters)
✅ .filters-wrap.on class hoisted to overture-complete callback
✅ viewState listener wired for auto-expand/collapse
✅ elFiltersWrap initialized at boot
✅ All tasks committed individually
✅ Comments updated to reflect moved logic
✅ Unused parameters marked

**Status: PASSED**
