---
phase: 11
slug: reading-panel-as-instrument
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 11 — Validation Strategy

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.0 |
| **Quick run command** | `npx vitest run src/ui/reading-panel.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** `npx vitest run`
- **After every plan wave:** `npx vitest run`
- **Max feedback latency:** 15 seconds

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Panel reads as "observation" not "marketing summary" | RP-03 | Perceptual judgment | Open a case — does it feel like data observation? |
| Fraunces italic renders correctly with opsz 144 | RP-06 | Font rendering | Inspect case title — verify italic + optical size |
| Metrics grid alignment with variable-length values | RP-04 | Layout edge case | Open cases with 1, 3, 5 metrics — grid stays clean |
| Permission-false shows [CONFIDENTIAL] without layout shift | RP-07 | Layout stability | Toggle between permission:true and permission:false cases |
| Key visual at 0.75 opacity feels atmospheric, not dominant | RP-02 | Visual judgment | Open case with imagery — does visual compete? |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify
- [ ] Sampling continuity maintained
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set after execution

**Approval:** pending
