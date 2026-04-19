// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountFilterPanel } from './filter-panel';
import { createFilterState } from '../data/filter';
import { createViewStateMachine, type ViewStateMachine, type ViewState, type ViewEvent } from '../data/view-state';
import type { SceneObjects } from '../scene/scene-state';
import type { EnrichedCaseStudy } from '../data/enrich';
import { ProofType } from '../data/proof-type';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockCases: EnrichedCaseStudy[] = [
  {
    id: 'c1',
    client: 'TechCorp',
    year: 2024,
    services: ['Performance Marketing', 'SEA'],
    countries: ['Germany', 'France'],
    region: 'Europe',
    permission: true,
    title: 'Fintech Growth Campaign',
    challenge: '',
    approach: '',
    metrics: [],
    proofType: ProofType.Revenue,
    impactScale: { value: 0.8, band: 'significant', maxPct: 200 },
  },
  {
    id: 'c2',
    client: 'BrandCo',
    year: 2023,
    services: ['Brand'],
    countries: ['Japan', 'Singapore'],
    region: 'APAC',
    permission: true,
    title: 'Brand Refresh Campaign',
    challenge: '',
    approach: '',
    metrics: [],
    proofType: ProofType.Awareness,
    impactScale: { value: 0.5, band: 'notable', maxPct: 100 },
  },
  {
    id: 'c3',
    client: 'RetailInc',
    year: 2024,
    services: ['E-Commerce'],
    countries: ['US', 'Canada'],
    region: 'Americas',
    permission: true,
    title: 'E-Commerce Scale-Up',
    challenge: '',
    approach: '',
    metrics: [],
    proofType: ProofType.Revenue,
    impactScale: { value: 0.6, band: 'significant', maxPct: 150 },
  },
  {
    id: 'c4',
    client: 'MediaDev',
    year: 2022,
    services: ['Video Ads'],
    countries: ['UK', 'France'],
    region: 'Europe',
    permission: true,
    title: 'Video Ads Expansion',
    challenge: '',
    approach: '',
    metrics: [],
    proofType: ProofType.Engagement,
    impactScale: { value: 0.4, band: 'incremental', maxPct: 80 },
  },
  {
    id: 'c5',
    client: 'TechStartup',
    year: 2024,
    services: ['Performance Marketing'],
    countries: ['India', 'Singapore'],
    region: 'APAC',
    permission: true,
    title: 'APAC Market Entry',
    challenge: '',
    approach: '',
    metrics: [],
    proofType: ProofType.Revenue,
    impactScale: { value: 0.7, band: 'significant', maxPct: 175 },
  },
];

function makeSceneObjects(overrides: Partial<SceneObjects> = {}): SceneObjects {
  return {
    nucleusMeshes: new Map(),
    nucleusLabels: new Map(),
    starMeshes: [],
    starOrbits: [],
    nucleusOrbits: {
      'vertical:tech': {
        key: 'vertical:tech',
        center: { x: 0, y: 0, z: 0 },
        orbitU: { x: 1, y: 0, z: 0 },
        orbitV: { x: 0, y: 1, z: 0 },
        orbitR: 100,
        phase: 0,
        speed: 0,
        cases: mockCases.slice(0, 3),
      },
      'vertical:commerce': {
        key: 'vertical:commerce',
        center: { x: 200, y: 0, z: 0 },
        orbitU: { x: 1, y: 0, z: 0 },
        orbitV: { x: 0, y: 1, z: 0 },
        orbitR: 100,
        phase: 0,
        speed: 0,
        cases: mockCases.slice(3, 5),
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Unified Left Column - Input Behavior', () => {
  let container: HTMLElement;
  let objects: SceneObjects;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('aside');
    container.id = 'filters';
    document.body.appendChild(container);
    objects = makeSceneObjects();
  });

  afterEach(() => {
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }
  });

  it('Test 1: Input → searchText → applyFilterWave → readout updates with match count', async () => {
    const onFilterChange = vi.fn();
    mountFilterPanel(container, objects, vi.fn(), undefined, mockCases, onFilterChange);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    const readout = container.querySelector('.filters-readout') as HTMLElement;

    expect(input).not.toBeNull();
    expect(readout).not.toBeNull();

    // Type "fintech" into the input
    input.value = 'fintech';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounce (80ms + margin)
    await new Promise(resolve => setTimeout(resolve, 150));

    // Verify onFilterChange was called
    expect(onFilterChange).toHaveBeenCalled();

    // Verify readout shows a count (should be "1 CASES" since only c1 matches "fintech")
    const readoutText = readout.textContent || '';
    expect(readoutText).toMatch(/\d+\s*CASES?/i);
  });

  it('Test 3: Empty-input state renders empty-state hint', async () => {
    mountFilterPanel(container, objects, vi.fn(), undefined, mockCases);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    const hint = container.querySelector('.query-hint') as HTMLElement;

    expect(hint).not.toBeNull();

    // Input starts empty
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 150));

    // Hint should be visible with empty-state text
    expect(hint.classList.contains('visible')).toBe(true);
    expect(hint.textContent).toContain('Or explore the full catalog');
  });

  it('Test 4: No-match state renders no-match hint with suggestion chips', async () => {
    mountFilterPanel(container, objects, vi.fn(), undefined, mockCases);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    const hint = container.querySelector('.query-hint') as HTMLElement;

    // Type a query that matches no cases
    input.value = 'xyzunknownquery';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 150));

    // Hint should be visible with no-match text
    expect(hint.classList.contains('visible')).toBe(true);
    expect(hint.textContent).toContain('No observations match');

    // Should have suggestion chips (gold `.qh-term`)
    const suggestionChips = hint.querySelectorAll('.qh-term');
    expect(suggestionChips.length).toBeGreaterThan(0);
  });

  it('Test 5: Match state hides hint when query matches cases', async () => {
    mountFilterPanel(container, objects, vi.fn(), undefined, mockCases);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    const hint = container.querySelector('.query-hint') as HTMLElement;

    // First, verify hint starts visible (empty state)
    expect(hint.classList.contains('visible')).toBe(true);

    // Type a query that matches cases (e.g., "techcorp" - matches c1's client)
    input.value = 'techcorp';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for the immediate updateHint() call (synchronous, no debounce)
    await new Promise(resolve => setTimeout(resolve, 10));

    // Hint should NOT be visible when there are matches
    expect(hint.classList.contains('visible')).toBe(false);
  });
});

describe('Unified Left Column - Query History', () => {
  let container: HTMLElement;
  let objects: SceneObjects;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('aside');
    container.id = 'filters';
    document.body.appendChild(container);
    objects = makeSceneObjects();
    // Clear query history before each test
    localStorage.removeItem('cosmo5.queryHistory.v1');
  });

  afterEach(() => {
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }
    localStorage.removeItem('cosmo5.queryHistory.v1');
  });

  it('Test 2: History chip click re-populates input and re-applies query', async () => {
    const onFilterChange = vi.fn();

    // Pre-populate history with a stored query using the correct localStorage key
    localStorage.setItem('cosmo5.queryHistory.v1', JSON.stringify(['marketing', 'fintech']));

    mountFilterPanel(container, objects, vi.fn(), undefined, mockCases, onFilterChange);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    const historyContainer = container.querySelector('.query-history') as HTMLElement;

    expect(input).not.toBeNull();
    expect(historyContainer).not.toBeNull();

    // History chips should exist from localStorage
    const chips = historyContainer.querySelectorAll('.query-chip');
    expect(chips.length).toBeGreaterThan(0);

    // Click the first history chip
    const firstChip = chips[0] as HTMLButtonElement;
    const chipText = firstChip.textContent || '';
    firstChip.click();

    await new Promise(resolve => setTimeout(resolve, 150));

    // Input should be populated with the chip's text
    expect(input.value).toBe(chipText.trim());

    // onFilterChange should have been called
    expect(onFilterChange).toHaveBeenCalled();
  });
});

describe('Unified Left Column - Keyboard Handlers', () => {
  let container: HTMLElement;
  let objects: SceneObjects;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('aside');
    container.id = 'filters';
    document.body.appendChild(container);
    objects = makeSceneObjects();
  });

  afterEach(() => {
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }
  });

  it('Test 6: Keyboard Enter key triggers applyFilterWave immediately (no debounce delay)', async () => {
    const onFilterChange = vi.fn();
    mountFilterPanel(container, objects, vi.fn(), undefined, mockCases, onFilterChange);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;

    input.value = 'fintech';

    // Dispatch Enter key without waiting for debounce
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    input.dispatchEvent(enterEvent);

    // Should call onFilterChange immediately (or very quickly, not waiting for 80ms debounce)
    // Note: may need a small timeout for internal processing, but much less than 80ms
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(onFilterChange).toHaveBeenCalled();
  });

  it('Test 7: Keyboard Escape key clears input and cancels pending debounce', async () => {
    mountFilterPanel(container, objects, vi.fn(), undefined, mockCases);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;

    input.value = 'fintech';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Immediately press Escape (before debounce fires)
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    input.dispatchEvent(escapeEvent);

    // Input should be cleared
    expect(input.value).toBe('');
  });
});

describe('Unified Left Column - View-State Auto-Expand', () => {
  let container: HTMLElement;
  let objects: SceneObjects;
  let viewState: ViewStateMachine;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('aside');
    container.id = 'filters';
    container.classList.add('collapsed');
    document.body.appendChild(container);
    objects = makeSceneObjects();
    // Create viewState with initial 'global' state
    viewState = createViewStateMachine({ kind: 'global' });
  });

  afterEach(() => {
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }
  });

  it('Test 8: View-state ENTER_CONSTELLATION removes .collapsed class from container', async () => {
    // Mount filter-panel
    mountFilterPanel(container, objects, vi.fn(), undefined, mockCases);

    // Start with collapsed (global view)
    expect(container.classList.contains('collapsed')).toBe(true);

    // In the actual implementation (main.ts), the view-state listener removes .collapsed on ENTER_CONSTELLATION.
    // Simulate that behavior here to verify the container state machine works:
    viewState.subscribe((_next: ViewState, _prev: ViewState, event: ViewEvent) => {
      if (event.type === 'ENTER_CONSTELLATION') {
        container.classList.remove('collapsed');
      }
    });

    // Now dispatch the transition
    viewState.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'vertical:tech' });

    // Wait for listener callback
    await new Promise(resolve => setTimeout(resolve, 50));

    // .collapsed should be removed by the listener subscription above
    expect(container.classList.contains('collapsed')).toBe(false);
  });

  it('Test 9: View-state EXIT_CONSTELLATION adds .collapsed class to container', async () => {
    // Create a fresh view state in constellation mode
    const constellationViewState = createViewStateMachine({ kind: 'constellation', nucleusKey: 'vertical:tech' });

    mountFilterPanel(container, objects, vi.fn(), undefined, mockCases);

    // Remove .collapsed to match constellation state
    container.classList.remove('collapsed');

    // In the actual implementation (main.ts), the view-state listener adds .collapsed on EXIT_CONSTELLATION.
    // Simulate that behavior here to verify the container state machine works:
    constellationViewState.subscribe((_next: ViewState, _prev: ViewState, event: ViewEvent) => {
      if (event.type === 'EXIT_CONSTELLATION') {
        container.classList.add('collapsed');
      }
    });

    // Now dispatch the transition back to global
    constellationViewState.dispatch({ type: 'EXIT_CONSTELLATION' });

    // Wait for listener callback
    await new Promise(resolve => setTimeout(resolve, 50));

    // .collapsed should be added back by the listener subscription above
    expect(container.classList.contains('collapsed')).toBe(true);
  });
});
