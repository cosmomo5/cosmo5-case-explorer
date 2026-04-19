export type ViewState =
  | { kind: 'planetary' }
  | { kind: 'global' }
  | { kind: 'constellation'; nucleusKey: string }
  // Phase 17: reading may open from 'global' (label click) or 'constellation'
  // (star click or in-cluster label click). `nucleusKey` is null when opened
  // from global; `origin` records where CLOSE_READING returns to.
  | { kind: 'reading'; nucleusKey: string | null; caseId: string; origin: 'global' | 'constellation' };

export type ViewEvent =
  | { type: 'ENTER_FIELD' }
  | { type: 'ENTER_CONSTELLATION'; nucleusKey: string }
  | { type: 'EXIT_CONSTELLATION' }
  | { type: 'OPEN_READING'; caseId: string }
  | { type: 'CLOSE_READING' };

export type ViewStateListener = (next: ViewState, prev: ViewState, event: ViewEvent) => void;

export interface ViewStateMachine {
  getState(): ViewState;
  dispatch(event: ViewEvent): void;
  subscribe(listener: ViewStateListener): () => void;
}

export function createViewStateMachine(initial?: ViewState): ViewStateMachine {
  let current: ViewState = initial ?? { kind: 'planetary' };
  const listeners = new Set<ViewStateListener>();

  function dispatch(event: ViewEvent): void {
    const prev = current;
    let next: ViewState;

    if (event.type === 'ENTER_FIELD') {
      if (current.kind !== 'planetary') {
        throw new Error(`Cannot ENTER_FIELD from "${current.kind}"`);
      }
      next = { kind: 'global' };
    } else if (event.type === 'OPEN_READING') {
      // Phase 17: OPEN_READING is legal from 'global' (label click from global view)
      // or 'constellation' (star click or in-cluster label click). Not from
      // 'planetary' — overture must complete before any case interaction.
      if (current.kind === 'constellation') {
        next = { kind: 'reading', nucleusKey: current.nucleusKey, caseId: event.caseId, origin: 'constellation' };
      } else if (current.kind === 'global') {
        next = { kind: 'reading', nucleusKey: null, caseId: event.caseId, origin: 'global' };
      } else {
        throw new Error(`Cannot OPEN_READING from "${current.kind}"`);
      }
    } else if (event.type === 'CLOSE_READING') {
      if (current.kind !== 'reading') {
        throw new Error(`Cannot CLOSE_READING from "${current.kind}"`);
      }
      // Return to whichever view opened reading.
      next = current.origin === 'global'
        ? { kind: 'global' }
        : { kind: 'constellation', nucleusKey: current.nucleusKey as string };
    } else if (event.type === 'ENTER_CONSTELLATION') {
      if (current.kind !== 'global') {
        throw new Error(
          `Cannot ENTER_CONSTELLATION from state "${current.kind}"`
        );
      }
      next = { kind: 'constellation', nucleusKey: event.nucleusKey };
    } else if (event.type === 'EXIT_CONSTELLATION') {
      if (current.kind !== 'constellation') {
        throw new Error(
          `Cannot EXIT_CONSTELLATION from state "${current.kind}"`
        );
      }
      next = { kind: 'global' };
    } else {
      // Exhaustiveness guard — TypeScript should catch this at compile time
      const _exhaustive: never = event;
      throw new Error(`Unknown event: ${JSON.stringify(_exhaustive)}`);
    }

    current = next;
    for (const listener of listeners) {
      listener(next, prev, event);
    }
  }

  function subscribe(listener: ViewStateListener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }

  return {
    getState: () => current,
    dispatch,
    subscribe,
  };
}
