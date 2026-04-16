# Phase 10: Query Bar — Research

**Researched:** 2026-04-16
**Domain:** Conversational query input, keyword→dimension mapping, FilterState integration, wave propagation, Advanced drawer
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QRY-01 | Central conversational input with first-person declarative placeholder, DM Mono, centered, always visible | DOM insertion point identified, z-index slot confirmed (~10), CSS token system documented |
| QRY-02 | Keyword→dimension mapping: recognized terms apply FilterState dimensions; unmatched terms fall back to full-text search across client/title/challenge/approach | v3-starmap KeywordHint pattern is the spec; FilterState.searchText extension required; matchesFilter() extension required |
| QRY-03 | Live wave-propagation field response within 800ms: staggered GSAP opacity, distance-sorted from matching cluster nuclei, ~600ms total | Third applyFilter() code path required; GSAP 3.12 stagger pattern documented; existing two branches documented with exact code |
| QRY-04 | N MATCHES + M CLUSTERS readout updates live on every keystroke | N = matchesFilter count across all 116 cases; M = nucleusOrbits keys with ≥1 matching case; formula confirmed |
| QRY-05 | Advanced drawer exposes v3.1 filter-panel functionality at equal fidelity; mode-chip (orbit-by) excluded | mountFilterPanel() reuse pattern identified; exclusion of mode-chip row documented; new DOM container required |
| QRY-06 | Clear/reset: × button clears query + resets FilterState, restores idle starfield | Clear wires to createFilterState() reset; × button visibility on non-empty input |
| QRY-07 | Keyboard-complete flow: Tab to input, type, Enter submits, Tab to drawer, Esc closes drawer; no mouse required | ARIA role="search", aria-label, aria-live readout region for screen readers |
| QRY-08 | Remove #globalSearch bare element; query bar replaces it | #globalSearch + #globalSearchClear are bare elements in index.html — straightforward removal |
</phase_requirements>

---

## Summary

Phase 10 installs the primary interaction surface of the observatory: a centered, conversational query input that replaces the legacy `#globalSearch` bare element. The core architectural challenge is **integration via FilterState**, not direct opacity manipulation. The existing `#globalSearch` handler (lines 522–537 in main.ts) sets `mat.opacity` directly on star meshes, bypassing the StarState precedence chain — this pattern must not be followed. The query bar must route through `FilterState` + `applyFilter()` so that reading/selected/ghost states are respected.

Two non-trivial pieces of new infrastructure are required. First, `FilterState` has no `searchText` field — adding it and extending `matchesFilter()` to check client/title/challenge/approach enables the full-text fallback (QRY-02). Second, `applyFilter()` currently has two branches (global mode → staging sphere, focused mode → GSAP dim with no stagger) — the query bar needs a third mode-agnostic branch with distance-sorted staggered GSAP opacity animation (~600ms total propagation) for QRY-03. The v3-starmap `query-input.ts` (commit c7f8aa2) is the keyword mapping spec reference; its dimension names (`industries`, `capabilities`) must be remapped to phase-1c's dimensions (`services`, `countries`, `proofTypes`, `impactBands`).

The Advanced drawer (QRY-05) reuses `mountFilterPanel()` rendering logic in a new DOM container but must exclude the `mode-chip` row (the orbit-by switcher), which belongs only in the ring-switcher. The M CLUSTERS readout iterates `sceneObjects.nucleusOrbits` keys, counting those where at least one case passes `matchesFilter()`.

**Primary recommendation:** Build the FilterState extension (searchText + matchesFilter update) and the third applyFilter() branch as discrete, test-isolated units first. The keyword mapping table and the wave propagation animation are the two highest-risk pieces — verify both independently before wiring the full query bar component.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSAP | ^3.12.0 | Wave propagation stagger animation | Already in package.json; all existing star transitions use it |
| Three.js | ^0.170.0 | Star mesh opacity targets; userData.starState access | Canonical scene library; star meshes are THREE.Mesh instances |
| Vitest | 2.0 | Unit tests for FilterState extension, keyword mapping, M CLUSTERS formula | Already configured; `vitest run` is the test command |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| DM Mono | Google Fonts (loaded) | Query input typography | All observatory readouts; already loaded in index.html |
| CSS custom properties | Native | Tokens: --teal, --gold, --bg, --ease | All new CSS must use existing tokens, not raw hex values |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP stagger | CSS transition with JS delay loop | GSAP provides cleaner interrupt handling when query changes mid-animation; CSS transitions would require manual cleanup |
| Extending matchesFilter() | Separate search function | Extension keeps filtering unified; separate function risks divergence between filter chips and text search results |

**Installation:** No new packages needed. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure

New files for this phase:

```
src/
├── ui/
│   ├── query-bar.ts          # Query bar component: mount, keyword mapping, event wiring
│   └── filter-panel.ts       # Existing — Advanced drawer reuses its rendering logic
├── data/
│   ├── filter.ts             # Extend FilterState + matchesFilter() for searchText
│   └── keyword-map.ts        # Keyword→FilterState mapping table (new file)
├── scene/
│   └── scene-state.ts        # Extend applyFilter() with third wave-propagation branch
```

Tests:
```
src/tests/
├── keyword-map.test.ts        # Keyword→dimension mapping unit tests
├── filter-searchtext.test.ts  # FilterState searchText extension tests
└── clusters-count.test.ts     # M CLUSTERS formula tests
```

### Pattern 1: FilterState Extension (QRY-02)

**What:** Add `searchText?: string` to FilterState. Extend `matchesFilter()` to check it against `client`, `title`, `challenge`, `approach` when no keyword dimension matched.

**When to use:** Every query that produces no keyword match falls through to this.

**Exact current FilterState in `src/data/filter.ts`:**
```typescript
export interface FilterState {
  countries: Set<string>;
  services: Set<string>;
  years: Set<number>;
  nucleusKeys: Set<string>;
  proofTypes: Set<string>;
  impactBands: Set<string>;
  // searchText field MISSING — must be added
}

export function matchesFilter(c: CaseStudy, f: FilterState): boolean {
  // current: checks 5 dimensions, no text search
  // must add: if f.searchText, check c.client, c.title, c.challenge, c.approach
}
```

**Extension pattern:**
```typescript
export interface FilterState {
  countries: Set<string>;
  services: Set<string>;
  years: Set<number>;
  nucleusKeys: Set<string>;
  proofTypes: Set<string>;
  impactBands: Set<string>;
  searchText?: string;  // ADD: full-text fallback
}

// In matchesFilter(), add after existing dimension checks:
if (f.searchText) {
  const q = f.searchText.toLowerCase();
  const hit = [c.client, c.title, c.challenge ?? '', c.approach ?? '']
    .some(s => s.toLowerCase().includes(q));
  if (!hit) return false;
}
```

### Pattern 2: Keyword Mapping (QRY-02)

**What:** Table mapping natural-language terms to FilterState mutations. Based on v3-starmap spec (commit c7f8aa2), adapted for phase-1c dimensions.

**v3-starmap KeywordHint pattern (spec reference):**
```typescript
interface KeywordHint {
  keywords: string[]
  apply: (fs: FilterState) => void
}
const HINTS: KeywordHint[] = [
  { keywords: ['fintech', 'finance', ...], apply: fs => fs.services.add('Finance & Insurance') },
]
function applyQuery(q: string, filterState: FilterState): void {
  // 1. Clear all filter sets (preserve searchText)
  // 2. Normalize query
  // 3. Apply all matching HINTS
  // 4. If no hints matched, set filterState.searchText = q
  // 5. Trigger applyFilter()
}
```

**Phase-1c dimension values (from cases.json + src/data/proof-type.ts):**

Services (19 unique, from SERVICE_TO_VERTICAL in grouping.ts):
- Brand Strategy, Campaign Strategy, Content Strategy, Data Analytics, Digital Marketing, E-commerce, Email Marketing, Influencer Marketing, Market Research, Media Planning, Paid Media, Performance Marketing, PR & Communications, Programmatic, Search (SEO/SEM), Social Media, UX & Web, Video Production, Other

ProofTypes: Revenue | Conversion | Awareness | CostEfficiency | Engagement

ImpactBands: incremental | notable | significant | transformative | unknown

Regions (for country-level resolution): Americas | Asia-Pacific | Europe

**Keyword mapping table to build in `src/data/keyword-map.ts`:**
```typescript
// Pattern: match against normalized query words/phrases
const KEYWORD_HINTS: KeywordHint[] = [
  // Service dimensions
  { keywords: ['performance', 'paid', 'ppc', 'sem'], apply: fs => fs.services.add('Performance Marketing').add('Paid Media') },
  { keywords: ['social', 'social media', 'instagram', 'tiktok'], apply: fs => fs.services.add('Social Media') },
  { keywords: ['seo', 'search', 'organic'], apply: fs => fs.services.add('Search (SEO/SEM)') },
  { keywords: ['brand', 'branding'], apply: fs => fs.services.add('Brand Strategy') },
  { keywords: ['data', 'analytics', 'insight'], apply: fs => fs.services.add('Data Analytics') },
  { keywords: ['content'], apply: fs => fs.services.add('Content Strategy') },
  { keywords: ['influencer'], apply: fs => fs.services.add('Influencer Marketing') },
  { keywords: ['programmatic', 'display'], apply: fs => fs.services.add('Programmatic') },
  { keywords: ['email', 'crm', 'retention'], apply: fs => fs.services.add('Email Marketing') },
  { keywords: ['video', 'production'], apply: fs => fs.services.add('Video Production') },
  { keywords: ['ecommerce', 'e-commerce', 'commerce'], apply: fs => fs.services.add('E-commerce') },
  { keywords: ['research', 'study', 'survey'], apply: fs => fs.services.add('Market Research') },
  { keywords: ['ux', 'web', 'digital'], apply: fs => fs.services.add('UX & Web') },
  // ProofType dimensions
  { keywords: ['revenue', 'sales', 'growth', 'roi', 'return'], apply: fs => fs.proofTypes.add('Revenue') },
  { keywords: ['conversion', 'convert', 'lead'], apply: fs => fs.proofTypes.add('Conversion') },
  { keywords: ['awareness', 'brand lift', 'reach'], apply: fs => fs.proofTypes.add('Awareness') },
  { keywords: ['efficiency', 'cost', 'saving', 'cpa'], apply: fs => fs.proofTypes.add('CostEfficiency') },
  { keywords: ['engagement', 'community', 'audience'], apply: fs => fs.proofTypes.add('Engagement') },
  // ImpactBand dimensions
  { keywords: ['transformative', 'breakthrough', 'game-changing'], apply: fs => fs.impactBands.add('transformative') },
  { keywords: ['significant', 'major'], apply: fs => fs.impactBands.add('significant') },
  // Year dimensions
  { keywords: ['2024', 'last year', '24'], apply: fs => fs.years.add(2024) },
  { keywords: ['2025', '25'], apply: fs => fs.years.add(2025) },
  { keywords: ['2026', 'this year', '26'], apply: fs => fs.years.add(2026) },
  // Region → country expansion (resolve at query time, not stored as region in FilterState)
  // Americas cases: countries from cases.json where region === 'Americas'
  // Asia-Pacific: countries where region === 'Asia-Pacific'
  // Europe: countries where region === 'Europe'
];
```

Note: `nucleusKeys` are NOT exposed in query mapping. They remain an internal dimension for the ring-switcher only.

### Pattern 3: Wave Propagation (QRY-03)

**What:** Third `applyFilter()` branch. Mode-agnostic. Stagger GSAP opacity on all star meshes, sorted by proximity to matching cluster nuclei, ~600ms total.

**Why a third branch:** Current branches are:
1. Global mode → creates staging sphere (wrong for query bar — must not activate gathering visual)
2. Focused mode → GSAP `duration: 0.2` no stagger (too instant, no wave feeling)

**Pattern from scene-state.ts (current focused branch, for reference):**
```typescript
// Current focused-mode branch (lines in applyFilter()):
gsap.to(mat, { opacity: targetOpacity, duration: 0.2, ease: 'power2.out' });
```

**New wave-propagation branch for query bar:**
```typescript
// Third branch: mode-agnostic wave propagation
// Triggered when queryBarActive === true (new flag on SceneState or passed as parameter)
function applyFilterWave(sceneObjects: SceneObjects, filterState: FilterState): void {
  const matchingNuclei: THREE.Vector3[] = [];
  
  // 1. Collect positions of matching cluster nuclei
  for (const [key, nucOrbit] of Object.entries(sceneObjects.nucleusOrbits)) {
    const hasMatch = nucOrbit.cases.some(c => matchesFilter(c, filterState));
    if (hasMatch) matchingNuclei.push(nucOrbit.nucleus.position.clone());
  }
  
  // 2. Sort stars by minimum distance to nearest matching nucleus
  const sorted = [...sceneObjects.starMeshes].sort((a, b) => {
    const distA = matchingNuclei.reduce((min, np) => 
      Math.min(min, a.position.distanceTo(np)), Infinity);
    const distB = matchingNuclei.reduce((min, np) => 
      Math.min(min, b.position.distanceTo(np)), Infinity);
    return distA - distB;
  });
  
  // 3. Staggered GSAP: ~600ms total propagation
  const TOTAL_MS = 600;
  sorted.forEach((star, i) => {
    const delay = (i / sorted.length) * (TOTAL_MS / 1000);
    const c = star.userData.caseStudy as CaseStudy;
    const matches = matchesFilter(c, filterState);
    // Respect StarState precedence: reading > selected > ghost > filterMatch/filterDim
    const currentState = star.userData.starState as StarState;
    if (currentState === 'reading' || currentState === 'selected' || currentState === 'ghost') return;
    const targetOpacity = matches ? 0.85 : 0.12;
    star.userData.starState = matches ? 'filterMatch' : 'filterDim';
    const mat = star.material as THREE.MeshBasicMaterial;
    gsap.to(mat, { opacity: targetOpacity, duration: 0.15, delay, ease: 'power2.out' });
  });
}
```

**Empty query reset:** When query is cleared, call `applyFilter()` with `createFilterState()` (all empty sets, no searchText) to restore `idle` state (opacity 0.85) on all non-reading/selected/ghost stars.

### Pattern 4: N MATCHES + M CLUSTERS Readout (QRY-04)

**N MATCHES:**
```typescript
const n = sceneObjects.starMeshes.filter(star => 
  matchesFilter(star.userData.caseStudy as CaseStudy, filterState)
).length;
```

**M CLUSTERS:**
```typescript
const m = Object.values(sceneObjects.nucleusOrbits).filter(nucOrbit =>
  nucOrbit.cases.some(c => matchesFilter(c, filterState))
).length;
```

Update both on every `input` event (debounce to ~80ms for performance).

**Readout format (DM Mono):**
```
116 CASES · 7 CLUSTERS       ← empty state
32 CASES · 4 CLUSTERS        ← active filter
```

### Pattern 5: Advanced Drawer (QRY-05)

**What:** `mountFilterPanel()` rendering logic reused in a new DOM container that slides down from the query bar. The mode-chip row (orbit-by switcher) MUST be excluded.

**Problem:** `mountFilterPanel()` currently renders the mode-chip row in global mode as part of the panel. The drawer must not contain it.

**Solutions (two approaches, planner picks):**

Option A — Add a flag to mountFilterPanel():
```typescript
// Add optional param to exclude mode-chip:
export function mountFilterPanel(
  container: HTMLElement,
  objects: SceneObjects,
  onGroupModeChange: (mode: GroupMode) => void,
  onExitFocus: () => void,
  options?: { hideModeSwitcher?: boolean }  // ADD
): FilterPanelHandle
```

Option B — Extract accordion rendering into sub-functions:
```typescript
// Separate renderFilterAccordions() from renderModeSwitcher()
// Advanced drawer calls only renderFilterAccordions()
```

Option A is lower-risk (additive, doesn't restructure filter-panel.ts). Option B is cleaner long-term.

**DOM structure for drawer:**
```html
<div class="query-wrap" id="queryWrap">
  <div class="query-bar">
    <input type="text" id="queryInput" role="searchbox" 
           placeholder="Search the cosmos…" autocomplete="off"/>
    <span class="query-readout" id="queryReadout">116 CASES · 7 CLUSTERS</span>
    <button class="query-clear" id="queryClear" aria-label="Clear query">×</button>
    <button class="query-advanced-toggle" id="queryAdvancedToggle" 
            aria-expanded="false" aria-controls="advancedDrawer">
      ADVANCED
    </button>
  </div>
  <div class="advanced-drawer" id="advancedDrawer" aria-hidden="true">
    <!-- mountFilterPanel() renders here, mode-chip excluded -->
  </div>
</div>
```

**z-index:** `query-wrap` at z-index 10 (same layer as wordmark-corner and crumb).

### Pattern 6: DOM Cleanup (QRY-08)

**Remove from index.html:**
```html
<!-- DELETE these bare elements: -->
<input type="text" id="globalSearch" placeholder="Search cases…" autocomplete="off"/>
<button class="sc" id="globalSearchClear">×</button>
```

**Remove from main.ts:** The `#globalSearch` event handler block (lines 522–537) and its element reference.

**Remove from style.css:** `.search-wrap`, `.sc` selectors associated with the old global search.

### Anti-Patterns to Avoid

- **Direct mat.opacity manipulation for query filtering:** The `#globalSearch` pattern (lines 522–537 main.ts) sets `mat.opacity` directly. This bypasses StarState precedence. Never follow this pattern.
- **Activating staging sphere on query:** The global-mode `applyFilter()` branch creates a staging sphere (gather visual). Query filtering must not trigger this.
- **Exposing nucleusKeys in keyword mapping:** nucleusKeys is an internal grouping dimension. It maps to the ring-switcher orbit mode, not to user vocabulary.
- **Mode-chip in Advanced drawer:** The orbit-by switcher (vertical/country/region) belongs in `#ring-switcher` only. Including it in the drawer would create two competing orbit mode controls.
- **Polling for readout updates:** Update N/M readout on input event with debounce, not on animation frame.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation stagger | Manual setTimeout loops | GSAP `delay` per tween | GSAP handles interrupt/kill on rapid input; setTimeout stack doesn't |
| Filter text matching | Custom tokenizer | String.includes() + toLowerCase() | Cases are short, 116 total; no fuzzy/stemming needed |
| Keyword parsing | Regex engine | Array.some(kw => q.includes(kw)) | Simple substring match on normalized query is sufficient |
| Debounce | Third-party library | 4-line inline debounce | No dependency needed for one input handler |
| Accordion UI | Custom expand/collapse | Reuse existing filter-panel.ts functions | Filter panel already has working accordion; reuse reduces drift |

**Key insight:** The keyword mapping is a simple lookup table, not NLP. The visual complexity is in wave propagation, not query parsing.

---

## Common Pitfalls

### Pitfall 1: Following the #globalSearch pattern
**What goes wrong:** Query bar sets `mat.opacity` directly on star meshes, ignoring `userData.starState`. A star in `reading` state (gold, opacity 1.0) gets dimmed by the query filter.
**Why it happens:** The `#globalSearch` handler is the most visible search example in main.ts.
**How to avoid:** Route ALL opacity changes through `userData.starState` + `applyFilter()`. Check `star.userData.starState` before any opacity mutation.
**Warning signs:** Reading panel stays open but star turns dim when typing.

### Pitfall 2: Triggering the staging sphere branch
**What goes wrong:** `applyFilter()` called in global mode activates the staging sphere (gather visual). Typing in the query bar summons the gather animation unexpectedly.
**Why it happens:** `applyFilter()` checks current mode and branches. If `isGlobalMode` is true when query bar triggers it, staging sphere activates.
**How to avoid:** Either (a) add a `queryBarActive` flag that bypasses the staging-sphere branch, or (b) call the new `applyFilterWave()` function directly from the query bar handler, not `applyFilter()`.
**Warning signs:** Gather stage appears when typing.

### Pitfall 3: mode-chip leaking into Advanced drawer
**What goes wrong:** `mountFilterPanel()` renders the orbit-by switcher (vertical/country/region) inside the Advanced drawer. User can now change orbit mode from two places.
**Why it happens:** `mountFilterPanel()` renders mode-chip as part of its normal output in global mode.
**How to avoid:** Pass `hideModeSwitcher: true` option to `mountFilterPanel()` when mounting in the drawer context, or extract accordion rendering separately.
**Warning signs:** "View by vertical / country / region" appears inside the drawer.

### Pitfall 4: FilterState mutation without clearing
**What goes wrong:** Second query appends to first query's dimension sets. `fintech growth` adds Finance services AND Growth (revenue) — then typing `brand` adds Brand Strategy without clearing Finance.
**Why it happens:** `applyQuery()` doesn't clear dimension sets between calls.
**How to avoid:** Clear all filter sets at the start of `applyQuery()` before applying new keyword hints. Pattern from v3-starmap spec.
**Warning signs:** Filter shows cumulative intersection from multiple queries.

### Pitfall 5: N/M readout lag on rapid typing
**What goes wrong:** Readout is visually stale because it updates on wave animation completion rather than immediately.
**Why it happens:** Updating readout inside the animation callback.
**How to avoid:** Calculate N and M synchronously on input event, update readout text immediately before starting wave animation.
**Warning signs:** Readout shows 0 CASES during wave animation.

### Pitfall 6: searchText set when keyword was matched
**What goes wrong:** Query `fintech growth` matches keyword hints AND sets `searchText = 'fintech growth'`. Full-text search then further restricts matches.
**Why it happens:** `searchText` set unconditionally.
**How to avoid:** Only set `searchText` when NO keyword hints matched. The fallback is exclusive.
**Warning signs:** Keyword match + full-text search double-filters, producing fewer results than expected.

---

## Code Examples

Verified patterns from codebase investigation:

### Existing applyFilter() branch structure (src/scene/scene-state.ts)
```typescript
// Current two branches — do not modify, add THIRD branch alongside:
export function applyFilter(objects: SceneObjects, filterState: FilterState): void {
  if (isGlobalMode(objects)) {
    // Branch 1: staging sphere (gather visual) — DO NOT trigger from query bar
    activateStagingSphere(objects, filterState);
  } else {
    // Branch 2: focused mode GSAP (no stagger, duration 0.2)
    for (const star of objects.starMeshes) {
      const c = star.userData.caseStudy as CaseStudy;
      const mat = star.material as THREE.MeshBasicMaterial;
      const matches = matchesFilter(c, filterState);
      const targetOpacity = matches ? 0.85 : 0.12;
      gsap.to(mat, { opacity: targetOpacity, duration: 0.2, ease: 'power2.out' });
    }
  }
}
// ADD: applyFilterWave() as a new exported function, called directly from query bar
```

### Current FilterState (src/data/filter.ts — current, before extension)
```typescript
export interface FilterState {
  countries: Set<string>;
  services: Set<string>;
  years: Set<number>;
  nucleusKeys: Set<string>;
  proofTypes: Set<string>;
  impactBands: Set<string>;
  // NO searchText — must add
}

export function createFilterState(): FilterState {
  return {
    countries: new Set(),
    services: new Set(),
    years: new Set(),
    nucleusKeys: new Set(),
    proofTypes: new Set(),
    impactBands: new Set(),
  };
}
```

### StarState precedence (src/data/star-state.ts — exact values)
```typescript
export type StarState = 'reading' | 'selected' | 'ghost' | 'filterMatch' | 'filterDim' | 'idle';
const APPEARANCE: Record<StarState, StarAppearance> = {
  reading:     { opacity: 1.0,  colorOverride: 0xe8b15a },  // gold
  selected:    { opacity: 1.0 },
  ghost:       { opacity: 0.25 },
  filterMatch: { opacity: 0.85 },
  filterDim:   { opacity: 0.12 },
  idle:        { opacity: 0.85 },
};
// Precedence: reading > selected > ghost > filterMatch/filterDim > idle
// Query bar must skip stars with state: reading | selected | ghost
```

### CSS tokens (src/style.css — confirmed)
```css
:root {
  --teal: #5ecfc0;
  --gold: #e8b15a;
  --bg:   #0B0C10;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
/* Query bar uses DM Mono (loaded), --teal for active state, --gold for readout */
/* z-index slot: 10 (same as wordmark-corner, crumb) */
```

### v3-starmap applyQuery pattern (commit c7f8aa2 — spec reference, adapted)
```typescript
// v3-starmap pattern (dimensions remapped to phase-1c):
function applyQuery(q: string, filterState: FilterState, cases: CaseStudy[]): void {
  // 1. Normalize
  const norm = q.trim().toLowerCase();
  
  // 2. Clear all dimension sets
  filterState.services = new Set();
  filterState.countries = new Set();
  filterState.years = new Set();
  filterState.proofTypes = new Set();
  filterState.impactBands = new Set();
  delete filterState.searchText;
  
  // 3. Apply all matching keyword hints
  let anyHintMatched = false;
  for (const hint of KEYWORD_HINTS) {
    if (hint.keywords.some(kw => norm.includes(kw))) {
      hint.apply(filterState);
      anyHintMatched = true;
    }
  }
  
  // 4. Full-text fallback only if no keyword hint matched
  if (!anyHintMatched && norm.length > 0) {
    filterState.searchText = norm;
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `#globalSearch` direct opacity | FilterState + applyFilter() integration | Phase 10 (this phase) | Respects StarState precedence; reading/selected/ghost immune to query dimming |
| Filter panel as sidebar (always present in focus mode) | Advanced drawer (progressive disclosure, hidden by default) | Phase 10 (this phase) | First paint is clean field; power users can access Advanced drawer |
| N MATCHES only (current filter-panel readout) | N CASES · M CLUSTERS readout | Phase 10 (this phase) | Spatial readout reinforces cluster metaphor |
| `#globalSearch` bare input | Conversational query-wrap | Phase 10 (this phase) | Observatory register; DM Mono; centered; always visible |

**Deprecated/outdated after this phase:**
- `#globalSearch` input element: removed, replaced by `#queryInput`
- `#globalSearchClear` button: removed, replaced by `#queryClear`
- Direct `mat.opacity` manipulation for filtering: replaced by FilterState integration

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.0 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm run test` (= `vitest run`) |
| Full suite command | `npm run test` (no watch mode; suite runs all 207 tests) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QRY-01 | Query input renders centered, DM Mono, z-index 10, placeholder set | unit (DOM) | `vitest run src/tests/query-bar.test.ts` | ❌ Wave 0 |
| QRY-02 | Keyword mapping: 'fintech' → services.has('Finance & Insurance'); unmatched term → searchText set | unit | `vitest run src/tests/keyword-map.test.ts` | ❌ Wave 0 |
| QRY-02 | FilterState.searchText extension: matchesFilter() checks client/title/challenge/approach | unit | `vitest run src/tests/filter-searchtext.test.ts` | ❌ Wave 0 |
| QRY-03 | applyFilterWave() called on input; GSAP animations triggered with delay per star | unit (mock GSAP) | `vitest run src/tests/filter-wave.test.ts` | ❌ Wave 0 |
| QRY-04 | N MATCHES count: all 116 cases checked against FilterState | unit | `vitest run src/tests/clusters-count.test.ts` | ❌ Wave 0 |
| QRY-04 | M CLUSTERS count: nucleusOrbits keys with ≥1 matching case | unit | `vitest run src/tests/clusters-count.test.ts` | ❌ Wave 0 |
| QRY-05 | Advanced drawer renders filter dimensions; mode-chip absent | unit (DOM) | `vitest run src/tests/query-bar.test.ts` | ❌ Wave 0 |
| QRY-06 | Clear button resets FilterState to createFilterState(); idle state restored | unit | `vitest run src/tests/query-bar.test.ts` | ❌ Wave 0 |
| QRY-07 | ARIA: role=searchbox, aria-expanded on toggle, aria-live region updates | unit (DOM) | `vitest run src/tests/query-bar.test.ts` | ❌ Wave 0 |
| QRY-08 | #globalSearch + #globalSearchClear absent from DOM | unit (DOM) | `vitest run src/tests/query-bar.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test` (full suite — 207 tests, <15s runtime; no selective run needed at this project scale)
- **Per wave merge:** `npm run test` (same command)
- **Phase gate:** Full suite green (≥207 + new tests) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/tests/keyword-map.test.ts` — covers QRY-02 keyword mapping table
- [ ] `src/tests/filter-searchtext.test.ts` — covers QRY-02 FilterState extension
- [ ] `src/tests/filter-wave.test.ts` — covers QRY-03 wave propagation (mock GSAP)
- [ ] `src/tests/clusters-count.test.ts` — covers QRY-04 N MATCHES + M CLUSTERS
- [ ] `src/tests/query-bar.test.ts` — covers QRY-01, QRY-05, QRY-06, QRY-07, QRY-08

---

## Open Questions

1. **applyFilterWave() integration point**
   - What we know: `applyFilter()` has two branches; query bar needs a third
   - What's unclear: Should `applyFilterWave()` be a new export called directly from query bar, or a third branch inside `applyFilter()` controlled by a flag on SceneObjects/SceneState?
   - Recommendation: New standalone export `applyFilterWave()` called directly from the query bar handler. Keeps applyFilter() untouched (no mode-flag proliferation). Lower regression risk for focused/global mode behavior.

2. **Advanced drawer animation**
   - What we know: Drawer needs show/hide animation consistent with observatory register
   - What's unclear: Slide-down from query bar vs. fade — which respects `prefers-reduced-motion` better?
   - Recommendation: CSS `max-height` transition with `prefers-reduced-motion` override to `display: none`. Simple, no GSAP needed for drawer itself.

3. **Region → country expansion in keyword mapping**
   - What we know: 'europe' should match European cases. FilterState uses countries Set, not a region field.
   - What's unclear: Should 'europe' map to all European country names (runtime expand from cases.json), or should FilterState get a `region` field?
   - Recommendation: Runtime expansion — collect unique countries where `region === 'Europe'` from loaded cases, add all to `filterState.countries`. Avoids FilterState API change; consistent with existing country-based filtering.

4. **Debounce timing**
   - What we know: Readout should update live; wave animation should not fire on every keypress during fast typing
   - What's unclear: One debounce for both readout + wave, or immediate readout + debounced wave?
   - Recommendation: Immediate readout update (synchronous, no animation), debounced wave trigger (80ms). User sees count update instantly; wave fires when typing pauses.

---

## Sources

### Primary (HIGH confidence)
- `src/data/filter.ts` — FilterState interface, matchesFilter() signature, createFilterState() — read directly
- `src/data/star-state.ts` — StarState values, APPEARANCE record, precedence chain — read directly
- `src/scene/scene-state.ts` — applyFilter() branch structure, GSAP duration patterns — read directly
- `src/ui/filter-panel.ts` — mountFilterPanel() signature, mode-chip rendering scope — read directly
- `src/main.ts` — #globalSearch handler pattern (lines 522–537), filtersWrap visibility logic — read directly
- `index.html` — current DOM, bare element locations, z-index context — read directly
- `src/style.css` — CSS token values, z-index stack — read directly
- `src/data/grouping.ts` — SERVICE_TO_VERTICAL map (19 services → 7 verticals) — read directly
- `public/cases.json` — 116 cases, actual dimension values, region breakdown — read directly
- `package.json` — dependency versions (GSAP ^3.12.0, Three.js ^0.170.0, Vitest 2.0) — read directly
- `.planning/config.json` — nyquist_validation: true — read directly

### Secondary (MEDIUM confidence)
- v3-starmap `src/ui/query-input.ts` (git commit c7f8aa2) — KeywordHint pattern and applyQuery() structure. Read via `git show` on the draft/v3-starmap branch. Dimension names differ (industries/capabilities → services/countries/proofTypes); pattern is sound.

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in package.json, no new dependencies required
- Architecture: HIGH — all integration points verified in actual source files; applyFilter() branch structure read directly; FilterState extension gap confirmed
- Pitfalls: HIGH — every pitfall identified by reading the actual problematic code (#globalSearch handler, applyFilter() staging sphere branch)
- Keyword mapping table: MEDIUM — dimension values confirmed from cases.json and proof-type.ts; keyword-to-dimension mappings are judgment calls on natural language coverage; will need iteration in implementation

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable stack; only risky if cases.json service list changes or filter.ts is modified between research and planning)
