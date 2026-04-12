# Case Study Explorer v3 — Gravitational Spheres Design Spec

**Date:** 2026-04-12  
**Status:** Approved  
**Branch target:** `feat/v3-gravitational-spheres` (branching from `main`)  
**Data:** 116 cases, fields: `id`, `client`, `year`, `services`, `countries`, `region`, `permission`, `title`, `challenge`, `approach`, `metrics`

---

## 1. Concept

A two-level nested orbital system — a solar system of solar systems — rendered in Three.js. Industry verticals (or countries, or services) each form a **sphere-nucleus** that orbits a central **staging ground**. Individual case studies are **stars** that orbit their sphere-nucleus like electrons around an atom, each on a unique tilted orbital plane.

The observatory metaphor is inhabited, not applied: the user navigates by gravitational logic, not by UI panels.

---

## 2. Scene Architecture

### 2.1 The Two Orbital Levels

**Level 1 — Inner system (star ↔ nucleus)**

Each case-study star orbits its sphere-nucleus on a unique elliptical plane. The plane is defined by a random orthonormal basis `{u, v}` derived deterministically from the case ID — so the layout is stable across re-renders. Each star has its own:
- Orbital radius `r` (scaled by cluster size)
- Phase offset `φ ∈ [0, 2π]`
- Angular speed `ω ∈ [0.00008, 0.00028] rad/frame`, direction randomised
- Tilt axis (unique per star — no two stars orbit in the same plane)

This is the exact mechanic from v1 `cosmos.js` lines 374–406. Reuse verbatim, ported to TypeScript.

**Level 2 — Outer system (nucleus ↔ staging center)**

The sphere-nuclei themselves orbit the staging center. Each nucleus has:
- Its own tilted elliptical orbital path (different inclination per nucleus)
- Its own angular speed (slower than star orbits — roughly 0.00002–0.00008 rad/frame)
- A stable deterministic position derived from the vertical name

The outer orbital rings are **not rendered** — only the motion implies them. The nuclei are visible as small glowing points with a label.

### 2.2 The Staging Center

Located at `(0, 0, 0)`. A persistent gravity well. Rendered as a faint warm gold glow — no hard geometry. Stars that match the active filter migrate here; clearing the filter sends them home.

The staging center is always active — even with no filter, it exists as a subtle anchor that gives the outer system its gravitational logic.

### 2.3 Z-Layer Stack (5 layers, same as v1)

```
Layer 0 — bg-canvas       : ambient starfield (Three.js Points, 3 depth layers)
Layer 1 — nebula          : soft radial gradients per sphere (CSS, very low opacity)
Layer 2 — globe-stage     : intro D3 orthographic globe (Scene 1 only)
Layer 3 — main-canvas     : Three.js primary scene (spheres + orbits + stars)
Layer 4 — labels          : HTML overlay (DM Mono cluster labels, tooltips)
Layer 5 — ui-chrome       : filter panel, case detail panel, stats strip (z:30+)
```

---

## 3. Scene States

### State 1 — Globe (intro)

D3 orthographic globe with country markers. Unchanged from v1. Camera dive triggers transition to State 2.

### State 2 — Global Orbital View

All sphere-nuclei visible, orbiting the staging center. Stars orbit their nucleus. Camera positioned far enough to see all nuclei simultaneously. Slow continuous camera orbit around the scene center.

**User interactions available:**
- Click nucleus → enter State 3 (sphere expands)
- Filter panel → pull stars to staging center (State 2S)
- Orbit by selector → re-cluster, stars animate to new home spheres
- Hover star → tooltip (client name + case title)
- Click star → open detail panel

### State 2S — Global View with Active Filter

Stars matching the filter have migrated to the staging center and formed a mini-sphere formation there (phyllotaxis, same mechanic as v1's gather). Unmatched stars remain in their home orbits at reduced opacity. Clear filter → matched stars fly back to their nucleus orbits.

### State 3 — Focused Sphere View

One sphere-nucleus fills the viewport. Its stars are at full opacity, large, orbital planes clearly visible. Other nuclei are still present but dimmed and receded to the viewport edge — spatial context preserved. Camera is positioned as if "inside" the sphere's orbital shell.

**User interactions available:**
- Filter panel shows case-level attributes (country, service, year) for this sphere only
- Filter → staging center pulls matching stars from within this sphere
- Click star → open detail panel
- Hover star → tooltip
- Breadcrumb / Esc → return to State 2

### State 3S — Focused View with Active Filter

Same as State 2S but scoped to the focused sphere. Matching stars travel to the staging center within the expanded view.

---

## 4. Grouping Modes

The user can switch how the orbital system is organised. Three modes:

| Mode | Sphere-nuclei are | Stars grouped by | Count |
|---|---|---|---|
| **Vertical** (default) | Industry verticals | `SERVICE_TO_VERTICAL[case.services[0]]` | 7 |
| **Country** | Countries | `case.countries[0]` | 13 |
| **Region** | Geographic regions | `case.region` | 3 (Americas, Europe, Asia-Pacific) |

**Note on "Vertical":** The data has no `vertical` field. A hardcoded lookup table maps services → industry verticals:

```ts
const SERVICE_TO_VERTICAL: Record<string, string> = {
  'Video Ads':        'Media',
  'Social Paid':      'Media',
  'Programmatic':     'Media',
  'Media':            'Media',
  'SEA':              'Performance',
  'Search':           'Performance',
  'SEO':              'Performance',
  'Amazon':           'Commerce',
  'Marketplaces':     'Commerce',
  'Feed':             'Commerce',
  'Commerce':         'Commerce',
  'Data':             'Data & Intelligence',
  'Data Measurement': 'Data & Intelligence',
  'Business strategy':'Strategy',
  'Consulting':       'Strategy',
  'Organization':     'Strategy',
  'GEO':              'GEO',
  'Creative':         'Creative',
  'Influence':        'Creative',
};
```

This produces ~7 vertical nuclei (Media, Performance, Commerce, Data & Intelligence, Strategy, GEO, Creative) — the right spatial density for the outer orbital system. **Vertical mode is the default.**

Switching mode triggers a full re-cluster animation: stars smoothly transition from their current orbital positions to their new home nucleus. Nuclei fade/move to new positions. Duration: ~1200ms, using `--ease`.

---

## 5. Filter Panel

### Location and structure

Persistent left panel, collapsible. Same structural DNA as v1: fixed position, `backdrop-filter: blur`, DM Mono, thin vertical tab when collapsed. Width: 232px (same as v1). Adapts content by view state.

### Global view content

```
[Orbit by]  Service  Country  Region      ← grouping mode switcher

[Pull to staging]
  ● Beauty ×14    ● Fashion ×11    ● Finance ×18
  ● Media ×22     ● Retail ×9      ● Tech ×16
  ...

[Staging ─────────────────────]
  14 stars en route · clear →
```

Chips represent the sphere-nuclei. Selecting a chip pulls those stars to the staging center. Multiple chips can be selected (OR logic — all selected verticals pool at staging).

### Focused view content

```
[← Beauty ×14]                              ← breadcrumb

[Country]
  ● Spain ×5   ● France ×4   ● Italy ×3   ● UK ×2

[Service]
  ● Video Ads ×6   ● Social Paid ×5   ● SEA ×3

[Year]
  2026 ×8   2025 ×6

[Staging ─────────────────────]
  5 stars en route · clear →
```

Chips show only attributes present in the focused sphere's cases. Counts update live as filters combine (AND logic within focused view).

### Token updates from v1

- Active chip: gold border + gold text (`--gold: #e8b15a`) — replaces v1's purple gradient
- Staging section: gold label, teal count text
- Panel background: `rgba(14,16,22,.98)` — unchanged from v1
- Scrollbar: teal tint — unchanged

---

## 6. Star Hover and Click

### Hover — tooltip

On `pointermove` raycasting hit:
- Show a floating tooltip anchored to the star's projected screen position
- Content: `client name` (Noto Sans 900, small) + `case title` (DM Mono, smaller)
- Style: dark glass, gold accent line on left border, teal dot indicating the star's vertical
- Suppress during gather/staging animation

### Click — detail panel

Right-side panel (same as v1, 360px). Content:
- Client name, year, country, services (DM Mono instrument readout format per BYLD reference)
- Title
- Challenge / Approach / Metrics (if `permission: true` — otherwise show a locked state)
- Close button, Esc closes

---

## 7. Visual Token System

Unchanged core tokens from v1, with one substitution:

```css
--bg:      #0B0C10   /* page background */
/* --bg2 removed — usages merged into --bg or --surf */
--surf:    #1A1A1A   /* surface */
--surf2:   #212121   /* elevated surface */
--surf3:   #2A2A2A   /* highest surface */
--teal:    #5ecfc0   /* confirmed / observed / measured */
--gold:    #e8b15a   /* navigation / wayfinding / active */
--ease:    cubic-bezier(0.16, 1, 0.3, 1)   /* single easing, everywhere */
```

**Purple removed.** `--purple (#787DFF)` and `--ppink (#8B3FCC)` are gone. Nebula atmosphere uses `--teal` at very low opacity. The "atmospheric colors in `:root`" rejection rule is now satisfied.

**Gold does the work purple was doing** — active filter chips, staging center glow, cluster label hover, connection lines for industry links.

---

## 8. Accessibility

Non-negotiable constraints (from `rejections/`):

- No `maximum-scale=1` in viewport meta
- `prefers-reduced-motion: reduce` gates: CSS keyframe animations set to `0.01ms`, GSAP `globalTimeline.timeScale(0)`, orbital motion stops (stars snap to current position)
- Fonts loaded only if deployed within 3s of page load
- Keyboard: Esc exits focused view / clears gather, Tab navigates filter chips, Enter activates

---

## 9. Typography

Same as v1, no changes needed:
- **DM Mono** — instrument readings, labels, filter chips, case metadata
- **Noto Sans 900** — client names, sphere labels (bold identification)
- **Fraunces** — hero H1 `<em>proof</em>` (italic at opsz 144, per the resolved proof question)

All three are currently loaded and deployed. No additions.

---

## 10. What's Reused from v1

| Component | Reuse strategy |
|---|---|
| Electron orbital mechanic (lines 374–406, `cosmos.js`) | Port to `src/scene/orbitals/star-orbit.ts` verbatim |
| Ambient starfield (3 depth layers) | Port unchanged to `src/scene/background/starfield.ts` |
| D3 globe intro | Port unchanged to `src/scene/globe/globe.ts` |
| Filter panel HTML/CSS structure | Adapt from v1 — same layout, new content, gold tokens |
| Detail panel (right side) | Adapt from v1 — instrument readout format |
| `cases.json` data | Unchanged |
| `hash()` deterministic function | Port verbatim |
| `SVC_COL` color map | Update to gold/teal system |

## 11. What's New (not in v1 or v2)

| Component | Description |
|---|---|
| Outer orbital system | Nuclei orbit staging center on tilted elliptical paths |
| Grouping mode switcher | Vertical / Country / Service re-cluster animation |
| Staging center | Persistent gravity well, live formation on filter |
| Sphere Expands to Fill | Zoom mechanic — selected sphere scales up, others recede |
| Hover tooltip | Client + title on star hover |
| Dynamic filter panel | Content adapts to view level (global vs focused) |

## 12. What's Discarded from v2 (draft/v3-starmap)

- Affinity clustering algorithm (`layout.ts`) — replaced by explicit grouping modes
- CRT radial grid (`geometry.ts` plane at z=-800) — consider for v3.1, not blocking v3
- Conversational query input — not in scope for v3; may return in v3.1
- `#filtersWrap` DOM remnant — deleted

---

## 13. Build Target

- Base from `main` branch (v1 vanilla JS), not `draft/v3-starmap`
- New branch: `feat/v3-gravitational-spheres`
- Stack: TypeScript 5 + Three.js 0.170 + GSAP 3.12 + D3 7.9 + Vite 6 (same as v2)
- No component framework — vanilla DOM for UI elements (same philosophy as v1)
- `cases.json` served as static asset

---

## 14. Done Criteria

- [ ] Globe intro → orbital transition works
- [ ] All sphere-nuclei orbit staging center on distinct tilted paths
- [ ] Stars orbit their nucleus with unique planes (electron mechanic)
- [ ] Grouping mode switch (Vertical / Country / Service) animates smoothly
- [ ] Filter chip selection → stars migrate to staging center
- [ ] Clear filter → stars fly back to home orbits
- [ ] Sphere click → Sphere Expands to Fill, others recede
- [ ] Focused view filter panel shows sphere-scoped attributes only
- [ ] Hover tooltip shows client + title
- [ ] Click star → detail panel opens
- [ ] `prefers-reduced-motion` respected (3 gates)
- [ ] No `maximum-scale=1` in viewport
- [ ] No purple tokens anywhere
- [ ] Single `--ease` — grep confirms one `cubic-bezier` in CSS
- [ ] `npm run build` zero errors
