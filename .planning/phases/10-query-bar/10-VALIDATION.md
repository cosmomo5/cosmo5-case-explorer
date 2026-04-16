---
phase: 10
slug: query-bar
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green (207 + new tests)
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | QRY-02 | unit | `npx vitest run src/tests/keyword-map.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 0 | QRY-02 | unit | `npx vitest run src/tests/filter-searchtext.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | QRY-02 | unit | `npx vitest run src/data/filter.test.ts` | existing | ⬜ pending |
| 10-02-02 | 02 | 1 | QRY-02 | unit | `npx vitest run src/tests/keyword-map.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 1 | QRY-03 | unit | `npx vitest run src/tests/filter-wave.test.ts` | ❌ W0 | ⬜ pending |
| 10-04-01 | 04 | 2 | QRY-01,QRY-04,QRY-06,QRY-07,QRY-08 | unit+DOM | `npx vitest run src/tests/query-bar.test.ts` | ❌ W0 | ⬜ pending |
| 10-05-01 | 05 | 3 | QRY-05 | unit+DOM | `npx vitest run src/tests/query-bar.test.ts` | ❌ W0 | ⬜ pending |
| 10-05-02 | 05 | 3 | QRY-07,QRY-08 | smoke | Visual inspection + keyboard test | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/keyword-map.test.ts` — covers QRY-02 keyword→dimension mapping
- [ ] `src/tests/filter-searchtext.test.ts` — covers QRY-02 FilterState.searchText extension
- [ ] `src/tests/filter-wave.test.ts` — covers QRY-03 wave propagation (mock GSAP)
- [ ] `src/tests/clusters-count.test.ts` — covers QRY-04 N MATCHES + M CLUSTERS formula
- [ ] `src/tests/query-bar.test.ts` — covers QRY-01, QRY-05, QRY-06, QRY-07, QRY-08

*All need `// @vitest-environment jsdom` pragma for DOM tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wave propagation reads as spatial (not instant) | QRY-03 | Perceptual timing judgment | Type "fintech" — stars should dim in a wave from matching clusters outward over ~600ms |
| Query bar centered, DM Mono, gold border on focus | QRY-01 | CSS visual check | Focus the input — border should turn gold, text should be DM Mono |
| Advanced drawer excludes mode-chip | QRY-05 | DOM visual check | Open Advanced drawer — orbit-by switcher must NOT appear |
| Full keyboard flow without mouse | QRY-07 | Integration flow | Tab to input, type, Enter, Tab to Advanced, Tab to chips, Esc to close |
| N MATCHES updates immediately (before wave completes) | QRY-04 | Timing perception | Type fast — count should update instantly, wave follows |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
