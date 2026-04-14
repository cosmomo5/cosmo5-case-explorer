# Milestone v3.2 — The Observatory Experience

**Date opened**: 2026-04-14
**Questions resolved**: 2026-04-14 (all 5 open questions answered, see Open Questions section)
**Predecessor**: v3.1 (shipped 2026-04-14 — spatial engine + shortlist track)
**Primary user**: Internal Cosmo5 strategy/sales team (reframed from external prospect 2026-04-14)
**Aesthetic premise**: *"A cosmos of proof, navigable as an atlas — observed, not advertised."*
**Scope**: 8 phases, parallel content-imagery project. Session estimate deferred — track per-phase completion.
**Thinking document**: `.planning/MILESTONE-THINKING.md`

---

## Why This Milestone Exists

v3.1 shipped a complete spatial engine: concentric orbital layout, camera-based focus transitions, ring-dimension switcher, shortlist track, reading panel, 190 passing tests, visual warmth (star glow sprites, twinkle, blue-indigo nebula). The engine works.

**What v3.1 does not yet deliver: the considered experience the engine was built for.**

The primary user has been reframed from *prospect* to *internal Cosmo5 strategy/sales team*. The tool is a showcase of the agency's accomplishments that the team itself uses across multiple sessions — building and returning to their mental library of proof when preparing for client conversations. Closer to a museum's study room than a pitch deck. Functional, but a place worth inhabiting.

A strategist arriving at v3.1 today sees a generic B2B hero banner over a 3D scene. There is no query surface — only a filter panel with vocabulary borrowed from SaaS catalogs ("Year / Scope / Service"). There is no way to study a curated set of cases — the shortlist stages them but has no immersive reader and no spatial comparison view. The reading panel is half instrument-readout, half marketing summary. Nothing persists across sessions. The first paint announces nothing; the calibrating-observatory moment the 2026-04-12 direction note called for does not exist.

v3.1 is the engine. v3.2 is the considered place.

**The design direction has been set** (`design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`): three references, one execution. Kunumi Institute's query-driven navigation, BYLD's analog-era precision register, Cosmo5's own astronomical foundation. v3.2 migrates those moves into the v3.1 codebase.

---

## The Experience Vision

This is what "done" looks and feels like. Every phase serves this picture.

**Primary user: the internal Cosmo5 strategy/sales team.** Someone preparing for a client conversation, a pitch, a proposal. They've used the tool before — some cases they know, some they don't. They're not being shown this; they're working in it. The standard stays high because this is a showcase of the agency's own accomplishments, and the place that showcases them should earn that role. Closer to a museum's study room than a pitch deck.

A strategist opens the tool. The page loads.

**First paint.** Dark field. A thin graticule (CRT-era celestial-sphere grid) fades up from black. Sequential DM Mono text ticks at center-screen — OBSERVATORY INITIALIZING / LOCATING CATALOG / ONLINE — taking only as long as actual boot requires (typically 400–1200ms). As calibration completes, 116 stars populate the field: concentric orbital rings around cluster nuclei, warm glow sprites (from v3.1), nebula drift. A small wordmark in the corner: COSMO5 / OBSERVATORY.

**If returning.** The calibration completes and a quiet readout appears below the query input: `Welcome back. 3 readings in your list, last added 2 days ago.` The reading-list track at the bottom is already populated. State survives across sessions via localStorage.

**Inquiry.** A single input sits centered: *What kind of proof do you need?* The strategist types "retention in SaaS." Non-matching stars dim in waves across the field (~600ms). Matching stars brighten. A readout: `14 MATCHES / 4 CLUSTERS`. Below the input, recent queries surface as clickable chips — the last 5 the user ran, so tomorrow's lookup of the same thing is a tap instead of a retype.

**Investigation.** Strategist clicks the largest responding cluster. Camera rotates face-on (T1, 1200ms). Concentric rings resolve by the cluster's dominant axis (proofType by default). Non-matching stars dim further. Each star is labeled at ring level; a small archive artifact (client logo, campaign visual at low opacity) floats near each star.

**Reading.** Strategist clicks a star. The reading panel slides in from the right. Header: instrument readout — CLIENT / SECTOR / REGION / YEAR / PROOF TYPE / IMPACT BAND in DM Mono, client logo inline, key visual strip at low opacity above. Body: Challenge / Approach / Observed Impact, structured and telegraphic. No marketing prose. A button: ADD TO READING LIST.

**Staging.** Strategist clicks ADD. Star flies out of the orbital ring, drops into the bottom track. Ghost remains at the orbital position (click the ghost to return the star and remove from list). Arrow keys move to the next star in the ring; panel swaps content. Another ADD. Then another. Reading list grows.

**Two ways to study what's staged.** Both activate at thresholds.

**Review Mode** (any time): Click a reading-list card → full-viewport paginated reader. One case fills the screen as a rendered instrument readout. Arrow keys advance. Immersive, sequential, deep. Exit returns to observatory with list intact.

**Comparison Mode** (at ≥3 readings — the adapted gather mechanic): Click COMPARE → the staged stars fly from the bottom track into a phyllotaxis formation at the center of the observatory. All other stars dim heavily. The set becomes visible as a set — spatial, simultaneous, with each gathered star at full size and labeled. Hover any gathered star to open its reading panel without leaving comparison mode. The strategist can now see: does this set span what I need? Are the metrics strong across the board? Which one is the weakest link? Exit returns stars to the reading list track.

**The tool is lived in across sessions.** Reading list persists. Query history persists. Recently viewed cases persist. The next time the strategist opens it, the work they were doing is still there.

**That's the product.** Not a 60-second discovery pitch. A considered place to move through the work the agency has done, with enough tools to study it at the depth the question requires.

---

## Design Principles (from canon)

These are load-bearing. Every phase must cite them.

1. **Astronomical metaphor is structural, not thematic** (`canon/web-apps/kunumi-institute.md`, sensibility principles). Remove the starmap, the interaction breaks. Stars, orbital rings, nuclei, and calibration are the logic, not decoration.

2. **Inquiry, not filtering** (Kunumi Institute). The primary input is a first-person declarative query, not a filter panel. The field responds; the user does not refine attributes.

3. **Analog-era precision register** (`canon/web-apps/byld.md`). CRT graticule. Motion-blurred/soft display type. DM Mono instrument readouts. The historical period is Apollo-era mission control + 1970s vector graphics, not modern aerospace minimalism.

4. **Inhabited metaphor** (`design/principles/_provisional-inhabited-vs-applied.md`). If removing a spatial element doesn't change behavior, it was applied. Every metaphor in v3.2 must be load-bearing — the query reorganizes the field, the reading list takes stars out of their orbit, the compile produces an artifact.

5. **Single accent color earns semantic reach.** Teal = observed / measured / confirmed. Gold = wayfinding / navigation. Blue-indigo = atmosphere (nebula, gradient substrate only — never UI chrome). No purple in v3.2 scope (per `rejections/generic-ai-aesthetic-signals.md`, the rejection is of unreflective purple; the 2026-04-12 direction note proposed purple as a future gather-state signal, which is moot in v3.2 since gather is being retired — see Phase 0). Future iterations can reintroduce purple with intention.

6. **Instrument-panel type contract.**
   - DM Mono → readouts, data cells, readings, calibration sequences, labels.
   - Noto Sans 900 → statements (used sparingly; reserved for load-bearing moments).
   - Fraunces italic opsz 144 → evidentiary emphasis (the word "proof," the word "observed," the terminal action label).

7. **Single `--ease`.** One easing function in the world. Do not add a second.

8. **Motion is load-bearing.** Transitions enact state changes; they do not decorate them. Query-response propagates through the field. Stars fly to the reading list; ghost remains. Returns 20% slower than entries (expansion feels larger — `PROJECT.md` decision).

9. **Accessibility is not negotiable.** `prefers-reduced-motion` gates (three of them in v3.1, maintained). No `maximum-scale=1`. Keyboard affordances for every interactive element. ARIA labels on the query input, reading panel, and track.

---

## Phases

Eight phases, sequenced by dependency. Phases 0–4 deliver the 60-second flow. Phases 5–7 cover polish, edge cases, and ship.

### Phase 0: Clean the Substrate
**Goal**: The codebase matches the v3.2 intent before any new UI is added. All orphaned DOM from v1/v2 is removed. The design-review-plan scope is resolved.

**Depends on**: Nothing.

**Requirements**:
- P0-01: Remove orphaned DOM nodes from `index.html`: `#panel`, `#panelScrim`, `#close` and all children (`#p-*`), `#ctip` and children, `#countryRail`, `#globe-stage`, `#globe-canvas`, `#constellation-canvas`, `#searchWrap` (duplicate search widget). **DO NOT remove `#gatherStage`, `#gatherVignette`, `#gatherList` — these are adapted in Phase 4 for Comparison Mode.**
- P0-02: Remove CSS rules that target the removed DOM (old panel, old tooltip, country rail, globe, constellation). Preserve gather-mode CSS rules — they'll be repurposed in Phase 4. Keep `.cl` (cluster labels — still in use).
- P0-03: Remove unused DOM references from `main.ts` (old DetailPanel import if unused, unused element getters). Document the gather code paths for Phase 4 reference.
- P0-04: Preserve the phyllotaxis geometry + transition code that gather relies on. Extract it, if needed, into a clearly labeled module (`src/scene/phyllotaxis.ts` or similar) so Phase 4 has a clean handoff point. Remove the current gather *wiring* (the filter-results-gather button, the auto-trigger logic) but keep the *mechanic*.
- P0-05: Document the hybrid branch strategy (per Q2). `phase-1c` is canonical. `draft/v3-starmap` is consulted as specification. Per-phase plans name what v3-starmap did and what phase-1c will do. Record this in STATE.md.
- P0-06: Extend `CaseStudy` schema with optional `imagery?: { logo?: string; key_visual?: string }`. Create empty asset directory `public/case-imagery/`. Phase 3 populates as imagery arrives from content project.

**Success Criteria** (what must be TRUE):
1. `index.html` contains only DOM used by active v3.1 components + the new v3.2 elements planned in subsequent phases (gather DOM preserved for Phase 4).
2. `grep -rn "countryRail\|panelScrim\|globe-stage" src/` returns nothing except in test files or comments.
3. Phyllotaxis geometry code is isolated in a clearly labeled module, documented with "preserved for Comparison Mode (Phase 4)."
4. `CaseStudy` type has optional `imagery` field. Empty `public/case-imagery/` directory exists.
5. Build is clean (`npm run build` produces no warnings about unused imports). All 190 existing tests still pass.
6. `STATE.md` declares phase-1c canonical, documents hybrid branch strategy and gather-adaptation decision.

**Plans**: 3 expected (orphan-removal, phyllotaxis-isolation + schema-extension, branch-strategy + decision-documentation).

---

### Phase 1: Establish the Atmosphere
**Goal**: First paint announces the observatory before any interaction happens. CRT substrate + instrument-calibrating loader + corner wordmark.

**Depends on**: Phase 0.

**Requirements**:
- P1-01: Implement CRT celestial graticule behind the starfield. Thin white/teal lines at very low opacity (~0.06–0.10). Radial construction (~24 spokes, ~5 rings) OR latitude/longitude graticule — prototype both and select. The grid must be subtle enough that it reads as substrate, not foreground. If the grid draws attention, it's too strong.
- P1-02: Implement the instrument-calibrating loader. Sequential DM Mono text appearing at center-screen over ~2–3 seconds: `OBSERVATORY INITIALIZING / LOCATING CATALOG / CALIBRATING STARMAP / ONLINE`. `step-end` transitions between frames (sharp cuts, not fades). The final `ONLINE` ticks into gold before the loader clears.
- P1-03: Add the small corner wordmark `COSMO5 / OBSERVATORY` in DM Mono. Replaces the current header block with its logo dots. This is the only brand-surface element on land.
- P1-04: Respect `prefers-reduced-motion` — loader either skips to final state immediately, or fades without the ticking animation.

**Success Criteria**:
1. Fresh page load shows calibration sequence in ≤3 seconds before the field is interactive.
2. CRT grid is present but does not compete for attention (user notices only on focused look).
3. Corner wordmark is readable, stays ≤80px wide, does not overlap any other UI at any breakpoint.
4. On reduced-motion, loader resolves instantly to the field view without the ticking animation.

**Plans**: 3 expected (graticule, loader, wordmark).

---

### Phase 2: The Query Bar (Replaces Filter Panel)
**Goal**: The primary interaction surface is a conversational first-person declarative input. The filter panel collapses to a progressive-disclosure fallback ("Advanced: browse by attribute") for power users, but the default interaction is the query.

**Depends on**: Phase 1 (loader establishes the register before query is visible).

**Requirements**:
- P2-01: Implement central query input. Placeholder: `What kind of proof do you need?` DM Mono. Single bottom border in gold on focus. Width ~480–560px at desktop. Mounted after the loader completes.
- P2-02: Keyword → dimension mapping. Build a hint table mapping common terms to filter dimensions: sectors (fintech → ServiceCategory), regions (emea → Region), metrics (growth → impactBand>=2), temporal terms (recent → year>=2024). For unmatched terms, fall back to full-text search across client, title, challenge, approach.
- P2-03: Query → field response. As user types (debounced ~250ms), the filter system applies the derived filter set. Non-matching stars dim over ~600ms (wave propagation, not instant). Matching stars brighten. A small readout below the input shows `N MATCHES / M CLUSTERS`.
- P2-04: Advanced drawer. Keep a collapsible panel (below or to the side of the query bar) tagged `Advanced: browse by attribute` that exposes the existing filter-panel dimensions (proofType, impactBand, year, country, region). Default collapsed. Opening it overrides query filters with explicit filters.
- P2-05: Clear / reset. An `x` button clears the query and restores full field.
- P2-06: Keyboard: Enter submits query (same effect as debounced typing). Escape clears.
- P2-07: ARIA. Input labeled `Case library query`. Readout announced via `aria-live="polite"` so assistive tech hears match counts update.

**Success Criteria**:
1. A prospect can type `fintech growth` and see the field respond within 800ms without opening any panel.
2. The Advanced drawer exposes the v3.1 filter-panel functionality at equal fidelity (all dimensions accessible).
3. An empty query shows the full field; typing + backspacing to empty restores full field smoothly.
4. `N MATCHES` readout updates live as query changes.
5. Full flow testable without a mouse: Tab to input, type, Enter, Tab to advanced drawer, Tab to fields.

**Plans**: 4 expected (input + wiring, keyword mapping, field response animation, advanced drawer + keyboard + aria).

---

### Phase 3: Reading Panel as Instrument Readout
**Goal**: The reading panel stops reading as marketing summary and becomes an observation of a completed case. Every metric, fact, and attribution is rendered as an instrument readout.

**Depends on**: Phase 0 (clean DOM) — not blocking on Phases 1–2 for scene-side work, but the final aesthetic check depends on the atmosphere being present.

**Requirements**:
- P3-01: Header redesign. Replace the current client/title/meta header with a structured block:
  ```
  [small archive artifact strip, 3–4 thumbnails if available]
  CLIENT: <name>              SECTOR: <vertical>
  REGION: <region>            YEAR: <year>
  PROOF TYPE: <proofType>     IMPACT BAND: <scale>
  ```
  All in DM Mono, low-contrast labels + full-contrast values.
- P3-02: Body structure. Keep the three sections (Challenge / Approach / Observed Impact) but:
  - Section labels in DM Mono uppercase, teal.
  - Body text in Noto Sans 400 but compressed — aim for 40–80 words per section, not marketing prose.
  - Strip any "we did X and delivered Y!" language; rewrite as observations ("The team deployed X. Observed effect: Y.").
- P3-03: Impact section. Replace current metric cards with DM Mono readout grid:
  ```
  CONVERSION    +47%      OBSERVED Q3 2025
  ARPU          +18%      OBSERVED Q4 2025
  ACTIVATION    +3x       OBSERVED FIRST WEEK
  ```
  Teal = measured/observed values. No celebratory typography; no big bold numbers.
- P3-04: Archive artifacts — DEFERRED. Current `cases.json` has no imagery field (`src/data/types.ts:CaseStudy`). See Q4. If Mo approves content-sourcing project, this requirement activates; otherwise v3.2 ships without imagery and the reading panel is pure typography + tokens.
- P3-05: Terminal action in panel. `ADD TO READING LIST` button in DM Mono, gold border at full opacity, teal fill on hover. Renames from the current "Add to Shortlist" if that label exists.
- P3-06: The Fraunces italic opsz 144 moment. If the panel has any headline (e.g., case title at panel top), render in Fraunces italic opsz 144 per `rejections/loading-fonts-you-dont-use.md` — the font is already loaded, it should be deployed.

**Success Criteria**:
1. The reading panel reads as "observation of a case that happened" rather than "marketing summary."
2. Every metric appears as a DM Mono readout, not as a big bold number with a celebratory label.
3. Fraunces italic appears exactly where it belongs (case title or one evidentiary heading) — not sprinkled decoratively.
4. Empty/missing imagery data does not break the layout.
5. The `ADD TO READING LIST` button is the clear primary action in the panel.

**Plans**: 3 expected (header + imagery, body restructuring, metric readout grid + button).

---

### Phase 4: The Reading List, Review Mode, and Comparison Mode
**Goal**: The Reading List becomes a persistent, returnable staging area for the internal user's ongoing study. Two distinct study surfaces open from it: Review Mode (sequential, immersive) and Comparison Mode (simultaneous, spatial — adapted from gather).

**Depends on**: Phase 3 (reading panel drives selection) and Phase 0 (phyllotaxis code isolated).

**Requirements**:

**Reading list itself:**
- P4-01: Rename throughout. "Shortlist" → "Reading List" in all UI strings. Internal function names and data-store APIs can remain `shortlistStore` (no breaking refactor needed) but user-visible strings change.
- P4-02: Track redesign. The bottom strip (`#track-zone` → `ShortlistTrack`) shows:
  - **Empty state**: `No readings staged. Add cases from the panel — your list persists across sessions.` DM Mono.
  - **Populated state**: horizontal row of reading cards. Each card: client name, sector, 1 key metric, timestamp ("added 2d ago"), small X to remove. DM Mono register. Gold border at ~0.4 opacity.
  - **Count indicator** on the left: `N READINGS`.
  - **Actions** on the right: `REVIEW` button (always active at ≥1), `COMPARE` button (activates at ≥3).
- P4-03: Star flight animation. When a case is added, the star visibly leaves its orbital position and flies to the track (~700ms, eased). A ghost (dimmed star at original position) remains. Clicking the ghost returns the star to orbit and removes from reading list. Return is ~900ms (20% slower per PROJECT.md decision).

**localStorage persistence:**
- P4-04: Reading list survives reloads. Schema: `{ caseIds: string[], addedAt: Record<string, timestamp> }` stored under key `cosmo5.readingList.v1`.
- P4-05: Query history persistence. Last 5 distinct queries stored under `cosmo5.queryHistory.v1`. Surface as clickable chips below the query input (Phase 2 integration — requirement added here because the store wires up here).
- P4-06: Recently-viewed cases (Phase 6 integration hook, store API defined here). Last 10 case IDs opened in reading panel, stored under `cosmo5.recentlyViewed.v1`.
- P4-07: Welcome-back recognition. On land, if reading list is non-empty, a quiet readout appears below the query input: `Welcome back. N readings in your list, last added X ago.` DM Mono.

**Review Mode (sequential immersion):**
- P4-08: Trigger from `REVIEW` button on the track, or click any reading-list card. Opens a full-viewport surface that overlays the observatory.
- P4-09: Layout: one case fills the viewport. Full instrument-readout rendering (not the side-panel version — a more generous layout for immersive reading). Client logo and key visual are prominent. Metrics are the centerpiece.
- P4-10: Navigation: arrow keys advance through the reading list. Progress indicator at top (e.g., `CASE 2 OF 5`). Esc or a CLOSE action returns to observatory with list intact.
- P4-11: Remove-from-list control present within Review Mode (user realizes a case doesn't fit, drops it without leaving the mode).

**Comparison Mode (adapted gather — simultaneous spatial comparison):**
- P4-12: Trigger from `COMPARE` button on the track. Activates only at ≥3 readings (below that, Review Mode suffices).
- P4-13: Animation: staged stars fly from the bottom track into a phyllotaxis formation at the center of the observatory (~900ms). All other stars dim heavily (~0.08 opacity — they become atmospheric noise). Formation geometry adapts to N (3–12 stars is the realistic range; phyllotaxis sqrt-radius spacing handles this gracefully).
- P4-14: Gathered stars are full-size, labeled with client name in DM Mono, positioned at readable spacing. Hover any gathered star to open its reading panel without leaving Comparison Mode (the panel slides in, the formation remains).
- P4-15: While in Comparison Mode, the query bar, filter drawer, and ring-switcher are hidden. Only the reading list track (compressed) and an EXIT COMPARISON control are visible.
- P4-16: Exit: EXIT COMPARISON or Esc returns gathered stars to the reading list track (reverse animation, ~700ms). Observatory returns to prior state (same focus, same query).
- P4-17: Visual distinction from focus mode. Focus mode = camera rotation + rings. Comparison Mode = star translation to formation + heavy field dimming. These must read as different operations. Copy and visual cues make the distinction clear.

**Success Criteria**:
1. Adding cases to the reading list persists across page reload, across browser restart, across tab close. Clearing browser data clears the list (no server).
2. Welcome-back readout appears on return visit when list is non-empty.
3. Review Mode paginates cleanly through 1–20 cases; navigation is smooth, Esc exits, list is intact after exit.
4. Comparison Mode activates only at ≥3 readings; below that, the button is visibly disabled with explanatory tooltip ("Add 3+ readings to compare").
5. Comparison Mode's phyllotaxis formation is visually distinct from focus mode. A user who has experienced both can say which is which.
6. Query history chips surface the user's recent queries and a click re-runs the query.
7. Star flight animations (add, return, gather, ungather) respect `prefers-reduced-motion` (instant state transitions) and do not freeze under rapid interaction.
8. Reading List vocabulary is consistent throughout (no leftover "Shortlist" strings in UI).

**Plans**: 6 expected (rename + track redesign + star flight, localStorage persistence + welcome-back + history, Review Mode surface, Comparison Mode adaptation of phyllotaxis, Comparison Mode hover-to-panel + exit, visual-distinction polish between focus and comparison).

---

### Phase 5: Hero Collapse + Land State
**Goal**: The land state is the field, not a banner. Remove the hero block and stats strip. The field + query bar + corner wordmark are the only on-land UI. Retain the 2026-04-12 direction-note intent for a product statement by using the query placeholder as the statement.

**Depends on**: Phases 1–2 (atmosphere + query must exist before hero is removed).

**Requirements**:
- P5-01: Remove `#hero` block from `index.html`. Remove `.hero` CSS.
- P5-02: Remove `#stats` strip from `index.html`. Remove `.stats` CSS.
- P5-03: Remove `animateCount` boot-time wiring in `main.ts` (no longer needed).
- P5-04: Verify the corner wordmark (from Phase 1) is adequate as brand presence. If not, propose a minimal alternative — e.g., a small bottom-right readout `CATALOG: 116 CASES / 23 MARKETS / 9 SERVICES / 2020–2026` in DM Mono, treating the stats as ambient instrument readout rather than marketing claim.
- P5-05: Verify land state through a fresh-prospect test (Mo or external). The prospect should see the field, understand it as an observatory, and know to engage the query input within 10 seconds.

**Success Criteria**:
1. `index.html` has no `#hero` or `#stats` elements. `style.css` has no `.hero` or `.stats` rules.
2. First-paint shows the field + query + corner wordmark. No marketing banner.
3. A fresh prospect describes the product as "an observatory / atlas / explorer," not as "a landing page with a 3D decoration."
4. All v3.1 tests affected by the removal are updated (not deleted) with new expectations.

**Plans**: 2 expected (DOM + CSS removal, optional ambient readout + testing).

---

### Phase 6: Edge States and Full Coverage
**Goal**: Every path through the app has a designed state. No raw error messages. No frozen transitions. Narrow-viewport has a minimum-viable fallback.

**Depends on**: Phases 0–5 (all happy paths exist first).

**Requirements**:
- P6-01: Empty query state. When query input is empty, the field shows all stars (current behavior). A gentle prompt below the input: `Or explore the full catalog — click a cluster to enter.`
- P6-02: No-matches state. When query yields zero matches, field dims entirely (all stars to ~0.08 opacity). Below the input: `No observations match 'X'. Try broader terms: Y, Z, W` where Y/Z/W are suggestions from the nearest-match dimension (hint table falls back to nearest keyword).
- P6-03: Error state: `cases.json` fails to load. Calibration sequence completes then freezes at: `CATALOG / CONNECTION LOST [RETRY]` in DM Mono, retry button present. `console.error` logs technical detail.
- P6-04: Mid-transition interrupt. Click during T1 or T5 camera transition. Behavior: GSAP timelines chain — current transition completes to its end state, then the new action starts. Never freeze, never flash-cut.
- P6-05: `prefers-reduced-motion` final audit. Verify all new v3.2 animations respect the gate. Add any missing gates.
- P6-06: Keyboard completeness. Verify: Tab reaches every interactive element in a logical order. Arrow keys work in all states. Esc consistently steps back. Every interactive element has focus styling.
- P6-07: ARIA completeness. Verify labels on all interactive elements. `aria-live` regions for query readout and track count.
- P6-08: Narrow-viewport behavior. At <768px width: show a minimal `This observatory is desktop-only — please open on a larger screen.` message in DM Mono over the field. The 3D scene still renders ambiently behind. No interactive mobile fallback is built (mobile is out of scope per `PROJECT.md`).

**Success Criteria**:
1. Every state in the state machine has a designed visual representation. No raw `undefined` or placeholder strings.
2. Killing network during first paint produces a designed error state, not a broken page.
3. Rapid clicking during transitions never produces a frozen or flickering state.
4. At narrow viewport, the user sees a designed "desktop-only" message — not a broken layout.
5. A screen-reader user can complete the 60-second flow (tested with VoiceOver or NVDA).

**Plans**: 4 expected (empty/no-match/error states, transition interrupts, narrow-viewport fallback, motion + keyboard + aria audit).

---

### Phase 7: Ship
**Goal**: The experience is verified end-to-end against the vision. Regressions are fixed. The build ships.

**Depends on**: Phases 0–6.

**Requirements**:
- P7-01: Full flow verification. Mo or an external prospect tester opens a fresh browser, completes the 60-second flow (land → query → focus → read → add 3 to reading list → compile → share). Each step timed. Total must be ≤90 seconds for a first-time user (60s target for a practiced user).
- P7-02: Visual regression check against v3.1. The ambient scene (nebula, stars, glow sprites) must not have degraded from v3.1's visual warmth work.
- P7-03: Accessibility final pass. WCAG 2.1 Level AA check: no maximum-scale, prefers-reduced-motion respected, keyboard complete, ARIA labelled, contrast ratios verified.
- P7-04: Build + test + performance. `npm run build` clean. All tests pass. Lighthouse performance score measured; target: >80 on desktop. Bundle size does not exceed 800KB gzipped JS (up from v3.1's ~180KB — we're adding ~620KB headroom for new UI, but should be much less).
- P7-05: OG meta + social tags (per `design/reviews/cosmo5-case-explorer/2026-04-11-upgrade-plan.md` P1-C). OG image is a still of the observatory with a few cases visible. Title + description + image.
- P7-06: Deploy to Vercel preview. Mo reviews visually. Approval gate.
- P7-07: Update STATE.md and card for milestone completion.

**Success Criteria**:
1. A fresh prospect completes the 60-second flow in ≤90 seconds on first attempt.
2. No regressions from v3.1. Visual warmth intact.
3. WCAG 2.1 AA checks pass.
4. Lighthouse performance ≥80 on desktop.
5. Build clean, all tests pass, Vercel preview deployed, Mo approves.

**Plans**: 3 expected (verification + testing, accessibility + build, deploy + OG + approval).

---

## Non-Goals (Explicit Out of Scope)

- **Kunumi conversational AI.** The query input is keyword-based with dimension mapping, not LLM-powered. Future v3.3+ might explore an LLM layer, but v3.2 ships with the keyword mapping.
- **Archive artifacts if imagery is absent.** If `cases.json` does not carry imagery data, Phase 3 skips the artifact strip. Acquiring imagery is a content project, not a design project.
- **Mobile / narrow-viewport interactive support.** Narrow viewport gets a designed "desktop-only" message, not a functional alternative. Building a mobile experience is a separate project. Desktop remains primary per `PROJECT.md`.
- **Analytics / usage tracking.** v3.2 is a prospect-facing tool, not an internal analytics surface. No tracking.
- **Authentication / user accounts.** Reading lists persist only via URL encoding, not account-bound storage.
- **Kunumi-style full refusal of navigation chrome.** The direction note called Kunumi's refusal aggressive; v3.2 retains the Advanced drawer as a power-user fallback. A future iteration could remove the drawer if data shows it's never used.
- **Gather mechanic revival.** Retired in Phase 0. The direction note's "cluster labels graduating from gold to purple on gather" is out of scope.
- **The aesthetic premise sentence.** Mo writes this; it's not a Claude deliverable. Milestone proceeds with the working draft *"A navigable atlas of proof — observed, not advertised"* until Mo revises.
- **GSAP → alternative motion library migration.** GSAP stays.
- **camera-controls library replacement.** v3.1's choice stands.
- **Backend / API / CMS.** cases.json is the single source of truth. No backend.

---

## Done Criteria (Milestone-Level)

v3.2 is done when all of the following are true:

1. **The full flow works end-to-end for an internal user.** Land (with or without returning state) → query → focus → read → stage → Review Mode → Comparison Mode → exit with list intact → return tomorrow with state preserved. Each step feels considered, not serviceable.

2. **The three reference directions are visibly present.**
   - Kunumi: The query bar exists and drives navigation. Filter panel is secondary (Advanced drawer). Archive-as-texture renders real imagery in the reading panel.
   - BYLD: CRT graticule exists as atmospheric substrate. Instrument-calibrating loader runs on first paint (right-sized to actual boot time). Reading panel is structured as monospace readouts. Display typography has analog-precision softness where appropriate.
   - Cosmo5: The astronomical metaphor (stars, orbital rings, nuclei, focus transitions, reading list track, phyllotaxis comparison formation) is the structural logic. The gather mechanic is preserved as Comparison Mode.

3. **No SaaS signals remain.** No Inter-on-everything. No purple-on-dark gradients in UI. No three-equal-card feature grid. No marketing hero block. No celebratory metric typography.

4. **Every state is designed.** Land (cold start), land (welcome-back), query-active, no-matches, focus, reading, reading-list-populated, Review Mode, Comparison Mode, error, narrow-viewport. No raw placeholder states.

5. **Persistence works.** Reading list, query history, and recently-viewed cases survive across sessions via localStorage. Welcome-back state activates on return when applicable.

6. **Accessibility holds.** WCAG 2.1 AA, reduced-motion respected (all new animations gated), keyboard complete, ARIA labelled, screen-reader-tested.

7. **Mo approves the visual state.** Explicit approval before v3.2 is declared shipped. The place must feel like a considered cosmos, not an inventory dashboard.

8. **The codebase is clean.** Orphaned DOM removed (except what's preserved for Comparison Mode). No orphaned CSS (except what's preserved). Build produces zero warnings. All tests pass. New behavior has new tests.

9. **Content integration works.** Imagery commissioned by the parallel content project renders correctly in the reading panel. Cases without imagery render gracefully. `permission: false` cases show `[CONFIDENTIAL]` readout without breaking layout.

---

## Open Questions for Mo

These should be answered before Phase 2 starts, ideally before Phase 1. Phase 0 can proceed without them.

**Q1 — Aesthetic premise sentence.** ✓ ANSWERED 2026-04-14
Premise: *"A cosmos of proof, navigable as an atlas — observed, not advertised."*
Every aesthetic decision in Phases 2–7 must be checkable against this sentence. "Cosmos" names the space. "Navigable as an atlas" names the method. "Observed, not advertised" names the epistemic stance (rules out marketing-summary register, feature-card grids, celebratory metric typography).

**Q2 — Branch strategy.** ✓ ANSWERED 2026-04-14
**phase-1c is canonical. Hybrid approach: consult `draft/v3-starmap` as specification, rewrite in phase-1c — but only if the phase-1c re-implementation improves on or matches what v3-starmap did.**

Import decisions by move:

| v3-starmap contribution | v3.2 decision |
|---|---|
| Query input + keyword→category mapping | **Import as spec.** Extend mapping to phase-1c's 5 dimensions. |
| CRT radial grid substrate | **Import as spec.** Geometry is self-contained. |
| Instrument-calibrating loader | **Import as spec.** Timing + DM Mono sequence port cleanly. |
| Affinity clustering layout | **Skip.** phase-1c's concentric-by-dimension supersedes this. |
| Phyllotaxis gather | **Skip.** Retired (see Q5). |
| Accessibility + token cleanup | **Already present** in phase-1c. |

**Guardrail:** Each plan that imports a v3-starmap move names what v3-starmap did and what phase-1c will do. If the diff shows phase-1c contorting to match v3-starmap's shape, stop and design fresh.

**Q3 — Terminal action.** ✓ ANSWERED 2026-04-14 — REFRAMED

**Primary user changed: internal strategy/sales team, not external prospect.** The Cosmo5 team uses this to build and return to their mental library of proof over multiple sessions. It's a showcase of the agency's accomplishments that the team itself navigates — closer to a museum than a pitch deck.

**No Compile, no Share.** The reading list is personal staging, not an artifact for handoff.

**Terminal action: Review Mode.** A focused reading surface that opens from the reading list. Full-viewport paginated reader, one case at a time as a full instrument-readout page. Arrow keys / click to advance. Exit back to observatory with list intact.

**Persistence via localStorage:**
- Reading list survives reloads (schema: array of case IDs + timestamp added).
- Query history: last 5 queries surface as clickable chips below the input.
- "Welcome back" recognition on return: surface in-progress reading list, time since last activity.

**Loader timing:** honest to actual boot time (400–1200ms typical). DM Mono ticks match real progress events, not theatrical countdown. Register preserved, padding removed.

**What's cut from earlier scoping:**
- 60-second urgency framing
- Compile-to-PDF infrastructure
- URL-hash sharing
- Google Slides integration
- Prospect-facing copy ("A galaxy of proof" tagline)

**What stays (and is now more justified, not less):**
- Full 2026-04-12 design direction (Kunumi + BYLD + Cosmo5)
- All aesthetic commitments (teal/gold, single --ease, instrument-readout typography)
- The standard must stay high — this place should feel like a considered cosmos, not an inventory dashboard. Respect for the work being shown is the aesthetic brief.

**Q4 — Archive-as-texture feasibility.** ✓ ANSWERED 2026-04-14

**Option (b): Commission imagery sourcing as parallel content project.** Full Kunumi archive-as-texture move is in scope.

**Schema extension:**
```ts
interface CaseStudy {
  // ... existing fields
  imagery?: { logo?: string; key_visual?: string };
}
```
Optional — Phase 3 renders gracefully when `imagery` is missing or partial.

**Assets:**
- Logo: 1 per case. SVG preferred, PNG with transparency acceptable. Must work in dark mode.
- Key visual: 1 per case. JPG, longest edge 1200px, ~75% quality.
- Location: `public/case-imagery/<case-slug>/logo.svg|png` and `.../key-visual.jpg`.
- Total bundle: ~116 × 2 = ~20–50 MB (acceptable).

**Use in v3.2:**
- Reading panel (Phase 3): logo inline with CLIENT readout, key visual as atmospheric strip (~0.75 opacity).
- Starmap archive-as-texture (stretch goal — Phase 3 or Phase 6): thumbnails float at low opacity near highlighted stars during query response.

**Permission handling:** cases with `permission: false` suppress imagery and show `[CONFIDENTIAL]` readout. Case remains visible in the catalog; imagery does not.

**Contingencies to resolve with content team:**
1. Named owner on content side (blocker/unblocker reference).
2. Delivery cadence — batched (20/week) vs all-at-once. Batched enables progressive Phase 3 integration.
3. Fallback when imagery cannot be sourced within 2 weeks: case ships without imagery rather than blocking the phase.
4. Format confirmation before Phase 3 plans: SVG + JPG as specified.

**Q5 — Gather retirement.** ✓ ANSWERED 2026-04-14 — ADAPTED

**Gather is NOT retired. It is adapted into Comparison Mode for the reading list.**

The phyllotaxis spatial mechanic is preserved and given a sharper purpose. Triggered from the reading list at ≥3 items, it flies the staged stars into a central phyllotaxis formation, dims everything else, lets the user study the set as a set in one frame.

**Three distinct study actions in the app:**
- **Query + Focus + Ring-highlighting** — organize and investigate the full field (contextual browsing).
- **Review Mode** — sequential deep reading, one case fills viewport (immersion).
- **Comparison Mode (adapted gather)** — simultaneous spatial view of the curated set (comparison at a glance).

Each has a distinct epistemic purpose. They complement rather than compete.

**What Phase 0 does:** removes gather's current wiring (orphaned button, filter-result-gather logic) but PRESERVES the phyllotaxis geometry code and transition logic for Phase 4 to repurpose.

**What Phase 4 does:** Re-wires phyllotaxis code to fire from a reading-list trigger instead of a filter trigger. Designs the formation for variable N (currently optimized for specific cluster size). Writes the exit animation (stars return to reading list track, not to original orbits). Minimum activation threshold: ≥3 cases.

**Why this preserves the direction note's intent:** The note called gather "Cosmo5's proprietary move" because of the phyllotaxis spatial mechanic — stars flying to formation is a distinctive register. What made it distinctive was the spatial behavior, not the specific triggering gesture. Keeping the mechanic, sharpening the gesture (filter-results → curated-set comparison) preserves the distinctive move with clearer purpose.

**Watch-outs:**
- Focus mode and Comparison Mode both reorganize the field. Visual distinction must hold (focus = camera rotation + rings; comparison = star-translation to formation + heavy dimming).
- Adds +1–2 plans to Phase 4 scope.

---

## Sequence

```
Phase 0: Clean substrate
  ↓
Phase 1: Atmosphere (graticule + loader)
  ↓
Phase 2: Query bar + advanced drawer
  ↓
Phase 3: Reading panel as instrument       (parallel with Phase 2 possible after Phase 0)
  ↓
Phase 4: Reading list + compile + share
  ↓
Phase 5: Hero collapse                      (quick, depends on Phases 1–2)
  ↓
Phase 6: Edge states + coverage
  ↓
Phase 7: Ship
```

**Session-estimate note.** No numeric estimate here. v3.1 ran nine phases and took most of a month of focused iteration. v3.2 is scoped similarly but includes a keyword search system, a compile-to-PDF feature, URL encoding, star flight animation, and full accessibility coverage. Better to track per-phase plan completion than to anchor on a total. If Mo wants a release-minimum, Phases 0–4 deliver the core 60-second flow; 5–7 are ship-readiness.

---

*This milestone sequences the direction note from 2026-04-12 into the v3.1 codebase. The engine shipped in v3.1. The experience ships in v3.2.*
