---
phase: 5
slug: filter-panel-staging-sphere
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.0 + jsdom 29 |
| **Config file** | `vite.config.ts` (vitest config inline) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (13s baseline + new tests) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | FILT-01 | unit (DOM) | `npm test -- filter-panel` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | FILT-02 | unit | `npm test -- filter` | ✅ extend | ⬜ pending |
| 05-01-03 | 01 | 0 | FILT-03 | unit | `npm test -- filter-counts` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | FILT-04 | unit | `npm test -- scene-state` | ✅ extend | ⬜ pending |
| 05-01-05 | 01 | 1 | FILT-05 | manual | visual test | manual | ⬜ pending |
| 05-01-06 | 01 | 1 | FILT-06 | unit | `npm test -- scene-state` | ✅ extend | ⬜ pending |
| 05-01-07 | 01 | 2 | FILT-07 | unit | `npm test -- scene-state` | ✅ extend | ⬜ pending |
| 05-01-08 | 01 | 2 | FILT-08 | unit (DOM) | `npm test -- filter-panel` | ❌ W0 | ⬜ pending |
| 05-01-09 | 01 | 2 | FILT-09 | unit | `npm test -- scene-state` | ✅ extend | ⬜ pending |
| 05-01-10 | 01 | 2 | FILT-10 | unit (DOM) | `npm test -- filter-panel` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/filter-panel.test.ts` — stubs for FILT-01, FILT-08, FILT-10 (accordion DOM, status bar, orbit-by switcher)
- [ ] `src/tests/filter-counts.test.ts` — stubs for FILT-03 (cross-filter count algorithm)
- [ ] Extend `src/tests/filter.test.ts` — add proofType/impactBand to matchesFilter tests (FILT-02)
- [ ] Extend `src/tests/scene-state.test.ts` — staging sphere lifecycle (FILT-04, FILT-06, FILT-07, FILT-09)

*Existing infrastructure covers framework install. Only new test files and extensions needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Staging nucleus triggers same enterFocus path visually | FILT-05 | Camera animation + visual confirmation | 1. Apply filter in global view 2. Click staging sphere 3. Verify T1 focus + concentric orbits appear 4. Verify ring dimension auto-selects |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
