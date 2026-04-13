# Phase 6: Reading Panel + Track Selection — Research

**Researched:** 2026-04-13
**Domain:** DOM panel + CSS flex layout compression + ViewStateMachine wiring + ShortlistStore integration + Three.js emissive gold glow
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 340px panel slides in from the right on case star click
- Scene compresses leftward (not overlay — actual layout reflow)
- Panel shows: instrument readout + case sections (services, challenge, approach, results with metric cards)
- Close button + Esc collapses panel and restores canvas width
- Arrow keys navigate between cases on the same ring or in the shortlist
- Active case glows gold in the orbit while being read
- Bottom zone track for selected cases
- Cases added/removed from shortlist via panel interaction
- Track persists across focus/unfocus transitions
- Track is the selection mechanism for building a pitch deck's worth of proof

### Claude's Discretion
- Panel slide animation timing and easing
- Metric card layout within results section
- Gold glow implementation (emissive vs outline vs post-processing)
- Shortlist track visual design (chips, cards, thumbnails)
- How arrow-key navigation wraps at boundaries (cycle vs stop)
- ShortlistStore integration (already exists from Phase 1)
- Whether panel is DOM overlay or integrated into the flex layout

### Deferred Ideas (OUT OF SCOPE)
- Export/share shortlist as link or PDF (Phase 7 polish)
- Drag-and-drop reorder in shortlist track
- Multi-case comparison view
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| READ-01 | Click case star → 340px reading panel slides in from right; scene compresses leftward | `#reading-panel-slot` flex slot exists, CSS `width: 340px` transition pre-wired. New `ReadingPanel` component renders into slot. |
| READ-02 | T3 Panel open (~400ms) — CSS slide transition | CSS already has `transition: width 400ms var(--ease)` on `#reading-panel-slot`. Add `.open` class via `LayoutController.setPanelOpen(true)`. |
| READ-03 | T4 Panel close (~350ms) — CSS slide out, scene expands | Override transition duration to 350ms for close, or use a CSS variable. `setPanelOpen(false)` removes `.open`. |
| READ-04 | Instrument readout strip — region/vertical/year in DM Mono grid cells, teal values | `CaseStudy` carries `region`, `year`, `services[]`. New HTML in panel slot. DM Mono + teal token matches existing style vocabulary. |
| READ-05 | Case sections — services chips, challenge, approach, results with metric cards (Noto 900) | `DetailPanel` class (v1) already implements all these sections. New `ReadingPanel` refactors the same content rendering into the slot. Existing metric-card CSS classes reusable. |
| READ-06 | Arrow-key navigation between cases (same ring or shortlist) | Keyboard handler in `main.ts` currently uses arrow keys for nucleus cycling. Must gate: if panel is open, arrows navigate cases (same ring); if shortlist active, navigate shortlist order. |
| READ-07 | Active case glows gold in orbit while being read | `StarState.reading` already defined with `colorOverride: 0xe8b15a` (gold). Tick loop reads `userData.starState` in focused mode; setting it to `'reading'` on open is sufficient. MeshStandardMaterial has `emissive` support for glow. Need to confirm emissive write path. |
| READ-08 | Permission gating — locked state if `permission: false` | `CaseStudy.permission` boolean exists. `DetailPanel` v1 already handles this pattern. Copy gating logic to new component. |
| READ-09 | Esc or close button closes panel (triggers T4) | Esc handler in `main.ts` step-back chain: panel open → close panel. Already structured: `if (detailPanel.isOpen()) { detailPanel.close(); return; }`. Update to use new panel. |
| READ-10 | Shortlist track in bottom zone — cases can be added/removed; track persists across focus/unfocus | `ShortlistStore` (Phase 1) fully implemented with pub/sub. Track UI subscribes. Bottom zone (`#track-zone`) needs HTML + CSS. Filter divider line already shows in constellation mode. |
</phase_requirements>

---

## Summary

Phase 6 builds two distinct pieces: the reading panel and the shortlist track. Both have strong scaffolding from earlier phases. The reading panel replaces the v1 `DetailPanel` class with a new component that renders into the pre-wired `#reading-panel-slot` flex slot, triggering the CSS layout compression that Phase 2 established. The shortlist track wires `ShortlistStore` (Phase 1) to a new bottom-zone UI.

The most important architectural finding: there are two panel systems in the codebase right now. The old `#panel` + `#panelScrim` + `DetailPanel` class is a fixed-position overlay (z-index 30) that does not compress the scene. The `#reading-panel-slot` is the Phase 6 target — it sits inside the `#app-shell` flex layout and compresses `#scene-container` by occupying 340px of flex width. Phase 6 must use the slot, not the overlay. The old `DetailPanel` instance in `main.ts` becomes dead code.

The ViewStateMachine `OPEN_READING` and `CLOSE_READING` events currently throw with "not wired until Phase 5" — that comment is stale. These transitions are Phase 6 work: wire `constellation` + `OPEN_READING` → `reading`, and `reading` + `CLOSE_READING` → `constellation`. The gold glow (READ-07) is nearly free: `userData.starState = 'reading'` triggers the tick loop to apply `colorOverride: 0xe8b15a` as opacity, but a separate emissive intensity write is needed for the glow effect since the tick loop reads opacity only, not color.

**Primary recommendation:** Build a new `ReadingPanel` class that renders into `#reading-panel-slot` and owns the open/close/navigate lifecycle. Wire ViewStateMachine for `reading` state. Connect `ShortlistStore` to a new `ShortlistTrack` component in the bottom zone.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.0.0 | Type safety | Project-wide; all new code is TS |
| Three.js | ^0.170.0 | 3D scene, emissive materials | Already in use; MeshStandardMaterial supports emissive |
| GSAP | ^3.12.0 | Panel slide tweens, gold pulse | Already used for all transitions; established proxy pattern |
| Vitest | ^2.0.0 | Unit tests | 153 tests passing; jsdom environment for DOM tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS custom properties | — | `--ease`, `--teal`, `--gold`, `--bg` | All animation easing and color tokens already defined |
| CSS flex | — | Panel compression | `#app-shell` is `display:flex; flex-direction:row`; panel slot is `flex-shrink:0` |
| jsdom | ^29.0.2 | DOM environment in tests | Required for vitest tests touching DOM APIs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS width transition | GSAP `width` tween | CSS transition is already pre-wired on `#reading-panel-slot` and avoids JavaScript timing coupling. Use CSS. |
| `userData.starState = 'reading'` | Separate glow mesh | Built-in star state system already handles this. No new mesh needed. |
| New HTML panel component | Extending `DetailPanel` | `DetailPanel` uses a fixed overlay. It cannot compress the scene. Do not extend it. Build new. |

**Installation:** No new dependencies required.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── data/
│   └── shortlist-store.ts        # Exists — Phase 1. Wire to track UI.
│   └── view-state.ts             # Exists — wire OPEN_READING / CLOSE_READING
│   └── star-state.ts             # Exists — 'reading' state drives gold glow
├── ui/
│   └── reading-panel.ts          # NEW — renders into #reading-panel-slot
│   └── shortlist-track.ts        # NEW — renders into #track-zone
│   └── detail-panel.ts           # OLD — becomes dead code after Phase 6
├── layout/
│   └── layout-controller.ts      # Exists — setPanelOpen() and setViewMode('reading')
├── scene/
│   └── scene-state.ts            # Extend: set/clear 'reading' starState on open/close
└── main.ts                        # Wire: star click → ReadingPanel.open(), Esc → close
```

### Pattern 1: New ReadingPanel into Flex Slot

**What:** A class that renders content into `#reading-panel-slot` and calls `LayoutController.setPanelOpen()` to trigger the CSS width transition.
**When to use:** Star click in focused mode.
**Example:**

```typescript
// Source: derived from layout-controller.ts + existing DetailPanel pattern
export class ReadingPanel {
  private slot: HTMLElement;
  private layoutController: LayoutController;
  private currentCaseId: string | null = null;

  constructor(layoutController: LayoutController) {
    this.slot = document.getElementById('reading-panel-slot') as HTMLElement;
    this.layoutController = layoutController;
    // Render static shell into slot once
    this.slot.innerHTML = `<div id="rp-inner">...</div>`;
  }

  open(c: CaseStudy, nucleusKey: string): void {
    this.currentCaseId = c.id;
    this._populate(c);
    this.layoutController.setPanelOpen(true);
    this.layoutController.setViewMode('reading');
  }

  close(): void {
    this.layoutController.setPanelOpen(false);
    this.layoutController.setViewMode('constellation');
    this.currentCaseId = null;
  }

  isOpen(): boolean {
    return this.slot.classList.contains('open');
  }
}
```

### Pattern 2: ViewStateMachine Wiring for 'reading' State

**What:** Wire the two deferred transitions in `view-state.ts` that currently throw.
**When to use:** First task in the phase — everything else depends on this.
**Example:**

```typescript
// Source: view-state.ts — lines 26-29, current placeholder throws
// Replace with:
if (event.type === 'OPEN_READING') {
  if (current.kind !== 'constellation') {
    throw new Error(`Cannot OPEN_READING from "${current.kind}"`);
  }
  next = { kind: 'reading', nucleusKey: current.nucleusKey, caseId: event.caseId };
}
if (event.type === 'CLOSE_READING') {
  if (current.kind !== 'reading') {
    throw new Error(`Cannot CLOSE_READING from "${current.kind}"`);
  }
  next = { kind: 'constellation', nucleusKey: current.nucleusKey };
}
```

### Pattern 3: Gold Glow — StarState 'reading' + Emissive

**What:** Set `userData.starState = 'reading'` when panel opens. The tick loop at `scene-state.ts:379` reads this and applies `resolveStarAppearance('reading').opacity = 1.0`. The `colorOverride: 0xe8b15a` field in `APPEARANCE` is defined but the tick loop only applies `opacity`, not the color override. The gold color must be set separately via emissive.
**When to use:** On panel open, for the star corresponding to the open case. On panel close, restore to `'idle'` or `'selected'`.

```typescript
// Source: star-state.ts — colorOverride defined but not yet applied in tick
// In scene-state.ts tick loop (line 379), to apply the gold:
if (storedState === 'reading') {
  const appearance = resolveStarAppearance('reading');
  mat.opacity = appearance.opacity;
  if (appearance.colorOverride !== undefined) {
    // MeshStandardMaterial only — emissive drives the glow
    (mat as THREE.MeshStandardMaterial).emissive.setHex(appearance.colorOverride);
    (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
  }
}
```

**Important:** Stars use `MeshStandardMaterial` (confirmed: `scene-state.ts:126`), which has `.emissive` + `.emissiveIntensity`. The tick loop currently treats all materials as `THREE.MeshBasicMaterial` (line 371). This must be fixed for the emissive path to work correctly.

### Pattern 4: ShortlistTrack — Subscribe + Render

**What:** A component that subscribes to `ShortlistStore` and re-renders a list of chips/cards in the bottom zone.
**When to use:** Mount once at boot. Store updates trigger re-render.

```typescript
// Source: shortlist-store.ts — subscribe() returns unsubscribe fn
const track = new ShortlistTrack(
  document.getElementById('track-zone')!,
  shortlistStore,
  (caseId) => { readingPanel.openById(caseId); }
);
// ShortlistStore pub/sub fires synchronously on add()/remove()
shortlistStore.subscribe((entries) => { track.render(entries); });
```

### Pattern 5: Arrow-Key Navigation

**What:** In `main.ts`, the arrow-key handler currently cycles nucleus groups. When the reading panel is open, arrows must navigate cases on the current ring instead.
**When to use:** Panel is open in focused mode.

```typescript
// Source: main.ts line 430 — existing arrow-key handler
// Gate: if panel is open, navigate cases; otherwise navigate nuclei
if (readingPanel.isOpen()) {
  const ringCases = getCasesOnCurrentRing(sceneObjects); // or shortlist if shortlist-mode
  const currentIdx = ringCases.findIndex(c => c.id === readingPanel.currentCaseId);
  const nextIdx = e.key === 'ArrowRight'
    ? (currentIdx + 1) % ringCases.length  // cycle — Claude's discretion
    : (currentIdx - 1 + ringCases.length) % ringCases.length;
  readingPanel.open(ringCases[nextIdx], sceneObjects.focusedKey!);
  return;
}
// Existing nucleus cycling continues below...
```

### Anti-Patterns to Avoid

- **Extending `DetailPanel`:** It's a fixed overlay (z-index 30, 500px, scrim-backed). It does not compress the scene. Do not modify it; create `ReadingPanel` separately.
- **Tweening `#reading-panel-slot` width with GSAP:** CSS transition is already on the slot. Adding GSAP `width` tween creates conflicts. Toggle `.open` class only.
- **Reading `userData.starState` inside `applyFilter` for 'reading' state:** The precedence gate already protects `reading` state from filter overrides (line 462). Do not change `applyFilter` logic.
- **Allocating `new THREE.Vector3()` in tick for emissive reads:** The existing scratch vector pattern must be extended if any Vector3 work is needed in the reading/emissive path.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Panel slide animation | Custom JS width interpolation | CSS `transition: width 400ms var(--ease)` on `#reading-panel-slot` | Already implemented in Phase 2. Toggle class only. |
| Case data persistence across scenes | Custom session storage | `ShortlistStore` pub/sub | Phase 1 implementation verified at 153 tests. FND-03 confirmed. |
| State transitions | Direct boolean flags | `ViewStateMachine.dispatch()` | Type-safe event system already routes transitions; OPEN_READING just needs wiring. |
| GSAP animation for camera | Direct camera property tweens | GSAP proxy pattern (established in Phase 3) | camera-controls prohibits direct property tweening; proxy is the settled pattern. |
| Permission gating logic | New permission check | Copy from `DetailPanel.open()` lines 85-125 | Exact same `c.permission` boolean with same hide/show sections. |

---

## Common Pitfalls

### Pitfall 1: Writing to the Wrong Panel
**What goes wrong:** Developer modifies `DetailPanel` or renders into `#panel` — the old overlay. Scene does not compress. READ-01 fails visually.
**Why it happens:** Both systems exist in the DOM. `#panel` is obvious (it has content in index.html). `#reading-panel-slot` is empty.
**How to avoid:** `ReadingPanel` constructor must explicitly target `document.getElementById('reading-panel-slot')`. Add a type assertion and throw if null.
**Warning signs:** Panel appears but 3D scene width does not shrink.

### Pitfall 2: Tick Loop Material Cast
**What goes wrong:** Emissive property fails silently. `mat.emissive` is undefined because tick loop casts to `THREE.MeshBasicMaterial` (line 371 in `scene-state.ts`) which has no `.emissive` property.
**Why it happens:** Stars were `MeshBasicMaterial` in earlier phases; `MeshStandardMaterial` was introduced in session 2. The cast on line 371 was not updated.
**How to avoid:** In the tick loop's `opacity` application path, cast to `THREE.MeshStandardMaterial` (all stars use it per scene-state.ts:126). Or check for the emissive property before writing.
**Warning signs:** Gold glow never appears; no JS error (silent miss on undefined property).

### Pitfall 3: Arrow Keys Conflicting
**What goes wrong:** Arrow keys cycle nucleus groups while reading panel is open, causing a T1 transition to fire while panel is visible.
**Why it happens:** Current handler at `main.ts:430` has no panel-open guard.
**How to avoid:** Check `readingPanel.isOpen()` before nucleus cycling logic. Panel case navigation is a separate code path.
**Warning signs:** Pressing arrow key while reading a case closes the panel and transitions to a different nucleus.

### Pitfall 4: StarState Not Cleared on Panel Close
**What goes wrong:** A star stays gold-emissive after the panel closes. On next open of a different case, two stars glow gold.
**Why it happens:** `userData.starState = 'reading'` was set on open but not restored on close.
**How to avoid:** `ReadingPanel.close()` must explicitly find the star mesh for `currentCaseId` and reset `userData.starState` to `'idle'` (or `'selected'` if shortlisted) and clear emissive intensity.
**Warning signs:** More than one star glowing gold at the same time, or gold persisting after Esc.

### Pitfall 5: ShortlistStore Not Wired to Star 'selected' State
**What goes wrong:** Cases are added to shortlist but stars never show `'selected'` appearance (opacity 1.0, no dimming). The shortlist track shows items but the 3D scene gives no visual feedback.
**Why it happens:** `ShortlistStore` and `StarState` are both implemented but no code connects them. `ShortlistStore.subscribe()` must update `userData.starState` on stars.
**How to avoid:** On every `ShortlistStore` change, scan `sceneObjects.starMeshes`, set `userData.starState = 'selected'` for shortlisted cases and restore `'idle'` for removed ones — unless state is `'reading'` (respect precedence).
**Warning signs:** Shortlist track shows correct entries but all stars look the same.

### Pitfall 6: Transition Lock Not Applied to Panel Open
**What goes wrong:** Star click during T1/T5 camera transition opens the reading panel, causing the panel and camera to animate simultaneously, with raycasting on a stale matrix.
**Why it happens:** `choreographer.state.inProgress` check is currently on nucleus clicks and ring clicks but the star click path at `main.ts:253` checks it — confirm this guard is present.
**How to avoid:** Verify the star click path in `main.ts` (line 254) has `if (choreographer.state.inProgress) return;` before calling `readingPanel.open()`.
**Warning signs:** Panel opens with a visually wrong case (stale raycast) during camera fly.

---

## Code Examples

### Existing Reading Panel Slot CSS (confirmed in style.css line 69)

```css
/* Source: src/style.css lines 69-70 */
#reading-panel-slot {
  width: 0;
  overflow: hidden;
  transition: width 400ms var(--ease);
  flex-shrink: 0;
}
#reading-panel-slot.open {
  width: 340px;
  background: rgba(14,16,32,0.95);
}
```

T3 is the CSS transition already in place. T4 (close, ~350ms) can override via a second CSS class or by adjusting the transition on close. One approach: add `body.panel-closing #reading-panel-slot { transition-duration: 350ms; }` and apply the class transiently via `LayoutController`.

### Existing LayoutController API (confirmed in layout-controller.ts)

```typescript
// Source: src/layout/layout-controller.ts
layoutController.setPanelOpen(true);          // adds 'open' to #reading-panel-slot + 'panel-open' to body
layoutController.setPanelOpen(false);         // removes both
layoutController.setViewMode('reading');      // body.constellation + body.reading
layoutController.setViewMode('constellation'); // body.constellation only (removes reading)
layoutController.setViewMode('global');       // removes both
```

### Existing ShortlistStore API (confirmed in shortlist-store.ts)

```typescript
// Source: src/data/shortlist-store.ts
const store = createShortlistStore();
store.add('case-id', 'nucleusKey');   // synchronous, fires listeners
store.remove('case-id');              // synchronous, fires listeners
store.has('case-id');                 // boolean
store.entries();                      // ShortlistEntry[] snapshot
const unsub = store.subscribe(entries => { /* re-render track */ });
// store survives T1/T5 transitions — FND-03 confirmed at 153 tests
```

### Existing StarState Precedence (confirmed in star-state.ts and scene-state.ts:462)

```typescript
// Source: src/data/star-state.ts — precedence: reading > selected > ghost > filterMatch > filterDim > idle
// Source: src/scene/scene-state.ts:462 — applyFilter only overwrites idle/filterDim/filterMatch
const APPEARANCE: Record<StarState, StarAppearance> = {
  reading:     { opacity: 1.0,  colorOverride: 0xe8b15a },  // gold
  selected:    { opacity: 1.0 },
  ghost:       { opacity: 0.25 },
  filterMatch: { opacity: 0.85 },
  filterDim:   { opacity: 0.12 },
  idle:        { opacity: 0.85 },
};
// Setting userData.starState = 'reading' on a star mesh is sufficient for the
// tick loop to apply opacity=1.0. Emissive gold requires an additional write
// to mat.emissive and mat.emissiveIntensity (MeshStandardMaterial only).
```

### Instrument Readout — DM Mono Grid (design language reference)

```css
/* Pattern established in style.css for the existing panel eye strip */
.p-eye {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: .2em;
}
/* For the new instrument readout strip, use DM Mono + teal tokens.
   Grid layout: three cells (region / vertical / year) in a row. */
```

---

## Two Panel Systems — Decision Summary

This is the load-bearing architectural finding for the planner.

| Attribute | Old panel (v1, dead code after Phase 6) | New reading panel slot (Phase 6 target) |
|-----------|----------------------------------------|------------------------------------------|
| Element | `#panel` + `#panelScrim` | `#reading-panel-slot` |
| Width | `min(500px, 92vw)` | `340px` (locked) |
| Positioning | `position: fixed; right: 0` | Flex child inside `#app-shell` |
| Z-index | 30 (above everything) | In-flow (flex layout) |
| Scene compression | NO — overlay | YES — flex layout reflow |
| CSS class | `.panel.open` → `transform: translateX(0)` | `#reading-panel-slot.open` → `width: 340px` |
| Scrim | `#panelScrim` fades in | No scrim |
| Implementation | `DetailPanel` class in `src/ui/detail-panel.ts` | New `ReadingPanel` class |

**The planner must not reuse `DetailPanel` or `#panel`.** Build `ReadingPanel` targeting `#reading-panel-slot`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `DetailPanel` overlay for case reading | `#reading-panel-slot` flex compression | Phase 2 introduced the slot; Phase 6 activates it | Old panel becomes dead code |
| OrbitControls | camera-controls v3.1.2 | Phase 3 | GSAP proxy pattern is mandatory |
| `MeshBasicMaterial` on stars | `MeshStandardMaterial` (roughness 0.45, metalness 0.15) | Session 2 (Phase 4) | Emissive property is available on all star materials |
| Arrow keys cycle nuclei | Arrow keys navigate cases when panel open | Phase 6 | Guard required in keydown handler |
| `OPEN_READING` / `CLOSE_READING` throw | Wired to `reading` state | Phase 6 (this phase) | ViewStateMachine must be extended first |

---

## Open Questions

1. **T3 vs T4 duration asymmetry (READ-02 vs READ-03)**
   - What we know: CSS transition is `400ms` on `#reading-panel-slot`; T4 should be 350ms.
   - What's unclear: Whether to handle the 50ms asymmetry via a second CSS class, a JS override, or just use 400ms for both.
   - Recommendation: Claude's discretion. Simplest: single `350ms` transition (both open and close); the spec says ~400ms and ~350ms which are close enough that a single value reads within spec. Alternatively: add `body.panel-closing #reading-panel-slot { transition-duration: 350ms; }`.

2. **Arrow-key navigation source: same ring vs shortlist**
   - What we know: READ-06 says "same ring or shortlist"; no explicit rule for when shortlist takes priority.
   - What's unclear: If a case is on the current ring AND in the shortlist, which set determines arrow navigation order?
   - Recommendation: Default to ring order. If the shortlist track is focused/active (user is interacting with the track), use shortlist order. Claude's discretion — document the choice in PLAN.md.

3. **Emissive write in tick loop: per-frame vs on-change**
   - What we know: The tick loop writes `mat.opacity` every frame. Writing emissive every frame is benign but redundant.
   - What's unclear: Whether to write emissive in the tick loop (safe, consistent) or only on state change (cleaner, but more complex).
   - Recommendation: Write emissive in the tick loop alongside opacity. The cost is negligible; the consistency with existing pattern is high.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vite.config.ts` (vitest block) or implicit defaults |
| Quick run command | `npm test` (runs `vitest run`) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| READ-01 | `LayoutController.setPanelOpen(true)` causes `#reading-panel-slot.open` class | unit | `npm test -- layout-controller` | ✅ exists |
| READ-02 | T3 open: slot has `open` class after `setPanelOpen(true)` | unit | `npm test -- layout-controller` | ✅ exists |
| READ-03 | T4 close: slot loses `open` class after `setPanelOpen(false)` | unit | `npm test -- layout-controller` | ✅ exists |
| READ-04 | `ReadingPanel` renders instrument readout with region/year from CaseStudy | unit | `npm test -- reading-panel` | ❌ Wave 0 |
| READ-05 | `ReadingPanel` renders all case sections; hides body if `permission: false` | unit | `npm test -- reading-panel` | ❌ Wave 0 |
| READ-06 | Arrow navigation returns next/prev case in ring order | unit | `npm test -- reading-panel` | ❌ Wave 0 |
| READ-07 | `starState = 'reading'` produces `colorOverride: 0xe8b15a` from `resolveStarAppearance` | unit | `npm test -- star-state` | ✅ (star-state.ts tested but this assertion may be missing) |
| READ-08 | `ReadingPanel` shows locked banner if `permission: false` | unit | `npm test -- reading-panel` | ❌ Wave 0 |
| READ-09 | `ReadingPanel.close()` calls `setPanelOpen(false)` | unit | `npm test -- reading-panel` | ❌ Wave 0 |
| READ-10 | `ShortlistStore.add()` fires listener; track renders entries | unit | `npm test -- shortlist-store` | ✅ exists |

### Sampling Rate
- **Per task commit:** `npm test` — full suite, 153 + new tests, runs in ~18s
- **Per wave merge:** `npm test` — full suite green
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/ui/reading-panel.test.ts` — covers READ-04, READ-05, READ-06, READ-08, READ-09 (jsdom environment required, add `// @vitest-environment jsdom` directive at top)
- [ ] `src/ui/shortlist-track.test.ts` — covers READ-10 track rendering behavior
- [ ] `src/data/view-state.test.ts` — extend existing file with OPEN_READING / CLOSE_READING transition tests (file exists, add to it)
- [ ] Confirm `star-state.test.ts` asserts `colorOverride: 0xe8b15a` for `'reading'` state — currently untested

---

## Sources

### Primary (HIGH confidence)
- Source: `/mnt/c/Users/moham/Documents/Thales/work/design/case-study-explorer/src/` — all key files read directly
- `src/layout/layout-controller.ts` — `setPanelOpen` / `setViewMode` API confirmed
- `src/data/shortlist-store.ts` — complete pub/sub implementation confirmed
- `src/data/star-state.ts` — `'reading'` state with `colorOverride: 0xe8b15a` confirmed
- `src/data/view-state.ts` — `OPEN_READING` / `CLOSE_READING` throw stubs confirmed, state type includes `'reading'`
- `src/scene/scene-state.ts` — tick loop material cast confirmed (line 371), `MeshStandardMaterial` on stars confirmed (line 126)
- `src/style.css` — CSS slot transition at 400ms confirmed (line 69), all design tokens confirmed
- `index.html` — `#reading-panel-slot` and `#panel` (old overlay) both confirmed in DOM
- `src/ui/detail-panel.ts` — v1 overlay pattern confirmed; confirmed does not compress scene
- `src/main.ts` — arrow key handler at line 430, Esc step-back chain at line 408, star click at line 253 confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library versions read from `package.json`; no new dependencies
- Architecture: HIGH — all integration points read directly from source files
- Pitfalls: HIGH — based on observed code patterns (material cast, panel duality, state restore), not speculation

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (stable stack; no fast-moving dependencies)
