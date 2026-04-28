# Phase 2: Layout + ViewState Foundation — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 02-layout
**Areas discussed:** SceneObjects.mode mapping, Free-float wiring, ViewState rename scope in main.ts, Nucleus hide mechanism

---

## SceneObjects.mode mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 'global' string | state1.free → sceneObjects.mode = 'global'. Backward compat — all downstream tick logic continues to work with zero changes. | ✓ |
| Introduce 'state1' string | state1.free → sceneObjects.mode = 'state1'. Cleaner naming, but touches every mode === 'global' check in main.ts's tick loop — scope creep for Plan 03. | |
| You decide | Claude picks based on smallest diff and SPEC guidance. | |

**User's choice:** Keep 'global' string
**Notes:** None

---

## Free-float wiring approach

| Option | Description | Selected |
|--------|-------------|----------|
| Pass (0,0,0) as pseudo-center | All 116 stars use world origin as their Rodrigues orbit center. Simple, no new factory. Stars wander around the scene center. | ✓ |
| New createFreeOrbit() factory | Separate factory without nucleusCenter. Cleaner long-term, but adds new export + test surface to Plan 03. | |
| Current world position as anchor | Each star uses its own current position as the center — more of a 'shimmer' than a 'drift'. | |

**User's choice:** Pass (0,0,0) as pseudo-center
**Notes:** None

---

## ViewState rename scope in main.ts

| Option | Description | Selected |
|--------|-------------|----------|
| Rename all atomically | All kind === 'planetary' → kind === 'entry', all kind === 'global' → kind === 'state1'. Comments (phase numbers) left unchanged. | ✓ |
| Rename except comments | Same as above with explicit note in plan to preserve comment text. | |
| You decide | Claude handles per principle 4 (surgical changes only). | |

**User's choice:** Rename all atomically
**Notes:** None

---

## Nucleus hide mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| visible = false (immediate) | nucleusMeshes.forEach(m => m.visible = false). Objects stay in scene graph. Cheap, reversible. | |
| scene.remove() then add back | Remove from THREE scene entirely. Requires re-adding in Phase 6. | |
| Opacity 0 tween (animated) | GSAP tween opacity 0 over ~300ms. Smooth disappearance. | ✓ |

**User's choice:** Opacity 0 tween
**Follow-up — tween details:**

| Option | Description | Selected |
|--------|-------------|----------|
| 300ms, power1.out, no visible=false after | Minimal animated hide, mesh.visible stays true. | |
| 300ms, then set visible=false | Tween opacity 0, then remove from render path. | |
| Match --ease token (400ms) | Use project cubic-bezier token for consistency. | |

**User's choice on tween details:** "you decide, whatever is best" (Claude's Discretion)
**Notes:** Claude recommendation documented in CONTEXT.md D-06: 300ms, power1.out, set visible=false onComplete.

---

## Claude's Discretion

- Tween details for nucleus hide (duration 300ms, ease power1.out, visible=false onComplete)
- Exact sentinel string for nucleusKey in free-float orbit objects
- Location of nucleus-hide tween (inside choreographPlanetaryToGlobal vs ViewState subscriber)
- Whether state1Mode is direct union field or derived accessor

## Deferred Ideas

None
