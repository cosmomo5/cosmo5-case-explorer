---
phase: 12-reading-list-review-comparison
plan: 02
name: Rename and Redesign Reading List Track
subsystem: UI Components (track-zone, query-bar)
tags: [Reading List, UI strings, track redesign, welcome-back state]
dependency_graph:
  requires: [12-01]
  provides: [RL-01, RL-02, RL-08]
  affects: [12-03, 12-04, 12-05]
tech_stack:
  added: []
  patterns: [Grid-based card layout, time-ago formatting, state transition]
key_files:
  created: []
  modified: 
    - src/ui/shortlist-track.ts
    - src/ui/shortlist-track.test.ts
    - src/ui/query-bar.ts
    - src/style.css
    - src/main.ts
    - src/scene/star-flight.ts
decisions: []
metrics:
  tasks_completed: 3/3
  files_modified: 6
  tests_passing: 242/242
  typescript_clean: true
  duration_minutes: 18
---

# Phase 12 Plan 02: Rename and Redesign Reading List Track

## Summary

Completed 3-task plan to rename Shortlist → Reading List in all user-visible strings and redesign the bottom track zone with a card-based layout supporting REVIEW and COMPARE buttons. Added welcome-back readout on app boot showing reading list count and time-since-last-add.

## Completed Tasks

### Task 1: Rename all UI Shortlist strings [RL-01]

**Status:** Complete

Changed all user-facing references from "Shortlist" to "Reading List":
- Empty state text: "No cases shortlisted" → "No readings staged. Add cases from the panel — your list persists across sessions."
- CSS class names: `.track-*` → `.rl-*` for consistency
- Reading panel button already had correct text: "ADD TO READING LIST" (Phase 11)
- API names (`shortlistStore`, `shortlistTrack`) unchanged per RL-01 specification

Updated all tests to expect new strings and class names. Verified no user-visible "Shortlist" strings remain (excluding API names).

### Task 2: Redesign track rendering [RL-02]

**Status:** Complete

Rewrote ShortlistTrack.render() to display:

**Empty state:**
- Single message: "No readings staged. Add cases from the panel — your list persists across sessions."

**Populated state:**
- `.rl-count` header: "N READINGS"
- `.rl-cards` container with individual `.rl-card` elements, each showing:
  - `.rl-client` — case name (from getCaseLabel)
  - `.rl-sector` — placeholder "—" (ready for data)
  - `.rl-metric` — placeholder "—" (ready for data)
  - `.rl-added` — timestamp formatted as "Xd ago", "Xh ago", "Xm ago", or "just now"
  - `.rl-remove` button × with click handler to remove from store
- `.rl-actions` container with two buttons:
  - `.rl-review` (id="rlReview") — always enabled at ≥1 reading
  - `.rl-compare` (id="rlCompare") — enabled at ≥3 readings, disabled with title="Add 3+ readings to compare"

**CSS:** Added full styling for redesigned track:
- Updated #track-zone to flex column, 200px min-height, 320px max-height
- Card grid layout: 5 columns (client | sector | metric | timestamp | remove)
- Gold borders, teal accents on sector/metric, DM Mono font
- Hover effects on cards and buttons
- Disabled button opacity handling

**Timestamp handling:** Accesses ShortlistStore._addedAtMap to get millisecond timestamps, formats as human-readable "time ago" strings.

### Task 3: Add welcome-back state [RL-08]

**Status:** Complete

Added `showWelcomeBack()` function to query-bar.ts:
- Called on app boot from main.ts after store hydration
- Checks if reading list has entries
- If yes: displays "Welcome back. N readings in your list, last added X ago."
- Message appears in `.query-readout` element
- Styled with gold color (`.welcome-back` class) with opacity transition
- Auto-fades after 5 seconds

Time formatting logic:
- Reads most recent `addedAt` timestamp from store._addedAtMap
- Calculates elapsed time in days, hours, or minutes
- Format: "Xd ago" > "Xh ago" > "Xm ago" > "just now"

## Deviations from Plan

**1. [Rule 3 - Blocking issue] Fixed window.matchMedia not defined in tests**
- **Found during:** Task 2 test execution
- **Issue:** star-flight.ts module-level call to `window.matchMedia()` caused tests to fail with "window.matchMedia is not a function" in jsdom environment
- **Fix:** Added safe check: `typeof window !== 'undefined' && window.matchMedia ? ... : false`
- **Files modified:** src/scene/star-flight.ts
- **Commit:** Included in task 2 commit

**2. [Test Infrastructure]** Enhanced ShortlistTrack tests
- Added _addedAtMap to mock store (required for timestamp access)
- Added 2 new tests: COMPARE button state transitions at <3 and ≥3 entries
- Updated 5 existing tests to use new `.rl-*` class names and expected text
- All 11 shortlist-track tests passing

## Verification

**Automated checks passing:**
```bash
✓ 242 tests passing (11 shortlist-track, 14 reading-panel, 217 other)
✓ TypeScript clean (tsc --noEmit)
✓ All task criteria met:
  - No user-visible "Shortlist" strings (excluding API names)
  - Track renders empty state, populated cards with timestamp, count, REVIEW/COMPARE
  - COMPARE disabled at <3 with tooltip
  - Welcome-back readout shows on boot with count and last-added time
```

## Key Implementation Details

**ShortlistTrack.store reference:**
- Added `private store: ShortlistStore` to constructor
- Allows access to `_addedAtMap` for reading timestamps via `(this.store as any)._addedAtMap`

**Time formatting:**
- Shared logic between shortlist-track and query-bar via formatTimeAgo helper in each module
- Consistent format across UI

**CSS layout:**
- Track zone: flex column layout, min 200px, max 320px, scrollable if needed
- Card grid: 5-column (responsive to case data)
- Buttons: flex layout with equal widths in actions container

## What's Next

Phase 12 Plan 03: Review Mode (sequential paginated reader for reading list)
- Reads from reading list entries
- Pagination and navigation controls
- Integrates with ReadingPanel for full case view

## Files Modified

- `src/ui/shortlist-track.ts` — Redesigned render method with card layout
- `src/ui/shortlist-track.test.ts` — Updated 5 tests, added 2 new tests (11 total)
- `src/ui/query-bar.ts` — Added showWelcomeBack() function, timestamp formatting
- `src/ui/reading-panel.test.ts` — Added matchMedia shim (test infrastructure)
- `src/style.css` — Complete redesign of track zone and card styles
- `src/main.ts` — Import showWelcomeBack, call on boot after hydration
- `src/scene/star-flight.ts` — Safe window.matchMedia check for tests

## Commits

1. `1327e65` — feat(12-02): rename Shortlist to Reading List in all UI strings [RL-01]
2. `3625732` — feat(12-02): redesign track + welcome-back state [RL-02, RL-08]

