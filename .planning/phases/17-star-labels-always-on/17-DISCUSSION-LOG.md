# Phase 17: Star Labels Always-On + Label-Click Nav + Contextual Bottom-Right Panel — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 17-star-labels-always-on
**Areas discussed:** Category, Click semantics, Focus flow, In-cluster behavior, Opacity baseline, Label slider handoff, Slider default, Phase 22 scope, Overture gate, Global click motion, In-cluster click motion, View-scoped toggles, Click mechanism, Verification

---

## Category

| Option | Description | Selected |
|--------|-------------|----------|
| Polish (primary) + feature sliver | Config flip + click handler sliver. Polish loop is primary. | ✓ |
| Feature | Full GSD plan-phase → execute → verify spine. | |
| Polish only | Skip TDD entirely; design-review + visual UAT only. | |

**User's choice:** Polish (primary) + feature sliver (Recommended)
**Notes:** Category choice routes work through `work-categories.md` polish loop: DESIGN-STATE + design-review-apparatus, not /gsd-plan-phase full spine.

---

## Click semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate to parent cluster | ENTER_CONSTELLATION (plain MILESTONE reading). | |
| Focus the specific star + open reading panel | Click label → fly to star + open panel. Skips cluster view. | ✓ |
| Both — single-click focuses, double-click enters cluster | Two-level interaction. | |

**User's choice:** Focus the specific star + open reading panel
**Notes:** Reshaped the phase significantly — label becomes a direct case-open affordance, not a cluster-nav primitive. Decoupled reading from constellation focus.

---

## Focus flow

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-enter cluster then focus star then open panel | Staged choreography: T1 → camera to star → panel. | |
| Open panel directly from planetary/global without entering cluster | Scene unchanged; panel slides in. Decoupled from focusedKey. | ✓ |
| Click focuses only (no panel) — second click opens panel | Two gestures: first focuses, second reads. | |

**User's choice:** Open panel directly from planetary/global without entering cluster
**Notes:** Requires refactor — reading panel today is focused-mode-gated. Phase 17 planner must decouple.

---

## In-cluster label visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Only focused-cluster labels show | Mirrors star visibility; density stays readable. | ✓ |
| All 116 labels visible always | Full density; risk of overlap chaos. | |
| No labels inside clusters | Labels are global-only nav primitive. | |

**User's choice:** Only focused-cluster labels show (Recommended)
**Notes:** Matches the observed register — labels present but proportionate to view.

---

## Opacity baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Keep .12, brighten on hover | Minimum-change; existing .sl.hover gold state. | ✓ |
| Recalibrate to .18–.22 | More readable; risk of scene-noise. | |
| Dynamic by distance/density | Smart fade; adds logic. | |

**User's choice:** Keep .12 as default, brighten on hover (Recommended)

---

## Label slider handoff

| Option | Description | Selected |
|--------|-------------|----------|
| Hide in 17, remove DOM in Phase 26 | Slider hidden but wired; Phase 26 Kimi kills it. | |
| Remove fully in 17 | Phase 17 owns full removal; Phase 26 loses scope. | |
| Leave wired + visible (no-op) | Confusing: slider present but irrelevant. | |
| **Slider stays; adds view-scoped toggles** (user free-text) | Slider is source of truth across views; constellation adds more toggles. | ✓ |

**User's choice:** "Slider should control labels. Slider is always there in the panel (in overall view and constellation view). In constellation view, the additional toggles get added to the panel."
**Notes:** Completely reversed the assumption — slider is NOT being removed. It stays as the opacity control of record. This triggered follow-up questions about slider default + view-scoped content.

---

## Slider default (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Default at ~.12 / low setting | Matches MILESTONE "low opacity by default." | ✓ |
| Default at Auto (hover-only) | Labels hidden at rest — contradicts MILESTONE. | |
| Default at All (full opacity) | Overwhelms scene. | |

**User's choice:** Default at ~.12 opacity / low setting (Recommended)

---

## Phase 22 scope

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 22 handles view-scoped toggles; 17 stays small | Cleanest phase boundary. | |
| Phase 17 scaffolds view-scoped panel + slider | Broader 17 scope; 22 thinner. | |
| Merge 17 and 22 into one phase | Roadmap restructure; avoids artificial split. | ✓ |

**User's choice:** Merge 17 and 22 into a single phase
**Notes:** Roadmap-level change. Requires ROADMAP.md edit: Phase 17 renamed, Phase 22 slot freed.

---

## Overture gate (click during overture)

| Option | Description | Selected |
|--------|-------------|----------|
| Scene stays put; panel slides in | Simple; panel independent of camera. | |
| Camera flies to star first, then panel | Richer; requires fly-from-any-view logic. | |
| Click blocked during overture; works post-overture | Safest for Phase 16 invariants. | ✓ |

**User's choice:** Click during planetary overture is blocked; only works post-overture

---

## Global-view click motion (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Panel opens in place; scene stays put | Reading is spatially independent. | ✓ |
| Camera flies to star's cluster (T1), then opens panel | Three-beat choreography. | |
| Camera flies directly to star, bypasses cluster focus | New camera path. | |

**User's choice:** Panel opens in place; scene stays put (Recommended)

---

## In-cluster click motion (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Camera flies to star + reading panel opens | Star-focus path + panel. | |
| Panel opens in place; star visually highlighted; no camera | Minimal scene motion. | ✓ |
| Only panel opens; no star indication | Panel-only; loses spatial link. | |

**User's choice:** Reading panel opens in place; star visually highlighted but no camera move

---

## View-scoped toggles (merged Phase 22 work)

| Option | Description | Selected |
|--------|-------------|----------|
| Grouping dimensions (country/region/vertical) | Reuses existing groupMode. | ✓ |
| Filtering dimensions (proof-type/impact-scale) | Blocked on derived fields; flagged in CLAUDE.md as "Known Limitation." | ✓ |
| Year/time-axis toggle | Contradicts Phase 26 depth-per-year removal. | |
| Label opacity slider | Always present; locked in D-06/D-07. | ✓ |

**User's choice:** Grouping + Filtering + Label slider
**Notes:** Proof-type/impact-scale filtering requires derived fields that don't exist in cases.json today. Flagged as blocker in CONTEXT.md; planner must choose (a) scaffold disabled UI, (b) defer, or (c) quick derivation.

---

## Click mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| pointer-events:auto + per-label click handler | Mirrors .cl pattern; keeps raycast untouched. | ✓ |
| pointer-events:none; raycast star mesh | Small click target; bad ergonomics. | |
| Both — label and star mesh both open panel | Dedup concerns. | |

**User's choice:** Enable pointer-events on .sl, bind click handler per-label (Recommended)

---

## Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Playwright MCP UAT + DESIGN-STATE sign-off | Mirrors Phase 16 UAT pattern. | ✓ |
| Unit tests + manual eyeball | Weaker guarantee. | |
| Full UI-SPEC + UI-review flow | Overkill for polish. | |

**User's choice:** Playwright MCP UAT + DESIGN-STATE sign-off (Recommended)

---

## Claude's Discretion

- Exact wiring pattern for `.sl` click (delegated vs. per-label listeners)
- Whether `pointer-events:auto` sits on `.sl` base or `.sl.show` only
- ReadingPanel API refactor shape (keep focusedKey prop + null-tolerant, or new method)
- View-scoped bottom-right panel structure (single panel + conditional children vs. one-per-view)

## Deferred Ideas

- Fly-to-star camera motion from label click (rejected)
- Label click during planetary overture (blocked by overtureComplete)
- Proof-type + impact-scale filtering (blocked on data model)
- Label slider removal (Phase 26 scope change needed)
- ENTER_CONSTELLATION via label click (superseded by direct panel open)
