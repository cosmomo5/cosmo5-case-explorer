# Phase 9: Atmosphere - Research

**Researched:** 2026-04-16
**Domain:** Three.js 0.170, CSS animation, progressive loader, prefers-reduced-motion
**Confidence:** HIGH

## Summary

Phase 9 establishes the observatory register before any interaction. Three distinct deliverables: (1) a CRT celestial graticule as a substrate texture behind the starfield, (2) a JS-milestone-driven instrument-calibrating loader with DM Mono readouts and step-end transitions, (3) a corner wordmark replacing the current header. All three are purely additive on top of Phase 8's clean substrate — no existing functionality is modified, only the entry experience is layered in.

The critical architectural decision is graticule placement. v3-starmap placed the CRT grid in the main scene behind stars (camera at z=980, front-facing). Phase-1c has a top-down camera at (80, 880, 280) which would distort a z-positioned plane. Three viable placements exist (see Architecture Patterns), each with different tradeoffs. This decision must be made in the plan.

The loader in v3-starmap used fixed CSS animation timing (0.8s theatrical). ATM-02 explicitly requires timing tied to actual boot progress. The implementation must use JS class-toggling at real milestones — the v3-starmap CSS is spec for visual language only, not for timing mechanics.

**Primary recommendation:** Graticule in starfield scene (Option A) — keeps it camera-independent, non-rotating, no main scene contamination. Loader uses 4 JS milestones in main.ts boot sequence with explicit `prefers-reduced-motion` JS check to skip to ONLINE state.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ATM-01 | CRT celestial graticule — radial spokes + concentric circles, 0.06–0.10 opacity, fixed substrate | crtGridTexture() reference from v3-starmap; three placement options with camera-compatibility analysis; canvas-texture approach confirmed viable in Three.js 0.170 |
| ATM-02 | Instrument-calibrating loader tied to actual boot progress — DM Mono sequential readouts, step-end transitions, final ONLINE in gold | main.ts boot milestones identified; JS class-toggle pattern documented; step-end CSS timing function confirmed; v3-starmap loader DOM/CSS as visual spec |
| ATM-03 | Corner wordmark ≤80px wide, replaces current header, no overlaps at any breakpoint | Current header DOM and CSS documented; z-index stack confirmed; safe corner placements identified; DM Mono already loaded |
| ATM-04 | prefers-reduced-motion: loader resolves instantly to ONLINE state without animation | CSS universal gate confirmed in style.css:944-951 (covers CSS); JS check required for loader milestone skipping; matchMedia pattern documented |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Three.js | 0.170 | Graticule geometry + CanvasTexture | Already installed; existing scenes use it |
| GSAP | 3.12 | Reduced-motion gate for existing timeline | Already installed; main.ts:22 gate already exists |
| DM Mono | 300, 400 | Loader readouts + wordmark | Already loaded in index.html; instrument register |
| Vitest | 2 | Test framework | Already configured; 195 tests passing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS CanvasTexture | built-in | Graticule drawing | 2D canvas → Three.js texture pipeline |
| CSS custom properties | — | `--ease`, `--gold`, `--teal`, `--bg` tokens | All visual transitions reference these |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CanvasTexture graticule | SVG overlay | SVG is easier to author but doesn't integrate with WebGL depth/opacity system |
| JS milestone loader | CSS-only timing | CSS-only (v3-starmap approach) is theatrical, not tied to real progress — violates ATM-02 |
| CSS wordmark replacement | Keep existing header | Header has layout implications; CSS swap is reversible, less coupling |

**Installation:** No new packages required. All stack is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── scene/
│   ├── background/
│   │   ├── starfield.ts        # existing — add createGraticule() here
│   │   └── graticule.ts        # NEW — crtGridTexture() + createGraticule()
├── ui/
│   └── loader.ts               # NEW — LoaderController class, 4-step state machine
└── style.css                   # existing — add loader states + wordmark styles
index.html                      # existing — update loader DOM + header DOM
```

### Pattern 1: CRT Graticule — Three Placement Options

**Option A (RECOMMENDED): Add to starfield scene**
- Location: `src/scene/background/starfield.ts` or new `graticule.ts`
- Camera-independent (starfield camera at z=400, forward-facing, orthographic-like for substrate)
- Graticule rotates with stars or can be held fixed via a separate non-rotating Group
- No main scene contamination; visually sits behind everything
- `PlaneGeometry(800, 800)` to fill the canvas at starfield camera's perspective
- z = -300 (between camera at 400 and stars)

**Option B: CSS overlay**
- `position: fixed; inset: 0; z-index: 0` canvas element drawn via 2D API
- Completely camera-independent, never distorts
- Pure CSS/DOM, no Three.js coupling
- Harder to control opacity relative to WebGL content without compositing tricks
- Best if the graticule should never interact with the 3D layer at all

**Option C: Main scene (do NOT use without adaptation)**
- v3-starmap approach — camera at z=980 front-facing, grid at z=-800 fills view
- Phase-1c top-down camera at (80, 880, 280) would require rotating/repositioning the plane to face camera
- Contorts the scene; harder to control opacity relative to stars
- Not recommended unless the design intent is for the graticule to rotate with the scene

**When to use each:**
- Option A: when the graticule should feel like part of the deep-space background
- Option B: when absolute camera-independence is required (e.g., graticule must be identical at all zoom levels)
- Option C: avoided unless explicitly designed for top-down view

### Pattern 2: crtGridTexture() — Canvas Texture Implementation

**What:** 1024×1024 2D canvas drawn with 24 radial spokes + 5 concentric circles, returned as `THREE.CanvasTexture`
**When to use:** Any time a grid substrate needs to integrate into a WebGL scene with controlled opacity

```typescript
// Source: draft/v3-starmap:src/scene/starmap/textures.ts (adapted)
import * as THREE from 'three'

export function crtGridTexture(): THREE.Texture {
  const S = 1024
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!
  const cx = S / 2, cy = S / 2
  const lineColor = 'rgba(255, 255, 255, 0.05)'
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 1
  // 24 radial spokes at 15° intervals
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * S / 2, cy + Math.sin(angle) * S / 2)
    ctx.stroke()
  }
  // 5 concentric circles
  for (const r of [80, 160, 240, 320, 400]) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  return new THREE.CanvasTexture(canvas)
}

export function createGraticule(): THREE.Mesh {
  const tex = crtGridTexture()
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.08,       // within ATM-01 range 0.06–0.10
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), mat)
  mesh.position.set(0, 0, -300)  // behind starfield stars
  return mesh
}
```

**ATM-01 opacity range:** 0.06–0.10 on the MeshBasicMaterial. Start at 0.08 and adjust visually.

### Pattern 3: JS-Milestone Loader State Machine

**What:** LoaderController class toggling CSS classes at real boot milestones
**When to use:** Any loader that must reflect actual async progress rather than theatrical timing

```typescript
// Source: Derived from main.ts boot sequence + ATM-02 requirement
// File: src/ui/loader.ts

type LoaderStep = 'INIT' | 'DATA' | 'SCENE' | 'ONLINE'

export class LoaderController {
  private el: HTMLElement
  private reducedMotion: boolean

  constructor(el: HTMLElement) {
    this.el = el
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (this.reducedMotion) {
      // ATM-04: skip immediately to final state
      this.advance('ONLINE')
    } else {
      this.advance('INIT')
    }
  }

  advance(step: LoaderStep): void {
    // Remove all step classes, add current
    this.el.dataset.step = step
  }

  done(): void {
    // Called after tick loop starts — triggers fade-out
    this.el.classList.add('done')
  }
}
```

**CSS side (in style.css):**
```css
/* Loader state machine — step-end for sharp cuts */
.loader-status span { opacity: 0; transition: opacity 0s step-end; }

/* INIT state: first span visible */
[data-step="INIT"] .ls1 { opacity: 1; }

/* DATA state: second span */
[data-step="DATA"] .ls2 { opacity: 1; }

/* SCENE state: third span */
[data-step="SCENE"] .ls3 { opacity: 1; }

/* ONLINE state: final span in gold */
[data-step="ONLINE"] .ls-online { opacity: 1; color: var(--gold); }
```

**Integration in main.ts — 4 milestone call sites:**
```typescript
// Milestone 1: module executes (already at top of boot())
const loaderCtrl = new LoaderController(loader)

// Milestone 2: after fetch resolves
const cases = await response.json()
loaderCtrl.advance('DATA')

// Milestone 3: after buildOrbitalScene() returns
await buildOrbitalScene(...)
loaderCtrl.advance('SCENE')

// Milestone 4: after tick loop starts (existing done() call site)
loaderCtrl.advance('ONLINE')
// small delay, then:
loaderCtrl.done()
```

### Pattern 4: Wordmark — CSS Header Replacement

**What:** Replace `<header>` contents with fixed corner wordmark, ≤80px wide
**When to use:** Phase 13 removes hero/stats; this is the first step establishing the wordmark as the sole brand presence

```html
<!-- Replace current header DOM in index.html -->
<header class="wordmark-corner">
  <span class="wm-primary">COSMO5</span>
  <span class="wm-sub">OBSERVATORY</span>
</header>
```

```css
/* In style.css — replace current header styles */
header.wordmark-corner {
  position: fixed;
  top: 20px;
  left: 24px;
  z-index: 10;               /* maintain existing z-index */
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: max-content;
  max-width: 80px;           /* ATM-03 constraint */
  pointer-events: none;
}
.wm-primary {
  font-family: 'DM Mono', monospace;
  font-weight: 400;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--teal);
  line-height: 1;
}
.wm-sub {
  font-family: 'DM Mono', monospace;
  font-weight: 300;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.4);
  line-height: 1;
}
```

**Overlap check:** Home button is at bottom-left (28px from edges). Safe corners: top-left (this wordmark), top-right (available), bottom-right (available). Bottom-left is taken by `#homeBtn`.

### Anti-Patterns to Avoid

- **Theatrical timing on the loader:** Using CSS `animation-duration: 0.8s` (v3-starmap) violates ATM-02. The loader must advance at real async milestones.
- **Direct v3-starmap graticule port to main scene:** v3-starmap camera was front-facing (z=980); phase-1c camera is top-down (80, 880, 280). Direct port distorts the grid. Use starfield scene or CSS overlay instead.
- **Graticule with depthWrite: true:** Grid will occlude stars. Always `depthWrite: false`.
- **Skipping JS reduced-motion check:** The CSS universal gate at style.css:944 covers CSS animations. A JS-driven loader needs its own `window.matchMedia('(prefers-reduced-motion: reduce)').matches` check — the CSS gate does NOT stop JS state transitions.
- **Adding font loads:** DM Mono (300, 400) and Fraunces (all weights) are already loaded. Do not add new `<link rel="preload">` entries — this violates the rejection `loading-fonts-you-dont-use.md` in reverse (loading fonts that duplicate existing loads).
- **Wordmark wider than 80px:** ATM-03 is explicit. Keep font sizes in the 9–12px range with DM Mono.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid texture | Custom SVG-to-WebGL pipeline | `THREE.CanvasTexture` with 2D canvas | Single API call; Three.js handles GPU upload and disposal |
| Reduced-motion detection | Custom event listener | `window.matchMedia('(prefers-reduced-motion: reduce)').matches` | Synchronous, no event needed for initial check |
| CSS timing for loader | Custom JS timer | CSS `step-end` transition timing function | `step-end` produces instant cuts without JS; JS only needs to toggle classes |
| Graticule opacity animation | GSAP timeline | CSS `opacity` property on the material | Static substrate — no animation needed; opacity is a one-time set |

**Key insight:** Phase 9 is almost entirely additive. The stack is already installed. The main work is: one new Three.js mesh, one new LoaderController class, one HTML update, and CSS rule additions. Nothing needs custom infrastructure.

## Common Pitfalls

### Pitfall 1: Graticule Camera Mismatch
**What goes wrong:** Porting v3-starmap's CRT plane position (z=-800) into the main scene produces a distorted or invisible graticule because phase-1c has a top-down camera.
**Why it happens:** v3-starmap's main scene camera was at z=980, looking straight at the XY plane. Phase-1c's main camera is at (80, 880, 280) looking down-and-forward.
**How to avoid:** Place graticule in starfield scene (Option A) or use CSS overlay (Option B). Never place in main scene without explicitly designing for the top-down perspective.
**Warning signs:** Graticule appears as a thin ellipse or disappears — the camera is not facing the plane normally.

### Pitfall 2: Loader Advancing Before Promises Resolve
**What goes wrong:** Calling `loaderCtrl.advance('SCENE')` before `buildOrbitalScene()` fully resolves makes the loader lie about boot progress.
**Why it happens:** `buildOrbitalScene` is async; awaiting it in the wrong place (e.g., before await resolves) triggers the step early.
**How to avoid:** Every `advance()` call must come immediately after the `await` that completes that milestone.
**Warning signs:** Loader shows SCENE before stars appear; or ONLINE before the field is interactive.

### Pitfall 3: Reduced-Motion Skip Misses JS Path
**What goes wrong:** The CSS gate at style.css:944 (`* { animation: none !important }`) suppresses CSS animations but the LoaderController still runs through all 4 JS state transitions with delays.
**Why it happens:** JS-driven state changes are not CSS animations — they're not covered by the universal gate.
**How to avoid:** Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in `LoaderController` constructor; if true, call `advance('ONLINE')` immediately without awaiting milestones.
**Warning signs:** On reduced-motion, the loader visually skips animation but still waits for all boot milestones before dismissing.

### Pitfall 4: Wordmark Conflict with Existing Header JS
**What goes wrong:** Any JS that queries `.brand`, `.c5-logo`, `.c5-word`, `.sub` breaks silently after the header DOM is replaced.
**Why it happens:** The current header has specific class names that could be referenced in scripts.
**How to avoid:** Grep for `.brand`, `.c5-logo`, `.c5-word`, `.sub` in `src/` before replacing. The search-close button and home button use `#homeBtn`, not header classes — those are safe.
**Warning signs:** Console errors referencing null after header change; or search input losing its reset behavior.

### Pitfall 5: CanvasTexture Memory Leak
**What goes wrong:** The canvas element used for `crtGridTexture()` is held in memory by the texture; if the scene is destroyed and recreated (e.g., HMR during dev), textures accumulate.
**Why it happens:** Three.js textures hold a reference to the source canvas.
**How to avoid:** Call `texture.dispose()` in any scene teardown path. Since the starfield scene is persistent across the session, this is low risk for production but important for dev-mode HMR.
**Warning signs:** GPU memory increasing over multiple HMR cycles during development.

## Code Examples

Verified patterns from official sources and existing codebase:

### Existing Reduced-Motion Gates in Phase-1c
```typescript
// Source: src/main.ts:22
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!reduceMotion) gsap.globalTimeline.timeScale(1)
else gsap.globalTimeline.timeScale(0)
```
Note: `timeScale(0)` stops GSAP animations only. Does NOT affect CSS transitions or JS state changes.

### Existing CSS Universal Gate
```css
/* Source: src/style.css:944-951 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### step-end Timing Function
```css
/* Source: CSS spec — discrete stepping, no intermediate values */
/* Used for loader text state transitions: instant cut, no crossfade */
.loader-status span {
  transition: opacity 0s step-end;
}
/* When opacity changes from 0 → 1, the change happens at the END of the 0s duration */
/* Effectively: immediate, with semantic intent of "discrete, not continuous" */
```

### Current Loader Dismissal in main.ts (existing code)
```typescript
// Source: src/main.ts (end of try block, ~line 540)
if (loader) loader.classList.add('done')
// This is where loaderCtrl.advance('ONLINE') + loaderCtrl.done() will integrate
```

### MeshBasicMaterial with depthWrite: false
```typescript
// Source: Three.js docs + v3-starmap:src/scene/starmap/index.ts
const mat = new THREE.MeshBasicMaterial({
  map: tex,
  transparent: true,
  opacity: 0.08,
  depthWrite: false,   // critical: prevents graticule from occluding stars
})
```

### z-index Stack Reference
```
starfield canvas:    z-index: 0    (bottom)
nebula:              z-index: 1
gatherStage:         z-index: 2
#app-shell:          z-index: 3    (main Three.js canvas)
star-labels:         z-index: 4
#hero, #stats:       z-index: 5    (Phase 13 will remove these)
focus-hint:          z-index: 6
header (wordmark):   z-index: 10   (top-left corner, unchanged)
loader:              z-index: 100  (full-screen, above all)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS-only theatrical loader timing | JS-milestone-driven loader | ATM-02 requirement | Loader now reflects actual boot state, not fake progress |
| Full marketing header | Corner wordmark only | Phase 9 (ATM-03) | Brand presence without layout competition |
| No atmosphere at first paint | Graticule + calibrating loader | Phase 9 | Observatory register established before interaction |

**Deprecated/outdated:**
- v3-starmap CSS `.ls1/.ls2` opacity animation approach: replaced by JS milestone class-toggling. The visual language (text, step-end) is kept; the timing mechanism is not.
- v3-starmap fixed `animation-duration: 0.8s`: do not port. ATM-02 is explicit that timing must be honest.

## Open Questions

1. **Graticule in starfield scene vs CSS overlay**
   - What we know: Both options are camera-independent and technically sound
   - What's unclear: Whether the design intent requires the graticule to feel "part of the 3D space" (→ starfield scene) or "overlaid on everything" (→ CSS). This is a taste decision.
   - Recommendation: Planner should default to Option A (starfield scene) but flag as a visual test decision. If the effect looks too similar to the stars, switch to Option B.

2. **Exact loader readout strings**
   - What we know: v3-starmap used `CALIBRATING_OPTICS...`, `ALIGNING_CATALOG...`, `OBSERVATORY_ONLINE.`
   - What's unclear: Whether phase-1c should use identical strings, adapted strings, or something new
   - Recommendation: Use v3-starmap strings as the default in the plan; mark as a Mo-approval decision during implementation

3. **Wordmark text: COSMO5/OBSERVATORY vs COSMO5/Case Study Cosmos**
   - What we know: Current header says "Case Study Cosmos". ATM-03 says "COSMO5/OBSERVATORY" per the milestone spec.
   - What's unclear: Whether "OBSERVATORY" is confirmed final copy
   - Recommendation: Use COSMO5 / OBSERVATORY in DM Mono per MILESTONE-v3.2.md; Mo approves at visual test

4. **How long to hold ONLINE before dismissing**
   - What we know: The current loader fades on `done` class (opacity 1s ease). A short hold (300–500ms) reads as confirmation of completion.
   - What's unclear: Exact hold duration
   - Recommendation: 400ms `setTimeout` before calling `done()` — enough to read ONLINE, not enough to feel slow. Adjustable in implementation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2 |
| Config file | `vite.config.ts` (vitest config embedded) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ATM-01 | `crtGridTexture()` returns a CanvasTexture with correct dimensions | unit | `npx vitest run src/scene/background/graticule.test.ts` | ❌ Wave 0 |
| ATM-01 | `createGraticule()` returns a Mesh with transparent material and depthWrite: false | unit | `npx vitest run src/scene/background/graticule.test.ts` | ❌ Wave 0 |
| ATM-02 | `LoaderController` advances through INIT→DATA→SCENE→ONLINE states | unit | `npx vitest run src/ui/loader.test.ts` | ❌ Wave 0 |
| ATM-02 | `LoaderController` calls `done()` only after ONLINE state reached | unit | `npx vitest run src/ui/loader.test.ts` | ❌ Wave 0 |
| ATM-04 | `LoaderController` skips to ONLINE immediately when reduced-motion matches | unit | `npx vitest run src/ui/loader.test.ts` | ❌ Wave 0 |
| ATM-03 | Header DOM contains wordmark-corner class and no legacy brand classes | smoke (manual) | Visual inspection | manual-only |
| ATM-03 | Wordmark width ≤80px at all breakpoints | smoke (manual) | Visual inspection in browser | manual-only |

**Note on ATM-03 (wordmark):** Width and overlap checks are visual-only. No automated test can reliably check CSS computed width at breakpoints without a full browser environment. Mark as manual verification.

**Note on ATM-02 timing (real progress):** The JS milestone integration in main.ts (LoaderController advance calls at fetch/scene/tick points) is integration-level. Unit tests cover LoaderController state machine. The real-progress guarantee is verified manually by observing the loader text change timing against DevTools network throttling.

### Sampling Rate
- **Per task commit:** `npx vitest run src/scene/background/graticule.test.ts src/ui/loader.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green (195 + new tests) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/scene/background/graticule.test.ts` — covers ATM-01 (crtGridTexture shape, createGraticule material properties)
- [ ] `src/ui/loader.test.ts` — covers ATM-02 and ATM-04 (LoaderController state transitions, reduced-motion skip)
- [ ] Both files need `// @vitest-environment jsdom` pragma (canvas and matchMedia APIs required)
- [ ] `matchMedia` mock needed in test setup: `vi.stubGlobal('matchMedia', ...)` for reduced-motion test variant

**Existing infrastructure covers:** All 195 existing tests remain unaffected. No changes to `vite.config.ts` needed. jsdom environment available via pragma (used in other tests).

## Sources

### Primary (HIGH confidence)
- `draft/v3-starmap:src/scene/starmap/textures.ts` — crtGridTexture() implementation, verified via `git show`
- `draft/v3-starmap:src/scene/starmap/index.ts` — CRT plane geometry and material params, verified via `git show`
- `draft/v3-starmap:src/style.css` — loader CSS with step-end timing, verified via `git show`
- `draft/v3-starmap:index.html` — loader DOM structure, verified via `git show`
- `src/main.ts` — boot sequence milestones, existing loader dismissal pattern, reducedMotion gate
- `src/scene/background/starfield.ts` — starfield scene camera position, scene structure
- `src/scene/renderer.ts` — main scene camera position (80, 880, 280)
- `src/style.css` — z-index stack, CSS tokens, universal reduced-motion gate, existing loader styles
- `index.html` — font loads, loader DOM, header DOM, home button position
- `.planning/REQUIREMENTS.md` — ATM-01 through ATM-04 requirements verbatim
- `.planning/MILESTONE-v3.2.md` — design principles, aesthetic register, Phase 1 spec

### Secondary (MEDIUM confidence)
- Three.js 0.170 docs (Context7): `CanvasTexture`, `MeshBasicMaterial.depthWrite`, `PlaneGeometry` — confirmed API shapes match v3-starmap usage
- CSS `step-end` spec: confirmed discrete stepping behavior (value changes at end of duration period)

### Tertiary (LOW confidence)
- 400ms hold-before-done recommendation: derived from UX convention, not validated against Mo's taste preferences

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions confirmed from package.json
- Architecture: HIGH — three graticule options fully documented with camera math; loader pattern derived from existing main.ts; option tradeoffs clear
- Pitfalls: HIGH — camera mismatch and reduced-motion gap are verified architectural facts, not speculation
- Test map: HIGH — framework confirmed, Wave 0 gaps identified from absence of test files

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable stack, no fast-moving dependencies)
