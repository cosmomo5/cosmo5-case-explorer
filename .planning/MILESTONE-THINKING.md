# UI/UX Milestone — Thinking Document

Date: 2026-04-14
Purpose: Scratch-work before writing MILESTONE.md. The milestone doc is the deliverable; this is how it got built.

---

## 1. Return to Purpose

From `PROJECT.md`:
> **A prospect-facing discovery tool that lets you build a pitch deck's worth of proof in 60 seconds.**

Unpack that sentence. Every word is load-bearing:

- **Prospect-facing** — Not an internal tool. Someone outside the firm sees this, possibly without introduction. First impression is the product.
- **Discovery** — Not retrieval. The user does not know which case they want. They know the shape of what they need.
- **Build** — The artifact is not individual cases. It is the set. The user is assembling evidence.
- **Pitch deck's worth of proof** — The output has a job: persuade a specific stakeholder. Proof is not information, it is argument material.
- **60 seconds** — Time-to-value is short. Long flows fail. Either it works fast or it doesn't work.

**What this means for UI/UX:**

The app has three distinct users doing three distinct jobs, and they're all the same person at different moments:

1. **The arriver** — lands on the page, has 5 seconds to decide if this is worth the 60. What they need: the product's purpose legible instantly, and a concrete first action.
2. **The explorer** — knows the business question but doesn't know the inventory. What they need: a way to query intent (not filter attributes), and a field that responds to the query.
3. **The builder** — has found candidates and is assembling. What they need: a comparison surface, a persistence mechanism, and an export pathway.

Current phase-1c handles job 2 partially (filters work) and job 3 partially (shortlist track works). Job 1 is weak (generic hero). The critical 60-second flow — arrive → query → find 3 cases → build shortlist → know what to do with it — has no terminal action. There is no "done."

---

## 2. The Design Principles (Re-read)

From direction note 2026-04-12:

1. **Astronomical metaphor is the foundation.** Stars, constellations, observation. Dark field, bright objects. This stays.
2. **Inquiry, not filtering** (Kunumi). Query-driven navigation. First-person declarative input: "What kind of proof do you need?"
3. **Analog-era precision** (BYLD). CRT grid atmosphere. Motion-blurred display type. Monospace instrument readouts. Precision as historical register, not modernist sharpness.
4. **Inhabited metaphor** (from sensibility canon). If you remove the spatial layer, interaction should break. Not theme, logic.
5. **Teal = observation/measurement.** Semantic color with UI reach. Gold = wayfinding/navigation.
6. **Single `--ease`.** One way things move in this world.
7. **Instrument-panel type contract.** DM Mono for readings/data, Noto 900 for statements, Fraunces italic at opsz 144 for evidentiary moments.

The missing premise sentence. The upgrade plan gated Priority 2 on Mo writing it. He hasn't. Working draft (to be confirmed or rejected):

> **"A navigable atlas of proof — observed, not advertised."**

This names the three distinguishing moves: spatial (atlas/navigable), evidentiary (proof), epistemic (observed not advertised — which kills the "three feature cards" instinct and the marketing-summary register).

---

## 3. What We Have — The Honest Reading

The audit report gave ratings. The important finding is not individual ratings — it's the shape of the problem.

**phase-1c is a solid spatial engine with a generic skin.**

The engine works: raycasting, orbital mechanics, focus transitions, state machine, shortlist store, 190 tests. Star rendering after Phase 6.5 has warmth (glow sprites, twinkle, blue-indigo nebula).

The skin is not the engine's friend:
- Hero+stats = generic B2B marketing site intro, sits on top of the 3D scene like a banner ad.
- Filter panel = conventional SaaS sidebar with chips and checkboxes, vocabulary ("Filter + Arrange," "Year / Scope / Service") borrowed from generic product catalogs.
- Reading panel = instrument readout at the top + marketing-summary body. Two registers mashed together.
- Shortlist track = raw chip strip with no affordance explaining purpose, no export/action endpoint.
- Controls/breadcrumb/search widgets = present but orphaned from any unifying visual language.
- First-paint = loads and the hero appears. No calibration, no announcement, no personality.
- ~45 orphaned DOM nodes from v1/v2 left in index.html — gather stage, country rail, old panel/scrim, old tooltip. Dead weight.

**The branch divergence is the elephant.** `draft/v3-starmap` has already implemented significant direction-note moves — Kunumi query input, affinity clustering, BYLD CRT grid, instrument-calibrating loader. Those 13 commits are not in phase-1c. phase-1c's 87 commits of orbital-mechanics + shortlist work are not in v3-starmap. They were parallel efforts that never merged.

**Decision this milestone must make:** Is the v3-starmap direction canonical, or is phase-1c's model the product? The direction note from 2026-04-12 implies v3-starmap's direction is the target. But phase-1c is what Mo has been iterating on recently (visual warmth, accessibility audit, 190 tests landed this week). He tested phase-1c visually.

My resolution: **phase-1c is the canonical codebase. The direction note's moves migrate INTO phase-1c.** Reasons:
- phase-1c has the richer interaction model (concentric dimensions, ring highlighting, split canvas + shortlist track) that the direction note didn't address.
- 190 tests of scaffolding on phase-1c would be discarded if we returned to v3-starmap.
- The direction note's moves (query input, CRT grid, instrument loader, archive-as-texture, extended DM Mono readouts) are additive — they don't require phase-1c's orbital logic to be torn out. They replace the filter panel, add atmospheric texture, and elevate the reading panel.

This is the blocking question the advisor named. I'm resolving it in the milestone and surfacing it for Mo's correction.

---

## 4. What "Substantial Improvement" Means

Mo asked me to think about what improvement looks like at every level. I'll organize by layer:

### Layer 1: The Experience Vision

What does the 60-second prospect flow look and feel like when this milestone is done?

**Second 0–3:** Dark field. A CRT-like graticule faintly glows. "COSMO5 / OBSERVATORY ONLINE" calibrates in DM Mono. The space begins to populate with stars and orbital rings. The hero does not say "A galaxy of proof." It says "What kind of proof do you need?" — a conversational placeholder in a single central input.

**Second 3–8:** Prospect types "fintech growth" or "luxury ecommerce launch" or "retention in SaaS." The field responds — non-matching stars dim, matching stars brighten, orbital rings reshape around the responding cluster. No page load. No transition to "search results." The field reorganizes in place.

**Second 8–30:** Prospect clicks the largest responding cluster. Camera rotates face-on (T1). The reading panel opens on the right — but the panel is not a marketing summary. It's an instrument readout: client, sector, metric readouts in monospace, small archive artifacts (the real campaign imagery, floating small) in the header, the body is a structured reading ("Challenge / Approach / Observed Impact") in a precision register, not prose.

**Second 30–50:** Prospect clicks "Add to Reading List" (not "Add to Shortlist" — that's SaaS language). The star leaves the orbit, flies to the bottom track. The orbit shows the gap (ghost position). Prospect clicks another star. Another addition. The track builds. Arrow keys move between selections.

**Second 50–60:** Prospect clicks "Compile Readings" (or similar — the terminal action). A printable/exportable view is generated — or a sharable link, or a compiled brief. This is the endpoint. The 60 seconds produced an artifact.

That is the vision. The current state reaches ~second 45 before the flow breaks. The last 15 seconds (the artifact production) do not exist yet.

### Layer 2: Information Architecture

Right now the app has too many surface zones competing:
- Hero (branded marketing)
- Stats (corporate metrics display)
- Breadcrumb (navigation chrome)
- Filter panel (SaaS sidebar)
- Focus hint (status indicator)
- Cosmo controls (settings cluster)
- Search widgets (two of them — top-right + filter interior)
- Reading panel (case detail)
- Shortlist track (selection strip)
- Home button (reset)
- Star labels (dynamic overlay)

Eleven UI zones. A prospect who lands here has no idea which is primary.

Substantial improvement = **collapse to three zones plus one persistent element:**

1. **The Field** — the 3D observatory. 100% of the viewport. No marketing chrome on top. No hero banner. The starmap IS the first impression.
2. **The Query Bar** — a single central input, present at all times, context-shifting. On land: "What kind of proof do you need?" On focus: "Refine within [cluster name]". During reading: minimized to a corner. This replaces filter panel + search widgets + breadcrumb.
3. **The Reading Track** — the bottom strip, persistent but collapsed when empty, expanded when active. Shows current selection count, expands to show track + compile action when populated. This replaces shortlist track + compile endpoint.
4. **(Persistent) The Reading Panel** — slides from right when a case is opened, slides out when closed. Command-bridge layout per PROJECT.md decisions.

That's it. Four elements. Everything else is atmosphere (nebula, grid, starfield) or content (stars, orbit rings, star labels).

### Layer 3: Interaction Model

Current model is mode-switched: global view → focused view → reading state. Each mode exposes different chrome. This creates discontinuity — the user has to re-learn the UI each time mode changes.

Improvement: **continuous spatial interaction.** The query bar and reading track persist across all modes. Only the 3D field changes state. The user moves through states by acting on the field (typing a query, clicking a star, clicking "Compile") — not by navigating chrome.

State transitions should be:
- **Query → Response** (field rearranges in ~600ms, single ease).
- **Click nucleus → Focus** (camera moves, rings appear, field dims non-focused — already works in phase-1c).
- **Click star → Read** (panel opens from right, star glows, orbit pauses — already works).
- **Click "Read Next" / arrow → Next** (panel content swaps, star pulse) — already works.
- **Click "Add to readings" → Track update** (star flies to track, ghost remains) — currently the store updates but the star animation is missing.
- **Click "Compile" → Brief generation** (not implemented).

### Layer 4: Visual System

Current token system works at the core (teal/gold/no-purple, single `--ease`, three typefaces with clear roles). But the surface layer betrays it:

- **Filter panel chips** look like every SaaS product. They should look like instrument readings — DM Mono, gold border, pressed-state fill, no rounded-pill hover glow.
- **Stats strip** (Case files: 116, Territories: 23, etc.) should either disappear or become part of the observatory ambient (small mono readout in the margin, like a telescope's coordinate display).
- **Hero banner** ("A galaxy of proof") is marketing register. Either remove it entirely (field-only) or compress it to a single moment: a small mono "cosmo5 observatory" mark that ticks on during the calibration sequence and stays as a corner mark.
- **Reading panel body** is prose. Should be structured readouts with explicit sections, measured units, sourcing. If the copy is "We grew conversion 45%" — the panel should display it as `CONVERSION / +45% / OBSERVED Q3 2025` in DM Mono, not as a sentence.
- **Nebula after Phase 6.5** is blue-indigo. Combined with the CRT grid (to be added), these create the atmospheric substrate. The grid should be very faint — if it draws attention, it's too strong.
- **The word "proof"** in the H1 — if the H1 stays — should be Fraunces italic at opsz 144. Sharp letterform distinction, not color swap. Or the H1 goes entirely.

### Layer 5: Motion

Motion is close to right. The single `--ease` is in place. What's missing:

- **Motion as load-bearing.** Current transitions are decorative (things fade/slide). They should be structural (the field responds to query, the orbit shows gaps, the camera rotates to new focus). Each motion should have an epistemic role.
- **Entering the observatory.** First paint currently goes: blank → hero + stars. Should be: blank → calibration sequence (2 seconds, DM Mono ticking lines) → field reveal (stars pop in like instruments coming online). This establishes register before interaction begins.
- **The query-response transition.** When a query is typed, stars dim/brighten in waves rather than instantly. The response should feel measured, not instantaneous. ~600ms of propagation through the field.
- **Returns slower than entries** (per PROJECT.md decision). Expansion feels larger than compression. 20% slower on unfocus, on panel close, on remove-from-readings.

### Layer 6: States Beyond the Happy Path

Currently undesigned:
- **Empty query** (arrival, nothing typed). Currently the whole starmap is visible. Acceptable, but should have a gentle prompt: "Type your business question. Or explore the full library."
- **No matches for query.** Currently unknown behavior (may not be tested). Need a state: field dims entirely, center shows "No observations match. Try broader terms: [alternatives from nearest matches]."
- **Reading list empty.** Current state says "No cases shortlisted." Should read like: "No readings yet. Stars you add will appear here."
- **Reading list full enough to compile.** Threshold TBD (3? 5?). At threshold, the "Compile Readings" action should activate visually — quiet state → confident state.
- **Error: cases.json fails to load.** Currently no handling. Need a state: calibration sequence continues, then fails — "CATALOG / CONNECTION_LOST" in DM Mono + retry.
- **Mid-motion interrupts.** Click during a transition. Should never freeze. Should either complete the transition then apply the next action, or cancel gracefully.
- **Narrow viewport.** Desktop-first tool per PROJECT.md, but mobile visits happen (prospects check from phones). Need a minimum-viable mobile state — likely "tap a star to read, no 3D nav" fallback.

### Layer 7: The Terminal Action

This is the missing 15 seconds of the 60-second flow.

A prospect who has assembled 3–5 case readings should be able to:

**Option A — Compile to Brief.** A "Compile Readings" button generates a single-page, print-friendly, exportable artifact containing the selected cases with their instrument readouts side by side. This becomes the "pitch deck's worth of proof." The prospect screenshots it or prints to PDF. Low-fi, instant.

**Option B — Share as Link.** Generate a URL that encodes the selected readings. The prospect pastes this into Slack / email / their brief. Viewer sees the same observatory with exactly those cases pre-selected.

**Option C — Export to Notion / Google Doc.** Higher-fi, integrates with external tools. Probably out of scope for this milestone.

Recommendation: **A + B, not C.** Option A is the artifact; Option B is the handoff. Both are achievable client-side (print CSS + URL hash encoding). Both close the 60-second loop.

---

## 5. What Must Not Change

Per PROJECT.md and the direction note, these are load-bearing:

- The concentric orbital model (stars on rings around nuclei) — Phase 6 work, already in.
- The split canvas (constellation zone + shortlist track) — Phase 6 work.
- The camera-based flattening transition (T1) — Phase 3 work.
- Teal semantic reach. Single --ease. Five z-layers.
- Keyboard accessibility (arrow keys in reading, Esc to exit).
- The prefers-reduced-motion gates.
- The 190 existing tests must pass or be updated with the new behavior, not deleted.

---

## 6. Phase Structure (Draft)

**How to sequence a substantial improvement** without breaking what works.

Critical path insight: **taste direction must precede engineering for each surface**. Applying the 7-stage pipeline from `.claude/rules/workflow.md`, but shaped to this project:

### Phase 1: Strip and Establish the Atmosphere
Remove the 45 orphaned DOM nodes (dead v1/v2 code). Add the CRT graticule substrate. Implement the instrument-calibrating loader (DM Mono sequence, 2–3 seconds). Establish the atmospheric register before touching any component.
Done criterion: First paint feels like an observatory coming online, not a web app loading.

### Phase 2: The Query Bar (replaces filter panel)
Implement the central conversational input. Wire it to the filter system — keyword → dimension mapping, same result behavior, different interaction surface. Keep the filter panel as a progressive-disclosure fallback (collapsible drawer, tagged "Advanced: browse by attribute") for users who want explicit filtering.
Done criterion: A first-time prospect can find fintech cases by typing "fintech growth" and never opening a filter panel.

### Phase 3: The Reading Panel Redesign
Rework the reading panel body from prose to structured instrument readout. Every metric becomes a DM Mono readout cell. Challenge / Approach / Observed Impact sections stay but are rendered as telegraphic, tighter text. Add archive artifacts (real campaign imagery, if available) as a small header strip.
Done criterion: The reading panel reads as "observation of a completed case," not as "marketing summary of what we did."

### Phase 4: The Reading Track Completion
Rename "Shortlist" to "Reading List" across UI. Improve empty state. Add the "Compile Readings" terminal action — activates at ≥2 readings. Implement the compile output (print-friendly single-page view with all selected readings as instrument panels).
Done criterion: A prospect can build a reading list of 3 cases and produce a printable/shareable artifact.

### Phase 5: The Hero Collapse
Remove the hero banner block (`#hero`, `#stats` strip, "A galaxy of proof" H1). Replace with the field + query bar as the only on-land surface. The wordmark "COSMO5" stays, but compressed to a small corner mark in DM Mono. If a product statement is needed, it appears as the query placeholder: "What kind of proof do you need?"
Done criterion: Arrival looks like an observatory, not a landing page.

### Phase 6: State Coverage and Edge Cases
Design the empty-query state, no-matches state, error states (cases.json failure), mid-transition interrupts, narrow viewport fallback. Add the Fraunces italic opsz 144 for any remaining evidentiary typography moments (e.g., "proof" in reading panel headers if used).
Done criterion: Every path through the app has a designed state. No raw error messages, no flickers, no frozen transitions.

### Phase 7: Share & Compile Output
Implement Option B — URL-encoded shareable link. Test the full 60-second flow with a fresh pair of eyes (Mo or external). Verify against done criteria.
Done criterion: Mo opens a fresh session, types a query, builds a reading list, compiles it, shares a link, verifies the link renders the correct observatory state.

---

## 7. Risks and Open Questions

**Risk: merging direction moves from v3-starmap.** Cherry-picking commits from a branch that diverged 87+ commits ago is risky. Safer: re-implement the direction moves in phase-1c fresh, consulting v3-starmap as a reference. The direction moves are small enough to rebuild (query input, CRT grid, loader sequence).

**Risk: overscoping.** Each phase has a clear done criterion but there's a lot here. The realistic expectation is 2–4 sessions per phase (4 weeks of focused work at current cadence). Phases 1–4 are the core 60-second flow; Phases 5–7 are polish and edge coverage. If time is short, 1–4 is the release-minimum.

**Open question for Mo: aesthetic premise sentence.** I drafted one ("A navigable atlas of proof — observed, not advertised."). Mo writes the real one. This is the only blocker that should wait for Mo before Phase 2 starts.

**Open question for Mo: terminal action.** Is Option A (compile to brief) + Option B (share link) the right endpoint? Or should the endpoint be "email this reading list to a prospect" (higher friction, but directly actionable)?

**Open question for Mo: gather mechanic.** The direction note called gather "Cosmo5's proprietary move." phase-1c replaced it with concentric orbitals + ring highlighting + shortlist track. These cover overlapping user intents. Should gather be removed entirely from the codebase (cleanup) or revived as a different interaction (perhaps a "cluster view" triggered by a specific user action)? Recommendation: remove. Ring highlighting + reading list supersede it.

---

## 8. Next Action

Write `MILESTONE.md` from this thinking. Structure it as: Why → Vision → Principles → Phases → Non-goals → Done criteria → Open questions. Keep it ~400–600 lines. Make it substantial enough for a subagent to plan each phase from it.
