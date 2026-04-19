---
status: partial
phase: 20-gather-as-staging-action
source: [20-VERIFICATION.md]
started: 2026-04-20T00:30:00Z
updated: 2026-04-20T00:30:00Z
defer_reason: "User directive 2026-04-19: 'continue, we'll check after all phases are done' — UAT deferred to end of v3.3 milestone"
---

## Current Test

[awaiting Windows Chrome session — deferred until end of v3.3]

## Tests

### 1. Gather button present in filter panel (constellation/focused mode)
expected: Open a constellation (click any nucleus sphere). The filter panel shows a GATHER button below the accordion filters, above the status bar.
result: [pending]

### 2. Disabled state rendering
expected: With no filter chips selected, button appears ghosted (teal color, low opacity, not clickable).
result: [pending]

### 3. Armed state rendering
expected: Select at least one filter chip (e.g. a country). Button changes to gold border/text labeled "GATHER".
result: [pending]

### 4. View-state gating — planetary and reading
expected: Navigate back to global view → button hidden (CSS `body.planetary`). Open a reading panel → button hidden (CSS `body.reading`).
result: [pending]

### 5. Gather click fires staging
expected: In constellation mode with filter active, click GATHER. A staging sphere appears and matched stars animate to it (exercises gather() from 20-02).
result: [pending]

### 6. Stranded state rendering
expected: After gathering, clear all filter chips. Button changes to teal "DISMISS" label.
result: [pending]

### 7. Dismiss click disposes staging
expected: Click DISMISS. Staging sphere disappears.
result: [pending]

### 8. Silent filter — no scene reaction
expected: While changing filter chips in constellation view with NO staging sphere present, observe scene: zero motion, zero opacity change, zero camera lean. Only the readout count updates.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps

(none recorded yet — populate after Windows Chrome UAT session)

## Run Instructions

From WSL:
```bash
cd /mnt/c/Users/moham/Documents/Thales/work-tech/case-study-explorer
npm run dev
```

Then open `http://localhost:5173` in Windows Chrome (CDP profile at `C:\Tmp\PlaywrightProfile` already running per CLAUDE.md).

Walk through tests 1-8 above. Record pass/fail per item. Surface any failures as gap entries under ## Gaps.
