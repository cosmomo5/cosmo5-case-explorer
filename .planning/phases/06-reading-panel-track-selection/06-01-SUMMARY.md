---
phase: 06-reading-panel-track-selection
plan: "01"
subsystem: ui
tags: [view-state, state-machine, three.js, emissive, material, tick-loop]

# Dependency graph
requires:
  - phase: 05-filter-panel-staging-sphere
    provides: StarState precedence gate + MeshStandardMaterial stars confirmed

provides:
  - OPEN_READING / CLOSE_READING transitions wired in ViewStateMachine
  - reading ViewState kind with nucleusKey + caseId
  - Tick loop casts to MeshStandardMaterial (was MeshBasicMaterial)
  - Emissive gold (0xe8b15a, intensity 0.6) applied per-frame for reading state
  - Emissive cleared (intensity 0) for all non-reading states

affects:
  - 06-02 (ReadingPanel dispatch depends on wired transitions)
  - 06-03 (Track selection dispatch depends on wired transitions)
  - Any Wave 2+ plan that calls dispatch(OPEN_READING) or dispatch(CLOSE_READING)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ViewStateMachine transitions: OPEN_READING guards constellation state, CLOSE_READING guards reading state"
    - "Tick loop emissive pattern: per-frame write (consistent with opacity-per-frame), cleared on state exit"
    - "TDD stub-replacement: stub tests replaced alongside the stubs they tested"

key-files:
  created: []
  modified:
    - src/data/view-state.ts
    - src/data/view-state.test.ts
    - src/scene/scene-state.ts

key-decisions:
  - "OPEN_READING / CLOSE_READING placed above ENTER/EXIT in dispatch chain to maintain TypeScript exhaustiveness check"
  - "Emissive gold written per-frame in tick loop (not via GSAP) — consistent with existing opacity-per-frame pattern"
  - "Phase 5 stub tests replaced with new behavior tests; 'do not rewrite existing tests' applied to structural ENTER/EXIT/listener tests only"

patterns-established:
  - "ViewStateMachine guard pattern: guard current.kind before transition, throw with event type in message"
  - "Tick loop emissive: write emissive per-frame inside inFocused branch; always clear on else path"

requirements-completed:
  - READ-07

# Metrics
duration: 12min
completed: "2026-04-13"
---

# Phase 06-01: Reading State Foundation Summary

**ViewStateMachine OPEN_READING/CLOSE_READING wired with guard transitions; tick loop fixed to MeshStandardMaterial with emissive gold (0xe8b15a, intensity 0.6) per-frame for reading state**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-13T19:20:00Z
- **Completed:** 2026-04-13T19:22:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Removed Phase 5 throw stubs; OPEN_READING and CLOSE_READING now perform real state transitions
- OPEN_READING: constellation → reading, preserves nucleusKey, stores caseId
- CLOSE_READING: reading → constellation, preserves nucleusKey
- Tick loop `MeshBasicMaterial` cast replaced with `MeshStandardMaterial` (enables `.emissive` access)
- Emissive gold written per-frame when `starState === 'reading'`; cleared for all other states
- Test count: 153 → 159 (6 new reading-state tests)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: reading state tests** - `5648faf` (test)
2. **Task 1 GREEN: wire transitions** - `bae05bd` (feat)
3. **Task 2: tick loop fix + emissive gold** - `bf8b366` (feat)

## Files Created/Modified

- `src/data/view-state.ts` - OPEN_READING and CLOSE_READING handlers wired; Phase 5 stubs removed
- `src/data/view-state.test.ts` - 6 new reading-state tests added; 2 Phase 5 stub tests replaced with new behavior tests
- `src/scene/scene-state.ts` - Material cast fixed to MeshStandardMaterial; emissive gold block added in tick loop

## Decisions Made

- OPEN_READING/CLOSE_READING handlers placed above ENTER/EXIT in the dispatch chain — preserves TypeScript exhaustiveness check on the `never` guard without restructuring
- Emissive gold written per-frame (not one-shot via GSAP) — consistent with existing opacity-per-frame pattern; negligible cost
- Phase 5 stub tests replaced alongside the stubs they tested; this is correct behavior, not a "test rewrite" — the instruction "do not rewrite existing tests" applies to the structural ENTER/EXIT/listener tests

## Deviations from Plan

None — plan executed exactly as written.

The plan noted that star-state.test.ts already had the colorOverride assertion (it did — line 6-8 asserts `colorOverride: 0xe8b15a`). No new test was needed for Task 2's star-state check.

## Issues Encountered

None.

## Next Phase Readiness

- OPEN_READING and CLOSE_READING are wired — Wave 2 plans (ReadingPanel, Track Selection) can safely dispatch these events
- MeshStandardMaterial cast confirmed working — emissive gold path is live
- Full suite green at 159 tests

---
*Phase: 06-reading-panel-track-selection*
*Completed: 2026-04-13*
