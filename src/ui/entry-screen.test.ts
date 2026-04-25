// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountEntryScreen } from './entry-screen';

function makeContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('mountEntryScreen', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // ENTRY-02
  it('appends .entry-screen div to parent', () => {
    const container = makeContainer();
    mountEntryScreen(container, { onEnter: vi.fn() });
    expect(container.querySelector('.entry-screen')).not.toBeNull();
  });

  // ENTRY-06
  it('CTA button renders with correct text', () => {
    const container = makeContainer();
    mountEntryScreen(container, { onEnter: vi.fn() });
    const btn = container.querySelector('.entry-cta') as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain('ENTER OBSERVATORY →');
  });

  // ENTRY-08 — class is added immediately on click
  it('CTA click adds entry-screen--exiting class immediately', () => {
    const container = makeContainer();
    mountEntryScreen(container, { onEnter: vi.fn() });
    const overlay = container.querySelector('.entry-screen') as HTMLElement;
    const btn = overlay.querySelector('.entry-cta') as HTMLButtonElement;
    btn.click();
    expect(overlay.classList.contains('entry-screen--exiting')).toBe(true);
  });

  // ENTRY-08 — callback fires after 200ms, not immediately
  describe('CTA click calls onEnter callback after 200ms', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('onEnter is NOT called immediately, IS called after 200ms', () => {
      const container = makeContainer();
      const onEnter = vi.fn();
      mountEntryScreen(container, { onEnter });
      const btn = container.querySelector('.entry-cta') as HTMLButtonElement;
      btn.click();
      expect(onEnter).not.toHaveBeenCalled();
      vi.advanceTimersByTime(200);
      expect(onEnter).toHaveBeenCalledOnce();
    });
  });

  // ENTRY-10
  it('always mounts regardless of localStorage — no skip logic', () => {
    localStorage.clear();
    const container = makeContainer();
    mountEntryScreen(container, { onEnter: vi.fn() });
    expect(container.querySelector('.entry-screen')).not.toBeNull();
  });

  // ENTRY-06 — pulsing dot markup
  it('pulsing dot span is present with correct content', () => {
    const container = makeContainer();
    mountEntryScreen(container, { onEnter: vi.fn() });
    const dot = container.querySelector('.entry-cta-dot') as HTMLElement | null;
    expect(dot).not.toBeNull();
    expect(dot!.textContent).toBe('●');
  });
});
