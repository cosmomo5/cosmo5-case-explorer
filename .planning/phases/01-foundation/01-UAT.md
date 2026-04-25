---
status: partial
phase: 01-foundation
source: [01-VERIFICATION.md, browser UAT 2026-04-25]
started: 2026-04-25T17:00:00Z
updated: 2026-04-25T17:35:00Z
---

# Phase 1 UAT — Entry Screen

## Current Test

[awaiting next iteration — planet camera/positioning gap]

## Tests

### 1. Entry overlay mounts after calibration overture
expected: clicking the calibration "CLICK TO ENTER THE FIELD" cancels overture and mounts `.entry-screen` overlay
result: passed — verified via `document.body.click()` → `.entry-screen` present in DOM
evidence: browser_evaluate post-click returns entryMounted: true

### 2. Editorial typography matches design
expected: 3-line headline ("A cosmos / of proof, / observed.") with italic gold "proof"; eyebrow teal letter-spaced; body monospace; CTA gold-bordered
result: passed
evidence: headlineHTML shows correct break structure; proof color rgb(232, 177, 90) gold, fontStyle italic

### 3. CTA dot is CSS circle (not text character)
expected: 6×6 gold circle with box-shadow glow, not the "●" character
result: passed (after fix)
evidence: dotIsCSS: true, dotBg rgb(232,177,90), dotShadow "rgb(232, 177, 90) 0px 0px 10px 0px"

### 4. Telemetry plate position and structure
expected: bottom-right (32px from each edge), 3 stacked lines, teal accents on numbers
result: passed (after fix)
evidence: telePosition rightFromEdge:32, bottomFromEdge:32; teleHTML has three div lines with .et-accent spans

### 5. Catalog readout hidden during Entry
expected: existing `.catalog-readout` (bottom-right ambient instrument) hidden while Entry overlay is visible
result: passed (after fix)
evidence: catalogReadoutOpacity: "0" while Entry mounted

### 6. Observatory header hidden during Entry
expected: top header strip ("CASE EXPLORER · CASE_COUNT 116 · STATUS · CALIBRATING · EPOCH 2026") hidden during Entry per design (Chrome density='minimal')
result: passed (after fix)
evidence: visual confirmation in entry-after-cleanup-2.png; CSS `body:has(.entry-screen) #observatory-header { opacity: 0 }`

### 7. Cluster labels hidden during Entry
expected: State-1 vertical cluster plates (STRATEGY 3, PERFORMANCE 33, etc.) hidden during Entry
result: passed (after fix)
evidence: visual confirmation; CSS `body:has(.entry-screen) .cl { opacity: 0 }`

### 8. Planet visible during Entry
expected: planet globe rendered on right side of viewport at cx 72%, cy 58%, radius 220 per `screens-entry.jsx::EntryQuiet` and `scene-primitives.jsx::Globe`
result: FAILED
evidence: planet renders centered at viewport origin, much smaller than design (radius 30 vs design's 220)
gap: 01-G1

### 9. Case stars gathered tightly onto planet during Entry
expected: all 116 case-stars form a cohesive globe surface (per design's Globe primitive — markers as gravity wells, particles orbiting on inclined paths)
result: FAILED — case stars are scattered across the canvas as floating yellow squares, not gathered onto the planet sphere
gap: 01-G2

### 10. CTA click → 200ms fade → 600ms State 1 fade-in
expected: ENTER OBSERVATORY click fades Entry overlay 200ms, then transitions to State 1 with 600ms cubic-bezier fade-in
result: not yet tested (gated on the planet positioning fix to make the transition meaningful)

## Summary

total: 10
passed: 7
issues: 2
pending: 1
skipped: 0
blocked: 0

## Gaps

### 01-G1: Entry camera/planet framing not implemented
**Status:** failed
**Root cause:** Phase 1 plans (01-01 through 01-04) covered the DOM overlay + CSS + boot wiring + ENTER_FIELD dispatch but did NOT cover camera/scene composition for Entry state. The camera remains at the State 1 position `(80, 880, 280)` (high above the orbital plane) during Entry, causing the planet to render small and centered instead of large on the right.

**Required to fix:**
- Define an Entry camera position that frames the planet at `cx: 72%, cy: 58%` of viewport with apparent radius matching design (~220px @ 1280x800)
- Add camera transition on `ENTER_FIELD` dispatch from Entry framing → State 1 framing (camera move integrated with the existing 600ms fade-in)
- Likely uses a separate camera state or viewport offset, since planet origin (0,0,0) shouldn't move (it's the orbital plane center)

**Scope:** New phase plan (e.g., 01.1 Entry camera composition) or insert into Phase 2 if Phase 2 covers transitions. Not appropriate to silently extend Phase 1 — this is genuinely missing scope.

### 01-G2: Case stars not gathered into cohesive globe surface
**Status:** failed
**Root cause:** `gatherStarsToPlanet(sceneObjects, {x:0,y:0,z:0}, PLANET_RADIUS)` does pull stars toward the planet but they remain visible as scattered yellow points across the scene — they're not styled to disappear into a globe surface texture as the design shows. The design's `Globe` primitive renders gravity-well dots + inclined orbital particles + atmospheric edge — a composite, not 116 raw billboard sprites.

**Required to fix:**
- Either: convert the 116 starMeshes into a particle texture rendered on the planet sphere surface (matches design's "case-particle clouds inside" Globe behavior)
- Or: tune their positions/scales to look like the design's "field of free galactic particles filling the interior" of the Globe
- Or: gate them entirely during Entry state — show only the planet sphere, no individual case markers

**Scope:** Same as G1 — new plan or Phase 2 inclusion. Connects to G1 (camera framing).

## Notes

Phase 1 delivered correctly against its plans (DOM overlay, CSS, boot wiring, ENTER_FIELD dispatch). The visual gaps are scope omissions in the plan itself — the plans defined the editorial layer but not the 3D scene framing for Entry state. The original handoff README explicitly describes the Entry as a left-editorial + right-Globe composition; the plans missed the right-Globe half.

Recommend: insert a decimal phase `01.1 Entry scene composition` covering camera framing and Globe rendering, or fold into Phase 2 if it covers transitions.
