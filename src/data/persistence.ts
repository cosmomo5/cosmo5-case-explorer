/**
 * localStorage persistence layer for reading list, query history, and recently-viewed cases.
 * Handles boot-time hydration, mutation writes (debounced), and state recovery.
 */

import type { ShortlistStore } from './shortlist-store';

// ─── localStorage Keys ────────────────────────────────────────────────────

const KEY_READING_LIST = 'cosmo5.readingList.v1';
const KEY_RECENTLY_VIEWED = 'cosmo5.recentlyViewed.v1';

// ─── Reading List Persistence ────────────────────────────────────────────

export interface ReadingListPayload {
  caseIds: string[];
  addedAt: Record<string, number>;
}

/**
 * Hydrate the reading list store from localStorage.
 * Called at boot, before any mutations.
 * Wraps in try/catch to handle quota/parse errors gracefully.
 */
export function hydrateReadingList(store: ShortlistStore): void {
  try {
    const stored = localStorage.getItem(KEY_READING_LIST);
    if (!stored) return;

    const payload: ReadingListPayload = JSON.parse(stored);
    if (!Array.isArray(payload.caseIds)) return;

    // Track addedAt timestamps on the store instance
    if (!('_addedAt' in store)) {
      (store as any)._addedAt = payload.addedAt || {};
    }

    // Add each case to the store (uses default nucleus key)
    for (const caseId of payload.caseIds) {
      // For hydration, we don't have the nucleusKey; use a placeholder that will be resolved at open time
      // The store's add() method requires nucleusKey, so we pass a fallback
      store.add(caseId, 'default');
    }
  } catch (e) {
    console.warn('[persistence] Reading list hydration failed:', e);
    // Continue with empty store on error
  }
}

/**
 * Serialize store entries to localStorage.
 * Called when persisting (either immediately or debounced).
 */
export function persistReadingList(store: ShortlistStore): void {
  try {
    const entries = store.entries();
    const addedAt = (store as any)._addedAt || {};
    const payload: ReadingListPayload = {
      caseIds: entries.map(e => e.caseId),
      addedAt,
    };
    localStorage.setItem(KEY_READING_LIST, JSON.stringify(payload));
  } catch (e) {
    console.error('[persistence] Reading list save failed:', e);
  }
}

/**
 * Subscribe to store mutations and debounce writes to localStorage.
 * Debounce window: 300ms (collects mutations, flushes once).
 */
export function setupReadingListPersistence(store: ShortlistStore): () => void {
  let writeTimeout: ReturnType<typeof setTimeout> | null = null;

  const unsubscribe = store.subscribe(() => {
    // Clear pending write
    if (writeTimeout) clearTimeout(writeTimeout);

    // Schedule new write (300ms debounce)
    writeTimeout = setTimeout(() => {
      persistReadingList(store);
      writeTimeout = null;
    }, 300);
  });

  return () => {
    if (writeTimeout) clearTimeout(writeTimeout);
    unsubscribe();
  };
}

/**
 * Track addedAt timestamp when a case is added.
 * Call this from store.add() or immediately after.
 */
export function recordAddedAt(store: ShortlistStore, caseId: string): void {
  if (!('_addedAt' in store)) {
    (store as any)._addedAt = {};
  }
  (store as any)._addedAt[caseId] = Date.now();
}

// ─── Recently Viewed ─────────────────────────────────────────────────────

/**
 * Load recently-viewed case IDs from localStorage.
 * Returns array of last 10 case IDs opened in reading panel.
 */
export function loadRecentlyViewed(): string[] {
  try {
    const stored = localStorage.getItem(KEY_RECENTLY_VIEWED);
    if (!stored) return [];
    const arr = JSON.parse(stored);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn('[persistence] Recently-viewed load failed:', e);
    return [];
  }
}

/**
 * Save recently-viewed case IDs to localStorage.
 * Enforces max 10 entries (FIFO).
 */
export function saveRecentlyViewed(ids: string[]): void {
  try {
    // Keep last 10, trim if needed
    const trimmed = ids.slice(-10);
    localStorage.setItem(KEY_RECENTLY_VIEWED, JSON.stringify(trimmed));
  } catch (e) {
    console.error('[persistence] Recently-viewed save failed:', e);
  }
}

/**
 * Track that a case was viewed (opened in reading panel).
 * Prepends to history, deduplicates, keeps last 10, saves.
 */
export function trackRecentlyViewed(caseId: string): void {
  const history = loadRecentlyViewed();

  // Remove if already present (to move it to front)
  const filtered = history.filter(id => id !== caseId);

  // Prepend to start
  filtered.unshift(caseId);

  // Keep last 10
  saveRecentlyViewed(filtered);
}
