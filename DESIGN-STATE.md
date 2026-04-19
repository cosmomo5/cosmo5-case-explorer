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

## Phase 17 constraint set (opened 2026-04-19)

**What Phase 17 delivers**: star labels visible by default at low opacity; clicking a label opens the reading panel directly (right drawer); bottom-right panel becomes view-scoped (label slider always, constellation adds grouping switcher).

**Must be**:
- **Labels at rest = museum register plate.** DM Mono 11px, white at `rgba(255,255,255,.82)`, `.sl.show { opacity: .12 }` — present but subordinate to stars. No gold at rest.
- **Reading panel = right drawer, the reading register.** Panel opens from the right edge. The right side is where the strategist receives raw, well-presented information — reading is a register shift from observing to studying, and the drawer geometry carries that shift. (Override of the research-informed "emerge spatially at star" direction; Mo's call, 2026-04-19.) Star visually highlights on click to carry the star→panel connection without requiring spatial emergence.
- **Click transition = shared-element feedback, not fade.** ~280–350ms entry on single `--ease`. `prefers-reduced-motion` = instant swap, no slide.
- **Hover = ~150ms ease-out, gold border + full opacity.** Unchanged from current `.sl.hover`. Gold is the active/navigation semantic — hover is correct.
- **Bottom-right panel = inquiry instrument, not filter tray.** DM Mono labels. Slider labeled like an instrument ("LABEL OPACITY"). Grouping switcher as segmented mono buttons (BY COUNTRY / BY REGION / BY VERTICAL) — no dropdown chrome, no select arrows, no card shadows. Per Kunumi's structural refusal: the panel must operate as inquiry (what view am I constructing?), not filtering (what parameters am I applying?).
- **In-cluster label visibility**: only the focused cluster's labels show. When you enter Automotive, you see Automotive's labels; the other 100 aren't visible because their stars aren't.
- **Overture gate**: labels inert until `overtureComplete === true` (Phase 16 invariant).

**Must not be**:
- A drawer that slides in from a neutral screen edge with no star highlight — strips the spatial claim entirely.
- Gold on star labels at rest. Gold stays for hover + active + navigation, not persistent annotation (defends the gold-overload question the v2 review left open).
- A filter tray masquerading as contextual controls (dropdowns, checkboxes, filter chips). Kunumi refusal.
- Proof-type/impact-scale toggles wired to live data — derived fields don't exist; scaffold disabled if built, defer otherwise.
- Any click→panel behavior that fires during the planetary overture.

**Open aesthetic question** (Mo flagged 2026-04-19, revisit post-implementation): gold on `.sl.hover` — gold now marks cluster labels, connection lines, active/hover state, navigation semantic, and now hover-on-star-label. Five uses. Accepted for Phase 17; revisit if it reads as gold-everywhere rather than gold-means-something.

**Verification**:
- TDD (inside the polish loop): ReadingPanel opens without `focusedKey`; label click handler invokes with correct case id; in-cluster mode hides non-focused-cluster `.sl`; view-scoped panel renders grouping switcher only in constellation mode.
- Playwright MCP → Windows Chrome: post-overture `.sl` elements at computed `opacity: 0.12`; click a specific `.sl` opens reading panel with correct case from any non-planetary view; inside a cluster only that cluster's `.sl` present; hover produces `.hover` class + gold border; `.sl` click is a no-op during overture; bottom-right panel shows slider always + grouping switcher only in constellation mode.

## Open aesthetic questions (project-wide)

- Planet scale / camera framing — punted from Phase 16; revisit post-UAT only if planet still reads undersized after chrome hide reclaims the frame
- Imagery (P2-D) — schema hook `imagery?: { logo, key_visual }` preserved; visual integration waits for content team; deferred from v3.3
- Graticule — possibly up for removal in v3.3; decision not yet locked
- Gold overload — see Phase 17 open question above

## Sign-off log

- 2026-04-17 — v3.2 milestone closed (Phases 8–15) — Mo: clean substrate, CRT graticule, query bar, reading panel as instrument, reading list + Review + Comparison modes, hero collapse, edge states, accessibility audit all shipped
- 2026-04-18 — Phase 16 code-level verification — Mo: pending visual UAT; no polish sign-off yet
