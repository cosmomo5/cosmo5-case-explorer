# Design Review Plan — Cosmo5 Case Study Explorer

## Why

Phases 0-6 shipped feature code at velocity without visual design review at phase boundaries. The subagents (Sonnet) wrote structurally correct TypeScript + CSS but made every aesthetic decision from training-data defaults — no taste direction, no design library consultation, no visual verification. Mo tested and the result is broken: overlapping elements, poor layering, unstyled components, incoherent visual hierarchy.

**This is the failure mode the design system was built to prevent:** Track B (engineering) executed without Track A (taste) setting direction.

## What

A systematic visual audit + fix pass across all views, using the design taste skills as the judgment framework.

## How — The Loop

```
Screenshot (shot-scraper or Playwright MCP)
    → Analyze (Sonnet scout, loads design-sensibility + design-review-apparatus)
    → Prioritize (Opus orchestrator, text-only — no images in main context)
    → Fix (Sonnet fixer agents, specific CSS/HTML/TS instructions)
    → Verify (Sonnet scout, re-screenshot)
    → Next issue
```

### Model Routing (Token Efficiency)

| Role | Model | Sees Images? | Why |
|------|-------|-------------|-----|
| Scout (screenshot + analyze) | Sonnet | Yes | Vision + design skill application |
| Orchestrator (prioritize, decide) | Opus | No — text reports only | Design judgment from text, no image tokens in main context |
| Fixer (write code) | Sonnet | No | Pure code execution from specific instructions |
| Verifier (re-screenshot + confirm) | Sonnet | Yes | Confirm fix landed, catch regressions |

**Key constraint:** Images never enter Opus main context. Sonnet scouts describe what they see in text; Opus decides what to fix from the description.

### Design Skills to Load in Scout

The scout agent must invoke these skills BEFORE analyzing screenshots:

1. **design-sensibility** — grounds defaults. The scout must check `design/canon/`, `design/rejections/` before making any aesthetic judgment.
2. **design-review-apparatus** — the review structure: First Impression → AI slop check → Technical → Compositional → Taste.
3. **design-vocabulary** — named operations for fixes: distill, bolder, quieter, typeset, layout, animate, polish.

The scout's job is to apply these frameworks to what it sees, not freestyle opinions.

### What the Scout Checks (per view)

**Views to audit:**
1. Global view (initial load)
2. Global view with filter panel open (accordion expanded)
3. Focused view (inside a constellation — needs Playwright for real click)
4. Focused view with ring highlight
5. Reading panel open
6. Shortlist track with entries
7. Narrow viewport (768px)

**Per view, the scout runs design-review-apparatus layers:**

- **First Impression** (3 seconds): What do I notice first? What feels wrong? What's competing for attention?
- **AI Slop Check**: Does anything look like generic AI-generated UI? (Check against `design/rejections/`)
- **Technical**: z-index layering, overflow clipping, font loading, responsive behavior, contrast ratios
- **Compositional**: visual hierarchy, spacing rhythm, alignment grid, color coherence
- **Taste**: Does this feel like Cosmo5? Does the space metaphor hold? Is the typography working?

### Fix Categories (Expected)

Based on the initial screenshot + Mo's feedback:

| Category | Likely Issues | Fix Approach |
|----------|--------------|-------------|
| **Layering** | Filter over hero, stats over 3D, track visible when shouldn't be | z-index audit, conditional visibility, proper stacking context |
| **Filter Panel** | Bare styling, no backdrop, no visual weight | CSS design pass — backdrop-filter, padding, type hierarchy |
| **Reading Panel** | Unstyled or minimal | CSS design pass aligned with existing design tokens |
| **Shortlist Track** | Raw/placeholder look, possibly mispositioned | Position fix + CSS design pass |
| **Hero/Stats** | Visible when they should be dismissed | Transition logic — hide on scene load or focus |
| **Spacing/Typography** | Inconsistent across new Phase 5-6 elements | Audit against existing CSS custom properties |
| **Animation** | Timing may feel off on filter/panel transitions | Review against design-vocabulary animation principles |

### Playwright MCP Setup (for next session)

To get interactive browser control (real clicks, scroll, navigate Three.js):

1. Create `/home/moham/.claude/.mcp.json`:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headless"]
    }
  }
}
```

2. Restart Claude Code session (MCP servers load at startup)
3. Playwright tools become available: `browser_navigate`, `browser_click`, `browser_screenshot`, `browser_scroll`, etc.

**Without Playwright:** shot-scraper still works for static screenshots. The limitation is we can't navigate to focused view or open the reading panel programmatically (Three.js raycasting requires real mouse coordinates, not DOM events).

**With Playwright:** The `browser_click` at canvas coordinates should work because Playwright sends real input events at the OS level, not synthetic DOM events. This would let the scout navigate to every view state.

## Done Criteria

The design review is done when:

1. Mo opens the app and the first impression is "this looks intentional, not broken"
2. No element overlaps another unintentionally
3. The filter panel, reading panel, and shortlist track have coherent styling that matches the existing Cosmo5 design language
4. The hero → 3D scene → focused view transitions feel smooth and each state has clear visual hierarchy
5. Mo explicitly approves the visual state before Phase 7 proceeds

## Estimated Scope

- Scout: 1 Sonnet agent, ~7 screenshots, ~15 minutes
- Prioritization: Opus text review, ~2 minutes  
- Fixes: 2-4 Sonnet agents (batched by view), ~30 minutes
- Verification: 1 Sonnet agent, re-screenshot, ~10 minutes
- Total: ~1 hour, mostly in Sonnet tokens
