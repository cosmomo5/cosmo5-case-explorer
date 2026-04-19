# Design State: case-study-explorer

## Current direction

A considered internal place for Cosmo5's strategy/sales team — a museum's study room, not a pitch deck. Analog-era precision: observatory instruments, CRT graticules, measured typography. Three canon references load the register:

- **Cosmo5's own system** — astronomical metaphor, `gather` verb, teal = observed, single ease, no purple
- **Kunumi Institute** (`design/canon/web-apps/kunumi-institute.md`) — structural model: inquiry over filtering; the interface frames a question, it doesn't list options
- **BYLD** (`design/canon/web-apps/byld.md`) — historical register: analog precision, CRT era, instrument panels

Authoritative direction note: `/mnt/c/Users/moham/Documents/Thales/design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`. v3.3 milestone premise: "resolve the Observatory." The moves are all present; none are resolved. Polish before the flow lands.

## Active constraints

- **Visual tokens**: `--bg: #0B0C10`, `--surf: #1A1A1A`, `--teal: #5ecfc0` (confirmed/observed), `--gold: #e8b15a` (navigation/active). One ease: `cubic-bezier(0.16, 1, 0.3, 1)`. Returns ~20% slower than entries.
- **Typography**: DM Mono (instrument readings, chips, metadata), Noto Sans 900 (client names, sphere labels), Fraunces italic at opsz 144 (hero `<em>proof</em>` only).
- **Structural**: no two panels occupy the same spatial region. Verified at every phase gate from 18 onward, not just the phase's own surface.
- **Motion**: reduced-motion variant always ships. ≤0.5s total. No decorative animation in reduced-motion path.
- **Flow target**: 60–90s first-time internal flow (land → query → focus → read → add 3 to reading list → review / compare).

## Non-goals (what this is explicitly not)

- SaaS dashboard register (flat, neutral, chart-heavy) — rejected
- Pitch-deck surface (logos, big numbers, triumphal) — rejected
- Generic portfolio grid (card tiles, hover lift, filter pills) — rejected
- Purple/violet accent anywhere — rejected
- Multi-ease motion system — rejected (single ease only)

## Rejected options

- 2026-04-12 — card-grid portfolio layout — wrong register; dashboards not observatories
- 2026-04-12 — filter-chip-forward UI — Kunumi structural model inverts this; inquiry frames the question
- 2026-04-17 — depth-per-year axis — scheduled for removal in v3.3
- 2026-04-17 — gathered-button affordance — scheduled for removal in v3.3
- 2026-04-17 — label slider — scheduled for removal in v3.3

## Last reviewed

- 2026-04-18 — Phase 16 code-complete (commits `da6bd3d` → `1a649a1` on `draft`) — verdict: PASS-WITH-CONDITIONS at code level; visual UAT via Playwright MCP pending

## Open aesthetic questions

- Planet scale / camera framing — punted from Phase 16; revisit post-UAT only if planet still reads undersized after chrome hide reclaims the frame
- Imagery (P2-D) — schema hook `imagery?: { logo, key_visual }` preserved; visual integration waits for content team; deferred from v3.3
- Graticule — possibly up for removal in v3.3; decision not yet locked

## Sign-off log

- 2026-04-17 — v3.2 milestone closed (Phases 8–15) — Mo: clean substrate, CRT graticule, query bar, reading panel as instrument, reading list + Review + Comparison modes, hero collapse, edge states, accessibility audit all shipped
- 2026-04-18 — Phase 16 code-level verification — Mo: pending visual UAT; no polish sign-off yet
