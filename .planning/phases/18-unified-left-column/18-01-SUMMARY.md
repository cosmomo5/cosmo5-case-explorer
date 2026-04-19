---
phase: 18-unified-left-column
plan: 01
subsystem: DOM/CSS cleanup
tags: [structural, cleanup, preparation]
files_modified:
  - index.html
  - src/style.css
files_created: []
duration: 15 minutes
completed_date: 2026-04-19
---

# Phase 18 Plan 01: Cleanup Query Bar Structure — Summary

**Objective:** Remove dead DOM and CSS for the query bar and orphaned filter DOM in preparation for unified left-column absorption. Clean HTML template and CSS stylesheet to establish a ready surface for filter-panel.ts to own all left-column rendering.

**One-liner:** Deleted #queryWrap block, cleaned <aside> orphaned DOM, removed .cc-constellation-only gate, and purged query-bar CSS selectors.

---

## Tasks Completed

All 6 tasks executed successfully:

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Delete #queryWrap block from index.html | 498390e | Done |
| 2 | Clean orphaned DOM inside <aside class="filters"> | 498390e | Done |
| 3 | Remove .cc-constellation-only gate from ring-switcher | 498390e | Done |
| 4 | Delete query-bar CSS selectors from src/style.css | d222307 | Done |
| 5 | Remove #queryWrap from body.planetary rule | d222307 | Done |
| 6 | Run tests to confirm no regressions | N/A (verification passed) | Done |

---

## Changes Made

### `index.html`

- **Removed:** `#queryWrap` div block (18 lines deleted)
  - Deleted: `queryInput`, `queryReadout`, `queryClear`, `queryHint`, `queryHistory`
  - Deleted: `queryAdvancedToggle`, `advancedDrawer`
  
- **Cleaned:** Orphaned DOM inside `<aside class="filters">` (29 lines deleted)
  - Removed: `filters-head`, `f-search` input, filter group stubs (`fg-year`, `fg-scope`, `fg-service`)
  - Removed: `filters-foot` status bar
  - Preserved: `<aside class="filters" id="filters">` shell (empty interior)

- **Modified:** Ring-switcher element (line 118)
  - Removed: `.cc-constellation-only` class
  - Now: `<div id="ring-switcher" class="ring-switcher" ...>`
  - Effect: Grouping switcher visible post-overture in both global and constellation views

**Net change:** 48 lines removed

### `src/style.css`

- **Deleted:** Query-bar CSS block (~171 lines)
  - `.query-wrap` (position, z-index, width, layout)
  - `.query-bar` (flex layout, border)
  - `#queryInput` (styling)
  - `.query-readout` + `.query-readout.welcome-back` (typography, color)
  - `.query-clear` + `.query-clear.visible` (button states)
  - `.query-hint` + `.qh-term` + `.qh-suggest` (hint styling)
  - `.query-history` + `.query-chip` (history chip styling)
  - `.query-advanced-toggle` + `.advanced-drawer` (drawer toggle + mechanics)

- **Modified:** Comparison-mode hide rule (line 1291)
  - Before: `.comparison-active .query-wrap, .comparison-active .advanced-drawer, ...`
  - After: `.comparison-active #cosmoControls, .comparison-active #ring-switcher { display: none !important; }`
  - Removed: `.query-wrap` and `.advanced-drawer` selectors (no longer needed)

- **Modified:** `body.planetary` hide rule (line 1335)
  - Before: `body.planetary #queryWrap,` (stale reference)
  - After: Removed (no longer needed)

- **Preserved:** All `.filters-*` styles (24 matches)
  - `.filters-wrap`, `.filters-tab`, `.filters` layout and styling intact
  - `body.planetary #filtersWrap` still hides unified column during overture

**Net change:** 171 lines removed

---

## Verification Results

### DOM Cleanup
- ✓ `grep "queryWrap\|queryInput\|queryReadout\|advancedDrawer" index.html` → 0 matches
- ✓ `grep "f-search\|fg-year\|fg-scope\|fg-service\|filters-foot" index.html` → 0 matches
- ✓ `<aside class="filters" id="filters">` shell preserved and empty
- ✓ Ring-switcher element present, class `cc-constellation-only` removed

### CSS Cleanup
- ✓ `grep "\.query-wrap\|\.query-bar\|#queryInput\|\.query-readout\|\.query-clear\|\.query-hint\|\.query-history\|\.query-chip\|\.query-advanced-toggle\|\.advanced-drawer" src/style.css` → 0 matches
- ✓ `.filters-*` styles still present (24 matches)
- ✓ `body.planetary` rule updated and functional

### Tests
- ✓ `npm run test` → 31 test files, 308 tests, all passing
- ✓ No test regressions from DOM/CSS cleanup
- ✓ Test suite duration: 98.90s (baseline)

### Build
- ✓ `npm run build` completes successfully
- ✓ TypeScript compilation clean (no errors)
- ✓ Vite build clean
- ✓ Bundle size: 239.80 kB gzipped (under 250 KB threshold)
- ✓ HTML: 6.72 kB (2.55 KB gzipped)
- ✓ CSS: 37.05 kB (7.67 KB gzipped)

---

## Commits

| Hash | Message |
|------|---------|
| `498390e` | `docs(18): remove #queryWrap DOM block, clean filters interior, drop constellation-only gate from ring-switcher` |
| `d222307` | `docs(18): delete query-bar CSS selectors` |

---

## Known Limitations / Deferred Items

None. Plan 18-01 is complete and ready for downstream work.

---

## Ready for Next Plans

This phase establishes the clean DOM/CSS surface for:
- **Plan 18-02:** Restore unified-column CSS styling (new `.filters-*` rules, input placement)
- **Plan 18-03:** Absorb query-bar functionality into filter-panel.ts (input + readout + history + hint)

The `<aside class="filters" id="filters">` shell is now empty and ready for `filter-panel.ts` to mount the unified column via `innerHTML` at runtime.

---

## Design Notes

- The `.cc-constellation-only` CSS gate remains in `src/style.css` (lines 758–760) but no longer applies to `#ring-switcher` after the HTML class removal. The gate will passively affect any other constellation-only elements if needed post-Phase 17.
- The orphaned v3.1 filter DOM (f-search input, accordion stubs) was dead on arrival — always overwritten by filter-panel.ts on boot. Removing it now lightens Phase 26's cleanup scope and clarifies the structural intent.
- Grouping switcher visibility: now controlled by `#cosmoControls.on` class (set at overture-complete in `main.ts:249`), not by the CSS `.cc-constellation-only` gate. This aligns with D-12 decision.

