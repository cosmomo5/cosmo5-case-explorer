# Milestone v3.3 — Resolve the Observatory

**Status:** Opening (Phase 16 pending brainstorm spike)
**Predecessor:** v3.2 shipped 2026-04-17 (Phases 13–15)
**Source plan:** This document finalizes the plan Mo approved on 2026-04-17.

---

## Premise

v3.2 shipped the feature set (query, reading list, review, comparison, edge states). It is buggy, out of place, and not well designed in actual use. The moves are all present; none of them are resolved. Before the 60–90s internal flow can land, the UI needs a coherent pass that fixes position, hierarchy, consistency, and the scene's own legibility.

This is a **UI/UX polish milestone, not a feature milestone.** The existing direction (Kunumi structural + BYLD register + Cosmo5 astronomical foundation, `design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`) is the authority. Each change below traces back to it.

## Refactor Posture

**Refactor after v3.3, not before.** Reasons:

1. Several planned changes are **deletions** (gathered button, depth-per-year, label slider, possibly graticule). Refactoring code we are removing is wasted work.
2. The **query-bar / filter-panel merge** (Phase 18) is itself a structural consolidation — it does refactor work in the course of doing UX work. This is the right kind of refactor: driven by a user-visible reshape, not by code-quality abstraction.
3. After v3.3, the **surface area is smaller** and the **seams are clearer** (view-state has one more mode but the UI has fewer panels). That is the honest moment to step back and ask "what abstractions now actually earn their keep?"
4. The existing tests are largely at the data/scene-geometry layer — they will survive the UX-level changes. UI-layer tests will need rewrites alongside Phases 18, 21, 22. That is normal v3.3 work, not a refactor.

A **v3.4 "Tighten"** may handle the structural follow-up. v3.3 preserves that option; it does not commit to it.

## Scope Guardrail

This plan does not add new product capability. Every phase is polish, removal, repositioning, or resolution of existing surfaces. If a phase introduces a new behavior, it is because an existing behavior is replaced and the replacement is cleaner.

## Imagery Deferral (Explicit)

P2-D from the direction note ("archive artifacts as starmap texture" — Kunumi-style case-study thumbnails floating in the field) **stays out of v3.3 scope.** v3.2's STATE.md already flagged this as a parallel content project with content-side ownership. v3.3 preserves the imagery schema hook already in place (`imagery?: { logo, key_visual }` on case studies) but does not integrate visual treatment until content arrives. This is an explicit deferral, not an omission.

## Brainstorm Spikes (Uncommitted)

**Two phases open as brainstorm spikes, not committed designs.**

- **Phase 16 — Planetary overture.** Mo's framing: "I wonder whether..." Exploratory.
- **Phase 19 — Text-input-drives-stars behavior.** Mo's framing: "I wonder whether we can..." Exploratory.

Each opens with a visual-companion brainstorm session (2–3 mockups), Mo picks one, then execution begins inside the phase. Plan approval is approval of the slot, not of the specific design. If Mo rejects all options in either spike, that phase can be deferred or scoped out without disturbing the rest of the milestone.

---

## What Changes, Grouped by Concern

### 1. Scene legibility — the stars need logic

Current: stars float with no spatial rationale visible. There is no first-impression view; you arrive in scattered clusters with no invitation.

Changes:
- **Planetary overture (new initial state).** On first paint, a single planet-like form at center with all cases gathered around or within it — an invitation, not a catalog. A click (or scroll, or "begin") transitions into the concentric cluster layout we have now. Resolves the "arrival is abrupt" problem; gives the observatory a gesture of opening.
- **Star labels return while floating.** Every star shows a label at low opacity by default, brightened on hover. v3.1 had this; v3.2 removed it via the label slider. Reinstate — the cases need names, not just positions.
- **Click a star label → enter that cluster's constellation view.** Label click is a nav primitive, not just a hover affordance.
- **Star behavior — motion, dim/highlight, in/out.** The way stars come into and leave position, the timing of dim/highlight transitions, and the quality of the fade cascades are all reworked. Single `--ease` stays. Durations get tuned to feel like long-exposure astrophotography, not web-app state changes.

### 2. Filtering and gathering — one model, staged once

Current: two filtering mechanisms (query bar top, filter panel left) doing overlapping work. Gather is not wired to filter. Matched cases glow across all views, which does not help.

Changes:
- **Unify all filtering on the left.** Text search lives in the left column with the dimensional filters. One pane, two input modes (keyword + facet), same result set. Must stay visually restrained — no dashboard crowding.
- **Text input does something to the stars, not just the set.** When the user types, the stars respond dynamically — gentle motion, brightness shift, or subtle reformation — so the text feels like it is touching the scene, not querying a database.
- **Gather is the staging action.** Filter narrows the set silently; clicking **Gather** is what stages the filtered cases (current staging sphere or its successor). Highlighting filtered cases across all views goes away — visual noise.
- **Right-side gathered button → removed.** It opens nothing; it is not needed.

### 3. Reading panel — elegant, not full-bottom

Current: reading panel clashes with the selection panel in constellation view; it claims the whole bottom edge.

Changes:
- **Reading panel becomes a right-side drawer** at a restrained width (≈380px), not a full-bottom slab. Overlap with selection/cluster surfaces is resolved by geometry, not z-index.
- **Panel content is already BYLD-aligned** (DM Mono instrument readout) — this stays; only its container changes.
- **No two panels ever occupy the same spatial region.** Constellation selection surface, reading drawer, and filter column each have a claimed region; overlap is a layout bug. *(This is a cross-phase invariant — verified at every phase gate from 18 onward, not just the phase's own surface.)*

### 4. Contextual controls — right-bottom panel earns its content per view

Current: the bottom-right panel shows options regardless of view. "Depth per year" no longer applies and should not be visible.

Changes:
- **Panel contents become view-scoped.** In planetary/constellation-overview: only text-label opacity (or equivalent ambient control). In focused constellation: dimension switcher (country / region / year / proof type / impact). "Depth per year" removed.
- **Fewer controls per state, not more.** The panel shows what acts on the current view, nothing else.

### 5. Theme and typographic discipline

Current: inconsistencies exist (coral staging sphere outside token palette, ad-hoc opacity values, display type not yet soft-focus-treated per BYLD).

Changes:
- **All colors route through the token set** in `src/style.css`. Staging-sphere coral either becomes a named token or is replaced with an existing one (teal with opacity, most likely).
- **Ad-hoc opacity values (0.08, 0.15, 0.38, 0.65) get named** as CSS variables and used consistently (`--dim-matched`, `--dim-unmatched`, `--ghost`, `--glow`).
- **Font audit across every DOM surface.** Body = Noto Sans, labels = DM Mono, reading-panel title = Fraunces. Any drift gets flagged and fixed. Font-size scale gets tightened to 4–5 sizes max.
- **No overlapping UI elements at any viewport.** Regression-check against common resolutions.

### 6. Removals (the clean-up inside v3.3)

- Right-side **gathered button** (dead UI).
- **Depth-per-year** option in bottom-right panel.
- Any **Shift+P** or other old shortcut referenced in code comments but not active.
- **Graticule** if it is not actually wired to the scene (flagged by Explore agent as suspect).
- **Label slider** UI — labels-always-on replaces it; the threshold control is no longer needed.

---

## Phase Breakdown

Each phase = one commit surface, verification gate before the next starts. Executed via `/gsd-execute-phase` with Kimi dispatch where the work is mechanical (24, 25, 26 especially). Design-impacting phases (16, 21, 23) stay in Claude with `design-review-apparatus` at Stage 6.

| # | Phase | Surface | Verification gate | Mode |
|---|---|---|---|---|
| 16 | **Brainstorm spike — planetary overture** | Visual companion, 2–3 mockups, Mo picks one. Then execution: initial view + transition into clusters. | Mo selects direction before execution. Playwright: screenshot boot state, click/transition, screenshot cluster state. | Claude |
| 17 | Star labels always-on + label-click nav | `.sl` visibility default, click handler | Every star has visible label at rest; label click triggers ENTER_CONSTELLATION | Claude |
| 18 | Unified left column (query + filters) | `filter-panel.ts` absorbs `query-bar.ts` role | Text + facet filters produce same filtered set; no top query-bar in DOM | Claude |
| 19 | **Brainstorm spike — text-input-drives-stars** | Visual companion, 2–3 options, Mo picks one. Then execution. | Mo selects response mode. Visual check + perf (no frame drops on type). | Claude |
| 20 | Gather as staging action (filter stays silent) | Remove "highlight filtered across all views"; staging only on Gather click | Filter mutation does not animate; Gather click triggers staging sphere | Claude |
| 21 | Reading panel → right drawer | `reading-panel.ts` CSS + position | No overlap with selection surface; drawer ≈380px right; responsive check | Claude |
| 22 | Contextual bottom-right panel | View-scoped control set; depth-per-year removed | Panel contents differ per `view-state.kind` | Claude |
| 23 | Star motion + dim/highlight polish | `transition-choreographer.ts`, `star-flight.ts`, staging animations | Timing + easing feel astrophotographic; `prefers-reduced-motion` respected | Claude |
| 24 | Theme + token audit | Token additions, coral replacement, opacity naming | No hex literals in JS/TS outside `scene-state.ts` nucleus colors; no ad-hoc opacity numbers | Kimi |
| 25 | Font + size audit, overlap regression | Font families + scale consolidated; layout sweep | No overlaps at 1280×800, 1440×900, 1920×1080, 2560×1440 | Kimi |
| 26 | Removals | Gathered button, depth-per-year, old shortcuts, unused graticule, label slider | Grep + Playwright: no dead handlers, no dead DOM | Kimi |
| 27 | Final QA + ship gate | Full 60–90s flow; Vercel preview | Mo's approval closes P7-01 + P7-06 | Claude |

Each phase gets its own GSD plan directory (`.planning/phases/phase-NN-<slug>/PLAN.md`).

---

## Critical Files

**Code:**
- `src/main.ts` — boot, layer wiring, raycasting; planetary-overture entry point
- `src/data/view-state.ts` — needs `'planetary' | 'global' | 'constellation' | 'reading'` extension
- `src/ui/query-bar.ts` — folds into `src/ui/filter-panel.ts`
- `src/ui/filter-panel.ts` — becomes unified left column
- `src/ui/reading-panel.ts` — geometry change to right drawer
- `src/scene/star-flight.ts`, `src/animation/transition-choreographer.ts` — motion polish
- `src/scene/orbitals/staging.ts` — decouple from filter mutation, wire to explicit Gather
- `src/style.css` — token additions, opacity names, font audit

**Design references (read, cite, do not edit):**
- `design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md` — authority
- `design/canon/web-apps/kunumi-institute.md` — structural
- `design/canon/web-apps/byld.md` — register
- `design/rejections/*.md` — non-negotiables

**Project state:**
- `.planning/STATE.md` — updated to v3.3 at Phase 16 start
- `.planning/PROJECT.md` — v3.3 goals appended
- `.planning/MILESTONE-v3.3.md` — this document

## Reuse Opportunities (Explore findings)

- `layout-controller.ts` already toggles `body.classList` for view-state — reuse for planetary overture, do not add a parallel system.
- `persistence.ts` already handles localStorage for shortlist + query — reuse for "has user seen planetary overture before" (skip gesture on return).
- `transition-choreographer.ts` T1/T5 pattern works — extend with a T0 (planetary → global) using the same `power1.inOut` pattern, same easing.
- `filter-counts.ts` already computes facet counts — the unified left column does not need new counting logic.
- `phyllotaxis.ts` stays where it is (comparison mode); the planetary overture gets its own geometry (likely polar clustering around a central sphere), not phyllotaxis.

## Milestone Close (Phase 27)

1. **60–90s first-time flow** (P7-01 from v3.2, still open): land → query → focus → read → add 3 to reading list → review / compare. Mo or internal tester runs cold, times the flow, no hints.
2. **No-overlap sweep:** screenshot at four viewports, every view state (planetary, global, constellation, reading, comparison). No UI elements overlap.
3. **Reduced-motion check:** `prefers-reduced-motion: reduce` — all new animations respect it.
4. **Keyboard path:** the same 60–90s flow, keyboard-only.
5. **Test suite:** all existing tests pass; new tests added per phase pass; count ≥ 248.
6. **Bundle:** gzipped JS ≤ 800KB budget. Current baseline 237KB leaves headroom for the overture geometry; watch it.
7. **Vercel preview:** deploy, Mo visually approves (P7-06 from v3.2).

---

*Finalized 2026-04-17. Session that opens Phase 16 is the first execution session.*
