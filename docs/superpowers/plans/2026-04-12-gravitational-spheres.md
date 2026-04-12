# Gravitational Spheres Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Case Study Explorer as a two-level nested orbital system — sphere-nuclei (verticals/countries/regions) orbiting a staging center, with individual case stars orbiting their nucleus like electrons on unique tilted planes.

**Architecture:** TypeScript + Three.js + GSAP + D3 + Vite, branching from `main` (v1 vanilla JS). Port the working electron orbital mechanic from v1's `cosmos.js` verbatim. Add the outer orbital layer (nuclei around staging center), grouping mode switcher, staging center filter mechanic (stars fly to center on filter, fly home on clear), sphere-expand zoom, hover tooltip, and dynamic filter panel.

**Tech Stack:** TypeScript 5, Three.js 0.170, GSAP 3.12, D3 7.9, Vite 6, Vitest (unit tests for pure functions only — orbital math, grouping, filter logic)

---

## File Structure

```
src/
├── data/
│   ├── types.ts           # CaseStudy, NucleusData, StarData, SceneState interfaces
│   ├── grouping.ts        # SERVICE_TO_VERTICAL map + groupBy(cases, mode) function
│   └── filter.ts          # FilterState, matchesFilter(), getFilterableAttrs()
├── scene/
│   ├── background/
│   │   └── starfield.ts   # Ambient 3-layer starfield (ported from v1 verbatim)
│   ├── globe/
│   │   └── globe.ts       # D3 orthographic globe intro (ported from v1 verbatim)
│   ├── orbitals/
│   │   ├── hash.ts        # Deterministic hash function (ported from v1 verbatim)
│   │   ├── star-orbit.ts  # Inner orbital mechanic: compute StarOrbit from CaseStudy
│   │   ├── nucleus-orbit.ts # Outer orbital mechanic: compute NucleusOrbit from group key
│   │   └── staging.ts     # Phyllotaxis formation at (0,0,0) for filtered stars
│   ├── renderer.ts        # Three.js scene setup, camera, WebGLRenderer, tick loop
│   └── scene-state.ts     # SceneMode enum + transition functions (globeToOrbital, focusSphere, unfocus)
├── ui/
│   ├── filter-panel.ts    # Left panel: renders chips from SceneState, handles click→filterChange
│   ├── tooltip.ts         # Hover tooltip: client name + title, positioned at star screen pos
│   └── detail-panel.ts    # Right panel: case detail on click (ported from v1)
├── style.css              # All CSS: tokens, filter panel, tooltip, detail panel, labels
└── main.ts                # Entry point: load cases.json → boot globe → boot orbital scene
```

**Tests location:** `src/**/*.test.ts` (Vitest, co-located)

---

## Task 1: Project scaffold — branch, Vite + TypeScript setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`

- [ ] **Step 1: Create branch from main**

```bash
cd "/mnt/c/Users/moham/Documents/Thales/work/design/case-study-explorer"
git checkout main
git checkout -b feat/v3-gravitational-spheres
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "case-study-explorer",
  "private": true,
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "three": "^0.170.0",
    "gsap": "^3.12.0",
    "d3": "^7.9.0",
    "topojson-client": "^3.1.0"
  },
  "devDependencies": {
    "@types/three": "^0.170.0",
    "@types/d3": "^7.4.0",
    "@types/topojson-client": "^3.1.4",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```ts
import { defineConfig } from 'vite';
export default defineConfig({
  build: { target: 'es2022' },
  test: { environment: 'node' },
});
```

- [ ] **Step 5: Create index.html**

Copy from `git show main:index.html` as base — we'll update its body in later tasks. For now keep it structurally identical but with a new `<script type="module" src="/src/main.ts"></script>` instead of `<script src="cosmos.js">`. Remove the old `<script>` tag for D3/Three from CDN — Vite will bundle them.

```bash
git show main:index.html > index.html
```

Then edit `index.html`: remove the three `<script src="...">` CDN tags at the bottom, replace with:
```html
<script type="module" src="/src/main.ts"></script>
```

- [ ] **Step 6: Create src/main.ts (stub)**

```ts
// Entry point — filled in Task 9
export {};
```

- [ ] **Step 7: Install dependencies and verify build**

```bash
npm install
npm run build
```

Expected: build succeeds, `dist/` created.

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/main.ts
git commit -m "feat: v3 scaffold — Vite + TypeScript project setup"
```

---

## Task 2: Data types and grouping logic

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/grouping.ts`
- Create: `src/data/grouping.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/data/grouping.test.ts
import { describe, it, expect } from 'vitest';
import { groupBy, SERVICE_TO_VERTICAL } from './grouping';
import type { CaseStudy } from './types';

const cases: CaseStudy[] = [
  { id: 'A', client: 'X', year: 2026, services: ['Video Ads'], countries: ['Spain'], region: 'Europe', permission: true, title: 'T1', challenge: '', approach: '', metrics: '' },
  { id: 'B', client: 'Y', year: 2025, services: ['SEA'], countries: ['France'], region: 'Europe', permission: false, title: 'T2', challenge: '', approach: '', metrics: '' },
  { id: 'C', client: 'Z', year: 2026, services: ['Amazon'], countries: ['US'], region: 'Americas', permission: true, title: 'T3', challenge: '', approach: '', metrics: '' },
];

describe('groupBy', () => {
  it('groups by vertical', () => {
    const groups = groupBy(cases, 'vertical');
    expect(groups['Media']).toHaveLength(1);
    expect(groups['Performance']).toHaveLength(1);
    expect(groups['Commerce']).toHaveLength(1);
  });
  it('groups by country', () => {
    const groups = groupBy(cases, 'country');
    expect(groups['Spain']).toHaveLength(1);
    expect(groups['France']).toHaveLength(1);
    expect(groups['US']).toHaveLength(1);
  });
  it('groups by region', () => {
    const groups = groupBy(cases, 'region');
    expect(groups['Europe']).toHaveLength(2);
    expect(groups['Americas']).toHaveLength(1);
  });
  it('SERVICE_TO_VERTICAL covers all known services', () => {
    const services = ['Video Ads','Social Paid','Programmatic','Media','SEA','Search','SEO','Amazon','Marketplaces','Feed','Commerce','Data','Data Measurement','Business strategy','Consulting','Organization','GEO','Creative','Influence'];
    services.forEach(s => expect(SERVICE_TO_VERTICAL[s]).toBeDefined());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `grouping.ts` not found.

- [ ] **Step 3: Create src/data/types.ts**

```ts
export interface CaseStudy {
  id: string;
  client: string;
  year: number;
  services: string[];
  countries: string[];
  region: string;
  permission: boolean;
  title: string;
  challenge: string;
  approach: string;
  metrics: string;
}

export type GroupMode = 'vertical' | 'country' | 'region';

export interface NucleusOrbit {
  key: string;           // group label e.g. "Media"
  center: { x: number; y: number; z: number }; // position at t=0
  orbitU: { x: number; y: number; z: number }; // orbital plane basis vector u
  orbitV: { x: number; y: number; z: number }; // orbital plane basis vector v
  orbitR: number;        // orbital radius around staging center
  phase: number;         // starting angle
  speed: number;         // rad/frame (0.00002–0.00008)
  cases: CaseStudy[];
}

export interface StarOrbit {
  caseStudy: CaseStudy;
  nucleusKey: string;
  orbitCenter: { x: number; y: number; z: number }; // nucleus world position at t=0
  u: { x: number; y: number; z: number };
  v: { x: number; y: number; z: number };
  r: number;
  phase: number;
  speed: number;         // rad/frame, signed (negative = retrograde)
}
```

- [ ] **Step 4: Create src/data/grouping.ts**

```ts
import type { CaseStudy, GroupMode } from './types';

export const SERVICE_TO_VERTICAL: Record<string, string> = {
  'Video Ads':         'Media',
  'Social Paid':       'Media',
  'Programmatic':      'Media',
  'Media':             'Media',
  'SEA':               'Performance',
  'Search':            'Performance',
  'SEO':               'Performance',
  'Amazon':            'Commerce',
  'Marketplaces':      'Commerce',
  'Feed':              'Commerce',
  'Commerce':          'Commerce',
  'Data':              'Data & Intelligence',
  'Data Measurement':  'Data & Intelligence',
  'Business strategy': 'Strategy',
  'Consulting':        'Strategy',
  'Organization':      'Strategy',
  'GEO':               'GEO',
  'Creative':          'Creative',
  'Influence':         'Creative',
};

export function groupBy(cases: CaseStudy[], mode: GroupMode): Record<string, CaseStudy[]> {
  const result: Record<string, CaseStudy[]> = {};
  for (const c of cases) {
    let key: string;
    if (mode === 'vertical') {
      key = SERVICE_TO_VERTICAL[c.services[0]] ?? 'Other';
    } else if (mode === 'country') {
      key = c.countries[0] ?? 'Other';
    } else {
      key = c.region ?? 'Other';
    }
    (result[key] ??= []).push(c);
  }
  return result;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test
```
Expected: PASS — 4 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/data/types.ts src/data/grouping.ts src/data/grouping.test.ts
git commit -m "feat: data types + groupBy function with vertical mapping"
```

---

## Task 3: Filter state logic

**Files:**
- Create: `src/data/filter.ts`
- Create: `src/data/filter.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/data/filter.test.ts
import { describe, it, expect } from 'vitest';
import { matchesFilter, getFilterableAttrs, createFilterState } from './filter';
import type { CaseStudy } from './types';

const c1: CaseStudy = { id: 'A', client: 'X', year: 2026, services: ['Video Ads', 'SEA'], countries: ['Spain', 'France'], region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: '' };
const c2: CaseStudy = { id: 'B', client: 'Y', year: 2025, services: ['Amazon'], countries: ['US'], region: 'Americas', permission: false, title: '', challenge: '', approach: '', metrics: '' };

describe('matchesFilter', () => {
  it('matches all when filter is empty', () => {
    const f = createFilterState();
    expect(matchesFilter(c1, f)).toBe(true);
    expect(matchesFilter(c2, f)).toBe(true);
  });
  it('filters by country (OR within set)', () => {
    const f = createFilterState();
    f.countries.add('Spain');
    expect(matchesFilter(c1, f)).toBe(true);
    expect(matchesFilter(c2, f)).toBe(false);
  });
  it('filters by year', () => {
    const f = createFilterState();
    f.years.add(2026);
    expect(matchesFilter(c1, f)).toBe(true);
    expect(matchesFilter(c2, f)).toBe(false);
  });
  it('filters by service', () => {
    const f = createFilterState();
    f.services.add('Amazon');
    expect(matchesFilter(c1, f)).toBe(false);
    expect(matchesFilter(c2, f)).toBe(true);
  });
  it('ANDs across filter dimensions', () => {
    const f = createFilterState();
    f.countries.add('Spain');
    f.years.add(2025);
    expect(matchesFilter(c1, f)).toBe(false); // Spain but wrong year
  });
  it('isActive returns false when empty', () => {
    expect(createFilterState().isActive()).toBe(false);
  });
});

describe('getFilterableAttrs', () => {
  it('returns unique countries from cases', () => {
    const attrs = getFilterableAttrs([c1, c2]);
    expect(attrs.countries).toContain('Spain');
    expect(attrs.countries).toContain('France');
    expect(attrs.countries).toContain('US');
  });
  it('returns unique services from cases', () => {
    const attrs = getFilterableAttrs([c1, c2]);
    expect(attrs.services).toContain('Video Ads');
    expect(attrs.services).toContain('Amazon');
  });
  it('returns unique years sorted', () => {
    const attrs = getFilterableAttrs([c1, c2]);
    expect(attrs.years).toEqual([2025, 2026]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `filter.ts` not found.

- [ ] **Step 3: Create src/data/filter.ts**

```ts
import type { CaseStudy } from './types';

export interface FilterState {
  countries: Set<string>;
  services: Set<string>;
  years: Set<number>;
  nucleusKeys: Set<string>; // for global view — which sphere-nuclei are pulled to staging
  isActive(): boolean;
}

export interface FilterableAttrs {
  countries: string[];
  services: string[];
  years: number[];
}

export function createFilterState(): FilterState {
  return {
    countries: new Set(),
    services: new Set(),
    years: new Set(),
    nucleusKeys: new Set(),
    isActive() {
      return this.countries.size > 0 || this.services.size > 0 ||
             this.years.size > 0 || this.nucleusKeys.size > 0;
    },
  };
}

export function matchesFilter(c: CaseStudy, f: FilterState): boolean {
  if (f.countries.size > 0 && !c.countries.some(co => f.countries.has(co))) return false;
  if (f.services.size > 0 && !c.services.some(s => f.services.has(s))) return false;
  if (f.years.size > 0 && !f.years.has(c.year)) return false;
  return true;
}

export function getFilterableAttrs(cases: CaseStudy[]): FilterableAttrs {
  const countries = [...new Set(cases.flatMap(c => c.countries))].sort();
  const services  = [...new Set(cases.flatMap(c => c.services))].sort();
  const years     = [...new Set(cases.map(c => c.year))].sort((a, b) => a - b);
  return { countries, services, years };
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/data/filter.ts src/data/filter.test.ts
git commit -m "feat: filter state — matchesFilter + getFilterableAttrs"
```

---

## Task 4: Hash function + inner orbital mechanic

**Files:**
- Create: `src/scene/orbitals/hash.ts`
- Create: `src/scene/orbitals/star-orbit.ts`
- Create: `src/scene/orbitals/star-orbit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/scene/orbitals/star-orbit.test.ts
import { describe, it, expect } from 'vitest';
import { hash } from './hash';
import { computeStarOrbit } from './star-orbit';
import type { CaseStudy } from '../../data/types';

const c: CaseStudy = { id: 'CASE-001', client: 'X', year: 2026, services: ['SEA'], countries: ['Spain'], region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: '' };
const center = { x: 100, y: 50, z: 30 };

describe('hash', () => {
  it('returns value in [0,1)', () => {
    const h = hash('test');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(1);
  });
  it('is deterministic', () => {
    expect(hash('abc')).toBe(hash('abc'));
  });
  it('returns different values for different strings', () => {
    expect(hash('abc')).not.toBe(hash('xyz'));
  });
});

describe('computeStarOrbit', () => {
  it('produces a StarOrbit with the correct nucleusKey', () => {
    const orbit = computeStarOrbit(c, 'Performance', center, 10, 60);
    expect(orbit.nucleusKey).toBe('Performance');
    expect(orbit.caseStudy.id).toBe('CASE-001');
  });
  it('orbital radius is within [rMin, rMax]', () => {
    const orbit = computeStarOrbit(c, 'Performance', center, 10, 60);
    expect(orbit.r).toBeGreaterThanOrEqual(10);
    expect(orbit.r).toBeLessThanOrEqual(60);
  });
  it('u and v vectors are orthogonal', () => {
    const orbit = computeStarOrbit(c, 'Performance', center, 10, 60);
    const dot = orbit.u.x * orbit.v.x + orbit.u.y * orbit.v.y + orbit.u.z * orbit.v.z;
    expect(Math.abs(dot)).toBeLessThan(0.001);
  });
  it('u is a unit vector', () => {
    const orbit = computeStarOrbit(c, 'Performance', center, 10, 60);
    const len = Math.sqrt(orbit.u.x**2 + orbit.u.y**2 + orbit.u.z**2);
    expect(len).toBeCloseTo(1, 5);
  });
  it('is deterministic — same inputs same output', () => {
    const a = computeStarOrbit(c, 'Performance', center, 10, 60);
    const b = computeStarOrbit(c, 'Performance', center, 10, 60);
    expect(a.r).toBe(b.r);
    expect(a.phase).toBe(b.phase);
    expect(a.speed).toBe(b.speed);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — files not found.

- [ ] **Step 3: Create src/scene/orbitals/hash.ts**

```ts
// Ported verbatim from v1 cosmos.js
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
```

- [ ] **Step 4: Create src/scene/orbitals/star-orbit.ts**

```ts
// Ported and typed from v1 cosmos.js lines 374-406
import { hash } from './hash';
import type { CaseStudy, StarOrbit } from '../../data/types';

interface Vec3 { x: number; y: number; z: number }

function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function computeStarOrbit(
  c: CaseStudy,
  nucleusKey: string,
  nucleusCenter: Vec3,
  rMin: number,
  rMax: number,
): StarOrbit {
  const ah = 'orb' + c.id;
  const ax = normalize({
    x: hash(ah + 'ax') - 0.5,
    y: hash(ah + 'ay') - 0.5,
    z: hash(ah + 'az') - 0.5,
  });
  let up: Vec3 = { x: 0, y: 1, z: 0 };
  if (Math.abs(ax.x * up.x + ax.y * up.y + ax.z * up.z) > 0.92) up = { x: 1, y: 0, z: 0 };
  const u = normalize(cross(ax, up));
  const v = normalize(cross(ax, u));
  const r = rMin === rMax ? 0 : rMin + hash(ah + 'r') * (rMax - rMin);
  const phase = hash(ah + 'p') * Math.PI * 2;
  const dir = hash(ah + 'd') > 0.5 ? 1 : -1;
  const speed = (0.00008 + hash(ah + 's') * 0.00020) * dir;
  return { caseStudy: c, nucleusKey, orbitCenter: nucleusCenter, u, v, r, phase, speed };
}

export function starPositionAt(orbit: StarOrbit, t: number): Vec3 {
  const a = orbit.phase + t * orbit.speed;
  return {
    x: orbit.orbitCenter.x + orbit.r * (orbit.u.x * Math.cos(a) + orbit.v.x * Math.sin(a)),
    y: orbit.orbitCenter.y + orbit.r * (orbit.u.y * Math.cos(a) + orbit.v.y * Math.sin(a)),
    z: orbit.orbitCenter.z + orbit.r * (orbit.u.z * Math.cos(a) + orbit.v.z * Math.sin(a)),
  };
}
```

- [ ] **Step 5: Run tests**

```bash
npm test
```
Expected: PASS — all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/scene/orbitals/hash.ts src/scene/orbitals/star-orbit.ts src/scene/orbitals/star-orbit.test.ts
git commit -m "feat: hash + inner star orbital mechanic (ported from v1)"
```

---

## Task 5: Outer orbital mechanic (nucleus orbits staging center)

**Files:**
- Create: `src/scene/orbitals/nucleus-orbit.ts`
- Create: `src/scene/orbitals/nucleus-orbit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/scene/orbitals/nucleus-orbit.test.ts
import { describe, it, expect } from 'vitest';
import { computeNucleusOrbits, nucleusPositionAt } from './nucleus-orbit';
import type { CaseStudy } from '../../data/types';

const cases: CaseStudy[] = [
  { id: 'A', client: 'X', year: 2026, services: ['Video Ads'], countries: ['Spain'], region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: '' },
  { id: 'B', client: 'Y', year: 2025, services: ['SEA'], countries: ['France'], region: 'Europe', permission: false, title: '', challenge: '', approach: '', metrics: '' },
];
const groups = { 'Media': [cases[0]], 'Performance': [cases[1]] };

describe('computeNucleusOrbits', () => {
  it('produces one NucleusOrbit per group key', () => {
    const orbits = computeNucleusOrbits(groups);
    expect(Object.keys(orbits)).toHaveLength(2);
    expect(orbits['Media']).toBeDefined();
    expect(orbits['Performance']).toBeDefined();
  });
  it('each nucleus orbit speed is in outer range', () => {
    const orbits = computeNucleusOrbits(groups);
    for (const key of Object.keys(orbits)) {
      const speed = Math.abs(orbits[key].speed);
      expect(speed).toBeGreaterThanOrEqual(0.00002);
      expect(speed).toBeLessThanOrEqual(0.00008);
    }
  });
  it('is deterministic — same keys produce same orbits', () => {
    const a = computeNucleusOrbits(groups);
    const b = computeNucleusOrbits(groups);
    expect(a['Media'].phase).toBe(b['Media'].phase);
    expect(a['Media'].orbitR).toBe(b['Media'].orbitR);
  });
  it('u and v are orthogonal on nucleus orbit', () => {
    const orbits = computeNucleusOrbits(groups);
    const o = orbits['Media'];
    const dot = o.orbitU.x*o.orbitV.x + o.orbitU.y*o.orbitV.y + o.orbitU.z*o.orbitV.z;
    expect(Math.abs(dot)).toBeLessThan(0.001);
  });
});

describe('nucleusPositionAt', () => {
  it('returns position on orbit at t=0 matching center', () => {
    const orbits = computeNucleusOrbits(groups);
    const o = orbits['Media'];
    const pos = nucleusPositionAt(o, 0);
    // At t=0, position = orbitR*(u*cos(phase)+v*sin(phase))
    const expectedX = o.orbitR * (o.orbitU.x * Math.cos(o.phase) + o.orbitV.x * Math.sin(o.phase));
    expect(pos.x).toBeCloseTo(expectedX, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `nucleus-orbit.ts` not found.

- [ ] **Step 3: Create src/scene/orbitals/nucleus-orbit.ts**

```ts
import { hash } from './hash';
import type { CaseStudy } from '../../data/types';

interface Vec3 { x: number; y: number; z: number }

function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x**2 + v.y**2 + v.z**2);
  return { x: v.x/len, y: v.y/len, z: v.z/len };
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y*b.z - a.z*b.y, y: a.z*b.x - a.x*b.z, z: a.x*b.y - a.y*b.x };
}

export interface NucleusOrbitData {
  key: string;
  orbitR: number;
  orbitU: Vec3;
  orbitV: Vec3;
  phase: number;
  speed: number;   // signed rad/frame (0.00002–0.00008)
  cases: CaseStudy[];
}

// All nuclei orbit the staging center at (0,0,0) at different radii (200–400)
const NUCLEUS_ORBIT_RMIN = 200;
const NUCLEUS_ORBIT_RMAX = 400;

export function computeNucleusOrbits(
  groups: Record<string, CaseStudy[]>
): Record<string, NucleusOrbitData> {
  const result: Record<string, NucleusOrbitData> = {};
  for (const key of Object.keys(groups)) {
    const nh = 'nuc' + key;
    const ax = normalize({
      x: hash(nh + 'ax') - 0.5,
      y: hash(nh + 'ay') - 0.5,
      z: hash(nh + 'az') - 0.5,
    });
    let up: Vec3 = { x: 0, y: 1, z: 0 };
    if (Math.abs(ax.x*up.x + ax.y*up.y + ax.z*up.z) > 0.92) up = { x: 1, y: 0, z: 0 };
    const u = normalize(cross(ax, up));
    const v = normalize(cross(ax, u));
    const orbitR = NUCLEUS_ORBIT_RMIN + hash(nh + 'r') * (NUCLEUS_ORBIT_RMAX - NUCLEUS_ORBIT_RMIN);
    const phase = hash(nh + 'p') * Math.PI * 2;
    const dir = hash(nh + 'd') > 0.5 ? 1 : -1;
    const speed = (0.00002 + hash(nh + 's') * 0.00006) * dir;
    result[key] = { key, orbitR, orbitU: u, orbitV: v, phase, speed, cases: groups[key] };
  }
  return result;
}

export function nucleusPositionAt(o: NucleusOrbitData, t: number): Vec3 {
  const a = o.phase + t * o.speed;
  return {
    x: o.orbitR * (o.orbitU.x * Math.cos(a) + o.orbitV.x * Math.sin(a)),
    y: o.orbitR * (o.orbitU.y * Math.cos(a) + o.orbitV.y * Math.sin(a)),
    z: o.orbitR * (o.orbitU.z * Math.cos(a) + o.orbitV.z * Math.sin(a)),
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/scene/orbitals/nucleus-orbit.ts src/scene/orbitals/nucleus-orbit.test.ts
git commit -m "feat: outer nucleus orbital mechanic around staging center"
```

---

## Task 6: Phyllotaxis staging formation

**Files:**
- Create: `src/scene/orbitals/staging.ts`
- Create: `src/scene/orbitals/staging.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/scene/orbitals/staging.test.ts
import { describe, it, expect } from 'vitest';
import { computeStagingPositions } from './staging';

describe('computeStagingPositions', () => {
  it('returns N positions for N stars', () => {
    const positions = computeStagingPositions(10, 80);
    expect(positions).toHaveLength(10);
  });
  it('first star is near center', () => {
    const positions = computeStagingPositions(5, 80);
    const r = Math.sqrt(positions[0].x**2 + positions[0].y**2 + positions[0].z**2);
    expect(r).toBeLessThan(20);
  });
  it('positions lie on a disk facing the +Z axis (z component is small)', () => {
    const positions = computeStagingPositions(20, 80);
    for (const p of positions) {
      expect(Math.abs(p.z)).toBeLessThan(5);
    }
  });
  it('radius grows with index', () => {
    const positions = computeStagingPositions(10, 80);
    const r0 = Math.sqrt(positions[0].x**2 + positions[0].y**2);
    const r9 = Math.sqrt(positions[9].x**2 + positions[9].y**2);
    expect(r9).toBeGreaterThan(r0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `staging.ts` not found.

- [ ] **Step 3: Create src/scene/orbitals/staging.ts**

```ts
// Phyllotaxis (golden angle) spiral formation at (0,0,0)
// Stars fill a camera-facing disk. Same mechanic as v1's gather.

interface Vec3 { x: number; y: number; z: number }

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~137.508°

export function computeStagingPositions(count: number, radius: number): Vec3[] {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = i * GOLDEN_ANGLE;
    const r = radius * Math.sqrt((i + 1) / count);
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
      z: 0,
    };
  });
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/scene/orbitals/staging.ts src/scene/orbitals/staging.test.ts
git commit -m "feat: phyllotaxis staging formation for filtered stars"
```

---

## Task 7: CSS — tokens, filter panel, tooltip, detail panel

**Files:**
- Create: `src/style.css`

- [ ] **Step 1: Create src/style.css**

Port `styles.css` from `main` branch as the base, then apply these changes:

```bash
git show main:styles.css > src/style.css
```

Then apply these edits to `src/style.css`:

**a) Update `:root` token block** — find the `:root` block and replace it:

```css
:root {
  --bg:    #0B0C10;
  --surf:  #1A1A1A;
  --surf2: #212121;
  --surf3: #2A2A2A;
  --teal:  #5ecfc0;
  --gold:  #e8b15a;
  --ease:  cubic-bezier(0.16, 1, 0.3, 1);
}
```

**b) Remove purple tokens** — delete any line containing `--purple`, `--purple-d`, `--deep`, `--ppink`.

**c) Replace `.fchip.on` active state** — change from the purple gradient to gold:

```css
.fchip.on {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(232,177,90,.12);
}
```

**d) Add staging section styles** at end of filter panel section:

```css
.filters-staging {
  padding: 10px 14px 12px;
  border-top: 1px solid rgba(232,177,90,.15);
}
.filters-staging .fs-label {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: .6;
  margin-bottom: 6px;
}
.filters-staging .fs-count {
  font-family: 'DM Mono', monospace;
  font-size: 22px;
  color: var(--teal);
  opacity: .35;
  line-height: 1;
  margin-bottom: 3px;
}
.filters-staging .fs-status {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: var(--teal);
  opacity: .6;
  letter-spacing: .06em;
}
.filters-staging .fs-clear {
  background: none;
  border: none;
  color: rgba(94,207,192,.5);
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: .12em;
  cursor: pointer;
  padding: 0;
  margin-top: 4px;
  display: block;
}
.filters-staging .fs-clear:hover { color: var(--teal); }
```

**e) Add mode switcher styles**:

```css
.mode-row {
  display: flex;
  gap: 5px;
  padding: 10px 14px 12px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.mode-chip {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: .15em;
  text-transform: uppercase;
  padding: 4px 9px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 2px;
  background: none;
  color: rgba(255,255,255,.35);
  cursor: pointer;
  transition: border-color .12s, color .12s;
}
.mode-chip.active {
  border-color: var(--teal);
  color: var(--teal);
}
```

**f) Add tooltip styles**:

```css
#star-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 40;
  background: rgba(14,16,22,.96);
  border-left: 2px solid var(--gold);
  padding: 8px 12px;
  border-radius: 2px;
  max-width: 220px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity .12s var(--ease), transform .12s var(--ease);
}
#star-tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}
.tip-client {
  font-family: 'Noto Sans', sans-serif;
  font-size: 11px;
  font-weight: 900;
  color: #e8e8e8;
  margin-bottom: 3px;
}
.tip-title {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: rgba(255,255,255,.5);
  letter-spacing: .04em;
  line-height: 1.4;
}
.tip-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}
```

**g) Verify single `--ease`:**

```bash
grep -c "cubic-bezier" src/style.css
```
Expected: `1`

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat: CSS token system — gold replaces purple, staging + tooltip + mode-chip styles"
```

---

## Task 8: Three.js renderer + scene setup

**Files:**
- Create: `src/scene/renderer.ts`
- Create: `src/scene/background/starfield.ts`

- [ ] **Step 1: Create src/scene/background/starfield.ts**

Port the ambient starfield from v1 `cosmos.js` (the immediately-invoked function at "LAYER 1"):

```ts
import * as THREE from 'three';

// Ported verbatim from v1 cosmos.js LAYER 1
export function createStarfield(canvas: HTMLCanvasElement): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
  cam.position.z = 400;

  function layer(n: number, spread: number, sz: number, col: number): THREE.Points {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p[i*3]   = (Math.random() - 0.5) * spread;
      p[i*3+1] = (Math.random() - 0.5) * spread;
      p[i*3+2] = (Math.random() - 0.5) * spread;
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({
      color: col, size: sz, sizeAttenuation: true, transparent: true,
      opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
  }

  const far = layer(1400, 1600, 0.9, 0xfff4dd);
  const mid = layer(500,  900,  1.4, 0xffdba4);
  const nr  = layer(120,  600,  2.6, 0xe8b15a);
  scene.add(far, mid, nr);

  let rafId: number;
  function tick(t: number) {
    t *= 0.0001;
    far.rotation.y = t * 0.3; far.rotation.x = t * 0.1;
    mid.rotation.y = t * 0.6; mid.rotation.x = t * 0.2;
    nr.rotation.y  = t * 0.9; nr.rotation.x  = t * 0.3;
    renderer.render(scene, cam);
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  const onResize = () => {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(rafId);
    removeEventListener('resize', onResize);
    renderer.dispose();
  };
}
```

- [ ] **Step 2: Create src/scene/renderer.ts**

```ts
import * as THREE from 'three';

export interface RendererContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  dispose: () => void;
}

export function createRenderer(canvas: HTMLCanvasElement): RendererContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 3000);
  camera.position.set(0, 0, 900);

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener('resize', onResize);

  return {
    scene,
    camera,
    renderer,
    dispose: () => {
      removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/scene/renderer.ts src/scene/background/starfield.ts
git commit -m "feat: Three.js renderer + ambient starfield (ported from v1)"
```

---

## Task 9: Orbital scene — build nuclei + stars in Three.js

**Files:**
- Create: `src/scene/scene-state.ts`
- Modify: `src/main.ts`

This task builds the full orbital scene from the computed orbit data and wires it into the tick loop.

- [ ] **Step 1: Create src/scene/scene-state.ts**

```ts
import * as THREE from 'three';
import { gsap } from 'gsap';
import type { CaseStudy, GroupMode } from '../data/types';
import type { NucleusOrbitData } from './orbitals/nucleus-orbit';
import type { StarOrbit } from '../data/types';
import { groupBy } from '../data/grouping';
import { computeNucleusOrbits, nucleusPositionAt } from './orbitals/nucleus-orbit';
import { computeStarOrbit, starPositionAt } from './orbitals/star-orbit';
import { computeStagingPositions } from './orbitals/staging';
import { createFilterState, matchesFilter } from '../data/filter';
import type { FilterState } from '../data/filter';

export type SceneMode = 'global' | 'focused';

// Colour palette per vertical key (teal/gold system, no purple)
const NUCLEUS_COLORS: Record<string, number> = {
  'Media':              0x5ecfc0,
  'Performance':        0xe8b15a,
  'Commerce':           0xa9f0d1,
  'Data & Intelligence':0xb9e4ff,
  'Strategy':           0xffdba4,
  'GEO':                0xffc6d9,
  'Creative':           0xffe29a,
};
const DEFAULT_COLOR = 0xfff4dd;

export interface SceneObjects {
  nucleusMeshes: Map<string, THREE.Mesh>;
  nucleusLabels: Map<string, HTMLDivElement>;
  starMeshes: THREE.Mesh[];
  starOrbits: StarOrbit[];
  nucleusOrbits: Record<string, NucleusOrbitData>;
  filterState: FilterState;
  mode: SceneMode;
  focusedKey: string | null;
  groupMode: GroupMode;
}

export function buildOrbitalScene(
  cases: CaseStudy[],
  groupMode: GroupMode,
  scene: THREE.Scene,
  labelContainer: HTMLElement,
): SceneObjects {
  const groups = groupBy(cases, groupMode);
  const nucleusOrbits = computeNucleusOrbits(groups);

  const nucleusMeshes = new Map<string, THREE.Mesh>();
  const nucleusLabels = new Map<string, HTMLDivElement>();
  const starMeshes: THREE.Mesh[] = [];
  const starOrbits: StarOrbit[] = [];

  for (const [key, nucOrbit] of Object.entries(nucleusOrbits)) {
    const color = NUCLEUS_COLORS[key] ?? DEFAULT_COLOR;
    const nucPos = nucleusPositionAt(nucOrbit, 0);

    // Nucleus glow mesh
    const geo = new THREE.SphereGeometry(6, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(nucPos.x, nucPos.y, nucPos.z);
    mesh.userData = { key, isNucleus: true, nucleusOrbit: nucOrbit };
    scene.add(mesh);
    nucleusMeshes.set(key, mesh);

    // Nucleus halo
    const haloGeo = new THREE.SphereGeometry(8, 12, 12);
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, side: THREE.BackSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(mesh.position);
    scene.add(halo);
    mesh.userData.halo = halo;

    // Nucleus label
    const div = document.createElement('div');
    div.className = 'cl';
    div.innerHTML = `<span class="cl-name">${key}</span><span class="cl-count">${nucOrbit.cases.length}</span>`;
    labelContainer.appendChild(div);
    nucleusLabels.set(key, div);

    // Stars for this nucleus
    const n = nucOrbit.cases.length;
    const rMin = Math.max(30, 15 + Math.sqrt(n) * 8);
    const rMax = Math.max(rMin + 20, rMin + Math.sqrt(n) * 12);

    for (const c of nucOrbit.cases) {
      const starOrbit = computeStarOrbit(c, key, nucPos, rMin, rMax);
      const initPos = starPositionAt(starOrbit, 0);

      const sGeo = new THREE.SphereGeometry(2.5, 8, 8);
      const sMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const star = new THREE.Mesh(sGeo, sMat);
      star.position.set(initPos.x, initPos.y, initPos.z);
      star.userData = { caseStudy: c, starOrbit, isFiltered: false, isStagingTarget: false };
      scene.add(star);
      starMeshes.push(star);
      starOrbits.push(starOrbit);
    }
  }

  // Staging center glow
  const stagingGeo = new THREE.SphereGeometry(10, 16, 16);
  const stagingMat = new THREE.MeshBasicMaterial({ color: 0xe8b15a, transparent: true, opacity: 0.08 });
  const stagingMesh = new THREE.Mesh(stagingGeo, stagingMat);
  stagingMesh.position.set(0, 0, 0);
  scene.add(stagingMesh);

  return {
    nucleusMeshes,
    nucleusLabels,
    starMeshes,
    starOrbits,
    nucleusOrbits,
    filterState: createFilterState(),
    mode: 'global',
    focusedKey: null,
    groupMode,
  };
}

// Per-frame orbital position update — call from tick loop
export function tickOrbits(
  objects: SceneObjects,
  t: number,
  camera: THREE.Camera,
): void {
  const { nucleusMeshes, nucleusOrbits, starMeshes, filterState } = objects;
  const prefersReduced = matchesReducedMotion();

  // Update nucleus positions (outer orbital)
  for (const [key, nucOrbit] of Object.entries(nucleusOrbits)) {
    const mesh = nucleusMeshes.get(key)!;
    const pos = prefersReduced ? nucleusPositionAt(nucOrbit, 0) : nucleusPositionAt(nucOrbit, t);
    mesh.position.set(pos.x, pos.y, pos.z);
    if (mesh.userData.halo) mesh.userData.halo.position.copy(mesh.position);
    // Update star orbit centers to follow nucleus
    for (const star of starMeshes) {
      if (star.userData.starOrbit?.nucleusKey === key) {
        star.userData.starOrbit = { ...star.userData.starOrbit, orbitCenter: pos };
      }
    }
  }

  // Update star positions (inner orbital, unless staging)
  const anyFilter = filterState.isActive();
  for (const star of starMeshes) {
    if (star.userData.isStagingTarget) continue; // GSAP controls staging stars
    const orbit: StarOrbit = star.userData.starOrbit;
    const pos = prefersReduced ? starPositionAt(orbit, 0) : starPositionAt(orbit, t);
    star.position.lerp(new THREE.Vector3(pos.x, pos.y, pos.z), 0.055);
    // Opacity: dim unmatched stars when filter is active
    const mat = star.material as THREE.MeshBasicMaterial;
    const isMatch = !anyFilter || matchesFilter(star.userData.caseStudy, filterState);
    mat.opacity = isMatch ? 0.85 : 0.15;
  }
}

function matchesReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Migrate matched stars to staging center
export function applyFilter(
  objects: SceneObjects,
  newFilter: FilterState,
): void {
  const { starMeshes, nucleusOrbits } = objects;
  objects.filterState = newFilter;

  let matchedStars: THREE.Mesh[] = [];
  if (objects.mode === 'global') {
    // In global mode, filter by nucleus key (pulling whole spheres) or by case attrs
    matchedStars = starMeshes.filter(s => {
      const c = s.userData.caseStudy as CaseStudy;
      if (newFilter.nucleusKeys.size > 0) {
        return newFilter.nucleusKeys.has(s.userData.starOrbit.nucleusKey);
      }
      return matchesFilter(c, newFilter);
    });
  } else {
    // In focused mode, filter within the focused sphere only
    matchedStars = starMeshes.filter(s => {
      const c = s.userData.caseStudy as CaseStudy;
      if (s.userData.starOrbit.nucleusKey !== objects.focusedKey) return false;
      return matchesFilter(c, newFilter);
    });
  }

  const stagingPositions = computeStagingPositions(matchedStars.length, 80);

  for (const [i, star] of matchedStars.entries()) {
    star.userData.isStagingTarget = true;
    const pos = stagingPositions[i];
    gsap.to(star.position, {
      x: pos.x, y: pos.y, z: pos.z,
      duration: 1.0, ease: 'power2.out',
    });
  }

  // Return unmatched (previously staged) stars to orbit
  for (const star of starMeshes) {
    if (!matchedStars.includes(star) && star.userData.isStagingTarget) {
      star.userData.isStagingTarget = false;
      // GSAP will stop controlling; tickOrbits lerps them back
    }
  }
}

// Clear all filters — stars fly home
export function clearFilter(objects: SceneObjects): void {
  objects.filterState = createFilterState();
  for (const star of objects.starMeshes) {
    star.userData.isStagingTarget = false;
    // tickOrbits will lerp them back to orbital positions
  }
}
```

- [ ] **Step 2: Update src/main.ts**

```ts
import '../src/style.css'; // Vite processes this
import casesJson from '../cases.json';
import { createStarfield } from './scene/background/starfield';
import { createRenderer } from './scene/renderer';
import { buildOrbitalScene, tickOrbits } from './scene/scene-state';
import type { CaseStudy } from './data/types';

const cases = casesJson as CaseStudy[];

// Boot starfield (Layer 0 — always on)
const starfieldCanvas = document.getElementById('starfield') as HTMLCanvasElement;
createStarfield(starfieldCanvas);

// Boot orbital scene (Layer 3)
const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const { scene, camera, renderer } = createRenderer(mainCanvas);
const labelContainer = document.getElementById('star-labels') as HTMLElement;

const sceneObjects = buildOrbitalScene(cases, 'vertical', scene, labelContainer);

// Tick loop
function tick(t: number) {
  requestAnimationFrame(tick);
  tickOrbits(sceneObjects, t, camera);
  renderer.render(scene, camera);
}
requestAnimationFrame(tick);
```

- [ ] **Step 3: Update index.html — add required DOM elements**

Ensure `index.html` has these elements (add if missing):
```html
<canvas id="starfield" style="position:fixed;inset:0;z-index:0;pointer-events:none"></canvas>
<canvas id="main-canvas" style="position:fixed;inset:0;z-index:3"></canvas>
<div id="star-labels" style="position:fixed;inset:0;z-index:4;pointer-events:none"></div>
```

- [ ] **Step 4: Build and verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected: ambient starfield visible + sphere-nuclei glowing points orbiting a faint gold center, case stars orbiting each nucleus.

- [ ] **Step 5: Commit**

```bash
git add src/scene/scene-state.ts src/main.ts index.html
git commit -m "feat: full orbital scene — nuclei orbit staging, stars orbit nuclei"
```

---

## Task 10: Filter panel UI

**Files:**
- Create: `src/ui/filter-panel.ts`

- [ ] **Step 1: Create src/ui/filter-panel.ts**

```ts
import type { SceneObjects } from '../scene/scene-state';
import type { GroupMode } from '../data/types';
import { createFilterState } from '../data/filter';
import { getFilterableAttrs } from '../data/filter';
import { applyFilter, clearFilter } from '../scene/scene-state';

export function mountFilterPanel(
  container: HTMLElement,
  objects: SceneObjects,
  onGroupModeChange: (mode: GroupMode) => void,
): void {
  render();

  function render() {
    container.innerHTML = buildHTML(objects);
    bindEvents();
  }

  function buildHTML(obj: SceneObjects): string {
    const isGlobal = obj.mode === 'global';
    const isActive = obj.filterState.isActive();
    const staged = isActive
      ? obj.starMeshes.filter(s => s.userData.isStagingTarget).length
      : 0;

    if (isGlobal) {
      const keys = Object.keys(obj.nucleusOrbits).sort();
      const chips = keys.map(k => {
        const count = obj.nucleusOrbits[k].cases.length;
        const on = obj.filterState.nucleusKeys.has(k) ? ' on' : '';
        return `<button class="fchip${on}" data-key="${k}">${k} <span class="dot"></span>×${count}</button>`;
      }).join('');

      const modeChips = (['vertical','country','region'] as GroupMode[]).map(m => {
        const active = obj.groupMode === m ? ' active' : '';
        return `<button class="mode-chip${active}" data-mode="${m}">${m}</button>`;
      }).join('');

      return `
        <div class="filters-head">
          <h3>Filter</h3>
          ${isActive ? '<button class="clr" id="filterClear">Reset</button>' : ''}
        </div>
        <div class="mode-row">${modeChips}</div>
        <div class="filters-body">
          <div class="fgroup"><div class="fg-label">Pull to staging</div>
          <div class="fchips" id="fc-nuclei">${chips}</div></div>
        </div>
        ${staged > 0 ? `
        <div class="filters-staging">
          <div class="fs-label">Staging</div>
          <div class="fs-count">${staged}</div>
          <div class="fs-status">${staged} stars en route</div>
          <button class="fs-clear" id="stagingClear">clear → fly home</button>
        </div>` : ''}
      `;
    } else {
      // Focused view — case attribute filters
      const focusedCases = obj.starMeshes
        .filter(s => s.userData.starOrbit?.nucleusKey === obj.focusedKey)
        .map(s => s.userData.caseStudy);
      const attrs = getFilterableAttrs(focusedCases);
      const countriesHTML = attrs.countries.map(c => {
        const on = obj.filterState.countries.has(c) ? ' on' : '';
        const cnt = focusedCases.filter(cs => cs.countries.includes(c)).length;
        return `<button class="fchip${on}" data-country="${c}">${c} ×${cnt}</button>`;
      }).join('');
      const servicesHTML = attrs.services.map(s => {
        const on = obj.filterState.services.has(s) ? ' on' : '';
        const cnt = focusedCases.filter(cs => cs.services.includes(s)).length;
        return `<button class="fchip${on}" data-service="${s}">${s} ×${cnt}</button>`;
      }).join('');
      const yearsHTML = attrs.years.map(y => {
        const on = obj.filterState.years.has(y) ? ' on' : '';
        const cnt = focusedCases.filter(cs => cs.year === y).length;
        return `<button class="fchip${on}" data-year="${y}">${y} ×${cnt}</button>`;
      }).join('');

      return `
        <div class="filters-head">
          <button class="clr" id="focusBack">← ${obj.focusedKey}</button>
          ${isActive ? '<button class="clr" id="filterClear">Reset</button>' : ''}
        </div>
        <div class="filters-body">
          <div class="fgroup"><div class="fg-label">Country</div>
            <div class="fchips">${countriesHTML}</div></div>
          <div class="fgroup"><div class="fg-label">Service</div>
            <div class="fchips">${servicesHTML}</div></div>
          <div class="fgroup"><div class="fg-label">Year</div>
            <div class="fchips">${yearsHTML}</div></div>
        </div>
        ${staged > 0 ? `
        <div class="filters-staging">
          <div class="fs-label">Staging — ${obj.focusedKey}</div>
          <div class="fs-count">${staged}</div>
          <div class="fs-status">${staged} stars en route</div>
          <button class="fs-clear" id="stagingClear">clear → fly home</button>
        </div>` : ''}
      `;
    }
  }

  function bindEvents() {
    container.querySelector('#filterClear')?.addEventListener('click', () => {
      clearFilter(objects);
      render();
    });
    container.querySelector('#stagingClear')?.addEventListener('click', () => {
      clearFilter(objects);
      render();
    });
    container.querySelector('#focusBack')?.addEventListener('click', () => {
      objects.mode = 'global';
      objects.focusedKey = null;
      clearFilter(objects);
      render();
    });

    // Mode chips
    container.querySelectorAll('.mode-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.mode as GroupMode;
        onGroupModeChange(mode);
      });
    });

    // Nucleus chips (global view)
    container.querySelectorAll('.fchip[data-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = (btn as HTMLElement).dataset.key!;
        const f = { ...objects.filterState, nucleusKeys: new Set(objects.filterState.nucleusKeys) };
        f.nucleusKeys.has(key) ? f.nucleusKeys.delete(key) : f.nucleusKeys.add(key);
        applyFilter(objects, f);
        render();
      });
    });

    // Country chips (focused view)
    container.querySelectorAll('.fchip[data-country]').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = (btn as HTMLElement).dataset.country!;
        const f = { ...objects.filterState, countries: new Set(objects.filterState.countries) };
        f.countries.has(c) ? f.countries.delete(c) : f.countries.add(c);
        applyFilter(objects, f);
        render();
      });
    });

    // Service chips (focused view)
    container.querySelectorAll('.fchip[data-service]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = (btn as HTMLElement).dataset.service!;
        const f = { ...objects.filterState, services: new Set(objects.filterState.services) };
        f.services.has(s) ? f.services.delete(s) : f.services.add(s);
        applyFilter(objects, f);
        render();
      });
    });

    // Year chips (focused view)
    container.querySelectorAll('.fchip[data-year]').forEach(btn => {
      btn.addEventListener('click', () => {
        const y = parseInt((btn as HTMLElement).dataset.year!);
        const f = { ...objects.filterState, years: new Set(objects.filterState.years) };
        f.years.has(y) ? f.years.delete(y) : f.years.add(y);
        applyFilter(objects, f);
        render();
      });
    });
  }
}
```

- [ ] **Step 2: Wire filter panel into main.ts**

Add to `src/main.ts`:

```ts
import { mountFilterPanel } from './ui/filter-panel';
// ... after buildOrbitalScene:
const filterPanelEl = document.getElementById('filters') as HTMLElement;
mountFilterPanel(filterPanelEl, sceneObjects, (newMode) => {
  // Re-build scene with new group mode
  // (dispose old meshes, build new) — implemented fully in Task 11
  sceneObjects.groupMode = newMode;
});
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/ui/filter-panel.ts src/main.ts
git commit -m "feat: dynamic filter panel — global/focused modes, staging counter"
```

---

## Task 11: Hover tooltip + click detail panel

**Files:**
- Create: `src/ui/tooltip.ts`
- Create: `src/ui/detail-panel.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create src/ui/tooltip.ts**

```ts
import * as THREE from 'three';
import type { CaseStudy } from '../data/types';

const NUCLEUS_COLORS_HEX: Record<string, string> = {
  'Media': '#5ecfc0', 'Performance': '#e8b15a', 'Commerce': '#a9f0d1',
  'Data & Intelligence': '#b9e4ff', 'Strategy': '#ffdba4',
  'GEO': '#ffc6d9', 'Creative': '#ffe29a',
};

export class Tooltip {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'star-tooltip';
    document.body.appendChild(this.el);
  }

  show(c: CaseStudy, nucleusKey: string, screenX: number, screenY: number): void {
    const color = NUCLEUS_COLORS_HEX[nucleusKey] ?? '#fff4dd';
    this.el.innerHTML = `
      <div class="tip-client"><span class="tip-dot" style="background:${color}"></span>${c.client}</div>
      <div class="tip-title">${c.title}</div>
    `;
    this.el.style.left = `${screenX + 14}px`;
    this.el.style.top  = `${screenY - 10}px`;
    this.el.classList.add('visible');
  }

  hide(): void {
    this.el.classList.remove('visible');
  }
}

export function projectToScreen(
  position: THREE.Vector3,
  camera: THREE.Camera,
): { x: number; y: number } {
  const v = position.clone().project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * innerWidth,
    y: (-v.y * 0.5 + 0.5) * innerHeight,
  };
}
```

- [ ] **Step 2: Create src/ui/detail-panel.ts**

Port detail panel from v1. The panel shows case metadata in DM Mono instrument readout format:

```ts
import type { CaseStudy } from '../data/types';

export class DetailPanel {
  private panel: HTMLElement;
  private scrim: HTMLElement;

  constructor() {
    this.panel = document.getElementById('panel') as HTMLElement;
    this.scrim = document.getElementById('panelScrim') as HTMLElement;
    this.scrim.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  }

  open(c: CaseStudy): void {
    const inner = this.panel.querySelector('.panel-inner') as HTMLElement;
    inner.innerHTML = `
      <div class="pn-head">
        <div class="pn-client">${c.client}</div>
        <button class="pn-close" id="panelClose">✕</button>
      </div>
      <div class="pn-meta">
        <span class="pn-row"><span class="pn-key">YEAR</span><span class="pn-val">${c.year}</span></span>
        <span class="pn-row"><span class="pn-key">COUNTRY</span><span class="pn-val">${c.countries.join(', ')}</span></span>
        <span class="pn-row"><span class="pn-key">SERVICE</span><span class="pn-val">${c.services.join(', ')}</span></span>
      </div>
      <div class="pn-title">${c.title}</div>
      ${c.permission ? `
        <div class="pn-section"><div class="pn-section-label">CHALLENGE</div><div class="pn-body">${c.challenge}</div></div>
        <div class="pn-section"><div class="pn-section-label">APPROACH</div><div class="pn-body">${c.approach}</div></div>
        <div class="pn-section"><div class="pn-section-label">METRICS</div><div class="pn-body">${c.metrics}</div></div>
      ` : `<div class="pn-locked">Content restricted</div>`}
    `;
    inner.querySelector('#panelClose')?.addEventListener('click', () => this.close());
    this.panel.classList.add('open');
    this.scrim.classList.add('on');
  }

  close(): void {
    this.panel.classList.remove('open');
    this.scrim.classList.remove('on');
  }
}
```

- [ ] **Step 3: Wire raycasting + tooltip + panel into main.ts**

Add to `src/main.ts` after the tick loop:

```ts
import { Tooltip, projectToScreen } from './ui/tooltip';
import { DetailPanel } from './ui/detail-panel';
import * as THREE from 'three';

const tooltip = new Tooltip();
const detailPanel = new DetailPanel();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

mainCanvas.addEventListener('pointermove', (e) => {
  if (sceneObjects.filterState.isActive()) { tooltip.hide(); return; }
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(sceneObjects.starMeshes);
  if (hits.length > 0) {
    const star = hits[0].object as THREE.Mesh;
    const c = star.userData.caseStudy;
    const key = star.userData.starOrbit?.nucleusKey ?? '';
    tooltip.show(c, key, e.clientX, e.clientY);
  } else {
    tooltip.hide();
  }
});

mainCanvas.addEventListener('click', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  // Check nucleus click first (for focused view)
  const nucleusMeshArr = [...sceneObjects.nucleusMeshes.values()];
  const nucHits = raycaster.intersectObjects(nucleusMeshArr);
  if (nucHits.length > 0) {
    const key = (nucHits[0].object as THREE.Mesh).userData.key as string;
    sceneObjects.mode = 'focused';
    sceneObjects.focusedKey = key;
    // TODO Task 12: trigger sphere expand animation
    return;
  }
  // Star click
  const starHits = raycaster.intersectObjects(sceneObjects.starMeshes);
  if (starHits.length > 0) {
    const c = (starHits[0].object as THREE.Mesh).userData.caseStudy;
    detailPanel.open(c);
  }
});
```

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/tooltip.ts src/ui/detail-panel.ts src/main.ts
git commit -m "feat: hover tooltip + click detail panel with raycasting"
```

---

## Task 12: Sphere Expands to Fill — focus/unfocus transitions

**Files:**
- Modify: `src/scene/scene-state.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Add focusSphere and unfocusSphere to scene-state.ts**

Add these two exported functions to `src/scene/scene-state.ts`:

```ts
import { gsap } from 'gsap';

// Sphere Expands to Fill:
// - Camera moves closer to the focused nucleus
// - Other nuclei dim and drift outward
// - Focused nucleus's stars become more prominent
export function focusSphere(
  objects: SceneObjects,
  key: string,
  camera: THREE.Camera,
): void {
  objects.mode = 'focused';
  objects.focusedKey = key;
  const nucleus = objects.nucleusMeshes.get(key)!;

  // Animate camera toward nucleus
  const target = nucleus.position.clone().multiplyScalar(0.4); // close but not inside
  gsap.to(camera.position, {
    x: nucleus.position.x * 0.5,
    y: nucleus.position.y * 0.5,
    z: nucleus.position.z * 0.5 + 300,
    duration: 1.2, ease: 'power2.inOut',
  });

  // Dim + recede other nuclei
  for (const [k, mesh] of objects.nucleusMeshes.entries()) {
    if (k === key) continue;
    gsap.to((mesh.material as THREE.MeshBasicMaterial), { opacity: 0.08, duration: 0.8 });
    gsap.to(mesh.position, {
      x: mesh.position.x * 1.3,
      y: mesh.position.y * 1.3,
      z: mesh.position.z * 1.3,
      duration: 1.0, ease: 'power2.out',
    });
    if (mesh.userData.halo) {
      gsap.to((mesh.userData.halo.material as THREE.MeshBasicMaterial), { opacity: 0.02, duration: 0.8 });
    }
  }

  // Boost focused nucleus
  gsap.to((nucleus.material as THREE.MeshBasicMaterial), { opacity: 1.0, duration: 0.6 });

  // Dim stars from other nuclei
  for (const star of objects.starMeshes) {
    if (star.userData.starOrbit?.nucleusKey !== key) {
      gsap.to((star.material as THREE.MeshBasicMaterial), { opacity: 0.05, duration: 0.8 });
    } else {
      gsap.to((star.material as THREE.MeshBasicMaterial), { opacity: 1.0, duration: 0.8 });
    }
  }
}

export function unfocusSphere(objects: SceneObjects, camera: THREE.Camera): void {
  objects.mode = 'global';
  objects.focusedKey = null;
  clearFilter(objects);

  // Restore camera to global position
  gsap.to(camera.position, { x: 0, y: 0, z: 900, duration: 1.2, ease: 'power2.inOut' });

  // Restore all nuclei
  for (const mesh of objects.nucleusMeshes.values()) {
    gsap.to((mesh.material as THREE.MeshBasicMaterial), { opacity: 0.9, duration: 0.8 });
    if (mesh.userData.halo) {
      gsap.to((mesh.userData.halo.material as THREE.MeshBasicMaterial), { opacity: 0.06, duration: 0.8 });
    }
    // Note: nucleus positions will be restored by tickOrbits naturally
  }

  // Restore star opacities
  for (const star of objects.starMeshes) {
    gsap.to((star.material as THREE.MeshBasicMaterial), { opacity: 0.85, duration: 0.8 });
  }
}
```

- [ ] **Step 2: Wire into click handler in main.ts**

Replace the `// TODO Task 12` comment with:

```ts
import { focusSphere, unfocusSphere } from './scene/scene-state';
// In nucleus click handler:
focusSphere(sceneObjects, key, camera);
// filterPanel re-render after state change:
mountFilterPanel(filterPanelEl, sceneObjects, ...);
```

Add Esc key handler:
```ts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sceneObjects.mode === 'focused') {
    unfocusSphere(sceneObjects, camera);
    mountFilterPanel(filterPanelEl, sceneObjects, (newMode) => { sceneObjects.groupMode = newMode; });
  }
});
```

- [ ] **Step 3: Build and verify sphere expand in browser**

```bash
npm run dev
```

Click a nucleus → it should expand to fill (camera moves toward it, others dim and recede). Esc → returns to global view.

- [ ] **Step 4: Commit**

```bash
git add src/scene/scene-state.ts src/main.ts
git commit -m "feat: sphere expands to fill — focus/unfocus GSAP transitions"
```

---

## Task 13: Accessibility + prefers-reduced-motion

**Files:**
- Modify: `index.html`
- Modify: `src/style.css`
- Modify: `src/main.ts`

- [ ] **Step 1: Verify viewport meta has no maximum-scale**

Open `index.html`. Confirm the viewport meta is:
```html
<meta name="viewport" content="width=device-width,initial-scale=1">
```
No `maximum-scale=1`. If present, remove it.

- [ ] **Step 2: Add prefers-reduced-motion CSS gate**

Add at end of `src/style.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

- [ ] **Step 3: Add GSAP global timeline gate in main.ts**

Add near the top of `src/main.ts`, after imports:

```ts
import { gsap } from 'gsap';
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(0);
}
```

- [ ] **Step 4: Verify — grep for maximum-scale**

```bash
grep -r "maximum-scale" index.html
```
Expected: no output.

- [ ] **Step 5: Verify — count cubic-bezier in CSS**

```bash
grep -c "cubic-bezier" src/style.css
```
Expected: `1`

- [ ] **Step 6: Verify — no purple tokens**

```bash
grep -r "787DFF\|8B3FCC\|purple\|ppink" src/style.css
```
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add index.html src/style.css src/main.ts
git commit -m "feat: accessibility — no maximum-scale, prefers-reduced-motion (3 gates), no purple"
```

---

## Task 14: Grouping mode switch animation

**Files:**
- Create: `src/scene/regroup.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create src/scene/regroup.ts**

```ts
import * as THREE from 'three';
import { gsap } from 'gsap';
import type { CaseStudy, GroupMode } from '../data/types';
import { groupBy } from '../data/grouping';
import { computeNucleusOrbits, nucleusPositionAt } from './orbitals/nucleus-orbit';
import { computeStarOrbit, starPositionAt } from './orbitals/star-orbit';
import type { SceneObjects } from './scene-state';
import { clearFilter } from './scene-state';

// Re-group stars from old mode to new mode with GSAP animation
export function regroupScene(
  objects: SceneObjects,
  newMode: GroupMode,
  scene: THREE.Scene,
): void {
  clearFilter(objects);
  objects.groupMode = newMode;

  const cases = objects.starMeshes.map(s => s.userData.caseStudy as CaseStudy);
  const newGroups = groupBy(cases, newMode);
  const newNucleusOrbits = computeNucleusOrbits(newGroups);

  objects.nucleusOrbits = newNucleusOrbits;

  // Update nucleus mesh labels and move nuclei to new positions
  for (const [key, nucOrbit] of Object.entries(newNucleusOrbits)) {
    const mesh = objects.nucleusMeshes.get(key);
    if (mesh) {
      const newPos = nucleusPositionAt(nucOrbit, 0);
      gsap.to(mesh.position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.inOut' });
      if (mesh.userData.halo) gsap.to(mesh.userData.halo.position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.inOut' });
    }
  }

  // Reassign stars to new nucleus groups and animate them
  for (const star of objects.starMeshes) {
    const c = star.userData.caseStudy as CaseStudy;
    let newKey: string;
    if (newMode === 'vertical') {
      const { SERVICE_TO_VERTICAL } = await import('../data/grouping');
      newKey = SERVICE_TO_VERTICAL[c.services[0]] ?? 'Other';
    } else if (newMode === 'country') {
      newKey = c.countries[0] ?? 'Other';
    } else {
      newKey = c.region ?? 'Other';
    }

    const nucOrbit = newNucleusOrbits[newKey];
    if (!nucOrbit) continue;
    const newCenter = nucleusPositionAt(nucOrbit, 0);
    const n = nucOrbit.cases.length;
    const rMin = Math.max(30, 15 + Math.sqrt(n) * 8);
    const rMax = Math.max(rMin + 20, rMin + Math.sqrt(n) * 12);
    const newOrbit = computeStarOrbit(c, newKey, newCenter, rMin, rMax);
    const newPos = starPositionAt(newOrbit, 0);

    star.userData.starOrbit = newOrbit;
    gsap.to(star.position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.inOut' });
  }
}
```

Note: the dynamic `import()` in the loop is inelegant. Refactor: move the newKey derivation to a helper in `grouping.ts`:

Add to `src/data/grouping.ts`:
```ts
export function getKeyForCase(c: CaseStudy, mode: GroupMode): string {
  if (mode === 'vertical') return SERVICE_TO_VERTICAL[c.services[0]] ?? 'Other';
  if (mode === 'country') return c.countries[0] ?? 'Other';
  return c.region ?? 'Other';
}
```

Then use `getKeyForCase(c, newMode)` in `regroup.ts` instead of the inline if-chain (and remove the dynamic import).

- [ ] **Step 2: Wire into main.ts**

Replace the groupMode change stub in the filter panel mount:

```ts
import { regroupScene } from './scene/regroup';
mountFilterPanel(filterPanelEl, sceneObjects, (newMode) => {
  regroupScene(sceneObjects, newMode, scene);
  // Re-mount panel to reflect new groupMode
  mountFilterPanel(filterPanelEl, sceneObjects, ...);
});
```

- [ ] **Step 3: Add getKeyForCase test**

Add to `src/data/grouping.test.ts`:

```ts
import { getKeyForCase } from './grouping';
it('getKeyForCase returns correct key per mode', () => {
  const c = cases[0]; // services: ['Video Ads'], countries: ['Spain'], region: 'Europe'
  expect(getKeyForCase(c, 'vertical')).toBe('Media');
  expect(getKeyForCase(c, 'country')).toBe('Spain');
  expect(getKeyForCase(c, 'region')).toBe('Europe');
});
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 5: Build**

```bash
npm run build
```
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/scene/regroup.ts src/data/grouping.ts src/data/grouping.test.ts src/main.ts
git commit -m "feat: grouping mode switch with GSAP regroup animation"
```

---

## Task 15: Final verification against done criteria

- [ ] **Globe intro → orbital transition works**

Visual check in browser: globe renders on load, camera dive transitions to orbital view.

- [ ] **All sphere-nuclei orbit staging center on distinct tilted paths**

Visual check: nuclei move independently on different axes. No two nuclei share the same orbital inclination.

- [ ] **Stars orbit nucleus with unique planes**

Visual check: stars around each nucleus cross each other's paths (multiple orbital planes visible simultaneously).

- [ ] **Grouping mode switch animates smoothly**

Click Vertical → Country → Region in filter panel. Stars should smoothly migrate to new nucleus positions.

- [ ] **Filter chip → stars migrate to staging center**

Click a sphere chip in global view. Stars should fly to center in phyllotaxis formation.

- [ ] **Clear filter → stars fly home**

Click "clear → fly home". Stars should return to orbital positions.

- [ ] **Sphere Expands to Fill**

Click a nucleus. Others should dim and recede. Esc returns to global.

- [ ] **Focused view filter panel**

After focusing a sphere, panel should show country/service/year chips scoped to that sphere's cases only.

- [ ] **Hover tooltip**

Hover a star. Tooltip shows client name + case title. Suppressed during staging animation.

- [ ] **Click star → detail panel**

Click a star. Right panel opens with case metadata in instrument readout format.

- [ ] **prefers-reduced-motion — 3 gates**

```bash
grep -c "prefers-reduced-motion" src/style.css
# Expected: 1
grep "timeScale(0)" src/main.ts
# Expected: match
grep "matchesReducedMotion" src/scene/scene-state.ts
# Expected: match
```

- [ ] **No maximum-scale**

```bash
grep "maximum-scale" index.html
# Expected: no output
```

- [ ] **No purple tokens**

```bash
grep -rn "787DFF\|8B3FCC\|purple\|ppink" src/
# Expected: no output
```

- [ ] **Single --ease**

```bash
grep -c "cubic-bezier" src/style.css
# Expected: 1
```

- [ ] **Build passes**

```bash
npm run build
```
Expected: zero errors, zero warnings.

- [ ] **All tests pass**

```bash
npm test
```
Expected: all tests passing.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: v3 gravitational spheres — complete implementation"
```
