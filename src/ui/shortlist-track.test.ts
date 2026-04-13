// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ShortlistEntry, ShortlistStore } from '../data/shortlist-store';
import { ShortlistTrack } from './shortlist-track';

// ── Helpers ──────────────────────────────────────────────────────────────────

type StoreCallback = (entries: ShortlistEntry[]) => void;

function makeStore(initialEntries: ShortlistEntry[] = []): {
  store: ShortlistStore;
  fire: (entries: ShortlistEntry[]) => void;
} {
  let callback: StoreCallback | null = null;

  const store: ShortlistStore = {
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    has: vi.fn(() => false),
    entries: vi.fn(() => initialEntries),
    subscribe: vi.fn((listener: StoreCallback) => {
      callback = listener;
      return () => { callback = null; };
    }),
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

    expect(container.querySelectorAll('.track-card').length).toBe(0);
    expect(container.textContent).toContain('No cases shortlisted');
  });

  it('renders 1 card when store fires with 1 entry', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([{ caseId: 'c1', nucleusKey: 'Media' }]);

    expect(container.querySelectorAll('.track-card').length).toBe(1);
  });

  it('renders 2 cards when store fires with 2 entries', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([
      { caseId: 'c1', nucleusKey: 'Media' },
      { caseId: 'c2', nucleusKey: 'Commerce' },
    ]);

    expect(container.querySelectorAll('.track-card').length).toBe(2);
  });

  it('clears to empty state when store fires empty after having entries', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([{ caseId: 'c1', nucleusKey: 'Media' }]);
    expect(container.querySelectorAll('.track-card').length).toBe(1);

    fire([]);
    expect(container.querySelectorAll('.track-card').length).toBe(0);
    expect(container.textContent).toContain('No cases shortlisted');
  });

  it('clicking a card calls onSelect with the caseId', () => {
    const { store, fire } = makeStore([]);
    const onSelect = vi.fn();
    new ShortlistTrack(container, store, onSelect);

    fire([{ caseId: 'c42', nucleusKey: 'Media' }]);

    const card = container.querySelector('.track-card') as HTMLElement;
    card.click();

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith('c42');
  });

  it('renders into #track-zone container (not a new element)', () => {
    const { store } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    // The track content should be INSIDE the passed container
    expect(container.id).toBe('track-zone');
    // Container should have been populated (empty state message)
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('uses getCaseLabel function when provided to display human-readable label', () => {
    const { store, fire } = makeStore([]);
    const getLabel = (id: string) => id === 'c1' ? 'Acme Corp' : id;
    new ShortlistTrack(container, store, vi.fn(), getLabel);

    fire([{ caseId: 'c1', nucleusKey: 'Media' }]);

    const card = container.querySelector('.track-card') as HTMLElement;
    expect(card.textContent).toBe('Acme Corp');
  });

  it('falls back to caseId when no getCaseLabel provided', () => {
    const { store, fire } = makeStore([]);
    new ShortlistTrack(container, store, vi.fn());

    fire([{ caseId: 'case-99', nucleusKey: 'Media' }]);

    const card = container.querySelector('.track-card') as HTMLElement;
    expect(card.textContent).toBe('case-99');
  });
});
