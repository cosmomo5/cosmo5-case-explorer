import { describe, it, expect, vi } from 'vitest';
import { createViewStateMachine } from './view-state';

// Helper: boot a machine already in global (skipping the planetary overture gate).
// Used by tests that focus on global/constellation/reading transitions specifically.
function machineInGlobal() {
  return createViewStateMachine({ kind: 'global' });
}

describe('createViewStateMachine', () => {
  it('initial state defaults to { kind: "planetary" }', () => {
    const machine = createViewStateMachine();
    expect(machine.getState()).toEqual({ kind: 'planetary' });
  });

  it('explicit initial value is respected', () => {
    const machine = createViewStateMachine({ kind: 'global' });
    expect(machine.getState()).toEqual({ kind: 'global' });
  });

  it('ENTER_CONSTELLATION from global → constellation', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    expect(machine.getState()).toEqual({ kind: 'constellation', nucleusKey: 'Media' });
  });

  it('EXIT_CONSTELLATION from constellation → global', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    machine.dispatch({ type: 'EXIT_CONSTELLATION' });
    expect(machine.getState()).toEqual({ kind: 'global' });
  });

  it('ENTER_CONSTELLATION from constellation throws', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    expect(() =>
      machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Commerce' })
    ).toThrow();
  });

  it('EXIT_CONSTELLATION from global throws', () => {
    const machine = machineInGlobal();
    expect(() =>
      machine.dispatch({ type: 'EXIT_CONSTELLATION' })
    ).toThrow();
  });

  // Phase 17: OPEN_READING from global is now legal (label click from global view).
  // Reading state records origin='global' so CLOSE_READING returns to global, not constellation.
  it('OPEN_READING from global → reading with origin=global and null nucleusKey', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'OPEN_READING', caseId: 'case-1' });
    expect(machine.getState()).toEqual({
      kind: 'reading',
      nucleusKey: null,
      caseId: 'case-1',
      origin: 'global',
    });
  });

  it('CLOSE_READING from reading(origin=global) → global', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'OPEN_READING', caseId: 'case-1' });
    machine.dispatch({ type: 'CLOSE_READING' });
    expect(machine.getState()).toEqual({ kind: 'global' });
  });

  it('CLOSE_READING from global throws (not valid from global)', () => {
    const machine = machineInGlobal();
    expect(() =>
      machine.dispatch({ type: 'CLOSE_READING' })
    ).toThrowError(/CLOSE_READING/);
  });

  it('listener is called with (next, prev, event) on valid transition', () => {
    const machine = machineInGlobal();
    const listener = vi.fn();
    machine.subscribe(listener);
    const event = { type: 'ENTER_CONSTELLATION' as const, nucleusKey: 'Media' };
    machine.dispatch(event);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(
      { kind: 'constellation', nucleusKey: 'Media' },
      { kind: 'global' },
      event
    );
  });

  it('subscribe returns unsubscribe fn; after calling it, listener is no longer notified', () => {
    const machine = machineInGlobal();
    const listener = vi.fn();
    const unsub = machine.subscribe(listener);
    unsub();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('multiple listeners all called on same transition', () => {
    const machine = machineInGlobal();
    const l1 = vi.fn();
    const l2 = vi.fn();
    machine.subscribe(l1);
    machine.subscribe(l2);
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    expect(l1).toHaveBeenCalledOnce();
    expect(l2).toHaveBeenCalledOnce();
  });
});

describe('planetary state + ENTER_FIELD', () => {
  it('ENTER_FIELD from planetary → global', () => {
    const machine = createViewStateMachine();
    expect(machine.getState()).toEqual({ kind: 'planetary' });
    machine.dispatch({ type: 'ENTER_FIELD' });
    expect(machine.getState()).toEqual({ kind: 'global' });
  });

  it('ENTER_FIELD fires listeners with correct (next, prev, event)', () => {
    const machine = createViewStateMachine();
    const listener = vi.fn();
    machine.subscribe(listener);
    const event = { type: 'ENTER_FIELD' as const };
    machine.dispatch(event);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(
      { kind: 'global' },
      { kind: 'planetary' },
      event
    );
  });

  it('ENTER_FIELD from global throws', () => {
    const machine = machineInGlobal();
    expect(() =>
      machine.dispatch({ type: 'ENTER_FIELD' })
    ).toThrowError(/ENTER_FIELD/);
  });

  it('ENTER_FIELD from constellation throws', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    expect(() =>
      machine.dispatch({ type: 'ENTER_FIELD' })
    ).toThrowError(/ENTER_FIELD/);
  });

  it('ENTER_FIELD from reading throws', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    machine.dispatch({ type: 'OPEN_READING', caseId: 'case-1' });
    expect(() =>
      machine.dispatch({ type: 'ENTER_FIELD' })
    ).toThrowError(/ENTER_FIELD/);
  });

  it('ENTER_CONSTELLATION from planetary throws (must ENTER_FIELD first)', () => {
    const machine = createViewStateMachine();
    expect(() =>
      machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' })
    ).toThrowError(/ENTER_CONSTELLATION/);
  });

  it('OPEN_READING from planetary throws', () => {
    const machine = createViewStateMachine();
    expect(() =>
      machine.dispatch({ type: 'OPEN_READING', caseId: 'x' })
    ).toThrowError(/OPEN_READING/);
  });

  it('EXIT_CONSTELLATION from planetary throws', () => {
    const machine = createViewStateMachine();
    expect(() =>
      machine.dispatch({ type: 'EXIT_CONSTELLATION' })
    ).toThrowError(/EXIT_CONSTELLATION/);
  });

  it('CLOSE_READING from planetary throws', () => {
    const machine = createViewStateMachine();
    expect(() =>
      machine.dispatch({ type: 'CLOSE_READING' })
    ).toThrowError(/CLOSE_READING/);
  });
});

describe('reading state transitions', () => {
  it('OPEN_READING from constellation → reading, preserves nucleusKey and stores caseId + origin=constellation', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    machine.dispatch({ type: 'OPEN_READING', caseId: 'case-42' });
    expect(machine.getState()).toEqual({
      kind: 'reading',
      nucleusKey: 'Media',
      caseId: 'case-42',
      origin: 'constellation',
    });
  });

  it('CLOSE_READING from reading(origin=constellation) → constellation, preserves nucleusKey', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Retail' });
    machine.dispatch({ type: 'OPEN_READING', caseId: 'case-7' });
    machine.dispatch({ type: 'CLOSE_READING' });
    expect(machine.getState()).toEqual({ kind: 'constellation', nucleusKey: 'Retail' });
  });

  // Phase 17: OPEN_READING from global is legal (was formerly throwing).
  // See earlier test block for the positive case; this test is removed as its
  // contract is intentionally reversed.

  it('CLOSE_READING from global throws with message containing "CLOSE_READING"', () => {
    const machine = machineInGlobal();
    expect(() =>
      machine.dispatch({ type: 'CLOSE_READING' })
    ).toThrowError(/CLOSE_READING/);
  });

  it('OPEN_READING from reading state throws (already reading)', () => {
    const machine = machineInGlobal();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Finance' });
    machine.dispatch({ type: 'OPEN_READING', caseId: 'case-1' });
    expect(() =>
      machine.dispatch({ type: 'OPEN_READING', caseId: 'case-2' })
    ).toThrowError(/OPEN_READING/);
  });

  it('listeners are notified on OPEN_READING and CLOSE_READING transitions', () => {
    const machine = machineInGlobal();
    const listener = vi.fn();
    machine.subscribe(listener);
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Tech' });
    listener.mockClear();

    const openEvent = { type: 'OPEN_READING' as const, caseId: 'case-99' };
    machine.dispatch(openEvent);
    expect(listener).toHaveBeenCalledWith(
      { kind: 'reading', nucleusKey: 'Tech', caseId: 'case-99', origin: 'constellation' },
      { kind: 'constellation', nucleusKey: 'Tech' },
      openEvent
    );

    listener.mockClear();
    const closeEvent = { type: 'CLOSE_READING' as const };
    machine.dispatch(closeEvent);
    expect(listener).toHaveBeenCalledWith(
      { kind: 'constellation', nucleusKey: 'Tech' },
      { kind: 'reading', nucleusKey: 'Tech', caseId: 'case-99', origin: 'constellation' },
      closeEvent
    );
  });
});
