# Roadmap: Case Study Explorer

## Active Milestone: v3.4 — Dimensional Navigation

**Aesthetic premise:** *"A cosmos of proof, observed."* Redesigned around an inquiry sentence as gravitational anchor, with three-state navigation model (Entry → State 1 Explore → State 2 Constellation Focus).

**Goal:** Full visual redesign against handoff spec at `~/Desktop/Case Study Explorer - design_handoff/`. Three-state interactive model, solar organize-by layout, minimap + peripheral constellations, compact staging dock, editorial case cards, warm atmosphere. 13 phases.

**Source:** `.planning/MILESTONE-v3.4.md` (authoritative phase table, phase roadmap, dependencies)

**Design authority:** `~/Desktop/Case Study Explorer - design_handoff/README.md` (visual, layout, copy, interaction model)

**Primary user:** Internal Cosmo5 strategy/sales team.

### v3.4 Phases

**Phase Numbering:**
- Integer phases (1–13): Planned milestone work
- No decimal phases expected

#### Phase 1: Entry screen

**Goal:** Atmospheric arrival point before State 1. Reframe `planetary-gather.ts` as Entry Globe. DOM overlay with handoff copy (eyebrow, headline, body, CTA, telemetry). CTA click → 200ms fade to black → State 1 fades in 600ms. State 1 boots to free float (all 116 cases drift freely, no orbital structure).

**Scope redirect (2026-04-25):** Inquiry sentence dropped from v3.4 entirely (dropped from Phase 1, deferred indefinitely per D-02). Phase 1 = Entry screen only.

**Depends on:** None (fresh phase).

**Context:** `.planning/phases/01-foundation/01-CONTEXT.md`

**Research:** `.planning/phases/01-foundation/01-RESEARCH.md`

**Plans:** 4 plans (3 execute, 1 human-verify)
- [x] 01-01-PLAN.md (2026-04-25) — Create entry-screen.ts module with DOM structure and CTA listener
- [x] 01-02-PLAN.md (2026-04-25) — Add Entry screen CSS (layout, typography, pulsing dot animation)
- [ ] 01-03-PLAN.md — Wire entry-screen.ts into main.ts boot sequence, ENTER_FIELD dispatch, fade choreography
- [ ] 01-04-PLAN.md — Human visual verification (browser UAT)

**Success Criteria:**
1. Entry screen renders on load with exact handoff copy (eyebrow, headline italic "proof", body, CTA, telemetry)
2. CTA pulsing dot animates (disabled on prefers-reduced-motion)
3. CTA click fades Entry overlay 200ms, then State 1 fades in 600ms cubic-bezier
4. State 1 boots to 'global' kind, 'global' mode → all 116 cases drift freely with low-frequency noise
5. No orbital structure, no gathering, no organizing in Phase 1
6. All tests pass (`npm run test` green)
7. Build succeeds (`npm run build` ≤250KB gzipped)
8. No console errors on boot

---

## Previous Milestone: v3.3 — Resolve the Observatory (shipped 2026-04-25)

**Source:** `.planning/MILESTONE-v3.3.md`

**v3.3 closure record:** 5/12 phases shipped + hotfix 20.1:

- [x] **Phase 16: Planetary Overture** (completed 2026-04-19)
- [x] **Phase 17: Star Labels Always-On + Label-Click Nav + Contextual Bottom-Right Panel** (completed 2026-04-19)
- [x] **Phase 18: Unified Left Column** (completed 2026-04-19)
- [x] **Phase 19: Remove Query Input — Filter Panel Only** (completed 2026-04-19)
- [x] **Phase 20: Gather as Staging Action** (completed 2026-04-20)
- [x] **Phase 20.1: Cluster-Label Click Wiring** (hotfix, completed 2026-04-25)
- [~] **Phases 21–27:** Superseded by v3.4 redesign

Key decisions from v3.3 → v3.4 transition:
- Inquiry sentence dropped from v3.4 entirely (D-02 in Phase 1 context)
- All v3.3 remaining phases absorbed into v3.4 phase table
- Branch: `draft` (all v3.4 work continues here)

---

## Previous Milestone: v3.2 — The Observatory Experience (shipped 2026-04-17)

**Source:** `.planning/MILESTONE-v3.2.md`

- [x] **Phase 8: Clean Substrate** (completed 2026-04-14)
- [x] **Phase 9: Atmosphere** (completed 2026-04-16)
- [x] **Phase 10: Query Bar** (completed 2026-04-16)
- [x] **Phase 11: Reading Panel as Instrument** (completed 2026-04-16)
- [x] **Phase 12: Reading List + Review Mode + Comparison Mode** (completed 2026-04-16)
- [x] **Phase 13: Hero Collapse** (completed 2026-04-17)
- [x] **Phase 14: Edge States and Coverage** (completed 2026-04-17)
- [~] **Phase 15: Ship** — Automatable portion complete; P7-01 + P7-06 carried forward to v3.3 Phase 27 (now v3.4 Phase 13)

---

## Completed Milestones

See `.planning/MILESTONES.md` for archived milestone records.

- **v3.1 — Dimensional Explorer** (shipped 2026-04-14, 9 phases 0–7 + 6.5)
