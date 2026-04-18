# Phase 16 — Planetary Overture

**Status:** Direction selected 2026-04-17 (Option A + C combo). Plans to be written in this phase dir.
**Milestone:** v3.3 "Resolve the Observatory"
**Mode:** Claude (design-impacting)
**Predecessors:** none in v3.3 (Phase 16 is milestone opener)
**Followers:** Phase 17 (star labels always-on), Phase 18 (unified left column)

---

## The Decision (2026-04-17)

Three mockups reviewed in visual companion. Mo selected **Option A "Gathering Mass" with a little bit of C "Calibration Ceremony" for dramatic effect.**

Mockups: `.superpowers/brainstorm/632869-1776450920/content/option-a-gathering-mass.html`, `option-c-calibration-ceremony.html`, `index.html`

---

## The Sequence (authoritative)

The boot experience has two acts — a calibration pre-reveal, then a planet reveal — ending in a held state the user commits into the field from.

### Act I — Calibration (0.0s – 2.4s)

- **Field dark.** Graticule substrate faint (unchanged from v3.2).
- **Header chrome visible from t=0.** DM Mono, top strip: `CASE EXPLORER · CASE_COUNT 48 · STATUS CALIBRATING · EPOCH 2026`. Persists through all views; `STATUS` updates per view-state.
- **Reticle at center**, barely visible (cross-hairs + corner brackets, rgba teal 0.18 on outer ring).
- **Four DM Mono status lines** appear in sequence below reticle:
  - `0.3s` — "OBSERVATORY INITIALIZING" fades in
  - `0.9s` — line 1 marks done (teal ✓), "LOCATING CASE LIBRARY" fades in
  - `1.5s` — line 2 done, "CALIBRATING STARMAP" fades in
  - `2.1s` — line 3 done, "READY" appears briefly
  - `2.4s` — calibration text fades out; reticle softens

### Act II — Planet reveal (2.4s – 3.5s)

- **Scan-line** begins single sweep from top of viewport, 2° tilt, through center, exits bottom. ~1s total.
- **As sweep passes center (`~2.7s`):** planet materializes.
  - Three.js sphere at world origin, radius ~6 units (display ~220px).
  - Teal inner glow + dark atmospheric outer gradient. Surface stars begin at planet-surface phyllotaxis positions (all 48 cases, tight distribution on sphere surface).
  - `planet-readout` text inside sphere: `48 / CASE STUDIES` (DM Mono, teal, centered, billboarded).
- **Scan-line exits bottom (`~3.2s`):** planet fully visible. Header `STATUS` changes `CALIBRATING → OBSERVING`.
- **Ring around planet** fades in (rotated ellipse, teal 0.12).
- **`3.5s`:** "Click to enter the field" hint fades in below planet — DM Mono 11px, teal 0.55.

### Act III — Hold + user gesture

- Planet remains. Hint pulses subtly. Header chrome steady.
- **Any click** (or `Enter`, or `Space`) commits. Not a button — the whole field is the affordance.

### Act IV — Reverse gather (on commit, 0.0s – 1.6s)

- Hint text fades. Ring fades.
- **Planet core dims** while case stars begin outward migration.
- Stars fly from planet-surface positions to their cluster positions (concentric-orbit layout). Uses existing phyllotaxis math + `--ease`. Think reverse of `animateStarsToStaging`.
- `~1.2s`: stars arrive at cluster positions. Planet sphere fades to nothing (fade, not shrink).
- `~1.6s`: cluster labels (`.cl`) fade in. View-state: `planetary → global`. Header `STATUS`: `OBSERVING · 9 CONSTELLATIONS`.

### Skippable

Click during Act I or Act II skips to Act IV immediately. No mid-animation hang.

---

## Design Authority

- **Direction note:** `design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`
- **Register:** BYLD analog-era precision (calibration text, scan line, instrument header, reticle)
- **Structural:** Kunumi — no menu, no splash; the observatory is already instrumented and you enter the field
- **Foundation:** Cosmo5 astronomical vocab — planet is the gathered state of the field; reverse-gather is the existing mechanic run backward

## Rejections to check against

- `rejections/generic-ai-aesthetic-signals.md` — no purple gradients, no three-equal-column anything, no Inter
- `rejections/loading-fonts-you-dont-use.md` — DM Mono, Noto, Fraunces all render visibly within 3s (calibration text = DM Mono within 0.3s)
- `rejections/accessibility-blocked-for-visual-gain.md` — respect `prefers-reduced-motion`: cut Acts I–II to <0.4s static reveal; Act IV still animates but shorter (~0.5s) and simpler
- Cross-phase invariant (MILESTONE-v3.3.md): no two panels occupy same region. Header chrome claims top strip only; does not conflict with Phase 18 left column, Phase 21 right drawer, or Phase 22 bottom-right.

---

## Interfaces (existing code)

**State machine** — `src/data/view-state.ts` currently `global | constellation | reading`. Phase 16 adds `planetary` as the initial kind and a new event `ENTER_FIELD`.

**Gather primitives** — `src/scene/staging.ts` has `animateStarsToStaging` + `returnStarsFromStaging`. Reverse-gather reuses the `returnStarsFromStaging` shape: stars move from a gathered position (planet surface) back to their orbital home (cluster positions). May need a variant that accepts a different source-position provider (planet-surface phyllotaxis rather than staging-sphere surface).

**Phyllotaxis** — `src/scene/phyllotaxis.ts` already computes positions on a sphere. Planet-surface gathering is exactly its use case. `computePhyllotaxisPositions(48, { radius: PLANET_SURFACE_R })` gives the Act II initial layout.

**Transition choreographer** — `src/animation/transition-choreographer.ts` owns multi-stage transitions. Act IV is a new choreography method: `choreographPlanetaryToGlobal()`.

**Renderer + scene** — `src/scene/renderer.ts` and `scene-state.ts` own the Three.js graph. Planet mesh is a new top-level scene object; lifecycle is `create on planetary enter → dispose on transition to global`.

**Loader / boot** — `src/main.ts` boot currently initializes scene and transitions into `global`. Phase 16 inserts `planetary` as the initial state; `main.ts` no longer dispatches anything until user commit.

**Styles** — `src/style.css` token set already has `--teal`, `--gold`, `--bg`, `--ease`. Add:
- `--dim-calibrating`, `--dim-ready` for status-line opacity progression (or reuse existing opacity tokens if Phase 24 already names them)
- `--scan-sweep-duration: 1.0s` (consistent naming with existing motion tokens)

---

## Plan breakdown

Phase 16 splits into three execute-plans:

1. **16-01 — State machine + planetary view infrastructure** (autonomous, no visual output yet)
   - Extend `ViewState` to include `{ kind: 'planetary' }`
   - Add `ENTER_FIELD` event: `planetary → global`
   - Boot main.ts in `planetary`, not `global`
   - No Three.js changes yet — scene still renders global until planetary mesh is added
   - Gate: tests pass; ViewState exhaustiveness holds; boot enters planetary state

2. **16-02 — Planet mesh + reverse-gather animation** (autonomous on the math, visual spec required)
   - `src/scene/planet.ts`: create/dispose sphere + ring + surface stars
   - Surface stars use `computePhyllotaxisPositions(48, { radius: PLANET_SURFACE_R })`
   - Reverse-gather: new function in `staging.ts` or new `src/scene/planetary-gather.ts` — moves case stars from planet-surface positions to cluster positions
   - `choreographPlanetaryToGlobal()` in `transition-choreographer.ts`: sequences dim + migrate + planet fade + label fade-in
   - Gate: Playwright screenshot sequence — boot in planetary state → click → screenshot mid-transition → screenshot global state. Visual check: planet present at t=0, stars at cluster positions at t=1.6s.

3. **16-03 — Calibration overture (Act I + II) + header chrome + skippable + Gap-1/Gap-2 closure** (visual, register-critical)
   - `src/ui/calibration-overture.ts`: DOM overlay with reticle, 4 status lines, scan line
   - `src/ui/observatory-header.ts` (or extend existing header): persistent `CASE_COUNT · STATUS · EPOCH` instrument readouts; `STATUS` subscribes to view-state
   - Skippable: click/Enter/Space during Acts I–II fires `ENTER_FIELD` immediately, cancels overture, transitions
   - `prefers-reduced-motion`: Acts I–II collapse to 0.4s static reveal (reticle + "READY" + planet fade-in), Act IV reduces to 0.5s fade-swap (no migration motion)
   - **Gap 1 closure — hide global DOM chrome at boot.** While `viewState.kind === 'planetary'`, these elements must be hidden (display:none or opacity 0 + pointer-events none; TBD by implementer): `#hero`, query bar, `ADVANCED` button, `#masthead` (`COSMO5 / OBSERVATORY`), catalog footer (`CATALOG / 116 CASES / 13 MARKETS / 19 SERVICES / 2024–2026`). They fade in only after `ENTER_FIELD` fires — either as a final beat of `choreographPlanetaryToGlobal` (preferred; consistent with cluster-label fade-in) or immediately post-transition. The observatory header (`CASE_COUNT · STATUS · EPOCH`) added by this plan is the only persistent chrome during planetary state.
   - **Gap 1 closure — hide global scene geometry at boot.** Current `main.ts:196-197` maps both `planetary` and `global` to `sceneObjects.mode='global'`. The comment there punts the distinction to "the overture overlay (Plan 16-03)" — 16-03 now owns it. Two viable shapes: (a) introduce a `sceneObjects.mode = 'planetary'` variant and gate `tickOrbits` / nucleus mesh visibility / halo visibility on it; (b) keep the two-mode shape but use a separate `sceneObjects.planetaryActive: boolean` flag that hides nucleus meshes + halos while true. The planner should pick; preference is (b) if it avoids churning the `focused`/`global` branches in `tickOrbits` and click handlers, else (a).
   - **Gap 2 closure — overture-complete flag for tick loop.** `choreographPlanetaryToGlobal`'s step 5 correctly calls `classList.add('show')` on `nucleusLabels` entries, but the tick loop at `main.ts:237-240` removes `.show` the next frame because `labelThreshold === 0` and `!isFocused`. Fix: introduce a flag (call it `overtureComplete` or reuse the `planetaryActive` flag above inverted) that the choreographer sets true at the end of its promise chain, and widen the tick loop condition to `const showLabel = overtureComplete || labelThreshold > 0 || isFocused`. Three-line change. This flag can also gate the fade-in of the now-hidden global DOM chrome (see Gap 1 closure above), keeping the overture→global boundary single-sourced.
   - **Scene-state scope note.** No planet scale / camera framing changes in this plan. Testing the Gap 1 chrome-hiding fix first is expected to reclaim the viewport for the planet; a revisit only if it still reads undersized after that closes.
   - Gate: Playwright — full 3.5s sequence screenshots at 0.5s / 1.5s / 2.5s / 3.5s; reduced-motion screenshots at 0.2s / 0.6s; skippable: click at 1.0s → global within 1.6s. **Added gates for gaps:** (i) at boot, DOM probe confirms `#hero`, query bar, `ADVANCED`, masthead, footer are hidden (zero visible per `getBoundingClientRect` / computed style); (ii) after reverse-gather completes, DOM probe confirms all 7 `.cl` label divs have `.show` class.

---

## Verification gates (per milestone)

Per `MILESTONE-v3.3.md`:

- ✓ Playwright screenshot: boot state (planet present, header STATUS CALIBRATING then OBSERVING)
- ✓ Playwright screenshot: click/transition mid-state
- ✓ Playwright screenshot: cluster state after transition (global view, no planet)
- ✓ No two panels occupy same region (header is top strip only; no conflict)
- ✓ `prefers-reduced-motion` respected
- ✓ All existing tests pass; new tests for ViewState extension and choreographer method

---

## Out of scope (deferred)

- Imagery on planet surface (P2-D, deferred to content project)
- Planet-interior case representation (overture shows cases as surface stars; "within" framing is preserved via phyllotaxis tightness, not by modeling interior geometry)
- Any filter/query interaction during overture — the overture is pre-interaction
- Returning to planetary state from global — one-way transition. If a user wants "home", that's the crumb; does not reanimate reverse overture.
