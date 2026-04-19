# Phase 18: Unified Left Column - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Category:** polish (primary) + feature sliver (structural consolidation — `query-bar.ts` folds into `filter-panel.ts`)
**Mode:** Claude (design-impacting)
**Predecessors:** Phase 17 (view-scoped bottom-right panel, star-label click-to-read, grouping switcher moved to bottom-right constellation-only via D-08)
**Followers:** Phase 19 (text-input-drives-stars behavior — same input element), Phase 20 (gather as staging action — strips `applyFilterWave`), Phase 21 (reading panel → right drawer — geometry compatible with left column)

---

<domain>
## Phase Boundary

`src/ui/query-bar.ts` folds into `src/ui/filter-panel.ts`. The unified left column becomes the single inquiry surface: one pane, two input modes (keyword + facet), same `FilterState`, same result set. The top-center query bar DOM (`#queryWrap`) is removed entirely. The sidebar `<aside class="filters">` is reshaped from an orphaned v3.1 shell into the unified column host.

**Net structural result:** one panel instead of two; one `mountX()` call instead of two; one piece of CSS instead of two. Aligned with Kunumi's structural model (inquiry, not filtering) and BYLD's register (instrument, not dashboard).

</domain>

<decisions>
## Implementation Decisions

### Visibility per view-state

- **D-01:** Left column is **hidden during planetary overture**. Preserves the "single invitation" register. Matches today's `body.planetary #queryWrap` behavior. Column only enters the DOM-visible regime once `overtureComplete === true` (same gate used by the bottom-right panel and star-label clicks in Phase 17).
- **D-02:** In **global view**, left column is **collapsed-by-default to a vertical tab** (the existing `.filters-tab` pattern in `index.html:77` / `.css:551`). User expands by clicking the tab. This is a shift from v3.2's always-visible top query-bar — the inquiry surface is available but does not claim the frame until the user reaches for it. Kunumi structural refusal: don't crowd the field.
- **D-03:** In **focused constellation view**, left column is **visible, same geometry as expanded-global**. No collapse tab in constellation. The inquiry surface is continuous once focus is committed.
- **D-04:** When **reading panel is open**, left column **stays visible** (respecting its current state — expanded or collapsed-to-tab). Reading panel lives in the right region (today an overlay; Phase 21 makes it a right drawer ≈380px). Left column + right drawer obey the "no two panels occupy the same spatial region" invariant.

### Transition between view-states

- **D-05:** On `ENTER_CONSTELLATION` (global → constellation), the left column **auto-expands** if it was collapsed-to-tab. Rationale: entering a cluster is a commitment to focused refinement; the inquiry surface should follow. On `EXIT_CONSTELLATION` (constellation → global), the column **re-collapses to tab** — returning to the field means releasing the refinement chrome. No persistent "expanded across the session" state. *(Note to planner: this is the single piece of auto-expand logic; keep it inside the view-state listener, not scattered across ENTER/EXIT handlers.)*

### Internal column composition

- **D-06:** **Input at the top of the column, above facet accordions.** DM Mono 14px, gold underline on focus, placeholder `"What kind of proof do you need?"` (carried forward from QRY-01). The input IS the primary inquiry surface; facets refine. Replaces the current `f-search` sidebar input, not added alongside it.
- **D-07:** **Readout: drop the CLUSTERS half. Keep only `N CASES`.** DM Mono 11px teal, directly under the input, paired as cause/effect. The M CLUSTERS count is informational noise for a strategist who cares about cases, not cluster tallies. *(filter-panel.ts lines 117-126 already renders a `matched / total` row in .filter-status — consolidate there or keep the under-input placement; planner decides structure. The semantic is the same: one count, teal, DM Mono, live.)*
- **D-08:** **Query history chips kept under the input, same behavior** as today's `.query-chip` row. Persisted via `loadQueryHistory()` / `addQueryToHistory()` in `src/data/persistence.ts`. Returning users see recent searches without re-typing. Low visual cost, high internal-workflow utility.
- **D-09:** **Query hint kept — both states.** Empty-state: `Or explore the full catalog — click a cluster to enter.` No-match: `No observations match "x". Try broader terms: [chips]` with broader-term suggestion chips. Both states earn their space — empty orients, no-match recovers from dead-ends. Matches current `updateHint()` behavior in query-bar.ts.
- **D-10:** **Welcome-back message dropped.** The `showWelcomeBack(store, readoutEl)` behavior that hijacks the readout on boot with `Welcome back. N readings in your list, last added Xh ago.` is removed. The Reading List tab already surfaces the count; the nudge is redundant. Delete `showWelcomeBack()` entirely from `query-bar.ts` before removing the file.
- **D-11:** **Advanced drawer mechanism removed entirely.** The `queryAdvancedToggle` + `advancedDrawer` progressive-disclosure pattern (query-bar.ts lines 230-252) disappears. Facet accordions live in the unified column and are always-available (once the column is expanded). Delete the button, the drawer div, the `drawerMounted` gating logic, and the `mountFilterPanel(drawer, ...)` nested call path.

### Mode-row (grouping switcher) resolution

- **D-12:** **Grouping switcher (vertical/country/region) lives in the bottom-right panel full-time** — in both global and constellation views. The constellation-only rule from Phase 17 D-08 **relaxes**: once the overture completes, the bottom-right panel is visible in global, and grouping chips render alongside the LABEL OPACITY slider. *(Implementation: `main.ts:249` already adds `.on` class to `elControls` at overture-complete; the `.cc-constellation-only` class gate on `#ring-switcher` in `index.html:166` is dropped, or the class is renamed/removed so the switcher shows unconditionally post-overture.)*
- **D-13:** **Remove the mode-row from `filter-panel.ts` entirely.** The `.mode-row` rendered in `buildGlobalHTML` (lines 127-133) is deleted; the `options.hideModeSwitcher` parameter and its call-site in `query-bar.ts:247` disappear with the Advanced drawer. Single home for grouping: bottom-right panel.

### Cleanup scope

- **D-14:** **Clean the orphaned v3.1 filter DOM in index.html now (lines 82-110).** The `<aside class="filters">` shell currently contains `f-search` input, `fg-year` / `fg-scope` / `fg-service` accordion stubs, `filters-foot` status bar, and a `filterClear` button — all overwritten by `filter-panel.ts` on boot via `innerHTML`. This is dead on arrival. Phase 18 IS the left-column restructure; leaving dead DOM inside the exact surface being reshaped would be weird. Phase 26's Kimi scope gets slightly lighter.
- **D-15:** **Remove the entire `#queryWrap` block from index.html (lines 136-154).** Includes `queryInput`, `queryReadout`, `queryClear`, `queryHint`, `queryHistory`, `queryAdvancedToggle`, `advancedDrawer`. `filter-panel.ts` already renders its HTML via `innerHTML` and will own the input + readout + chips + hint DOM going forward. ~20 lines of HTML removed.
- **D-16:** **Remove the query-bar CSS in Phase 18, not Phase 26.** Selectors to delete: `.query-wrap`, `.query-bar`, `#queryInput`, `.query-readout`, `.query-readout.welcome-back`, `.query-clear`, `.query-clear.visible`, `.query-hint`, `.query-history`, `.query-chip`, `.query-advanced-toggle`, `.advanced-drawer`, and any related media-query overrides (e.g., `.comparison-active .query-wrap`, `body.planetary #queryWrap`). Approximately src/style.css lines 228–~340 plus the planetary/comparison overrides (~100 lines total). New unified-column styles go in their place. Phase 26 stays focused on its other deletions.

### Focus-back button

- **D-17:** **Keep the `← {focusedKey}` button in the column head in constellation mode** (filter-panel.ts `buildFocusedHTML` line 165). Clicking exits focus. Consistent with current behavior; the column head becomes view-aware. The button is redundant with home-button / Escape but serves as the in-column exit affordance.

### Keyboard flow

- **D-18:** **Tab order: input → reset/clear-all → facet accordion headers → chips within open accordions.** Enter on input submits; Escape on input clears. Keyboard-only user can reach every control without touching a mouse. Meets QRY-07 bar. The reset/clear-all button sits in the tab order between input and facets (not skipped). This is a slight deepening of today's flow but the extra stop is structurally honest — reset is a first-class action.

### Tests

- **D-19:** **Split tests: `filter-panel.test.ts` keeps facets/chips/accordions; new `unified-column.test.ts` covers input behavior + integration** (input → filterState.searchText → applyFilterWave → count readout; query history chip clicks; hint state transitions; keyboard submit/escape; auto-expand-on-ENTER_CONSTELLATION behavior). The existing 256-line filter-panel.test.ts survives largely intact; integration tests get their own file.

### Claude's Discretion

- Exact DOM structure inside the unified column (container tag, class names, accordion markup) — planner decides, matching existing filter-panel.ts patterns.
- CSS class renaming strategy (e.g., is `.filters-wrap` still the right name when it's the unified column? rename to `.column-wrap` or similar?) — planner decides based on what reads honestly.
- Whether `N CASES` readout lives under the input or consolidated into `.filter-status` footer — semantically equivalent; planner picks the cleaner render path.
- Debounce timing on input (currently 80ms) — preserve unless a specific reason to tune.
- Whether `main.ts` should dispatch a `viewState` listener for auto-expand, or whether filter-panel.ts subscribes directly — planner decides module boundary.
- Width of the expanded column (currently `.filters` is 232px) — stays, unless the new content pushes it. Note: don't widen into dashboard territory.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project state
- `.planning/STATE.md` — current phase status, branch strategy, milestone progress
- `.planning/PROJECT.md` — project vision, principles
- `.planning/MILESTONE-v3.3.md` — milestone source of truth (§ "What Changes, Grouped by Concern" → "Filtering and gathering — one model, staged once" covers Phase 18 intent; § "Critical Files" lists code surfaces; § "Phase Breakdown" table row 18)
- `.planning/REQUIREMENTS.md` §§ QRY-01 through QRY-08 — query-bar acceptance criteria that must continue to hold after the merge (keyword→dimension mapping, wave response, live readout, keyboard flow, ARIA)
- `.planning/phases/17-star-labels-always-on/17-CONTEXT.md` — D-08 (grouping switcher moved to bottom-right constellation-only — this phase relaxes that rule), integration point notes for Phase 18

### Design canon (read, cite, do not edit)
- `DESIGN-STATE.md` (project root) — active constraint set: tokens, typography, structural rule (no two panels same region), non-goals, rejections
- `/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md` — authoritative direction note (Kunumi + BYLD + Cosmo5 astronomical)
- `/mnt/c/Users/moham/Documents/Thales/design/canon/web-apps/kunumi-institute.md` — structural model: inquiry over filtering
- `/mnt/c/Users/moham/Documents/Thales/design/canon/web-apps/byld.md` — historical register: analog precision, CRT era, instrument panels
- `/mnt/c/Users/moham/Documents/Thales/design/rejections/` — non-negotiables (relevant: rejection of filter-chip-forward UI, rejection of card-grid dashboard)

### Code — files folded, removed, or reshaped
- `src/ui/query-bar.ts` — folds into filter-panel.ts. After Phase 18, this file is **deleted** (or emptied and removed from imports). All exported functions (`mountQueryBar`, `showWelcomeBack`, `countMatches`, `countMatchingClusters`) either migrate to filter-panel.ts or are dropped (showWelcomeBack is dropped per D-10).
- `src/ui/filter-panel.ts` — becomes the unified left column. Absorbs input + readout + history chips + hint + advanced-drawer-responsibility; drops the mode-row (D-13).
- `src/main.ts` — remove `mountQueryBar(...)` call (lines 684-691); update `mountFilterPanel(...)` call (lines 256-261) to pass the additional deps query-bar needed (`cases`, `onFilterChange`). Remove `showWelcomeBack` import + invocation (lines 694-697). Drop `import { mountQueryBar, showWelcomeBack }` (line 19).
- `index.html` — remove `#queryWrap` block (lines 136-154); clean orphaned DOM inside `<aside class="filters">` (lines 82-110, but preserve the shell).
- `src/style.css` — remove query-bar selectors (D-16); ensure `.filters-wrap`, `.filters-tab`, `.filters` styles still apply (or rename cleanly); ensure `body.planetary` hides the unified column.
- `src/ui/filter-panel.test.ts` — keep existing facet/chip/accordion tests; new input+integration tests land in a separate file per D-19.

### Code — files touched but not restructured
- `src/data/filter.ts` — `FilterState`, `matchesFilter()`, `isActive()`: unchanged. The unified column uses the same FilterState and searchText field.
- `src/data/keyword-map.ts` — `applyQuery()`: unchanged. Input event handler still calls `applyQuery(q, filterState, cases)`.
- `src/scene/scene-state.ts` — `applyFilterWave()` / `applyFilter()`: **unchanged for Phase 18.** Wave behavior stays. Phase 20 strips it — not this phase.
- `src/data/persistence.ts` — `loadQueryHistory()` / `addQueryToHistory()`: unchanged. Chips still persist.
- `src/data/view-state.ts` — `ViewStateMachine`, event `ENTER_CONSTELLATION`: unchanged. Filter-panel subscribes to auto-expand on this event (D-05).

### Cross-phase seams (DO NOT pull into Phase 18)
- **Phase 19 (Text-Input-Drives-Stars).** The input element is shared. Phase 18 establishes the input's DOM placement + event wiring + debounce. Phase 19 adds the "stars respond to typing" behavior (motion, brightness, reformation). Do not pre-build 19's behavior here.
- **Phase 20 (Gather as Staging Action).** Today, `applyFilterWave` highlights filtered cases across all views — that highlight goes away in Phase 20, staging becomes Gather-click only. Phase 18 preserves current wave behavior. Do not strip filter-triggered visual response here.
- **Phase 21 (Reading Panel → Right Drawer).** Reading panel geometry changes from overlay to ~380px right drawer. Phase 18's left-column decisions (D-04, stays visible while reading) are geometry-compatible with either the current overlay or Phase 21's drawer. Do not pre-build 21's geometry here.
- **"No two panels in same region" invariant** — honored by left column + right drawer geometry; no discussion needed in planning.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`src/ui/filter-panel.ts`** (291 lines) — the acquirer. `buildGlobalHTML` / `buildFocusedHTML` / `mountFilterPanel` / `bindEvents`: extend these to include input + readout + history chips + hint. The existing `computeChipCounts` + accordion rendering + reset logic all survive unchanged.
- **`src/ui/query-bar.ts`** (298 lines) — the source. Key functions to migrate into filter-panel.ts: `updateReadout`, `updateHint`, `renderQueryHistory`, `mountQueryBar`'s event wiring (input / keydown / clearBtn / history chip click). `showWelcomeBack` is dropped (D-10).
- **`src/data/keyword-map.ts::applyQuery`** — the keyword → FilterState.searchText pipeline. Unchanged; called from the unified column's input handler.
- **`src/data/filter-counts.ts::computeChipCounts`** — facet count computation. Unchanged; unified column calls it same as today.
- **`src/data/persistence.ts::{loadQueryHistory, addQueryToHistory}`** — query history persistence. Unchanged.
- **`src/scene/scene-state.ts::{applyFilterWave, applyFilter}`** — scene response to filter changes. Unchanged.

### Established Patterns

- **`mountX(container, deps)` pattern** — both filter-panel and query-bar follow it. Keep the same pattern for the unified module.
- **`innerHTML` rendering with `bindEvents()` re-run on re-render** — filter-panel.ts pattern (lines 184-188). Preserved.
- **CSS class-based view-state toggles via `body.classList`** — `body.planetary`, `body.constellation`, `body.focused`, etc. The unified column participates same way (hidden on `body.planetary`, auto-expand-state change on enter-constellation).
- **Collapsed-tab pattern** — `.filters-wrap.collapsed .filters{width:0;opacity:0;pointer-events:none}` (style.css:573). Reuse for the global collapsed default (D-02).
- **DM Mono 11px teal for readouts** — `.query-readout` style (style.css:266-273) and `.filter-status` footer. Register-consistent.
- **Debounced input (80ms)** — query-bar.ts:167-168. Preserve unless planner flags a tuning need.
- **AriaLive regions** — `aria-live="polite"` on readout and hint, `role="searchbox"` on input. Preserve for QRY-08.

### Integration Points

- **`main.ts:256` mountFilterPanel call** — grows to pass `cases` and `onFilterChange` (currently query-bar's deps). The grouping switcher callback (currently `onGroupModeChange`) stays on filter-panel's deps even though the mode-row is removed — it may still be called from the bottom-right panel in global (D-12); planner decides call-routing.
- **`main.ts:684-691` mountQueryBar call** — deleted entirely.
- **`main.ts:694-697` showWelcomeBack invocation** — deleted entirely.
- **`overtureComplete` gate (`main.ts:269-271`)** — the unified column's visibility class (`.filters-wrap.on`) is added at overture-complete (same moment `elControls.classList.add('on')` fires at line 249). Today this happens inside `enterConstellation`; Phase 18 hoists it to the overture-complete callback so the column is available in global too. Note: this is a small semantic change — in v3.2, `.filters-wrap.on` fired on enter-constellation; in v3.3 Phase 18, it fires on overture-complete, with the column in collapsed-tab state for global.
- **View-state listener for auto-expand (D-05)** — filter-panel.ts subscribes to viewState events; on `ENTER_CONSTELLATION` removes `.collapsed`, on `EXIT_CONSTELLATION` re-adds `.collapsed`. Single code path.
- **Bottom-right panel (`#cosmoControls`)** — grouping switcher (`#ring-switcher`) moves from constellation-only to always-visible-post-overture (D-12). This requires dropping the `.cc-constellation-only` CSS gate on `#ring-switcher` (or removing the class from the element entirely), and ensuring the bottom-right panel's `.on` class is set at overture-complete (already true post-Phase 17 per main.ts:249).
- **Reading panel** — unaffected by Phase 18. Opens from global (label click), constellation (star click), or in-cluster label click. Left column stays visible throughout.

</code_context>

<specifics>
## Specific Ideas

- The **collapsed-by-default-in-global** decision is the register-defining move. It's explicitly not "top query-bar replaced by left query-bar." The inquiry surface becomes **available on reach**, not announced. This is a Kunumi structural move — the interface doesn't present options; the user claims the inquiry when they want it. Planner should treat the collapsed-tab as the register, not as a fallback.
- The **drop of `M CLUSTERS`** is a register move too. One count, not two. Strategists care about cases; cluster tallies are dashboard language.
- **Auto-expand on ENTER_CONSTELLATION, re-collapse on EXIT** is the single piece of cross-state choreography in this phase. If it feels over-scripted in implementation, collapse to a one-liner: on state change, set `.collapsed` = `state.kind === 'global'`.
- **`N CASES` readout consolidation:** planner has flexibility to either (a) render it under the input (matching today's query-bar placement) or (b) consolidate into the existing `.filter-status` footer. Either is register-consistent. Planner picks based on cleaner render flow.
- **No welcome-back message.** Returning users get their query history chips (if they've ever searched) as the continuity signal. The explicit "Welcome back" copy reads as SaaS — the chips are structurally honest.

</specifics>

<deferred>
## Deferred Ideas

- **Reading panel geometry** (Phase 21) — left column stays visible while reading regardless of whether reading is overlay (today) or right drawer (Phase 21). No action here.
- **Stars respond to typing** (Phase 19) — input wiring in Phase 18 is structural/filtering only. Visual response in Phase 19.
- **Filter-triggered visual wave removal** (Phase 20) — preserve `applyFilterWave` behavior in Phase 18; strip in Phase 20.
- **CSS class rename (`.filters-wrap` → something more honest)** — if planner decides the current name misreads post-merge, rename with the migration; otherwise defer to Phase 24 theme/token audit.
- **Possible consolidation of `.filter-status` + under-input readout** — if planner picks one placement for `N CASES`, the other disappears naturally. No separate cleanup needed.
- **Graticule decision** (milestone-wide open question per DESIGN-STATE) — unrelated to Phase 18.
- **Gold-overload open question** (flagged in Phase 17) — unrelated to Phase 18.

</deferred>

---

*Phase: 18-unified-left-column*
*Context gathered: 2026-04-19*
