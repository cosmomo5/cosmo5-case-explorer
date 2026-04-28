---
phase: 02
slug: layout
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-28
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (co-located with Vite config) |
| **Config file** | `vite.config.ts` (existing) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | LAY-01 | visual/smoke | manual — browser inspect | n/a | ⬜ pending |
| 02-01-02 | 01 | 1 | LAY-02, LAY-03 | unit | `npm test -- --run src/layout/layout-controller.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-02-01 | 02 | 2 | LAY-04 | unit (mock ResizeObserver) | `npm test -- --run src/scene/renderer.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-02-02 | 02 | 2 | LAY-05, LAY-06 | integration | `npm test -- --run` + browser Shift+P | n/a | ⬜ pending |
| 02-03-01 | 03 | 3 | LAY-07 | unit | `npm test -- --run src/data/view-state.test.ts` | ✅ exists | ⬜ pending |
| 02-03-02 | 03 | 3 | LAY-07 | unit | `npm test -- --run src/data/view-state.test.ts` | ✅ exists | ⬜ pending |
| 02-03-03 | 03 | 3 | LAY-07 | unit (grep) | `grep -c "kind === 'planetary'\|kind === 'global'" src/main.ts` → 0 | n/a | ⬜ pending |
| 02-03-04 | 03 | 3 | LAY-08 | unit | `npm test -- --run` | n/a | ⬜ pending |
| 02-03-05 | 03 | 3 | LAY-08 | integration | `npm test -- --run` + browser UAT (nucleus meshes hidden, 116 stars visible) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/layout/layout-controller.test.ts` — covers LAY-02, LAY-03 (created in Plan 01 Task 2)
- [ ] `src/scene/renderer.test.ts` — covers LAY-04 (created in Plan 02 Task 1)
- [ ] `src/data/view-state.test.ts` — already exists; updated in Plan 03 Task 2 to cover LAY-07

*Plans 01–02 create the test files as part of TDD tasks (RED→GREEN). No pre-creation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Canvas fills window on load, no 300×150 flash | LAY-01, LAY-04 | WebGL visual | `npm run dev` → browser → confirm canvas fills viewport |
| Divider line visible at ~72% in constellation mode | LAY-02 | CSS visual | Browser console: `document.body.classList.add('constellation')` |
| Shift+P opens panel slot → canvas compresses | LAY-05 | ResizeObserver integration | Press Shift+P in running app |
| Nucleus meshes hidden after ENTER_FIELD | LAY-08 | Three.js scene state | Click "ENTER OBSERVATORY" → verify no nucleus rings visible |
| 116 stars visible and drifting freely | LAY-08 | Three.js scene state | After ENTER_FIELD → verify stars drift with no orbital grouping |
