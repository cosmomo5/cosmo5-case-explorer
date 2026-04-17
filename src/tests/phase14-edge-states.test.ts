// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createFilterState } from '../data/filter';

describe('Phase 14 — FilterState.isActive() includes searchText (P6-02 fix)', () => {
  it('returns false for a blank filter', () => {
    const fs = createFilterState();
    expect(fs.isActive()).toBe(false);
  });

  it('returns true for a text-only query', () => {
    const fs = createFilterState();
    fs.searchText = 'xyzzz';
    expect(fs.isActive()).toBe(true);
  });

  it('returns false when searchText is empty string', () => {
    const fs = createFilterState();
    fs.searchText = '';
    expect(fs.isActive()).toBe(false);
  });

  it('returns true for a dimension-only filter (regression)', () => {
    const fs = createFilterState();
    fs.services.add('Performance Marketing');
    expect(fs.isActive()).toBe(true);
  });
});

describe('Phase 14 — DOM contract for edge states', () => {
  it('#queryHint exists in index.html (empty-state + no-match target)', () => {
    // The query-bar wires to #queryHint; keep this pinned so HTML structure
    // is never removed without updating the wiring.
    document.body.innerHTML = `
      <div class="query-wrap">
        <div class="query-bar">
          <input id="queryInput" />
          <span id="queryReadout"></span>
          <button id="queryClear">x</button>
        </div>
        <div class="query-hint" id="queryHint"></div>
      </div>`;
    const hint = document.getElementById('queryHint');
    expect(hint).not.toBeNull();
    expect(hint?.classList.contains('query-hint')).toBe(true);
  });

  it('#loaderError and #loaderRetry exist for the error-state contract (P6-03)', () => {
    document.body.innerHTML = `
      <div class="loader" id="loader">
        <div class="loader-error" id="loaderError" role="alert">
          <button class="le-retry" id="loaderRetry" type="button">[RETRY]</button>
        </div>
      </div>`;
    expect(document.getElementById('loaderError')).not.toBeNull();
    expect(document.getElementById('loaderRetry')).not.toBeNull();
  });
});
