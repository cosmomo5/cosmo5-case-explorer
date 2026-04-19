// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountFilterPanel } from './filter-panel';
import { createFilterState } from '../data/filter';
import type { SceneObjects } from '../scene/scene-state';
import { ProofType } from '../data/proof-type';
import type { EnrichedCaseStudy } from '../data/enrich';

// ── Minimal fixtures ──────────────────────────────────────────────────────────

const e1: EnrichedCaseStudy = {
  id: 'A', client: 'X', year: 2023,
  services: ['Video Ads', 'SEA'], countries: ['Spain', 'France'],
  region: 'Europe', permission: true, title: '', challenge: '', approach: '', metrics: [],
  proofType: ProofType.Revenue,
  impactScale: { value: 0.6, band: 'significant', maxPct: 150 },
};
const e2: EnrichedCaseStudy = {
  id: 'B', client: 'Y', year: 2022,
  services: ['Amazon'], countries: ['US'],
  region: 'Americas', permission: false, title: '', challenge: '', approach: '', metrics: [],
  proofType: ProofType.Awareness,
  impactScale: { value: 0.1, band: 'incremental', maxPct: 10 },
};

// Minimal SceneObjects stub — only fields used by filter-panel.ts
function makeObjects(overrides: Partial<SceneObjects> = {}): SceneObjects {
  return {
    nucleusMeshes: new Map(),
    nucleusLabels: new Map(),
    starMeshes: [],
    starOrbits: [],
    nucleusOrbits: {
      Media: {
        key: 'Media',
        center: { x: 0, y: 0, z: 0 },
        orbitU: { x: 1, y: 0, z: 0 },
        orbitV: { x: 0, y: 1, z: 0 },
        orbitR: 100,
        phase: 0,
        speed: 0,
        cases: [e1, e2],
      },
    },
    filterState: createFilterState(),
    mode: 'global',
    focusedKey: null,
    groupMode: 'vertical',
    ringLineMeshes: [],
    ringLineValues: [],
    ringLabelEls: [],
    highlightedRingValue: null,
    currentRingDimension: null,
    _ringWasHighlighted: false,
    ...overrides,
  } as unknown as SceneObjects;
}

function makeContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('mountFilterPanel — accordion structure (global mode)', () => {
  let container: HTMLElement;
  let objects: SceneObjects;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = makeContainer();
    objects = makeObjects();
  });

  it('renders 5 accordion groups with correct data-dim attributes', () => {
    mountFilterPanel(container, objects, vi.fn());
    const groups = container.querySelectorAll('.fgroup[data-dim]');
    expect(groups).toHaveLength(5);
    const dims = Array.from(groups).map(g => (g as HTMLElement).dataset.dim);
    expect(dims).toContain('countries');
    expect(dims).toContain('services');
    expect(dims).toContain('years');
    expect(dims).toContain('proofTypes');
    expect(dims).toContain('impactBands');
  });

  it('each accordion group has a fgroup-header button with aria-expanded="false" by default', () => {
    mountFilterPanel(container, objects, vi.fn());
    const headers = container.querySelectorAll('.fgroup-header');
    expect(headers.length).toBeGreaterThanOrEqual(5);
    headers.forEach(h => {
      expect(h.getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('clicking fgroup-header toggles data-open on the group and sets aria-expanded correctly', () => {
    mountFilterPanel(container, objects, vi.fn());
    const group = container.querySelector('.fgroup[data-dim="countries"]') as HTMLElement;
    const header = group.querySelector('.fgroup-header') as HTMLButtonElement;

    // Initially closed
    expect(group.hasAttribute('data-open')).toBe(false);
    expect(header.getAttribute('aria-expanded')).toBe('false');

    header.click();
    expect(group.hasAttribute('data-open')).toBe(true);
    expect(header.getAttribute('aria-expanded')).toBe('true');

    // Click again — closes
    header.click();
    expect(group.hasAttribute('data-open')).toBe(false);
    expect(header.getAttribute('aria-expanded')).toBe('false');
  });

  // Orbit-by switcher test removed per Phase 18 D-13: mode-row removed, grouping switcher moved to bottom-right panel
});

describe('mountFilterPanel — chip dim/on states', () => {
  it('chips with count=0 get class "dim"; chips with count>0 do not', () => {
    document.body.innerHTML = '';
    const container = makeContainer();
    // One case that only covers Spain/Video Ads/2023/Revenue/significant
    // When filter has countries=US active: count for Spain under country cross-filter uses full set (removes country dim)
    // Use a filter with years=2022 active so that Spain (year=2023) has 0 cross-filter count in years dim
    const objects = makeObjects();
    objects.filterState.years.add(2022); // only e2 passes years filter
    mountFilterPanel(container, objects, vi.fn());

    // Open the countries accordion to render chips
    const countriesGroup = container.querySelector('.fgroup[data-dim="countries"]') as HTMLElement;
    const header = countriesGroup.querySelector('.fgroup-header') as HTMLButtonElement;
    header.click();

    const chips = countriesGroup.querySelectorAll('.fchip');
    expect(chips.length).toBeGreaterThan(0);

    // France and Spain are not in e2 (years=2022, countries=US) so their cross-filter count = 0
    const spainChip = Array.from(chips).find(c => (c as HTMLElement).dataset.value === 'Spain');
    const usChip = Array.from(chips).find(c => (c as HTMLElement).dataset.value === 'US');
    expect(spainChip).not.toBeUndefined();
    expect(usChip).not.toBeUndefined();
    expect(spainChip!.classList.contains('dim')).toBe(true);  // Spain=0 when years=2022
    expect(usChip!.classList.contains('dim')).toBe(false);    // US=1 (e2 has US)
  });

  it('chips in active filter set get class "on"', () => {
    document.body.innerHTML = '';
    const container = makeContainer();
    const objects = makeObjects();
    objects.filterState.countries.add('Spain');
    mountFilterPanel(container, objects, vi.fn());

    const countriesGroup = container.querySelector('.fgroup[data-dim="countries"]') as HTMLElement;
    const header = countriesGroup.querySelector('.fgroup-header') as HTMLButtonElement;
    header.click();

    const chips = countriesGroup.querySelectorAll('.fchip');
    const spainChip = Array.from(chips).find(c => (c as HTMLElement).dataset.value === 'Spain');
    expect(spainChip!.classList.contains('on')).toBe(true);
  });
});

describe('mountFilterPanel — status bar', () => {
  it('status bar is absent when filter is inactive', () => {
    document.body.innerHTML = '';
    const container = makeContainer();
    const objects = makeObjects();
    mountFilterPanel(container, objects, vi.fn());
    const statusBar = container.querySelector('.filter-status');
    expect(statusBar).toBeNull();
  });

  it('status bar shows "N / total" text when filter is active', () => {
    document.body.innerHTML = '';
    const container = makeContainer();
    const objects = makeObjects();
    objects.filterState.countries.add('Spain'); // e1 matches, e2 doesn't → 1/2
    mountFilterPanel(container, objects, vi.fn());
    const statusBar = container.querySelector('.filter-status');
    expect(statusBar).not.toBeNull();
    const text = statusBar!.textContent;
    expect(text).toMatch(/1\s*\/\s*2/);
  });

  it('reset button click clears filter and re-renders without status bar', () => {
    document.body.innerHTML = '';
    const container = makeContainer();
    const objects = makeObjects();
    objects.filterState.countries.add('Spain');
    mountFilterPanel(container, objects, vi.fn());

    const resetBtn = container.querySelector('#filterClear') as HTMLButtonElement;
    expect(resetBtn).not.toBeNull();
    resetBtn.click();

    // After reset, filter should be inactive
    expect(objects.filterState.isActive()).toBe(false);
    expect(container.querySelector('.filter-status')).toBeNull();
  });
});

// Mode-row tests removed per Phase 18 D-13: grouping switcher moved to bottom-right panel
// (Tests re-added in Plan 18-06 as part of unified-column test suite)

describe('mountFilterPanel — focused mode', () => {
  it('renders accordion groups in focused mode (no orbit-by switcher)', () => {
    document.body.innerHTML = '';
    const container = makeContainer();
    const objects = makeObjects({
      mode: 'focused',
      focusedKey: 'Media',
    } as Partial<SceneObjects>);
    mountFilterPanel(container, objects, vi.fn());

    // 5 accordion groups still present in focused mode
    const groups = container.querySelectorAll('.fgroup[data-dim]');
    expect(groups.length).toBeGreaterThanOrEqual(5);

    // No orbit-by switcher in focused mode — Back button shown instead
    const modeRow = container.querySelector('.mode-row');
    expect(modeRow).toBeNull();
    const backBtn = container.querySelector('#filtersBack');
    expect(backBtn).not.toBeNull();
  });
});
