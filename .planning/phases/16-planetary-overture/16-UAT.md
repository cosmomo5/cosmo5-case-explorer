---
status: testing
phase: 16-planetary-overture
source:
  - 16-01-SUMMARY.md
  - 16-02-PLAN.md (no SUMMARY — code-complete, visual gate pending)
started: "2026-04-18T00:28:06Z"
updated: "2026-04-18T00:33:00Z"
verification_method: "Playwright MCP → Windows Chrome (via /mnt/c/Program Files/Google/Chrome/Application/chrome.exe) — sanctioned path per .mcp.json; WSL X11 untouched. Artefacts: .planning/phases/16-planetary-overture/artifacts/16-uat-01-boot.png, artifacts/16-uat-02-after-click.png"
---

## Current Test

number: 3
name: Post-transition parity with v3.2
expected: Nominal v3.2 global behavior after reverse-gather completes.
awaiting: resume after gap-planning (tests 3–5 blocked by test-1 + test-2 gaps)

## Tests

### 1. Planet at boot
expected: Teal-emissive sphere at origin, 48 case-stars on surface via Fibonacci distribution, subtle ring tilted ~18°, starfield + graticule behind, no cluster labels.
result: issue
reported: "At boot, the planet is present with stars on its surface (Fibonacci-looking distribution), BUT the entire global UI layer is rendering simultaneously underneath/around it: all 7 nucleus cluster bubbles (translucent colored orbs), the hero query bar ('What kind of proof do you need?', '116 CASES · 7 CLUSTERS', 'OR EXPLORE THE FULL CATALOG — CLICK A CLUSTER TO ENTER', 'ADVANCED' button), the footer ('CATALOG / 116 CASES / 13 MARKETS / 19 SERVICES / 2024–2026'), and the masthead ('COSMO5 / OBSERVATORY') are all visible. The planet appears small relative to the nucleus bubbles and positioned off-center (right of the query-bar line, above the footer). The ring is not visible at the boot camera angle. The scene is a cluttered hybrid, not the clean Act II 'observatory' premise the plan specified. Planetary state is supposed to own the viewport — only the planet + starfield + graticule — with all global chrome deferred until after ENTER_FIELD."
severity: major

### 2. Click triggers reverse-gather
expected: Planet core dims ~0.4s, stars fly outward over ~1.2s to orbital homes with power2.out easing, planet fades to 0, ring fades out, cluster labels fade in. Total ~1.6s.
result: issue
reported: "Reverse-gather sequence mostly works: after a click, the planet disappears and the 48 stars are visible in their nucleus orbits inside the cluster bubbles. Screenshot at t≈2s confirms stars are at their orbital homes (teal, orange, pink cluster colors) and the planet is gone. BUT cluster labels do NOT fade in — DOM check after the transition: 7 label divs exist in #star-labels, 0 have the `show` class (zero .cl.show elements). Either the planetary→global subscribe branch isn't firing choreographPlanetaryToGlobal, or the classList.add('show') step is pointing at a selector that doesn't match the actual label elements. Also note: because the global chrome was already mounted at boot (see test 1), the 'reveal' of global state after ENTER_FIELD is less cinematic than intended — most of the UI doesn't change, only the planet goes away."
severity: major

### 3. Post-transition parity with v3.2
expected: After the reverse-gather completes, the app looks identical to v3.2 `global` state. Filter panel, query bar, reading panel, reading list, Review Mode, Comparison Mode all still work.
result: [pending]
reason: "Blocked pending resolution of tests 1 and 2. The underlying global state machinery appears wired (DOM snapshot after click showed canvas entered 'Focused' mode with 'click empty space to exit' affordance, suggesting the click dispatched both ENTER_FIELD and a star selection, which is fine for a smoke test). Full parity check deferred until cluster labels work and boot chrome is corrected."

### 4. Reduced-motion variant
expected: With prefers-reduced-motion emulated, transition compresses to ~0.4s; stars still move (no jump-cut).
result: [pending]
reason: "Deferred. Will verify after tests 1+2 gaps are closed — no point validating a reduced-motion variant of a flow that's wrong at full motion."

### 5. No state-machine regressions
expected: Invalid transitions throw with descriptive errors; only ENTER_FIELD moves planetary → global.
result: pass
reason: "Covered by the 10 new tests in view-state.test.ts (all 275 passing per 16-01 SUMMARY automated gate). Runtime behavior matches: a single click moved the app from planetary to focused (via global), which is the only sanctioned ENTER_FIELD→focused path."

## Summary

total: 5
passed: 1
issues: 2
pending: 2
skipped: 0

## Gaps

- truth: "Planetary state should own the viewport at boot — only the planet + starfield + graticule render; global chrome (cluster bubbles, query bar, hero text, masthead, footer) is hidden until after ENTER_FIELD fires."
  status: failed
  reason: "User reported (verified via Playwright screenshot 16-uat-01-boot.png): at boot, all 7 nucleus cluster bubbles and the full global chrome (hero H1 'What kind of proof do you need?', '116 CASES · 7 CLUSTERS', catalog footer, advanced button, masthead) render simultaneously with the planet. The scene graph is rendering global-mode geometry under planetary mode. Planet appears small and off-center relative to the already-mounted global UI."
  severity: major
  test: 1
  artifacts:
    - "artifacts/16-uat-01-boot.png"
  missing:
    - "Mode-gated rendering: when viewState.kind === 'planetary', nucleus meshes should be hidden/opacity 0 and cluster halos should not render. Currently scene-state subscribe maps both planetary and global to sceneObjects.mode='global', which is exactly what wrongly reveals everything."
    - "Hero chrome (#hero, query bar, ADVANCED button, catalog footer) gated on viewState — fade in as part of the 'reveal' that follows ENTER_FIELD, not mounted from boot."
    - "Planet scale + camera framing review — at PLANET_RADIUS=30 with the current camera position the planet reads small; either bump the radius or move the camera closer during planetary state so the planet owns the frame."

- truth: "Cluster labels fade in as the last beat of choreographPlanetaryToGlobal (classList.add('show') on #star-labels .cl divs)."
  status: failed
  reason: "User reported (verified via DOM probe post-transition): 7 .cl label divs exist in #star-labels, 0 have the 'show' class. choreographPlanetaryToGlobal's final step (step 5 in the plan — 'fade cluster labels in') is not reaching the labels. Either the planetary→global subscribe branch in main.ts isn't firing the choreograph (unlikely — the stars DO release to their homes, proving some of the sequence ran), or the selector the choreograph uses doesn't match the actual DOM selector the existing label-tick code uses for the `.cl` elements."
  severity: major
  test: 2
  artifacts:
    - "artifacts/16-uat-02-after-click.png"
  missing:
    - "Verify choreographPlanetaryToGlobal's label-show loop actually iterates objects.nucleusLabels and that those DOM elements match the '.cl' selector used by the existing label-positioning code. Plausible: objects.nucleusLabels entries are the div refs, but the classList.add('show') happens on a different element than the '.cl' the CSS targets."
    - "Alternatively: the choreograph is never reaching step 5 because an earlier step errored silently. Check for unhandled promise rejection in the choreograph's async chain."

## Acknowledged Gaps

Visual verification ran via Playwright MCP against Windows Chrome (not WSL X11) — aligns with the 'Playwright from Windows' rule. The .mcp.json server config at ~/.claude/.mcp.json points the Playwright node process at /mnt/c/Program Files/Google/Chrome/Application/chrome.exe, so the WSL prohibition (about X11/GPU unreliability) is satisfied.

Test 3 (global parity) and test 4 (reduced-motion) are deferred, not skipped — they'll run after gap closure on tests 1+2.
