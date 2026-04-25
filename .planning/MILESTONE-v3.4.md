# Milestone v3.4 — Dimensional Navigation

**Status:** Open (2026-04-25)
**Predecessor:** v3.3 closed 5/12 + 20.1 shipped (2026-04-25)
**Design authority:** `~/Desktop/Case Study Explorer - design_handoff/README.md` (visual, layout, copy, interaction model)
**Behavior authority:** `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md` (T1/T5 timing curves, easing — README defers to this on behavior details)

---

## Premise

The handoff at `~/Desktop/Case Study Explorer - design_handoff/` re-frames the entire interaction model around an **inquiry sentence** as the gravitational anchor. This is a fundamental redesign, not a polish pass. It introduces components that do not exist today and supersedes the remaining 7 phases of v3.3.

Three-state model: **Entry → State 1 (Explore) → State 2 (Constellation Focus)**

State 1 unifies "gather" and "organize-by" into a single view with a mode toggle. The inquiry sentence sits at center, always present, composing live from filter state. State 2 shows face-on year rings with editorial case cards, peripheral constellations bleeding in at the edges, a minimap, and a compact staging dock.

---

## README Prereq Answers (locked)

| Question | Answer | Implication |
|---|---|---|
| Warm State 2 atmosphere shader exist? | **No.** `src/style.css:34–42` has cool radial gradients only. `body.constellation` class hook exists. | Phase 9 — CSS-only. Add warm radial-gradient layer keyed on `body.constellation`. No shader needed. |
| Inquiry sentence already implemented? | **No.** Zero hits in `src/`. Phase 18 absorbed the query bar into filter-panel; inquiry is greenfield. | Phase 1 — full new component `src/ui/inquiry-sentence.ts`. |
| Reading panel slide-in or full-takeover? | **Flex-sibling width-transition** (`#reading-panel-slot`, 0→340px, `style.css:65–66`). | Phase 9 — bump 340→380, add `body.reading .scene-container { opacity: 0.4 }`. No rewrite needed. |
| Verticals fixed or data-derived? | **Derived.** `cases.json` has no `vertical` field. `enrich.ts` derives `proofType`+`impactScale` only; vertical is derived at grouping time via `SERVICE_TO_VERTICAL` in `grouping.ts`. Real data: 19 services → 7 verticals (Media, Performance, Commerce, Data & Intelligence, Strategy, GEO, Creative). | Handoff's 7-vertical assumption matches. Confirm `VERTICALS` mapping produces same 7 buckets before Phase 2. |
| Country format? | **Full names** in `cases.json` ("France", "Spain", not "FR", "ES"). Handoff uses ISO codes. 13 countries. | Phase 6 — need a country name→code map for the country chip component (FR/US/ES/IT/UK/DE/JP/AU/CA/CH/HK/AR/NL). |

---

## Critical Files Inventory

### Extend / Rename

| File | Change |
|---|---|
| `src/data/view-state.ts` | Add `'entry'` screen state; rename `'global'` → `'state1'`; add `state1Mode: 'free' \| 'filtering' \| 'gathered' \| 'organized'`; add `organize: { dimension, subDim, layout }` |
| `src/data/types.ts` | `GroupMode` add `'service' \| 'year' \| 'proof'`; add `subDimension` field; add country code map |
| `src/ui/filter-panel.ts` | Rebuild header/footer/copy to handoff spec (left rail 264w, top:84/left:28/bottom:28); add inquiry sentence dependency hook; 5-group accordion; impact slider |
| `src/ui/reading-panel.ts` | Width 340→380; add `body.reading .scene-container { opacity: 0.4 }` |
| `src/scene/scene-state.ts` | Add `'organized'` mode; sub-dimension layering |
| `src/scene/regroup.ts` + `src/scene/orbitals/` | Solar layout — planets on orbital ring around inquiry, size by √count |
| `src/data/enrich.ts` | No change needed to core; confirm 7-vertical mapping produces handoff buckets |

### New (Greenfield)

| File | What |
|---|---|
| `src/ui/inquiry-sentence.ts` | Live-composing sentence: "SHOW ME PROOF OF [X] FOR [Y] IN [Z]". Reads filter state, cross-fades per word (240ms), gold on bound values, italic opacity-35 on placeholders |
| `src/ui/organize-panel.ts` | Right rail — dimension switcher (6 options) + sub-orbit picker + planet/case counter |
| `src/ui/minimap.ts` | Top-right 164×118 panel showing current group position in catalog |
| `src/ui/peripheral-constellations.ts` | 4 edge clusters bleeding in at 38% opacity in State 2 |
| `src/ui/related-groups.ts` | "ALSO EXPLORE" right rail in State 2 — 3 suggested group cards |
| `src/ui/staging-dock.ts` | Compact bottom dock replacing current shortlist-track in State 2; gold dot + wordmark + metric + "PRESENT →" CTA |
| `src/scene/atmosphere.ts` (or CSS only) | Warm radial gradient for `body.constellation` — amber near center, plum mid-radius, fade to black |

### Reuse (Do Not Rebuild)

| Asset | Reuse rationale |
|---|---|
| `src/data/grouping.ts:SERVICE_TO_VERTICAL` | Already maps 19 services to 7 verticals matching handoff |
| `src/data/filter-counts.ts` | Facet counts for left rail accordion |
| `src/animation/transition-choreographer.ts` T1/T5 | Extend for Entry→State 1 (T0: 200ms fade + 600ms ease-in) and confirm State 1→State 2 timing matches handoff 660ms (it does — matches existing T1) |
| `src/data/persistence.ts` | Extend for `state1Mode` + `organize.dimension` localStorage fields |
| `src/scene/planetary-gather.ts` | Entry Globe geometry (already exists as planetary overture — reframe as Entry screen globe) |
| `src/data/enrich.ts` | Derives `proofType`/`impactScale`; same data shape, no change needed for Phase 1–11 |

---

## Phase Roadmap

**Phase 1 scope redirect (2026-04-25):** Inquiry sentence dropped from v3.4 (D-02 in `01-CONTEXT.md`). Phase 1 = Entry screen (formerly Phase 10). Phase 10 slot absorbed into Phase 1; no Phase 10 remains. Context: `phases/01-foundation/01-CONTEXT.md`.

**Design authority:** `~/Desktop/Case Study Explorer - design_handoff/README.md` — authoritative for all layout, copy, interaction model. This is the primary handoff artifact that started the v3.4 reconstruction. Do not lose this reference.

| # | Phase | Surface | Agent | Verify |
|---|---|---|---|---|
| 1 | Entry screen | Reframe `planetary-gather.ts` as Entry Globe. DOM overlay: eyebrow, headline, body, CTA, telemetry plate (exact handoff copy). CTA wires `ENTER_FIELD` → 200ms fade to black → State 1 fades in 600ms. State 1 boots to free float. | Claude | Visual: entry layout matches handoff. CTA click → State 1 transition. |
| 2 | ViewState + State 1 free-float foundation | `src/data/view-state.ts`: `screen: 'entry' \| 'state1' \| 'state2'`, typed events. State 1 free-float mode (all 116 cases drift on noise). Replaces old `SceneMode`. | Claude | Unit: ViewState transitions. Visual: 116 cases drift freely in State 1. |
| 3 | Inquiry sentence component | `src/ui/inquiry-sentence.ts` greenfield. Static reading first (filter → words), then live cross-fade per word (240ms). Center of State 1. | Claude | Unit: filter state → sentence string. Visual: sentence at center, placeholders italic. |
| 4 | Filter panel rebuild to handoff spec | `filter-panel.ts`: left rail 264w, top:84/left:28/bottom:28; 5-group accordion; impact slider; Gather CTA copy. Confirm 7-vertical mapping. | Claude | Unit: accordion expand/collapse, chip toggle, count display. Visual: left-rail layout matches handoff. |
| 5 | Gather animation + gathered mode | Gather click → cases spiral to orbit inquiry (700ms, cubic-bezier(0.65,0,0.35,1)). `state1Mode: 'gathered'`. Non-matching cases fade to 0.08 drift. | Claude | Unit: gathered cases orbit inquiry position. Visual: gravitational pull animation. |
| 6 | Organize panel + solar layout | New `src/ui/organize-panel.ts` (6 dimensions). `regroup.ts` solar layout — planets on ring around inquiry, size √count. `state1Mode: 'organized'`. | Claude | Unit: planet count = group count. Visual: planets orbit inquiry center. |
| 7 | Sub-orbit layering | Year-rings inside each planet (mode 1.E). Wires `organize.subDim`. | Claude | Unit: year-ring count per planet = distinct years in group. Visual: rings inside planets. |
| 8 | State 2 face-on rings + editorial cards | Ring layout (RING_CONFIG: r=150/260/370/460) + card components with country chips (13 countries name→code map). | Claude | Unit: cards render correct client/metric/country. Visual: ring layout, card tether, country chip. |
| 9 | Minimap + peripheral constellations + related groups | `src/ui/minimap.ts`, `src/ui/peripheral-constellations.ts`, `src/ui/related-groups.ts` — glass-morph. | Claude | Visual: minimap haloed, peripherals at 38% opacity, related-groups rail. |
| 10 | Staging dock (compact) + shortlist refactor | New `src/ui/staging-dock.ts` — replaces shortlist-track in State 2. Gold border, wordmark + metric chips, "PRESENT →". | Claude | Unit: pin adds chip to dock. Visual: dock bottom-center, compact. |
| 11 | Warm State 2 atmosphere + reading-panel treatment | CSS-only on `body.constellation`: warm radial gradient (amber→plum→black). Scene dims to 0.4 behind reading panel. Reading panel 340→380px. | Claude | Visual: warm tint in State 2. Scene dims behind panel. |
| 12 | Token + font + opacity audit + removals | Strip drift from handoff token table. Remove v3.3 legacy surfaces. | Kimi | Build clean. No stray colors, no orphaned UI. |
| 13 | Full-flow QA + Vercel preview | 60–90s flow: Entry → filter → gather → organize → drill → pin → present. Playwright Windows-Chrome CDP. | Claude | Playwright: full flow green. Vercel preview approved by Mo. |

---

## Milestone Close Criteria

1. Entry → State 1 → State 2 → reading panel: full flow completes without dead ends
2. Inquiry sentence composes live from filter state
3. Organize-by produces solar layout with correct planet count and sub-orbit layering
4. State 2 shows face-on year rings, editorial cards, minimap, peripheral constellations, staging dock
5. Warm atmosphere visible in State 2; scene dims behind reading panel
6. All 304 tests pass (+ new tests per phase)
7. Build ≤ 250KB gzipped
8. Vercel preview approved by Mo
9. Phase 12 (token audit) + Phase 13 (full-flow QA) both shipped

---

## Carried-Forward Gates from v3.3

- **P7-01 full-flow verification:** 60–90s first-time flow. Closes at Phase 13.
- **P7-06 Vercel preview approval:** Closes at Phase 13 after all phases ship.
- **Phase 18 visual E2E gates (2 items):** Click nucleus → column auto-expand; Home/Escape → column collapse. Deferred from v3.3. May resolve naturally as State 1/2 transitions land in v3.4.

---

## Data Shape Notes

Current `cases.json` structure (relevant fields):
- `services: string[]` — 19 distinct values → maps to 7 verticals via `SERVICE_TO_VERTICAL`
- `countries: string[]` — full names ("France", "Spain") — needs name→code map for Phase 6 chips
- `region: string` — "Europe" | "Americas" | "Asia-Pacific"
- No `vertical`, `proof`, `headline`, `metric`, `metricLabel` top-level fields
- `metrics: Metric[]` → `proofType` derived by `classifyProofType()`, `impactScale` derived by `deriveImpactScale()`

Country name→code map needed for Phase 6 (13 countries):
```
Spain→ES, US→US, France→FR, Germany→DE, Netherlands→NL,
UK→GB, Hong Kong→HK, Switzerland→CH, Italy→IT,
Japan→JP, Australia→AU, Canada→CA, Argentina→AR
```

Handoff's fabricated BEAUTY cases use `wordmark`, `vertical`, `country` (code), `service`, `proof`, `headline`, `metric`, `metricLabel` — these are the *display* fields. Production data derives these from `cases.json` via enrichment + `SERVICE_TO_VERTICAL`. No schema change to `cases.json` needed for Phase 1–11; only the display layer needs the mapping.
