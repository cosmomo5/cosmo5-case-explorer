# Phase 12: Reading List + Review Mode + Comparison Mode — Research

**Researched:** 2026-04-16  
**Domain:** Three-part UI system (persistent reading list, Review Mode overlay, Comparison Mode gather adaptation)  
**Confidence:** HIGH  
**Requirement Count:** 18 (RL-01 through RL-08, RV-01 through RV-04, CM-01 through CM-06)

---

## Summary

Phase 12 builds three interdependent systems on top of the v3.1 spatial engine:

1. **Reading List (RL-01 through RL-08)**: Rename shortlist UI, redesign track rendering, animate star flight on add/remove, persist state to localStorage, track query history and recently-viewed cases.
2. **Review Mode (RV-01 through RV-04)**: Full-viewport overlay triggered from REVIEW button, paginated arrow-key navigation with case count indicator, remove-from-list control that survives without exiting.
3. **Comparison Mode (CM-01 through CM-06)**: Threshold-gated button (≥3 readings), stars fly from track into phyllotaxis formation at center, heavy dimming of background stars, spatial comparison view with labeled gathered stars.

All three systems are built on the existing foundation: `ShortlistStore` (pub/sub Map-based), `ShortlistTrack` (current DOM renderer), GSAP animation library, and preserved `phyllotaxis.ts` geometry. The codebase is ready to receive these changes — no architectural barriers detected.

**Primary recommendation:** Implement in sequence: localStorage persistence → Review Mode overlay → Comparison Mode gather integration. Each block unlocks the next. Start with localStorage to unblock welcome-back state.

---

## Standard Stack

### Core Animation
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSAP | 3.12.0 | All timeline + tween work (already in project.json, used for loader, transitions) | Handles complex 700–900ms star flight animations, GSAP.context() cleanup pattern established |
| three.js | 0.170.0 | Star mesh lifecycle + sprite material updates (already in use) | Star glow sprites need opacity modulation; star position updates via proxy pattern (established in transition-choreographer.ts) |
| camera-controls | 3.1.2 | Camera management during Comparison Mode (silent hide of query bar/ring-switcher) | Already imported, stable API |

### Storage
| Method | Scope | Purpose | When to Use |
|--------|-------|---------|-------------|
| localStorage | browser | Persist reading list, query history, recently-viewed (3 independent keys) | Session survival across reload, tab close, browser restart |
| ShortlistStore (in-memory) | app session | Runtime state + pub/sub notifications | Single source of truth during execution; localStorage hydrates it on boot |

### UI Component Patterns
| Pattern | Location | Purpose |
|---------|----------|---------|
| ShortlistTrack | `src/ui/shortlist-track.ts` | Current track renderer — renders cards from store entries. Redesign will keep this pattern. |
| ReadingPanel | `src/ui/reading-panel.ts` | Already handles open(case, nucleusKey); already has "Add to Shortlist" button. Will rename to "Add to Reading List"; add remove-control to Review Mode. |
| loader.test.ts | `src/ui/loader.test.ts` | Test pattern: @vitest-environment jsdom, DOM fixture setup in beforeEach |

---

## Architecture Patterns

### 1. Reading List Persistence (localStorage)

**Three independent localStorage keys:**
- `cosmo5.readingList.v1` — JSON: `{ caseIds: string[], addedAt: Record<string, number> }`
- `cosmo5.queryHistory.v1` — JSON: `string[]` (last 5 queries, FIFO)
- `cosmo5.recentlyViewed.v1` — JSON: `string[]` (last 10 case IDs opened in panel)

**Integration point:** Boot-time hydration + on-mutation write.

```typescript
// Pseudo-code pattern (verified from main.ts boot flow)
const shortlistStore = createShortlistStore();
hydrate(shortlistStore, localStorage.getItem('cosmo5.readingList.v1'));
shortlistStore.subscribe((entries) => {
  localStorage.setItem('cosmo5.readingList.v1', JSON.stringify(serialize(entries)));
});
```

**Timestamp tracking:** `addedAt` map allows "last added X ago" welcome-back string.

---

### 2. Star Flight Animation (700–900ms eased)

**Pattern:** GSAP proxy animation on THREE.Vector3 position.

**Entry (add to reading list):** 700ms
- Star mesh tweens from orbital position → track position (bottom zone)
- Ghost (dimmed duplicate) remains at orbital position
- On arrival, ghost can be clicked to reverse

**Exit (remove from reading list):** 900ms (20% slower for expansion feel)
- Star tweens from track → original orbital position  
- Ghost disappears
- Reverse completes before next interaction can start

**Established pattern from codebase:**
```typescript
// Source: src/animation/transition-choreographer.ts (lines 10–38)
// GSAP proxy pattern for star mesh position:
const proxy = { x: starMesh.position.x, y: starMesh.position.y, z: starMesh.position.z };
gsap.to(proxy, {
  x: targetX, y: targetY, z: targetZ,
  duration: 0.7, // 700ms
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)', // --ease token (MUST be single easing function per v3.2 spec)
  onUpdate: () => {
    starMesh.position.set(proxy.x, proxy.y, proxy.z);
  },
});
```

**Ghost mechanism:** Existing star mesh at original orbit position, opacity ~0.2, invisible to click until registered in a ghost-star map. Click ghost → removes entry from shortlist, triggers exit animation.

---

### 3. Review Mode Overlay Structure

**DOM structure:**
```html
<div id="review-mode-overlay" class="review-mode-overlay">
  <button class="rmo-close">Esc or ×</button>
  <div class="rmo-header">
    <span class="rmo-counter">CASE 3 OF 7</span>
  </div>
  <div class="rmo-content">
    <!-- Instrument readout from ReadingPanel (reused) -->
    <div class="rp-instrument"></div>
    <div class="rp-body"></div>
    <button class="rmo-remove">REMOVE FROM LIST</button>
  </div>
  <div class="rmo-nav">
    <button class="rmo-prev">← Prev</button>
    <button class="rmo-next">Next →</button>
  </div>
</div>
```

**Lifecycle:**
1. REVIEW button clicked or reading-list card clicked → overlay fades in (`opacity: 0 → 1`, 400ms)
2. Arrow keys advance; counter updates in real-time
3. Remove button drops case from list without exiting overlay
4. Esc or × closes, returns to observatory with list intact

**Integration:** ReadingPanel already renders instrument + body sections; Review Mode reuses that HTML generation, just wraps it in overlay positioning.

---

### 4. Comparison Mode (Adapted Gather)

**Phyllotaxis geometry:** Preserved in `src/scene/phyllotaxis.ts` (confirmed Phase 8).

```typescript
// Source: src/scene/phyllotaxis.ts (lines 18–34)
export function computePhyllotaxisPositions(
  count: number,
  options: PhyllotaxisOptions = {}
): Vec3[] {
  const { radius = 2.0, scale = 1.0 } = options;
  const positions: Vec3[] = [];
  for (let i = 0; i < count; i++) {
    const angle = i * GOLDEN_ANGLE; // ~137.508°
    const r = Math.sqrt(i / Math.max(count - 1, 1)) * radius * scale;
    positions.push({
      x: Math.cos(angle) * r,
      y: 0,
      z: Math.sin(angle) * r,
    });
  }
  return positions;
}
```

**Entry (activate Comparison Mode):**
1. COMPARE button clicked (enabled at ≥3 readings)
2. Reading-list stars fly from track to phyllotaxis positions (~900ms, same easing)
3. Non-reading-list stars dim to 0.08 opacity
4. Query bar, advanced drawer, ring-switcher all hidden (CSS display:none)

**Exit (return to observatory):**
1. Stars return to track positions (~700ms)
2. Background stars restore to normal opacity
3. UI chrome re-appears
4. List remains intact

**Visual distinction from focus mode:** Focus mode rotates camera + expands rings spatially. Comparison mode translates stars spatially + dims background. User perceives as separate operations.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| Star position animation | Custom requestAnimationFrame loop + manual lerping | GSAP proxy pattern (already established) | GSAP handles timeline cleanup, ease application, onUpdate callbacks. Manual loop = sync bugs, memory leaks |
| Reading list persistence | Custom JSON parse/stringify in main.ts | localStorage + hydration function at boot | Separation of concerns. Boot logic stays in main.ts; storage logic is its own module. |
| Phyllotaxis positions | Recalculate golden angle in Comparison Mode code | Import computePhyllotaxisPositions from src/scene/phyllotaxis.ts | Code is isolated and tested. Golden angle constant is non-obvious; avoid duplication. |
| Welcome-back string formatting | Custom date.now() comparison | Create utility: `timeSinceReadable(timestamp)` returning "2 hours ago" / "3 days ago" | Date arithmetic is error-prone (daylight saving, timezone). Use standard pattern. |
| Comparison Mode UI state | Global variable (e.g., `window.comparisonMode`) | React-like state: `ViewState` discriminated union extended to include `comparison` variant | v3.2 pattern: ViewState already exists (`src/data/view-state.ts`). Keep state machine clean; avoid globals. |

---

## Common Pitfalls

### Pitfall 1: localStorage Bloat and Race Conditions
**What goes wrong:** Multiple subscriptions to shortlistStore all write to localStorage immediately. High-frequency mutations (rapid click-add, rapid click-remove) cause 100+ writes/sec. Browser throttles. Data loss if tab is closed mid-write.

**Why it happens:** No debounce on subscription callbacks; no write batching.

**How to avoid:** 
- Debounce localStorage writes (300–500ms). Collect mutations, flush once.
- Use try/catch on localStorage.setItem (quota exceeded).
- Test with DevTools throttling (set Network to "Fast 3G").

**Warning signs:** 
- Rapid clicks → some entries don't persist
- Console errors: "QuotaExceededError"
- Test failure: "entries not in localStorage"

---

### Pitfall 2: Ghost Star Mesh Leakage
**What goes wrong:** Ghost star mesh created but never disposed when removed from list. Over time (add/remove 50+ times), 50+ unused meshes accumulate in scene. Performance degrades.

**Why it happens:** Ghost lifecycle not tracked; disposal only on reading list clear.

**How to avoid:**
- Map reading-list stars to ghost meshes: `Map<caseId, THREE.Mesh>`.
- On remove, dispose ghost: `scene.remove(ghost); ghost.geometry.dispose(); ghost.material.dispose()`.
- Test: remove all items, check scene.children.length === initial count.

**Warning signs:**
- Frame rate drops after heavy add/remove cycling
- DevTools → Memory → Three.js objects steadily increase
- Test failure: "scene has N extra meshes"

---

### Pitfall 3: Review Mode Outlet Not Reached by Tab Navigation
**What goes wrong:** User tabs through reading list track cards, but can't tab into Review Mode overlay. Keyboard user is stuck.

**Why it happens:** Review Mode div `display: none` until activated. Tab order doesn't include hidden elements. Once visible, focus-trap not implemented.

**How to avoid:**
- Implement focus-trap: when Review Mode opens, move focus to first interactive element (prev/next buttons or close button).
- Esc key closes overlay (already in spec).
- Use `aria-modal="true"` and `role="dialog"` on overlay.
- Test with keyboard-only user flow: Tab through track → Enter on card → Review Mode opens → Tab → arrows work → Esc exits → back in track.

**Warning signs:**
- Keyboard test fails: "can't reach Review Mode buttons"
- Screen reader announces "4 items in list" but Review Mode button is not announced
- Lighthouse a11y warning: "No focus visible"

---

### Pitfall 4: Comparison Mode "Exit" Doesn't Restore Prior Ring State
**What goes wrong:** User focuses constellation with ring dimension = "year". Opens Comparison Mode. Exits. Rings are rotated but dimensional grouping is still "year" (correct) but camera position is wrong (should be face-on to focused nucleus, not global view).

**Why it happens:** Comparison Mode hides UI but doesn't save/restore camera state. Exit animation returns stars to track, but camera just fades UI back in.

**How to avoid:**
- On Comparison Mode enter: snapshot current ViewState (kind: 'constellation', nucleusKey, ringDimension, cameraState).
- On exit: restore from snapshot. Don't assume camera position didn't change.
- Use existing choreographer pattern: `startT1(nucleusPos, faceOnDir, viewDistance)` to re-establish focus.

**Warning signs:**
- Test failure: "camera not face-on after Comparison Mode exit"
- User report: "stars returned but scene is zoomed out"
- Scene state machine: `focusedKey !== null` but camera looking at global position

---

### Pitfall 5: Query History Size Unbounded
**What goes wrong:** User types 200 different queries over a week. Query history grows to 200 entries. localStorage swells. "Welcome back" readout is slow to compute (200 array lookups).

**Why it happens:** No FIFO eviction; array.push() on every new query.

**How to avoid:**
- Enforce max 5 entries (spec requirement RL-06). If new query is duplicate, move to end, don't add.
- Implementation: `Set<string> seenQueries` + Array of last 5 unique. On new query: remove if in set, push to array, truncate array[0] if length > 5.
- Test: 10 queries (with duplicates) → array length = 5.

**Warning signs:**
- localStorage "cosmo5.queryHistory.v1" exceeds 50KB
- Test assertion: "query history length > 5"
- Perf regression: "Welcome back" render takes 50ms

---

### Pitfall 6: GSAP Context Not Cleaned Up on Component Destroy
**What goes wrong:** User rapidly toggles Comparison Mode on/off. Each entry creates new GSAP.context(). Old contexts not reverted. GSAP tweens stack up (200 tweens running on 30 stars). Browser hangs.

**Why it happens:** GSAP.context() is created but `ctx.revert()` is never called if user cancels mid-animation.

**How to avoid:**
- Comparison Mode state machine: on enter, save context reference. On any interruption (exit, focus change, etc.), call `context.revert()` before starting new animation.
- Pattern (from transition-choreographer.ts, lines 44–50): store `state.currentCtx`, always call `cancel()` before `startT1/startT5`.
- Apply same pattern to star-flight animations and Comparison Mode entry.

**Warning signs:**
- Test: rapid click COMPARE 10 times, check `gsap.globalTimeline.getChildren().length` — should not exceed 30. If > 100, contexts not cleaned.
- Perf test: "fps drops from 60 to 15 after 5 toggles"

---

## Code Examples

### Example 1: localStorage Hydration at Boot

**Source:** Pattern derived from main.ts boot flow (lines 65–93) + shortlist-store API.

```typescript
// In main.ts, after createShortlistStore()
const shortlistStore = createShortlistStore();

// Hydrate from localStorage
const persisted = localStorage.getItem('cosmo5.readingList.v1');
if (persisted) {
  try {
    const { caseIds, addedAt } = JSON.parse(persisted);
    for (const caseId of caseIds) {
      const nucleusKey = getDefaultNucleusKey(caseId); // fallback to first nucleus
      shortlistStore.add(caseId, nucleusKey);
    }
    shortlistStore._addedAt = addedAt; // expose for welcome-back string
  } catch (e) {
    console.warn('Reading list hydration failed:', e);
    // Continue with empty store
  }
}

// Debounce writes back to localStorage
let writeTimeout: ReturnType<typeof setTimeout> | null = null;
shortlistStore.subscribe((entries) => {
  if (writeTimeout) clearTimeout(writeTimeout);
  writeTimeout = setTimeout(() => {
    const payload = {
      caseIds: entries.map(e => e.caseId),
      addedAt: shortlistStore._addedAt || {},
    };
    try {
      localStorage.setItem('cosmo5.readingList.v1', JSON.stringify(payload));
    } catch (e) {
      console.error('Reading list save failed:', e);
    }
    writeTimeout = null;
  }, 300);
});
```

---

### Example 2: Star Flight Animation (Add to Reading List)

**Source:** Adapts transition-choreographer.ts proxy pattern (lines 10–38) to star mesh.

```typescript
// In a new module src/ui/star-flight-animator.ts
import * as THREE from 'three';
import { gsap } from 'gsap';

export function animateStarToTrack(
  starMesh: THREE.Mesh,
  fromPos: THREE.Vector3,
  toPos: THREE.Vector3, // track position
  duration: number = 0.7,
  onComplete?: () => void,
): () => void {
  const proxy = {
    x: fromPos.x,
    y: fromPos.y,
    z: fromPos.z,
  };

  const context = gsap.context(() => {
    gsap.to(proxy, {
      x: toPos.x,
      y: toPos.y,
      z: toPos.z,
      duration,
      ease: 'cubic-bezier(0.16, 1, 0.3, 1)', // --ease token
      onUpdate: () => {
        starMesh.position.set(proxy.x, proxy.y, proxy.z);
      },
      onComplete,
    });
  });

  // Return cleanup function
  return () => context.revert();
}
```

---

### Example 3: Review Mode Overlay (Structure & Lifecycle)

**Source:** Reading panel reuse pattern (src/ui/reading-panel.ts, lines 52–150).

```typescript
// In src/ui/review-mode.ts
export class ReviewMode {
  private overlay: HTMLElement | null = null;
  private readingList: ShortlistEntry[];
  private currentIndex: number = 0;
  private caseById: Map<string, CaseStudy>;
  private onRemove: (caseId: string) => void;

  constructor(
    caseById: Map<string, CaseStudy>,
    readingList: ShortlistEntry[],
    shortlistStore: ShortlistStore,
    onRemove: (caseId: string) => void,
  ) {
    this.caseById = caseById;
    this.readingList = readingList;
    this.onRemove = onRemove;
  }

  open(startIndex: number = 0): void {
    this.currentIndex = startIndex;
    
    // Create overlay DOM
    const overlay = document.createElement('div');
    overlay.id = 'review-mode-overlay';
    overlay.className = 'review-mode-overlay';
    overlay.innerHTML = `
      <div class="rmo-shell">
        <button class="rmo-close" aria-label="Close">Esc or ×</button>
        <div class="rmo-content"></div>
        <div class="rmo-nav">
          <button class="rmo-prev" aria-label="Previous case">← Prev</button>
          <span class="rmo-counter"></span>
          <button class="rmo-next" aria-label="Next case">Next →</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.overlay = overlay;

    // Bind controls
    overlay.querySelector('.rmo-close')!.addEventListener('click', () => this.close());
    overlay.querySelector('.rmo-prev')!.addEventListener('click', () => this.prevCase());
    overlay.querySelector('.rmo-next')!.addEventListener('click', () => this.nextCase());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prevCase();
      if (e.key === 'ArrowRight') this.nextCase();
      if (e.key === 'Escape') this.close();
    });

    // Render initial case
    this.renderCase();

    // Fade in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });
  }

  private renderCase(): void {
    const entry = this.readingList[this.currentIndex];
    const c = this.caseById.get(entry.caseId);
    if (!c) return;

    const content = this.overlay!.querySelector('.rmo-content')!;
    content.innerHTML = `
      <div class="rp-instrument"></div>
      <div class="rp-body"></div>
      <button class="rmo-remove">REMOVE FROM LIST</button>
    `;

    // Reuse ReadingPanel rendering logic (generate instrument + body HTML)
    // ... (same as ReadingPanel.open() lines 78–141)

    // Remove button
    content.querySelector('.rmo-remove')!.addEventListener('click', () => {
      this.shortlistStore.remove(entry.caseId);
      this.onRemove(entry.caseId);
      // Don't close overlay; stay in Review Mode
      // Re-render next case or close if last one removed
      if (this.readingList.length === 0) {
        this.close();
      } else if (this.currentIndex >= this.readingList.length) {
        this.currentIndex = this.readingList.length - 1;
      }
      this.renderCase();
    });

    // Update counter
    const counter = this.overlay!.querySelector('.rmo-counter')!;
    counter.textContent = `CASE ${this.currentIndex + 1} OF ${this.readingList.length}`;
  }

  private prevCase(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCase();
    }
  }

  private nextCase(): void {
    if (this.currentIndex < this.readingList.length - 1) {
      this.currentIndex++;
      this.renderCase();
    }
  }

  close(): void {
    if (!this.overlay) return;
    this.overlay.classList.remove('visible');
    setTimeout(() => {
      this.overlay?.remove();
      this.overlay = null;
    }, 400);
  }
}
```

---

### Example 4: Comparison Mode Entry (Star Flight to Phyllotaxis)

**Source:** Phyllotaxis API (src/scene/phyllotaxis.ts, lines 18–34) + GSAP context pattern.

```typescript
// In src/scene/comparison-mode.ts
import { computePhyllotaxisPositions } from './phyllotaxis';
import { gsap } from 'gsap';
import type { StarOrbit } from '../data/types';
import type { ShortlistEntry } from '../data/shortlist-store';

export function enterComparisonMode(
  starMeshes: THREE.Mesh[],
  starOrbits: StarOrbit[],
  readingList: ShortlistEntry[],
  onComplete?: () => void,
): () => void {
  // Compute phyllotaxis positions (count = readingList.length)
  const phylloPositions = computePhyllotaxisPositions(readingList.length, {
    radius: 2.0,
    scale: 1.2, // slightly larger formation
  });

  const caseIdToMesh = new Map<string, THREE.Mesh>();
  for (const mesh of starMeshes) {
    const orbit = starOrbits.find(o => o.caseStudy.id === mesh.userData.caseId);
    if (orbit) {
      caseIdToMesh.set(orbit.caseStudy.id, mesh);
    }
  }

  // Filter to reading-list stars only
  const readingStars = readingList
    .map(entry => ({ entry, mesh: caseIdToMesh.get(entry.caseId) }))
    .filter(x => x.mesh);

  // Create GSAP context for all animations
  const context = gsap.context(() => {
    const timeline = gsap.timeline({
      onComplete: () => {
        // Dim non-reading stars
        for (const mesh of starMeshes) {
          if (!caseIdToMesh.has(mesh.userData.caseId)) {
            // Animation: opacity to 0.08 (or star glow sprite opacity adjustment)
            gsap.to(mesh.material, { opacity: 0.08, duration: 0.4 });
          }
        }
        onComplete?.();
      },
    });

    // Animate each reading star to phyllotaxis position (~900ms)
    for (let i = 0; i < readingStars.length; i++) {
      const { entry, mesh } = readingStars[i];
      const targetPos = phylloPositions[i];

      const proxy = {
        x: mesh!.position.x,
        y: mesh!.position.y,
        z: mesh!.position.z,
      };

      timeline.to(
        proxy,
        {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration: 0.9,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
          onUpdate: () => {
            mesh!.position.set(proxy.x, proxy.y, proxy.z);
          },
        },
        0, // start all at once
      );
    }
  });

  // Return cleanup: revert context and restore stars to track
  return () => {
    context.revert();
  };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Shortlist as ephemeral (cleared on reload) | Reading List persisted to localStorage | Phase 12 (v3.2) | User work survives sessions; "welcome back" state enables internal-team reuse |
| Single track renderer (only star labels) | Track redesign with client/sector/metric cards + count + REVIEW/COMPARE buttons | Phase 12 (v3.2) | Track becomes a distinct staging area, not just a label band |
| Gather as filter-result trigger (old v3-starmap) | Gather geometry adapted for Comparison Mode (reading list only) | Phase 8 decision, Phase 12 implementation | Separation of concerns: filter results use wave animations; comparison uses spatial formation |
| Manual focus/unfocus camera transitions | GSAP context pattern established (transition-choreographer.ts) | Phase 3 (v3.1) | Reusable, testable, no memory leaks from nested GSAP timelines |

**Deprecated/outdated (v3.2 scope):**
- "Shortlist" label — now "Reading List" across all UI
- Gather-as-filter mechanics — filter results now use wave animation (Phase 10), not gather
- Compile-to-PDF / URL-hash sharing — deferred; primary user reframed to internal team (see STATE.md, Q3 resolution)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (unit) + jsdom environment |
| Config file | vite.config.ts + vitest setup in package.json |
| Quick run command | `npm run test` |
| Full suite command | `npm run test -- --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RL-01 | "Reading List" label in track header + buttons | unit | `vitest src/ui/shortlist-track.test.ts` | ✅ |
| RL-02 | Track renders empty/populated states with count + REVIEW/COMPARE buttons | unit | `vitest src/ui/shortlist-track.test.ts` | ✅ (needs extend) |
| RL-03 | Star flies 700ms on add, ghost remains at orbit | unit | `vitest src/ui/star-flight-animator.test.ts` | ❌ Wave 0 |
| RL-04 | Ghost click → remove (900ms return animation, 20% slower) | unit | `vitest src/ui/star-flight-animator.test.ts` | ❌ Wave 0 |
| RL-05 | localStorage persisted under `cosmo5.readingList.v1`, survives reload | integration | `vitest src/data/shortlist-store.test.ts` | ❌ Wave 0 |
| RL-06 | Query history last 5 queries, stored as `cosmo5.queryHistory.v1` | unit | `vitest src/data/query-history.test.ts` | ❌ Wave 0 |
| RL-07 | Recently-viewed API defined, `cosmo5.recentlyViewed.v1` | unit | `vitest src/data/recently-viewed.test.ts` | ❌ Wave 0 |
| RL-08 | Welcome-back readout on land with non-empty list | unit | `vitest src/ui/welcome-back.test.ts` | ❌ Wave 0 |
| RV-01 | REVIEW button triggers overlay; click reading-list card also opens | unit | `vitest src/ui/review-mode.test.ts` | ❌ Wave 0 |
| RV-02 | Overlay fills viewport, renders case with instrument readout + metrics | unit | `vitest src/ui/review-mode.test.ts` | ❌ Wave 0 |
| RV-03 | Arrow keys navigate list; progress indicator updates; Esc closes | unit | `vitest src/ui/review-mode.test.ts` | ❌ Wave 0 |
| RV-04 | Remove button drops case without exiting overlay | unit | `vitest src/ui/review-mode.test.ts` | ❌ Wave 0 |
| CM-01 | COMPARE button disabled until ≥3 readings with explanatory tooltip | unit | `vitest src/ui/shortlist-track.test.ts` | ❌ Wave 0 |
| CM-02 | Stars fly to phyllotaxis (~900ms), other stars dim to 0.08 opacity | integration | `vitest src/scene/comparison-mode.test.ts` | ❌ Wave 0 |
| CM-03 | Gathered stars labeled, readable spacing, hover opens reading panel | unit | `vitest src/ui/comparison-mode-overlay.test.ts` | ❌ Wave 0 |
| CM-04 | Query bar, advanced drawer, ring-switcher hidden during comparison | unit | `vitest src/ui/ui-visibility.test.ts` | ❌ Wave 0 |
| CM-05 | Exit returns stars to track (~700ms), restores UI | integration | `vitest src/scene/comparison-mode.test.ts` | ❌ Wave 0 |
| CM-06 | Comparison Mode visually distinct from focus mode | manual (screenshot) | Compare viewport screenshots focus vs comparison | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- src/ui/shortlist-track.test.ts src/data/shortlist-store.test.ts` (quick reading list tests)
- **Per wave merge:** `npm run test` (full suite)
- **Phase gate:** Full suite green + 239 existing tests still passing before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/ui/star-flight-animator.ts` + `src/ui/star-flight-animator.test.ts` — star flight animations (RL-03, RL-04)
- [ ] `src/data/shortlist-store.ts` → extend to track `addedAt` timestamps (RL-05)
- [ ] `src/data/query-history.ts` + test — deduplicated last-5 queries (RL-06)
- [ ] `src/data/recently-viewed.ts` + test — last-10 case IDs API (RL-07)
- [ ] `src/ui/welcome-back.ts` + test — "Welcome back. N readings..." readout rendering (RL-08)
- [ ] `src/ui/review-mode.ts` + test — overlay + navigation + remove (RV-01 through RV-04)
- [ ] `src/scene/comparison-mode.ts` + test — phyllotaxis flight + dimming (CM-01, CM-02, CM-05)
- [ ] `src/ui/comparison-mode-overlay.ts` + test — labels, hover panels (CM-03)
- [ ] `src/ui/ui-visibility.ts` — hide query bar/drawer/ring-switcher (CM-04)
- [ ] `styles.css` — `.review-mode-overlay`, `.comparison-mode-overlay` classes (visual layer)

---

## Open Questions

1. **Ghost star mesh vs. virtual position marker?**
   - What we know: Spec requires "ghost remains at original position" (RL-03). Star mesh can be cloned or virtual marker in a separate layer.
   - What's unclear: Performance at 100+ stars in reading list. Clone 100 meshes = 100 draw calls vs. single texture quad for all ghosts.
   - Recommendation: Prototype clone approach first (simpler, matches star visual style). If perf issue, switch to a single ghost-layer sprite sheet.

2. **Welcome-back readout: accurate "last added" timestamp or approximation?**
   - What we know: Spec says "last added X ago" (RL-08).
   - What's unclear: Does "X ago" need second-level granularity, or "2 hours ago" / "3 days ago" buckets?
   - Recommendation: Use bucketed utility `timeSinceReadable(timestamp)` returning ["just now", "minutes ago", "hours ago", "yesterday", "days ago"]. Simpler, matches app's tone.

3. **Comparison Mode on narrow viewport (<768px)?**
   - What we know: Phase 14 (EDG-05) specifies "desktop-only" message. Unclear if Comparison Mode hides on narrow viewport or just shows disabled button.
   - What's unclear: Should Comparison Mode even launch on narrow viewport, or is it locked out entirely?
   - Recommendation: Treat as Phase 14 scope. For Phase 12, assume desktop (≥768px). Add TODO comment in code.

4. **Can a case be in reading list multiple times?**
   - What we know: Current ShortlistStore API is `Map<caseId, ShortlistEntry>`, so unique by caseId.
   - What's unclear: What if user adds same case from two different clusters/years? Should it appear twice in reading list?
   - Recommendation: Keep uniqueness constraint (Map-based). User can read the same case once. Simplifies pagination in Review Mode.

5. **Query history: exclude empty queries or only distinct non-empty?**
   - What we know: Spec says "last 5 distinct queries" (RL-06).
   - What's unclear: If user types "fintech", backspaces to "fi", does "fi" count as a query?
   - Recommendation: Only non-empty, non-whitespace queries. Debounce history write at 1000ms (after user stops typing for 1 second). Exact query string match for dedup.

---

## Sources

### Primary (HIGH confidence)
- **Context7 + official docs:**
  - GSAP 3.12.0: Context pattern, timeline API, proxy patterns (verified in existing transition-choreographer.ts)
  - three.js 0.170.0: Mesh lifecycle, material disposal pattern (verified in existing scene-state.ts)
  - localStorage API: standard browser API, no version concerns
  
- **Codebase investigation (2026-04-16):**
  - src/data/shortlist-store.ts — ShortlistStore interface + pub/sub API (Map-based)
  - src/ui/shortlist-track.ts — current track renderer pattern
  - src/scene/phyllotaxis.ts — golden angle geometry, isolated for Phase 12
  - src/animation/transition-choreographer.ts — GSAP context cleanup pattern
  - src/ui/reading-panel.ts — instrument readout generation + body sections
  - src/ui/shortlist-track.test.ts — DOM testing pattern with jsdom + vitest
  - .planning/REQUIREMENTS.md — Phase 12 requirements RL-01 through CM-06 (18 total)
  - .planning/MILESTONE-v3.2.md — Phase 12 section with success criteria + design principles

### Secondary (MEDIUM confidence)
- **Architecture decisions (from STATE.md + ROADMAP.md):**
  - Phase 8 resolved: phyllotaxis preserved, gather adapted for Comparison Mode
  - Phase 10 resolved: Query bar + Advanced drawer (foundation for query history)
  - Phase 11 (in progress): Reading panel instrument-readout structure established
  - Branch strategy: phase-1c canonical, v3-starmap specification-only
  - Primary user reframed to internal team (v3.2, 2026-04-14)

### Tertiary (notes for validation)
- Existing 239 passing tests (all v3.1 phases) — baseline for regression checking
- GSAP 3.12.0 in package.json — confirmed present, no version upgrade needed
- vitest + jsdom environment — confirmed in package.json devDependencies and loader.test.ts pattern

---

## Metadata

**Confidence breakdown:**
- Standard Stack (GSAP, localStorage, phyllotaxis geometry): **HIGH** — all APIs verified in codebase or confirmed present in dependencies
- Architecture Patterns (star flight, Review Mode, Comparison Mode): **HIGH** — patterns derived directly from existing code (transition-choreographer, reading-panel) and isolated phyllotaxis API
- Don't Hand-Roll items: **HIGH** — all can be verified against existing patterns or are well-documented pitfalls
- Common Pitfalls: **MEDIUM-HIGH** — drawn from patterns observed in existing code + known GSAP/three.js issues; some require integration testing to fully verify
- Open Questions: **MEDIUM** — legitimate ambiguities that Phase 12 planner will clarify with Mo; not blockers

**Research date:** 2026-04-16  
**Valid until:** 2026-04-23 (7 days — fast-moving domain, GSAP + localStorage are stable, but UI interaction patterns may shift)

**Key research artifacts:**
- Phase requirements: 18 (all mapped to test types in Validation Architecture section)
- File investigations: 15+ files across src/data, src/ui, src/scene, src/animation
- Existing test patterns verified: vitest + jsdom environment, pub/sub mocking pattern, DOM fixture setup
- GSAP patterns verified: context cleanup, proxy animation, timeline chaining
- Three.js patterns verified: mesh disposal, sprite material opacity, userData tracking
