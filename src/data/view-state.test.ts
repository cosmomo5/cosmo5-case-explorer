import { describe, it, expect, vi } from 'vitest';
import { createViewStateMachine } from './view-state';

describe('createViewStateMachine', () => {
  it('initial state is { kind: "global" }', () => {
    const machine = createViewStateMachine();
    expect(machine.getState()).toEqual({ kind: 'global' });
  });

  it('ENTER_CONSTELLATION from global → constellation', () => {
    const machine = createViewStateMachine();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    expect(machine.getState()).toEqual({ kind: 'constellation', nucleusKey: 'Media' });
  });

  it('EXIT_CONSTELLATION from constellation → global', () => {
    const machine = createViewStateMachine();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    machine.dispatch({ type: 'EXIT_CONSTELLATION' });
    expect(machine.getState()).toEqual({ kind: 'global' });
  });

  it('ENTER_CONSTELLATION from constellation throws', () => {
    const machine = createViewStateMachine();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    expect(() =>
      machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Commerce' })
    ).toThrow();
  });

  it('EXIT_CONSTELLATION from global throws', () => {
    const machine = createViewStateMachine();
    expect(() =>
      machine.dispatch({ type: 'EXIT_CONSTELLATION' })
    ).toThrow();
  });

  it('OPEN_READING from global throws (not valid from global)', () => {
    const machine = createViewStateMachine();
    expect(() =>
      machine.dispatch({ type: 'OPEN_READING', caseId: 'x' })
    ).toThrowError(/OPEN_READING/);
  });

  it('CLOSE_READING from global throws (not valid from global)', () => {
    const machine = createViewStateMachine();
    expect(() =>
      machine.dispatch({ type: 'CLOSE_READING' })
    ).toThrowError(/CLOSE_READING/);
  });

  it('listener is called with (next, prev, event) on valid transition', () => {
    const machine = createViewStateMachine();
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
    const machine = createViewStateMachine();
    const listener = vi.fn();
    const unsub = machine.subscribe(listener);
    unsub();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('multiple listeners all called on same transition', () => {
    const machine = createViewStateMachine();
    const l1 = vi.fn();
    const l2 = vi.fn();
    machine.subscribe(l1);
    machine.subscribe(l2);
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    expect(l1).toHaveBeenCalledOnce();
    expect(l2).toHaveBeenCalledOnce();
  });
});

describe('reading state transitions', () => {
  it('OPEN_READING from constellation → reading, preserves nucleusKey and stores caseId', () => {
    const machine = createViewStateMachine();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Media' });
    machine.dispatch({ type: 'OPEN_READING', caseId: 'case-42' });
    expect(machine.getState()).toEqual({ kind: 'reading', nucleusKey: 'Media', caseId: 'case-42' });
  });

  it('CLOSE_READING from reading → constellation, preserves nucleusKey', () => {
    const machine = createViewStateMachine();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Retail' });
    machine.dispatch({ type: 'OPEN_READING', caseId: 'case-7' });
    machine.dispatch({ type: 'CLOSE_READING' });
    expect(machine.getState()).toEqual({ kind: 'constellation', nucleusKey: 'Retail' });
  });

  it('OPEN_READING from global throws with message containing "OPEN_READING"', () => {
    const machine = createViewStateMachine();
    expect(() =>
      machine.dispatch({ type: 'OPEN_READING', caseId: 'case-1' })
    ).toThrowError(/OPEN_READING/);
  });

  it('CLOSE_READING from global throws with message containing "CLOSE_READING"', () => {
    const machine = createViewStateMachine();
    expect(() =>
      machine.dispatch({ type: 'CLOSE_READING' })
    ).toThrowError(/CLOSE_READING/);
  });

  it('OPEN_READING from reading state throws (already reading)', () => {
    const machine = createViewStateMachine();
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Finance' });
    machine.dispatch({ type: 'OPEN_READING', caseId: 'case-1' });
    expect(() =>
      machine.dispatch({ type: 'OPEN_READING', caseId: 'case-2' })
    ).toThrowError(/OPEN_READING/);
  });

  it('listeners are notified on OPEN_READING and CLOSE_READING transitions', () => {
    const machine = createViewStateMachine();
    const listener = vi.fn();
    machine.subscribe(listener);
    machine.dispatch({ type: 'ENTER_CONSTELLATION', nucleusKey: 'Tech' });
    listener.mockClear();

    const openEvent = { type: 'OPEN_READING' as const, caseId: 'case-99' };
    machine.dispatch(openEvent);
    expect(listener).toHaveBeenCalledWith(
      { kind: 'reading', nucleusKey: 'Tech', caseId: 'case-99' },
      { kind: 'constellation', nucleusKey: 'Tech' },
      openEvent
    );

    listener.mockClear();
    const closeEvent = { type: 'CLOSE_READING' as const };
    machine.dispatch(closeEvent);
    expect(listener).toHaveBeenCalledWith(
      { kind: 'constellation', nucleusKey: 'Tech' },
      { kind: 'reading', nucleusKey: 'Tech', caseId: 'case-99' },
      closeEvent
    );
  });
});
