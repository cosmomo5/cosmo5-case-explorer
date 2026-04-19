---
phase: 18-unified-left-column
plan: 05
subsystem: File cleanup (query-bar.ts deletion)
tags: [orphaned-file-removal, filter-panel-integration]
duration: "15 minutes"
completed: 2026-04-19
---

# Phase 18 Plan 05: Query-Bar File Deletion — Summary

**One-liner:** Deleted the orphaned `src/ui/query-bar.ts` file (298 lines) after all its functionality was migrated to `filter-panel.ts` and all call sites removed from `main.ts` in prior waves.

---

## Execution

### Tasks Completed

1. **Task 1 — Delete src/ui/query-bar.ts**
   - File deleted via `git rm src/ui/query-bar.ts`
   - Removed 298 lines of code
   - Functions deleted:
     * `mountQueryBar()` — migrated to filter-panel.ts event wiring
     * `showWelcomeBack()` — dropped per D-10 (design decision)
     * `countMatches()` — migrated to filter-panel.ts (renamed, line 73)
     * `countMatchingClusters()` — logic migrated to filter-panel.ts
     * `updateReadout()` — absorbed into filter-panel.ts render flow
     * `updateHint()` — absorbed into filter-panel.ts event handlers
     * `renderQueryHistory()` — absorbed into filter-panel.ts render flow
   - Commit: `2052108`

2. **Task 2 — Verify no remaining imports in source code**
   - Grep confirmed: **0 imports of query-bar in non-test source code**
   - Test file `src/tests/clusters-count.test.ts` imports `countMatches` and `countMatchingClusters` (expected — Plan 18-06 will update tests)
   - Commit: same as Task 1

---

## Files Deleted

| File | Status | Impact |
|------|--------|--------|
| `src/ui/query-bar.ts` | Deleted (298 lines) | Functions migrated or dropped; no behavioral change |

**Net change:** Codebase reduced by 298 lines. All functionality preserved in filter-panel.ts or dropped per design decisions.

---

## Verification

### File Deletion
```bash
$ test ! -f src/ui/query-bar.ts && echo "✓ File deleted"
✓ File deleted
```

### Import Cleanup (non-test source)
```bash
$ grep -r "from.*query-bar" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\.ts"
(no results)
✓ No stray imports in production source
```

### Build Status
```
TypeScript compilation error (expected):
  src/tests/clusters-count.test.ts(12,53): error TS2307: Cannot find module '../ui/query-bar'

This is expected and correct behavior. Test file still imports the deleted module.
Plan 18-06 owns test updates and will resolve this import error.
```

---

## Expected Test Failures

The following test files import from the deleted `query-bar.ts` and will fail at build/test time:

| Test File | Status | Handler |
|-----------|--------|---------|
| `src/tests/clusters-count.test.ts` | **Import error** | Plan 18-06 (concurrent) — update imports to use filter-panel.ts or drop tests |
| `src/tests/query-bar.test.ts` | May have failures | Plan 18-06 — determine if this file is removed, adapted, or migrated |

**This is not a blocker.** Parallel Plan 18-06 explicitly handles test file updates. File deletion is complete and correct.

---

## Design Decisions Applied

| Decision | Implementation |
|----------|-----------------|
| **D-10** — Welcome-back message dropped | `showWelcomeBack()` function deleted (not migrated) |
| **D-11** — Advanced drawer removed | `mountQueryBar()` advanced drawer logic (~20 lines) deleted |

---

## Deviations from Plan

None. Plan executed exactly as written. File deleted, no stray imports remain in source code, expected test failures documented.

---

## Self-Check

✓ `src/ui/query-bar.ts` file does not exist  
✓ No imports of query-bar in production source code (grep 0 results)  
✓ `main.ts` imports already removed in Plan 18-04  
✓ All exported functions migrated or dropped per design  
✓ Commit created and pushed  
✓ Expected test failures documented for Plan 18-06  

**Status: PASSED**

---

## Next Steps

1. **Plan 18-06 (concurrent):** Update/remove test files that import from deleted query-bar.ts
2. **Worktree merge:** Once both 18-05 and 18-06 complete, orchestrator merges and runs final test suite
3. **Phase 18 close:** After successful merge, transition phase 18 to COMPLETE

