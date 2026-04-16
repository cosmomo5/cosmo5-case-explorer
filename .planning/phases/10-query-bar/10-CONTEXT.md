# Phase 10: Query Bar - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Source:** MILESTONE-v3.2.md Phase 2 spec + 10-RESEARCH.md

<domain>
## Phase Boundary

Phase 10 replaces the legacy search input with a conversational query bar as the primary interaction surface. Keyword→dimension mapping drives FilterState; full-text fallback for unmatched terms. Stars dim in distance-sorted waves. Live readout shows N CASES / M CLUSTERS. The existing filter panel collapses into a progressive-disclosure Advanced drawer. #globalSearch is removed.

</domain>

<decisions>
## Implementation Decisions

### FilterState Extension
- Add `searchText?: string` to FilterState interface
- Extend `matchesFilter()` to check client/title/challenge/approach when searchText is set
- searchText is only set when NO keyword hints matched (exclusive fallback)
- Locked.

### Keyword Mapping
- New `src/data/keyword-map.ts` with KeywordHint[] table
- Maps service terms, proof types, impact bands, years, regions
- Region terms expand to country names at runtime (no FilterState schema change)
- Pattern: clear all dimension sets → apply matching hints → fallback to searchText
- Locked.

### Wave Propagation
- New `applyFilterWave()` export in scene-state.ts (standalone, not a third branch inside applyFilter())
- Distance-sorted from matching cluster nuclei
- GSAP stagger, ~600ms total propagation
- Respects StarState precedence: skip reading/selected/ghost stars
- Locked.

### Debounce Strategy
- Readout (N CASES / M CLUSTERS) updates immediately (synchronous)
- Wave animation debounced at ~80ms
- Locked.

### Query Bar DOM
- `#queryWrap` container with `#queryInput`, `#queryReadout`, `#queryClear`, `#queryAdvancedToggle`
- DM Mono, centered, z-index 10
- Gold bottom border on focus
- Mounted after loader completes (visible once loader fades)
- Locked.

### Advanced Drawer
- Reuses mountFilterPanel() with `hideModeSwitcher: true` option
- CSS max-height transition for show/hide
- Default collapsed
- Opening overrides query filters with explicit dimension filters
- Locked.

### DOM Cleanup
- Remove #globalSearch and #globalSearchClear from index.html
- Remove #globalSearch event handler from main.ts (lines 522-537)
- Remove associated CSS (.search-wrap, .sc)
- Locked.

### Claude's Discretion
- Exact keyword→dimension mapping coverage (initial table; will iterate)
- debounce timing (80ms recommended, adjustable)
- Wave propagation easing details
- Advanced drawer animation specifics

</decisions>

<specifics>
## Specific Ideas

- v3-starmap commit c7f8aa2 has the KeywordHint pattern as spec
- StarState precedence chain: reading > selected > ghost > filterMatch/filterDim > idle
- nucleusKeys NOT exposed in keyword mapping (internal dimension)
- N MATCHES = cases matching FilterState; M CLUSTERS = nucleusOrbits with ≥1 matching case

</specifics>

<deferred>
## Deferred Ideas

- Query history chips (Phase 12 — localStorage persistence)
- Welcome-back readout (Phase 12)
- NLP/LLM query parsing (out of scope per milestone non-goals)

</deferred>

---

*Phase: 10-query-bar*
*Context gathered: 2026-04-16 from MILESTONE-v3.2.md + 10-RESEARCH.md*
