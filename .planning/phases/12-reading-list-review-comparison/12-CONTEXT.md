# Phase 12: Reading List + Review Mode + Comparison Mode - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Source:** MILESTONE-v3.2.md Phase 4 + 12-RESEARCH.md

<domain>
## Phase Boundary

Phase 12 builds three interdependent systems: persistent Reading List with star flight animations, Review Mode (sequential immersive reader), and Comparison Mode (adapted phyllotaxis gather for spatial comparison). localStorage persists state across sessions.
</domain>

<decisions>
## Implementation Decisions

### localStorage Persistence (RL-05, RL-06, RL-07)
- Three keys: cosmo5.readingList.v1, cosmo5.queryHistory.v1, cosmo5.recentlyViewed.v1
- Boot-time hydration from localStorage into ShortlistStore
- Debounced writes (300-500ms) on store mutation
- Locked.

### Reading List (RL-01, RL-02, RL-08)
- Rename "Shortlist" → "Reading List" in UI strings only (API names unchanged)
- Track: empty state message, populated cards (client/sector/metric/timestamp/X), count, REVIEW + COMPARE buttons
- Welcome-back: readout below query input on return with non-empty list
- Locked.

### Star Flight (RL-03, RL-04)
- GSAP proxy animation on star mesh position
- Add: 700ms eased from orbit to track. Ghost (dimmed clone) at original position.
- Remove: 900ms (20% slower). Ghost disposed. Star returns to orbit.
- prefers-reduced-motion: instant position swap, no animation
- Locked.

### Review Mode (RV-01 through RV-04)
- Full-viewport overlay triggered from REVIEW button or card click
- Reuses ReadingPanel instrument-readout layout (Phase 11)
- Arrow key navigation, progress indicator CASE N OF M
- Remove-from-list control without leaving mode
- Esc exits, list intact
- Locked.

### Comparison Mode (CM-01 through CM-06)
- COMPARE button activates at ≥3 readings
- Stars fly from track to phyllotaxis formation center (~900ms)
- All other stars dim to 0.08 opacity
- Gathered stars full-size, labeled, hoverable for reading panel
- Hide query bar, advanced drawer, ring-switcher during comparison
- Exit returns stars to track, restores prior observatory state
- Visually distinct from focus mode (translation + dimming vs camera rotation + rings)
- Locked.

### Claude's Discretion
- Ghost visual (clone mesh vs sprite-layer)
- Welcome-back timestamp bucketing
- Phyllotaxis formation spacing for variable N
- GSAP context cleanup patterns
</decisions>

<deferred>
## Deferred Ideas
- Narrow viewport handling for Comparison Mode (Phase 14)
- Recently-viewed consumption in UI (Phase 14)
</deferred>

---
*Phase: 12-reading-list-review-comparison*
*Context gathered: 2026-04-16*
