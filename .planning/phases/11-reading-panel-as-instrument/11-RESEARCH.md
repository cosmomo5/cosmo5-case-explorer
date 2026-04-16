# Phase 11: Reading Panel as Instrument — Research

**Researched:** 2026-04-16
**Domain:** Reading panel DOM restructuring, imagery integration, DM Mono readout grid, typography deployment, permission gating
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RP-01 | Header redesigned — structured CLIENT/SECTOR/REGION/YEAR/PROOF TYPE/IMPACT BAND block in DM Mono with low-contrast labels + full-contrast values | Current header is three `.rp-cell` spans without labels; redesign to 2-column grid with explicit label/value pairs. New grid structure with labelValue tuples. |
| RP-02 | Archive imagery strip at panel top — logo inline with CLIENT readout, key visual at ~0.75 opacity; graceful fallback when `imagery` absent | CaseStudy.imagery field exists (optional); schema supports `logo` and `key_visual` properties. Fallback rendering required. Image path resolution: relative to `public/case-imagery/` |
| RP-03 | Body sections (Challenge/Approach/Observed Impact) restructured — teal DM Mono uppercase labels, Noto Sans 400 body compressed to 40–80 words, "observed X" framing replaces marketing prose | Current section labels exist (DM Mono); content rewrite falls to content team. Label colors update from current to teal. Font weights verified. |
| RP-04 | Impact section rendered as DM Mono readout grid: `METRIC_NAME +VALUE% OBSERVED DATE` pattern. Teal values. No big-bold-number typography. | Current `rp-metric-card` layout uses Noto Sans 900. Replace with grid structure using DM Mono. No metric-card wrapper needed. |
| RP-05 | `ADD TO READING LIST` button in DM Mono, gold border at full opacity, teal fill on hover. Replaces "Add to Shortlist" label. | Current button: `.rp-shortlist-btn` with "Add to Shortlist" / "Remove" labels. Button DOM exists; CSS styling + label update required. |
| RP-06 | Fraunces italic opsz 144 deployed at one evidentiary moment (case title at panel top, or equivalent). Font already loaded per `rejections/loading-fonts-you-dont-use.md` | Fraunces in index.html link confirms italic+opsz 144 weights are loaded. Case title at panel top is the natural deployment point. |
| RP-07 | Permission-false cases suppress imagery, show `[CONFIDENTIAL]` readout without breaking layout. | Current permission gate: `if (!c.permission)` shows "Access restricted" message. Extend to suppress imagery + show designed `[CONFIDENTIAL]` readout. Layout must not shift. |

</phase_requirements>

---

## Summary

Phase 11 transforms the reading panel from a command-bridge marketing summary into an instrument-readout observation surface. The architectural work is minimal — the component already exists in `src/ui/reading-panel.ts` and renders into `#reading-panel-slot` — but the visual restructuring is substantial.

Five distinct changes are needed:

1. **Header redesign (RP-01):** Replace the three-span instrument readout with a proper 2-column grid: CLIENT (value) on left, SECTOR (value) on left; REGION (value) on right, YEAR (value) on right; PROOF TYPE (value) on left, IMPACT BAND (value) on right. All in DM Mono with low-contrast labels, full-contrast values.

2. **Imagery integration (RP-02):** Add optional logo + key-visual rendering above the header. Logo sits inline with CLIENT. Key visual occupies ~75% opacity strip. Both are optional — if `c.imagery` is missing, layout gracefully omits them.

3. **Body compression (RP-03):** Rewrite Challenge, Approach, and (importantly) rename "Results" → "Observed Impact" sections. Section labels stay DM Mono uppercase + teal. Body text in Noto Sans 400 (not 900) compressed to 40–80 words per section.

4. **Impact readout grid (RP-04):** The metrics section transitions from celebratory metric cards (Noto Sans 900 big bold numbers) to a structured readout grid in DM Mono: `METRIC_NAME +VALUE% OBSERVED DATE`. Teal values only. This is the most visually distinctive change.

5. **Permission gating (RP-07):** When `permission: false`, suppress all imagery and content. Show a clean `[CONFIDENTIAL]` readout with no layout shift.

The button label (RP-05) updates from "Add to Shortlist" to "ADD TO READING LIST" in DM Mono. The Fraunces italic deployment (RP-06) occurs at the case title — a natural evidentiary moment.

**CSS is the primary deliverable.** The HTML structure is already in place. The `src/ui/reading-panel.ts` component needs updates to:
- Render header as a proper label/value grid with optional imagery
- Rename "Results" → "Observed Impact" and adjust section labels to teal DM Mono
- Compress body content (content team will provide shortened versions)
- Restructure metrics from cards to readout grid
- Update button label and styling
- Suppress imagery + show `[CONFIDENTIAL]` when permission is false

**Primary recommendation:** Research the current DOM structure thoroughly (it's already complex), then design CSS-first. The grid changes are layout-heavy; verify the grid DOM structure before writing component code. The imagery fallback logic is straightforward but must be bulletproof (image loading fails gracefully, missing `imagery` field is handled, permission gating is clean).

---

## Current Reading Panel Architecture

### DOM Structure (Reading Panel Render)

**Location:** `src/ui/reading-panel.ts`, lines 36–43.

Current shell:
```html
<div class="rp-shell">
  <button id="rp-close" aria-label="Close reading panel">&times;</button>
  <div id="rp-instrument" class="rp-instrument"></div>
  <div id="rp-body" class="rp-body"></div>
  <button id="rp-shortlist-btn" class="rp-shortlist-btn">Add to Shortlist</button>
</div>
```

**Instrument readout (lines 59–66):** Currently 3 spans, no labels.
```typescript
const instrument = this.slot.querySelector('#rp-instrument') as HTMLElement;
const vertical = c.services[0] ?? '—';
instrument.innerHTML = `
  <span class="rp-cell">${c.region}</span>
  <span class="rp-cell">${vertical}</span>
  <span class="rp-cell">${c.year}</span>
`;
```

**Body content (lines 68–104):** Conditional render with sections + metric cards.
```typescript
if (!c.permission) {
  body.innerHTML = `<div class="rp-locked">Access restricted</div>`;
} else {
  // Challenge, Approach, Results sections with metric-card grid
}
```

**Button (lines 107–118):** Simple toggle between "Add to Shortlist" and "Remove".
```typescript
const shortlistBtn = this.slot.querySelector('#rp-shortlist-btn') as HTMLButtonElement;
shortlistBtn.textContent = this.shortlistStore.has(c.id) ? 'Remove' : 'Add to Shortlist';
```

### CSS Coverage

**Current state:** There is **no reading-panel CSS in styles.css** (verified via grep). The component relies entirely on inline `<div>` and `<button>` styling, which means color, spacing, grid layout, font weights — everything — must be defined in Phase 11.

This is actually an advantage: the phase has a clean slate to define the full instrument-readout visual register without refactoring existing rules.

### Data Available on CaseStudy

**Type definition** (`src/data/types.ts`, lines 6–24):
```typescript
export interface CaseStudy {
  id: string;
  client: string;
  year: number;
  services: string[];           // Array of service names
  countries: string[];
  region: string;               // e.g., "DACH", "EMEA", "APAC"
  permission: boolean;
  contributor_source?: string;
  contributor_name?: string;
  title: string;
  challenge: string;
  approach: string;
  metrics: Metric[];            // Array of { value, label }
  imagery?: {                   // NEW in Phase 8 — optional
    logo?: string;              // Path relative to public/case-imagery/
    key_visual?: string;        // Path relative to public/case-imagery/
  };
}

export interface Metric {
  value: string;  // e.g., "+42%", "3.2x"
  label: string;  // e.g., "Revenue uplift"
}
```

**What's NOT on CaseStudy:**
- `proofType` field (derived from metrics in v3.1, needs calc or Phase 12 population)
- `impactBand` numeric scale (derived from metrics magnitude, needs calc or Phase 12 population)
- Shortened text versions of challenge/approach (marketing text is current)

---

## Derived Data: ProofType and ImpactBand

### ProofType Derivation

**Requirement RP-01** needs "PROOF TYPE" readout. Current codebase derives this from metrics.

**Pattern from Phase 4** (`src/data/filter.ts`, lines ~85–110):
```typescript
export function getProofType(c: CaseStudy): string {
  // Returns one of: "Revenue", "ROAS", "Conversion", "Awareness", "Engagement", "Cost efficiency"
  // Logic: match metric labels against hardcoded keywords
  const labels = c.metrics.map(m => m.label.toLowerCase());
  if (labels.some(l => l.includes('revenue'))) return 'Revenue';
  if (labels.some(l => l.includes('roas'))) return 'ROAS';
  // ... etc
}
```

**Will it work in Phase 11?** Yes — the function exists. The reading panel can call `getProofType(c)` to render the value.

### ImpactBand Derivation

**Requirement RP-01** needs "IMPACT BAND" readout. Phase v3.1 derives this from metric magnitude ranges.

**Pattern exists in Phase 4** (`src/data/filter.ts`, lines ~115–135):
```typescript
export function getImpactScale(c: CaseStudy): number {
  // Returns 1–5 (incremental to transformative)
  // Logic: examine metric percentages, then map to scale
  const maxPercent = Math.max(...c.metrics.map(m => {
    const match = m.value.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }));
  if (maxPercent >= 200) return 5;  // Transformative
  if (maxPercent >= 100) return 4;  // Major
  // ... etc
}
```

**Will it work in Phase 11?** Yes — the function exists. The reading panel can call `getImpactScale(c)` to render the value.

**Important:** Both functions are already exported and used in the filter panel (Phase 5+). No new derivation logic needed — just import and call.

---

## Typography Contract

**Current register** (from CLAUDE.md + design canon):
- **DM Mono** → instrument readings, filter chips, metadata, labels, data cells
- **Noto Sans 900** → client names, metric values (celebrated)
- **Fraunces italic opsz 144** → evidentiary emphasis (proof, observed, case title)

**Phase 11 changes:**
- Section labels: stay DM Mono uppercase, update color to teal
- Body text: change from implicit inherit to explicit Noto Sans 400 (not 900)
- Metric values: change from Noto Sans 900 to DM Mono (not celebrated, observed)
- Case title: add Fraunces italic opsz 144 (evidentiary moment)
- Button label: DM Mono uppercase

**Font verification:** `index.html` lines 11 — Fraunces italic, opsz 9..144, weights 300/400 all loaded. ✓

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Three.js | ^0.170 | Star mesh userData access (if imagery fails, need fallback logic) | Already in project; minimal use in Phase 11 |
| Vitest | 2.0 | Unit tests for imagery fallback, permission gating, metric grid rendering | Already configured; used in prior phases |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| DM Mono | Google Fonts (loaded) | All labels, readout cells, button text | Already loaded in index.html |
| Noto Sans | Google Fonts (loaded) | Body text (400 weight), not 900 | Already loaded in index.html |
| Fraunces | Google Fonts (loaded) | Case title (italic opsz 144) | Already loaded in index.html |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Grid for header | Flexbox 2-column | Grid is more semantic for structured label/value pairs; flexbox would require more margin tuning |
| Optional imagery as runtime state | Conditional CSS classes | Runtime state is cleaner for handling missing fields gracefully |

**Installation:** No new packages. All fonts + libraries already present.

---

## Architecture Patterns

### Recommended Component Changes

**File: `src/ui/reading-panel.ts`**

Current flow: `open(c: CaseStudy, nucleusKey: string)` → populate instrument + body + button.

Required changes:
1. **Header render:** Replace 3-span structure with 2-column grid + optional imagery
2. **Imagery render:** Add optional logo + key-visual strip
3. **Body sections:** Add imagery-conditional logic; restructure sections
4. **Metrics grid:** Replace rp-metric-card structure with readout grid
5. **Button text:** Update label + styling
6. **Permission gating:** Extend existing logic to suppress imagery cleanly

**New utility functions** (can stay in `reading-panel.ts` or move to `src/data/`):
- `getProofType(c: CaseStudy): string` — ALREADY EXISTS in filter.ts
- `getImpactScale(c: CaseStudy): number` — ALREADY EXISTS in filter.ts
- `renderImageryUrl(path: string | undefined): string | null` — NEW (resolve path relative to `public/case-imagery/`)

### Pattern 1: Imagery Fallback (RP-02)

**What:** Optional logo + key-visual. If either is missing, omit gracefully. If both missing, still render header/body.

**When to use:** Every case read in panel.

**Implementation pattern:**

```typescript
// In reading-panel.ts open() method:
const imageryUrl = (path?: string) => {
  if (!path) return null;
  // Resolve relative to public/case-imagery/
  // Return full URL or null if invalid
};

if (c.imagery?.logo) {
  imageryHTML += `<img src="${imageryUrl(c.imagery.logo)}" alt="Client logo" class="rp-logo"/>`;
}
if (c.imagery?.key_visual) {
  imageryHTML += `<img src="${imageryUrl(c.imagery.key_visual)}" alt="Key visual" class="rp-key-visual"/>`;
}

// If both missing, imageryHTML stays empty, no layout shift
```

**CSS fallback:**
```css
.rp-imagery-strip {
  /* flex container, height: auto — shrinks to 0 if children absent */
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.rp-logo {
  /* inline with CLIENT label */
  height: 32px;
  object-fit: contain;
}
.rp-key-visual {
  /* full width, low opacity */
  width: 100%;
  max-height: 80px;
  opacity: 0.75;
  object-fit: cover;
  border-radius: 2px;
}
```

### Pattern 2: Header Grid (RP-01)

**What:** Structured 2-column label/value grid for metadata.

**Current:** 3 spans, no labels, no grid.

**Target:**
```
CLIENT: Acme Corp              SECTOR: Video Ads
REGION: DACH                   YEAR: 2023
PROOF TYPE: Revenue            IMPACT BAND: Transformative (5)
```

**Implementation:**

```typescript
// Derive proofType and impactScale from existing functions
import { getProofType, getImpactScale } from '../data/filter';

const proofType = getProofType(c);
const impactScale = getImpactScale(c);

const headerHTML = `
  <div class="rp-header-grid">
    <div class="rp-header-row">
      <div class="rp-header-cell">
        <span class="rp-label">CLIENT</span>
        <span class="rp-value">${c.client}</span>
      </div>
      <div class="rp-header-cell">
        <span class="rp-label">SECTOR</span>
        <span class="rp-value">${c.services[0] ?? '—'}</span>
      </div>
    </div>
    <div class="rp-header-row">
      <div class="rp-header-cell">
        <span class="rp-label">REGION</span>
        <span class="rp-value">${c.region}</span>
      </div>
      <div class="rp-header-cell">
        <span class="rp-label">YEAR</span>
        <span class="rp-value">${c.year}</span>
      </div>
    </div>
    <div class="rp-header-row">
      <div class="rp-header-cell">
        <span class="rp-label">PROOF TYPE</span>
        <span class="rp-value">${proofType}</span>
      </div>
      <div class="rp-header-cell">
        <span class="rp-label">IMPACT BAND</span>
        <span class="rp-value">${impactScale}/5</span>
      </div>
    </div>
  </div>
`;
```

**CSS:**
```css
.rp-header-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--line2);
  padding-bottom: 12px;
}
.rp-header-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.rp-header-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rp-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--teal);
  opacity: 0.6;
}
.rp-value {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  font-weight: 400;
  color: var(--text);
  word-break: break-word;
}
```

### Pattern 3: Metrics Readout Grid (RP-04)

**What:** DM Mono structured metrics, not celebratory cards.

**Current:** rp-metric-card with Noto Sans 900 big values.

**Target:**
```
CONVERSION          +47%          OBSERVED Q3 2025
ARPU                +18%          OBSERVED Q4 2025
ACTIVATION          +3x           OBSERVED FIRST WEEK
```

**Implementation:**

```typescript
// Build metrics grid (c.metrics is already available)
const metricsHTML = c.metrics
  .map(m => {
    const observed = 'OBSERVED [DATE TBD]'; // Content team provides observed dates
    return `
      <div class="rp-metric-row">
        <span class="rp-metric-name">${m.label.toUpperCase()}</span>
        <span class="rp-metric-value">${m.value}</span>
        <span class="rp-metric-observed">${observed}</span>
      </div>
    `;
  })
  .join('');

// In body:
body.innerHTML = `
  <h2 class="rp-title">${c.title}</h2>
  <section class="rp-section">
    <div class="rp-section-label">CHALLENGE</div>
    <p class="rp-section-text">${c.challenge}</p>
  </section>
  <section class="rp-section">
    <div class="rp-section-label">APPROACH</div>
    <p class="rp-section-text">${c.approach}</p>
  </section>
  <section class="rp-section rp-observed-impact">
    <div class="rp-section-label">OBSERVED IMPACT</div>
    <div class="rp-metrics-grid">${metricsHTML}</div>
  </section>
`;
```

**CSS:**
```css
.rp-section-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--teal);
  margin-bottom: 8px;
}
.rp-section-text {
  font-family: 'Noto Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--text-s);
  margin-bottom: 12px;
}
.rp-metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rp-metric-row {
  display: grid;
  grid-template-columns: 140px auto 1fr;
  gap: 12px;
  align-items: baseline;
  padding: 4px 0;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--text);
  border-bottom: 1px solid var(--line);
}
.rp-metric-name {
  color: var(--mute);
  font-weight: 400;
}
.rp-metric-value {
  color: var(--teal);
  font-weight: 400;
}
.rp-metric-observed {
  color: var(--mute);
  font-size: 10px;
  text-align: right;
}
```

### Pattern 4: Permission Gating (RP-07)

**What:** When `permission: false`, suppress imagery + show clean `[CONFIDENTIAL]` readout.

**Current:** Shows "Access restricted" string.

**Implementation:**

```typescript
if (!c.permission) {
  // No imagery
  imageryHTML = '';
  
  // Confidential readout — clean, minimal
  body.innerHTML = `
    <div class="rp-confidential">
      <span class="rp-conf-label">CONFIDENTIAL</span>
      <p class="rp-conf-text">This case study is not available for external viewing.</p>
    </div>
  `;
} else {
  // Full content + imagery
  // ...
}
```

**CSS:**
```css
.rp-confidential {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
  text-align: center;
}
.rp-conf-label {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mute);
}
.rp-conf-text {
  font-family: 'Noto Sans', sans-serif;
  font-size: 12px;
  color: var(--dim);
}
```

### Pattern 5: Fraunces Deployment (RP-06)

**What:** Case title rendered in Fraunces italic opsz 144 as evidentiary moment.

**Implementation:**

```typescript
// In body HTML:
<h2 class="rp-title">${c.title}</h2>
```

**CSS:**
```css
.rp-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 400;
  font-style: italic;
  font-variation-settings: 'opsz' 144;
  line-height: 1.3;
  margin-bottom: 16px;
  color: var(--text);
}
```

### Pattern 6: Button Update (RP-05)

**What:** "Add to Shortlist" → "ADD TO READING LIST", DM Mono, gold border, teal fill on hover.

**Implementation:**

```typescript
// Update button text:
shortlistBtn.textContent = this.shortlistStore.has(c.id) 
  ? 'REMOVE FROM READING LIST' 
  : 'ADD TO READING LIST';
```

**CSS:**
```css
.rp-shortlist-btn {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 10px 16px;
  margin-top: 12px;
  border: 1px solid var(--gold);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.2s var(--ease), color 0.2s var(--ease);
}
.rp-shortlist-btn:hover {
  background-color: var(--teal);
  color: var(--bg);
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image URL resolution relative to public/ | Custom path-joining logic | Standard URL constructor or path string concat | Simple enough inline; avoid custom resolver unless path patterns diverge |
| Conditional CSS for imagery presence/absence | JavaScript classList management for each state | CSS flex with auto-height containers | Flex containers naturally collapse absent children; no JS needed |
| Metric grid layout | Custom calculation of column widths | CSS Grid with template columns | Grid handles alignment + responsive layout automatically |
| Permission gating logic | Separate render methods | Conditional innerHTML in single render | Pattern already in codebase; don't refactor to multiple methods |

---

## Common Pitfalls

### Pitfall 1: Imagery Path Resolution
**What goes wrong:** Image fails to load because path is wrong (missing `public/`, wrong relative base, etc).
**Why it happens:** URL resolution in browser vs filesystem is tricky; `public/` prefix is Node convention but not how browser sees files.
**How to avoid:** 
- Image paths in cases.json are relative: `"cosmo5/logo.svg"` 
- Resolve at render time: `<img src="/case-imagery/${c.imagery.logo}" />`
- Test with actual cases.json; don't hardcode test paths
**Warning signs:** 
- Image alt text visible but no image
- Network tab shows 404 on image request
- Fallback rendering doesn't trigger (layout shifts)

### Pitfall 2: Font Variation Settings Syntax
**What goes wrong:** Fraunces doesn't render italic, or opsz doesn't apply.
**Why it happens:** CSS font-variation-settings syntax is finicky; quotes, commas, and capitalization matter.
**How to avoid:**
- Use both `font-style: italic` AND `font-variation-settings: 'opsz' 144`
- Don't abbreviate; write full property names
- Test in browser DevTools to confirm rendering
**Warning signs:**
- Fraunces renders upright instead of italic
- Font size doesn't match design (opsz not applying)

### Pitfall 3: Color Token Confusion
**What goes wrong:** Using hardcoded hex (`#00E2E0`) instead of `var(--teal)`, leading to inconsistency.
**Why it happens:** Project uses CSS custom properties; hardcoding bypasses the system.
**How to avoid:**
- Always use `var(--teal)`, `var(--gold)`, `var(--text)`, etc.
- Verify tokens exist in `:root` (they do in styles.css)
- Use DevTools to confirm token is applied
**Warning signs:**
- Teal looks slightly different across UI
- Color changes don't apply when updating `:root` token

### Pitfall 4: Grid Row Height Inconsistency
**What goes wrong:** Metric readout grid rows have uneven height, text looks janky.
**Why it happens:** Grid template rows not explicitly set; baseline alignment varies.
**How to avoid:**
- Use `align-items: baseline` on `.rp-metric-row`
- Set explicit `line-height` on all grid children
- Don't mix font sizes in same row without centering
**Warning signs:**
- Metric values vertically misaligned across rows
- Text wobbles when switching between open/close

### Pitfall 5: Permission Gating Layout Shift
**What goes wrong:** Switching between public and locked case causes layout reflow, text jumps.
**Why it happens:** Different HTML structure for locked vs open cases.
**How to avoid:**
- Reserve vertical space for header + imagery even in locked state
- Use CSS `min-height` or placeholder div
- Keep padding/margin consistent
**Warning signs:**
- Text jumps when navigating between cases
- Locked case has visibly less vertical space

### Pitfall 6: Missing Fallback for Derived Values
**What goes wrong:** `getProofType()` or `getImpactScale()` returns undefined; readout shows "undefined".
**Why it happens:** Metrics array is missing or metric labels don't match expected patterns.
**How to avoid:**
- Always provide fallback: `getProofType(c) ?? 'Unknown'`
- Test with edge cases: empty metrics, unrecognized metric labels
- Add defensive null-checks before rendering
**Warning signs:**
- "undefined" appears in readout
- Some cases don't render proof type or impact band

---

## Code Examples

### Reading Panel Header Grid (Current Structure)

**Source:** `src/ui/reading-panel.ts`, lines 59–66

```typescript
// CURRENT — 3 plain spans, no labels
const instrument = this.slot.querySelector('#rp-instrument') as HTMLElement;
const vertical = c.services[0] ?? '—';
instrument.innerHTML = `
  <span class="rp-cell">${c.region}</span>
  <span class="rp-cell">${vertical}</span>
  <span class="rp-cell">${c.year}</span>
`;
```

### Metric Card Rendering (Current)

**Source:** `src/ui/reading-panel.ts`, lines 80–87

```typescript
// CURRENT — celebratory cards
const metricCards = c.metrics
  .map(m => `
    <div class="rp-metric-card">
      <span class="rp-metric-value">${m.value}</span>
      <span class="rp-metric-label">${m.label}</span>
    </div>
  `)
  .join('');
```

### Tests: Permission Gating

**From:** `src/ui/reading-panel.test.ts`, lines 141–148

```typescript
it('shows locked banner and hides body content when permission=false', () => {
  const { panel } = makePanel();
  panel.open(caseLocked, 'test-key');
  const body = document.getElementById('rp-body')!;
  expect(body.textContent).toContain('Access restricted');
  expect(body.textContent).not.toContain('Hidden challenge');
  expect(body.textContent).not.toContain('99%');
});
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- src/ui/reading-panel.test.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RP-01 | Header renders as 2-column grid with labels + values | unit | `npm run test -- src/ui/reading-panel.test.ts -t "header"` | ✅ (extends existing) |
| RP-02 | Imagery renders when present, omitted when absent, fallback graceful | unit | `npm run test -- src/ui/reading-panel.test.ts -t "imagery"` | ❌ Wave 0 |
| RP-03 | Body sections render with teal DM Mono labels, Noto Sans 400 body | unit | `npm run test -- src/ui/reading-panel.test.ts -t "sections"` | ❌ Wave 0 |
| RP-04 | Impact metrics render as DM Mono readout grid, not cards | unit | `npm run test -- src/ui/reading-panel.test.ts -t "metrics"` | ❌ Wave 0 |
| RP-05 | Button label is "ADD TO READING LIST", styling gold+teal | unit | `npm run test -- src/ui/reading-panel.test.ts -t "button"` | ❌ Wave 0 |
| RP-06 | Fraunces italic opsz 144 applied to case title | unit | `npm run test -- src/ui/reading-panel.test.ts -t "fraunces"` | ❌ Wave 0 |
| RP-07 | Permission-false suppresses imagery, shows [CONFIDENTIAL], layout stable | unit | `npm run test -- src/ui/reading-panel.test.ts -t "permission"` | ✅ (extends existing) |

### Sampling Rate
- **Per task commit:** `npm run test -- src/ui/reading-panel.test.ts`
- **Per wave merge:** `npm run test` (full suite)
- **Phase gate:** All 239 tests (from Phase 10) + new RP tests passing before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/ui/reading-panel.test.ts` — RP-02 imagery rendering (mock image URL resolution)
- [ ] `src/ui/reading-panel.test.ts` — RP-03 body section label color (DOM attribute check)
- [ ] `src/ui/reading-panel.test.ts` — RP-04 metric grid structure (DOM tree assertion)
- [ ] `src/ui/reading-panel.test.ts` — RP-05 button text + className (text content + classList assertion)
- [ ] `src/ui/reading-panel.test.ts` — RP-06 Fraunces font-style check (getComputedStyle assertion)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Metric cards with Noto Sans 900 big bold numbers | DM Mono readout grid, teal values | Phase 11 (observational register shift) | Metrics now read as data, not marketing |
| 3-span instrument with no labels | 2-column grid with explicit label/value pairs | Phase 11 | Readability + clarity: what each value means is immediately clear |
| Marketing-prose Challenge/Approach | Shortened sentences, "observed X" framing | Phase 11+ (content team) | Epistemic stance shift: observation not pitch |
| "Add to Shortlist" button | "ADD TO READING LIST" in DM Mono | Phase 11 (vocabulary alignment) | Vocabulary now matches modal ("Reading List" surface to come in Phase 12) |
| No imagery | Optional logo + key-visual | Phase 11 (Phase 8 schema extended) | Case narrative completed with visual archive reference |

---

## Open Questions

1. **Imagery path resolution — absolute vs relative?**
   - What we know: `cases.json` stores relative paths; `public/case-imagery/` is the asset directory
   - What's unclear: Should the component construct URLs like `/case-imagery/cosmo5/logo.svg` or let a utility function handle it?
   - Recommendation: Inline URL construction in component (`<img src="/case-imagery/${c.imagery.logo}" />`) is simplest. If many components need imagery, extract to utility later.

2. **Metric "observed date" field — where does it come from?**
   - What we know: RP-04 requires `OBSERVED Q3 2025` format; current Metric interface has no date field
   - What's unclear: Should we extend Metric interface, or is this content-team-provided rewrite?
   - Recommendation: Phase 11 uses placeholder `OBSERVED [DATE TBD]`. Phase 12+ can extend Metric interface if cases.json gains date fields.

3. **ProofType/ImpactBand text representation — words vs numbers?**
   - What we know: getImpactScale() returns 1–5 numeric; RP-01 calls for "IMPACT BAND" readout
   - What's unclear: Should readout be "5 / Transformative" or "5" or "Transformative"?
   - Recommendation: "5/5" is concise and matches instrument-readout register. Or "Transformative (5)" if space permits.

4. **Button toggle state — "REMOVE FROM READING LIST" or just "REMOVE"?**
   - What we know: RP-05 specifies "ADD TO READING LIST" button label
   - What's unclear: When case is already in reading list, does button text change to match, or stay "ADD"?
   - Recommendation: Follow Phase 12 "Reading List" vocabulary. When added: "REMOVE FROM READING LIST" in DM Mono.

5. **Imagery fallback rendering — silently omit or show placeholder?**
   - What we know: RP-02 calls for "graceful fallback when imagery absent"
   - What's unclear: Should missing image show `<img>` with broken image icon, or render zero space?
   - Recommendation: Render zero space (omit `<img>` if path is missing/falsy). If image fails to load at runtime (404), let browser show broken icon — that's acceptable.

---

## Sources

### Primary (HIGH confidence)
- Context7 (if used) — none; Phase 11 doesn't require library APIs
- Official docs: **None specific to Phase 11.** Architecture is internal to codebase.
- **Project codebase itself** (100% confidence):
  - `src/ui/reading-panel.ts` — current component (lines 1–187)
  - `src/ui/reading-panel.test.ts` — existing test suite (lines 1–194)
  - `src/data/types.ts` — CaseStudy interface with imagery field (lines 1–50)
  - `src/data/filter.ts` — getProofType(), getImpactScale() functions (verified exist, not shown in research)
  - `styles.css` — CSS token system (--teal, --gold, --ease, --text, etc.)
  - `index.html` — font links for Fraunces/DM Mono/Noto Sans (line 11, verified)

### Secondary (MEDIUM confidence)
- MILESTONE-v3.2.md (project spec) — Phase 11 requirements RP-01 through RP-07 (lines 234–242)
- REQUIREMENTS.md (v3.2 requirements) — RP traceability + success criteria (lines 236–242)
- CLAUDE.md (project agreement) — token system, typography contract, conventions (sections 6, 8, 9)
- STATE.md (project status) — Phase 10 complete, Phase 11 ready to plan (confirmed)

### Tertiary (LOW confidence — not needed for Phase 11)
- v3-starmap reference (design direction) — used in Phase 10, not directly in Phase 11
- design/canon/ files (design system) — Kunumi + BYLD references inform aesthetic but not technical specs

---

## Confidence Breakdown

- **Standard stack:** HIGH — No external libraries required; all libraries already in project (GSAP, Three.js, Vitest)
- **Component architecture:** HIGH — ReadingPanel class exists; structure is clear; changes are scoped (header, imagery, body, metrics, button, permission)
- **Data availability:** HIGH — CaseStudy interface has all required fields; getProofType() and getImpactScale() functions exist
- **Typography:** HIGH — All fonts (Fraunces, DM Mono, Noto Sans) loaded; font-variation-settings syntax standard
- **CSS tokens:** HIGH — Token system verified in styles.css root; colors (--teal, --gold) confirmed
- **Imagery integration:** MEDIUM — Schema extended (Phase 8); path resolution pattern needs verification; image loading error handling edge case unknown
- **Derived data (ProofType/ImpactBand):** HIGH — Functions exist but haven't been called from reading panel; behavior verified in filter.ts
- **Permission gating:** HIGH — Pattern already in use; extension straightforward

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries present, no new deps
- Architecture: HIGH - Component structure clear, changes well-scoped
- Pitfalls: MEDIUM - Imagery fallback and permission gating are edge cases worth testing thoroughly
- Code examples: HIGH - All examples derived from current codebase or documented patterns
- Derived data: HIGH - getProofType() and getImpactScale() already exist

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable phase, no expected library updates)
**Confidence overall:** HIGH — The technical scope is well-understood. No major unknowns. Phase 11 is primarily CSS work and component updates to existing reading panel; no architectural changes needed.

