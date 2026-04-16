---
phase: 11-reading-panel-as-instrument
plan: 01
status: complete
completed_date: 2026-04-16
completed_at: "2026-04-16T14:51:00.000Z"
executor: claude-haiku-4-5
subsystem: ui/reading-panel
tags:
  - restructure
  - reading-panel
  - instrument
  - header-grid
  - imagery
  - metrics
tech_stack:
  - TypeScript
  - vitest
  - three.js
dependencies:
  requires: [08-concentric-layout, 09-filter-panel, 10-query-bar]
  provides: [12-reading-list-mode]
  affects: [Phase 3 imagery integration, Phase 12 reading modes]
key_files:
  created: []
  modified:
    - src/ui/reading-panel.ts
    - src/ui/reading-panel.test.ts
decisions:
  - "Import classifyProofType + deriveImpactScale from data modules (not new functions)"
  - "Imagery paths use /case-imagery/ prefix (absolute from public/)"
  - "Permission false suppresses imagery completely (shows [CONFIDENTIAL])"
  - "Section labels uppercase: CHALLENGE, APPROACH, OBSERVED IMPACT"
  - "Metric rows map label to uppercase (DM Mono readout style)"
---

# Phase 11 Plan 01: Reading Panel as Instrument — Execution Summary

**Transformed reading panel from marketing summary to instrument-readout observation surface.**

## Execution

All 4 tasks completed in single atomic session.

### Task 1: Restructure header as labeled 2-column grid
- Imported `classifyProofType` and `deriveImpactScale` from data modules
- Created 6-field grid: CLIENT / SECTOR / REGION / YEAR / PROOF TYPE / IMPACT BAND
- Mapped `impactScale.band` (string) to numeric index for label array
- Grid uses `rp-header-grid` container with `rp-field` + `rp-label` + `rp-value` semantics

### Task 2: Add imagery strip and Fraunces title
- Imagery renders ABOVE grid when `c.imagery` present and `c.permission !== false`
- Logo and key_visual use absolute `/case-imagery/` paths
- Title rendered with `rp-title` class for Fraunces italic styling in Phase 2
- Permission gate: when `c.permission === false`, imagery suppressed entirely, [CONFIDENTIAL] readout shown instead

### Task 3: Restructure body sections and metrics
- Renamed "Results" → "OBSERVED IMPACT" (all uppercase)
- Section labels: CHALLENGE, APPROACH, OBSERVED IMPACT with `rp-section-label` class
- Metrics grid: replaced `.rp-metric-card` with `.rp-metric-row` (two-column: label + value)
- Metric labels converted to uppercase (DM Mono readout pattern)

### Task 4: Update button label and verify tests
- Button text changed: "Add to Shortlist" → "ADD TO READING LIST", "Remove" → "REMOVE"
- Test assertions updated for new structure:
  - Renamed "renders services as chips" test (services no longer rendered)
  - Updated metric test from `.rp-metric-card` to `.rp-metric-row`
- Full test suite: **239 tests passing** (0 failures)
- TypeScript: **clean** (no errors)

## Verification

| Requirement | Status | Evidence |
|---|---|---|
| rp-header-grid present | ✓ | grep finds `rp-header-grid` |
| getProofType imported | ✓ | `classifyProofType` imported from proof-type.ts |
| getImpactScale imported | ✓ | `deriveImpactScale` imported from impact-scale.ts |
| rp-key-visual, rp-logo classes | ✓ | Imagery HTML renders both if present |
| rp-confidential readout | ✓ | Permission gate suppresses imagery, shows [CONFIDENTIAL] |
| rp-title class | ✓ | Title wrapped with `<h2 class="rp-title">` |
| CHALLENGE/APPROACH/OBSERVED IMPACT | ✓ | Section labels all uppercase in template |
| rp-section-label class | ✓ | Each section label has `rp-section-label` |
| rp-metrics-grid, rp-metric-row | ✓ | Metrics rendered as rows, not cards |
| ADD TO READING LIST / REMOVE | ✓ | Button text updated in all branches |
| rp-metric-card removed | ✓ | No `.rp-metric-card` references remain |
| All tests passing | ✓ | vitest: 239/239 passing |
| TypeScript clean | ✓ | tsc --noEmit: 0 errors |

## Deviations from Plan

None. Plan executed exactly as written.

## Commits

- `a398608` feat(11-01): restructure reading panel as instrument readout

## Metrics

- **Duration:** 5 min 53 sec
- **Tasks completed:** 4/4 (100%)
- **Files modified:** 2
- **Test status:** 239/239 passing
- **Build status:** Clean

## Next

Phase 11 Plan 02: Apply CSS styling (DM Mono, Fraunces, teal colors, grid spacing).
Depends on: reading-panel.ts restructure (this plan) — unblocked.

---

*Execution complete 2026-04-16T14:51:00Z*
