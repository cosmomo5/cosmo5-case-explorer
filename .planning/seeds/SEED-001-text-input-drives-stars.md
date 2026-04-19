---
id: SEED-001
status: dormant
planted: 2026-04-19
planted_during: v3.3 Phase 19 (brainstorm spike, canceled at intake)
trigger_when: "When the filter panel feels static"
scope: medium
---

# SEED-001: Text-input-drives-stars

## One-line

A typed query is not a filter — it is a force the constellation feels. Typing pulls, dims, or reforms the 116 stars in real time, so the scene responds to intent instead of just narrowing a list.

## Why This Matters

The case explorer is an observatory, not a database browser. A filter panel narrows the set; it does not make the scene *respond*. The v3.3 premise names this: "the moves are all present; none of them are resolved." Facet filters shipped (Phase 18), but the scene still feels static during exploration — a user who types "sustainability" sees a count change, not a field that moves.

Mo's original framing (MILESTONE-v3.3.md, 2026-04-17): *"I wonder whether we can..."* — exploratory, not committed. The idea was slotted as Phase 19 with a hard spike gate: 2–3 mockups → Mo selects → build, OR defer without disturbing the rest. At the intake question ("which channel leads — motion / brightness / reformation?"), Mo chose to shelve the whole feature and keep filtering panel-only. Reason implicit: scope risk against the v3.3 goal of *resolving* what exists before adding new response behavior.

The seed is not dead — it is held for a milestone where the filter-only experience has been lived with long enough that the absence of scene response is felt, not theorized.

## The Spike Question (for future milestone)

Three axes define the mockup space. Any future revival should answer these before building:

**Primary signal channel** — the other two can play supporting roles, but one has to lead:
- **Motion** — stars drift toward matches (matching stars pulled inward, non-matches repelled outward). Strongest "force" metaphor. Observatory analog: a magnetic needle swinging to true north. Risk: chaotic if too many stars move simultaneously.
- **Brightness** — matches ignite, rest dim. Quieter; most observational. Closest to a spectrum analyzer — what lights up is what's present. Matches Cosmo5's teal = observed token directly. Risk: less magical, more incremental than the other two.
- **Reformation** — matches dissolve their orbital structure and re-cluster into a new shape (line, ring, density plot). Most dramatic. Risk: hardest to land without feeling like a "whoosh" effect; easy to cross into slop.

**Trigger timing:**
- During typing (live reactive, every keystroke, needs damping) — tuning-a-radio feel.
- On ENTER only (stillness, then one choreographed transition) — set-the-instrument-then-read feel.
- Hybrid (faint live hint + full ENTER choreography) — two animation systems.

**Non-match behavior:**
- Darken / recede.
- Disappear entirely (reform into a lean constellation).
- Hold position with low opacity (ghost field).

## Trigger Conditions for Surfacing

**Trigger:** "When the filter panel feels static."

Specifically: surface during `/gsd-new-milestone` for any milestone that names, in scope or premise, any of the following:

- *"Scene responsiveness"*, *"scene reacts to input"*, *"query feels live"*
- *"Filter panel re-evaluation"*, *"unified filter rethink"*, *"filtering is not enough"*
- Any milestone targeting interactivity richness or motion depth in the orbital scene
- Any explicit user-research finding that filter-only exploration feels flat

**Do NOT surface for:**
- Pure polish milestones (design register, typography, token work)
- Backend / data model work
- Phases that touch filter-panel.ts for other reasons (CSS, UX, a11y) unless responsiveness is the named goal

## Scope Estimate

**Medium — a phase or two.**

If revived, the natural shape is a spike phase (2–3 mockups) followed by a single feature phase:

- **Spike phase:** 2–3 HTML mockups exploring the three axes above. Mo selects. Produces `DIRECTION-SELECTED.md`. Total: 1 session.
- **Feature phase:** Wire the selected channel, implement damping curve for live trigger if chosen, verify perf (no frame drops on fast typing with 116 stars), `prefers-reduced-motion` variant, unit tests for input→scene mutation path. Total: 2–3 sessions.

Out of scope for a medium build:
- Reforming the filter-panel column. If the query becomes the primary nav mechanism, that is a **large** milestone, not this seed.
- Expanding beyond 116 cases. Motion response at 1000+ stars is a different engineering problem.

## Current State (as of 2026-04-19)

**Phase 18 shipped a text input inside the unified filter column.** It does live filtering (116 → N) via `FilterState.searchText` + `applyFilterWave`, with query history and hint states. It does NOT cause any scene response beyond dim/hide of non-matches (the standard filter pathway).

After the intake pivot, Mo has decided to **remove the text input entirely** from the unified column and keep filtering panel-only. That removal is a separate immediate task (see ROADMAP / STATE updates from the same session). This seed covers the *future* reintroduction of typing as a scene force — not a filter mechanism.

## Breadcrumbs

Relevant code and decisions in the current codebase (2026-04-19 state, pre-removal):

### Code

- `src/ui/filter-panel.ts` — query input, ENTER/Escape handlers, history chips, hint states (lines ~126-355). This is the file that will lose the input in the immediate followup and that would gain the scene-force wiring in a future revival.
- `src/data/filter.ts` — `FilterState.searchText` field (line 14), `matchesFilter` search branch (lines 63-64).
- `src/data/keyword-map.ts` — `searchText` → filter-state wiring (lines 108, 121).
- `src/data/persistence.ts` — `addQueryToHistory` / `loadQueryHistory` (line 140).
- `src/scene/scene-state.ts` — `applyFilterWave`, star opacity/color mutation path. A scene-force implementation would either replace this pathway for matches or extend it with motion terms.
- `src/animation/transition-choreographer.ts` — single-ease transition system. A live/damped typing response would need to coordinate with this rather than run in parallel.
- `src/tests/filter-searchtext.test.ts` — the existing test suite for search filtering. Revival would supersede this with scene-force tests.

### Decisions & Docs

- `.planning/MILESTONE-v3.3.md` — original Phase 19 framing and spike gate rules.
- `.planning/DECISIONS.md` — check for v3.3 opening decisions on the spike slot contract.
- `DESIGN-STATE.md` (project root) — canon register (observatory instruments, teal = observed, gold = navigation, single ease, no purple). Any future motion pattern must honor this.
- `design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md` — authoritative register doc.

### Related Completed Work

- **Phase 17** (star labels always-on) — the label-click navigation primitive that exists now gives an adjacent pathway: typing could brighten/move specifically the labels of matches, not the stars. A refinement axis for the spike.
- **Phase 16** (planetary overture) — established that dramatic transitions are part of the register; the scene is willing to reconfigure. Reformation (axis 3 above) has precedent.
- **Phase 18** (unified left column) — established the column structure that a future revival would need to negotiate with (either remove the input, replace it, or split the column further).

## Notes

- The intake question that triggered the shelving was "which channel leads?" Mo answered with a scope decision, not a channel pick — indicating the issue is not *which response* but *whether now*. A future surfacing should present the full question (channels + trigger + non-match) as a whole, not three sequential gates.
- The v3.3-opening decision preserved Phase 16 and Phase 19 as *uncommitted spikes* precisely so either could be dropped without hurting the milestone. Phase 16 committed (planetary overture shipped); Phase 19 is the first use of the "reject all options, phase deferred" escape hatch. That precedent is valuable — future milestones should consider seed-backed spike slots as a pattern.
- If this seed is ever picked up, the existing filter-panel text input should NOT be reintroduced under the same surface. A scene-force query deserves its own placement — probably a more prominent, command-palette-style element, not a sidebar input that looks like a filter.
