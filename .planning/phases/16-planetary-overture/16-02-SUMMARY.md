---
phase: 16-planetary-overture
plan: 02
status: shipped-with-known-gaps
completed_at: "2026-04-18T15:25:00.000Z"
verification: shipped-2026-04-17-reverified-2026-04-18
tests_total: 275
tests_new: 17
bundle_kb_gzip: 237.91
known_gaps: 2
gap_owner: 16-03
---

# 16-02 Summary — Planet Mesh + Reverse-Gather Choreography

## Status

Code shipped (work-tree state as of 2026-04-17 session). Re-verified in
2026-04-18 session prior to commit: 275/275 tests green, clean typecheck,
237.91 KB gzipped build. Two UAT gaps captured in 16-UAT.md remain open
and are explicitly assigned to 16-03 for closure.

## What shipped

**`src/scene/planet.ts`** (new, 50 lines)
- `createPlanet(scene)` builds a Three.js `PlanetGroup` at origin containing
  sphere (radius 30) + ring. Teal emissive material on the sphere.
- `disposePlanet(planetGroup, scene)` removes and disposes geometries +
  materials.
- Exports `PLANET_RADIUS` constant + `PlanetGroup` type.

**`src/scene/planetary-gather.ts`** (new, 87 lines)
- `gatherStarsToPlanet(objects, center, surfaceRadius)` — sets each star's
  position to a Fibonacci-sphere surface point around the planet center.
  Flags `userData.isPlanetaryTarget = true`. Instant; no animation.
- `releaseStarsToHomes(objects)` — GSAP tween each star from surface back to
  its orbital home (computed from starOrbit at t=0). Clears the
  `isPlanetaryTarget` flag on complete. Returns a `Promise<void>`.
- reduced-motion variant: duration compression handled by the choreographer's
  `s` scale factor, not here — this module stays duration-agnostic.

**`src/scene/scene-state.ts`** (1-line change)
- `tickOrbits` skips stars with `isPlanetaryTarget` in addition to
  `isStagingTarget`, preventing the tick loop from fighting GSAP while
  stars are held on the planet's surface or being released.

**`src/animation/transition-choreographer.ts`** (+64 lines)
- New export: `choreographPlanetaryToGlobal(objects, planetGroup)`.
- Sequence (default timing; compressed ~0.33× under prefers-reduced-motion):
  (1) dim planet core 0→0.4s; (2) release stars to homes at 0.2s;
  (3) fade ring 0.4→1.0s; (4) fade sphere 1.0→1.6s; (5) dispose planet +
  `classList.add('show')` on existing `.cl` labels at 1.6s.
- Returns a `Promise<void>` resolved after step 5.

**`src/main.ts`** (+24 lines)
- Boot block: after scene build, `createPlanet(scene)` + `gatherStarsToPlanet`
  run before the first render frame, so stars appear on the planet surface
  from the very first tick.
- `viewState.subscribe` extended: when `prev.kind === 'planetary'` and
  `next.kind === 'global'`, `choreographer.choreographPlanetaryToGlobal(
  sceneObjects, planetGroup)` fires.
- TEMPORARY click + keydown (Enter / Space) handlers dispatch `ENTER_FIELD`.
  Marked in-code as Plan 16-03's replacement target.

**Tests** (17 new)
- `src/scene/planet.test.ts` (7 tests): createPlanet shape, dispose idempotency,
  materials configured, positioning at origin.
- `src/scene/planetary-gather.test.ts` (10 tests): gather sets surface
  positions via Fibonacci distribution, flags set/cleared correctly, release
  returns Promise that resolves, tween targets home positions.

## Verification (automated gate)

```
Tests:      275 passed / 30 files (up from 258 / 28 — 17 new tests added)
Typecheck:  tsc --noEmit clean
Build:      877.56 kB raw / 237.91 kB gzipped  (+0.72 kB vs 16-01, well
            within 800 KB / 250 KB gzipped budget)
```

## Known gaps (captured at 16-UAT.md — DEFERRED to 16-03)

Visual UAT on 2026-04-18 (Playwright MCP → Windows Chrome, UA probe verified)
found two issues that code-green tests did not catch:

1. **Planetary state does not own the viewport.** At boot, `#hero`,
   `#queryWrap`, `ADVANCED`, masthead, footer, and nucleus bubbles all
   render alongside the planet. Root cause: `main.ts:196-197` maps both
   `planetary` and `global` to `sceneObjects.mode = 'global'`, and the
   global DOM chrome mounts from boot with no view-state gating.

2. **Cluster labels do not receive `.show` after reverse-gather.** Choreographer
   step 5 adds `.show`, but the `tickOrbits` label loop at `main.ts:237-240`
   strips it every frame while `labelThreshold === 0 && !isFocused`. Root
   cause confirmed by file read.

Both gaps are folded into 16-03's scope (per 16-CONTEXT.md update, 2026-04-18
evening). 16-03 introduces `body.planetary` chrome-hide CSS, a scene-geometry
gate (`sceneObjects.planetaryActive`), and an `overtureComplete` flag the
tick loop respects — atomically unlatched at the final beat of
`choreographPlanetaryToGlobal`.

## Visual regression

App boots; stars appear on planet surface; click/Enter/Space commits the
planetary → global transition with the full choreograph (stars migrate to
orbital homes, planet fades out, labels appear — modulo Gap 2 above). The
temporary click handler is a dev affordance, not the designed overture; that
arrives in 16-03.

## Anchor points for next plan

- **16-03** replaces the temp click handler with the calibration overture
  (reticle + status lines + scan-line + planet fade-in), mounts the
  observatory header, adds the skippable handler, the reduced-motion
  variant, AND closes both gaps above.
- The `subscribe` hook and the `choreographPlanetaryToGlobal` callable
  remain the integration point; 16-03 adds a final beat to the choreographer
  (flip `planetaryActive` + remove `body.planetary` + invoke
  `onOvertureComplete` callback) without rewriting it.

## Notes

- The `.planning/` project-level updates (PROJECT.md, ROADMAP.md, STATE.md,
  MILESTONE-v3.3.md, config.json) are bundled into the 16-02 commit as
  `docs:` companions since they reflect milestone scope for v3.3, not
  16-02-specific behavior.
- This SUMMARY was authored retroactively during the 2026-04-18 commit
  session. All assertions derive from `git diff`, 16-02-PLAN must_haves,
  and 16-UAT.md findings — not from a first-person execution log.
