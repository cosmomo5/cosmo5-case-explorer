# Phase 18: Unified Left Column - Pattern Map

**Mapped:** 2026-04-19
**Files analyzed:** 10 files across 4 categories (fold/delete/reshape/unchanged-ref)
**Status:** Ready for planning + execution

---

## File Classification & Transformation

| File | Status | Role | Key Action | Analog Source |
|------|--------|------|-----------|---------------|
| `src/ui/filter-panel.ts` | **Reshape** | Acquirer module | Absorb input + readout + history + hint from query-bar | Self (extend) |
| `src/ui/query-bar.ts` | **Delete** | Source module | Fold `mountQueryBar`, drop `showWelcomeBack`, migrate event wiring | N/A (deleted after Phase 18) |
| `src/main.ts` | **Reshape** | Boot orchestrator | Remove query-bar call sites, update filter-panel call with new deps | Self (line 256, 684, 694) |
| `index.html` | **Delete blocks** | DOM template | Remove `#queryWrap` (lines 136–154), clean orphaned `<aside class="filters">` (lines 82–110) | Self (lines 77, 82–110, 136–154, 166) |
| `src/style.css` | **Delete + restyle** | Visual layer | Remove query-bar CSS (~228–390), ensure `.filters-*` + `body.planetary` still apply | Self (lines 228–390, 551–573) |
| `src/ui/filter-panel.test.ts` | **Keep + split** | Test | Existing facet/chip/accordion tests remain; integration tests → new `unified-column.test.ts` | Self (structure at lines 1–50) |
| `src/data/filter.ts` | **Unchanged ref** | Dependency | `FilterState`, `matchesFilter()`, `createFilterState()` stay | N/A |
| `src/data/keyword-map.ts` | **Unchanged ref** | Dependency | `applyQuery(q, filterState, cases)` called from unified input handler | N/A |
| `src/data/persistence.ts` | **Unchanged ref** | Dependency | `loadQueryHistory()`, `addQueryToHistory()` for history chip persistence | N/A |
| `src/data/view-state.ts` | **Unchanged ref** | Dependency | `ViewStateMachine`, `ENTER_CONSTELLATION`, `EXIT_CONSTELLATION` events | N/A |

---

## Concrete Code Patterns

### `src/ui/filter-panel.ts` — The Acquirer (reshape)

**Current signature** (line 175):
```typescript
export function mountFilterPanel(
  container: HTMLElement,
  objects: SceneObjects,
  onGroupModeChange: (mode: GroupMode) => void,
  onExitFocus?: () => void,
  options?: FilterPanelOptions,
): void
```

**New signature (Phase 18)** — Must accept additional deps:
```typescript
// Add these to the deps parameter
cases: CaseStudy[];
onFilterChange: () => void;
```

**Current buildGlobalHTML structure** (lines 112–145) — extend to include input + readout + history:
```typescript
function buildGlobalHTML(obj: SceneObjects, options?: FilterPanelOptions): string {
  const allCases = getAllCases(obj);
  const chipCounts = computeChipCounts(allCases, obj.filterState);
  const accordionSections = buildAccordionSections(obj, allCases, chipCounts);

  const isActive = obj.filterState.isActive();
  const matched = isActive ? countMatches(obj, allCases) : 0;
  const total = allCases.length;

  const statusBar = isActive ? `
    <div class="filter-status">
      <span>${matched} / ${total}</span>
      <button class="clr" id="filterClear">Reset all</button>
    </div>` : '';

  const modeRow = options?.hideModeSwitcher ? '' : (() => {
    // ... mode chips
  })();

  return `
    <div class="filters-head">
      <h3>Filter</h3>
    </div>
    ${modeRow}
    <div class="filters-body">
      ${accordionSections}
    </div>
    ${statusBar}
  `;
}
```

**DELETE the modeRow block** (lines 127–133, conditional on `hideModeSwitcher`):
```typescript
// DELETE THIS ENTIRE CONDITIONAL:
const modeRow = options?.hideModeSwitcher ? '' : (() => {
  const modeChips = (['vertical', 'country', 'region'] as GroupMode[]).map(m => {
    const active = obj.groupMode === m ? ' active' : '';
    return `<div class="mode-chip${active}" data-mode="${m}">${m.charAt(0).toUpperCase() + m.slice(1)}</div>`;
  }).join('');
  return `<div class="mode-row">${modeChips}</div>`;
})();
```

**Also DELETE the mode-row line from the return** (line 139):
```typescript
// BEFORE (line 139):
${modeRow}

// AFTER (delete that line entirely)
```

**Also DELETE the FilterPanelOptions interface** (lines 107–109):
```typescript
// DELETE THIS:
export interface FilterPanelOptions {
  hideModeSwitcher?: boolean;
}
```

**Pattern for input handler** (reuse from query-bar.ts, lines 153–169):
```typescript
// Debounced input (80ms)
function handleInput(): void {
  const q = input!.value;

  // Show/hide clear button
  clearBtn!.classList.toggle('visible', q.length > 0);

  // Apply query to filterState (sets filterState.searchText)
  applyQuery(q, deps.filterState, deps.cases);

  // Immediate readout update
  updateReadout(deps, readout!);
  refreshHint();

  // Debounced wave animation (80 ms)
  clearTimeout(waveTimer);
  waveTimer = setTimeout(triggerWave, 80);
}

input.addEventListener('input', handleInput);
```

**Readout update function** (query-bar.ts lines 38–42; adapt to count only CASES, not CLUSTERS per D-07):
```typescript
function updateReadout(readout: HTMLElement): void {
  const n = countMatches(objects.starMeshes, objects.filterState);
  // D-07: Drop CLUSTERS count, keep only CASES
  readout.textContent = `${n} CASES`;
}
```

**Hint update function** (query-bar.ts lines 47–84; keep both branches per D-09):
```typescript
function updateHint(
  hint: HTMLElement,
  query: string,
  matchCount: number,
  onSuggest: (term: string) => void,
): void {
  const q = query.trim();

  if (q.length === 0) {
    hint.innerHTML = 'Or explore the full catalog — click a cluster to enter.';
    hint.classList.add('visible');
    return;
  }

  if (matchCount === 0) {
    const suggestions = ['performance', 'brand', 'social media']
      .filter(s => !q.toLowerCase().includes(s))
      .slice(0, 3);
    const safeQ = q.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const suggestHtml = suggestions
      .map(s => `<button class="qh-suggest" data-suggest="${s}">${s}</button>`)
      .join(', ');
    hint.innerHTML = `No observations match <span class="qh-term">"${safeQ}"</span>. Try broader terms: ${suggestHtml}`;
    hint.classList.add('visible');
    // Wire suggestion clicks
    hint.querySelectorAll<HTMLButtonElement>('.qh-suggest').forEach(btn => {
      btn.addEventListener('click', () => {
        const term = btn.getAttribute('data-suggest') ?? '';
        onSuggest(term);
      });
    });
    return;
  }

  // Query has text and matches exist — clear the hint
  hint.classList.remove('visible');
  hint.innerHTML = '';
}
```

**Query history rendering** (query-bar.ts lines 89–94):
```typescript
function renderQueryHistory(historyContainer: HTMLElement): void {
  const history = loadQueryHistory();
  historyContainer.innerHTML = history
    .map(q => `<button class="query-chip" data-query="${q.replace(/"/g, '&quot;')}">${q}</button>`)
    .join('');
}
```

**View-state subscriber for auto-expand (D-05)** — add to filter-panel.ts:
```typescript
// Subscribe to view-state changes for auto-expand on ENTER_CONSTELLATION
viewState.subscribe((next, prev, event) => {
  if (event.type === 'ENTER_CONSTELLATION') {
    // Entering focused constellation — remove collapsed state
    container.parentElement?.classList.remove('collapsed');
  } else if (event.type === 'EXIT_CONSTELLATION') {
    // Returning to global — re-collapse
    container.parentElement?.classList.add('collapsed');
  }
});
```

---

### `src/ui/query-bar.ts` — Being Deleted

**All exported functions to migrate or drop:**

| Function | Action | Target |
|----------|--------|--------|
| `mountQueryBar(deps)` | **Migrate** | Lines 100–253 → fold into filter-panel.ts mount |
| `countMatches(objects, filterState)` | **Migrate** | Lines 23–27 → already exists in filter-panel.ts (line 63), use that |
| `countMatchingClusters(objects, filterState)` | **Keep as util** or **drop** — D-07 says drop the CLUSTERS readout, but the function may be used elsewhere; planner decides |
| `showWelcomeBack(store, readoutEl)` | **DELETE** | Lines 259–298 — D-10 says drop it entirely; remove from main.ts import + call site |

**Advanced drawer block to DELETE** (lines 229–252 in query-bar.ts):
```typescript
  // ── Advanced drawer ───────────────────────────────────────────────────────
  const toggleBtn = document.getElementById('queryAdvancedToggle');
  const drawer = document.getElementById('advancedDrawer');

  if (toggleBtn && drawer) {
    let drawerMounted = false;

    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      drawer.setAttribute('aria-hidden', String(!isOpen));

      if (isOpen && !drawerMounted) {
        mountFilterPanel(
          drawer,
          deps.sceneObjects,
          deps.onGroupModeChange ?? (() => {}),
          deps.onExitFocus,
          { hideModeSwitcher: true },
        );
        drawerMounted = true;
      }
    });
  }
```

**showWelcomeBack function signature to DELETE** (lines 259–298):
```typescript
export function showWelcomeBack(store: ShortlistStore, readoutEl: HTMLElement): void {
  const entries = store.entries();
  if (entries.length === 0) return;
  // ... 40 lines of logic ...
  readoutEl.textContent = `Welcome back. ${entries.length} reading${entries.length > 1 ? 's' : ''} in your list, last added ${timeStr}.`;
  // ...
}
```

---

### `src/main.ts` — Boot orchestrator (reshape)

**Import statement to DELETE** (line 19):
```typescript
import { mountQueryBar, showWelcomeBack } from './ui/query-bar';
```

**mountFilterPanel call site** (lines 256–261) — UPDATE ONLY:
```typescript
// CURRENT (lines 256–261):
const filterPanelEl = document.getElementById('filters') as HTMLElement;
mountFilterPanel(filterPanelEl, sceneObjects, (newMode) => {
  regroupScene(sceneObjects, newMode, scene);
}, () => {
  exitFocus();
});

// AFTER PHASE 18: Add `cases` and `onFilterChange` deps
const filterPanelEl = document.getElementById('filters') as HTMLElement;
mountFilterPanel(filterPanelEl, sceneObjects, (newMode) => {
  regroupScene(sceneObjects, newMode, scene);
}, () => {
  exitFocus();
}, cases, () => { /* label sync handled by tick loop */ });
```

**mountQueryBar call site to DELETE** (lines 684–691):
```typescript
// DELETE THIS ENTIRE BLOCK:
mountQueryBar({
  sceneObjects,
  filterState: sceneObjects.filterState,
  cases,
  onFilterChange: () => { /* label sync handled by tick loop */ },
  onGroupModeChange: (newMode) => { regroupScene(sceneObjects, newMode, scene); },
  onExitFocus: () => { exitFocus(); },
});
```

**showWelcomeBack call site to DELETE** (lines 694–697):
```typescript
// DELETE THIS ENTIRE BLOCK:
const queryReadout = document.getElementById('queryReadout') as HTMLElement | null;
if (queryReadout) {
  showWelcomeBack(shortlistStore, queryReadout);
}
```

**Visibility gate at overture-complete** (lines 243–251) — ADD unified-column visibility here:
```typescript
// CURRENT (lines 243–251):
if (prev.kind === 'planetary' && next.kind === 'global') {
  choreographer.choreographPlanetaryToGlobal(sceneObjects, planetGroup, {
    onComplete: () => {
      overtureComplete = true;
      overtureCompleteRef.value = true;
      elControls.classList.add('on');  // <-- grouping switcher visible in global
    },
  });
}

// AFTER PHASE 18: Also set `.filters-wrap.on` here (not just in enterConstellation)
if (prev.kind === 'planetary' && next.kind === 'global') {
  choreographer.choreographPlanetaryToGlobal(sceneObjects, planetGroup, {
    onComplete: () => {
      overtureComplete = true;
      overtureCompleteRef.value = true;
      elControls.classList.add('on');
      elFiltersWrap.classList.add('on');  // <-- NEW: unified column visible in global (collapsed-to-tab)
    },
  });
}
```

---

### `index.html` — DOM template (delete blocks, preserve shell)

**DELETE `#queryWrap` block entirely** (lines 136–154):
```html
<!-- DELETE LINES 136–154: -->
<div class="query-wrap" id="queryWrap">
  <div class="query-bar">
    <input type="text" id="queryInput" role="searchbox"
           aria-label="Case library query"
           placeholder="What kind of proof do you need?"
           autocomplete="off"/>
    <span class="query-readout" id="queryReadout" aria-live="polite"></span>
    <button class="query-clear" id="queryClear" aria-label="Clear query">×</button>
  </div>
  <div class="query-hint" id="queryHint" aria-live="polite"></div>
  <div class="query-history" id="queryHistory"></div>
  <button class="query-advanced-toggle" id="queryAdvancedToggle"
          aria-expanded="false" aria-controls="advancedDrawer">
    ADVANCED
  </button>
  <div class="advanced-drawer" id="advancedDrawer" aria-hidden="true">
    <!-- mountFilterPanel renders here -->
  </div>
</div>
```

**CLEAN `<aside class="filters">` orphaned DOM** (lines 82–110) — preserve shell, delete obsolete children:
```html
<!-- KEEP THIS SHELL (line 76–81): -->
<div class="filters-wrap" id="filtersWrap">
  <div class="filters-tab" id="filtersTab">
    <span class="ft-icon">◀</span>
    <span>Filter</span>
  </div>
  <!-- KEEP THE ASIDE SHELL, DELETE ITS CONTENT -->
  <aside class="filters" id="filters">
    <!-- DELETE LINES 82–109 (all the stubs): -->
    <!-- <div class="filters-head">
         <h3>Filter + Arrange</h3>
         <button class="clr" id="filterClear">Reset</button>
       </div>
       <div class="f-search">
         <svg class="fsi" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
           <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>
         </svg>
         <input type="text" id="searchInput" placeholder="Search client, service, keyword…" autocomplete="off"/>
         <button class="fsc" id="searchClear">×</button>
       </div>
       <div class="filters-body">
         <div class="fgroup" id="fg-year">
           <h4>Year</h4>
           <div class="fchips" id="fc-year"></div>
         </div>
         <div class="fgroup" id="fg-scope">
           <h4>Scope</h4>
           <div class="fchips" id="fc-scope"></div>
         </div>
         <div class="fgroup" id="fg-service">
           <h4>Service</h4>
           <div class="fchips" id="fc-service"></div>
         </div>
       </div>
       <div class="filters-foot">
         <div class="f-stat"><span>Matching</span><b id="f-count">—</b></div>
       </div> -->
  </aside>
</div>
```

**Ring-switcher gate** (line 166) — CHANGE the conditional class:
```html
<!-- CURRENT (line 166): -->
<div id="ring-switcher" class="ring-switcher cc-constellation-only" aria-label="Ring dimension"></div>

<!-- AFTER PHASE 18: Remove .cc-constellation-only gate (D-12) so it's always visible post-overture -->
<div id="ring-switcher" class="ring-switcher" aria-label="Ring dimension"></div>
```

---

### `src/style.css` — Visual layer (delete + restyle)

**DELETE query-bar CSS block** (lines 228–390 approximately, per D-16):

Line ranges to delete:
- **`.query-wrap`** (lines 229–238)
- **`.query-bar`** (lines 239–248)
- **`#queryInput`** (lines 250–263)
- **`.query-readout`** + **`.query-readout.welcome-back`** (lines 265–278)
- **`.query-clear`** + **`.query-clear.visible`** (lines 279–293)
- **`.query-hint`** section (lines 296–336)
- **`.query-history`** + **`.query-chip`** (lines 340–361)
- **`.query-advanced-toggle`** + **`.advanced-drawer`** (lines 364–393)

**DELETE media-query overrides**:
- **`.comparison-active .query-wrap`** (line 1459)
- **`.comparison-active .advanced-drawer`** (line 1460)
- **`body.planetary #queryWrap`** (line 1506)

**PRESERVE `.filters-*` styles** (lines 548–589):
```css
/* Lines 548–589 STAY: */
.filters-wrap{position:fixed;z-index:9;left:0;top:128px;bottom:110px;
  display:none;align-items:flex-start;opacity:1;transform:translateX(0)}
.filters-wrap.on{display:flex}

.filters-tab{flex-shrink:0;
  writing-mode:vertical-rl;text-orientation:mixed;
  background:#0E1020;border:1px solid rgba(255,255,255,.08);
  width:28px;padding:10px 8px;gap:8px;
  color:rgba(255,255,255,.35);font-size:9px;text-transform:uppercase;font-weight:700;
  transition:background .2s,color .2s;user-select:none;
  display:flex;flex-direction:column;align-items:center;gap:10px}
.filters-tab:hover{background:#141828;color:#fff}

.filters-tab .ft-icon{font-size:11px;letter-spacing:0;writing-mode:initial;
  transform:rotate(0deg);transition:transform .35s var(--ease)}
.filters-wrap.collapsed .ft-icon{transform:rotate(180deg)}

.filters{width:232px;display:flex;flex-direction:column;
  background:#0B0C10;border:1px solid rgba(94,207,192,.08);
  border-left:none;gap:6px;padding:0;
  overflow:hidden;height:100%;
  transition:width .4s var(--ease),opacity .35s var(--ease)}
.filters-wrap.collapsed .filters{width:0;opacity:0;pointer-events:none}
```

**PRESERVE `.cc-constellation-only` CSS gate** (lines 758–760):
```css
/* Lines 758–760 STAY, BUT gates will change due to HTML class removal (D-12) */
.cc-constellation-only{display:none}
body.constellation .cc-constellation-only{display:block;margin-top:12px;
  padding-top:12px;border-top:1px solid rgba(255,255,255,.06)}
```

After the HTML change (removing `.cc-constellation-only` from `#ring-switcher`), these CSS rules will no longer apply to the ring-switcher, which is the intent — it will always be visible post-overture.

**PRESERVE `body.planetary` hide** (line 1505):
```css
/* Lines 1504–1508 STAY: */
body.planetary #crumb,
body.planetary #filtersWrap,
/* body.planetary #queryWrap, */  // <-- DELETE this line
body.planetary #homeBtn,
body.planetary #cosmoControls,
```

---

### `src/ui/filter-panel.test.ts` — Test structure (keep existing + split)

**Existing test structure** (lines 1–50) — this pattern STAYS:
```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountFilterPanel } from './filter-panel';
import { createFilterState } from '../data/filter';
import type { SceneObjects } from '../scene/scene-state';
// ... other imports ...

// Fixtures (EnrichedCaseStudy stubs)
const e1: EnrichedCaseStudy = { ... };
const e2: EnrichedCaseStudy = { ... };

// Helper to build SceneObjects stub
function makeObjects(overrides: Partial<SceneObjects> = {}): SceneObjects {
  return {
    nucleusMeshes: new Map(),
    nucleusLabels: new Map(),
    starMeshes: [],
    // ... etc ...
  };
}

describe('Filter Panel', () => {
  describe('Facet rendering', () => { ... });
  describe('Chip clicks', () => { ... });
  describe('Accordion toggle', () => { ... });
  // ... existing tests stay ...
});
```

**NEW file `unified-column.test.ts`** — integration tests for input + history + hint (D-19):
- Input changes → FilterState.searchText → readout updates
- Enter key → wave trigger + history save
- Escape key → clear input + cancel debounce
- History chip click → populate input + apply
- Hint state transitions (empty, no-match, match)
- Auto-expand on `ENTER_CONSTELLATION`, re-collapse on `EXIT_CONSTELLATION`

Structure pattern same as filter-panel.test.ts (fixtures + helpers + describe blocks).

---

## Unchanged References (No Changes Needed)

### `src/data/filter.ts`
**Interfaces** (unchanged):
```typescript
export interface FilterState {
  countries: Set<string>;
  services: Set<string>;
  years: Set<number>;
  nucleusKeys: Set<string>;
  proofTypes: Set<string>;
  impactBands: Set<string>;
  searchText?: string;
  isActive(): boolean;
}
```

**Functions** (unchanged):
```typescript
export function createFilterState(): FilterState
export function matchesFilter(c: CaseStudy, f: FilterState): boolean
```

### `src/data/keyword-map.ts`
**Function** (unchanged):
```typescript
export function applyQuery(q: string, fs: FilterState, cases: CaseStudy[]): void
```

### `src/data/persistence.ts`
**Functions** (unchanged):
```typescript
export function loadQueryHistory(): string[]
export function addQueryToHistory(query: string): void
```

### `src/data/view-state.ts`
**Interfaces & Events** (unchanged):
```typescript
export type ViewEvent =
  | { type: 'ENTER_FIELD' }
  | { type: 'ENTER_CONSTELLATION'; nucleusKey: string }
  | { type: 'EXIT_CONSTELLATION' }
  | { type: 'OPEN_READING'; caseId: string }
  | { type: 'CLOSE_READING' };

export interface ViewStateMachine {
  getState(): ViewState;
  dispatch(event: ViewEvent): void;
  subscribe(listener: ViewStateListener): () => void;
}
```

---

## Shared Patterns Across Phase 18

### Input + Readout + Hint Choreography
**Pattern reused from query-bar.ts:**
- Debounced `handleInput()` (80ms)
- Immediate readout update on input change
- Hint state (empty, no-match, match) tied to `matchCount` and `searchText`
- `applySuggestion(term)` callback wires no-match suggestion chips

### Event Wiring Pattern
**Reuse from filter-panel.ts bindEvents()** (lines 203–290):
- Accordion toggle via `.fgroup-header` click
- Chip click → toggle in FilterState → render
- Reset/clear buttons → `clearFilter()` → render
- Mode chips → `onGroupModeChange` callback

### View-State Listener Pattern
**New in Phase 18, added to filter-panel.ts:**
```typescript
viewState.subscribe((next, prev, event) => {
  if (event.type === 'ENTER_CONSTELLATION') {
    container.parentElement?.classList.remove('collapsed');
  } else if (event.type === 'EXIT_CONSTELLATION') {
    container.parentElement?.classList.add('collapsed');
  }
});
```

---

## Integration Seams (Cross-phase)

### Phase 19: Text-Input-Drives-Stars
- **Seam:** Input element wiring established in Phase 18 (debounce, history, applyQuery)
- **Do not pre-build:** Star visual response (motion, brightness); Phase 19 adds that
- **Preserved:** `applyFilterWave()` behavior stays unchanged in Phase 18

### Phase 20: Gather as Staging Action
- **Seam:** `applyFilterWave()` behavior in Phase 18 is the baseline; Phase 20 strips it
- **Do not pre-build:** Gather-click-only highlight; Phase 20 handles that

### Phase 21: Reading Panel → Right Drawer
- **Seam:** Left column geometry (232px, collapsed-to-tab in global, expanded in constellation) is compatible with both current overlay and Phase 21 drawer
- **Do not pre-build:** Right drawer geometry; stays orthogonal to left column

---

## Metadata

**Analog search scope:** `src/ui/`, `src/data/`, `src/main.ts`, `index.html`, `src/style.css`
**Files scanned:** 10 files
**Lines analyzed:** ~1,600 lines across all files
**Pattern extraction date:** 2026-04-19
**Context canonical source:** `.planning/phases/18-unified-left-column/18-CONTEXT.md` (lines 22–103, decisions D-01 through D-19)

