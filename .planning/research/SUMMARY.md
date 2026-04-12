# Project Research Summary

**Project:** Case Study Explorer v3.1 — Dimensional Explorer Milestone
**Domain:** Vanilla TypeScript + Three.js + GSAP hybrid WebGL/DOM interactive visualization
**Researched:** 2026-04-13
**Confidence:** HIGH

## Executive Summary

This project is a 3D spatial data exploration tool built on a locked stack (Three.js 0.170, GSAP 3.12, TypeScript, Vite). The milestone adds a six-transition system that collapses a 3D star field into a 1D staging track — camera-as-interaction rather than menu-as-navigation. The architectural challenge is coordinating three concurrent concerns: GSAP timeline animation, Three.js scene state, and DOM layout. All four research files converge on the same approach: strict separation between a ViewState machine (what the app is in), a TransitionChoreographer (how it gets there), and a ShortlistStore (user intent that outlives any view).

The recommended approach builds in strict dependency order: foundation types and state modules first, split-canvas layout second, camera transitions (T1/T5) third, star flight mechanics (T2/T6) fourth, reading panel (T3/T4) fifth, and filter enrichment sixth. This sequence is non-negotiable — each phase is a hard prerequisite for the next. One new dependency is warranted (`camera-controls` v3.1.2) to clean up face-on orbital plane targeting for T1. The codebase has three known bugs (mesh leak, Vec3 allocation pressure, staging world-origin bug) that must be fixed before new transitions are built.

The critical risks are: OrbitControls desync after camera tweens (causes camera lock requiring page reload), GSAP tweens running on disposed meshes (causes GPU memory leak), and non-atomic transitions that corrupt shortlist state when interrupted. All three are preventable with patterns the research has fully resolved — they must be addressed at the phase where they first arise, not deferred.

## Key Findings

### Recommended Stack

Stack is locked. One addition: `camera-controls` v3.1.2 provides `rotateTo(azimuth, polar, enableTransition)` — eliminates verbose manual spherical coordinate computation for T1's face-on orbital plane alignment. Compatible with Three.js >= 0.126.1.

**Key pattern decisions:**
- One GSAP timeline per transition, killed on start via `gsap.context().revert()`
- Single camera, single render pass; zones are world-space Y ranges, not viewport splits
- Shortlist as plain TypeScript pub/sub module at data layer, never inside SceneObjects
- Track stars remain Three.js meshes (Option B) to avoid handoff complexity on T6
- No XState/Zustand — 3-state machine is a hand-rolled TypeScript discriminated union

### Expected Features

**Table stakes:**
- Star selection with visual feedback (white glow + ring)
- Cross-constellation shortlist persistence
- Detail panel with scene context preserved (command bridge layout)
- Sequential ← → navigation through staged cases
- Live filter chip counts per combination

**Differentiators:**
- Camera-based dimensional collapse T1
- Ghost star at orbital position when staged
- Star crossing the divider (T2) — the crossing IS the confirmation
- Command bridge instrument readout format
- ProofType + ImpactScale filter dimensions
- 20% slower T5 return timing

**Defer to v2+:** Global text search, AI query interface, CRT atmospheric layer, archive thumbnails, mobile layout, export/share shortlist, side-by-side comparison panels.

### Architecture Approach

Three new modules: `ViewState` (discriminated union state machine), `ShortlistStore` (data-layer persistence with pub/sub), `TransitionChoreographer` (all GSAP timelines for T1/T2/T5/T6, mutual exclusion). Panel slide (T3/T4) is CSS transition owned by `ReadingPanel` directly.

**Critical boundary rule:** ShortlistStore must be at boot level, not inside SceneObjects.

### Critical Pitfalls

1. **OrbitControls desync after T1/T5** — Disable controls, animate spherical coords, animate target via proxy, update once on complete.
2. **GSAP tweens on disposed meshes** — `gsap.killTweensOf()` before `scene.remove()`; use `gsap.context()` per transition.
3. **Canvas aspect ratio corruption during panel slide** — `ResizeObserver` on scene container, not window.
4. **Non-atomic transitions corrupt shortlist** — `transitionInProgress` flag checked by all input handlers.
5. **Ghost opacity overwritten by filter** — Star state enum with precedence; single `material.opacity` setter.

## Implications for Roadmap

### Phase 0: Pre-work — Fix Existing Bugs
Fix mesh disposal chain, scratch Vector3 pattern, staging world-origin bug. These compound under new transitions.

### Phase 1: Foundation — State and Type Layer
`ViewState` machine, `ShortlistStore`, `ProofType` enum, `ImpactScale` type, derived field computation. Pure TypeScript, fully testable.

### Phase 2: Layout Architecture — Split Canvas + ResizeObserver
`LayoutController`, CSS zones (72/28 split, divider, panel slot), ResizeObserver live. Structural prerequisite for all transitions.

### Phase 3: Camera Transitions — T1 and T5
`TransitionChoreographer` T1/T5, `camera-controls` migration, transition lock, 20% slower T5. Hardest single piece.

### Phase 4: Star Selection + Ghost System — T2 and T6
`GhostManager`, `StagingTrack`, T2 arc, T6 return, star state enum + single opacity setter. Central interaction.

### Phase 5: Reading Panel — T3 and T4 (parallelizable with Phase 6)
`ReadingPanel` with instrument readout, T3/T4 CSS transitions, keyboard navigation, gold glow state.

### Phase 6: Filter Enrichment (parallelizable with Phase 5)
ProofType + ImpactScale chips in focused filter panel, live chip counts, AND/OR filter logic.

### Phase 7: Cross-Constellation Persistence + Accessibility Polish
Verified shortlist survival through T5, ghost visibility on re-entry, `prefers-reduced-motion` audit.

### Research Flags

Needs research during planning: Phase 3 (`camera-controls` migration), Phase 6 (ProofType regex heuristics).
Standard patterns (skip research): Phases 0, 1, 2, 4, 5, 7.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified; `camera-controls` verified via npm |
| Features | HIGH | Critical path explicit; table stakes validated against IxDF/Cloudscape |
| Architecture | HIGH | Patterns verified against codebase; OrbitControls+GSAP against Three.js discourse |
| Pitfalls | HIGH | All critical pitfalls cross-referenced against CONCERNS.md |

---
*Research completed: 2026-04-13*
*Ready for roadmap: yes*
