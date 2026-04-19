# Phase 17: Star Labels Always-On + Label-Click Nav + Contextual Bottom-Right Panel — Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Category:** polish (primary) + feature sliver (click handler + view-scoped panel content)

<domain>
## Phase Boundary

Three coordinated changes to the observatory's label + panel layer:

1. **Star labels (`.sl`) visible by default at low opacity** (`.show { opacity: .12 }`) across planetary, global, and constellation views. In constellation view, only the focused cluster's labels show. Hover brightens to gold.
2. **Clicking a star label opens the reading panel for that case.** Scene stays put. The click is a direct case-open affordance, spatially independent of camera position. Label click is blocked during the planetary overture (gated by `overtureComplete` flag from Phase 16).
3. **Bottom-right panel becomes view-scoped** (merges Phase 22 into Phase 17). Planetary + global: label opacity slider only. Constellation: label slider + grouping-dimension switcher (country / region / vertical) + filtering toggles (proof-type / impact-scale — blocked on derived-field data model; see canonical_refs).

Out of scope: fly-to-star camera motion from label click, label-click triggering ENTER_CONSTELLATION (rejected in favor of direct panel open), label slider removal (stays as the opacity control of record).

</domain>

<decisions>
## Implementation Decisions

### Phase category
- **D-01:** Phase category is **polish (primary) + feature sliver (secondary)**. Primary loop = DESIGN-STATE constraint set + `design-review-apparatus` + Playwright UAT. Feature sliver (click handler) runs TDD inside the polish loop. No `/gsd-plan-phase` full spine; use polish loop per `work-categories.md`.

### Scope — roadmap change
- **D-08:** **Phase 17 and Phase 22 are merged into one phase.** New scope = labels-always-on + label click → reading panel + contextual bottom-right panel content. ROADMAP.md edited in this session (2026-04-19): Phase 17 renamed to "Star Labels Always-On + Label-Click Nav + Contextual Bottom-Right Panel"; Phase 22 marked `[removed — merged into 17]`. Phase 26's Kimi scope (slider removal) also needs updating — slider stays as opacity control of record (flagged in ROADMAP.md but not edited there yet).

### Sequencing with Phase 21
- **D-15:** **Keep Phase 17 first.** Phase 21 (Reading Panel → Right Drawer, ≈380px geometry + no-overlap audit) lands after 17. Phase 17 does the **minimum panel-shape work** needed to open the panel from global view correctly — enough for label-click-to-open to feel right. Phase 21 later does the full right-drawer geometry polish + cross-phase overlap audit. Accept the risk that 17's partial panel work may need rework in 21; the alternative (land 21 first or merge 21 in) was weighed and rejected for scope hygiene.

### Scope correction (2026-04-19, post-discovery during slice 2)
- **D-16 [correction]:** The `.sl` star-label DOM elements **do not exist in the v3 TypeScript codebase** — only the CSS does. v2's `cosmos.js` created them but the v3 refactor never ported the logic. Phase 17 therefore **builds `.sl` from scratch** (not reinstatement). Slice 2 scope expands accordingly: per-case DOM div creation in the scene-build path, positioned each frame via `projectToScreen`, bound with `data-case-id`, click handler wired — all in one slice. The feature-sliver framing in D-01 still holds; this is larger than one handler but still within the polish-loop + TDD contract.
- **D-17 Distance-based opacity falloff:** The CSS `.sl.show { opacity: .12 }` is the *near-camera maximum*, not a global constant. Labels fade smoothly as their star moves farther from the camera (linear ramp from `.12` near to `0` far). Reason: 116 labels visible simultaneously at `.12` reads as "advertised," which violates the direction note's "observed, not advertised" register. Distance falloff carries the density reduction without adding control chrome. Hover ignores falloff (gold + full opacity regardless of distance, per existing `.sl.hover` CSS).
- **D-18 Ghost-star label follows its star:** When a case is shortlisted and its star flies to the staging track, the `.sl` label follows the star mesh. The ghost (low-opacity dashed ring at the original orbit) carries the "was here" signal; the label stays with the star so the user always knows what they're looking at. Rationale: the label is the star's identifier — decoupling them would violate the governing principle that the user always knows what they're seeing.

### Label visibility
- **D-05:** Baseline opacity at-rest = `.sl.show { opacity: .12 }`, understood as the near-camera maximum per D-17. Hover keeps the existing `.sl.hover` gold border + full-opacity treatment regardless of distance. No new opacity tokens.
- **D-07:** Label opacity slider default position on first boot = value that yields `.12` opacity (low setting). User can still push higher ("All" = full opacity) or toward "Auto" (hover-only). The slider remains the source of truth for label opacity; "low by default" = default slider position, not slider removal.
- **D-04:** In-cluster label visibility: only the focused cluster's star labels show. Labels for other clusters hide alongside their (already-hidden) star meshes. Ensures density stays readable (~15–25 labels vs. 116).
- **D-09:** Labels inert during planetary overture. Click handler checks `overtureComplete === true` before acting. Respects Phase 16 invariant: no interaction with scene content before the calibration overture closes.

### Click behavior
- **D-02 / D-03:** Click a star label → open reading panel for that case directly. Scene does not move.
- **D-10:** From global view: panel opens in place as right drawer (Phase 21 geometry); scene stays put. Decoupled from `focusedKey` — reading panel must work without constellation focus (new wiring).
- **D-11:** From constellation view: panel opens in place; star gets visual highlight; no camera motion.

### Click mechanism (technical)
- **D-13:** Enable `pointer-events:auto; cursor:pointer` on `.sl`. Each label div carries `data-case-id` and a click listener bound at label creation (parallel to `.cl` pattern in `scene-state.ts:166` + `scene-state.ts:623` + `scene-state.ts:883` + `regroup.ts:87` + `comparison-mode.ts:111`). Existing hover raycast path on star meshes stays untouched. No double-fire risk because star-mesh click currently doesn't open panel from global view — only label-div click does.

### Bottom-right panel content (merged Phase 22 work)
- **D-12 Grouping dimensions** (confirmed, already exists as `groupMode` + `regroupScene`): country, region, vertical. Switcher lives in bottom-right panel, visible only in constellation view. Reuses existing regroup path.
- **D-12 Filtering dimensions (BLOCKED):** proof-type + impact-scale. **These fields do not exist in raw `cases.json` today** — flagged in CLAUDE.md §"Known Limitations." Phase 17 planner must decide: (a) scaffold the UI with dead toggles pending a data-model phase, (b) derive the fields from existing data (if possible — needs research), or (c) defer these two toggles to a later phase and ship 17 with grouping-only. Research step required before planning.
- **D-12 Label slider:** always present across all views. Phase 17 scope change: slider stays (not removed). Phase 26 (Kimi dispatch) no longer owns slider removal — update its scope if 17 locks slider-stays.

### Verification
- **D-14:** Verification is a **layered contract** — TDD for the feature sliver, design-review + Playwright for the polish surface.
  - **TDD (inside the polish loop)** — the feature sliver is larger than a single handler: decouple `ReadingPanel` from `focusedKey`, wire click handler across 3 label-creation sites + comparison-mode, build view-scoped bottom-right panel scaffolding, optional proof-type/impact-scale derivation. Each of these gets a failing test before implementation:
    - `ReadingPanel.open(case, null)` works when `focusedKey === null` (new behavior)
    - Label click handler invokes `ReadingPanel.open` with correct case id (mock panel)
    - In-cluster mode hides non-focused-cluster `.sl` elements
    - View-scoped panel renders grouping switcher only in constellation mode
  - **Playwright MCP (CDP attach to Windows Chrome per project CLAUDE.md)** — polish-loop gate:
    - Post-overture, `.sl` elements carry `.show` class with computed `opacity: 0.12` across planetary → global → constellation
    - Click a specific `.sl` → reading panel opens with correct case metadata, from any non-planetary view
    - Inside a cluster, only that cluster's `.sl` elements are present in DOM (or have `.show`)
    - Hover a `.sl` → `.hover` class applied, gold border visible
    - During planetary overture, `.sl` click is a no-op (guarded by `overtureComplete`)
    - View-scoped bottom-right panel: slider visible in all modes; grouping switcher visible only in constellation mode
  - **DESIGN-STATE.md sign-off line** added under "Sign-off log" on completion, referencing the constraint set this phase resolves.

### Claude's Discretion
- Exact wiring pattern for `.sl` click handler (delegated event on `#star-labels` container vs. per-label listeners) — planner decides.
- CSS refactor of `.sl` to add `pointer-events:auto` + `cursor:pointer` either on `.sl` always or only on `.sl.show` (probably `.sl.show` so hidden labels aren't clickable).
- Reading panel's wiring to open without `focusedKey`: whether to keep the `focusedKey` prop and pass null, or refactor the panel API. Planner reads `ui/reading-panel.ts` + `layout-controller.ts` and chooses.
- Implementation style of view-scoped bottom-right panel content (single panel with conditional children, or one panel per view with visibility toggles).

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone + project authority
- `.planning/MILESTONE-v3.3.md` — v3.3 premise "Resolve the Observatory"; §1 (scene legibility) names star-labels-return and click-label-as-nav-primitive; §4 (contextual right-bottom panel) names view-scoped content rule
- `.planning/PROJECT.md` — project vision, tokens, non-negotiables
- `.planning/REQUIREMENTS.md` — acceptance criteria
- `.planning/ROADMAP.md` §Phase 17 + §Phase 22 — **requires edit before planning:** merge 17 + 22, free up 22 slot
- `DESIGN-STATE.md` (project root) — current direction, active constraints, rejected options, sign-off log. **Update this on phase completion.**

### Design canon
- `/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md` — authority on register
- `/mnt/c/Users/moham/Documents/Thales/design/canon/web-apps/kunumi-institute.md` — structural model (inquiry over filtering)
- `/mnt/c/Users/moham/Documents/Thales/design/canon/web-apps/byld.md` — historical register (analog precision)

### Code — star labels (create/update sites)
- `src/style.css` §68–81 — `.sl` base, `.show`, `.hover`, `.gather-hide` — click polish changes go here (pointer-events, cursor)
- `src/scene/scene-state.ts:166`, `:623`, `:883` — three label-creation sites; click handler wiring must reach all of them
- `src/scene/regroup.ts:87` — regroup path recreates labels on mode switch
- `src/scene/comparison-mode.ts:111` — comparison mode's own label path
- `src/main.ts:115` — `star-labels` container lookup + `labelThreshold` slider + `overtureComplete` gate (lines 239–266). Tick loop (lines 256–267) currently manages **cluster** (`.cl`) labels only; star (`.sl`) labels are managed at creation time, not in tick.

### Code — reading panel + layout (decouple from focusedKey)
- `src/ui/reading-panel.ts` — panel class; constructor takes `sceneObjects` but opens on `focusedKey`-gated paths today
- `src/layout/layout-controller.ts` — `body.classList` view-state toggling; reading-panel-slot CSS
- `src/data/view-state.ts` — view-state store; add no new kinds in 17

### Code — bottom-right panel (contextual content)
- `src/ui/filter-panel.ts` — current filter UI (left column today; Phase 18 folds query-bar in)
- `src/main.ts` — search for `elLabelSlider`, `elLabelVal` (bottom-right slider wiring)
- Locate existing bottom-right panel container (no element explicitly named; likely CSS-styled div inside main) — planner's first job is mapping current DOM structure

### Code — in-cluster label visibility
- `src/main.ts:256–267` — tick loop shows/hides cluster labels by threshold + focused; star label visibility rule needs adding here
- `src/scene/scene-state.ts` — search for where `.sl.gather-hide` is applied — the "other clusters' stars hidden in focused view" path

### Phase 16 invariants that carry forward
- `.planning/phases/16-planetary-overture/VERIFICATION.md` — Phase 16 verification record
- `src/main.ts:239` — `overtureComplete` flag; star label click must gate on this being `true`

### Playwright UAT infrastructure
- `CLAUDE.md` §"Playwright MCP — Direction A" — CDP attach to Windows Chrome setup; use `browser_evaluate` for class/opacity probes, `browser_take_screenshot` only for visual verification

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.sl` CSS class with `.show`, `.hover`, `.gather-hide` states already exists — phase 17 mostly flips the default (slider low position) + adds pointer-events + click handler.
- `.cl` cluster-label click pattern (cluster labels are already clickable and navigate to constellation) — mirror this for `.sl`: `pointer-events:auto; cursor:pointer` + per-label click listener with `data-case-id`.
- `ReadingPanel` class (in `src/ui/reading-panel.ts`) — exists, handles case open/close. Need to verify it can open without `focusedKey`; if it requires focus, refactor its opening contract.
- `overtureComplete` flag exposed via `window.__overtureComplete()` (dev-only probe added in Phase 16) — reuse for click-gate probe in Playwright UAT.
- `groupMode` + `regroupScene` + filter-panel dimension switching already exists — constellation-view grouping switcher reuses this path directly.
- `labelThreshold` slider UI already exists in DOM (`elLabelSlider`, `elLabelVal`) — phase 17 changes its default initial value, doesn't remove it.

### Established Patterns
- Cluster label (`.cl`) pattern is the template for star-label (`.sl`) interactivity: position in tick loop (projectToScreen), visibility by CSS class (`.show`), click handler bound per element at creation.
- DOM creation happens at scene build / regroup / comparison-mode-enter (three sites). Any per-label wiring (pointer-events, click listener) must be added at ALL creation sites, not just one.
- Tick loop manages `.cl` visibility via `show/hide` class toggling; star labels (`.sl`) currently use a static opacity rule driven by slider. Phase 17 may need tick-loop awareness of in-cluster-visibility rule (show only focused cluster's `.sl`).

### Integration Points
- Phase 16's `overtureComplete` gate — click handler must guard on this.
- Phase 18 (unified left column) — will edit `filter-panel.ts` next. Phase 17's bottom-right panel work must not conflict with filter-panel refactor; keep bottom-right panel separate from left column.
- Phase 20 (gather as staging action) — reading panel click-to-open flow must stay compatible with gather staging (check shortlist-track integration).
- Phase 21 (reading panel → right drawer) — could land before or alongside 17; if before, reading-panel geometry is already right-drawer and label-click-to-open piggybacks. If after, label-click-to-open may need a layout-controller update when 21 changes geometry. **Recommend landing 21 before 17** or handling the cross-phase concern in 17's planner.
- Phase 26 (Kimi removals) — slider is NOT removed anymore (D-06/D-07 change). Update Phase 26's scope when merging 22 into 17.

</code_context>

<specifics>
## Specific Ideas

- "Slider is an always-there in the panel (in overall view and constellation view). In constellation view, the additional toggles get added to the panel." — Mo, during discuss-phase.
  - Confirms: slider is the persistent bottom-right control; view-specific additions layer on top of it. Not "slider disappears in constellation view" — it stays, and grouping + filtering toggles join it.
- Merged Phase 17 + 22 → one phase covering: label polish + label click + bottom-right panel view-scoping.
- The analog-era observatory register: labels at `.12` are "observed, barely; not advertised." Hover lights them gold because gold = navigation/active (DESIGN-STATE line 15). Click nav = gold = correct register.

</specifics>

<deferred>
## Deferred Ideas

- **Fly-to-star camera motion from label click** — considered and rejected in this phase. Scene stays put. If desired later, add as a separate affordance (e.g., double-click, or a different gesture) so single-click-to-read stays simple.
- **Label click from planetary overture** — blocked by `overtureComplete` gate; deliberately so. Post-overture behavior covers all use cases.
- **Proof-type + impact-scale filtering toggles** — D-12 flagged BLOCKED. These fields need derivation from existing case data or a data-model phase first. Options for Phase 17's planner:
  - (a) Scaffold the toggle UI as disabled/placeholder, ship grouping-only as functional → unblocks once data lands
  - (b) Defer both toggles to a new phase (17.1 or renumbered) → cleaner boundary
  - (c) Quick derivation if feasible (e.g., map `services[]` to proof-type via existing SERVICE_TO_VERTICAL pattern)
  - Planner must research feasibility before committing.
- **Label slider removal** (was Phase 26 Kimi scope) — reversed. Slider stays as the opacity control of record. Phase 26's Kimi scope needs updating when milestone revision lands.
- **ENTER_CONSTELLATION triggered by label click** — the MILESTONE plain reading (§1 line 54) is superseded by the richer direct-case-open behavior. Cluster entry remains via cluster-label (`.cl`) click (existing path) or other cluster-selection gestures — no new affordance needed for cluster entry in Phase 17.

</deferred>

---

*Phase: 17-star-labels-always-on*
*Context gathered: 2026-04-19*
