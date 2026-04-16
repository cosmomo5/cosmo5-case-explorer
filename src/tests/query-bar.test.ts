// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

// NOTE: This test file intentionally does NOT import mountQueryBar or mountFilterPanel.
// The DOM-presence and ARIA tests below rely only on the HTML structure set up in
// beforeEach — they validate requirements QRY-01 through QRY-08 at the structural
// level. The mount functions (created in Plan 04) will wire up behaviour on top of
// this same HTML structure.

describe('Query bar DOM structure and ARIA attributes', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="query-wrap" id="queryWrap">
        <div class="query-bar">
          <input type="text" id="queryInput" role="searchbox"
                 aria-label="Case library query"
                 placeholder="What kind of proof do you need?"
                 autocomplete="off"/>
          <span class="query-readout" id="queryReadout" aria-live="polite"></span>
          <button class="query-clear" id="queryClear" aria-label="Clear query">×</button>
        </div>
        <button class="query-advanced-toggle" id="queryAdvancedToggle"
                aria-expanded="false" aria-controls="advancedDrawer">ADVANCED</button>
        <div class="advanced-drawer" id="advancedDrawer" aria-hidden="true"></div>
      </div>
    `;
  });

  it('#queryInput has correct placeholder (QRY-01)', () => {
    const input = document.getElementById('queryInput') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toBe('What kind of proof do you need?');
  });

  it('#queryInput has role=searchbox (QRY-07)', () => {
    const input = document.getElementById('queryInput')!;
    expect(input.getAttribute('role')).toBe('searchbox');
  });

  it('#queryInput has aria-label (QRY-08)', () => {
    const input = document.getElementById('queryInput')!;
    expect(input.getAttribute('aria-label')).toBe('Case library query');
  });

  it('#queryReadout has aria-live=polite (QRY-08)', () => {
    const readout = document.getElementById('queryReadout')!;
    expect(readout).not.toBeNull();
    expect(readout.getAttribute('aria-live')).toBe('polite');
  });

  it('#queryClear has aria-label (QRY-06)', () => {
    const clearBtn = document.getElementById('queryClear')!;
    expect(clearBtn).not.toBeNull();
    expect(clearBtn.getAttribute('aria-label')).toBe('Clear query');
  });

  it('#queryAdvancedToggle starts with aria-expanded=false (QRY-05)', () => {
    const toggle = document.getElementById('queryAdvancedToggle')!;
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('#advancedDrawer starts with aria-hidden=true (QRY-05)', () => {
    const drawer = document.getElementById('advancedDrawer')!;
    expect(drawer).not.toBeNull();
    expect(drawer.getAttribute('aria-hidden')).toBe('true');
  });
});
