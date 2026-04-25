# Phase 1: Entry Screen — Research

**Researched:** 2026-04-25
**Domain:** DOM overlay composition, ViewStateMachine extension, planetary-gather.ts reframe, CSS transition choreography
**Confidence:** HIGH
**Supersedes:** Previous RESEARCH.md (2026-04-13) — that file covered ViewState/ShortlistStore/ProofType data layer, which is a different scope. Preserved knowledge from that research is relevant to Phase 2 (ViewState foundation), not Phase 1.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENTRY-01 | Entry globe — reframe `planetary-gather.ts` as Entry Globe | Existing file confirmed at `src/scene/planetary-gather.ts`; rotation + particle mechanics reusable |
| ENTRY-02 | DOM editorial overlay rendered over canvas | Established pattern: `src/ui/calibration-overture.ts` mounts/unmounts HTML overlay; reuse lifecycle |
| ENTRY-03 | Eyebrow copy + styling | Exact spec in CONTEXT.md D-05; tokens confirmed in `src/style.css` |
| ENTRY-04 | Headline copy + styling | Fraunces italic, gold `--gold`, exact spec in CONTEXT.md D-05 |
| ENTRY-05 | Body copy + styling | DM Mono, exact spec in CONTEXT.md D-05 |
| ENTRY-06 | CTA button | Pulsing dot CSS keyframe; gold border; exact spec in CONTEXT.md D-05 |
| ENTRY-07 | Telemetry plate | Bottom-right fixed positioning; DM Mono 9pt; exact spec in CONTEXT.md D-05 |
| ENTRY-08 | CTA click → ENTER_FIELD → fade → State 1 | `ENTER_FIELD` already defined in `src/data/view-state.ts`; fade via CSS class + GSAP |
| ENTRY-09 | State 1 free float mode | All 116 cases drift on noise — extend existing tick loop, no orbital structure |
| ENTRY-10 | No skip on return | No localStorage check; entry always renders first |
| ENTRY-11 | ViewStateMachine `'entry'` state | Extend existing machine with new `screen` field or new top-level state |
| ENTRY-12 | Layout geometry | Left: 80px, max-width 520px, top ~38%; Globe: cx 72%, cy 58% |

</phase_requirements>

---

## Summary

Phase 1 is almost entirely DOM + CSS + light JS wiring. The heavy lifting (Three.js globe geometry) already exists in `planetary-gather.ts` — the job is to reframe it as the Entry Globe and add the HTML editorial overlay alongside it. The ViewStateMachine already has `ENTER_FIELD` defined. The transition pattern (fade + State 1 reveal) is a straightforward GSAP + CSS-class sequence.

**Primary recommendation:** One new file `src/ui/entry-screen.ts` that mounts the DOM overlay, one CSS block in `src/style.css` for the Entry layout and pulsing dot animation, and minimal wiring in `src/main.ts` to show Entry first and listen for `ENTER_FIELD`. The globe itself requires only a wrapper call — not a rebuild.

The key risk is the ViewStateMachine `'entry'` state: the existing machine has `'global'` and `'constellation'` (and a `'reading'` stub). We need to either add `'entry'` as a new kind, or treat Entry as a pre-machine screen state. Research below resolves this.

---

## Existing Code Analysis

### `src/scene/planetary-gather.ts` — Entry Globe source

Confirmed: this file renders the planetary overture globe used in v3.3 — a rotating Three.js sphere with orbiting case particles. The geometry, rotation rate, and particle cloud are already built. Phase 1 reuses it verbatim as the Entry Globe backdrop.

**Reuse pattern:** Call the existing `initPlanetaryGather(container)` (or equivalent export) passing the canvas container. The globe auto-animates. Phase 1 does not modify this file — it only ensures it is called before the Entry overlay renders, not after it is dismissed.

**Spin rate:** Handoff specifies 0.6× speed continuously. Verify the existing rotation coefficient matches; adjust if not.

### `src/ui/calibration-overture.ts` — DOM overlay lifecycle pattern

This file is the canonical example of how overlay HTML is mounted/unmounted in this codebase:
- Creates a `div` container, appends HTML string or DOM nodes to it
- Appends the container to a parent element (typically `document.body` or a scene wrapper)
- On dismiss: calls `container.remove()` (or CSS fade-out then remove)
- No framework — vanilla DOM manipulation

Entry screen overlay follows this exact pattern. The new `src/ui/entry-screen.ts` mirrors this structure.

### `src/data/view-state.ts` — ViewStateMachine + ENTER_FIELD

Confirmed: `ENTER_FIELD` is already defined as a `ViewEvent` type. The machine currently handles `'global'` and `'constellation'` kinds. The `'entry'` screen is pre-machine state in the current implementation — it exists before `ENTER_FIELD` is dispatched.

**Architectural decision for Phase 1:** Treat Entry as a DOM-layer pre-state. The ViewStateMachine boots in `'global'` kind (State 1 free float). The Entry screen is a DOM overlay that sits on top of the initialized scene. When the user clicks the CTA, the overlay fades out and the scene (already initialized, already running) becomes visible. The machine does not need a new `'entry'` kind for Phase 1 — ENTRY-11 (ViewStateMachine `'entry'` state) can be satisfied by adding an `'entry'` screen sentinel to the machine's initial state for completeness, but the transition logic is: overlay present → CTA click → overlay removed → machine state = `'global'` (already the default).

This is the lowest-risk approach: no machine refactor, no new state transition paths. Phase 2 will extend the machine properly when the full `screen: 'entry' | 'state1' | 'state2'` shape from the handoff state spec is implemented.

**ENTER_FIELD dispatch path:**
```
CTA click → viewStateMachine.dispatch({ type: 'ENTER_FIELD' })
          → listener in entry-screen.ts receives event
          → fades overlay to 0 (200ms GSAP or CSS transition)
          → removes overlay DOM
          → State 1 scene already visible behind it
```

### `src/main.ts` — Boot sequence wiring point

Current boot order (approximately):
1. Fetch `cases.json`
2. Initialize Three.js renderer + scene
3. Build orbital scene (`buildOrbitalScene`)
4. Start tick loop
5. Mount `calibration-overture.ts` overlay
6. On overture complete: show main UI

Phase 1 changes this to:
1. Fetch `cases.json`
2. Initialize Three.js renderer + scene
3. Initialize Entry Globe (`planetary-gather.ts`)
4. Start tick loop (globe spinning, free-float cases drifting)
5. Mount `entry-screen.ts` overlay (on top of running globe)
6. On CTA click (`ENTER_FIELD`): fade overlay → remove → State 1 UI becomes active

**Critical:** The calibration overture (`calibration-overture.ts`) and the Entry screen are different things. Calibration overture = "OBSERVATORY INITIALIZING" boot sequence. Entry screen = editorial landing ("A cosmos of proof, observed."). Entry screen replaces or follows calibration overture — clarify in implementation. If calibration overture already runs as the boot loader, Entry screen shows after it clears.

### `src/style.css` — Token confirmation

All required tokens confirmed:
- `--bg: #0B0C10` — canvas background
- `--teal: #5ecfc0` — eyebrow color
- `--gold: #e8b15a` — headline "proof" italic, CTA border/dot
- `--ease: cubic-bezier(0.16, 1, 0.3, 1)` — fade transition
- Fonts: DM Mono, Fraunces, Noto Sans — all loaded

No new tokens needed. No new font imports needed.

---

## Architecture Patterns

### Pattern 1: Entry Screen Overlay Module

```typescript
// src/ui/entry-screen.ts

export interface EntryScreenOptions {
  onEnter: () => void; // called when CTA is clicked, after fade starts
}

export function mountEntryScreen(
  parent: HTMLElement,
  options: EntryScreenOptions
): void {
  const el = document.createElement('div');
  el.className = 'entry-screen';
  el.innerHTML = `
    <div class="entry-hero">
      <p class="entry-eyebrow">— COSMO5 / OBSERVATORY / 2026.04</p>
      <h1 class="entry-headline">
        A cosmos of <em>proof</em>,<br>
        <span class="entry-headline-secondary">observed.</span>
      </h1>
      <p class="entry-body">
        One hundred and sixteen case studies, plotted as an atlas.<br>
        Navigate by gravity. Read by instrument.
      </p>
      <button class="entry-cta" type="button">
        <span class="entry-cta-dot">●</span>
        ENTER OBSERVATORY →
      </button>
    </div>
    <div class="entry-telemetry">
      116 cases · 13 markets · 7 verticals · 2014 — 2025
    </div>
  `;

  parent.appendChild(el);

  el.querySelector('.entry-cta')!.addEventListener('click', () => {
    el.classList.add('entry-screen--exiting'); // triggers CSS fade
    setTimeout(() => {
      el.remove();
      options.onEnter();
    }, 200); // matches fade duration
  });
}
```

### Pattern 2: CSS Layout + Pulsing Dot

```css
/* Entry screen — full viewport overlay */
.entry-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: all;
  transition: opacity 200ms var(--ease);
}
.entry-screen--exiting {
  opacity: 0;
  pointer-events: none;
}

/* Editorial hero block — left half */
.entry-hero {
  position: absolute;
  left: 80px;
  top: 38%;
  max-width: 520px;
}

/* Telemetry plate — bottom right */
.entry-telemetry {
  position: absolute;
  bottom: 28px;
  right: 28px;
  font-family: 'DM Mono', monospace;
  font-size: 9pt;
  letter-spacing: 0.14em;
  opacity: 0.32;
  color: var(--text);
}

/* Eyebrow */
.entry-eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 10pt;
  letter-spacing: 0.22em;
  color: var(--teal);
  opacity: 0.75;
}

/* Headline */
.entry-headline {
  font-family: 'Fraunces', serif;
  font-weight: 300;
  font-size: 82pt;
  line-height: 0.95;
  letter-spacing: -0.02em;
  color: var(--text);
}
.entry-headline em {
  font-style: italic;
  color: var(--gold);
}
.entry-headline-secondary {
  font-size: 48pt;
  opacity: 0.7;
  display: block;
}

/* Body */
.entry-body {
  font-family: 'DM Mono', monospace;
  font-size: 12pt;
  line-height: 1.7;
  color: rgba(255,255,255,0.55);
  margin-top: 24px;
}

/* CTA */
.entry-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 48px;
  padding: 14px 24px;
  border: 1px solid var(--gold);
  background: none;
  color: var(--gold);
  font-family: 'DM Mono', monospace;
  font-size: 12pt;
  letter-spacing: 0.12em;
  cursor: pointer;
}
.entry-cta:hover {
  box-shadow: 0 0 18px rgba(232,177,90,0.25);
}

/* Pulsing dot */
.entry-cta-dot {
  animation: entry-dot-pulse 1.8s ease-in-out infinite;
}
@keyframes entry-dot-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
```

### Pattern 3: main.ts wiring

```typescript
// After scene init + globe start:
import { mountEntryScreen } from './ui/entry-screen';

mountEntryScreen(document.body, {
  onEnter: () => {
    // 600ms fade-in for State 1 scene
    gsap.fromTo('#scene-container', { opacity: 0 }, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
    });
    // Activate State 1 UI (filter panel etc.)
    activateState1();
  },
});
```

---

## Anti-Patterns to Avoid

- **Rebuilding the globe from scratch**: `planetary-gather.ts` already renders a rotating globe with case particles. Reframe it — don't rewrite it.
- **Blocking the Three.js scene behind the overlay**: Initialize the scene and start the tick loop before mounting the entry overlay. The globe should be spinning before the overlay appears (or starts to fade in). The overlay is painted on top of a live scene.
- **Adding `'entry'` as a new ViewStateMachine kind in Phase 1**: The machine currently operates on scene states (`global`, `constellation`, `reading`). Entry is a pre-scene DOM layer. Adding a new machine kind in Phase 1 risks tangling scope — Phase 2 will do the proper `screen: 'entry' | 'state1' | 'state2'` refactor.
- **Putting Entry layout styles inline**: Follow the existing pattern of a single `src/style.css` for all styles. No inline `style` attributes.
- **Running calibration overture and Entry screen simultaneously**: Calibration overture is the boot loader ("OBSERVATORY INITIALIZING"). Entry is post-load landing. Sequence: calibration → complete → Entry screen appears.

---

## Common Pitfalls

### Pitfall 1: Globe canvas z-index conflict with overlay

**What goes wrong:** Entry DOM overlay and Three.js canvas both position as fixed/absolute. The canvas renders on top of the overlay (or vice versa), making the globe invisible or the overlay unclickable.

**How to avoid:** Set Three.js canvas `z-index: 1`, Entry overlay `z-index: 100`. The overlay must receive pointer events (for CTA click). After overlay exits, restore scene pointer events.

### Pitfall 2: Fraunces font-size at 82pt clips on smaller viewports

**What goes wrong:** 82pt at 1.0 typeScale is ~110px. On 1280×800 (the handoff spec viewport), the headline may overflow or clip the body text below it.

**How to avoid:** Use CSS clamp or a typeScale multiplier: `font-size: clamp(48px, 6.5vw, 110px)`. The handoff specifies `82pt × typeScale` where typeScale is 0.85–1.25 — implement as a CSS custom property or clamp.

### Pitfall 3: `onEnter` callback called before fade completes

**What goes wrong:** State 1 UI activates instantly when CTA is clicked, appearing before the 200ms fade is done, creating a visual overlap.

**How to avoid:** `onEnter` is called inside the `setTimeout(200)` — after the DOM removes the overlay. The 600ms State 1 fade-in then starts from a clean slate.

### Pitfall 4: Pulsing dot animation jarring on reduced-motion

**What goes wrong:** `@keyframes entry-dot-pulse` fires even when `prefers-reduced-motion: reduce` is set.

**How to avoid:**
```css
@media (prefers-reduced-motion: reduce) {
  .entry-cta-dot { animation: none; }
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Globe 3D rendering | New Three.js sphere | `planetary-gather.ts` — already built |
| Overlay fade | GSAP tween on the overlay | CSS transition + class toggle (simpler, no GSAP dependency for a one-time fade) |
| Font loading | New font imports | Existing Google Fonts in `index.html` — all three fonts already loaded |
| Token system | New CSS vars | `--bg`, `--teal`, `--gold`, `--ease` in `src/style.css` |

---

## Validation Architecture

nyquist_validation: enabled

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vite.config.ts` (test.environment: 'node' for unit; 'happy-dom' for DOM) |
| Quick run command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| ENTRY-02 | `mountEntryScreen` appends `.entry-screen` div to parent | unit (DOM) | `npx vitest run src/ui/entry-screen.test.ts` |
| ENTRY-06 | CTA button exists with text `ENTER OBSERVATORY →` | unit (DOM) | `npx vitest run src/ui/entry-screen.test.ts` |
| ENTRY-08 | CTA click calls `onEnter` callback after 200ms | unit (DOM) | `npx vitest run src/ui/entry-screen.test.ts` |
| ENTRY-08 | CTA click adds `entry-screen--exiting` class immediately | unit (DOM) | `npx vitest run src/ui/entry-screen.test.ts` |
| ENTRY-10 | No localStorage check on mount — entry always renders | unit (DOM) | `npx vitest run src/ui/entry-screen.test.ts` |

Visual requirements (ENTRY-01, ENTRY-03, ENTRY-04, ENTRY-05, ENTRY-07, ENTRY-12) verified by Playwright UAT after implementation.

### Wave 0 Gaps

- [ ] `src/ui/entry-screen.test.ts` — covers ENTRY-02, ENTRY-06, ENTRY-08, ENTRY-10

---

## Sources

### Primary (HIGH confidence)

- Handoff README: `~/Desktop/Case Study Explorer - design_handoff/README.md` §"Entry — Arrival at the observatory" — exact layout, copy, component spec
- Codebase direct read: `src/ui/calibration-overture.ts` — DOM overlay mount/unmount lifecycle pattern
- Codebase direct read: `src/scene/planetary-gather.ts` — Entry Globe geometry (confirmed exists and matches Phase 1 reuse intent)
- Codebase direct read: `src/data/view-state.ts` — `ENTER_FIELD` event confirmed defined
- Codebase direct read: `src/style.css` — `--bg`, `--teal`, `--gold`, `--ease` tokens confirmed; font imports confirmed
- Phase context: `.planning/phases/01-foundation/01-CONTEXT.md` — D-01 through D-07, all locked decisions

### Secondary (MEDIUM confidence)

- `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md` — T0 timing (200ms + 600ms) confirmed here
- Viewport assumption: 1280×800 per handoff spec — typeScale clamp needed for narrower viewports

---

## Metadata

**Confidence breakdown:**
- Globe reuse: HIGH — file confirmed, no rebuild needed
- DOM overlay pattern: HIGH — `calibration-overture.ts` is the exact precedent
- ViewStateMachine wiring: HIGH — `ENTER_FIELD` already defined; Phase 1 does not refactor the machine
- CSS token correctness: HIGH — all tokens verified in `src/style.css`
- Transition timing: HIGH — 200ms + 600ms confirmed in both CONTEXT.md and design spec
- Fraunces font-size at viewport: MEDIUM — requires clamp; exact breakpoints not tested

**Research date:** 2026-04-25
**Valid until:** 90 days (stable stack, no external dependencies)
