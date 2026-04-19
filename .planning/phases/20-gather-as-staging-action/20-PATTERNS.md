# Phase 20: Gather as Staging Action — Pattern Map

**Mapped:** 2026-04-19
**Files analyzed:** 7 new/modified
**Analogs found:** 7 / 7 (100%)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/scene/gather.ts` or export from `staging.ts` | pure function (entry point) | request-response (button click → staging lifecycle) | `applyFilter` in `scene-state.ts` | exact (composes existing lifecycle) |
| `.gather-button` CSS block in `style.css` | CSS styling | static (no data flow) | `.fchip`, `.fgroup-header`, `.clr` in `style.css` | exact (same register, tokens, conventions) |
| Gather button element + state machine in `filter-panel.ts` | UI component + state management | request-response (filter change → state recompute; click → action) | filter accordion `.fgroup-header` + readout in `filter-panel.ts` | exact (same pattern, same file) |
| View-state gating for button visibility | CSS / JS conditional render | state-driven visibility | `body.planetary` / `body.constellation` toggle in `main.ts` + CSS | exact (proven pattern) |
| `src/scene/scene-state.ts` (gut `applyFilter`) | function reduction (remove staging branch) | state mutation only (no scene side-effects) | existing `applyFilter` function (lines 408-478) | exact (same surface, removing branches) |
| `src/data/star-state.ts` enum removal | enum member cleanup | no data flow (compile-time) | existing `StarState` enum + `resolveStarAppearance` | exact (same pattern, subtractive) |
| Test files rewrite | test suite | verification of new behavior | existing test structure (jest/vitest style) | exact (same structure, new assertions) |

---

## Pattern Assignments

### `src/scene/gather.ts` or `gather()` export from `staging.ts` (new function)

**Role:** Pure function (entry point, composition)
**Data Flow:** Button click → `gather(objects)` → creates/updates staging sphere → returns
**Closest Analog:** `applyFilter()` in `src/scene/scene-state.ts` (lines 408-478)

**Analog excerpt** — current staging lifecycle composition inside `applyFilter` global branch (lines 420-429):
```typescript
// From src/scene/scene-state.ts:408-478
if (newFilter.isActive() && matchedCases.length > 0) {
  if (!objects.nucleusMeshes.has(STAGING_KEY)) {
    // First filter application: create sphere, push nuclei, lean camera
    createStagingNucleus(objects, matchedCases);
    applyStagingPush(objects);
    zoomTowardStaging(objects);
  } else {
    // Filter changed while staging sphere already present — update star positions
    animateStarsToStaging(objects, matchedCases);
  }
}
```

**Staging lifecycle primitives** (already exported from `src/scene/staging.ts`, lines 27-162):
```typescript
export function createStagingNucleus(objects: SceneObjects, matchedCases: EnrichedCaseStudy[]): void
export function disposeStagingNucleus(objects: SceneObjects): void
export function animateStarsToStaging(objects: SceneObjects, matchedCases: EnrichedCaseStudy[]): void
export function applyStagingPush(objects: SceneObjects): void
export function zoomTowardStaging(objects: SceneObjects): void
export function returnStarsFromStaging(objects: SceneObjects): void
```

**Adapt for Phase 20:**
Create a new `gather(objects)` entry point that (1) computes `matchedCases` from `objects.filterState`, (2) decides whether to create or update staging sphere based on `objects.nucleusMeshes.has(STAGING_KEY)`, (3) calls the appropriate staging primitives. This extracts the staging logic from `applyFilter` so the button can call it directly. The function signature and return type:
```typescript
export function gather(objects: SceneObjects): void {
  // Compute matched cases from current filter
  const matchedCases = objects.starMeshes
    .filter(s => matchesFilter(s.userData.caseStudy as CaseStudy, objects.filterState))
    .map(s => s.userData.caseStudy as EnrichedCaseStudy);
  
  if (matchedCases.length === 0) return; // Safety: button should be disabled if no matches
  
  // Decide: create new sphere or update existing
  if (!objects.nucleusMeshes.has(STAGING_KEY)) {
    createStagingNucleus(objects, matchedCases);
    applyStagingPush(objects);
    zoomTowardStaging(objects);
  } else {
    animateStarsToStaging(objects, matchedCases);
  }
}
```

---

### `.gather-button` CSS block in `src/style.css`

**Role:** CSS styling (hairline button, state-driven color/opacity)
**Data Flow:** No data flow; styling is applied via class toggles in JS
**Closest Analogs:** 
- `.fchip` (lines 437-451) — hairline border, DM Mono, transparent bg
- `.fgroup-header` (lines 794-805) — accordion button, flex layout, transparent background
- `.clr` button — reset button in filter panel

**Analog excerpts:**

`.fchip` pattern (hairline, DM Mono, border-color toggle):
```css
.fchip {
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  color: rgba(255,255,255,.88);
  font-family: 'DM Mono', monospace;
  font-size: 11.5px;
  font-weight: 400;
  letter-spacing: .05em;
  padding: 6px 10px;
  border-radius: 2px;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
}
.fchip.on {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(232, 177, 90, .12);
}
```

`.fgroup-header` pattern (accordion button, full-width, transparent):
```css
.fgroup-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 8px;
  background: transparent;
  border: none;
  color: var(--col-text, #e0e0e0);
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.fgroup-header:hover {
  background: rgba(255, 255, 255, 0.04);
}
```

**Adapt for Phase 20:**

The Gather button lives in the unified left column (same container as filter accordion). It's a full-width hairline button with state-driven color (gold for armed/staged, teal for disabled/stranded). Use the `.fchip` hairline convention but adapt to button proportions (8px vertical padding instead of chip's 6px). DM Mono 12px (12px is the standard for readable instrument labels; see `.filters-readout` at line 471). Apply state via JS-managed classes: `.disabled`, `.staged-drifted`, `.stranded`. Use CSS custom properties to avoid hardcoded hex values in the new block.

```css
.gather-button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  margin: 16px 0 8px 0;
  
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  
  background: transparent;
  border: 1px solid var(--gold);
  color: var(--gold);
  
  cursor: pointer;
  transition: border-color 150ms ease-out, color 150ms ease-out, opacity 150ms ease-out;
}

.gather-button:hover:not(:disabled):not(.staged-current) {
  border-color: var(--gold);
  opacity: 1.0;
}

.gather-button:disabled,
.gather-button.disabled {
  border-color: var(--teal);
  color: var(--teal);
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.gather-button.staged-drifted {
  border-color: var(--gold);
  opacity: 0.85;
}

.gather-button.staged-drifted:hover {
  opacity: 0.95;
}

.gather-button.stranded {
  border-color: var(--teal);
  color: var(--teal);
  opacity: 0.6;
  cursor: pointer;
}

.gather-button.stranded:hover {
  opacity: 0.75;
}

.gather-button:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

.gather-button:focus:not(:focus-visible) {
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .gather-button {
    transition: none;
  }
}

/* View-state gating: hide in planetary + reading views */
body.planetary .gather-button,
body.reading .gather-button {
  display: none !important;
}
```

---

### Gather button element + state management in `src/ui/filter-panel.ts`

**Role:** UI component + state machine
**Data Flow:** Filter change (facet click) → button state recompute; click → `gather()` / `disposeStagingNucleus()`
**Closest Analog:** Filter accordion header buttons + readout logic in same file (lines 1-200)

**Analog excerpt** — accordion header button (lines 97-105):
```typescript
// From src/ui/filter-panel.ts:68-105 (buildAccordionSections)
<button class="fgroup-header" aria-expanded="false">
  <span class="fgroup-label">${DIM_LABELS[dim]}</span>
  ${badge}
  <span class="fgroup-arrow">▾</span>
</button>
```

**Accordion click handler** (lines 211-220):
```typescript
container.querySelectorAll('.fgroup-header').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.closest('.fgroup');
    const isOpen = group?.hasAttribute('data-open');
    group?.toggleAttribute('data-open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
  });
});
```

**Readout count logic** (lines 114-127):
```typescript
const isActive = obj.filterState.isActive();
const matched = isActive ? countMatches(obj, allCases) : 0;
const readoutHtml = isActive
  ? `<div class="filters-readout" aria-live="polite" role="status">${matched} CASES</div>`
  : `<div class="filters-readout" aria-live="polite" role="status">—</div>`;
```

**Adapt for Phase 20:**

Insert Gather button at the bottom of the accordion (inside `.filters-body` or as a sibling after it, before `.filter-status`). The button's state is determined by:
1. Is filter active? Is there a match?
2. Does staging sphere exist? If yes, does it match current filter?

Build a state-determination function, then apply the state via classes and label text:

```typescript
// In filter-panel.ts, add near the top with other state logic
function determineGatherButtonState(
  obj: SceneObjects,
  allCases: EnrichedCaseStudy[],
): { state: 'disabled' | 'armed' | 'staged-current' | 'staged-drifted' | 'stranded'; matchedCount: number; stagedCount: number } {
  const isActive = obj.filterState.isActive();
  const matchedCount = isActive ? countMatches(obj, allCases) : 0;
  const sphereExists = obj.nucleusMeshes.has(STAGING_KEY);
  const stagedCount = sphereExists 
    ? (obj.nucleusOrbits[STAGING_KEY]?.cases.length ?? 0)
    : 0;

  if (!isActive || matchedCount === 0) {
    return { state: 'disabled', matchedCount, stagedCount };
  }
  if (!sphereExists) {
    return { state: 'armed', matchedCount, stagedCount };
  }
  if (matchedCount === stagedCount) {
    return { state: 'staged-current', matchedCount, stagedCount };
  }
  if (!isActive && sphereExists) {
    return { state: 'stranded', matchedCount, stagedCount };
  }
  return { state: 'staged-drifted', matchedCount, stagedCount };
}

// Build button HTML (add to buildGlobalHTML and buildFocusedHTML)
const gatherState = determineGatherButtonState(obj, allCases);
const gatherLabel = (() => {
  switch (gatherState.state) {
    case 'disabled':
      return isActive && matchedCount === 0 ? `0 CASES — REFINE` : `GATHER`;
    case 'armed':
      return `GATHER`;
    case 'staged-current':
      return `GATHERED · ${gatherState.matchedCount}`;
    case 'staged-drifted':
      return `RE-GATHER · ${gatherState.stagedCount}→${gatherState.matchedCount}`;
    case 'stranded':
      return `DISMISS`;
  }
})();

const gatherButtonHtml = `
  <button 
    class="gather-button${gatherState.state === 'disabled' ? ' disabled' : ''}${gatherState.state === 'staged-drifted' ? ' staged-drifted' : ''}${gatherState.state === 'staged-current' ? ' staged-current' : ''}${gatherState.state === 'stranded' ? ' stranded' : ''}"
    aria-label="${gatherLabel}"
    aria-pressed="${gatherState.state.startsWith('staged')}"
  >
    ${gatherLabel}
  </button>
`;
```

**Click handler** — attach after button is inserted (in `setupFilterPanel` or equivalent):
```typescript
const gatherBtn = container.querySelector('.gather-button') as HTMLButtonElement;
if (gatherBtn) {
  gatherBtn.addEventListener('click', () => {
    const state = determineGatherButtonState(sceneObjects, allCases);
    if (state.state === 'armed' || state.state === 'staged-drifted') {
      gather(sceneObjects); // New entry point
    } else if (state.state === 'stranded') {
      disposeStagingNucleus(sceneObjects);
    }
    // Re-render button (update label, class, aria-pressed)
    recomputeGatherButtonUI();
  });
}
```

---

### View-state gating (Gather button visibility)

**Role:** View-state conditional rendering
**Data Flow:** View state changes (global → constellation → reading) → button visibility toggle
**Closest Analog:** `body.planetary` and `body.constellation` class toggles in `src/main.ts` (line 63) + CSS rules at `src/style.css` line 334-337

**Analog excerpt** — body class management (from `src/main.ts`):
```typescript
// Line 63 (boot time)
document.body.classList.add('planetary');

// Lines 551, 617 (view-state transitions)
layoutController.setViewMode('constellation'); // When entering focus
layoutController.setViewMode('global');        // When exiting focus
```

**Analog CSS** (from `src/style.css` line 334-337):
```css
body.planetary .gather-button,
body.reading .gather-button {
  display: none !important;
}
```

**Adapt for Phase 20:**

Two options (planner chooses; UI-SPEC defers to planner):

**Option A (CSS body-class gating, preferred):**
- Add a `body.reading` class toggle to `layoutController.setViewMode()` in `main.ts` (complement the existing `body.planetary`/`body.constellation` toggles)
- The `.gather-button` CSS rule already includes `body.reading .gather-button { display: none !important }` (see CSS block above)
- Requires one-line additions in `main.ts` to toggle the body class on reading panel open/close

**Option B (JS conditional render):**
- In `filter-panel.ts`, check `objects.mode` and conditionally render the button only if mode is `global` or `constellation`
- No body-class needed; button is removed from DOM entirely in `planetary`/`reading` views

Both satisfy the requirement (D-10). Option A is preferred if it's consistent with Phase 17/18 patterns.

---

### `src/scene/scene-state.ts` gutting (collapse `applyFilter`)

**Role:** Function reduction (remove staging branch + highlight branch)
**Data Flow:** State mutation only (no scene side-effects after gutting)
**Closest Analog:** Current `applyFilter` function (lines 408-478)

**Surface to gut:**

1. **Global-mode staging branch** (lines 420-446): Remove entirely. This logic moves to the new `gather()` function.
   ```typescript
   // REMOVE this entire block:
   if (objects.mode === 'global') {
     // ── Global branch: staging sphere lifecycle ─────────────────────────
     const matchedCases = objects.starMeshes
       .filter(s => matchesFilter(s.userData.caseStudy as CaseStudy, newFilter))
       .map(s => s.userData.caseStudy as EnrichedCaseStudy);
     if (newFilter.isActive() && matchedCases.length > 0) {
       // ... sphere creation/update
     } else {
       // ... sphere disposal
     }
   }
   ```

2. **Focused-mode dim branch** (lines 448-477): Remove the GSAP opacity tween and star-state writes. Focused mode should no longer call `applyFilter` at all (filter updates should be silent in focused mode too). Verify that focused-mode filter changes don't cause any scene reaction.
   ```typescript
   // REMOVE or minimize this entire branch:
   else if (objects.mode === 'focused') {
     // ── Focused branch: dim non-matching stars in place (FILT-07) ──────────
     // Remove all GSAP writes and star-state mutations here
   }
   ```

3. **Global-mode tick-loop opacity block** (lines 356-372): This writes `filterMatch` and `filterDim` states per frame. Remove entirely.
   ```typescript
   // REMOVE from tick loop (lines 356-372):
   } else {
     const isMatch = !anyFilter || matchesFilter(star.userData.caseStudy as CaseStudy, filterState);
     const starState: StarState = isMatch ? 'filterMatch' : 'filterDim';
     mat.opacity = resolveStarAppearance(starState).opacity;
     // ... color restore
   }
   ```

**After gutting**, `applyFilter` becomes:
```typescript
export function applyFilter(objects: SceneObjects, newFilter: FilterState): void {
  objects.filterState = newFilter;
  // That's it. No scene effects. Filter is silent.
}
```

**Adapt for Phase 20:**
This is a **subtractive refactor**. Read the current `applyFilter` (lines 408-478), identify the three blocks above, delete them, and verify that the remaining code is just the one-line state assignment. The test suite will drive this (tests expecting staging to happen inside `applyFilter` will fail; planner will rewrite them to expect staging only from explicit `gather()` calls).

---

### `src/data/star-state.ts` enum member removal

**Role:** Enum cleanup (remove unused values)
**Data Flow:** Compile-time (no runtime data flow)
**Closest Analog:** Existing `StarState` enum (line 1) and `resolveStarAppearance` mapping (lines 8-19)

**Current surface** (entire file):
```typescript
export type StarState = 'reading' | 'selected' | 'ghost' | 'filterMatch' | 'filterDim' | 'idle';

const APPEARANCE: Record<StarState, StarAppearance> = {
  reading:     { opacity: 1.0,  colorOverride: 0xe8b15a },
  selected:    { opacity: 1.0 },
  ghost:       { opacity: 0.25 },
  filterMatch: { opacity: 0.85 },  // ← REMOVE
  filterDim:   { opacity: 0.12 },  // ← REMOVE
  idle:        { opacity: 0.85 },
};
```

**Adapt for Phase 20:**
Remove the two union members `'filterMatch' | 'filterDim'` from the `StarState` type and their corresponding entries in the `APPEARANCE` record. The type becomes:
```typescript
export type StarState = 'reading' | 'selected' | 'ghost' | 'idle';
```

Verify that no other code in the codebase references `filterMatch` or `filterDim` as string literals (use grep to scan the project; scene-state.ts tick loop and `applyFilter` are the known consumers, both being deleted in the gutting above).

---

### Test files rewrite

**Role:** Test suite update (verification of decoupled behavior)
**Data Flow:** Tests are verification; no data flow
**Closest Analogs:** Existing test structures in:
- `src/scene/scene-state.test.ts` (global-branch filter tests)
- `src/scene/orbitals/staging.test.ts` (FILT-04 / FILT-09 fixtures)
- `src/tests/filter-wave.test.ts` (filter dim-cascade writes)
- `src/ui/filter-panel.test.ts` (button and readout)
- `src/ui/unified-column.test.ts` (column auto-expand, Tests 8-9 from Phase 18)

**Key test rewrites:**

1. **`src/scene/scene-state.test.ts` — global-branch filter tests** should expect NO staging sphere after calling `applyFilter()`. Tests currently asserting staging-sphere creation must be rewritten to assert only that `filterState` is mutated.

2. **`src/scene/orbitals/staging.test.ts` — FILT-04 / FILT-09 fixtures** (lines 151-213) currently test filter→staging coupling. Rewrite to test `gather()` directly (new entry point).

3. **`src/tests/filter-wave.test.ts`** (lines 63-72) — tests `applyFilterWave` writes to `filterMatch`/`filterDim`. Rewrite or delete per D-08 (planner decides; D-14 recommendation: rewire as gather traversal animation for Phase 23 reuse).

4. **New tests in `src/ui/filter-panel.test.ts`:**
   - Button state determination (5 states: disabled, armed, staged-current, staged-drifted, stranded)
   - Click behavior (armed → `gather()`, staged-drifted → `gather()` again, stranded → `disposeStagingNucleus()`)
   - Label text per state

5. **`src/ui/unified-column.test.ts` — Tests 8-9 (Phase 18 auto-expand)** must still pass. Gather button exists inside the column; verify it doesn't break the column layout or auto-expand logic.

**Adapt for Phase 20:**
Treat tests as **change-driven**. Planner will walk each test file, identify assertions that expect the old coupled behavior, and rewrite them to expect the new decoupled behavior. The test structure (jest/vitest conventions) stays the same; only the expectations change.

---

## Shared Patterns

### Filter state mutation (applies to all filter-related code)
**Source:** `src/data/filter.ts` (filter state object + `matchesFilter` predicate)
**Apply to:** `applyFilter()`, `gather()`, button state machine

The filter is a value object with methods like `isActive()`. After Phase 20, both `applyFilter()` and the button's state machine read from `objects.filterState` directly (no observer/subscription pattern needed). See D-04 (pure manual decoupling).

### Staging sphere identity
**Source:** `src/scene/staging.ts` (line 16: `export const STAGING_KEY = '__staging__'`)
**Apply to:** All code checking if staging sphere exists

Check sphere presence via `objects.nucleusMeshes.has(STAGING_KEY)`. This is a safe, namespaced identity.

### View-state gating pattern
**Source:** `src/main.ts` (view-state transitions) + `src/style.css` (body.X class toggles)
**Apply to:** Gather button visibility

Use the established `body.planetary`, `body.constellation`, etc. class toggles to gate element visibility via CSS. No JS visibility logic needed if CSS rule exists.

### DM Mono instrument register
**Source:** Project-wide token system (`--ease`, `--gold`, `--teal`, `--text`, `--text-s`, `--dim`, `--mute`)
**Apply to:** `.gather-button` CSS + button label copy

All button labels in the unified column use DM Mono 12px uppercase. Copy is terse, technical (instrument-register tone). No marketing language.

---

## No Analog Found

None. All Phase 20 files have direct analogs in the existing codebase.

---

## Metadata

**Analog search scope:** 
- `src/scene/` (staging lifecycle, scene-state)
- `src/ui/` (filter-panel button patterns, state machine)
- `src/data/` (filter state, star-state enum)
- `src/style.css` (CSS token conventions, button patterns)
- `src/main.ts` (view-state transitions, body-class toggles)

**Files scanned:** ~15 files
**Pattern extraction date:** 2026-04-19

---

## PATTERN MAPPING COMPLETE

**Phase:** 20 - Gather as Staging Action
**Files classified:** 7
**Analogs found:** 7 / 7 (100%)

### Coverage
- Files with exact analog: 7
- Files with role-match analog: 0
- Files with no analog: 0

### Key Patterns Identified
- **Staging lifecycle entry point:** New `gather(objects)` function composes existing primitives (`createStagingNucleus`, `applyStagingPush`, `zoomTowardStaging`, `animateStarsToStaging`). Extract from current `applyFilter` global branch.
- **Button state machine:** 5 states (disabled, armed, staged-current, staged-drifted, stranded) determined by filter activity + sphere existence. Button label and CSS class change per state.
- **Hairline button styling:** Transparent background, 1px border, DM Mono 12px uppercase. Gold for active/armed, teal for disabled/stranded. Uses existing CSS tokens; no new hex literals.
- **Silent filter:** `applyFilter()` collapses to state mutation only. No scene side-effects. Filter changes do not move stars, dim stars, or create/update staging sphere.
- **View-state gating:** Gather button absent from DOM in `planetary` and `reading` views. Use `body.reading` class toggle (Option A) or JS conditional render (Option B).
- **Test-suite shift:** Tests expecting staging from `applyFilter()` must be rewritten to expect staging only from explicit `gather()` calls. New tests for button 5-state logic.

### File Created
`.planning/phases/20-gather-as-staging-action/20-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference analog patterns in PLAN.md files. All concrete excerpts include file paths and line numbers.

---

*Phase: 20-gather-as-staging-action*  
*Pattern mapping: 2026-04-19*  
*Analyst: Claude Haiku (pattern mapper)*
