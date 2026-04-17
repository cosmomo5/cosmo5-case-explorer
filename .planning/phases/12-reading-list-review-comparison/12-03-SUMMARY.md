---
phase: 12-reading-list-review-comparison
plan: 03
subsystem: animation
tags: [gsap, three.js, star-flight, ghost-mechanic, reduced-motion]

requires:
  - phase: 12-01
    provides: localStorage persistence and shortlist store infrastructure
  - phase: 02-layout
    provides: track zone positioning

provides:
  - Star flight animations triggered on add/remove from reading list
  - Ghost (dimmed clone) mechanic at original orbital position
  - Prefers-reduced-motion support
  - Coordinate space bridge between 2D UI and 3D scene

affects: [12-04, 12-05]

tech-stack:
  added: []
  patterns:
    - GSAP animation with cleanup via maps
    - Dual-timeline animations (700ms entry, 900ms exit)
    - Ghost mesh cloning for position reference
    - Camera-to-world coordinate transformation for track positioning

key-files:
  created:
    - src/scene/star-flight.ts
  modified:
    - src/ui/reading-panel.ts
    - src/ui/shortlist-track.ts
    - src/main.ts
    - src/scene/scene-state.ts
    - src/ui/reading-panel.test.ts
    - src/ui/shortlist-track.test.ts

key-decisions:
  - "Ghost at 15% opacity to be visually distinct from live star"
  - "Return animation 20% slower (900ms vs 700ms) to reinforce spatial distance"
  - "Store original positions in module-level map for cleanup on return"

patterns-established:
  - "Star flight pattern: capture position → create ghost → animate → return → dispose"
  - "Scene coordinate calculation: screen position → NDC → unproject to world space"

requirements-completed: [RL-03, RL-04]

duration: 45min
completed: 2026-04-16
---

# Phase 12 Plan 03: Star Flight Animations Summary

**Star flight animations with ghost mechanic: stars visibly leave orbit to track zone on add, return with 20% slower speed on remove**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-04-16T14:38:00Z
- **Completed:** 2026-04-16T15:23:01Z
- **Tasks:** 2
- **Files modified:** 8 (1 created, 7 modified)
- **Tests:** 242 passing (11 new tests in shortlist-track updated)

## Accomplishments

- Created `src/scene/star-flight.ts` with animation orchestration
- Implemented 700ms entry animation and 900ms return (20% slower for spatial perception)
- Ghost mechanic: dimmed clones at orbital positions for visual continuity
- Prefers-reduced-motion support: instant position swaps with no animation
- Wired star flight to reading-panel add button and shortlist-track remove button
- Updated SceneObjects interface to carry camera reference for coordinate calculations
- All tests pass, TypeScript clean

## Task Commits

Both tasks were executed and verified in one workflow:

1. **Task 1: Create star-flight module** - Implemented `flyStarToTrack` and `returnStarToOrbit` with ghost management
2. **Task 2: Wire star flight to add/remove actions** - Connected animations to UI events in reading-panel and shortlist-track

*Note: Changes were auto-saved/committed during execution. Working tree clean at completion.*

## Files Created/Modified

- `src/scene/star-flight.ts` - Star flight animation module (new, 164 lines)
- `src/ui/reading-panel.ts` - Added `flyStarToTrack` call on add, `returnStarToOrbit` on remove
- `src/ui/shortlist-track.ts` - Added `returnStarToOrbit` call on remove button, accepts sceneObjects parameter
- `src/main.ts` - Pass camera and sceneObjects to ReadingPanel and ShortlistTrack
- `src/scene/scene-state.ts` - Added `camera` property to SceneObjects interface
- `src/ui/reading-panel.test.ts` - Updated test fixtures with proper SceneObjects mocks
- `src/ui/shortlist-track.test.ts` - Verified remove button handler integration (11 tests passing)

## Decisions Made

- **Ghost opacity at 15%:** Dimmed enough to be read as "no longer here" while maintaining spatial reference
- **Return slower than entry (900ms vs 700ms):** 28% slower to reinforce the "returning home" narrative and give visual weight to removal
- **Module-level maps for ghost tracking:** Simplifies cleanup and reduces coupling to scene state
- **Camera in SceneObjects:** Minimal change to interface, enables coordinate transformation without requiring new parameters

## Deviations from Plan

None - plan executed exactly as written.

The implementation matched the planned 700ms/900ms timings, ghost mechanic approach, prefers-reduced-motion handling, and wiring points. No blocking issues or missing functionality discovered.

## Issues Encountered

None. All systems integrated cleanly:
- GSAP animations work with THREE.js position objects
- Coordinate transformation (screen to world space) via camera.unproject works reliably
- SceneObjects interface extension backward compatible

## Technical Notes

### Star Flight Flow

1. **On add:** `readingPanel.shortlistBtn.onclick` → `flyStarToTrack(mesh, caseId, trackPos)`
   - Clone star mesh, set opacity to 0.15, parent to scene
   - Store original position for return
   - Animate star position to track over 700ms (power2.inOut easing)

2. **On remove:** `shortlistTrack.removeBtn.click` → `returnStarToOrbit(mesh, caseId)`
   - Retrieve stored original position
   - Animate star back over 900ms
   - Remove and dispose ghost mesh

3. **Prefers-reduced-motion:** Both functions detect `window.matchMedia('(prefers-reduced-motion: reduce)')` and instant-swap positions instead of animating

### Coordinate System

Track position calculated via:
- Screen space: bottom-center of viewport (0.5, 1.0)
- Normalized device coordinates: (ndcX, ndcY) with Y flipped
- Unproject from camera to world space
- Use camera direction * distance to find world point below

## Verification

- TypeScript: `npx tsc --noEmit` ✓ clean
- Tests: `npm test` ✓ 242 passing (242 passed, 0 failed)
- Code review: Animation timing specs met (700ms/900ms), ghost mechanic working, prefers-reduced-motion wired

## Next Steps

Plan 04 can now add the Review Mode handler and Comparison Mode launcher, both of which will interact with the reading list state and may use the positioned stars from this animation layer.

---

*Phase: 12-reading-list-review-comparison*
*Plan: 03*
*Completed: 2026-04-16*
