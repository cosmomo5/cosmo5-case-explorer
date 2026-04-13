---
phase: 6
slug: reading-panel-track-selection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x + jsdom |
| **Config file** | `vite.config.ts` (vitest block) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds (153 baseline + new tests) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | READ-01 | unit | `npm test -- layout-controller` | ✅ extend | ⬜ pending |
| 06-01-02 | 01 | 1 | READ-02 | unit | `npm test -- layout-controller` | ✅ extend | ⬜ pending |
| 06-01-03 | 01 | 1 | READ-03 | unit | `npm test -- layout-controller` | ✅ extend | ⬜ pending |
| 06-02-01 | 02 | 2 | READ-04 | unit (DOM) | `npm test -- reading-panel` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | READ-05 | unit (DOM) | `npm test -- reading-panel` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | READ-06 | unit | `npm test -- reading-panel` | ❌ W0 | ⬜ pending |
| 06-02-04 | 02 | 2 | READ-07 | unit | `npm test -- star-state` | ✅ extend | ⬜ pending |
| 06-02-05 | 02 | 2 | READ-08 | unit (DOM) | `npm test -- reading-panel` | ❌ W0 | ⬜ pending |
| 06-02-06 | 02 | 2 | READ-09 | unit (DOM) | `npm test -- reading-panel` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | READ-10 | unit (DOM) | `npm test -- shortlist-track` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/ui/reading-panel.test.ts` — stubs for READ-04, READ-05, READ-06, READ-08, READ-09 (jsdom)
- [ ] `src/ui/shortlist-track.test.ts` — stubs for READ-10 track rendering
- [ ] Extend `src/data/view-state.test.ts` — OPEN_READING / CLOSE_READING transition tests
- [ ] Confirm `src/data/star-state.test.ts` — assert colorOverride 0xe8b15a for 'reading' state

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Panel slide-in animation feels smooth | READ-01 | Visual timing | 1. Click case star 2. Observe 340px panel slides from right 3. Scene compresses leftward smoothly |
| Gold glow visible in orbit | READ-07 | Visual appearance | 1. Open reading panel on a case 2. Verify active case star glows gold in the 3D scene |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
