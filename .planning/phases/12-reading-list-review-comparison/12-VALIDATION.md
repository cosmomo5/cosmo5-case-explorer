---
phase: 12
slug: reading-list-review-comparison
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 12 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.0 |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~20 seconds |

## Sampling Rate

- **After every task commit:** `npx vitest run`
- **After every plan wave:** `npx vitest run`
- **Max feedback latency:** 20 seconds

## Manual-Only Verifications

| Behavior | Requirement | Why Manual |
|----------|-------------|------------|
| Star flight animation reads as physical (star leaves orbit) | RL-03 | Perceptual |
| Ghost at 0.15 opacity reads as "ghost" not "another star" | RL-03 | Perceptual |
| Return animation 20% slower than entry | RL-04 | Timing judgment |
| Reading list persists across browser restart | RL-05 | Browser integration |
| Welcome-back readout timing feels right | RL-08 | UX judgment |
| Review Mode pagination smooth, Esc exits cleanly | RV-03 | Flow judgment |
| Comparison Mode formation visually distinct from focus mode | CM-06 | Perceptual |
| Gathered stars labeled at readable spacing | CM-03 | Layout |
| Rapid add/remove doesn't freeze animations | RL-03 | Stress test |

## Validation Sign-Off

**Approval:** pending
