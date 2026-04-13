---
phase: 06-reading-panel-track-selection
plan: "02"
subsystem: ui
tags: [three.js, jsdom, vitest, reading-panel, layout-controller, view-state, shortlist]

# Dependency graph
requires:
  - phase: 06-reading-panel-track-selection
    plan: "01"
    provides: OPEN_READING/CLOSE_READING transitions wired in ViewStateMachine; MeshStandardMaterial emissive gold path

provides:
  - ReadingPanel class targeting #reading-panel-slot (not #panel)
  - open(): instrument readout, services chips, challenge/approach/results, locked banner, starState=reading
  - close(): restores starState + emissiveIntensity=0, calls setPanelOpen(false), dispatches CLOSE_READING
  - navigate(): cycles cases by direction, handles out-of-ring edge case
  - main.ts wired: star click in focused mode → readingPanel.open(); Esc → readingPanel.close(); arrow guard stub

affects:
  - 06-03 (Track selection can dispatch OPEN_READING via same panel)
  - 06-04 (arrow key navigation wires readingPanel.navigate())

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ReadingPanel renders static shell once in constructor; open() repopulates dynamic sections"
    - "isOpen() reads slot.classList.contains('open') — truth owned by layoutController.setPanelOpen()"
    - "star mesh state: set userData.starState='reading' in open(); restore to 'selected'/'idle' in close()"
    - "ViewStateMachine requires constellation state before OPEN_READING — use createViewStateMachine({ kind: 'constellation', nucleusKey }) in tests"
    - "In tests: use real createLayoutController() so setPanelOpen() actually toggles the 'open' class on the slot; isOpen() then reflects correctly"

key-files:
  created:
    - src/ui/reading-panel.ts
    - src/ui/reading-panel.test.ts
  modified:
    - src/main.ts

key-decisions:
  - "ReadingPanel targets #reading-panel-slot (flex child that compresses scene) NOT #panel (old fixed overlay)"
  - "Star click in global mode falls through (does not open reading panel) — only focused mode clicks open panel"
  - "Arrow key guard added as stub in main.ts; full case navigation wired in 06-04"
  - "void shortlistStore marker removed — shortlistStore is now consumed by ReadingPanel constructor"
  - "detailPanel left as dead code per plan scope (no cleanup in this plan)"

patterns-established:
  - "ReadingPanel shell pattern: render static chrome once, repopulate inner sections in open()"
  - "TDD for jsdom-based UI: real LayoutController in tests so DOM class toggles work correctly"

requirements-completed:
  - READ-01
  - READ-02
  - READ-03
  - READ-04
  - READ-05
  - READ-08
  - READ-09

# Metrics
duration: 7min
completed: "2026-04-13"
---

# Phase 06-02: ReadingPanel Component Summary

**ReadingPanel class rendering into #reading-panel-slot with instrument readout (DM Mono teal cells), locked banner gating, metric cards, and full main.ts wiring for star click / Esc / arrow guard**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-13T19:24:00Z
- **Completed:** 2026-04-13T19:30:23Z
- **Tasks:** 2 (1 TDD with RED/GREEN commits)
- **Files modified:** 3

## Accomplishments

- ReadingPanel class with full TDD coverage (14 tests): constructor, open(), close(), isOpen()
- Instrument readout: three DM Mono teal cells (region / vertical proxy / year)
- Permission gating: locked banner replaces body content when permission=false
- Metric cards: one per metric, value + label
- Star mesh state tracking: starState=reading on open; restored to idle/selected on close
- main.ts: star click (focused mode only) → readingPanel.open(); Esc chain → readingPanel.close() first; arrow key guard stub
- Test count: 159 → 190 (14 new reading-panel tests + baseline shift)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: reading-panel tests (stub)** - `24ff282` (test)
2. **Task 1 GREEN: ReadingPanel implementation** - `98f5c27` (feat)
3. **Task 2: main.ts wiring** - `af209e9` (feat)

## Files Created/Modified

- `src/ui/reading-panel.ts` — ReadingPanel class: constructor, open(), close(), isOpen(), navigate(), _findStarMesh(), _restoreStarState()
- `src/ui/reading-panel.test.ts` — 14 jsdom tests covering all public behaviors
- `src/main.ts` — ReadingPanel import + instantiation; star click wiring; Esc guard; arrow key guard stub; void shortlistStore removed

## Decisions Made

- ReadingPanel targets `#reading-panel-slot` (flex child) not `#panel` (old fixed overlay) — this is the critical UX distinction that causes scene compression
- Star clicks in global mode fall through without opening panel — only focused mode clicks open it
- Real `createLayoutController()` used in tests (not vi.fn()) so `setPanelOpen()` actually toggles the `'open'` class and `isOpen()` reflects correctly
- Arrow key guard is a stub for now; full case cycling via arrow keys is Wave 3 (06-04)
- `void shortlistStore` marker removed since shortlistStore is now consumed by ReadingPanel

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- ReadingPanel fully wired and tested — 06-03 (Track Selection) can call readingPanel.open() from the staging track
- navigate() method present for 06-04 to wire arrow key case cycling
- Full suite green at 190 tests

---
*Phase: 06-reading-panel-track-selection*
*Completed: 2026-04-13*
