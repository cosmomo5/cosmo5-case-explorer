export interface ShortlistEntry {
  caseId: string;
  nucleusKey: string;
}

export type ShortlistListener = (entries: ShortlistEntry[]) => void;

export interface ShortlistStore {
  add(caseId: string, nucleusKey: string): void;
  remove(caseId: string): void;
  clear(): void;
  has(caseId: string): boolean;
  entries(): ShortlistEntry[];
  subscribe(listener: ShortlistListener): () => void;
}

export function createShortlistStore(): ShortlistStore {
  const map = new Map<string, ShortlistEntry>();
  const listeners = new Set<ShortlistListener>();
  const addedAt = new Map<string, number>(); // Track when each case was added

  function _notify(): void {
    const snapshot = [...map.values()];
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  const store: ShortlistStore & { _addedAt?: Record<string, number>; _addedAtMap?: Map<string, number> } = {
    add(caseId: string, nucleusKey: string): void {
      if (!map.has(caseId)) {
        addedAt.set(caseId, Date.now());
      }
      map.set(caseId, { caseId, nucleusKey });
      _notify();
    },

    remove(caseId: string): void {
      map.delete(caseId);
      addedAt.delete(caseId);
      _notify();
    },

    clear(): void {
      map.clear();
      addedAt.clear();
      _notify();
    },

    has(caseId: string): boolean {
      return map.has(caseId);
    },

    entries(): ShortlistEntry[] {
      return [...map.values()];
    },

    subscribe(listener: ShortlistListener): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },

    // Internal access to addedAt for persistence
    _addedAtMap: addedAt,
  };

  // Expose addedAt as a serializable object for hydration/persistence
  Object.defineProperty(store, '_addedAt', {
    get(): Record<string, number> {
      const obj: Record<string, number> = {};
      addedAt.forEach((timestamp, caseId) => {
        obj[caseId] = timestamp;
      });
      return obj;
    },
    set(obj: Record<string, number>) {
      addedAt.clear();
      Object.entries(obj).forEach(([caseId, timestamp]) => {
        addedAt.set(caseId, timestamp);
      });
    },
  });

  return store;
}
