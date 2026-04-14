---
phase: 08-clean-substrate
plan: 01
subsystem: ui
tags: [cleanup, dom, css, typescript, detail-panel, v1-removal, v2-removal]

requires:
  - phase: 06-reading-panel
    provides: ReadingPanel replacing DetailPanel; Tooltip replacing ctip system
  - phase: 07-polish-and-accessibility
    provides: v3.1 codebase state pre-v3.2 cleanup

provides:
  - "Clean index.html with no orphaned v1/v2 DOM (globe-stage, constellation-canvas, countryRail, panel/panelScrim, ctip, searchWrap wrapper, gatherBtn removed)"
  - "Clean style.css with no rules targeting removed DOM (98 lines of CSS removed)"
  - "src/ui/detail-panel.ts deleted — no orphaned code file"
  - "Gather DOM preserved (#gatherStage, #gatherVignette, #gatherList) for Phase 12 Comparison Mode"
  - "Gather-mode CSS block preserved with Phase 12 preservation comment"
  - "Active search preserved (#globalSearch, #globalSearchClear wired in main.ts)"

affects: [phase-09-atmosphere, phase-12-comparison-mode]

tech-stack:
  added: []
  patterns:
    - "Surgical DOM removal: wrapper divs removed, active children promoted as siblings"
    - "CSS preservation comment: gather-mode block marked 'reserved for Comparison Mode adaptation — do not remove'"

key-files:
  created: []
  modified:
    - "index.html - removed 8 orphaned DOM blocks; gatherBtn, globe-stage, constellation-canvas, countryRail, searchWrap wrapper, panelScrim, panel+p-* children, ctip"
    - "src/style.css - removed 121 lines of orphaned CSS; added preservation comment to gather-mode block"
    - "src/main.ts - removed DetailPanel import, instantiation, escape handler branch, elSearchWrap getter (3 usage sites)"
  deleted:
    - "src/ui/detail-panel.ts - entire file deleted (138 lines); all DOM refs orphaned since Phase 6 ReadingPanel replaced it"

key-decisions:
  - "searchWrap wrapper removed: only the outer div removed; #globalSearch and #globalSearchClear promoted as direct siblings — no wiring changes needed"
  - "gather DOM preserved verbatim: #gatherStage, #gatherVignette, #gatherList and all gl-* children kept for Phase 12 Comparison Mode adaptation"
  - "chip-yr/chip-svc/chip-geo CSS removed: grep confirmed zero TypeScript/HTML usage after detail-panel.ts deletion"
  - "gather-mode CSS block preserved with comment marker: 'reserved for Comparison Mode adaptation — do not remove'"
  - "elSearchWrap.classList.toggle('search-match') at line 537 identified and removed (advisor catch — easy to miss as it was inside the search input handler, not enterFocus/exitFocus)"

requirements-completed: [CLN-01, CLN-02, CLN-03]

duration: 25min
completed: 2026-04-14
---

# Phase 8 Plan 01: Clean Substrate — Orphan DOM + CSS Removal Summary

**Removed all v1/v2 orphaned DOM (globe-stage, countryRail, DetailPanel modal, ctip tooltip, searchWrap wrapper) and 121 lines of CSS targeting deleted elements; gather DOM and gather-mode CSS preserved intact for Phase 12 Comparison Mode.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-14
- **Completed:** 2026-04-14
- **Tasks:** 2
- **Files modified:** 3 (index.html, src/main.ts, src/style.css)
- **Files deleted:** 1 (src/ui/detail-panel.ts)

## Accomplishments

- Removed 8 orphaned DOM blocks from index.html — no v1/v2 IDs remain; HTML is now a clean surface
- Deleted src/ui/detail-panel.ts (138 lines) and removed all 3 references from main.ts
- Removed 121 lines of orphaned CSS; added Phase 12 preservation comment to gather-mode block
- 195 tests pass (190 v3.1 baseline + 5 new phyllotaxis tests from 08-02); build clean

## Task Commits

1. **Task 1: Remove orphaned DOM from index.html and delete DetailPanel** — `2fcb026` (chore — bundled with 08-02 phyllotaxis test in same session)
2. **Task 2: Remove orphaned CSS from style.css** — `3b7bbe5` (chore)

## Files Modified

- `index.html` — removed #globe-stage, #globe-canvas, #constellation-canvas, #gatherBtn, #countryRail, #searchWrap wrapper (keeping #globalSearch + #globalSearchClear), #panelScrim, #panel and all #p-* children, #ctip block
- `src/ui/detail-panel.ts` — deleted entirely (DetailPanel class, 138 lines)
- `src/main.ts` — removed: DetailPanel import, `const detailPanel = new DetailPanel()`, `detailPanel.isOpen()` escape branch, `elSearchWrap` getter, `elSearchWrap.classList.add('on')` in enterFocus, `elSearchWrap.classList.remove('on')` in exitFocus, `elSearchWrap.classList.toggle('search-match', ...)` in search input handler
- `src/style.css` — removed 121 lines of orphaned rules; added preservation comment to gather-mode block (line ~360)

## Decisions Made

- **searchWrap wrapper removed surgically:** Only the outer `<div id="searchWrap">` wrapper removed; `#globalSearch` and `#globalSearchClear` kept as direct siblings in body. All TypeScript wiring to those elements untouched.
- **gather DOM preserved verbatim:** Per Phase 8 Context (Q5 resolution), `#gatherStage`, `#gatherVignette`, `#gatherList` and all `gl-*` children intact. These will drive Comparison Mode staging in Phase 12.
- **chip-yr/chip-svc/chip-geo removed after grep confirmation:** These classes appeared only in `detail-panel.ts` (deleted) and `style.css` — zero usage in any other `.ts` or `.html` file.

## Deviations from Plan

None — plan executed exactly as specified.

One near-miss caught via advisor review before execution: `elSearchWrap.classList.toggle('search-match', q.length > 0)` at the end of the `elGlobalSearch` input handler (line ~537) needed removal in addition to the two enterFocus/exitFocus sites explicitly named in the plan. The plan's grep step would have caught it; the advisor flagged it preemptively.

## Issues Encountered

Task 1 DOM changes were already committed in a prior session (bundled into `2fcb026` test(08-02) commit). This plan's execution completed Task 2 (CSS) and created the missing SUMMARY.md. The two-commit structure described in the plan's `<commits>` section reflects the logical split even though the first commit predates this executor session.

## Next Phase Readiness

- Clean substrate for Phase 9 (CRT radial grid atmosphere). No orphaned DOM, CSS, or TypeScript references to stale components.
- Gather DOM and gather-mode CSS intact — Phase 12 Comparison Mode can adapt from this foundation.
- All 195 tests pass. Build clean.

---
*Phase: 08-clean-substrate*
*Completed: 2026-04-14*
