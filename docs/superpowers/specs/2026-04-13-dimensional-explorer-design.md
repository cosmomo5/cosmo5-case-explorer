# Case Study Explorer v3.1 — Dimensional Explorer Design Spec

**Date:** 2026-04-13
**Status:** Draft — pending Mo review
**Branch:** `phase-1c` (builds on existing v3 gravitational spheres implementation)
**Supersedes:** Sections 3 (Scene States), 5 (Filter Panel), 6 (Star Hover and Click) of `2026-04-12-gravitational-spheres-design.md`. All other sections of that spec remain valid (orbital mechanics, token system, typography, accessibility, data model, grouping modes).
**Data:** 116 cases, fields: `id`, `client`, `year`, `services`, `countries`, `region`, `permission`, `title`, `challenge`, `approach`, `metrics`

---

## 1. Core Concept — Dimensional Exploration

The user explores case studies by navigating through dimensions: from a 3D orbital field, to a 2D constellation plane, to a 1D reading track. Each transition is a **dimensional collapse** — a reduction in degrees of freedom that brings the content into closer focus. Returning reverses the collapse: the view expands back through dimensions.

The metaphor is a spaceship command bridge. Left viewport: the observatory (constellation + staging track). Right panel: the instrument readout (case data). Navigation port, reading starboard.

**Three states, one continuous flow:**

| State | Dimension | View | Camera |
|---|---|---|---|
| Global Orbital | 3D | All constellations, free camera | Rotate, zoom, pan |
| Constellation Focus | 2D | One constellation fills top zone, track below | Locked to orbital plane |
| Shortlist Reading | 2D + 1D | Constellation + track + reading panel | Panel slides in from right |

Stars are always in motion. Transitions are uninterrupted. The flow never breaks.

---

## 2. Scene Architecture — Split Canvas

The focused view uses a **split canvas** layout. The constellation and shortlist track coexist in the same viewport, not as separate states.

```
┌─────────────────────────────────────────────┐
│  CONSTELLATION ZONE  (top ~72%)             │
│                                             │
│     ○   ★   ○        ★ = selected star      │
│        ◉         ○   ◉ = nucleus            │
│   ★       ○          ○ = idle star          │
│       ○        ★     · = dimmed (filtered)  │
│                                             │
├─ ─ ─ ─ ─ ─ divider ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  STAGING TRACK  (bottom ~28%)               │
│     ○───────●───────○                       │
│             ▲ active                        │
└─────────────────────────────────────────────┘
```

The **divider line** is the floor of the constellation and the ceiling of the staging track. Stars cross it when selected — they visually drop from orbit to the track. This crossing is the key animation moment.

When the reading panel opens:

```
┌──────────────────────┬──────────────────┐
│ CONSTELLATION ZONE   │  READING PANEL   │
│    (compressed)      │  (340px)         │
│       ○  ★g  ○       │  ◆ CASE 02/03   │
│         ◉     ○      │                  │
│    ★       ○         │  Sephora         │
│        ○       ★     │  Challenge...    │
│                      │  Approach...     │
├─ ─ divider ─ ─ ─ ─ ─┤  Results...      │
│ ○────●────○          │                  │
│      ▲ active        │  ← 02/03 →      │
└──────────────────────┴──────────────────┘

★g = gold glow (star being read)
```

---

## 3. State 1 — Global Orbital View (3D)

All sphere-nuclei visible simultaneously, orbiting a central staging ground. Camera is free — rotate, zoom, pan. Stars orbit their nucleus continuously on unique tilted planes.

**Nucleus visual:** Minimal point — a small glowing teal dot (~8–10px equivalent). No volume, no rendered sphere. The 3D depth comes from the tilted orbital rings and star positions, not from the nucleus itself.

**User interactions:**
- Drag/scroll: rotate, zoom, pan the 3D scene
- Hover nucleus: label brightens
- Click nucleus: enter constellation (triggers T1 transition)
- Hover star: tooltip (client name + case title)
- Click star: add to shortlist (shortlist persists even in global view)

**Filter panel (global):** Minimal constellation picker. "Orbit by" switches grouping mode (Vertical/Country/Region). Constellation chips mirror the nuclei — clicking one navigates to it. This is wayfinding, not filtering.

---

## 4. State 2 — Constellation Focus (2D + 1D)

One constellation fills the top zone. Stars orbit on the flattened plane — they still move. The staging track occupies the bottom zone.

### 4.1 Constellation Zone (top ~72%)

The selected constellation's orbital rings appear as perfect circles (camera is face-on to the plane). Stars orbit at full size and opacity. Stars from other constellations are not visible.

**Star states:**
- **Idle** — gold, ~6px, normal glow. Hoverable, clickable.
- **Selected** — white, ~9px, bright glow + selection ring. On the shortlist.
- **Dimmed** — faded gold, ~3px, no glow. Filtered out by panel criteria.
- **Ghost** — very faint, ~4px, dashed ring. Star has been sent to the track; ghost marks its orbital position. Clicking the ghost removes it from shortlist and returns the star to orbit.
- **Reading** — gold (not white), ~9px, warm glow. This star's case is currently open in the reading panel.

**Star selection:** Click to toggle. Selected stars leave their orbital position — the orbit shows a gap. A ghost remains at the orbital position. The star flies down across the divider to the staging track.

### 4.2 Staging Track (bottom ~28%)

A horizontal track where shortlisted stars align. The track line draws from center outward — it doesn't exist until there's something on it.

**Track elements:**
- Track line: subtle teal gradient, horizontal
- Staged stars: spaced evenly along the track
- Connectors: faint teal lines between adjacent staged stars
- Active star: larger, brighter (gold when reading panel open, white otherwise)
- Waiting stars: smaller, dimmer gold

**Navigation:** ← → arrows move between staged stars. Clicking a star on the track makes it active. Active star = its case card opens in the reading panel (or as a floating preview if panel is closed).

**Track persistence:** The shortlist survives navigation between constellations. You can enter Beauty, select 2 cases, go back to global, enter Performance, select 3 more — the track now has 5 stars from 2 verticals.

### 4.3 Filter Panel (focused)

The filter panel gains depth when inside a constellation. All filter dimensions scope to the current constellation's cases only.

**Sections:**
1. **Breadcrumb** — `← BEAUTY · 14 cases` (click returns to global)
2. **Country** — chips for each country present in this constellation, with counts
3. **Service** — chips for each service present, with counts
4. **Year** — chips, with counts
5. **Proof Type** (new) — Revenue/ROAS, Conversion, Awareness, Engagement, Cost efficiency. Categorizes the *kind* of result the case demonstrates.
6. **Impact Scale** (new) — range slider from incremental to transformative. Filters by magnitude of the result.
7. **Filter status** — `8 / 14 visible` + `reset all`
8. **Shortlist counter** — `3 on shortlist` + `clear ×`

**Filter logic:** AND between dimensions (Country AND Service AND Year AND Proof Type AND Impact Scale). OR within each dimension (France OR Spain). Chip counts update live — they show how many cases match if that chip were added to the current filter. Chips with ×0 grey out.

**Filtering + shortlist interaction:** Filtering dims non-matching stars in the constellation. Already-staged stars on the track are NOT affected by filter changes — the shortlist is independent of the filter.

---

## 5. Reading Panel — Command Bridge

The reading panel slides in from the right when a staged star is activated (click on track star, or press Enter). The constellation + track compress leftward to accommodate.

**Panel width:** 340px
**Trigger:** Click track star, press Enter on active track star, or → to next case
**Close:** Esc, click close button, or click anywhere in the scene

### 5.1 Panel Structure

```
┌──────────────────────────┐
│ ● CASE 02 / 03     ESC ×│  ← status bar (gold dot + position)
│                          │
│ Sephora                  │  ← client name (Noto Sans 900, large)
│ Perf Max campaign...     │  ← title (DM Mono, grey)
│                          │
│ ┌─REGION─┬─VERTICAL─┬─YR┐│  ← instrument readout strip
│ │Europe  │Beauty    │'25││     (DM Mono grid cells, teal values)
│ └────────┴──────────┴───┘│
│                          │
│ ─ SERVICES ──────────────│  ← service chips (teal border)
│ [Video Ads] [Social Paid]│
│                          │
│ ─ CHALLENGE ─────────────│  ← section (gold label + rule line)
│ Body text...             │
│                          │
│ ─ APPROACH ──────────────│
│ Body text...             │
│                          │
│ ─ RESULTS ───────────────│
│ ┌─3.2×───┐ ┌─+47%───┐  │  ← metric cards (Noto 900, teal)
│ │ROAS    │ │conv rate│  │
│ └────────┘ └────────┘  │
│ ┌─-31%───┐ ┌─6──────┐  │
│ │CPA     │ │markets  │  │
│ └────────┘ └────────┘  │
│                          │
├──────────────────────────┤
│ ← prev  ○ ● ○  next →  │  ← footer nav (dots + arrows)
│                   02/03  │
└──────────────────────────┘
```

### 5.2 Panel Behavior

- **← → arrows** navigate staged cases in both the track and panel simultaneously
- **Active star in constellation glows gold** while its case is open (not white — gold signals "being read")
- **Panel scrolls** for long content; the footer stays fixed
- **Permission-gated:** If `permission: false`, Challenge/Approach/Results are hidden behind a locked state
- **Contributor badge** (if available): initials + name at the bottom of the body

### 5.3 Instrument Readout Register

The panel uses the BYLD analog-precision register throughout:
- **Labels** in DM Mono, small caps, muted color (#333)
- **Values** in DM Mono or Noto Sans 900, teal (#5ecfc0)
- **Grid cells** with hairline borders separating instrument readings
- **Section dividers** with gold label + horizontal rule
- **Metric cards** with large Noto 900 numbers — this is the "proof" rendered as a measurement, not a marketing claim

---

## 6. Dimensional Transitions

All transitions use `--ease: cubic-bezier(0.16, 1, 0.3, 1)`. Returns are ~20% slower than entries — expansion feels larger than compression.

### T1 — Global → Constellation (3D → 2D) ~1200ms

**What happens:**
1. **0–400ms:** Other nuclei fade to invisible. They don't fly away — they dissolve.
2. **0–800ms:** Camera orbits to face the target constellation's orbital plane head-on. The rings don't change shape — the camera rotates to align with the plane. The 3D tilt flattens by perspective, not geometry.
3. **400–1200ms:** The constellation scales up to fill the top zone. Stars spread to their 2D orbital positions. The staging track zone fades in at the bottom.

**The key move:** The flattening is a **camera move**. The rings were always circular — you were looking at them from an angle. Now you see them face-on.

### T2 — Select star → track (2D → 1D crossing) ~600ms

**What happens (per star):**
1. Star brightens to white (selected state)
2. A ghost remains at the orbital position (faint, dashed ring)
3. Star travels in a smooth arc from its orbit, across the divider, to its position on the track
4. Track line extends to accommodate the new star (draws from center outward if this is the first star)
5. Connector lines draw between adjacent staged stars

**The key move:** The star **crosses the divider** — it visibly moves from the 2D constellation into the 1D track. This crossing is the spatial event that makes the staging feel physical.

### T3 — Panel open (track → reading) ~400ms

1. Reading panel slides in from right edge
2. Constellation + track compress leftward simultaneously
3. Active track star brightens; corresponding star in constellation shifts to gold glow
4. Panel content fades in after the slide completes (~200ms delay)

### T4 — Panel close ~350ms

1. Panel slides right and disappears
2. Constellation + track expand to fill viewport
3. Active star returns from gold to white (selected state)

### T5 — Constellation → Global (2D → 3D) ~1400ms

Reverse of T1, slightly slower:
1. Track zone fades out (stars stay in shortlist memory but visually disappear)
2. Camera pulls back while rotating away from face-on — rings tilt back into 3D
3. Other nuclei fade back in
4. Constellation retakes its orbital position in the global field

### T6 — Remove from shortlist ~400ms

1. Ghost at orbital position brightens
2. Star on track flies back up across divider to its orbital position
3. Ghost dissolves as the star arrives
4. Track contracts to close the gap; connectors redraw

---

## 7. Token System (unchanged from v3 spec)

```css
--bg:    #0B0C10
--surf:  #1A1A1A
--surf2: #212121
--surf3: #2A2A2A
--teal:  #5ecfc0   /* confirmed / observed / measured */
--gold:  #e8b15a   /* navigation / wayfinding / active */
--ease:  cubic-bezier(0.16, 1, 0.3, 1)
```

No purple. Gold does active state work. Teal does data/measurement work. One ease.

---

## 8. What Changes from the Existing v3 Implementation

The existing `phase-1c` codebase (2,699 lines) has most of the orbital mechanics, rendering, and data infrastructure. This spec changes:

| Component | Current state | Change needed |
|---|---|---|
| `scene-state.ts` | Single mode: global/focused. Focus = sphere expands | Split canvas model. Focus = camera rotation + zone layout |
| `filter-panel.ts` | Global and focused filters, staging counter | Add Proof Type + Impact Scale dimensions in focused mode |
| `detail-panel.ts` | Right panel modal with scrim | Command bridge panel — slides in, compresses scene |
| `tooltip.ts` | Basic hover tooltip | Add "click to shortlist" hint; gold glow state for reading star |
| `staging.ts` | Phyllotaxis formation at (0,0,0) | Horizontal track below divider; stars align on 1D axis |
| `renderer.ts` | Fixed camera at (80,880,280) | Camera transition to face orbital plane; scene compression when panel opens |
| `style.css` | Single-zone layout | Split canvas zones; divider; panel slide animation; ghost star style |
| `main.ts` | Raycasting + focus/unfocus | Shortlist state management; cross-constellation persistence; arrow nav |
| `data/filter.ts` | Country/Service/Year filter | Add Proof Type enum + Impact Scale range |
| `data/types.ts` | CaseStudy interface | May need `proofType` and `impactScale` derived fields |

**What stays unchanged:** Orbital mechanics (`star-orbit.ts`, `nucleus-orbit.ts`), hash function, grouping logic, ambient starfield, token system, typography, accessibility gates, data loading.

---

## 9. Done Criteria

- [ ] Global orbital view: all nuclei orbit, stars orbit nuclei, free camera works
- [ ] Click nucleus: camera rotates to face orbital plane (T1), rings flatten by perspective
- [ ] Split canvas: constellation in top zone, staging track in bottom zone, divider visible
- [ ] Click star in constellation: star flies to track (T2), ghost remains at orbital position
- [ ] Track grows as stars are added; contracts when removed
- [ ] Filter panel: global = constellation picker with orbit-by switcher
- [ ] Filter panel: focused = country, service, year, proof type, impact scale
- [ ] Filter chip counts update live based on current filter combination
- [ ] Shortlist persists across constellation visits
- [ ] Click track star: reading panel slides in from right (T3), scene compresses
- [ ] Reading panel: instrument readout strip + challenge/approach/results + metric cards
- [ ] Active star glows gold in constellation while being read
- [ ] ← → navigates both track and panel simultaneously
- [ ] Esc closes panel (T4), back button returns to global (T5)
- [ ] Remove star from shortlist: star returns to orbit from track (T6)
- [ ] All transitions use `--ease`; returns ~20% slower than entries
- [ ] `prefers-reduced-motion` respected (3 gates)
- [ ] No purple tokens anywhere
- [ ] Single `cubic-bezier` in CSS
- [ ] `npm run build` zero errors
