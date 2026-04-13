# Phase 5: Filter Panel + Staging Sphere - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Source:** Inline decision capture (Mo chose option 2)

<domain>
## Phase Boundary

Filter panel visible in both global and focused views. In global view, filter selections create a staging sphere that behaves like any dimension-sphere. In focused view, filters narrow within the constellation. AND between dimensions, OR within dimension. Live chip counts.

</domain>

<decisions>
## Implementation Decisions

### Filter Panel Layout
- **Expandable accordion sections** — one row per dimension, expands to show values as chips. Mo chose this over horizontal chip bar and hybrid approaches.
- Dimensions: country, service, year, ProofType, ImpactScale
- Panel visible in both global and focused views

### Staging Sphere Behavior (from roadmap)
- Selecting chips in global view creates a staging sphere with distinct color
- Matched stars animate to the staging sphere
- Staging sphere is clickable — triggers same T1 focus + concentric orbit view as any dimension-sphere
- Other spheres push outward slightly when staging sphere appears; slight zoom toward staging

### Focused View Filtering (from roadmap)
- Filter panel narrows within the constellation (filters apply to ring contents)
- AND between dimensions, OR within each dimension
- Live chip counts; chips with 0 matches grey out

### Claude's Discretion
- Accordion expand/collapse animation timing and easing
- Panel positioning (left side, right side, top)
- Chip visual design within accordion sections
- Staging sphere color choice and glow treatment
- Animation choreography for stars moving to staging sphere
- How existing ring lines/labels adapt when cases are filtered in focused view

</decisions>

<specifics>
## Specific Ideas

- Accordion should feel snappy — not slow drawer animation
- Chip counts update live as other dimensions change (cross-filtering)
- Grey-out (not hide) chips with 0 matches to maintain spatial stability

</specifics>

<deferred>
## Deferred Ideas

- Search/type-ahead within a dimension (future polish)
- Saved filter presets
- Filter history / undo

</deferred>

---

*Phase: 05-filter-panel-staging-sphere*
*Context gathered: 2026-04-13 via inline decision capture*
