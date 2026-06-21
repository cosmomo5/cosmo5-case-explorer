// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ShortlistEntry, ShortlistStore } from '../data/shortlist-store';
import { ShortlistTrack } from './shortlist-track';
import type { ShortlistCardData } from './shortlist-track';

// ── Helpers ──────────────────────────────────────────────────────────────────

type StoreCallback = (entries: ShortlistEntry[]) => void;

function makeStore(initialEntries: ShortlistEntry[] = []): {
  store: ShortlistStore;
  fire: (entries: ShortlistEntry[]) => void;
} {
  let callback: StoreCallback | null = null;

  const store: ShortlistStore & { _addedAtMap?: Map<string, number> } = {
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    has: vi.fn(() => false),
    entries: vi.fn(() => initialEntries),
    subscribe: vi.fn((listener: StoreCallback) => {
      callback = listener;
      return () => { callback = null; };
    }),
    _addedAtMap: new Map(),
  };

  return {
    store,
    fire: (entries: ShortlistEntry[]) => {
      if (callback) callback(entries);
    },
  };
}

function makeContainer(): HTMLDivElement {
  const div = document.createElement('div');
  div.id = 'track-zone';
  document.body.appendChild(div);
  return div;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ShortlistTrack', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = makeContainer();
  });

  it('renders empty state when store is empty on construction', () => {
    const { store } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    expect(container.querySelectorAll('.rl-card').length).toBe(0);
    expect(container.textContent).toContain('No readings staged');
  });

  it('renders 1 card when store fires with 1 entry', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([{ caseId: 'c1', nucleusKey: 'Media' }]);

    expect(container.querySelectorAll('.rl-card').length).toBe(1);
  });

  it('renders 2 cards when store fires with 2 entries', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([
      { caseId: 'c1', nucleusKey: 'Media' },
      { caseId: 'c2', nucleusKey: 'Commerce' },
    ]);

    expect(container.querySelectorAll('.rl-card').length).toBe(2);
  });

  it('clears to empty state when store fires empty after having entries', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([{ caseId: 'c1', nucleusKey: 'Media' }]);
    expect(container.querySelectorAll('.rl-card').length).toBe(1);

    fire([]);
    expect(container.querySelectorAll('.rl-card').length).toBe(0);
    expect(container.textContent).toContain('No readings staged');
  });

  it('renders count indicator when entries present', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([{ caseId: 'c1', nucleusKey: 'Media' }]);

    const countDiv = container.querySelector('.rl-count');
    expect(countDiv?.textContent).toContain('1 READINGS');
  });

  it('renders REVIEW and COMPARE buttons', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([{ caseId: 'c1', nucleusKey: 'Media' }]);

    const reviewBtn = container.querySelector('#rlReview');
    const compareBtn = container.querySelector('#rlCompare');
    expect(reviewBtn).not.toBeNull();
    expect(compareBtn).not.toBeNull();
  });

  it('COMPARE button is disabled when < 3 entries', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([
      { caseId: 'c1', nucleusKey: 'Media' },
      { caseId: 'c2', nucleusKey: 'Commerce' },
    ]);

    const compareBtn = container.querySelector('#rlCompare') as HTMLButtonElement;
    expect(compareBtn.disabled).toBe(true);
  });

  it('COMPARE button is enabled when >= 3 entries', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([
      { caseId: 'c1', nucleusKey: 'Media' },
      { caseId: 'c2', nucleusKey: 'Commerce' },
      { caseId: 'c3', nucleusKey: 'Tech' },
    ]);

    const compareBtn = container.querySelector('#rlCompare') as HTMLButtonElement;
    expect(compareBtn.disabled).toBe(false);
  });

  it('renders into #track-zone container (not a new element)', () => {
    const { store } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    // The track content should be INSIDE the passed container
    expect(container.id).toBe('track-zone');
    // Container should have been populated (empty state message)
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('uses getCase function when provided to display client, sector, metric', () => {
    const { store, fire } = makeStore([]);
    const getCase = (id: string): ShortlistCardData | undefined =>
      id === 'c1' ? { client: 'Acme Corp', sector: 'Media', metric: '+30%' } : undefined;
    new ShortlistTrack(container, store, vi.fn(), getCase);

    fire([{ caseId: 'c1', nucleusKey: 'Media' }]);

    const card = container.querySelector('.rl-card') as HTMLElement;
    expect(card.querySelector('.rl-client')?.textContent).toBe('Acme Corp');
    expect(card.querySelector('.rl-sector')?.textContent).toBe('Media');
    expect(card.querySelector('.rl-metric')?.textContent).toBe('+30%');
  });

  it('falls back to caseId when no getCase provided', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([{ caseId: 'case-99', nucleusKey: 'Media' }]);

    const card = container.querySelector('.rl-card') as HTMLElement;
    const clientSpan = card.querySelector('.rl-client') as HTMLElement;
    expect(clientSpan.textContent).toBe('case-99');
  });
});
