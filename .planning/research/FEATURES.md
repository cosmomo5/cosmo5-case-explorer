# Feature Landscape — Case Study Explorer v3.1

**Domain:** 3D data exploration tool / interactive case study showcase / spatial selection-to-reading flow
**Researched:** 2026-04-13
**Scope:** Interaction patterns for browse → select → compare → read flows in 3D spatial tools

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hover tooltip on data point | Every data exploration tool shows identity on hover. Without this, orbital field is unreadable. | Low | EXISTS: client name + title. No change needed. |
| Click to select / deselect with visible feedback | Selection without feedback is a ghost interaction. Users expect immediate, unambiguous confirmation of state change. | Low-Med | NEW: star brightens to white + selection ring; star leaves orbit. Ghost at orbital position is feedback too. |
| Persistent selection state across navigation | Two-panel selector research (IxDF): "designs that force users to navigate away lose selections they've built." A shortlist that resets on constellation switch is broken. | Med | NEW: cross-constellation shortlist persistence. The entire pitch-building use case depends on this. |
| Detail panel that keeps context visible | Research finding: spatial context tools that destroy the overview when reading detail force users to mentally reconstruct where they were. The map must stay visible. | Med | NEW: command bridge layout — scene stays visible at all times. Panel slides in, compresses scene; doesn't replace it. |
| Empty state for selection track | When nothing is staged, the track should indicate it's waiting. "Add cases to shortlist" is expected — no track at all is confusing. | Low | Track line only draws when first star is staged. Empty state = invisible track (by design). Consider a faint dotted line as invitation. |
| Sequential navigation through selected items | Once items are collected, users expect ← → to move through them. Arrow navigation is the established convention for any list with a "current item." | Low | NEW: ← → navigates both track and panel simultaneously. |
| Keyboard navigation | Tab + Enter + Escape + arrow keys. These are expected in any panel/modal pattern (established by browser conventions). | Low | Panel: Esc closes. → navigates. Enter opens. |
| Filter with live count feedback | Filter that doesn't show how many results remain is broken for large datasets. Live chip counts prevent dead-end navigation. | Med | NEW: live chip count updates per combination. |
| Way back out / breadcrumb | Users who drill into a constellation must be able to return to global without hunting for an exit. | Low | EXISTS: back button → T5. Filter panel breadcrumb `← BEAUTY · 14 cases`. |
| Loading state / graceful failure for 116 cases | Cases.json loading. If it fails, the orbital field is empty — needs a non-broken state. | Low | EXISTS (likely). Verify in implementation. |

---

## Differentiators

Features that set this tool apart. Not expected in typical data explorers.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dimensional collapse metaphor (3D → 2D → 1D) | The camera flattening IS the interaction. Not a menu state switch — a physically legible reduction in degrees of freedom. Users don't navigate to a constellation; they collapse space toward it. | High | NEW: camera-based T1 transition. The metaphor makes orientation intuitive in a way menus cannot. |
| Ghost star at orbital position when staged | Orbit shows the gap. User reads absence as presence — they know which cases they've taken without checking the track. Bidirectional reference: constellation mirrors the track's state. | Med | NEW: ghost mechanic. The conceptual elegance is that the 3D scene and the 1D track are always in sync, visibly. |
| Star crosses the divider (spatial traversal as interaction event) | The divider crossing is a physical event in a spatial environment. It's legible at the spatial level — the star is somewhere, it moves somewhere else. Most dashboards replace state; this one shows transit. | Med | NEW: T2 animation. The crossing IS the "add to collection" action. No confirmation dialog, no toast notification — the physics do the confirmation. |
| Command bridge reading register | Instrument readout format (DM Mono grid cells, teal metric cards) treats case data as measurement, not marketing. Establishes evidentiary tone for client pitches. | Med | NEW: panel content format. Differentiates from slide-deck-style case presentation. |
| Proof Type + Impact Scale filter dimensions | A CMO filtering a constellation by "Revenue/ROAS + Transformative impact" is asking a qualitatively different question than a performance lead filtering by "Conversion + Incremental." These dimensions only exist inside a constellation and only make sense there. | Med | NEW: derived data fields + focused filter panel. Requires proofType and impactScale derivation from metrics field. |
| Cross-constellation shortlist building | Real pitch-building workflow: find 2 beauty cases, 3 performance cases, 1 regional case — then read them side by side. No other comparable tool models this because their metaphors are document-based, not spatial-navigational. | High | NEW: shortlist persistence architecture. The tool's core value claim lives here. |
| Psychological asymmetry in transitions (returns ~20% slower) | Expansion feels larger than compression. T5 (return to global) is deliberately slower than T1 (enter constellation). This is not just aesthetic — it encodes the semantic difference between closing and opening. | Low | NEW: timing constant. Cheap to implement; meaningfully distinct to feel. |
| Gold glow = "being read now" vs white = "on shortlist" | Two-state visual vocabulary for staged stars. A star doesn't just exist on the shortlist — it can be in active reading or waiting. The distinction is legible in the constellation without opening the panel. | Low | NEW: reading state color. One token, clear semantic differentiation. |

---

## Anti-Features

Features to deliberately NOT build in this version. Each is justified.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Global text search | Search re-routes users into a query-answer loop, not a spatial exploration loop. A 60-second pitch builder doesn't start from "what am I looking for?" — it starts from "what do I have?" The dimensional browse IS the discovery mechanism. Adding search undermines the spatial metaphor by implying the visual field is just a pretty wrapper around a text index. | Dimensional browse + filter chips. Users who know exactly what they want will find it by filtering; users who don't know will find it by browsing. |
| Conversational / AI query interface (Kunumi) | Correct long-term direction, wrong for this milestone. Adding it now would require data connectors, LLM integration, and a completely separate interaction paradigm — all before the core spatial mechanics are stable. | Deferred to v3.2+. Build the shortlist mechanic first; Kunumi queries can populate the shortlist later. |
| CRT grid atmospheric layer (BYLD aesthetic) | Design direction reference, not implementation target. Adding atmospheric layers before the interaction mechanics are validated risks confusing design debt with feature debt. | Consider in v3.2 after core mechanics verified. |
| Archive artifact thumbnails in starmap | Requires case study imagery that may not exist, plus thumbnail loading pipeline, hover previews, and lazy loading logic — all of which would add rendering complexity to the hot loop. | Defer until imagery availability is confirmed. Metric cards in the panel are sufficient proof of result. |
| Mobile / touch-first layout | Internal tool, desktop-first. Three-finger orbital rotation, pinch zoom in a split canvas, and drag-to-stage interactions on touch require a separate interaction model. Adding touch now would compromise the desktop experience. | Desktop-first. Test Chrome/Firefox/Safari. |
| Offline support / caching | No backend, static JSON, internal network. Not a use case. | None. |
| Analytics / usage tracking | Internal tool, not a product being optimized. Adds dependencies, privacy questions, and implementation overhead with no benefit to the current user. | None. |
| Export / share shortlist | Out-of-scope without a backend. A "copy to deck" feature requires knowing what a deck is. | The shortlist IS the pitch; the panel is for reading during the meeting, not exporting before it. |
| Comparison view (side-by-side panels) | Two panels open simultaneously doubles the layout complexity and requires the scene to compress further. For a 60-second tool, sequential navigation with track context is sufficient comparison. | Sequential ← → navigation through staged cases achieves comparison without layout complexity. |
| Permission prompt / "request access" flow | If permission: false, cases should have a locked state visible in the panel but no interactive unlock flow. Building a request-access pipeline is product management scope, not this milestone. | Static locked state in the panel. Label says "case under NDA" or similar. No flow. |

---

## Feature Dependencies

```
Cross-constellation shortlist ← depends on → Star selection model (toggle on click)
Star selection model → Ghost star mechanic (ghost appears when star leaves orbit)
Ghost star mechanic → T2 transition (star flies to track, ghost stays)
T2 transition → Staging track existence (track must exist to receive stars)
Staging track → Track ← → navigation
Track navigation → Reading panel (panel only opens from track, not from constellation)
Reading panel open → T3/T4 transitions (panel slide + scene compression)
T3/T4 transitions → Scene compression (renderer must handle dynamic viewport shrink)
Scene compression → Camera system change (fixed camera at 80,880,280 is incompatible)
Camera system change → T1 transition (camera orbits to face orbital plane)
T1 transition → Split canvas layout (constellation zone + track zone must coexist)
Split canvas layout → Divider line (structural element all transitions reference)

Filter panel (focused) → Proof Type derivation (proofType field must exist on cases)
Filter panel (focused) → Impact Scale derivation (impactScale magnitude from metrics)
Both derived fields → data/types.ts changes (CaseStudy interface update)
Live chip counts → filter logic (AND between dimensions, OR within)
```

**Critical path:** Divider → Split canvas → Camera system → T1 → Star selection → T2 → Track → Reading panel → T3/T4

---

## MVP Recommendation

The spec has already defined what must ship. This is a restatement of priority logic, not new scope.

**Must ship (product doesn't work without these):**

1. Split canvas layout + divider (structural foundation everything else builds on)
2. Camera-based T1 transition (flattening is the core metaphor; without it the "dimensional" claim is empty)
3. Star selection + ghost + T2 crossing (the visual confirmation of selection)
4. Staging track with ← → navigation (the collection mechanic)
5. Reading panel + T3/T4 transitions (the payoff of the shortlist)
6. Cross-constellation shortlist persistence (the pitch-building use case)

**Ship at same time (filters only work alongside selection mechanics):**

7. Proof Type + Impact Scale dimensions (these add focused-mode filter depth)
8. Live chip counts (cheap relative to filter changes; expected once filters exist)

**Can slip without breaking core flow:**

- Contributor badge in panel (cosmetic)
- Permission-gated locked state (can stub with placeholder text)
- Dot navigation in panel footer (position counter 02/03 suffices)

---

## Pattern Notes — Evidence From Research

**Two-panel selector pattern (IxDF):** The canonical rule is that the list panel and detail panel must coexist, not alternate. Selection in the list must produce immediate response in the detail panel. Clearing selection must produce an explicit empty state in detail. The spec's command bridge layout implements all three correctly.

**Persistent selection across navigation:** Shopping cart research confirms that selections that don't survive navigation feel broken, not flexible. The cross-constellation shortlist is the same mechanism — it must survive constellation switches or users will rebuild it, which breaks the 60-second claim.

**Spatial context preservation:** Dashboard UX research (Smashing Magazine, 2025) confirms that animations under 300ms help users maintain spatial memory after state changes. The spec's T1 (1200ms) and T2 (600ms) are on the slower end — they're not there to preserve spatial memory but to enact the dimensional collapse legibly. This tradeoff is deliberate and correct for this use case.

**The "scene stays visible" principle:** The Two-Panel Selector pattern was specifically designed to solve the cognitive cost of navigating away to read detail. The command bridge layout implements this correctly: the 3D scene is never replaced, only compressed.

**What typical 3D showcase tools get wrong:** Most Three.js showcase sites use orbital navigation as pure spectacle — drag, zoom, click → new page. There is no collection mechanic, no persistent selection, no within-session curation. The orbital field here is an instrument, not a backdrop. The differentiator is that the 3D metaphor carries the interaction logic, not just the aesthetics.

---

## Sources

- IxDF: Two-Panel Selectors for Easy Access of Content — https://ixdf.org/literature/article/two-panel-selectors-for-easy-access-of-content (MEDIUM confidence, official source)
- Cloudscape Design System: Split View pattern — https://cloudscape.design/patterns/resource-management/view/split-view/ (HIGH confidence, AWS official design system)
- Smashing Magazine: UX Strategies for Real-Time Dashboards (2025) — https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/ (MEDIUM confidence)
- UX247: Persistent Cart and Multi-screen Behaviour — https://ux247.com/persistent-cart-and-multiscreen-behaviour/ (MEDIUM confidence)
- Project spec: `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md` (HIGH confidence, primary source)
- Project card: `.planning/PROJECT.md` (HIGH confidence, primary source)
