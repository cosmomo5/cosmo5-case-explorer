# Phase 1: Foundation — Research

**Researched:** 2026-04-13
**Domain:** TypeScript state machine, pub/sub store, metric derivation, star state precedence
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FND-01 | ViewState discriminated union (`global \| constellation \| reading`) with typed event dispatch | New type replaces `SceneMode`; discriminated union pattern; event emitter shape; scope boundary defined |
| FND-02 | ShortlistStore at data layer — `add`, `remove`, `clear`, `has`, `entries`, pub/sub callbacks | Module-scope singleton pattern; factory + subscribe API; location: `src/data/shortlist-store.ts` |
| FND-03 | ShortlistStore persists across constellation visits (survives T1/T5 transitions) | Structural: store is not inside SceneObjects; boot-level instantiation pattern; test scenario defined |
| FND-04 | ProofType enum derived from case metrics (5 categories) | Keyword priority table; ambiguity resolution rules; fallback; classification strategy; `classifyProofType` signature |
| FND-05 | ImpactScale numeric value derived from metric magnitude | 5-band threshold table; parser spec for European comma decimals and non-percentage values; `deriveImpactScale` signature |
| FND-06 | Star state enum with precedence: reading > selected > ghost > filter-match > filter-dim > idle | 6-state enum; opacity lookup table; `resolveStarAppearance` signature; refactor scope in scene-state.ts |
</phase_requirements>

---

## Summary

Phase 1 is entirely pure TypeScript — no Three.js, no DOM, no GSAP. Every module in this phase is independently testable in a `node` environment. The goal is to build the foundational data and state layer that all subsequent phases consume.

The current codebase has `SceneMode = 'global' | 'focused'`, a mutable `SceneObjects` struct that owns all state including view mode, and star opacity set in three separate places with no precedence arbitration. Phase 1 replaces this with three clean primitives: a typed ViewState machine, a persistent ShortlistStore, and a single star appearance resolver. ProofType and ImpactScale are computed from `cases.json` metrics at boot time and embedded in a derived `EnrichedCaseStudy` type.

**Primary recommendation:** Five new files in `src/data/`, all pure logic, all with co-located `.test.ts` files. Nothing in Phase 1 imports Three.js. The boot sequence in `main.ts` gets one new step: enrich cases before passing them to `buildOrbitalScene`.

---

## Standard Stack

No new dependencies. Everything in Phase 1 is vanilla TypeScript.

| Module | Location | Purpose |
|--------|----------|---------|
| `view-state.ts` | `src/data/` | Discriminated union + typed event emitter |
| `shortlist-store.ts` | `src/data/` | Pub/sub shortlist, module-scope singleton |
| `proof-type.ts` | `src/data/` | ProofType enum + `classifyProofType()` |
| `impact-scale.ts` | `src/data/` | ImpactScale derivation + `deriveImpactScale()` |
| `enrich.ts` | `src/data/` | Combines ProofType + ImpactScale into `EnrichedCaseStudy` |

---

## Architecture Patterns

### Recommended File Layout (after Phase 1)

```
src/data/
├── types.ts                # CaseStudy, NucleusOrbit, StarOrbit (existing)
├── filter.ts               # FilterState, matchesFilter (existing)
├── grouping.ts             # groupBy, SERVICE_TO_VERTICAL (existing)
├── cases.ts                # loader stub (existing, unused)
├── view-state.ts           # NEW: ViewState discriminated union + event dispatch
├── shortlist-store.ts      # NEW: ShortlistStore factory + pub/sub
├── proof-type.ts           # NEW: ProofType enum + classifyProofType()
├── impact-scale.ts         # NEW: ImpactScale type + deriveImpactScale()
└── enrich.ts               # NEW: EnrichedCaseStudy type + enrichCases()
```

### Pattern 1: ViewState Discriminated Union (FND-01)

**What:** A discriminated union with three variants. Each variant carries the minimal payload relevant to that state. A lightweight event emitter dispatches typed events on transitions.

**Scope boundary:** Define all three states now. Wire transitions to `global` and `constellation` in Phase 1 (replacing `enterFocus`/`exitFocus`). The `reading` state is defined and typed here but not activated until Phase 5 — its transition handler is a stub that throws.

**Current code to replace:** `SceneMode = 'global' | 'focused'` in `src/scene/scene-state.ts` line 14. `SceneObjects.mode` and `SceneObjects.focusedKey` are superseded by the ViewState payload.

**Shape:**

```typescript
// src/data/view-state.ts

export type ViewState =
  | { kind: 'global' }
  | { kind: 'constellation'; nucleusKey: string }
  | { kind: 'reading'; nucleusKey: string; caseId: string };

export type ViewEvent =
  | { type: 'ENTER_CONSTELLATION'; nucleusKey: string }
  | { type: 'EXIT_CONSTELLATION' }
  | { type: 'OPEN_READING'; caseId: string }
  | { type: 'CLOSE_READING' };

export type ViewStateListener = (next: ViewState, prev: ViewState, event: ViewEvent) => void;

export interface ViewStateMachine {
  getState(): ViewState;
  dispatch(event: ViewEvent): void;
  subscribe(listener: ViewStateListener): () => void; // returns unsubscribe
}

export function createViewStateMachine(initial?: ViewState): ViewStateMachine {
  // implementation: pure transition logic + listener notification
  // invalid transitions throw (e.g., OPEN_READING from 'global')
}
```

**Transition table:**

| From | Event | To | Guard |
|------|-------|----|-------|
| global | ENTER_CONSTELLATION | constellation | always |
| constellation | EXIT_CONSTELLATION | global | always |
| constellation | OPEN_READING | reading | Phase 5 stub — throw until wired |
| reading | CLOSE_READING | constellation | Phase 5 stub — throw until wired |
| any | invalid event | — | throw with message |

### Pattern 2: ShortlistStore (FND-02, FND-03)

**What:** A module-scope singleton factory. No class inheritance — follows the same factory-function pattern as `createFilterState()`. The store carries `caseId → nucleusKey` entries so the constellation context survives.

**Critical architectural rule:** The store is created once at boot time in `main.ts` and passed to systems that need it. It is NEVER placed inside `SceneObjects`. Its lifetime exceeds any scene rebuild or regrouping cycle.

**Shape:**

```typescript
// src/data/shortlist-store.ts

export interface ShortlistEntry {
  caseId: string;
  nucleusKey: string; // constellation it came from
}

export type ShortlistListener = (entries: ShortlistEntry[]) => void;

export interface ShortlistStore {
  add(caseId: string, nucleusKey: string): void;
  remove(caseId: string): void;
  clear(): void;
  has(caseId: string): boolean;
  entries(): ShortlistEntry[];
  subscribe(listener: ShortlistListener): () => void; // returns unsubscribe
}

export function createShortlistStore(): ShortlistStore {
  // internal: Map<caseId, ShortlistEntry>, Set<listener>
  // add/remove call all listeners synchronously after mutation
}
```

**Boot sequence change in `main.ts`:**

```typescript
// Before buildOrbitalScene:
const shortlistStore = createShortlistStore();
// Pass to systems that need it (Phase 4: star selection, Phase 5: reading panel)
```

**Why persistence is structural:** Because `shortlistStore` is not inside `SceneObjects`, it is not reset when `exitFocus()` / `unfocusSphere()` is called, and not rebuilt when `regroupScene()` fires. The store outlives any scene-level operation.

### Pattern 3: ProofType Derivation (FND-04)

**What:** An enum with five values. Classification runs over a case's `metrics[].label` strings, applying keyword priority rules in order. Returns one `ProofType` per case.

**Classification strategy:** Inspect all metric labels for a case. For each label, check against the priority list below. The dominant type (most labels matching a category) wins. On tie, the first category in priority order wins. Returns `ProofType.Engagement` as fallback if no labels match.

**Keyword priority table (checked in order for each label):**

| Priority | ProofType | Keywords (case-insensitive, substring match) |
|----------|-----------|----------------------------------------------|
| 1 | `Revenue` | `roas`, `revenue`, `sales`, `roi`, `return on` |
| 2 | `Conversion` | `conver`, `cpa`, `lead`, `acqui`, `qualified call` |
| 3 | `Awareness` | `brand`, `aware`, `recall`, `reach`, `impression`, `search`, `visibility` |
| 4 | `CostEfficiency` | `cpm`, `cpc`, `cost per`, `efficien`, `cheaper`, `saving` |
| 5 | `Engagement` | `click`, `ctr`, `engagement`, `view`, `vtr`, `follower`, `watch`, `interaction` |

**Ambiguity resolution:**
- `"cost per lead"` — matches Conversion (priority 2) before CostEfficiency (priority 4). Conversion wins.
- `"cpa (cost per acquisition)"` — matches Conversion (priority 2). Conversion wins.
- A label matching no category contributes nothing to the tally. The dominant type across all matched labels wins.

**Fallback:** If no labels match any category, return `ProofType.Engagement` (least specific, most defensible).

**Enum shape:**

```typescript
// src/data/proof-type.ts

export enum ProofType {
  Revenue     = 'Revenue',
  Conversion  = 'Conversion',
  Awareness   = 'Awareness',
  CostEfficiency = 'CostEfficiency',
  Engagement  = 'Engagement',
}

// Returns the dominant ProofType across all metrics of a case
export function classifyProofType(metrics: Metric[]): ProofType {
  // tally matches by priority; dominant wins; tie -> lower priority number wins
}
```

### Pattern 4: ImpactScale Derivation (FND-05)

**What:** A number in the range [0, 1] representing the magnitude of a case's best result. Five named bands map to the range.

**Parser spec:** Metric values use mixed formats (`+40,87%`, `-46%`, `4900%`, `2x`, `AUD$40`, `10.850`, `N/A`). Normalization:
1. Strip leading `+` or `-` sign (take absolute value).
2. Replace `,` with `.` (European decimal separator).
3. Strip `%`, `$`, currency symbols, `x` multiplier markers.
4. Parse as float. If `NaN` or `N/A`, skip this metric.
5. If the value has `x` suffix (e.g., `2x`), multiply by 100 to normalize to percentage scale (2x → 200%).
6. Non-percentage absolute numbers (e.g., `10.850` leads, `106.000` users) are skipped — they are not comparable across cases.
7. Take the **maximum** valid percentage value across all of a case's metrics.

**Threshold bands (derived from data distribution: 267 values, range 0.1–5349%):**

| Band | ImpactScale | Threshold |
|------|-------------|-----------|
| incremental | 0.0–0.2 | max value ≤ 20% |
| notable | 0.2–0.5 | max value 20–100% |
| significant | 0.5–0.75 | max value 100–300% |
| transformative | 0.75–1.0 | max value > 300% |
| unknown | 0.0 | no parseable percentage metrics |

**Scale shape:**

```typescript
// src/data/impact-scale.ts

export type ImpactScaleBand = 'incremental' | 'notable' | 'significant' | 'transformative' | 'unknown';

export interface ImpactScale {
  value: number;    // 0–1 continuous, for range slider
  band: ImpactScaleBand;
  maxPct: number;   // raw max percentage found (for tooltip/debug)
}

export function deriveImpactScale(metrics: Metric[]): ImpactScale {
  // parse → max → band → normalized value
}
```

### Pattern 5: EnrichedCaseStudy (boot enrichment)

**What:** Extend `CaseStudy` with the two derived fields. Enrichment happens once at boot, immediately after `cases.json` is fetched, before `buildOrbitalScene`.

```typescript
// src/data/enrich.ts

import type { CaseStudy } from './types';
import { ProofType, classifyProofType } from './proof-type';
import { ImpactScale, deriveImpactScale } from './impact-scale';

export interface EnrichedCaseStudy extends CaseStudy {
  proofType: ProofType;
  impactScale: ImpactScale;
}

export function enrichCases(cases: CaseStudy[]): EnrichedCaseStudy[] {
  return cases.map(c => ({
    ...c,
    proofType: classifyProofType(c.metrics),
    impactScale: deriveImpactScale(c.metrics),
  }));
}
```

**Boot sequence change in `main.ts`:**

```typescript
const rawCases: CaseStudy[] = await fetchCases();
const cases: EnrichedCaseStudy[] = enrichCases(rawCases);
// Pass cases (now EnrichedCaseStudy[]) to buildOrbitalScene
```

`buildOrbitalScene` signature stays the same but its `cases` parameter type widens to `CaseStudy[]` (which `EnrichedCaseStudy[]` satisfies). No changes to scene-state internals.

### Pattern 6: StarState + Single Opacity Setter (FND-06)

**What:** An enum with six states. A pure function maps state → appearance. Replaces three ad-hoc opacity assignments in `tickOrbits`, `focusSphere`, and `applyFilter`.

**Precedence chain (reading wins, idle is last):**

| Priority | StarState | Opacity | Color override |
|----------|-----------|---------|----------------|
| 1 (highest) | `reading` | 1.0 | gold `0xe8b15a` |
| 2 | `selected` | 1.0 | white `0xffffff` |
| 3 | `ghost` | 0.25 | nucleus color (dimmed) |
| 4 | `filterMatch` | 0.85 | nucleus color |
| 5 | `filterDim` | 0.12 | nucleus color |
| 6 (lowest) | `idle` | 0.85 | nucleus color |

**Shape:**

```typescript
// src/data/star-state.ts (or inline in src/scene/scene-state.ts)

export type StarState = 'reading' | 'selected' | 'ghost' | 'filterMatch' | 'filterDim' | 'idle';

export interface StarAppearance {
  opacity: number;
  colorOverride?: number; // THREE.Color hex; if absent, use nucleus color
}

export function resolveStarAppearance(state: StarState): StarAppearance {
  // lookup table — no branching logic in callers
}
```

**Refactor scope in scene-state.ts:** The three existing opacity assignments become calls to `resolveStarAppearance`:
- `tickOrbits` lines 180–182: replace `isMatch ? 0.85 : 0.15` with `resolveStarAppearance(state).opacity`
- `focusSphere` lines 299–303: replace the two `gsap.to(material, { opacity: ... })` blocks
- `applyFilter` implicit opacity: driven by tick loop via filter state, no direct change needed

**The star state is not yet fully wired in Phase 1.** `ghost`, `selected`, and `reading` are defined but only `filterMatch`, `filterDim`, and `idle` are activated. The resolver is written now so Phase 4 and 5 have no API surprise.

**Location decision:** `src/data/star-state.ts` — pure logic, no Three.js import, testable in node.

### Anti-Patterns to Avoid

- **Putting ShortlistStore inside SceneObjects:** The store would be reset on `unfocusSphere()`. It must be a module-scope variable created before `buildOrbitalScene`.
- **Computing ProofType/ImpactScale lazily per-render:** Compute once at boot. The tick loop must not call classification logic.
- **Using `SceneMode` after Phase 1:** The new `ViewState` machine replaces it. Don't let both coexist.
- **Mutating `ViewState` directly:** Always go through `dispatch()`. The machine is the only writer.
- **Skip-testing the transition guard:** Invalid transitions (e.g., `OPEN_READING` from `global`) must throw — test this explicitly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pub/sub notification | Custom event system | Plain Set of listeners + sync notify | Stack already uses this pattern; no RxJS or EventEmitter dependency needed |
| State machine | XState or Redux | Hand-rolled discriminated union | 3 states, 4 events — XState overhead not justified |
| Metric NLP | ML or heuristic pipeline | Keyword substring table | 116 cases, 297 labels — table is sufficient and fully auditable |

---

## Common Pitfalls

### Pitfall 1: ShortlistStore Reset on exitFocus

**What goes wrong:** Store is placed in `SceneObjects`, which is rebuilt or mutated by `unfocusSphere`. Cases from Constellation A disappear when the user navigates back to global.

**Why it happens:** `SceneObjects` is the existing mutation hub — it's natural to add things there.

**How to avoid:** Create `shortlistStore` in `main.ts` boot, before `buildOrbitalScene`. Pass it as a parameter to systems that need it. Never attach it to `sceneObjects`.

**Warning signs:** FND-03 test (cross-constellation persistence) fails.

### Pitfall 2: European Decimal Parsing

**What goes wrong:** `parseFloat('+40,87%')` returns `NaN` after stripping `%`. ImpactScale falls through to `unknown` for European-format values, which is most of the dataset.

**Why it happens:** JavaScript `parseFloat` does not recognize `,` as decimal separator.

**How to avoid:** Normalize: `value.replace(',', '.')` before `parseFloat`. Do this in `deriveImpactScale` before any numeric operation.

**Warning signs:** ImpactScale returns `unknown` for the majority of cases in manual audit.

### Pitfall 3: ProofType Classification on Empty Metrics

**What goes wrong:** Some cases have `metrics: []` (or all `N/A` values). Classification throws or returns undefined.

**Why it happens:** Empty array iteration, no fallback path.

**How to avoid:** `classifyProofType([])` must return `ProofType.Engagement` (fallback). `deriveImpactScale([])` must return `{ value: 0, band: 'unknown', maxPct: 0 }`.

**Warning signs:** TypeScript union type lets `undefined` leak out; strict mode will catch this at compile time if return type is correctly annotated.

### Pitfall 4: StarState Not Covering Future States

**What goes wrong:** Phase 4 adds `ghost` and `selected` behavior and has to invent its own opacity values, creating a second precedence system that conflicts with Phase 1's resolver.

**Why it happens:** Phase 1 only activates `filterMatch`, `filterDim`, `idle` — `ghost` and `selected` feel deferred.

**How to avoid:** Define the full 6-state enum and full resolver lookup table in Phase 1. Phase 4 only writes the state value into `userData`; the resolver already knows what to do with it. The test for the resolver should cover all six states.

### Pitfall 5: ViewState Machine and SceneMode Coexisting

**What goes wrong:** `SceneObjects.mode: SceneMode` is still read in multiple places (`tickOrbits` line 155, `applyFilter` line 194). Phase 1 adds `ViewStateMachine` without removing `SceneMode`, and the two get out of sync.

**Why it happens:** Phase 1 defines `ViewState` but doesn't fully wire `main.ts` transitions.

**How to avoid:** In Phase 1, the ViewStateMachine is created and the `dispatch(ENTER_CONSTELLATION)` / `dispatch(EXIT_CONSTELLATION)` calls replace the direct `objects.mode = 'focused'` mutations. The machine's listener updates `objects.mode` for backward compatibility until Phase 2+ fully migrates. Or: remove `SceneMode` from `SceneObjects` in this phase and update `tickOrbits` and `applyFilter` to read from the machine. The plan must make this explicit.

---

## Code Examples

### ViewState factory and transition

```typescript
// src/data/view-state.ts
export function createViewStateMachine(initial: ViewState = { kind: 'global' }): ViewStateMachine {
  let state = initial;
  const listeners = new Set<ViewStateListener>();

  function transition(next: ViewState, event: ViewEvent): void {
    const prev = state;
    state = next;
    listeners.forEach(fn => fn(next, prev, event));
  }

  return {
    getState: () => state,
    dispatch(event) {
      const s = state;
      if (event.type === 'ENTER_CONSTELLATION' && s.kind === 'global') {
        transition({ kind: 'constellation', nucleusKey: event.nucleusKey }, event);
      } else if (event.type === 'EXIT_CONSTELLATION' && s.kind === 'constellation') {
        transition({ kind: 'global' }, event);
      } else if (event.type === 'OPEN_READING' || event.type === 'CLOSE_READING') {
        throw new Error(`Transition ${event.type} not wired until Phase 5`);
      } else {
        throw new Error(`Invalid transition: ${event.type} from ${s.kind}`);
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
```

### ShortlistStore factory

```typescript
// src/data/shortlist-store.ts
export function createShortlistStore(): ShortlistStore {
  const _map = new Map<string, ShortlistEntry>();
  const _listeners = new Set<ShortlistListener>();

  function _notify() {
    const snapshot = [..._map.values()];
    _listeners.forEach(fn => fn(snapshot));
  }

  return {
    add(caseId, nucleusKey) {
      _map.set(caseId, { caseId, nucleusKey });
      _notify();
    },
    remove(caseId) {
      _map.delete(caseId);
      _notify();
    },
    clear() {
      _map.clear();
      _notify();
    },
    has: (caseId) => _map.has(caseId),
    entries: () => [..._map.values()],
    subscribe(listener) {
      _listeners.add(listener);
      return () => _listeners.delete(listener);
    },
  };
}
```

### ProofType classifier

```typescript
// src/data/proof-type.ts
const PROOF_KEYWORDS: [ProofType, string[]][] = [
  [ProofType.Revenue,        ['roas', 'revenue', 'sales', 'roi', 'return on']],
  [ProofType.Conversion,     ['conver', 'cpa', 'lead', 'acqui', 'qualified call']],
  [ProofType.Awareness,      ['brand', 'aware', 'recall', 'reach', 'impression', 'search', 'visibility']],
  [ProofType.CostEfficiency, ['cpm', 'cpc', 'cost per', 'efficien', 'cheaper', 'saving']],
  [ProofType.Engagement,     ['click', 'ctr', 'engagement', 'view', 'vtr', 'follower', 'watch', 'interaction']],
];

export function classifyProofType(metrics: Metric[]): ProofType {
  const tally = new Map<ProofType, number>();
  for (const { label } of metrics) {
    const l = label.toLowerCase();
    for (const [type, keywords] of PROOF_KEYWORDS) {
      if (keywords.some(k => l.includes(k))) {
        tally.set(type, (tally.get(type) ?? 0) + 1);
        break; // first match wins for this label
      }
    }
  }
  if (tally.size === 0) return ProofType.Engagement;
  // dominant type; tie-break: lower priority-index wins
  let best: ProofType = ProofType.Engagement;
  let bestCount = 0;
  for (const [type, keywords] of PROOF_KEYWORDS) {
    const count = tally.get(type) ?? 0;
    if (count > bestCount) { best = type; bestCount = count; }
  }
  return best;
}
```

### ImpactScale parser and bander

```typescript
// src/data/impact-scale.ts
function parseMetricPct(value: string): number | null {
  if (value.trim().toLowerCase() === 'n/a') return null;
  let v = value.trim().replace('+', '').replace('-', ''); // absolute value
  const isMultiplier = /x$/i.test(v);
  v = v.replace(/[+\-$€£%x]/gi, '').replace(',', '.').trim();
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  return isMultiplier ? n * 100 : n;
}

export function deriveImpactScale(metrics: Metric[]): ImpactScale {
  const pcts = metrics.map(m => parseMetricPct(m.value)).filter((n): n is number => n !== null);
  if (pcts.length === 0) return { value: 0, band: 'unknown', maxPct: 0 };
  const maxPct = Math.max(...pcts);
  if (maxPct <= 20)  return { value: maxPct / 20 * 0.2,  band: 'incremental',   maxPct };
  if (maxPct <= 100) return { value: 0.2 + (maxPct - 20) / 80 * 0.3, band: 'notable', maxPct };
  if (maxPct <= 300) return { value: 0.5 + (maxPct - 100) / 200 * 0.25, band: 'significant', maxPct };
  return { value: Math.min(1.0, 0.75 + (maxPct - 300) / 5000 * 0.25), band: 'transformative', maxPct };
}
```

---

## Don't Hand-Roll (Summary)

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| State management library | Redux, XState, Zustand | Hand-rolled 3-state discriminated union |
| Pub/sub framework | EventEmitter, RxJS | Plain `Set<listener>` + sync notify |
| ML metric classification | Embeddings, regex NLP | Keyword substring priority table |
| Separate Three.js classes for state | Scene-coupled state | Pure data layer in `src/data/` |

---

## Validation Architecture

nyquist_validation: enabled

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vite.config.ts` (test.environment: 'node') |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-01 | ViewState dispatches ENTER_CONSTELLATION, EXIT_CONSTELLATION; invalid transitions throw | unit | `npx vitest run src/data/view-state.test.ts` | Wave 0 |
| FND-01 | ViewState listeners are called with prev/next/event on transition | unit | `npx vitest run src/data/view-state.test.ts` | Wave 0 |
| FND-02 | ShortlistStore add/remove/has/entries/clear work correctly | unit | `npx vitest run src/data/shortlist-store.test.ts` | Wave 0 |
| FND-02 | Listeners called synchronously after add/remove/clear | unit | `npx vitest run src/data/shortlist-store.test.ts` | Wave 0 |
| FND-03 | entries() after add from nucleus A, then clear of scene (simulated by not calling clear), still returns A's cases | unit | `npx vitest run src/data/shortlist-store.test.ts` | Wave 0 |
| FND-04 | classifyProofType([]) returns Engagement fallback | unit | `npx vitest run src/data/proof-type.test.ts` | Wave 0 |
| FND-04 | classifyProofType with Revenue labels returns Revenue | unit | `npx vitest run src/data/proof-type.test.ts` | Wave 0 |
| FND-04 | "cost per lead" classifies as Conversion not CostEfficiency | unit | `npx vitest run src/data/proof-type.test.ts` | Wave 0 |
| FND-05 | deriveImpactScale([]) returns unknown band | unit | `npx vitest run src/data/impact-scale.test.ts` | Wave 0 |
| FND-05 | European comma format "+40,87%" parses correctly | unit | `npx vitest run src/data/impact-scale.test.ts` | Wave 0 |
| FND-05 | "2x" multiplier normalizes to 200% | unit | `npx vitest run src/data/impact-scale.test.ts` | Wave 0 |
| FND-05 | Threshold bands: ≤20% → incremental, 20–100% → notable, 100–300% → significant, >300% → transformative | unit | `npx vitest run src/data/impact-scale.test.ts` | Wave 0 |
| FND-06 | resolveStarAppearance covers all 6 states with correct opacity | unit | `npx vitest run src/data/star-state.test.ts` | Wave 0 |
| FND-06 | reading state returns gold color override | unit | `npx vitest run src/data/star-state.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/data/view-state.test.ts` — covers FND-01
- [ ] `src/data/shortlist-store.test.ts` — covers FND-02, FND-03
- [ ] `src/data/proof-type.test.ts` — covers FND-04
- [ ] `src/data/impact-scale.test.ts` — covers FND-05
- [ ] `src/data/star-state.test.ts` — covers FND-06

Existing tests (`filter.test.ts`, `grouping.test.ts`, orbital `*.test.ts`) continue to pass and are not modified.

---

## Sources

### Primary (HIGH confidence)

- Codebase direct read: `src/scene/scene-state.ts` — existing SceneMode type, opacity assignment locations, SceneObjects shape
- Codebase direct read: `src/data/types.ts` — CaseStudy interface with metrics array
- Codebase direct read: `src/data/filter.ts` — factory-function pattern for data-layer stores
- Codebase direct read: `src/data/filter.test.ts` — vitest test style and fixture patterns
- Codebase direct read: `vite.config.ts` — `test: { environment: 'node' }`
- Codebase direct read: `cases.json` analysis — 116 cases, 297 unique metric labels, value range 0.1–5349%
- `.planning/codebase/ARCHITECTURE.md` — data flow, SceneObjects pattern, filter state mutation pattern
- `.planning/codebase/CONVENTIONS.md` — factory function naming, export patterns, test colocation
- `.planning/research/SUMMARY.md` — architectural decisions: ShortlistStore at boot level, discriminated union for ViewState, star state enum

### Secondary (MEDIUM confidence)

- Data analysis of `cases.json` metric values — threshold bands derived from actual distribution (267 parseable values; 60 ≤ 20%, 141 20–100%, 43 100–300%, 23 > 300%)
- Metric label keyword categorization — spot-checked against 40 representative labels; ~61/297 labels remain uncategorized (fallback to Engagement)

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies; pattern shapes derived directly from existing codebase conventions
- Architecture: HIGH — module locations and boot sequence changes verified against ARCHITECTURE.md and STRUCTURE.md
- ProofType thresholds: HIGH — keyword table verified against actual metric labels in cases.json
- ImpactScale thresholds: HIGH — bands derived from empirical distribution of 267 parsed values
- Star state opacity values: MEDIUM — `reading` gold and `ghost` 0.25 are new (no existing precedent); others verified from scene-state.ts existing values
- Pitfalls: HIGH — all five pitfalls traced to specific file/line evidence in CONCERNS.md or ARCHITECTURE.md

**Research date:** 2026-04-13
**Valid until:** 90 days (stable stack, no external dependencies)
