# Phase 1: Entry Screen — Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the Entry screen — the atmospheric arrival point before State 1. This is a scope redirect from the original Phase 1 milestone definition (inquiry sentence component), confirmed during discuss-phase 2026-04-25.

**In scope:**
- Reframe `src/ui/calibration-overture.ts` / Entry globe as the v3.4 Entry state (not a separate new component — reuse `planetary-gather.ts` globe geometry, already shipped in v3.3)
- Editorial DOM overlay: eyebrow, headline, body, CTA, telemetry plate — exact copy from handoff README
- `ENTER OBSERVATORY →` CTA wires `ENTER_FIELD` dispatch on the ViewStateMachine → fade to black 200ms → State 1 fades in 600ms
- State 1 boots to `free float` mode (all 116 cases drift freely, no orbital structure)
- Entry always shows on every session load (no skip-on-return)

**Out of scope:**
- Inquiry sentence component — dropped from v3.4 entirely (see Deferred)
- Multi-value filter slot rendering — deferred
- State 1 sub-state mechanics (filter, gather, organize) — Phase 2+

</domain>

<decisions>
## Implementation Decisions

### Scope redirect
- **D-01:** Phase 1 is the Entry screen, not the inquiry sentence component. The foundation data layer (ViewState, ShortlistStore, ProofType, ImpactScale, StarState, enrichCases) already exists in `src/data/` from v3.2/v3.3 work. The 3 pre-existing plans (01-01, 01-02, 01-03) are stale — replan required.

### Inquiry sentence — dropped
- **D-02:** The inquiry sentence is dropped from v3.4 entirely. The center of State 1 has no composing text element. Cases orbit an invisible center point. The gravitational anchor is the orbital structure itself, not a sentence.

### Entry globe
- **D-03:** Reframe `planetary-gather.ts` (v3.3 planetary overture) as the Entry Globe. It already renders a rotating globe with orbiting case particles. Phase 1 adds the DOM editorial overlay alongside it. Do not rebuild from scratch.

### Entry gate
- **D-04:** Entry screen always shows on every session load. No localStorage skip for returning users. The atmospheric arrival is intentional — "a place you arrive at, not a dashboard you land on."

### Entry copy
- **D-05:** Use handoff README copy verbatim. All copy is final, not placeholder.
  - Eyebrow: `— COSMO5 / OBSERVATORY / 2026.04` — DM Mono 10pt, teal, opacity 0.75, letter-spacing 0.22em
  - Headline: `"A cosmos of proof, observed."` — Fraunces 300 82pt, weight italic on "proof", accent gold `#e8b15a`. "observed." on own line at 48pt, opacity 0.7
  - Body: `"One hundred and sixteen case studies, plotted as an atlas. / Navigate by gravity. Read by instrument."` — DM Mono 12pt, line-height 1.7, rgba(255,255,255,0.55)
  - CTA: `"● ENTER OBSERVATORY →"` — inline-flex, 14×24 padding, 1px gold border, gold pulsing dot, no fill
  - Telemetry plate (bottom-right): `116 cases · 13 markets · 7 verticals · 2014 — 2025` — DM Mono 9pt, opacity 0.32, letter-spacing 0.14em

### Entry → State 1 transition
- **D-06:** Click CTA → dispatch `ENTER_FIELD` on ViewStateMachine → 200ms fade to black → State 1 fades in 600ms cubic-bezier. Use `--ease: cubic-bezier(0.16, 1, 0.3, 1)` per token system.
- **D-07:** State 1 boots to `free float` mode. All 116 cases drift freely with low-frequency noise. No filter active, no orbital structure. Right of the ViewState spec: `kind: 'global'` (existing state kind maps to State 1 free float).

### Claude's Discretion
- Globe positioning (exact cx/cy, radius) — use handoff spec values (`cx: 72%, cy: 58%`, radius 220) but adjust for actual viewport
- Entry hero block layout (left: 80px, max-width 520px, top ~38%) — implement per handoff, adjust if clipping occurs
- Pulsing dot animation on CTA — CSS keyframe, Mo's call at visual review

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design authority
- `~/Desktop/Case Study Explorer - design_handoff/README.md` §"Entry — Arrival at the observatory" — authoritative layout, copy, component spec for Entry screen
- `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md` — T0 transition timing (200ms + 600ms), easing curves

### Existing Entry-related code
- `src/ui/calibration-overture.ts` — current overture/loader overlay; relationship to Entry screen must be clarified before planning (Entry is NOT the calibration overture — calibration is the "observatory initializing" boot sequence; Entry is the pre-entry landing page)
- `src/scene/planetary-gather.ts` or equivalent — v3.3 planetary overture globe geometry; reframe as Entry Globe (D-03)
- `src/data/view-state.ts` — `ENTER_FIELD` event already defined; Entry → State 1 uses this dispatch

### Token reference
- `src/style.css` — `--bg`, `--teal`, `--gold`, `--ease` tokens; font imports (DM Mono, Fraunces, Noto Sans)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/view-state.ts:ENTER_FIELD` — event already typed; Entry CTA dispatches this
- `src/scene/planetary-gather.ts` — rotating globe with orbiting particles; reframe, don't rebuild (D-03)
- `src/ui/calibration-overture.ts` — existing DOM overlay pattern; study for DOM mount/unmount lifecycle before implementing Entry overlay

### Established Patterns
- DOM overlays: appended to a container div, removed on transition (see `calibration-overture.ts`)
- Token system: `--bg`, `--teal`, `--gold`, `--ease` in `src/style.css` — use all of these, no new color values
- Font stack: DM Mono, Fraunces, Noto Sans 900 — all already loaded

### Integration Points
- `src/main.ts` — boot sequence; Entry screen replaces or precedes current default view; needs to be the first thing rendered before `ENTER_FIELD` is dispatched
- ViewStateMachine.dispatch — single entry point for all state transitions

</code_context>

<specifics>
## Specific Ideas

- Handoff says globe spins at 0.6× speed continuously
- Entry has no interactive state beyond hover on CTA (no filter, no reading panel, no sidebar)
- Entry layout: left half for editorial (left: 80px, max-width 520px, top ~38%), right half for globe (cx: 72%, cy: 58%)
- CTA pulsing gold dot: `●` character with CSS animation, gold color

</specifics>

<deferred>
## Deferred Ideas

- **Inquiry sentence component** — dropped from v3.4 entirely per D-02. If revisited, it would be a future milestone concept. The center of State 1 has no composing text.
- **Multi-value filter slot rendering** — not needed since inquiry sentence is dropped
- **Skip Entry on return visits** — explicitly decided against (D-04). Could be a future quality-of-life feature if internal team requests it.
- **Entry state persistence** — no memory of last State 1 sub-state; each session starts fresh at free float (D-07). Persistent session resume is a future feature.

</deferred>

---

*Phase: 01-foundation (redirected → Entry Screen)*
*Context gathered: 2026-04-25*
