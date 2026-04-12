# Testing Patterns

**Analysis Date:** 2026-04-13

## Test Framework

**Runner:**
- Vitest 2.0.0 (from `package.json`)
- Config: `vite.config.ts` (unified Vite + Vitest config)
- Environment: `environment: 'node'` (non-browser tests)
- Cache: OS temp directory to support sandboxed filesystems

**Assertion Library:**
- Vitest built-in `expect()` API (Jest-compatible)

**Run Commands:**
```bash
npm test                  # Run all tests (defined as `vitest run` in package.json)
npm run dev              # Start dev server (not test-watch; no watch mode configured)
```

**Test invocation:**
- All tests run once and exit (no watch mode in package.json)
- Tests can be run inline during development via `vitest watch` (not in standard npm scripts)

## Test File Organization

**Location:**
- Colocated with source: `src/module.ts` paired with `src/module.test.ts` in same directory
- No separate `__tests__/` directory
- Tests live alongside code in the module tree

**Naming:**
- Pattern: `{module}.test.ts`
- Examples: `filter.test.ts`, `nucleus-orbit.test.ts`, `star-orbit.test.ts`, `grouping.test.ts`, `staging.test.ts`

**Structure:**
```
src/
├── data/
│   ├── filter.ts
│   ├── filter.test.ts
│   ├── grouping.ts
│   ├── grouping.test.ts
│   └── types.ts
├── scene/
│   └── orbitals/
│       ├── nucleus-orbit.ts
│       ├── nucleus-orbit.test.ts
│       ├── star-orbit.ts
│       ├── star-orbit.test.ts
│       ├── staging.ts
│       └── staging.test.ts
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect } from 'vitest';
import { computeNucleusOrbits, nucleusPositionAt } from './nucleus-orbit';
import type { CaseStudy } from '../../data/types';

const cases: CaseStudy[] = [
  { id: 'A', client: 'X', year: 2026, services: ['Video Ads'], countries: ['Spain'], region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: [] },
  { id: 'B', client: 'Y', year: 2025, services: ['SEA'], countries: ['France'], region: 'Europe', permission: false, title: '', challenge: '', approach: '', metrics: [] },
];
const groups = { 'Media': [cases[0]], 'Performance': [cases[1]] };

describe('computeNucleusOrbits', () => {
  it('produces one NucleusOrbit per group key', () => {
    const orbits = computeNucleusOrbits(groups);
    expect(Object.keys(orbits)).toHaveLength(2);
    expect(orbits['Media']).toBeDefined();
    expect(orbits['Performance']).toBeDefined();
  });
  // ...
});
```

**Patterns:**

**1. Setup (fixtures at module level):**
- Reusable test data defined at top of test file
- Typed inline: `const c1: CaseStudy = { ... }`
- Shared across all `describe` blocks in the file
- Example: `cases` array used in grouping tests, filter tests, and orbit tests

**2. Arrange-Act-Assert (AAA):**
```typescript
it('filters by country (OR within set)', () => {
  const f = createFilterState();              // Arrange
  f.countries.add('Spain');                   // Act
  expect(matchesFilter(c1, f)).toBe(true);    // Assert
});
```

**3. Descriptive test names:**
- Format: "[action] [when condition] [expected result]"
- Examples:
  - `'produces one NucleusOrbit per group key'`
  - `'filters by country (OR within set)'`
  - `'ANDs across filter dimensions'`
  - `'is deterministic'`
  - `'u and v are orthogonal'`

## Mocking

**Framework:**
- No mocking detected in current tests
- All tests are unit tests over pure functions and data structures
- Three.js types imported but not mocked (tests don't instantiate THREE.Mesh)

**Patterns — What NOT to mock:**
- Domain data: always use real `CaseStudy` objects constructed inline
- Pure functions: call directly (no spies or stubs)
- Hash function: tested directly as part of `star-orbit.test.ts`

**When mocking would apply (not yet in codebase):**
- Browser APIs would need mocking: `window.matchMedia()` (called but not tested)
- DOM operations would need mocking: `document.getElementById()` (used in DetailPanel but not tested)
- Fetch would need mocking: `fetch('/cases.json')` (called in boot but not unit-tested)

## Fixtures and Test Data

**Test Data Creation:**

```typescript
// Minimal CaseStudy objects
const c1: CaseStudy = { 
  id: 'A', client: 'X', year: 2026, services: ['Video Ads', 'SEA'], 
  countries: ['Spain', 'France'], region: 'Europe', permission: true, 
  title: '', challenge: '', approach: '', metrics: [] 
};

// Complete: all required fields filled
// Sparse: optional fields empty string or empty array
```

**Factory pattern:**
- Not used; test data created inline
- Domain objects are POJOs, not classes, so simple object literals suffice

**Location:**
- Test data lives at top of each test file
- Shared across all test suites in that file
- Organized by concept: `cases` array, then `groups` object derived from it

**Conventions:**
- Minimal valid data: fields set to realistic values only if the test depends on them
- Single-character keys: `'A'`, `'B'` for case IDs; `'Media'`, `'Performance'` for nucleus keys
- Array destructuring: `const [c1, c2] = cases` used to name individual test items

## Coverage

**Requirements:**
- No coverage requirement detected (no coverage config in `vite.config.ts`)
- No `thresholds` field in test config

**View Coverage:**
- Not configured; would require `vitest --coverage` with a coverage reporter installed
- No coverage dependency in `package.json`

**Tested Modules:**
- `src/data/filter.ts` — 100% (5 test cases)
- `src/data/grouping.ts` — 100% (4 test cases)
- `src/scene/orbitals/nucleus-orbit.ts` — 100% (3 test cases)
- `src/scene/orbitals/star-orbit.ts` — 100% (5 test cases)
- `src/scene/orbitals/staging.ts` — 100% (6 test cases)

**Untested Modules:**
- `src/main.ts` — System/integration level; tested manually
- `src/ui/detail-panel.ts` — DOM manipulation; would need browser environment
- `src/ui/tooltip.ts` — DOM manipulation; would need browser environment
- `src/ui/filter-panel.ts` — DOM manipulation + event binding; would need browser environment
- `src/scene/scene-state.ts` — Three.js scene manipulation; would need WebGL context
- `src/scene/renderer.ts` — WebGL context; requires browser
- `src/scene/background/starfield.ts` — Canvas rendering; requires browser

**Testing philosophy:**
- Pure functions tested thoroughly (filter, grouping, orbital math)
- Stateful systems (DOM, Three.js) tested manually
- No integration tests in test suite (though `boot()` is manually tested via page load)

## Test Types

**Unit Tests:**
- Scope: Single function or small module
- Approach: Given input, verify output
- Examples:
  - `matchesFilter(caseStudy, filterState)` → boolean
  - `computeNucleusOrbits(groups)` → orbital map
  - `computeStagingPositions(count, radius)` → Vec3[]

**Integration Tests:**
- Not present
- Would test: `boot()` initialization, filter → scene update pipeline
- Challenges: requires DOM, WebGL, async fetch

**E2E Tests:**
- Not present
- Manual testing via live site (`npm run dev` → browser navigation)
- Verified behaviors: mouse interactions, focus transitions, label visibility

## Common Patterns

**Determinism Testing:**

```typescript
it('is deterministic', () => {
  const a = computeNucleusOrbits(groups);
  const b = computeNucleusOrbits(groups);
  expect(a['Media'].phase).toBe(b['Media'].phase);
  expect(a['Media'].orbitR).toBe(b['Media'].orbitR);
});
```

- Critical for data-driven visual system
- Verifies that hash function produces consistent results
- Same input → same orbital parameters every time

**Geometric Validation:**

```typescript
it('u and v are orthogonal', () => {
  const orbits = computeNucleusOrbits(groups);
  const o = orbits['Media'];
  const dot = o.orbitU.x*o.orbitV.x + o.orbitU.y*o.orbitV.y + o.orbitU.z*o.orbitV.z;
  expect(Math.abs(dot)).toBeLessThan(0.001);
});
```

- Tests invariants from linear algebra
- Uses `toBeCloseTo()` for floating-point comparison
- Catches numerical errors in basis vector construction

**Bounds Testing:**

```typescript
it('each nucleus orbit speed is in outer range', () => {
  const orbits = computeNucleusOrbits(groups);
  for (const key of Object.keys(orbits)) {
    const speed = Math.abs(orbits[key].speed);
    expect(speed).toBeGreaterThanOrEqual(0.00002);
    expect(speed).toBeLessThanOrEqual(0.00008);
  }
});
```

- Verifies parameters stay within expected ranges
- Prevents numerical errors from producing invalid states

**Floating-Point Comparison:**

```typescript
expect(pos.x).toBeCloseTo(expectedX, 5);     // 5 decimal places
expect(len).toBeCloseTo(orbit.r, 3);          // 3 decimal places
expect(ax_len).toBeCloseTo(1, 5);             // unit vector
```

- Allows for IEEE 754 rounding errors
- Different tolerances for different scales: position vs. unit vector
- Prevents test brittleness from floating-point arithmetic

**Empty/Edge Cases:**

```typescript
it('returns empty array when count is 0', () => {
  const positions = computeStagingPositions(0, 80);
  expect(positions).toHaveLength(0);
});

it('defaults center to origin when not provided', () => {
  const withDefault = computeStagingPositions(5, 80);
  const withExplicit = computeStagingPositions(5, 80, { x: 0, y: 0, z: 0 });
  expect(withDefault).toEqual(withExplicit);
});
```

- Edge case coverage for array length 0
- Parameter default verification
- Handles special cases gracefully

**Equality Testing:**

```typescript
// Deep equality for arrays
expect(attrs.years).toEqual([2025, 2026]);

// Containment checks
expect(attrs.countries).toContain('Spain');
expect(attrs.countries).toContain('France');

// Array length
expect(Object.keys(orbits)).toHaveLength(2);
```

- Use `.toEqual()` for object/array comparison (not `.toBe()`)
- Use `.toContain()` for Set/array membership
- Avoid exact index checking unless order is critical

## Error Testing

Not present in current test suite. Pattern (if needed):

```typescript
// Would look like:
it('throws on invalid fetch response', () => {
  expect(() => {
    // simulate failed response
  }).toThrow('cases.json');
});
```

- `boot()` has try-catch but no test coverage
- Would require mocking `fetch` or using setup/teardown

## Test Execution

**Before each test:**
- Test data (cases, groups) reused from module scope
- Filter states created fresh: `const f = createFilterState()` inside each test
- No shared mutable state between tests

**After each test:**
- No cleanup needed (pure functions, no side effects)
- No teardown hooks detected or required

**Test isolation:**
- Each test modifies local filter state: `f.countries.add('Spain')`
- No mutation of shared `cases` or `groups` objects
- Tests can run in any order

---

*Testing analysis: 2026-04-13*
