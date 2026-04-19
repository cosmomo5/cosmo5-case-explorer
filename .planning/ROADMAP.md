# Roadmap: Case Study Explorer

## Active Milestone: v3.3 — Resolve the Observatory

**Aesthetic premise:** *"A cosmos of proof, navigable as an atlas — observed, not advertised."* (unchanged from v3.2)

**Goal:** UI/UX polish pass. v3.2 shipped the feature set; in actual use the moves are present but unresolved. v3.3 fixes position, hierarchy, consistency, and scene legibility so the 60–90s internal flow lands. Not a feature milestone. Two phases are exploratory brainstorm spikes (planetary overture, text-input-drives-stars).

**Source:** `.planning/MILESTONE-v3.3.md`

**Primary user:** Internal Cosmo5 strategy/sales team (unchanged).

**Refactor posture:** After v3.3, not before (reasoning in MILESTONE-v3.3.md).

**Imagery (P2-D):** Deferred. Schema hook preserved.

### v3.3 Phases

**Phase Numbering:**
- Integer phases (16–27): Planned milestone work
- Decimal phases: Urgent insertions only (via `/gsd:insert-phase`)

- [x] **Phase 16: Planetary Overture** *(brainstorm spike)* — Initial planet-like view with cases gathered around/within, click/scroll transitions into cluster layout. Visual companion mockups → Mo selects → execute. **3/3 plans complete (completed 2026-04-19)**
- [x] **Phase 17: Star Labels Always-On + Label-Click Nav + Contextual Bottom-Right Panel** — Reinstate `.sl` visibility at low opacity by default (slider-controlled, low-default on boot); label click opens reading panel directly (scene stays put, gated by `overtureComplete`); bottom-right panel becomes view-scoped (slider always present; constellation adds grouping switcher + filtering toggles). **Merged with former Phase 22 per 2026-04-19 discuss-phase (D-08).** Category: polish (primary) + feature sliver. **Complete 2026-04-19: 6 commits (0fcb9e5 → 13daa55); tests 308/308 green; bundle 239.80 kB gzipped.**
- [x] **Phase 18: Unified Left Column** — `query-bar.ts` folds into `filter-panel.ts`. One pane, two input modes (keyword + facet), same result set. (completed 2026-04-19)
- [ ] **Phase 19: Remove Query Input — Filter Panel Only** *(repurposed 2026-04-19)* — Delete the query input, history chips, hint, and `searchText` field introduced in Phase 18. Filtering is facet-only (Country / Service / Year / Proof Type / Impact). The original brainstorm-spike idea (typing-as-scene-force) is preserved in `.planning/seeds/SEED-001-text-input-drives-stars.md` for a future milestone when "the filter panel feels static." Category: feature/removal.
- [ ] **Phase 20: Gather as Staging Action** — Filter narrows silently; Gather click stages. Remove "highlight filtered across all views."
- [ ] **Phase 21: Reading Panel → Right Drawer** — Geometry change to ≈380px right drawer. No overlap with selection surface.
- [~] **Phase 22: Contextual Bottom-Right Panel** — **Merged into Phase 17** per 2026-04-19 discuss-phase (D-08). Slot preserved for numbering continuity; depth-per-year removal carried forward to Phase 26 Kimi scope.
- [ ] **Phase 23: Star Motion + Dim/Highlight Polish** — `transition-choreographer.ts` + `star-flight.ts` tuned to astrophotographic timing. Single `--ease` preserved.
- [ ] **Phase 24: Theme + Token Audit** *(Kimi dispatch)* — Coral staging sphere replaced or named; ad-hoc opacities named (`--dim-matched`, `--dim-unmatched`, `--ghost`, `--glow`).
- [ ] **Phase 25: Font + Size Audit + Overlap Regression** *(Kimi dispatch)* — Font families correct across all DOM; scale tightened to 4–5 sizes; viewport sweep at 1280×800, 1440×900, 1920×1080, 2560×1440.
- [ ] **Phase 26: Removals** *(Kimi dispatch)* — Gathered button, old shortcuts, unused graticule. **Depth-per-year removed in Phase 17 slice 4 (2026-04-19)** — taken earlier since the bottom-right panel was already being restructured. **Label slider removal REVERSED per 2026-04-19 Phase 17 discuss-phase (D-06/D-07)** — slider stays as the opacity control of record.
- [ ] **Phase 27: Final QA + Ship Gate** — Full 60–90s flow; Vercel preview; closes v3.2 P7-01 + P7-06.

### Phase Details

#### Phase 19: Remove Query Input — Filter Panel Only
**Goal:** Delete the text-query input, history chips, hint states, and `FilterState.searchText` field shipped in Phase 18. After this phase, filtering is facet-only (Country / Service / Year / Proof Type / Impact). The unified column shell and its collapse/expand behavior from Phase 18 stay intact.
**Depends on:** Phase 18.
**Context:** `.planning/phases/19-remove-query-input/19-CONTEXT.md`
**Category:** feature / removal (repurposed 2026-04-19 from brainstorm spike "Text-Input-Drives-Stars"; original idea preserved as `.planning/seeds/SEED-001-text-input-drives-stars.md`).
**Plans:** 3/3 plans created
Plans:
- [ ] 19-01-PLAN.md — Delete query input DOM + handlers from filter-panel.ts; remove .query-* CSS rules from style.css
- [ ] 19-02-PLAN.md — Remove searchText from FilterState, matchesFilter, keyword-map, and persistence functions
- [ ] 19-03-PLAN.md — Delete filter-searchtext.test.ts; remove query-input tests from unified-column.test.ts (keep Tests 8-9)
**Success Criteria:**
1. No `<input>` element, `.query-history` container, `.query-chip`, `.query-hint`, or suggestion-chip handler in `src/ui/filter-panel.ts`.
2. No `searchText` field in `FilterState`; no `searchText` branch in `matchesFilter`; no `searchText` wiring in `keyword-map.ts`.
3. `addQueryToHistory` + `loadQueryHistory` + their localStorage key removed from `src/data/persistence.ts`.
4. `.query-history` / `.query-chip` rules removed from `src/style.css`.
5. `src/tests/filter-searchtext.test.ts` deleted; query-input tests removed from `src/ui/unified-column.test.ts`; column-shell + auto-expand tests (8-9) preserved.
6. `tsc` clean; `npm run test` green (expected 290/290, minus ~13 query-specific tests); `npm run build` succeeds with bundle size down 2-5 kB gzipped from 239.37 baseline.
7. Visual regression: expanded column shows header + readout + accordion only. Collapsed tab state unchanged (D-02..D-05 preserved).

---

## Previous Milestone: v3.2 — The Observatory Experience (shipped 2026-04-17)

**Source:** `.planning/MILESTONE-v3.2.md`

- [x] **Phase 8: Clean Substrate** — Remove orphaned DOM, isolate phyllotaxis for Comparison Mode, extend schema with imagery field, document branch strategy (completed 2026-04-14)
- [x] **Phase 9: Atmosphere** — CRT graticule substrate, instrument-calibrating loader, corner wordmark (completed 2026-04-16)
- [x] **Phase 10: Query Bar** — Central conversational input, keyword→dimension mapping, live field response, Advanced drawer fallback (completed 2026-04-16)
- [x] **Phase 11: Reading Panel as Instrument** — Restructure header/body/impact as instrument readout, archive imagery integration, Fraunces italic deployment (completed 2026-04-16)
- [x] **Phase 12: Reading List + Review Mode + Comparison Mode** — Rename, track redesign, star flight, localStorage persistence, Review Mode paginated reader, Comparison Mode adapted gather (completed 2026-04-16)
- [x] **Phase 13: Hero Collapse** — Marketing banner + stats strip removed, ambient catalog readout added (completed 2026-04-17)
- [x] **Phase 14: Edge States and Coverage** — Empty/no-match/error/narrow-viewport states, transition interrupts, a11y audit (completed 2026-04-17)
- [~] **Phase 15: Ship** — Automatable portion complete; P7-01 (flow verification) + P7-06 (Vercel approval) carried forward to v3.3 Phase 27.

---

## Completed Milestones

See `.planning/MILESTONES.md` for archived milestone records.

- **v3.1 — Dimensional Explorer** (shipped 2026-04-14, 9 phases 0–7 + 6.5)
