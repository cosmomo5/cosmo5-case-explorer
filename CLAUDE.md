# Case Study Explorer — Working Agreement

## What This Is

A Three.js dimensional explorer for navigating 116 case studies. The user moves through three dimensions: a 3D orbital field (global view), a 2D constellation plane (focused view), and a 1D staging track (shortlist). Stars orbit nucleus points grouped by vertical/country/region. The interaction model is a spaceship command bridge — navigation port, reading starboard.

## Stack

| Concern | Library | Version |
|---|---|---|
| 3D scene | Three.js | 0.170 |
| Animation | GSAP | 3.12 |
| Data vis | D3 | 7.9 |
| Bundler | Vite | 6 |
| Types | TypeScript | 5 |
| Tests | Vitest | 2 |

## Dev Commands

```bash
npm run dev      # dev server at localhost:5173
npm run build    # tsc + vite build → dist/
npm run test     # vitest run (unit tests in src/**/*.test.ts)
npm run preview  # preview dist/
```

## Playwright MCP — Direction A (CDP attach to Windows Chrome)

**Topology.** Chrome runs on Windows with `--remote-debugging-port=9222` and an isolated profile at `C:\Tmp\PlaywrightProfile`. The `@playwright/mcp` server runs in WSL via `node.exe` (Windows Node) and attaches to Chrome over CDP through WSL2 mirrored networking. Decision rationale: `.planning/DECISIONS.md` (2026-04-19 Playwright topology entry).

**Pieces.**
- Wrapper script: `.claude/scripts/playwright-mcp-cdp.sh` — health-checks the CDP endpoint, relaunches Chrome via `powershell.exe Start-Process` if down, then `exec`s the MCP server with stdio passthrough.
- MCP config: `.mcp.json` at project root — points Claude Code at the wrapper.
- Windows Task Scheduler job: `PlaywrightChromeCDP` — launches Chrome at every Windows login. Re-runs up to 3 times if Chrome exits. Survives reboots.

**Verifying it's healthy.**
```bash
# CDP endpoint reachable from WSL (mirrored networking)
curl -s http://localhost:9222/json/version | head -3

# MCP wrapper boots and lists tools
{
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}'
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
  sleep 2
} | timeout 15s ./.claude/scripts/playwright-mcp-cdp.sh 2>&1 | head -5
```

**Operational ceremony.** None per session. Chrome is up at login (Task Scheduler) or auto-launched by the wrapper. If you ever need to reset:

```powershell
# From PowerShell (or via /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe from WSL)
Get-ScheduledTask -TaskName 'PlaywrightChromeCDP' | Disable-ScheduledTask    # pause auto-launch
Get-Process chrome | Where-Object { $_.MainWindowTitle -eq '' } | Stop-Process -Force   # kill headless Chrome instances
Start-ScheduledTask -TaskName 'PlaywrightChromeCDP'                          # relaunch fresh
```

**When using Playwright MCP for UAT or polish review.** Prefer `browser_snapshot` (accessibility tree, fast, LLM-native) for DOM probes. Use `browser_take_screenshot` only for visual verification — image bytes are expensive to round-trip. `browser_evaluate` is the right call for class/attribute checks like `body.classList.contains('planetary')` or `document.querySelectorAll('.cl.show').length`.

**WSL-only constraint.** The agent runs in WSL; Chrome must run on Windows. Never `npx playwright install` inside WSL — that's the broken path that ran `chrome.exe` from a Linux process and triggered the documented bug cluster (microsoft/playwright-mcp #883, #1172, GPU/dxg crashes). The current setup is the working alternative.

## Design Spec

The authoritative design document is `docs/superpowers/specs/2026-04-13-dimensional-explorer-design.md`. It supersedes sections 3, 5, 6 of the prior spec (`2026-04-12-gravitational-spheres-design.md`). When in doubt, the 04-13 spec wins.

## Design Handoff Is the Acceptance Criterion

The v3.4 design handoff at `~/Desktop/Case Study Explorer - design_handoff/` (mirror at `~/Downloads/Case Study Explorer.html`) is the **acceptance criterion for every phase in this milestone**, not a loose reference. A phase is not "done" until what's in the browser matches the corresponding handoff screen.

**Files:**
- `README.md` — narrative spec: layouts, copy, typography, interaction model, design philosophy
- `Case Study Explorer.html` — interactive prototype showing every state with real animations
- `source/screens-entry.jsx` — Entry state (`EntryQuiet` is canonical for v3.4)
- `source/screens-gather.jsx` — State 1 unorganized (filtering / gather)
- `source/screens-organize.jsx` — State 1 organized (planets around inquiry)
- `source/screens-state3.jsx` — State 2 constellation focus
- `source/scene-primitives.jsx` — `Globe`, `Starfield`, `Nebula`, planet, ring components

**Before planning a phase:** read the handoff section that corresponds to the phase's scope. Plans must explicitly trace each visible element (layout, typography, copy, animation, telemetry, chrome) to its handoff source. If the handoff specifies something the plan doesn't cover, the plan is incomplete — do not start execution.

**Before claiming a phase is done:** open the matching handoff screen alongside the running app. Reach parity on:
1. Layout (positions, sizes, proportions of every named element)
2. Typography (family, weight, size, letter-spacing, line-height, color)
3. Copy (exact strings — eyebrows, headlines, body, CTAs, telemetry)
4. Chrome density (what's visible vs hidden in this state — `density='minimal'`, `catalog={false}`, etc.)
5. Composition (which elements coexist on screen — Entry has globe-right + editorial-left + telemetry-right; nothing else)
6. Animations (timing, easing, what fades vs slides vs spins)

If parity isn't reached, the phase is in `gaps_found` or `human_needed` state, not `passed`. Plan-scope omissions count as gaps — Phase 1's editorial overlay shipped correctly but missed the Entry-state Globe composition; that's a real gap, not a Phase 2 problem.

**Where handoff and existing repo conflict:** the handoff README explicitly says defer to the repo's reality and ask. Don't silently re-skin around the conflict — surface it, get a decision, then execute.

**The aesthetic premise the handoff carries:** *a cosmos of proof, observed* — analog observatory, instrument calibration, gravity as the organizing metaphor. Every screen should feel like arriving at an observatory, not landing on a SaaS homepage. If a build choice trades that feeling for convenience, flag it.

## Design Register

The visual register is analog-era precision — observatory instruments, not SaaS dashboards. Three references:
- **Cosmo5's own system**: astronomical metaphor, gather verb, teal semantic, single ease
- **Kunumi Institute** (`design/canon/web-apps/kunumi-institute.md`): structural model (inquiry over filtering)
- **BYLD** (`design/canon/web-apps/byld.md`): historical register (analog precision, CRT era, instrument panels)

Direction note: `design/reviews/cosmo5-case-explorer/2026-04-12-direction-note.md`

## Three-State Dimensional Model

```
STATE 1: GLOBAL ORBITAL (3D)
  All constellations visible. Free camera. Stars orbit nuclei.
  Click nucleus → T1 transition → State 2.

STATE 2: CONSTELLATION FOCUS (split canvas)
  ┌─────────────────────────────────┐
  │ Constellation zone (top ~72%)   │  2D orbital plane, stars still moving
  │ Stars selectable by click       │  Selected stars leave orbit → ghost remains
  ├─ ─ ─ ─ divider ─ ─ ─ ─ ─ ─ ─ ─┤
  │ Staging track (bottom ~28%)     │  1D track, shortlisted stars aligned
  └─────────────────────────────────┘
  Click star → flies to track. Click track star → opens reading panel.

STATE 3: READING (command bridge)
  ┌────────────────────┬────────────┐
  │ Scene (compressed) │ Reading    │  Panel slides in from right
  │ Constellation      │ Panel      │  Instrument readout format
  │ + track            │ (340px)    │  ← → nav both track + panel
  └────────────────────┴────────────┘
```

## Transitions

All use `--ease: cubic-bezier(0.16, 1, 0.3, 1)`. Returns ~20% slower than entries.

| ID | Transition | Duration | Key move |
|---|---|---|---|
| T1 | Global → Constellation | ~1200ms | Camera rotates to face orbital plane; rings flatten by perspective |
| T2 | Star → Track | ~600ms | Star crosses divider, ghost remains at orbit |
| T3 | Panel open | ~400ms | Panel slides right-to-left, scene compresses |
| T4 | Panel close | ~350ms | Panel slides out, scene expands |
| T5 | Constellation → Global | ~1400ms | Camera pulls back + rotates, nuclei fade in |
| T6 | Remove from shortlist | ~400ms | Star returns from track to orbit, ghost dissolves |

## Token System

```css
--bg:    #0B0C10
--surf:  #1A1A1A
--teal:  #5ecfc0   /* confirmed / observed / measured */
--gold:  #e8b15a   /* navigation / wayfinding / active */
--ease:  cubic-bezier(0.16, 1, 0.3, 1)
```

No purple. One ease. Gold = active/navigation. Teal = data/measurement.

## Typography

- **DM Mono** — instrument readings, filter chips, case metadata, labels
- **Noto Sans 900** — client names, sphere labels, metric values
- **Fraunces** — hero H1 `<em>proof</em>` italic at opsz 144

## File Map

```
src/
  main.ts                        # Entry, boot, tick loop, raycasting, UI wiring
  style.css                      # All styles
  data/
    types.ts                     # CaseStudy, GroupMode, StarOrbit, NucleusOrbit, ProofType
    grouping.ts                  # groupBy(), getKeyForCase(), SERVICE_TO_VERTICAL map
    filter.ts                    # FilterState, matchesFilter(), proof type + impact scale
  scene/
    scene-state.ts               # Scene modes, transitions T1-T6, split canvas layout
    regroup.ts                   # regroupScene — mode switch
    renderer.ts                  # THREE renderer, camera, OrbitControls
    background/starfield.ts      # Ambient starfield
    orbitals/
      nucleus-orbit.ts           # Outer orbital mechanics
      star-orbit.ts              # Inner orbital mechanics
      staging.ts                 # Track layout (1D horizontal staging)
  ui/
    filter-panel.ts              # Global (constellation picker) + focused (multi-dimension)
    tooltip.ts                   # Hover tooltip + shortlist hint
    detail-panel.ts              # Command bridge reading panel (slides from right)
cases.json                       # 116 case studies
index.html                       # Entry HTML
```

## Key State: SceneObjects

The `SceneObjects` struct (in `scene-state.ts`) is the shared mutable state:

- `nucleusMeshes: Map<string, THREE.Mesh>`
- `nucleusLabels: Map<string, HTMLDivElement>`
- `starMeshes: THREE.Mesh[]`
- `nucleusOrbits: Record<string, NucleusOrbitData>`
- `filterState: FilterState`
- `mode: 'global' | 'focused'`
- `focusedKey: string | null`
- `groupMode: 'vertical' | 'country' | 'region'`
- `shortlist: Set<string>` — case IDs on the staging track (persists across constellations)
- `readingCaseId: string | null` — case currently open in reading panel

## Conventions

- **No new Vec3 allocations in hot loops** — reuse module-scope scratch `THREE.Vector3`
- **`isStagingTarget`** on `star.userData` gates whether GSAP or tick loop controls position
- **Nucleus halo** at `mesh.userData.halo`
- **Label divs** appended to `#star-labels`, positioned via `projectToScreen` in tick
- **`unfocusSphere` is the single exit path** from focused → global
- **Color map** (`NUCLEUS_COLORS`) only covers vertical-mode keys; other modes use `DEFAULT_COLOR`
- **Ghost stars**: when a star is on the shortlist, a ghost mesh remains at its orbital position (low opacity, dashed ring)
- **Shortlist is cross-constellation**: persists when navigating between constellations

## Known Limitations (Not Bugs)

- Country/region mode nucleus colors all use `DEFAULT_COLOR`
- Global search only tweaks opacity, doesn't integrate with filter/staging
- Proof Type and Impact Scale require derived fields — not in raw `cases.json`
