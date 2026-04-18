---
phase: 16-planetary-overture
plan: 01
status: complete
completed_at: "2026-04-17T21:00:00.000Z"
verification: automated-all-green
tests_total: 258
tests_new: 10
bundle_kb_gzip: 237
---

# 16-01 Summary — State Machine + Planetary View Infrastructure

## What shipped

**`src/data/view-state.ts`**
- `ViewState` union extended: `planetary | global | constellation | reading`
- `ViewEvent` union extended: added `{ type: 'ENTER_FIELD' }`
- Default initial state changed from `{ kind: 'global' }` to `{ kind: 'planetary' }`
- Dispatch logic: ENTER_FIELD transitions `planetary → global` and throws from any other kind
- All other invalid transitions from/to `planetary` throw with descriptive messages
- Exhaustiveness guard preserved (`const _exhaustive: never = event`)

**`src/data/view-state.test.ts`**
- Existing tests refactored to use `machineInGlobal()` helper (construct with explicit `{ kind: 'global' }`) since the default is now `planetary`
- New `planetary state + ENTER_FIELD` describe block added (10 new tests)
- Coverage: default-is-planetary, explicit-initial-respected, ENTER_FIELD valid/invalid paths (×4), OPEN_READING/ENTER_CONSTELLATION/EXIT_CONSTELLATION/CLOSE_READING throw from planetary (×4), listener notification on ENTER_FIELD

**`src/main.ts`**
- Line ~185 subscribe mapping: `planetary` + `global` both map to `sceneObjects.mode = 'global'` (scene renders global orbital layout in both). Constellation/reading still map to 'focused'.
- End of boot(): added TEMPORARY `viewState.dispatch({ type: 'ENTER_FIELD' })` so existing interactions keep working during development. 16-03 removes this and wires the real user-gesture commit (click/Enter/Space on calibration overture).

## Verification (automated gate)

```
Tests:      258 passed / 28 files (up from 248 / 28 — 10 new tests added)
Typecheck:  tsc --noEmit clean
Build:      875.10 kB raw / 237.19 kB gzipped (same as v3.2 baseline ±0.05%)
```

## Visual regression check

App boots identically to v3.2 thanks to the temporary ENTER_FIELD dispatch — scene renders global orbital layout, filter panel + query bar + reading panel all mount, interactions work. Plans 16-02 and 16-03 will insert the planet mesh and calibration overture between boot and the ENTER_FIELD commit.

## Anchor points for next plans

- **16-02** hangs planet mesh creation + reverse-gather animation on the `planetary → global` transition. The subscribe listener added here is the hook point.
- **16-03** removes the TEMPORARY dispatch and replaces it with the overture UI that fires ENTER_FIELD on user gesture.

## Notes

- `reading-panel.ts` needed no changes — it only uses `ViewStateMachine` as an opaque type, no kind-specific branches.
- Two existing `main.ts` kind checks (lines 382, 462) check for `'constellation'` specifically, so they're unaffected by the new `planetary` variant.
- The new error messages (`Cannot ENTER_FIELD from "<kind>"`, `Cannot OPEN_READING from "planetary"`) keep the established format.
