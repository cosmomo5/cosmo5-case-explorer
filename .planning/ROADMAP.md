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
- [ ] **Phase 18: Unified Left Column** — `query-bar.ts` folds into `filter-panel.ts`. One pane, two input modes (keyword + facet), same result set.
- [ ] **Phase 19: Text-Input-Drives-Stars** *(brainstorm spike)* — Stars respond dynamically to typing (motion / brightness / reformation). Visual companion mockups → Mo selects → execute.
- [ ] **Phase 20: Gather as Staging Action** — Filter narrows silently; Gather click stages. Remove "highlight filtered across all views."
- [ ] **Phase 21: Reading Panel → Right Drawer** — Geometry change to ≈380px right drawer. No overlap with selection surface.
- [~] **Phase 22: Contextual Bottom-Right Panel** — **Merged into Phase 17** per 2026-04-19 discuss-phase (D-08). Slot preserved for numbering continuity; depth-per-year removal carried forward to Phase 26 Kimi scope.
- [ ] **Phase 23: Star Motion + Dim/Highlight Polish** — `transition-choreographer.ts` + `star-flight.ts` tuned to astrophotographic timing. Single `--ease` preserved.
- [ ] **Phase 24: Theme + Token Audit** *(Kimi dispatch)* — Coral staging sphere replaced or named; ad-hoc opacities named (`--dim-matched`, `--dim-unmatched`, `--ghost`, `--glow`).
- [ ] **Phase 25: Font + Size Audit + Overlap Regression** *(Kimi dispatch)* — Font families correct across all DOM; scale tightened to 4–5 sizes; viewport sweep at 1280×800, 1440×900, 1920×1080, 2560×1440.
- [ ] **Phase 26: Removals** *(Kimi dispatch)* — Gathered button, old shortcuts, unused graticule. **Depth-per-year removed in Phase 17 slice 4 (2026-04-19)** — taken earlier since the bottom-right panel was already being restructured. **Label slider removal REVERSED per 2026-04-19 Phase 17 discuss-phase (D-06/D-07)** — slider stays as the opacity control of record.
- [ ] **Phase 27: Final QA + Ship Gate** — Full 60–90s flow; Vercel preview; closes v3.2 P7-01 + P7-06.

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

### Phase Details

#### Phase 8: Clean Substrate
**Goal:** The codebase matches v3.2 intent before any new UI is added. All orphaned v1/v2 DOM removed. Phyllotaxis code preserved and isolated for Phase 12 adaptation. Schema extended for imagery. Branch strategy documented.
**Depends on:** Nothing (first phase of v3.2).
**Requirements:** CLN-01, CLN-02, CLN-03, CLN-04, CLN-05, CLN-06
**Plans:** 3/3 plans complete
Plans:
- [ ] 08-01-PLAN.md — Remove orphaned DOM (index.html), TS (detail-panel.ts + main.ts), and CSS (style.css)
- [ ] 08-02-PLAN.md — Isolate phyllotaxis geometry into src/scene/phyllotaxis.ts (TDD)
- [ ] 08-03-PLAN.md — Extend CaseStudy schema with imagery field, document branch strategy in STATE.md
**Success Criteria:**
1. `index.html` contains only DOM used by active v3.1 components + new v3.2 elements (gather DOM preserved for Phase 12).
2. `grep -rn "countryRail\|panelScrim\|globe-stage" src/` returns nothing except test files or comments.
3. Phyllotaxis geometry code isolated in a clearly labeled module, documented as "preserved for Comparison Mode (Phase 12)."
4. `CaseStudy` type has optional `imagery` field. Empty `public/case-imagery/` directory exists.
5. Build is clean. All 190 existing v3.1 tests still pass.
6. STATE.md declares phase-1c canonical and documents hybrid branch strategy.

#### Phase 9: Atmosphere
**Goal:** First paint announces the observatory before any interaction happens. CRT graticule + calibrating loader + corner wordmark establish the register.
**Depends on:** Phase 8.
**Requirements:** ATM-01, ATM-02, ATM-03, ATM-04
**Success Criteria:**
1. Fresh page load shows calibration sequence in honest boot time (not padded) before field is interactive.
2. CRT graticule is present but does not compete for attention (user notices only on focused look).
3. Corner wordmark is readable, ≤80px wide, no overlaps at any breakpoint.
4. On reduced-motion, loader resolves instantly without ticking animation.

#### Phase 10: Query Bar
**Goal:** The primary interaction surface is a conversational first-person declarative input. Filter panel collapses to progressive-disclosure Advanced drawer.
**Depends on:** Phase 9 (atmosphere establishes register before query is visible).
**Requirements:** QRY-01, QRY-02, QRY-03, QRY-04, QRY-05, QRY-06, QRY-07, QRY-08
**Plans:** 5/5 plans complete
Plans:
- [x] 10-01-PLAN.md — Wave 0 test stubs (keyword-map, filter-searchtext, filter-wave, clusters-count, query-bar DOM/ARIA)
- [ ] 10-02-PLAN.md — keyword-map.ts + FilterState.searchText extension
- [ ] 10-03-PLAN.md — applyFilterWave scene integration
- [ ] 10-04-PLAN.md — query-bar.ts UI component
- [ ] 10-05-PLAN.md — Advanced drawer + filter panel integration
**Success Criteria:**
1. A user can type `fintech growth` and see the field respond within 800ms without opening any panel.
2. The Advanced drawer exposes v3.1 filter-panel functionality at equal fidelity.
3. Empty query shows full field; typing + backspacing to empty restores full field smoothly.
4. `N MATCHES` readout updates live.
5. Full flow testable without a mouse: Tab to input, type, Enter, Tab to drawer, Tab to fields.

#### Phase 11: Reading Panel as Instrument
**Goal:** Reading panel stops reading as marketing summary and becomes an observation of a completed case. Every metric, fact, and attribution rendered as instrument readout. Archive imagery integrated.
**Depends on:** Phase 8 (schema extended). Not blocking on Phases 9–10 for scene work but final aesthetic check depends on atmosphere being present.
**Requirements:** RP-01, RP-02, RP-03, RP-04, RP-05, RP-06, RP-07
**Plans:** 2/2 plans complete
Plans:
- [x] 11-01-PLAN.md — Header grid, imagery, body sections, metrics rows, button text (completed 2026-04-16)
- [x] 11-02-PLAN.md — CSS styling (DM Mono, Fraunces, teal colors, grid spacing) (completed 2026-04-16)
- [ ] 11-03-PLAN.md — Edge cases, responsive, ARIA, accessibility audit
**Success Criteria:**
1. Reading panel reads as "observation of a case" rather than "marketing summary."
2. Every metric appears as DM Mono readout, not celebratory big-bold-number typography.
3. Fraunces italic appears at exactly one evidentiary moment — not sprinkled decoratively.
4. Missing imagery data does not break the layout.
5. `permission: false` cases show `[CONFIDENTIAL]` readout cleanly.
6. `ADD TO READING LIST` is the clear primary action in the panel.

#### Phase 12: Reading List + Review Mode + Comparison Mode
**Goal:** The Reading List becomes a persistent, returnable staging area for the internal user's ongoing study. Two distinct study surfaces open from it: Review Mode (sequential immersion) and Comparison Mode (simultaneous spatial comparison — adapted gather).
**Depends on:** Phase 11 (reading panel drives selection) and Phase 8 (phyllotaxis code isolated).
**Requirements:** RL-01 through RL-08, RV-01 through RV-04, CM-01 through CM-06
**Plans:** 5/5 plans complete
Plans:
- [x] 12-01-PLAN.md — localStorage persistence (reading list, query history, recently-viewed) + query history chips (completed 2026-04-16)
- [x] 12-02-PLAN.md — Track redesign (card layout, count, REVIEW/COMPARE buttons) + welcome-back state (completed 2026-04-16)
- [ ] 12-03-PLAN.md — Review Mode overlay (paginated reader, arrow keys, remove button)
- [ ] 12-04-PLAN.md — Comparison Mode (phyllotaxis gather, dimming, UI hide)
- [ ] 12-05-PLAN.md — Star flight animations (700ms add, 900ms remove, ghost mechanics)
**Success Criteria:**
1. Adding cases persists across page reload, browser restart, tab close. Clearing browser data clears the list.
2. Welcome-back readout appears on return visit when list is non-empty.
3. Review Mode paginates cleanly through 1–20 cases; navigation smooth, Esc exits, list intact.
4. Comparison Mode activates only at ≥3 readings; below threshold, button disabled with explanatory tooltip.
5. Comparison Mode's phyllotaxis formation is visually distinct from focus mode.
6. Query history chips surface recent queries; click re-runs.
7. All star flight animations respect `prefers-reduced-motion` and do not freeze under rapid interaction.
8. No leftover "Shortlist" strings in UI.

#### Phase 13: Hero Collapse
**Goal:** The land state is the field, not a banner. Remove hero + stats. Corner wordmark is the only brand presence.
**Depends on:** Phases 9–10 (atmosphere + query must exist before hero is removed).
**Requirements:** HC-01, HC-02, HC-03, HC-04
**Success Criteria:**
1. `index.html` has no `#hero` or `#stats` elements. `style.css` has no `.hero` or `.stats` rules.
2. First-paint shows field + query + corner wordmark. No marketing banner.
3. An internal user describes the tool as "an observatory / atlas / explorer" — not "a landing page."
4. All v3.1 tests affected are updated with new expectations, not deleted.

#### Phase 14: Edge States and Coverage
**Goal:** Every path through the app has a designed state. No raw error messages, no frozen transitions, narrow-viewport has a designed message.
**Depends on:** Phases 8–13 (all happy paths exist first).
**Requirements:** EDG-01 through EDG-08
**Success Criteria:**
1. Every state in the state machine has a designed visual representation. No raw `undefined` or placeholder strings.
2. Killing network during first paint produces a designed error state, not a broken page.
3. Rapid clicking during transitions never produces a frozen or flickering state.
4. At narrow viewport, user sees designed "desktop-only" message — not a broken layout.
5. A screen-reader user can complete the full flow (tested with VoiceOver or NVDA).

#### Phase 15: Ship
**Goal:** The experience is verified end-to-end against the vision. Regressions fixed. Build shipped.
**Depends on:** Phases 8–14.
**Requirements:** SHP-01 through SHP-07
**Success Criteria:**
1. A fresh internal user completes the full flow end-to-end on first attempt.
2. No regressions from v3.1. Visual warmth intact.
3. WCAG 2.1 Level AA checks pass.
4. Lighthouse desktop ≥80. Bundle <800KB gzipped JS.
5. Vercel preview deployed, Mo approves. STATE.md + card updated.

---

## Completed Milestones

See `.planning/MILESTONES.md` for archived milestone records.

- **v3.1 — Dimensional Explorer** (shipped 2026-04-14, 9 phases 0–7 + 6.5)
