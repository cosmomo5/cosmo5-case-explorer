---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x |
| **Config file** | `vite.config.ts` (test.environment: 'node') |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01 | 01 | 1 | FND-01 | unit | `npx vitest run src/data/view-state.test.ts` | ❌ W0 | ⬜ pending |
| 01-02 | 01 | 1 | FND-02, FND-03 | unit | `npx vitest run src/data/shortlist-store.test.ts` | ❌ W0 | ⬜ pending |
| 01-03 | 01 | 1 | FND-04 | unit | `npx vitest run src/data/proof-type.test.ts` | ❌ W0 | ⬜ pending |
| 01-04 | 01 | 1 | FND-05 | unit | `npx vitest run src/data/impact-scale.test.ts` | ❌ W0 | ⬜ pending |
| 01-05 | 01 | 1 | FND-06 | unit | `npx vitest run src/data/star-state.test.ts` | ❌ W0 | ⬜ pending |
| 01-06 | 02 | 2 | FND-01 | unit | `npx vitest run src/data/view-state.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/data/view-state.test.ts` — stubs for FND-01
- [ ] `src/data/shortlist-store.test.ts` — stubs for FND-02, FND-03
- [ ] `src/data/proof-type.test.ts` — stubs for FND-04
- [ ] `src/data/impact-scale.test.ts` — stubs for FND-05
- [ ] `src/data/star-state.test.ts` — stubs for FND-06

*Existing tests (`filter.test.ts`, `grouping.test.ts`, orbital `*.test.ts`) continue passing unmodified.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Enriched cases propagate through buildOrbitalScene | FND-04, FND-05 | Integration with Three.js boot | Start dev server, verify no errors in console |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
