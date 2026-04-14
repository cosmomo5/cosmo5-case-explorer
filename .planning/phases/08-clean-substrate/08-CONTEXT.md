# Phase 8: Clean Substrate — Context

**Gathered:** 2026-04-14
**Status:** Ready for planning
**Source:** MILESTONE-v3.2.md (Phase 0 "Clean Substrate" section, renumbered to 8 on roadmap)

## Phase Boundary

This phase prepares the phase-1c codebase for v3.2 implementation. It removes orphaned v1/v2 DOM and CSS, isolates the phyllotaxis code for later re-use in Phase 12 (Comparison Mode), extends the CaseStudy schema for imagery integration (Phase 11), and documents the branch strategy and gather-adaptation decision.

No new UI is added in this phase. No user-facing behavior changes. This is substrate preparation.

## Implementation Decisions (Locked from Milestone + Q1-Q5 Resolutions)

### DOM to Remove (Orphaned from v1/v2)

- `#panel`, `#panelScrim`, `#close` and all children with IDs matching `#p-*` (old DetailPanel modal — ReadingPanel replaced this in v3.1 Phase 6 but HTML was left in place)
- `#ctip`, `#ctip-n`, `#ctip-c` (old tooltip — Tooltip class wired to canvas hover replaced this)
- `#countryRail` (pre-v3 right-side navigation rail, unused)
- `#globe-stage`, `#globe-canvas` (pre-v3 globe intro animation, unused)
- `#constellation-canvas` (v1 static constellation overlay, unused)
- `#searchWrap` (duplicate search widget — `#globalSearch` in header is the active one)

### DOM to PRESERVE (for Phase 12 Comparison Mode adaptation)

- `#gatherStage`, `#gatherVignette` — will drive Comparison Mode's central staging area
- `#gatherList` and all children (`#glTab`, `#glPanel`, `#glHead`, `#glCount`, `#glBadge`, `#glBody`, `#glSub`) — reference markup for the adapted comparison-side surface (final design per Phase 12 plan)
- Gather-mode CSS in style.css — preserve as a block, clearly commented as "reserved for Comparison Mode adaptation — do not remove"

### CSS to Remove

- Rules targeting removed DOM IDs above
- Old `.panel`, `.panel .close`, `.panel-inner`, `.p-*` rules for old DetailPanel modal
- Old `.ctip*` tooltip rules
- `.country-rail`, `.cr-*` rules
- `.globe-stage`, `.globe-canvas` positioning rules
- `.constellation-canvas` positioning rules

### CSS to Keep

- `.cl` cluster label rules (still in use by StarLabels)
- Gather-mode rules (for Phase 12)
- All token system (`:root` variables)
- All v3.1 layout rules (split canvas, track zone, reading panel slot)

### Main.ts References to Remove

- Imports for components no longer used (audit: `DetailPanel` import — check if referenced; if not, remove)
- Element getter lines for removed DOM (`document.getElementById('panel')`, etc.)
- Any dead code paths that check for removed elements

### Phyllotaxis Code Isolation

- Current phyllotaxis logic lives on `draft/v3-starmap` branch, NOT in phase-1c. On phase-1c, the gather mechanic was not implemented — the orphaned HTML/CSS exists but no TypeScript drives it.
- **This changes the plan for CLN-04.** The phyllotaxis geometry code must be *imported fresh from v3-starmap as specification* per the hybrid branch strategy (Q2). Create `src/scene/phyllotaxis.ts` by referencing v3-starmap's `gather.ts` implementation.
- Module exports: `computePhyllotaxisPositions(count: number, options): Vec3[]` — given a count of cases, return positions on a camera-facing disk with golden-angle + sqrt-radius spacing.
- Document clearly at the top of the file: `// Preserved for Comparison Mode (Phase 12). See MILESTONE-v3.2.md Q5 resolution.`
- Include minimal tests: positions are deterministic for same N, center-of-mass is origin, minimum-distance between adjacent points above threshold.

### Schema Extension

- Extend `src/data/types.ts:CaseStudy` with optional `imagery?: { logo?: string; key_visual?: string }` field.
- No changes to existing cases — the field is optional and absent data means "no imagery available."
- Create `public/case-imagery/` as an empty tracked directory (add a `.gitkeep` file).
- Update `cases.json` type annotations / tests if they exist to allow the new field.

### Branch Strategy Documentation

Record in STATE.md a section documenting the hybrid branch strategy per Q2 resolution:

```
## Branch Strategy (locked 2026-04-14, Q2 resolution)

phase-1c is canonical. draft/v3-starmap is specification-only.

Each v3.2 plan that imports a v3-starmap move names:
- What v3-starmap did (with commit SHA reference)
- What phase-1c will do (adapted implementation)
- Whether this improves or contorts phase-1c

Guardrail: if phase-1c contorts to match v3-starmap's shape, stop and design fresh.

Import decisions by move:
- Query input + keyword mapping → import as spec (Phase 10)
- CRT radial grid substrate → import as spec (Phase 9)
- Instrument-calibrating loader → import as spec (Phase 9)
- Phyllotaxis geometry → import as spec (Phase 8, for Phase 12 use)
- Affinity clustering → skip (concentric supersedes)
- Phyllotaxis gather as filter-trigger → skip (adapted for Comparison Mode in Phase 12)
```

### Gather Retirement (Partial — Adapted)

Per Q5: the gather mechanic is NOT retired. It is adapted to Comparison Mode in Phase 12. Phase 8's job is:
- Remove the *current wiring* (the orphaned gather button if present in main.ts, the auto-trigger logic if present — audit first).
- Preserve the *mechanic* (phyllotaxis geometry code from v3-starmap, imported into `src/scene/phyllotaxis.ts`).
- Document the adaptation rationale in STATE.md and in the phyllotaxis module's header comment.

## Claude's Discretion

- **Module naming**: `src/scene/phyllotaxis.ts` is recommended but if the codebase has a different convention (e.g., `src/scene/formations/phyllotaxis.ts`), follow existing conventions.
- **Test framework**: match what v3.1 uses (Vitest per existing test files).
- **Commit granularity**: sensible small commits per concern (DOM removal is one commit, CSS removal another, phyllotaxis module a third, schema extension a fourth, STATE.md documentation a fifth). Exact boundaries at planner's discretion.
- **Audit depth**: before removing any DOM reference from main.ts, grep for the ID/class to confirm no runtime reference exists. Don't break the build.

## Specific Ideas (from Milestone Q-resolutions)

- Phyllotaxis module should live at module scope (not inside a class) to be easily imported by Phase 12.
- The `.gitkeep` in `public/case-imagery/` ensures the directory is tracked even when empty.
- `permission: false` handling (for Phase 11 imagery suppression) does NOT need to be implemented in Phase 8 — it's a Phase 11 concern. But the schema extension must support it.

## Deferred Ideas

- Imagery sourcing itself (content-side work, runs in parallel, not Phase 8's task)
- Actual use of phyllotaxis (Phase 12)
- Actual use of `imagery` field in UI (Phase 11)

---

*Phase: 08-clean-substrate*
*Context gathered: 2026-04-14 from MILESTONE-v3.2.md + Q1-Q5 resolutions*
