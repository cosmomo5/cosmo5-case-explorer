---
phase: 9
slug: atmosphere
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2 |
| **Config file** | `vite.config.ts` (vitest config embedded) |
| **Quick run command** | `npx vitest run src/scene/background/graticule.test.ts src/ui/loader.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/scene/background/graticule.test.ts src/ui/loader.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green (195 + new tests)
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | ATM-01 | unit | `npx vitest run src/scene/background/graticule.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 0 | ATM-02, ATM-04 | unit | `npx vitest run src/ui/loader.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | ATM-01 | unit | `npx vitest run src/scene/background/graticule.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | ATM-01 | unit | `npx vitest run src/scene/background/graticule.test.ts` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 1 | ATM-02 | unit | `npx vitest run src/ui/loader.test.ts` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 1 | ATM-04 | unit | `npx vitest run src/ui/loader.test.ts` | ❌ W0 | ⬜ pending |
| 09-03-03 | 03 | 1 | ATM-02 | integration | manual | manual-only | ⬜ pending |
| 09-04-01 | 04 | 2 | ATM-03 | smoke | Visual inspection | manual-only | ⬜ pending |
| 09-04-02 | 04 | 2 | ATM-03 | smoke | Visual inspection at breakpoints | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/scene/background/graticule.test.ts` — stubs for ATM-01 (crtGridTexture shape, createGraticule material properties, depthWrite:false)
- [ ] `src/ui/loader.test.ts` — stubs for ATM-02 and ATM-04 (LoaderController state transitions INIT→DATA→SCENE→ONLINE, done() call after ONLINE, reduced-motion skip)
- [ ] Both files need `// @vitest-environment jsdom` pragma (canvas and matchMedia APIs)
- [ ] `matchMedia` mock: `vi.stubGlobal('matchMedia', ...)` for reduced-motion variant

*Existing infrastructure covers all 195 existing tests. No framework install or vite.config.ts changes needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wordmark ≤80px wide at all breakpoints | ATM-03 | CSS computed width needs real browser | Inspect wordmark element at 1920, 1440, 1024, 768px widths |
| Wordmark does not overlap other UI | ATM-03 | Layout collision needs visual check | Check against query bar (Phase 10), home button, track zone |
| CRT graticule reads as substrate, not foreground | ATM-01 | Perceptual/aesthetic judgment | Fresh eyes test: does the grid draw attention? |
| Loader timing tracks real boot progress | ATM-02 | Integration timing against real data fetch | DevTools network throttle to Slow 3G, verify text changes match progress |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
