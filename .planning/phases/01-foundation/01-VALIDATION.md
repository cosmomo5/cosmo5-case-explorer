---
phase: 1
slug: foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-25
supersedes: 2026-04-13 version (stale FND-01..FND-06 data-layer scope; Phase 1 redirected to Entry screen per D-01 in 01-CONTEXT.md)
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x |
| **Config file** | `vite.config.ts` (test.environment: 'happy-dom' for DOM tests) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|------|------|------|-------------|-----------|-------------------|-------------|--------|
| entry-screen module | 01-01 | 1 | ENTRY-02, ENTRY-06, ENTRY-08, ENTRY-10 | unit (DOM) | `npx vitest run src/ui/entry-screen.test.ts` | ❌ W0 | ⬜ pending |
| entry-screen tests | 01-01 | 1 | ENTRY-02, ENTRY-06, ENTRY-08, ENTRY-10 | unit (DOM) | `npx vitest run src/ui/entry-screen.test.ts` | ❌ W0 | ⬜ pending |
| Entry CSS | 01-02 | 1 | ENTRY-03, ENTRY-04, ENTRY-05, ENTRY-07, ENTRY-12 | visual (manual) | `npx vitest run` (full suite) | n/a | ⬜ pending |
| main.ts wiring | 01-03 | 2 | ENTRY-01, ENTRY-08, ENTRY-09 | integration + visual | `npx vitest run` + browser UAT | n/a | ⬜ pending |
| Visual UAT checkpoint | 01-04 | 3 | ENTRY-01..ENTRY-12 (ex. ENTRY-11) | manual visual | Browser: `npm run dev` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*ENTRY-11 (ViewStateMachine 'entry' screen state) is deferred to Phase 2 per RESEARCH.md scope decision.*

---

## Wave 0 Requirements

- [ ] `src/ui/entry-screen.test.ts` — created by Plan 01-01 Task 2. Covers ENTRY-02, ENTRY-06, ENTRY-08, ENTRY-10.
  - Test 1: `mountEntryScreen` appends `.entry-screen` div to parent
  - Test 2: CTA button exists with text `ENTER OBSERVATORY →`
  - Test 3: CTA click adds `entry-screen--exiting` class immediately
  - Test 4: CTA click calls `onEnter` callback after 200ms
  - Test 5: No localStorage read on mount (ENTRY-10)
  - Test 6: Root container has no background color (transparent overlay)

*Existing tests (`filter.test.ts`, `grouping.test.ts`, orbital `*.test.ts`) continue passing unmodified.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Entry globe visible on right half | ENTRY-01, ENTRY-12 | Three.js canvas rendering | Open browser, confirm globe spins right of editorial |
| Headline typography (Fraunces italic "proof" in gold) | ENTRY-04 | Font rendering | Visual inspection in browser |
| Pulsing dot animation | ENTRY-06 | CSS keyframe | Observe CTA dot in browser |
| 200ms fade + 600ms State 1 reveal timing | ENTRY-08 | Animation timing | Click CTA, observe transition |
| State 1 free-float (116 cases drifting) | ENTRY-09 | Three.js scene | Inspect scene after CTA click |
| Calibration overture → Entry screen sequence | ENTRY-02 | Boot sequence timing | Fresh page load, observe overture then entry |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 test stub (01-01 Task 2 creates the stub)
- [x] Sampling continuity: wave 0 test + per-task verify commands present
- [x] Wave 0 covers all DOM-testable requirements
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
