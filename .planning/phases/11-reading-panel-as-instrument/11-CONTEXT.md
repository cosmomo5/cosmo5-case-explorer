# Phase 11: Reading Panel as Instrument - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Source:** MILESTONE-v3.2.md Phase 3 + 11-RESEARCH.md

<domain>
## Phase Boundary

Phase 11 transforms the reading panel from a marketing summary into an instrument-readout observation surface. Header becomes a labeled 2-column grid, imagery integrates optionally, body sections use observational framing, metrics become a DM Mono readout grid, button says ADD TO READING LIST, Fraunces italic deployed at case title, permission-false shows [CONFIDENTIAL].

All work is in src/ui/reading-panel.ts (component logic) + src/style.css (new CSS rules). No new infrastructure needed.
</domain>

<decisions>
## Implementation Decisions

### Header Grid (RP-01)
- 2-column CSS grid: CLIENT / SECTOR / REGION / YEAR / PROOF TYPE / IMPACT BAND
- DM Mono for all, low-contrast labels (rgba 0.4), full-contrast values
- getProofType() and getImpactScale() already exist in filter.ts — import and call
- Locked.

### Imagery (RP-02, RP-07)
- Optional logo inline with CLIENT label, key_visual as atmospheric strip at 0.75 opacity
- If imagery absent: omit entirely, no placeholder, no layout shift
- If permission: false → suppress all imagery, show [CONFIDENTIAL] readout
- Image paths resolve relative to public/case-imagery/
- Locked.

### Body Sections (RP-03)
- Challenge / Approach / Observed Impact (renamed from Results)
- Teal DM Mono uppercase labels, Noto Sans 400 body
- Content compression is a content-team task — component just renders what's in the data
- Locked.

### Metrics Grid (RP-04)
- DM Mono readout grid replacing celebratory metric cards
- Format: LABEL +VALUE OBSERVED TIMEFRAME (if available)
- Teal for values, dim for label and timeframe
- Locked.

### Button (RP-05)
- "ADD TO READING LIST" / "REMOVE" in DM Mono
- Gold border, teal fill on hover
- Locked.

### Fraunces (RP-06)
- Case title (c.title) at panel top in Fraunces italic opsz 144
- Single evidentiary moment — not decorative
- Locked.

### Claude's Discretion
- Exact grid gap/padding values
- Opacity values for dim labels (0.4 recommended)
- Key visual height (120-160px strip)
</decisions>

<deferred>
## Deferred Ideas
- Archive imagery sourcing (content project, not Phase 11)
- Content compression (content team delivers shortened text)
</deferred>

---
*Phase: 11-reading-panel-as-instrument*
*Context gathered: 2026-04-16*
