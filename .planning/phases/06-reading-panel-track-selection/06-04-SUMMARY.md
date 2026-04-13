---
phase: 06-reading-panel-track-selection
plan: "04"
subsystem: ui-integration
tags: [main.ts, shortlist-track, sync, arrow-navigation, integration]

# Dependency graph
requires:
  - phase: 06-reading-panel-track-selection
    plan: "02"
    provides: ReadingPanel class with open()/close()/isOpen()/navigate(); main.ts star click + Esc wiring
  - phase: 06-reading-panel-track-selection
    plan: "03"
    provides: ShortlistTrack component; syncShortlistToStarState() helper

provides:
  - Full Phase 6 integration in main.ts: ShortlistTrack mounted, store subscribed, arrow-key navigation wired
  - End-to-end flow: star click → read → shortlist → track card → arrow nav → Esc close
affects: [phase-07-polish-accessibility]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "caseById Map built once at boot from enriched cases — used by track onSelect + label callbacks"
    - "ShortlistStore.subscribe() → syncShortlistToStarState: subscription-driven 3D sync pattern"
    - "Arrow navigation extracts ring cases from starMeshes.userData.ringOrbit; sorts by ringIndex then angleOffset"

key-files:
  created: []
  modified:
    - src/main.ts

key-decisions:
  - "syncShortlistToStarState imported into existing scene-state import (not a second import from same module)"
  - "Ring case sort uses ringIndex then angleOffset — consistent with ring order as navigation sequence"
  - "Arrow key block returns early before nucleus cycling code — panel-open and panel-closed paths are mutually exclusive"

patterns-established:
  - "caseById Map pattern: single Map<string, CaseStudy> for O(1) lookups in callbacks"

requirements-completed:
  - READ-06

# Metrics
duration: ~10min
completed: "2026-04-13"
---

# Phase 06 Plan 04: Integration + Checkpoint Summary

**main.ts fully wired: ShortlistTrack mounted into #track-zone, ShortlistStore subscribed to syncShortlistToStarState, arrow-key ring case navigation replacing stub — Phase 6 integration complete pending visual checkpoint.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-13T21:33:00Z
- **Completed:** 2026-04-13T21:35:00Z (Task 1); awaiting human checkpoint (Task 2)
- **Tasks:** 1 of 2 complete (Task 2 is human-verify checkpoint)
- **Files modified:** 1

## Accomplishments

- Imported `ShortlistTrack` (new module) and `syncShortlistToStarState` (added to existing scene-state import)
- Built `caseById` Map after `enrichCases()` for O(1) case lookups in track callbacks
- Mounted `ShortlistTrack` into `#track-zone` with `onSelect` opening the reading panel and `getCaseLabel` resolving client names
- Subscribed `ShortlistStore` to call `syncShortlistToStarState(sceneObjects, entries)` on every store mutation
- Replaced arrow-key guard stub with full ring case navigation: extracts `starMeshes` with `ringOrbit` userdata, sorts by `ringIndex` then `angleOffset`, calls `readingPanel.navigate(direction, ringCases)`
- Full test suite remains green at 190/190

## Task Commits

1. **Task 1: Wire ShortlistTrack + syncShortlistToStarState + arrow-key navigation** - `1c16afc` (feat)
2. **Task 2: Visual checkpoint** — PENDING (human-verify gate)

## Files Created/Modified

- `src/main.ts` — 42 lines added: ShortlistTrack + syncShortlistToStarState imports, caseById Map, ShortlistTrack mount, store subscription, arrow-key navigation block

## Decisions Made

1. `syncShortlistToStarState` merged into the existing `./scene/scene-state` import line rather than adding a redundant second import.
2. Ring navigation sort order: `ringIndex` ascending, then `angleOffset` ascending — this is the logical ring order as cases appear in the orbit.
3. Arrow key block placed before and separate from nucleus-cycling block; early `return` prevents fall-through when panel is open.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Task 1 complete and committed. All integration points wired.
- Task 2 (human visual checkpoint) is blocking — requires Mo to run `npm run dev` and verify 14 flow steps.
- Phase 7 (Polish + Accessibility) begins after checkpoint approval.

---
*Phase: 06-reading-panel-track-selection*
*Status: Awaiting human-verify checkpoint (Task 2)*
*Completed: 2026-04-13 (partial)*
