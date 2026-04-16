---
phase: 12
plan: 04
subsystem: Review Mode
tags: [ui, overlay, pagination, navigation, reading-list]
requires: [12-01, 12-02, 12-03]
provides: [review-mode-overlay, pagination-control, full-viewport-reader]
affects: [shortlist-track, reading-panel integration, star-flight-animations]
duration: 1h 45m
completed: 2026-04-16T18:35:00Z
started: 2026-04-16T16:50:00Z
tech-stack:
  added: []
  patterns: [ReviewMode class, instrument-readout reuse, focus-trap, keyboard event handling, observable pattern subscription]
key-files:
  created: [src/ui/review-mode.ts]
  modified: [index.html, src/style.css, src/main.ts]
key-decisions:
  - Review Mode reuses instrument-readout rendering from ReadingPanel for visual consistency
  - Fixed positioning with z-index 50 places it above the observatory but below the loader
  - Focus trap moves focus to close button on open for keyboard accessibility
  - Remove button stays in overlay without triggering close, enabling sequential deletion
  - Card clicks in track trigger Review Mode at that specific case (direct navigation)
requirements-completed: [RV-01, RV-02, RV-03, RV-04]
---

# Phase 12 Plan 04: Review Mode — Summary

Full-viewport paginated reader overlay for sequential deep reading of the reading list.

## One-Liner

Review Mode overlay with arrow-key pagination, case counter, and in-place remove control for immersive single-case study.

## What Was Built

**Task 1: Review Mode DOM and CSS** — Added fixed overlay with header (progress counter + close button), body (case content), and footer (remove button + nav arrows) to index.html. Styled with DM Mono monospace typography, responsive layout, and hover states matching the observatory aesthetic. Overlay positioned at z-index 50, above scene container but below loader.

**Task 2: ReviewMode Component** — Implemented TypeScript class with full lifecycle: `open(startCaseId?)` triggers overlay display and keyboard binding, `close()` cleans up handlers and hides overlay, `renderCase()` generates instrument-readout HTML using reading-panel logic (imagery, title, header grid, body sections), `next()/prev()` navigate entries, `removeCurrent()` drops case and re-renders or closes if empty.

**Task 3: Wiring to Main UI** — Integrated ReviewMode into main.ts: created instance with caseById and shortlistStore options, wired REVIEW button to open Review Mode at first entry, wired card clicks in track zone to open Review Mode at specific case (with guard to ignore remove button clicks).

## How It Works

1. **Open:** User clicks REVIEW button in shortlist track → ReviewMode.open() → overlay becomes visible, focus moves to close button, keyboard listeners attached
2. **Navigate:** User presses ArrowLeft/Right or clicks buttons → currentIndex updates → renderCase() re-renders case at new index → progress counter updates → nav buttons enable/disable based on bounds
3. **Remove:** User clicks REMOVE button → removeCurrent() deletes from shortlistStore → entries re-fetched → index adjusted if needed → re-rendered at same or previous index. If last case removed, overlay closes.
4. **Close:** User presses Esc or clicks × button → close() unbinds keyboard listeners → overlay hidden → focus restored to document
5. **Card Direct Navigation:** User clicks reading-list card → event handler extracts caseId → ReviewMode.open(caseId) opens at that case

## Instrument Readout Rendering

ReviewMode reuses the entire instrument-readout template from ReadingPanel:
- Imagery (key_visual + logo, or [CONFIDENTIAL] if permission denied)
- Title in Fraunces italic
- Header grid: CLIENT / SECTOR / REGION / YEAR / PROOF TYPE / IMPACT BAND
- Body sections: CHALLENGE / APPROACH / OBSERVED IMPACT (with metrics grid)

This ensures visual consistency between the reading panel and Review Mode overlay. No duplication of render logic — same HTML generation, different container (#rp-body in panel vs #rvBody in overlay).

## Keyboard Accessibility

- **Arrow keys:** Left/Right advance pagination, preventDefault prevents page scroll
- **Esc:** Closes overlay, returns keyboard focus to reading-list track
- **Tab:** Tab order includes close button, prev/next buttons, remove button (in footer)
- **Focus trap:** On open, focus moves to close button (logical entry point)
- **aria-hidden/aria-modal:** Overlay has proper ARIA attributes for screen reader context

## CSS Styling Notes

- `.review-mode`: fixed positioning, `inset: 0` fills viewport, `display: none` by default, `flex-direction: column` for vertical layout
- `.review-mode.open`: `display: flex` makes overlay visible
- `.rv-body`: `max-width: 640px`, centered, flex: 1 for generous reading space
- `.rv-progress`: 11px DM Mono, low opacity (0.4) for subtle progress indication
- `.rv-prev/.rv-next`: 1px borders, teal hover color matching observatory theme
- All interactive elements have consistent transition: color 0.2s ease

## Verification

- [x] Review Mode overlay DOM in index.html with ARIA attributes
- [x] ReviewMode class exports open/close/navigate/remove public API
- [x] Keyboard handlers: ArrowLeft/Right for nav, Escape to close
- [x] Progress indicator updates CASE N OF M in real-time
- [x] Remove button works without exiting overlay
- [x] REVIEW button wired to open at first entry
- [x] Card clicks trigger open at specific case ID
- [x] CSS styling complete with hover states
- [x] All 242 tests pass, TypeScript clean
- [x] No deviations from plan

## Commits

1. `feat(12-04): add Review Mode DOM and CSS [RV-01, RV-02]` — 79e0581
2. `feat(12-04): implement Review Mode with pagination and remove [RV-01 through RV-04]` — 1487fb0

## Next Steps

Phase 12 Plan 05: Implement Comparison Mode (reading-list stars fly to phyllotaxis formation, non-list stars dim, spatial simultaneous view).
