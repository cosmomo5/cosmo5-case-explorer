import { describe, it, expect, vi } from 'vitest';
import { createShortlistStore, type ShortlistEntry } from './shortlist-store';

describe('createShortlistStore', () => {
  it('fresh store entries() returns []', () => {
    const store = createShortlistStore();
    expect(store.entries()).toEqual([]);
  });

  it('add("case-1", "Media") then has("case-1") returns true', () => {
    const store = createShortlistStore();
    store.add('case-1', 'Media');
    expect(store.has('case-1')).toBe(true);
  });

  it('add two cases → entries() returns both', () => {
    const store = createShortlistStore();
    store.add('case-1', 'Media');
    store.add('case-2', 'Commerce');
    const ids = store.entries().map((e: ShortlistEntry) => e.caseId);
    expect(ids).toContain('case-1');
    expect(ids).toContain('case-2');
    expect(store.entries()).toHaveLength(2);
  });

  it('remove("case-1") → has("case-1") false', () => {
    const store = createShortlistStore();
    store.add('case-1', 'Media');
    store.remove('case-1');
    expect(store.has('case-1')).toBe(false);
  });

  it('clear() → entries() returns []', () => {
    const store = createShortlistStore();
    store.add('case-1', 'Media');
    store.add('case-2', 'Commerce');
    store.clear();
    expect(store.entries()).toEqual([]);
  });

  it('listener called synchronously on add()', () => {
    const store = createShortlistStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.add('case-1', 'Media');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('listener called synchronously on remove()', () => {
    const store = createShortlistStore();
    store.add('case-1', 'Media');
    const listener = vi.fn();
    store.subscribe(listener);
    store.remove('case-1');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('listener called on clear()', () => {
    const store = createShortlistStore();
    store.add('case-1', 'Media');
    const listener = vi.fn();
    store.subscribe(listener);
    store.clear();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('listener receives current snapshot of entries after mutation', () => {
    const store = createShortlistStore();
    let received: unknown = null;
    store.subscribe(entries => { received = entries; });
    store.add('case-1', 'Media');
    expect(received).toEqual([{ caseId: 'case-1', nucleusKey: 'Media' }]);
  });

  it('FND-03 persistence: entries survive scene transition (no external clear)', () => {
    const store = createShortlistStore();
    store.add('case-A', 'Constellation-A');
    store.add('case-B', 'Constellation-A');
    // Simulate scene transition: nothing calls clear() or remove()
    // Store is lifecycle-independent; entries must still be present
    expect(store.entries()).toHaveLength(2);
    expect(store.has('case-A')).toBe(true);
    expect(store.has('case-B')).toBe(true);
  });

  it('subscribe returns unsubscribe; after calling it, listener no longer fires', () => {
    const store = createShortlistStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.add('case-1', 'Media');
    expect(listener).not.toHaveBeenCalled();
  });
});
