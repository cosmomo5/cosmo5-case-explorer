// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { createLayoutController } from './layout-controller';

describe('LayoutController', () => {
  beforeEach(() => {
    document.body.className = '';
    let slot = document.getElementById('reading-panel-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'reading-panel-slot';
      document.body.appendChild(slot);
    } else {
      slot.className = '';
    }
  });

  it('setPanelOpen(true) adds open to panel slot and panel-open to body', () => {
    const lc = createLayoutController();
    lc.setPanelOpen(true);
    const slot = document.getElementById('reading-panel-slot')!;
    expect(slot.classList.contains('open')).toBe(true);
    expect(document.body.classList.contains('panel-open')).toBe(true);
  });

  it('setPanelOpen(false) removes open from panel slot and panel-open from body', () => {
    const lc = createLayoutController();
    lc.setPanelOpen(true);
    lc.setPanelOpen(false);
    const slot = document.getElementById('reading-panel-slot')!;
    expect(slot.classList.contains('open')).toBe(false);
    expect(document.body.classList.contains('panel-open')).toBe(false);
  });

  it('setViewMode("constellation") adds constellation to body', () => {
    const lc = createLayoutController();
    lc.setViewMode('constellation');
    expect(document.body.classList.contains('constellation')).toBe(true);
    expect(document.body.classList.contains('reading')).toBe(false);
  });

  it('setViewMode("reading") adds both constellation and reading to body', () => {
    const lc = createLayoutController();
    lc.setViewMode('reading');
    expect(document.body.classList.contains('constellation')).toBe(true);
    expect(document.body.classList.contains('reading')).toBe(true);
  });

  it('setViewMode("global") removes constellation and reading from body', () => {
    const lc = createLayoutController();
    lc.setViewMode('constellation');
    lc.setViewMode('global');
    expect(document.body.classList.contains('constellation')).toBe(false);
    expect(document.body.classList.contains('reading')).toBe(false);
  });

  it('dispose is callable without error', () => {
    const lc = createLayoutController();
    expect(() => lc.dispose()).not.toThrow();
  });
});
