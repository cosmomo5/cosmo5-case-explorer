---
phase: 18-unified-left-column
plan: 02
type: execute
subsystem: Unified Left Column — Visual Layer
tags: [CSS, styling, DM Mono, instrument register]
completed: 2026-04-19T00:00:00Z
duration: ~15 minutes
files:
  created: []
  modified:
    - src/style.css
commit: d0df2a3
---

# Phase 18 Plan 02: Unified Left Column CSS — Summary

**Objective:** Restore and extend the unified left-column CSS styling. Apply the visual register for the unified input (DM Mono, gold focus, teal readout), history chips, hint messages, and the collapsed-tab behavior in global mode.

**Output:** `src/style.css` styled for all unified-column states (input, readout, chips, hint, collapse, planetary-gate).

## Execution

### Task 1: Unified Input Styling ✓
**Added:** DM Mono 14px input with gold focus underline
- Base state: teal border-bottom at 0.3 opacity
- Focus state: gold (#e8b15a) border-bottom
- Placeholder: 35% opacity white text
- Transparent background, no border except bottom
- 200ms transition on border color

### Task 2: Readout Styling ✓
**Added:** `.filters-readout` — DM Mono 11px teal
- All-caps "N CASES" display (CLUSTERS count dropped per D-07)
- 0.5px letter-spacing for clarity at small size
- 12px margin-bottom for spacing below input

### Task 3: Query History Chips ✓
**Added:** `.query-history` + `.query-chip` styling
- Flex wrap container, 6px gap
- Chip styling: teal color, low opacity background (0.08), subtle border (0.2)
- Hover: increased opacity (0.15), brightened border (0.4)
- Active: pressed state (0.25 opacity)
- DM Mono 10px, uppercase semantic

### Task 4: Hint Messages ✓
**Added:** `.query-hint` + `.qh-term` + `.qh-suggest` styling
- Hidden by default (opacity 0, pointer-events none)
- `.visible` class toggles visibility (opacity 1, 0.2s transition)
- `.qh-term` highlighted in gold for no-match queries
- `.qh-suggest` teal underlined buttons (text-decoration semantics, no button chrome)
- Hover state: solid underline on suggestions

### Task 5: Collapsed-by-Default Verification ✓
**Verified:** Existing `.filters-wrap` and `.filters-wrap.collapsed` rules in place
- `.filters-wrap.on`: display flex (gates visibility in global mode)
- `.filters-wrap.collapsed`: hides `.filters` panel (width 0, opacity 0, pointer-events none)
- `.filters-tab`: remains visible (flex-shrink 0), serves as toggle in collapsed state
- `.ft-icon`: rotates 180deg when collapsed (visual feedback on collapse state)

### Task 6: Planetary Overture Gate Verification ✓
**Verified:** `body.planetary #filtersWrap` rule exists
- Left column hidden during planetary overture (opacity 0, pointer-events none)
- Matches existing behavior for other UI elements (#crumb, #homeBtn, #cosmoControls)
- Uses opacity + pointer-events, not display:none (preserves transition animation on exit)

### Task 7: Test + Build Verification ✓
**Tests:** 308/308 passing (no changes to test files)
**Build:** Successful, 239.80 kB gzipped
- CSS bundle: 7.93 kB gzipped
- JS bundle: 239.80 kB gzipped (baseline maintained)
- No build errors or warnings related to CSS

## Deviations from Plan

None — plan executed exactly as written.

## Key Metrics

| Metric | Value |
|--------|-------|
| Files modified | 1 (src/style.css) |
| Lines added | 46 |
| CSS rules added | 9 |
| Tests passing | 308/308 |
| Bundle size (gzipped) | 239.80 kB |
| Commit hash | d0df2a3 |

## Design Register Alignment

- **DM Mono:** 14px input (instrument input signal), 11px readout (observation signal), 10px hints (guidance signal) — matches existing filter-status register
- **Gold (#e8b15a):** Input focus underline, no-match term highlight — consistent with "active/navigation" semantic
- **Teal (#5ecfc0):** Input base underline, readout, chip accents, suggestions — consistent with "observed/measured" semantic
- **Single ease:** All transitions use `cubic-bezier(0.16, 1, 0.3, 1)` (0.2s for input, 0.2s for chips, 0.2s for hint)
- **Low opacity accents:** Query chips (0.08 bg, 0.2 border), hint suggestions (0.4 underline) — instrument-precise register, not announced

## Verification Checklist

- [x] Input styling: DM Mono 14px, teal unfocused, gold focused
- [x] Readout styling: DM Mono 11px teal, "N CASES" text
- [x] Query history chips: teal accents, low opacity, hover states
- [x] Hint messages: hidden by default, visible on trigger, correct messaging
- [x] Collapsed-by-default: `.filters-wrap.collapsed` hides `.filters` panel in global mode
- [x] Planetary overture: `body.planetary #filtersWrap` hides column during overture
- [x] All 308 tests passing
- [x] Build succeeds, bundle size maintained (239.80 kB gzipped)
- [x] No CSS rule conflicts or unexpected visual breakage

## Known Limitations

None. All must-haves from the plan are satisfied.

## Next Phase

Phase 18-03 (Plan 03) will update the HTML DOM structure in `index.html` and reshape `src/ui/filter-panel.ts` to render the input, readout, history, and hint elements. This CSS layer is ready to style those DOM elements when they appear.

---

*Executed: 2026-04-19*
*Executor: Claude Code (Haiku 4.5)*
