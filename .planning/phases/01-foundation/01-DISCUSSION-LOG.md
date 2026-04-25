# Phase 1: Entry Screen — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 01-foundation (scope redirected to Entry Screen during discussion)
**Areas discussed:** Sentence structure & multi-value, DOM vs Three.js text, Filter-state coupling, Visibility across states

---

## Plans exist gate

| Option | Description | Selected |
|--------|-------------|----------|
| Continue and replan after | Capture context, then replan | ✓ |
| View existing plans | Show plans before deciding | |
| Cancel | Skip discuss-phase | |

**Notes:** Phase had 3 pre-existing plans (ViewState, ProofType/ImpactScale/StarState, Enrich+boot wiring) generated before v3.4 roadmap was finalized. User chose to continue and replan.

---

## Gray area selection

All four gray areas selected:
- Sentence structure & multi-value
- DOM vs Three.js text
- Filter-state coupling
- Visibility across states

---

## Sentence structure & multi-value

| Option | Description | Selected |
|--------|-------------|----------|
| Show all, comma-joined | SHOW ME PROOF OF [REVENUE] FOR [BEAUTY] IN [FRANCE, SPAIN] | |
| Show count instead | IN [2 COUNTRIES] | |
| Show first selected only | First chip only | |
| First value + +N badge | IN [FRANCE +2] | |
| Remove the sentence entirely | Drop inquiry sentence from Phase 1 | ✓ |

**User's choice:** "Let's forget about this aspect/component. too complicated for now, maybe future feature."
**Follow-up question revealed:** User meant to remove the sentence entirely from v3.4, not just defer the multi-value behavior.

---

## Inquiry sentence — scoping question

| Option | Description | Selected |
|--------|-------------|----------|
| Remove from Phase 1 only | Defer to later phase | |
| Remove from v3.4 entirely | Drop the concept | ✓ |

**User's choice:** Drop from v3.4 entirely.
**Notes:** The inquiry sentence was the gravitational anchor of the v3.4 design per the handoff. Dropping it changes State 1's center — cases orbit an invisible point instead.

---

## What sits at State 1 center (without the sentence)

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing — cases orbit invisible point | No visual anchor | ✓ |
| A nucleus/orb | Visual center without text | |
| Re-examine State 1 concept | Stop and rethink | |

**User's choice:** Nothing — invisible orbital center.

---

## Phase 1 scope redirect

| Option | Description | Selected |
|--------|-------------|----------|
| Mark Phase 1 complete — foundation exists | Foundation data layer already done | |
| Redirect to Entry screen | Phase 1 = Entry screen reframe | ✓ |
| Redirect to Filter panel rebuild | Phase 1 = Phase 2 content | |

**Notes:** Foundation data files (ViewState, ShortlistStore, etc.) already exist in src/data/ from prior v3.2/v3.3 work. Plans were stale.

---

## Entry Globe

| Option | Description | Selected |
|--------|-------------|----------|
| Reframe planetary-gather.ts as Entry Globe | Reuse existing 3D asset | ✓ |
| Build new Entry globe from scratch | Full control, no conflicts | |
| CSS-only entry — no Three.js globe | Simpler, loses atmosphere | |

**User's choice:** Reframe existing globe.

---

## Entry gate (first-time vs return visits)

| Option | Description | Selected |
|--------|-------------|----------|
| Always show Entry on load | Every session starts at Entry | ✓ |
| Skip Entry on return visits | localStorage flag to skip | |
| You decide | Claude picks | |

**User's choice:** Always show Entry.

---

## Entry copy

| Option | Description | Selected |
|--------|-------------|----------|
| Final — use exactly as specced in handoff | Implement verbatim | ✓ |
| Placeholder — revise later | Build structure, copy TBD | |
| You decide | Claude flags awkward copy | |

**User's choice:** Handoff copy is final.

---

## Entry → State 1 default sub-state

| Option | Description | Selected |
|--------|-------------|----------|
| Free float — all 116 cases drift freely | Matches handoff 1.A | ✓ |
| Same as last session (persistent) | Resume where user left off | |
| You decide | Claude picks | |

**User's choice:** Free float.

---

## Claude's Discretion

- Globe positioning (cx/cy, radius) — adjust for actual viewport
- Entry hero block layout — per handoff, adjust if clipping occurs
- CTA pulsing dot animation — CSS keyframe, Mo reviews visually

## Deferred Ideas

- Inquiry sentence — dropped from v3.4 entirely
- Multi-value filter slot rendering — not needed
- Skip Entry on return visits — future quality-of-life
- Session state persistence — future feature
