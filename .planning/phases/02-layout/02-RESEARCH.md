# Phase 2: Layout — Research

**Researched:** 2026-04-13
**Domain:** CSS layout, ResizeObserver, Three.js renderer resize, TypeScript module patterns
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAY-01 | Split canvas layout — constellation zone (top ~72%) + staging track zone (bottom ~28%) | Single canvas fills scene container; zones are visual constructs within world space, not separate DOM elements; CSS divider overlay at ~72% from top |
| LAY-02 | Divider line between zones — visible, teal gradient, floor of constellation and ceiling of track | CSS absolute-positioned element inside `#scene-container`; teal gradient via `linear-gradient`; no Three.js Line object needed |
| LAY-03 | LayoutController manages CSS class mutations for zone visibility and transitions | New `src/layout/layout-controller.ts`; extends existing `body.constellation` pattern; exposes `setPanelOpen(bool)` and `setViewMode(mode)` |
| LAY-04 | ResizeObserver on scene container drives renderer resize (not `window.resize`) | `createRenderer` accepts container element; observer callback replaces `window.resize` handler; fires on window resize AND panel open/close automatically |
| LAY-05 | Scene compression when reading panel is open — constellation + track compress leftward | `#reading-panel-slot` transitions from `width: 0` to `width: 340px` via CSS class toggle; ResizeObserver fires → renderer and camera update |
</phase_requirements>

---

## Summary

Phase 2 establishes the layout that all subsequent phases depend on. The core architectural insight — confirmed in SUMMARY.md — is that this is **a single canvas covering the full scene container**, not two canvases or a CSS grid with rows for each zone. The 72/28 split is a visual construct: a CSS overlay divider line positioned at `top: 72%` inside the container. The Three.js scene renders through the full container height; the constellation and staging track are world-space Y ranges, not separate render targets.

The reading panel compression (LAY-05) works by a flex row model: `#app-shell` is a `flex-row`, `#scene-container` gets `flex: 1` (shrinks when `#reading-panel-slot` expands), and a `ResizeObserver` on `#scene-container` fires whenever the container changes size — whether from window resize or panel slot expansion. This single observer replaces the existing `window.resize` handler in `renderer.ts` and handles both LAY-04 and LAY-05 in one mechanism.

Three load-bearing changes to existing code: (1) `renderer.ts` must swap `window.resize` + `innerWidth/innerHeight` for a `ResizeObserver` on the container element, accepting the container in its signature, using `renderer.setSize(w, h, false)` so Three.js does not override the CSS sizing; (2) mouse coordinate computation in `main.ts` (lines 159, 179) must switch from `innerWidth/innerHeight` to `canvas.getBoundingClientRect()`; (3) `projectToScreen` in `src/ui/tooltip.ts` (lines 45-46) uses `innerWidth/innerHeight` for label positioning — same class of bug as (2), same fix required. All three sites must be updated together or label and raycasting coordinates will be inconsistent when the panel compresses the scene.

**Primary recommendation:** Four deliverables — `src/layout/layout-controller.ts`, HTML/CSS changes for `#app-shell` / `#scene-container` / `#reading-panel-slot` / `#divider-line`, updated `renderer.ts` with ResizeObserver, and patched mouse coordinate code in `main.ts`.

---

## Standard Stack

No new dependencies. Everything is vanilla TypeScript + native browser APIs.

### Core
| Module | Location | Purpose |
|--------|----------|---------|
| `LayoutController` | `src/layout/layout-controller.ts` | CSS class mutations for layout state transitions |
| `ResizeObserver` | Browser native (MDN baseline, all modern browsers) | Observe container element size changes |
| `#scene-container` | `index.html` | New wrapper element around `#main-canvas`; observer target |
| `#reading-panel-slot` | `index.html` | Slot for future reading panel; width: 0 → 340px |
| `#divider-line` | `index.html` | CSS overlay element; teal gradient; positioned inside `#scene-container` |

### What is NOT needed
- Two separate canvases for constellation vs. track zones
- A Three.js Line object for the divider
- A CSS grid with named rows for each zone
- A separate `window.resize` handler alongside ResizeObserver

---

## Architecture Patterns

### Recommended DOM Structure

```html
<!-- index.html: replace bare #main-canvas with this shell -->
<div id="app-shell">
  <div id="scene-container">
    <canvas id="main-canvas"></canvas>
    <div id="divider-line"></div>
    <!-- #star-labels stays inside scene-container so it clips correctly -->
    <div id="star-labels" ...></div>
  </div>
  <div id="reading-panel-slot">
    <!-- Phase 5 mounts reading panel here -->
  </div>
</div>
```

### Recommended CSS Layout

```css
/* Source: advisor synthesis from requirements + existing style.css patterns */

#app-shell {
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

#scene-container {
  position: relative;   /* for absolute children: divider-line, star-labels */
  flex: 1;
  min-width: 0;         /* prevent flex overflow on shrink */
  overflow: hidden;
}

#main-canvas {
  /* Remove position:fixed;inset:0 — canvas now fills its container */
  display: block;
  width: 100%;
  height: 100%;
}

#divider-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 72%;             /* floor of constellation zone */
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0%,
    var(--teal) 20%,
    var(--teal) 80%,
    transparent 100%
  );
  opacity: 0.35;
  pointer-events: none;
  /* Only visible in constellation mode */
  display: none;
}
body.constellation #divider-line {
  display: block;
}

#star-labels {
  /* Change from position:fixed to position:absolute */
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

#reading-panel-slot {
  width: 0;
  overflow: hidden;
  transition: width 400ms var(--ease);
  flex-shrink: 0;
}
#reading-panel-slot.open {
  width: 340px;
}
```

### Pattern 1: ResizeObserver Replaces window.resize

**What:** `createRenderer` accepts a container `HTMLElement`, creates a `ResizeObserver` on it, and fires the resize callback whenever the container changes size — whether from window resize or panel slot changes.

**Why:** A single observer handles both LAY-04 and LAY-05 without additional event wiring. When `#reading-panel-slot` expands (LAY-05), `#scene-container` shrinks (flex), the ResizeObserver fires, and renderer + camera update automatically.

```typescript
// Source: MDN ResizeObserver + Three.js renderer resize pattern
// Location: src/scene/renderer.ts (replaces existing onResize + addEventListener)

export function createRenderer(
  canvas: HTMLCanvasElement,
  container: HTMLElement   // NEW: was only canvas before
): RendererContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 3000);
  camera.position.set(80, 880, 280);

  // ...controls setup unchanged...

  const onContainerResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };

  const resizeObserver = new ResizeObserver(onContainerResize);
  resizeObserver.observe(container);
  onContainerResize(); // initialize on first call

  return {
    scene, camera, renderer, controls,
    dispose: () => {
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    },
  };
}
```

### Pattern 2: LayoutController

**What:** A thin module that centralizes all CSS class mutations for layout state, extending the existing `body.constellation` pattern already in `main.ts` (lines 235, 263).

**When to use:** Any time layout-affecting state changes — panel open/close, view mode transitions.

**What LayoutController does NOT own:** The ResizeObserver (that lives in `renderer.ts`). LayoutController toggles classes; the observer reacts to the resulting size changes.

```typescript
// Source: advisor synthesis + existing body.constellation pattern in main.ts
// Location: src/layout/layout-controller.ts

export interface LayoutController {
  setPanelOpen(open: boolean): void;
  setViewMode(mode: 'global' | 'constellation' | 'reading'): void;
  dispose(): void;
}

export function createLayoutController(): LayoutController {
  const panelSlot = document.getElementById('reading-panel-slot') as HTMLElement;

  return {
    setPanelOpen(open: boolean) {
      panelSlot.classList.toggle('open', open);
      document.body.classList.toggle('panel-open', open);
    },
    setViewMode(mode) {
      document.body.classList.toggle('constellation', mode !== 'global');
      document.body.classList.toggle('reading', mode === 'reading');
    },
    dispose() { /* no cleanup needed */ },
  };
}
```

### Pattern 3: Mouse Coordinate Fix (Load-Bearing)

**What:** Mouse normalization for raycasting must use `canvas.getBoundingClientRect()` instead of `innerWidth/innerHeight` once the canvas is no longer full-viewport.

**When it breaks:** Silently, with no error. Raycasting returns wrong objects or misses entirely. This happens as soon as `#scene-container` is narrower than `window.innerWidth` (i.e., whenever the reading panel is open).

```typescript
// Source: Three.js raycasting docs — correct approach for non-full-viewport canvas
// Location: src/main.ts lines 159, 179 (pointermove and pointerup handlers)

// BEFORE (broken when panel is open):
mouse.set(
  (e.clientX / innerWidth) * 2 - 1,
  -(e.clientY / innerHeight) * 2 + 1
);

// AFTER (correct regardless of canvas size):
const rect = mainCanvas.getBoundingClientRect();
mouse.set(
  ((e.clientX - rect.left) / rect.width) * 2 - 1,
  -((e.clientY - rect.top) / rect.height) * 2 + 1
);
```

### Pattern 4: Initial Size Pass

On boot, `onContainerResize()` must be called once to set initial renderer dimensions. Without this, Three.js renders at its default 300×150px until a resize event fires.

```typescript
// Call once after creating the observer:
onContainerResize();
```

### Pattern 5: Panel Slot Test Harness (Phase 2 only)

The reading panel (Phase 5) doesn't exist yet. To verify LAY-05 compression during Phase 2, wire a temporary keyboard shortcut:

```typescript
// Temporary — remove when Phase 5 ships the real panel
document.addEventListener('keydown', (e) => {
  if (e.key === 'P' && e.shiftKey) {
    layoutController.setPanelOpen(
      !document.getElementById('reading-panel-slot')?.classList.contains('open')
    );
  }
});
```

This lets QA verify the Three.js canvas resizes correctly when the slot expands, without building the full reading panel.

### Anti-Patterns to Avoid

- **Two canvases for zones:** Using `#constellation-canvas` (it's `display:none` in v3) as a second render target for the staging track. The track is rendered within the single Three.js scene; the canvas covers the full container.
- **Three.js Line for divider:** Using a `THREE.Line` at Y=0 in world space. The divider is a screen-space concept; use CSS absolute positioning. A 3D line would need to be recalculated on every camera change.
- **`position: fixed` on children of `#scene-container`:** Fixed positioning escapes the container's bounds; children will render at viewport coordinates even when the container is narrower. Use `position: absolute` inside `#scene-container`.
- **Leaving `window.resize` handler alongside ResizeObserver:** Creates double-resize behavior and possible frame stutters. Remove the `addEventListener('resize', onResize)` line in `renderer.ts` entirely.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Container size change detection | Manual window.resize + polling container dimensions | `ResizeObserver` (native) | ResizeObserver fires on element size changes from any cause (window resize, flexbox reflow, class toggle). Manual polling has latency and wastes CPU. |
| CSS transitions for panel slide | GSAP tween on `#reading-panel-slot` width | CSS `transition: width` on the element | The reading panel slide (T3/T4) is a CSS transition, not a GSAP animation. GSAP is for Three.js mesh animations. Keep the separation clean. |
| Divider position math | Computing Y screen coordinate from Three.js camera projection | CSS `top: 72%` on `#divider-line` | Camera projection math recalculates every frame and drifts when camera moves. In constellation mode, the 72% split is fixed in screen space — use CSS. |

**Key insight:** The split canvas is a CSS layout concern with a CSS divider. Three.js renders the full scene; the "split" is imposed visually by screen-space overlays and world-space Y conventions, not by separate render passes.

---

## Common Pitfalls

### Pitfall 1: Three `innerWidth/innerHeight` Sites All Break When Canvas Leaves Full-Viewport

**What goes wrong:** Stars can't be clicked (or register on the wrong star), AND nucleus labels appear at wrong positions — sometimes over the reading panel. No console errors in either case.
**Why it happens:** Three places use `innerWidth/innerHeight` assuming the canvas covers the viewport:
  - `main.ts` line 159 (`pointermove` raycasting mouse normalization)
  - `main.ts` line 179 (`pointerup` raycasting mouse normalization)
  - `src/ui/tooltip.ts` lines 45-46 (`projectToScreen` — normalizes 3D→2D for label positioning)

All three produce coordinates outside their expected range as soon as `#scene-container` is narrower than `window.innerWidth`.
**How to avoid:** Patch all three sites together. For raycasting: `canvas.getBoundingClientRect()`. For `projectToScreen`: accept a `containerWidth`/`containerHeight` argument (or a rect) instead of reading `innerWidth/innerHeight`.
**Warning signs:** Hover tooltip on wrong star; nucleus labels drifting into the reading panel area; no click response in constellation mode.

### Pitfall 2: Canvas Renders at 300×150 on First Load

**What goes wrong:** Scene appears in a tiny box bottom-left on first paint, then snaps to full size on first interaction.
**Why it happens:** ResizeObserver fires asynchronously after the element is observed. Without an explicit initial call, the first render uses Three.js defaults.
**How to avoid:** Call `onContainerResize()` synchronously after the observer is created.
**Warning signs:** Flash of tiny canvas on hard reload.

### Pitfall 3: `position: fixed` Children Escape the Container

**What goes wrong:** `#star-labels` labels appear at viewport coordinates, not scene-container-relative coordinates. Especially visible when the reading panel is open — labels appear over the panel instead of the scene.
**Why it happens:** CSS `position: fixed` is relative to the viewport (or nearest containing block with a transform), not the parent element. Children with `fixed` positioning bypass the container's bounds.
**How to avoid:** Change `#star-labels` from `position: fixed` to `position: absolute` inside `#scene-container`. Verify existing label offset math in `main.ts` tick loop still works correctly.
**Warning signs:** Labels appear over reading panel instead of canvas.

### Pitfall 4: Three.js `setSize` Overwrites Canvas CSS Dimensions

**What goes wrong:** `#main-canvas` has `style.width: 1280px; style.height: 720px` (or whatever the initial viewport was), which overrides the CSS `width: 100%; height: 100%`. After the flex layout shrinks `#scene-container`, the canvas stays at its original size and overflows.
**Why it happens:** `renderer.setSize(w, h)` by default writes `style.width` and `style.height` to the canvas DOM element. These inline styles beat the stylesheet.
**How to avoid:** Always call `renderer.setSize(w, h, false)` — the third argument `false` prevents Three.js from touching the canvas's CSS. The CSS rule `#main-canvas { width: 100%; height: 100%; }` then controls visual sizing. The internal buffer dimensions (pixel-perfect rendering) are still set correctly by the `w, h` arguments.
**Warning signs:** Canvas visible size doesn't change when reading panel opens; overflow scroll appears inside `#scene-container`.

### Pitfall 5: Inline `style=` Attributes in `index.html` Override All CSS Rules

**What goes wrong:** CSS changes in `src/style.css` have no effect on `#main-canvas` or `#star-labels`. The elements stay `position: fixed; inset: 0` no matter what stylesheet rule is written.
**Why it happens:** `index.html` line 19 has `<canvas id="main-canvas" style="position:fixed;inset:0;z-index:3">` and line 26 has `<div id="star-labels" style="position:fixed;inset:0;z-index:4;pointer-events:none">`. Inline `style=` attributes have higher specificity than any stylesheet rule — they cannot be overridden by a CSS class or ID selector.
**How to avoid:** Remove the inline `style=` attributes from both elements in `index.html` as part of Phase 2's HTML restructuring task. Move their values (z-index, pointer-events) to `src/style.css` rules. Position changes (`fixed` → `absolute`) then apply correctly.
**Warning signs:** `#main-canvas` doesn't fill `#scene-container`; DevTools shows `position: fixed` even after adding CSS `position: absolute` rule.

### Pitfall 6: Wrong Stylesheet (styles.css vs. src/style.css)

**What goes wrong:** Changes to `styles.css` (root-level) have no effect; changes appear in the wrong file.
**Why it happens:** Two stylesheets exist. `styles.css` at root is the legacy stylesheet (has purple tokens, different ease curve, not imported by the v3 module entry). `src/style.css` is the active stylesheet imported in `src/main.ts` line 3.
**How to avoid:** All Phase 2 CSS changes go in `src/style.css`. Do not create new rules in `styles.css`.

---

## Code Examples

Verified patterns from official/canonical sources:

### ResizeObserver — Correct Usage (MDN pattern)
```typescript
// Source: MDN Web Docs — ResizeObserver API
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    // use width, height
  }
});
observer.observe(element);
// Later: observer.disconnect();
```

### Three.js Renderer Resize (official Three.js docs pattern)
```typescript
// Source: Three.js docs — Renderer.setSize
// setSize(width, height, updateStyle?)
// updateStyle = false → skip setting canvas style; rely on CSS sizing
renderer.setSize(container.clientWidth, container.clientHeight, false);
camera.aspect = container.clientWidth / container.clientHeight;
camera.updateProjectionMatrix();
```

### CSS Flex Row with Slot Expansion
```css
/* Source: MDN Flexbox spec — flex: 1 shrinks when sibling expands */
#app-shell { display: flex; flex-direction: row; height: 100vh; }
#scene-container { flex: 1; min-width: 0; } /* min-width: 0 critical for shrink */
#reading-panel-slot { width: 0; transition: width 400ms var(--ease); flex-shrink: 0; }
#reading-panel-slot.open { width: 340px; }
```

### Raycasting with BoundingClientRect (Three.js docs pattern)
```typescript
// Source: Three.js docs — Raycaster.setFromCamera
const rect = canvas.getBoundingClientRect();
mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
raycaster.setFromCamera(mouse, camera);
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `window.resize` event listener | `ResizeObserver` on container element | ResizeObserver is baseline in all modern browsers. Fires for any cause of element resize, not just window changes. |
| `innerWidth/innerHeight` for canvas sizing | `container.clientWidth/clientHeight` | `innerWidth` is the viewport; once canvas is in a flex child, it's the container dimensions that matter. |
| `position: fixed` for overlay elements | `position: absolute` inside `#scene-container` | Fixed breaks containment when the parent is a flex child smaller than the viewport. |

---

## Open Questions

1. **Divider line percentage: exactly 72% or configurable?**
   - What we know: Design spec says "top ~72%" — the tilde suggests it's an approximation
   - What's unclear: Whether Phase 4 (staging track stars) will need the divider at a precise screen-space position for T2 arc math, or whether CSS 72% is sufficient
   - Recommendation: Use `--divider-y: 72%` CSS custom property now. If Phase 4 needs the pixel value for arc calculations, read it via `dividerEl.getBoundingClientRect().top` at animation time rather than hardcoding.

2. **Does `#app-shell` replace `body` as the flex container, or does `body` become `display: flex`?**
   - What we know: Current `body` has `overflow: hidden; height: 100%` and multiple direct children with `position: fixed`
   - What's unclear: Whether making `body` itself `display: flex` breaks existing fixed-position children (`#nebula`, `#starfield`, `#loader`, etc.) which use `position: fixed; inset: 0`
   - Recommendation: Introduce `#app-shell` as a new element inside body, rather than converting body to flex. Fixed-position elements like `#nebula`, `#starfield`, and `#loader` remain direct body children and are unaffected.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (co-located with Vite config) |
| Config file | `vite.config.ts` (existing) |
| Quick run command | `npm test -- --run src/layout` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAY-01 | `#scene-container` fills available width; `#main-canvas` fills container | visual / smoke | manual — open browser, inspect computed style | ❌ Wave 0 |
| LAY-02 | `#divider-line` visible in `body.constellation`, hidden otherwise | unit | `npm test -- --run src/layout/layout-controller.test.ts` | ❌ Wave 0 |
| LAY-03 | `setPanelOpen(true)` adds `.open` to `#reading-panel-slot` and `panel-open` to `body` | unit | `npm test -- --run src/layout/layout-controller.test.ts` | ❌ Wave 0 |
| LAY-03 | `setViewMode('constellation')` adds `body.constellation` | unit | `npm test -- --run src/layout/layout-controller.test.ts` | ❌ Wave 0 |
| LAY-04 | ResizeObserver callback updates `renderer.setSize` and `camera.aspect` | unit (mock ResizeObserver) | `npm test -- --run src/scene/renderer.test.ts` | ❌ Wave 0 |
| LAY-05 | `.open` toggle on panel slot → ResizeObserver fires → renderer and camera updated | integration (jsdom) | `npm test -- --run src/layout/layout-compression.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green (89 existing + new phase tests) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/layout/layout-controller.test.ts` — covers LAY-02, LAY-03
- [ ] `src/scene/renderer.test.ts` — covers LAY-04 (mock ResizeObserver, mock canvas)
- [ ] `src/layout/layout-compression.test.ts` — covers LAY-05 (integration: class toggle → observer fires → renderer update)

Note: LAY-01 visual verification (correct proportions in browser) is not automatable with vitest. Verify manually by opening dev server and inspecting computed styles.

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — ResizeObserver API (baseline browser support confirmed)
- MDN Web Docs — CSS Flexbox (flex: 1, min-width: 0 shrink behavior)
- `src/scene/renderer.ts` (lines 43-48) — existing resize handler to replace
- `src/main.ts` (lines 159, 179) — existing mouse coord code to patch
- `src/style.css` (lines 62-68) — existing canvas + star-labels positioning to migrate
- `.planning/research/SUMMARY.md` — "Single camera, single render pass; zones are world-space Y ranges, not viewport splits"

### Secondary (MEDIUM confidence)
- Three.js docs — `renderer.setSize(w, h, updateStyle)` third-argument behavior
- `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md` — Section 2 (Split Canvas layout diagrams)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all browser-native and existing library APIs
- Architecture: HIGH — flex row + ResizeObserver pattern is well-established; specific file locations confirmed from reading actual source files
- Pitfalls: HIGH — raycasting coordinate bug is confirmed by reading main.ts lines 159/179; stylesheet confusion confirmed from STRUCTURE.md noting two CSS files

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (stable APIs; no fast-moving dependencies)
