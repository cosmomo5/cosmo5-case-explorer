# Coding Conventions

**Analysis Date:** 2026-04-13

## Naming Patterns

**Files:**
- Kebab-case for module names: `nucleus-orbit.ts`, `star-orbit.ts`, `detail-panel.ts`, `filter-panel.ts`
- Test files colocated: `nucleus-orbit.ts` paired with `nucleus-orbit.test.ts`
- Type definitions: `types.ts` for shared domain types

**Functions:**
- camelCase for all functions: `buildOrbitalScene()`, `computeNucleusOrbits()`, `nucleusPositionAt()`, `matchesFilter()`
- Imperative verbs for state mutations: `applyFilter()`, `clearFilter()`, `focusSphere()`, `unfocusSphere()`, `tickOrbits()`
- Getter-style for pure functions: `getKeyForCase()`, `getFilterableAttrs()`, `projectToScreen()`
- Constructor functions for object creation: `createFilterState()`, `createRenderer()`, `createStarfield()`

**Variables:**
- camelCase for all variables and parameters
- Scratch/temporary variables prefixed with underscore: `_tickScratch` (module-scope Vector3 reused in hot loop)
- Abbreviations used for verbose types: `el` for HTMLElement, `mat` for material, `f` for filter, `c` for case, `s` for star, `o` for orbit
- Positional abbreviations: `pos` for position, `r` for radius, `u`/`v` for basis vectors

**Types:**
- PascalCase for interfaces and classes: `FilterState`, `SceneObjects`, `CaseStudy`, `NucleusOrbitData`, `StarOrbit`
- Compound type names reflect domain: `NucleusOrbit`, `StarOrbit`, `FilterState`, `GroupMode`
- Type discriminators are explicit: `isNucleus: true`, `isStagingTarget: false`, `isFiltered: false` in userData

**Constants:**
- UPPER_SNAKE_CASE for module constants: `GOLDEN_ANGLE`, `INNER_RMIN`, `OUTER_RMIN`, `NUCLEUS_COLORS`, `SERVICE_TO_VERTICAL`
- Maps named with their purpose: `NUCLEUS_COLORS`, `NUCLEUS_COLORS_HEX`, `SERVICE_TO_VERTICAL`
- Numeric ranges: `INNER_RMIN = 200`, `INNER_RMAX = 260` define two-band orbital spacing

## Code Style

**Formatting:**
- No explicit linter config detected (`.eslintrc*`, `.prettierrc*` absent)
- Consistent 2-space indentation throughout
- Semicolons required (strict TypeScript)
- Single quotes preferred in most cases (some double quotes in HTML template literals)
- Line length: files range 40–350 lines, no artificial breaks observed

**Linting:**
- TypeScript strict mode enabled: `"strict": true` in `tsconfig.json`
- `noUnusedLocals`, `noUnusedParameters` enforced — dead code is caught at compile time
- No wildcard imports; imports are explicit and grouped

**Type Discipline:**
- Full type annotations on function signatures: parameters always typed, return types explicit
- Type assertion used where necessary: `as HTMLElement`, `as THREE.Mesh`, `as CaseStudy`
- Non-null assertions used strategically: `nucleusMeshes.get(key)!` in hot paths (verified safe before assertion)
- Generic types used for Map/Set: `Map<string, THREE.Mesh>`, `Set<string>`

## Import Organization

**Order:**
1. Built-in and external libraries: `import * as THREE from 'three'`, `import { gsap } from 'gsap'`
2. Local types: `import type { ... } from './types'`
3. Local implementations: `import { buildOrbitalScene } from './scene/scene-state'`
4. Side-effect imports: `import './style.css'` (at module top)

**Path aliases:**
- No path aliases detected; relative imports used throughout: `'./types'`, `'../data/grouping'`, `'../../data/types'`
- Consistent relative depth (no `../../..` chains): deep nesting not used

**Barrel files:**
- Not used; each module exports explicitly

## Error Handling

**Exceptions:**
- Try-catch at system boundary only: boot function in `main.ts` wraps async fetch and scene initialization
- Explicit status checks on HTTP responses: `if (!resp.ok) throw new Error(...)`
- No defensive coding for internal state; invariants assumed to hold
- Non-null assertions used after checks: `nucleusMeshes.get(key)!` after proving it exists

**Fallbacks:**
- Nullish coalescing for defaults: `c.region ?? 'Other'`, `color ?? DEFAULT_COLOR`, `c.contributor_source ?? 'Cosmo5 Contributor'`
- Optional chaining used sparingly: `obj.focusedKey ?? ''` (read-only)
- Data validation at load time only: cases.json fetch validates JSON shape via TypeScript types

**Determinism:**
- Hash function guarantees deterministic output: same input always produces same position/phase
- Orbital parameters persisted in userData for replay: `star.userData.starOrbit` recomputed each frame from phase + speed
- No random state; PRNG (hash) seeded by object IDs and keys

## Logging

**Framework:** `console` only (no dedicated logger)

**Patterns:**
- Development markers: `console.log('[v3] main.ts module executing')`, `console.log('[v3] about to call boot()')`
- Error logging: `console.error('[v3 boot error]', err)` with context tag
- Error messages include HTTP status: `cases.json ${resp.status}`
- Log messages prefixed with phase tag `[v3]` (versioning / phase tracking)

**What to log:**
- Module initialization (first log in each file)
- Async operations (fetch start, resolution, rejection)
- Error context (not just the error, but what was being attempted)

**What NOT to log:**
- Inner loop operations (no logging in `tickOrbits` or per-frame updates)
- DOM operations or state changes (they're implicit in class methods)

## Comments

**When to comment:**
- Semantic intent that isn't obvious from code: `// Suppress click if the user dragged (OrbitControls moves camera)`
- Coordinate system or mathematical reasoning: `// Gently tilted orbital plane — constrained z so nuclei stay in a rough disk but constellations read as volumetric, not flat.`
- Non-obvious numeric constants: `// range [-0.35, 0.35]`, `// two-band spacing: inner and outer rings prevent orbital path crossings`
- Algorithm references: `// Golden-angle spiral: uniform point distribution on sphere surface`, `// Rodrigues rotation formula`
- Lifecycle notes: `// Cache all static IDs — they live in the HTML and never move`, `// GSAP controls staging stars`

**Inline comments:**
- Placed at end of line or above for clarity: not after complex expressions
- Explain "why", not "what": not `// set position to x, y, z` but `// Update star orbit centers to follow nucleus`

**JSDoc/TSDoc:**
- Minimal; documentation comments used for exported functions and classes with non-obvious purpose
- Example: `computeStarOrbit` has multi-line comment explaining golden-angle spiral distribution
- No @param/@returns decorators; type annotations suffice in strict mode

## Function Design

**Size:**
- Functions range 5–30 lines (typical)
- Longer functions (50+ lines) break into logical sections marked with `// ── Comment ──` delimiters
- Example: `boot()` in `main.ts` is ~260 lines, broken into 8 marked sections for readability

**Parameters:**
- Explicit over implicit: functions receive all dependencies as parameters
- No global mutable state accessed (except `window` for media queries)
- Optional parameters with defaults: `indexInGroup: number = 0`, `groupSize: number = 1`, `orbitCtl = controls`
- Sets as parameters passed by reference (mutable): `filterState: FilterState` is modified in place

**Return values:**
- Pure functions return new objects: `computeNucleusOrbits()` returns `Record<string, NucleusOrbitData>`
- Mutations return void: `applyFilter()`, `focusSphere()`, `unfocusSphere()` return nothing
- No null returns; always return a value or throw: `computeStagingPositions(0, r)` returns `[]`
- Destructuring assignments for object returns: `const { scene, camera, renderer, controls } = createRenderer(mainCanvas)`

## Module Design

**Exports:**
- Named exports for functions: `export function computeNucleusOrbits(...) { }`
- Type exports with `type` keyword: `export type GroupMode = 'vertical' | 'country' | 'region'`
- Classes exported as named exports: `export class DetailPanel { }`
- Single-responsibility exports: each module exports one main concept plus helpers

**Data structures:**
- Domain objects stored as POJOs (plain objects) with typed interfaces: `Vec3`, `StarOrbit`, `NucleusOrbitData`
- Classes used for stateful UI (DetailPanel, Tooltip) and animation coordination
- Scene objects stored in collections: `Map<string, THREE.Mesh>` for nuclei, `Mesh[]` for stars

**Composition:**
- Builder pattern for scene construction: `buildOrbitalScene()` returns `SceneObjects` with all components
- Event handler mounting: `mountFilterPanel()` takes scene objects and callbacks, returns void
- Higher-order function for render: `render()` defined inside `mountFilterPanel()`, called on state change

## Hot-Path Optimization

**Module-scope scratch allocation:**
- `_tickScratch = new THREE.Vector3()` in `scene-state.ts`
- Reused in every frame's `tickOrbits()` call: `_tickScratch.set(pos.x, pos.y, pos.z)` then `.lerp()`
- Prevents ~1000 Vector3 allocations/frame; enables 60fps on mobile

**Mutation patterns:**
- Orbit data mutated in place: `(star.userData.starOrbit as StarOrbit).orbitCenter = pos`
- No spread operators or destructuring in hot loops
- Lerp used instead of direct assignment for smooth position updates

## TypeScript Idioms

**Type guards:**
- Explicit type casts in tight loops: `(star.userData.caseStudy as CaseStudy)`
- Validated once at load time; no repeated checks
- Non-null assertions used where invariants guarantee existence

**Generics:**
- Used for collections only: `Map<string, THREE.Mesh>`, `Set<string>`
- No generic utility types; prefer concrete interfaces

**Discriminated unions:**
- Not used; instead, use explicit boolean flags: `isStagingTarget: boolean`, `isNucleus: boolean`
- Mode tracked explicitly: `mode: SceneMode` with type `'global' | 'focused'`

---

*Convention analysis: 2026-04-13*
