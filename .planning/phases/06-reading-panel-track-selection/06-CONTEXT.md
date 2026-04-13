# Phase 6: Reading Panel + Track Selection - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Source:** Roadmap success criteria (no discuss-phase needed — requirements are specific)

<domain>
## Phase Boundary

Click a case star in focused view → reading panel slides in from right (340px). Panel shows case detail with navigation. Cases can be added to a shortlist track (bottom zone) that persists across constellation visits. Panel compresses the 3D scene leftward. Esc/close restores canvas.

</domain>

<decisions>
## Implementation Decisions

### Reading Panel Layout (from roadmap)
- 340px panel slides in from the right on case star click
- Scene compresses leftward (not overlay — actual layout reflow)
- Panel shows: instrument readout + case sections (services, challenge, approach, results with metric cards)
- Close button + Esc collapses panel and restores canvas width

### Case Navigation (from roadmap)
- ← → arrow keys navigate between cases on the same ring or in the shortlist
- Active case glows gold in the orbit while being read

### Shortlist Track (from roadmap)
- Bottom zone track for selected cases
- Cases added/removed from shortlist via panel interaction
- Track persists across focus/unfocus transitions
- Track is the selection mechanism for building a pitch deck's worth of proof

### Claude's Discretion
- Panel slide animation timing and easing
- Metric card layout within results section
- Gold glow implementation (emissive vs outline vs post-processing)
- Shortlist track visual design (chips, cards, thumbnails)
- How ← → wraps at boundaries (cycle vs stop)
- ShortlistStore integration (already exists from Phase 1)
- Whether panel is DOM overlay or integrated into the flex layout

</decisions>

<specifics>
## Specific Ideas

- ShortlistStore already exists (Phase 1) — wire it to the track UI
- LayoutController already handles resize — extend for panel open/close
- StarState has 'reading' and 'selected' states — use for gold glow and shortlist highlighting
- 340px is specific — respect it as a locked dimension

</specifics>

<deferred>
## Deferred Ideas

- Export/share shortlist as link or PDF (Phase 7 polish)
- Drag-and-drop reorder in shortlist track
- Multi-case comparison view

</deferred>

---

*Phase: 06-reading-panel-track-selection*
*Context gathered: 2026-04-13 via roadmap success criteria*
