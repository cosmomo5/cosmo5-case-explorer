# Phase 18: Unified Left Column - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 18-unified-left-column
**Areas discussed:** Visibility per view-state, Internal column composition, Mode-row resolution, Cleanup scope, + follow-ups on auto-expand / focus-back / keyboard / tests

---

## Visibility per view-state

### Left column during planetary overture

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden | Preserves overture's 'single invitation' register; matches today's body.planetary #queryWrap hidden behavior | ✓ |
| Visible but inert | Column renders, no interaction until overtureComplete; risks stealing attention during opening gesture | |

**User's choice:** Hidden — D-01.

### Left column in global view

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | Inquiry surface available from field-open; matches current query-bar | |
| Collapsed-by-default (tab) | Column collapses to vertical tab; user expands when they want to query/filter | ✓ |

**User's choice:** Collapsed-by-default — D-02. Structural register move: inquiry surface is available on reach, not announced. Kunumi structural.

### Left column in focused constellation view

| Option | Description | Selected |
|--------|-------------|----------|
| Visible, same geometry as global | Continuous left column across global↔constellation; no collapse tab | ✓ |
| Keep filter-panel's current collapse tab | Preserves today's vertical collapse; allows reclaiming scene width when focused | |

**User's choice:** Visible, same geometry — D-03.

### Left column when reading panel is open

| Option | Description | Selected |
|--------|-------------|----------|
| Stays visible | Reading panel lives in right region; left column stays so strategist can keep querying while reading | ✓ |
| Hides while reading | Focuses attention on the case | |

**User's choice:** Stays visible — D-04.

---

## Internal column composition

### Input placement

| Option | Description | Selected |
|--------|-------------|----------|
| Top of column, above facets | Input first; keyword is primary, facets refine; Kunumi 'question first' | ✓ |
| Below 'Filter' header, above facet accordions | Input as search affordance under a title; less Kunumi | |
| Replace panel header entirely with input | Maximally spare; risks stripping column's self-identification | |

**User's choice:** Top of column — D-06.

### Live readout

| Option | Description | Selected |
|--------|-------------|----------|
| Under input, DM Mono 11px teal | Pairs readout with input as cause/effect; current query-bar placement | |
| Bottom status bar consolidation | Unify with filter-panel's existing .filter-status | |
| Drop CLUSTERS half, keep just N CASES | Simplifies; strategists care about cases not cluster tallies | ✓ |

**User's choice:** Drop CLUSTERS, keep N CASES — D-07. Register move: one count, not two. Placement (under-input vs consolidated footer) left to planner discretion.

### Query history chips

| Option | Description | Selected |
|--------|-------------|----------|
| Keep under input | Returning users see recent searches; low visual cost, high utility | ✓ |
| Drop — dashboard noise | Column stays cleaner; loses repeat-search utility | |
| Hide-by-default, show on input focus | Preserves utility, strips at-rest noise; adds interaction | |

**User's choice:** Keep under input — D-08.

### Query hint

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both states (empty + no-match) | Empty orients; no-match recovers from dead-ends with broader-term suggestions | ✓ |
| Keep no-match only; drop empty-state | No-match is recovery utility; empty-state is onboarding scaffolding | |
| Drop both | Fully silent; count readout does the work | |

**User's choice:** Keep both states — D-09.

### Welcome-back message

| Option | Description | Selected |
|--------|-------------|----------|
| Same spot (replaces N CASES on boot 5s) | Preserves current behavior; no new DOM | |
| Separate ephemeral line above input | Clearer separation of concerns; slightly more chrome | |
| Drop — Reading List tab already shows count | The nudge is redundant | ✓ |

**User's choice:** Drop — D-10.

### Advanced drawer

| Option | Description | Selected |
|--------|-------------|----------|
| Remove entirely | Facets live in unified column always-available; deletes ~30 lines of wiring | ✓ |
| Keep as facet-section toggle (collapsed-default) | Text input always visible; facets hidden behind toggle | |

**User's choice:** Remove entirely — D-11.

---

## Mode-row resolution

### Grouping switcher (vertical/country/region)

| Option | Description | Selected |
|--------|-------------|----------|
| Relax constellation-only rule — bottom-right full-time | Single home for grouping: bottom-right visible post-overture in both views | ✓ |
| Global in left column, constellation in bottom-right | Two homes; honors Phase 17 D-08 literally but creates inconsistency | |
| Drop grouping from global entirely | Grouping only in constellation; risks locking users out of re-sort in global | |

**User's choice:** Relax constellation-only rule — D-12. Drop mode-row from filter-panel.ts (D-13).

---

## Cleanup scope

### Orphaned v3.1 filter DOM (index.html:82-110)

| Option | Description | Selected |
|--------|-------------|----------|
| Clean now — inside the surface being restructured | Phase 18 IS the left-column restructure; leaving dead DOM would be weird | ✓ |
| Leave for Phase 26 Kimi sweep | Keep scopes clean; Phase 18 tightly scoped to merge | |

**User's choice:** Clean now — D-14.

### Query-bar DOM (index.html:136-154)

| Option | Description | Selected |
|--------|-------------|----------|
| Remove entirely — unified column renders its own DOM | Cleanest diff; filter-panel.ts owns the rendering | ✓ |
| Remove HTML, keep CSS for Phase 26 | Smaller diff now but orphan CSS survives milestones | |
| Keep DOM shell, relocate inside unified column | Preserves continuity at DOM level; less reshaping of filter-panel.ts | |

**User's choice:** Remove entirely — D-15.

### Query-bar CSS

| Option | Description | Selected |
|--------|-------------|----------|
| Remove in Phase 18 | HTML, TS, and CSS all move together; clean diff | ✓ |
| Port input styling, leave other dead selectors for Phase 26 | Extract input-specific; defer the rest | |

**User's choice:** Remove in Phase 18 — D-16.

---

## Follow-up areas

### Auto-expand transition

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-expand on ENTER_CONSTELLATION, re-collapse on EXIT | Enter commits to refinement; exit releases chrome | ✓ |
| Auto-expand on ENTER, stay expanded on return | Respects the gesture once made; persists across session | |
| Never auto — user expands manually | Maximally restrained; column feels hidden in constellation | |

**User's choice:** Auto-expand + re-collapse — D-05.

### Focus-back button

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as-is in column head constellation mode | Consistent with current behavior; column head becomes view-aware | ✓ |
| Drop — rely on home button / Escape / click outside | Strips chrome but loses known exit path | |

**User's choice:** Keep — D-17.

### Keyboard flow

| Option | Description | Selected |
|--------|-------------|----------|
| Input → facet headers → chips | Standard top-to-bottom; meets QRY-07 bar | |
| Input → reset → facet headers → chips | Reset is first-class action; slightly deeper flow | ✓ |

**User's choice:** Include reset — D-18.

### Test organization

| Option | Description | Selected |
|--------|-------------|----------|
| Extend filter-panel.test.ts with input tests | One test file matches one module | |
| Split: filter-panel.test.ts for facets, unified-column.test.ts for input + integration | Larger test surface, two files; useful if tests grow | ✓ |

**User's choice:** Split — D-19.

---

## Claude's Discretion

(Areas where Mo said "planner decides" or the decision is semantically equivalent across options)

- Exact DOM structure inside unified column (container tag, class names, accordion markup)
- CSS class rename strategy (.filters-wrap → .column-wrap etc.)
- Whether N CASES readout lives under input or consolidated into .filter-status footer
- Debounce timing on input (80ms current)
- Module-boundary for auto-expand subscription (main.ts dispatches vs filter-panel.ts subscribes)
- Width of expanded column (232px current)

## Deferred Ideas

(Ideas that came up during discussion and were noted for other phases)

- Reading panel geometry → Phase 21
- Stars respond to typing → Phase 19
- Filter-triggered wave removal → Phase 20
- CSS class rename (if needed) → could be Phase 24 theme audit
- Graticule decision → milestone-wide open question
- Gold-overload question → carried from Phase 17, unrelated to 18
