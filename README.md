# Case Study Explorer — Project Brief

> Feed this file to an LLM (or a new collaborator) to understand the project end-to-end: what it is, why it exists, how it thinks, where it is, and how to work on it. Canonical source of truth for scoped questions lives in the files pointed to here; this document frames and indexes them.

---

## 1. What It Is (One Paragraph)

A Three.js observatory for 116 agency case studies. A user enters a dark field of stars organized into orbital clusters (nuclei) grouped by vertical, country, or region. They query the field, focus into a constellation, gather shortlisted cases onto a staging track, and read the selected case as an instrument readout on a right-side drawer. The interaction model is a spaceship command bridge: left viewport is the observatory, right drawer is the instrument readout. The product is internal — it is the Cosmo5 strategy and sales team's mental library of proof, made navigable.

## 2. Who It's For

**Primary user: the internal Cosmo5 strategy and sales team.** Multi-session use. A discovery aid for finding relevant precedents before client conversations, and a place worth inhabiting between sessions. Not a pitch deck; closer to a museum study room. The product is a showcase of the agency's own work, and the place that showcases it should earn that role.

This framing (reaffirmed 2026-04-14) is load-bearing. It dictates:
- persistence via localStorage (no accounts, no server)
- no "share" or "export to slides" endpoints
- no analytics or usage tracking
- desktop-only scope with a narrow-viewport message

## 3. Why It Exists (Problem Statement)

Agency case studies accumulate in slide decks, drives, and heads. Retrieval is by memory ("didn't we do something for a beauty client in Brazil?"). The explorer makes the portfolio **spatial and queryable**: every case is a star; verticals and geographies are clusters; relevance surfaces through filtering and gathering rather than scrolling a list. The act of navigating the observatory is itself the act of remembering the agency's body of work.

## 4. Aesthetic Premise

> *"A cosmos of proof, navigable as an atlas — observed, not advertised."*

- **"Cosmos"** names the space.
- **"Navigable as an atlas"** names the method.
- **"Observed, not advertised"** names the epistemic stance — rules out marketing-summary register, feature-card grids, celebratory metric typography.

The visual register is **analog-era precision**: observatory instruments, not SaaS dashboards. Three references inform every design decision:
1. **Cosmo5's own system** — astronomical metaphor, gather verb, teal semantic, single ease
2. **Kunumi Institute** — structural model (inquiry over filtering)
3. **BYLD** — historical register (analog precision, CRT era, instrument panels)

Authoritative direction note: `/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`.

## 5. Design Philosophy (Operating Principles)

These are the rules the product enforces on itself:

1. **Observed, not advertised.** Metrics are readings, not trophies. Case studies render as instrument readouts, not marketing copy. Typography grid cells, not hero billboards.
2. **One ease.** A single `cubic-bezier(0.16, 1, 0.3, 1)` governs every motion. Returns run ~20% slower than entries — expansion feels larger than compression.
3. **No purple.** Tokens are intentional. Teal = confirmed/measured/observed. Gold = navigation/active/wayfinding. Background deep space. One ease. That's the palette.
4. **Stars are content; nucleus is anchor.** The nucleus is a minimal point, not a rendered sphere. 3D comes from rings and depth, not nucleus volume.
5. **Camera-based flattening, not geometry change.** Rings are always circular; the camera rotates to face them. Conceptually honest — state changes are changes in viewpoint, not changes in the world.
6. **No two panels occupy the same spatial region.** Overlap is a layout bug, not a z-index problem. Each surface (filter column, constellation, reading drawer, contextual controls) claims a region.
7. **Persistence is invisible until needed.** Reading list, query history, recently-viewed, welcome-back — all localStorage, all quiet.
8. **Accessibility is a constraint, not a feature.** `prefers-reduced-motion` respected at three gates. No `maximum-scale=1`. Keyboard arrow navigation. WCAG 2.1 AA.

## 6. Product Shape — The Three-State Dimensional Model

```
STATE 1: GLOBAL ORBITAL (3D)
  All constellations visible. Free camera. Stars orbit nuclei on tilted planes.
  Click nucleus (or star label) → T1 → State 2.

STATE 2: CONSTELLATION FOCUS (split canvas)
  ┌───────────────────────────────────┐
  │ Constellation (top ~72%)          │  2D orbital plane, stars still orbit.
  │ Filter → narrows set silently.    │  Gather button → stages filtered set.
  ├─ ─ ─ divider ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
  │ Staging track (bottom ~28%)       │  1D track, shortlisted stars aligned.
  └───────────────────────────────────┘

STATE 3: READING (command bridge)
  ┌────────────────────┬──────────────┐
  │ Scene (compressed) │ Reading      │  Right-side drawer (~380px, v3.3).
  │ Constellation +    │ drawer       │  Instrument readout: region/vertical/year
  │ track              │              │  grid + challenge/approach/results metrics.
  └────────────────────┴──────────────┘
```

Every state has a named transition with a fixed duration and a single easing. Transitions T1–T6 are catalogued in `CLAUDE.md` (project root) under "Transitions."

## 7. Stack & Conventions

| Concern | Library | Version | Notes |
|---|---|---|---|
| 3D scene | Three.js | 0.170 | Reuse module-scope scratch `Vector3`s in hot loops |
| Animation | GSAP | 3.12 | Used for T1–T6 and mid-state motion |
| Data vis | D3 | 7.9 | Layout math, not DOM |
| Bundler | Vite | 6 | `npm run dev`, `npm run build`, `npm run preview` |
| Types | TypeScript | 5 | `tsc` clean is part of every phase gate |
| Tests | Vitest | 2 | Unit tests in `src/**/*.test.ts` |

**Data:** 116 case studies in `cases.json`. Fields: `id`, `client`, `year`, `services[]`, `countries[]`, `region`, `permission`, `title`, `challenge`, `approach`, `metrics[]`, optional `imagery?: { logo, key_visual }`. No backend. No API.

**File map:** see `CLAUDE.md` → "File Map" section. Key state struct is `SceneObjects` in `src/scene/scene-state.ts`.

## 8. Workflow — How Work Gets Done

The project is **GSD-native**: every change routes through `.planning/` and the `/gsd-*` command family.

- **Macro lifecycle** (GSD): spec → discuss → plan → execute → verify → transition → ship → complete-milestone. Artifacts live under `.planning/phases/NN-*/`.
- **In-task discipline** (Superpowers): TDD for business logic, systematic debugging for bugs, verification-before-completion before any claim of done, root-cause-before-fix.
- **Design phases** invoke `/gsd-ui-phase` first to produce a UI-SPEC, then `/gsd-plan-phase` references it.
- **Work categories** are explicit: feature / polish / spike / research / debug. v3.3 is primarily polish; Phases 16 and 19 were spikes. Category determines the loop — polish runs on `DESIGN-STATE.md` + `design-review-apparatus`, not on `/gsd-plan-phase`.
- **Kimi auto-dispatch is suspended inside an active GSD phase** — `gsd-executor` owns execution there. Kimi returns as default for `/gsd-fast`, read-only investigation, and GSD-pending projects.
- **Playwright is launched from Windows only** (CDP attach to Windows Chrome). WSL X11/GPU is unreliable. See `CLAUDE.md` → "Playwright MCP — Direction A" for topology.

## 9. Where We Are Now (as of 2026-04-20)

**Active milestone: v3.3 Resolve the Observatory.**

v3.2 (shipped 2026-04-17) delivered the feature set: query bar, CRT graticule, reading list, Review Mode, Comparison Mode, hero collapse, edge states. The moves are all present; **none of them are resolved in actual use**. v3.3 is a **UI/UX polish pass** — fixing position, hierarchy, consistency, and scene legibility so the 60–90s internal flow lands.

**Not a feature milestone. Polish, removal, repositioning.** Refactoring is deferred to a potential v3.4 "Tighten" — several v3.3 changes are deletions, and refactoring code being removed is wasted work.

**Phase status:**
- Phases 16–20 executed. Phase 20 (Gather as Staging Action) shipped 2026-04-20 on `draft`, 11 commits, verifier 18/18 must-haves, 301/301 tests passing, tsc clean. UAT items deferred until end of milestone per user directive.
- **Next: Phase 21** — Reading Panel → Right-Side Drawer (~380px).
- Remaining: 22 (contextual bottom-right panel), 23 (star motion polish), 24 (theme + token audit), 25 (font + size audit), 26 (removals), 27 (final QA + Vercel ship gate).

**Imagery (P2-D):** Deferred. Schema hook (`imagery?: { logo, key_visual }`) is preserved. Content-side integration waits for the content team to deliver assets.

## 10. What's In Scope / Out of Scope (v3.3)

**In scope for v3.3** (see `.planning/MILESTONE-v3.3.md` for the full breakdown):
- Scene legibility: planetary overture, star labels always-on, label-click nav, star motion polish
- Unified filtering: left-column filter + text input, query-bar/filter-panel merge
- Gather as the staging verb (filter narrows silently, gather stages)
- Reading panel → right-side drawer
- Contextual bottom-right panel per view
- Token, font, and size audits
- Removals (gathered button, depth-per-year, label slider, old shortcuts, unused graticule)
- Final QA + Vercel ship gate

**Out of scope (v3.3):**
- LLM-powered conversational query (keyword mapping is sufficient; deferred to v3.3+)
- Mobile / narrow-viewport interactive support
- Analytics, auth, server-side anything, Google Slides integration, URL-encoded sharing
- Imagery visual treatment (schema preserved, integration waits for content team)
- New product capability — v3.3 adds nothing; it resolves what's there

**Permanent non-goals:**
- Backend, API, CMS — `cases.json` is the single source of truth
- Purple in UI chrome (v3.2 scope; future iterations may reintroduce with intention)
- External-prospect use cases

## 11. Canonical Files

Read these before answering scoped questions:

| File | What it covers |
|---|---|
| `CLAUDE.md` (project root) | Working agreement: stack, dev commands, Playwright, three-state model, transitions, tokens, typography, file map, conventions |
| `PRD.md` | Feature-level PRD — written against v3.1 phase-1c target; historical but still accurate for the core shape |
| `.planning/PROJECT.md` | Current project meta — core value, aesthetic premise, active milestone, requirements (validated/active/completed), constraints, key decisions |
| `.planning/MILESTONE-v3.3.md` | Active milestone plan — premise, refactor posture, scope guardrail, phase breakdown by concern |
| `.planning/ROADMAP.md` | Phase-by-phase roadmap with dependencies |
| `.planning/STATE.md` | Where we are *right now* in the active phase |
| `.planning/DECISIONS.md` | Decision log with rationale (e.g., 2026-04-19 Playwright topology entry) |
| `DESIGN-STATE.md` | Current design direction, active constraints, rejected options, last-reviewed, sign-off log |
| `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md` | Authoritative design spec (supersedes sections of the 04-12 spec) |
| `/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md` | Authoritative design direction note |

## 12. How to Work On This

For any non-trivial change:
1. Read `.planning/STATE.md` — don't reconstruct state from git log.
2. Run `/gsd-progress` — shows current phase, next steps, incomplete work.
3. Name the work category (feature / polish / spike / research / debug). Polish runs on `DESIGN-STATE.md`, not on `/gsd-plan-phase`.
4. For UI phases: `/gsd-ui-phase N` before `/gsd-plan-phase N`.
5. For AI/LLM work: `/gsd-ai-integration-phase N` before planning (when and if reintroduced).
6. Verification is not optional. Every phase ends with `/gsd-verify-phase N`. Every claim of "done" requires a run, not a guess.
7. Update `.planning/STATE.md` and the project card before the session ends.

Never modify code before reading it. Never claim a fix works without running the test or the app. Tests being green is necessary but not sufficient for polish work — Mo signs off against the constraint set in `DESIGN-STATE.md`.

---

*Last updated: 2026-04-20 — written after Phase 20 shipped, before Phase 21 starts.*
