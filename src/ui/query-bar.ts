import { applyQuery } from '../data/keyword-map';
import { matchesFilter } from '../data/filter';
import type { FilterState } from '../data/filter';
import { applyFilterWave, applyFilter } from '../scene/scene-state';
import type { SceneObjects } from '../scene/scene-state';
import type { CaseStudy, GroupMode } from '../data/types';
import { loadQueryHistory, addQueryToHistory } from '../data/persistence';
import { mountFilterPanel } from './filter-panel';

export interface QueryBarDeps {
  sceneObjects: SceneObjects;
  filterState: FilterState;
  cases: CaseStudy[];
  onFilterChange: () => void;
  onGroupModeChange?: (mode: GroupMode) => void;
  onExitFocus?: () => void;
}

/**
 * Count the number of star meshes whose associated case currently matches filterState.
 */
export function countMatches(objects: SceneObjects, filterState: FilterState): number {
  return objects.starMeshes.filter(star =>
    matchesFilter(star.userData.caseStudy as CaseStudy, filterState)
  ).length;
}

/**
 * Count the number of nucleus clusters that have at least one case matching filterState.
 */
export function countMatchingClusters(objects: SceneObjects, filterState: FilterState): number {
  return Object.values(objects.nucleusOrbits).filter(nucOrbit =>
    nucOrbit.cases.some(c => matchesFilter(c, filterState))
  ).length;
}

function updateReadout(deps: QueryBarDeps, readout: HTMLElement): void {
  const n = countMatches(deps.sceneObjects, deps.filterState);
  const m = countMatchingClusters(deps.sceneObjects, deps.filterState);
  readout.textContent = `${n} CASES · ${m} CLUSTERS`;
}

/**
 * Render query history chips below the query input.
 */
function renderQueryHistory(historyContainer: HTMLElement): void {
  const history = loadQueryHistory();
  historyContainer.innerHTML = history
    .map(q => `<button class="query-chip" data-query="${q.replace(/"/g, '&quot;')}">${q}</button>`)
    .join('');
}

/**
 * Mount the query bar: wire input events, keyboard shortcuts, clear button, and live readout.
 * Assumes #queryInput, #queryReadout, #queryClear exist in the DOM.
 */
export function mountQueryBar(deps: QueryBarDeps): void {
  const input = document.getElementById('queryInput') as HTMLInputElement | null;
  const readout = document.getElementById('queryReadout') as HTMLElement | null;
  const clearBtn = document.getElementById('queryClear') as HTMLElement | null;
  const historyContainer = document.getElementById('queryHistory') as HTMLElement | null;
  if (!input || !readout || !clearBtn) return;

  // Render initial readout (full field, nothing filtered)
  updateReadout(deps, readout);

  // Render query history chips
  if (historyContainer) {
    renderQueryHistory(historyContainer);
  }

  let waveTimer: ReturnType<typeof setTimeout> | undefined;

  function triggerWave(): void {
    const q = deps.filterState.searchText ?? '';
    if (q.length > 0) {
      applyFilterWave(deps.sceneObjects, deps.filterState);
    } else {
      applyFilter(deps.sceneObjects, deps.filterState);
    }
    deps.onFilterChange();
  }

  function handleInput(): void {
    const q = input!.value;

    // Show/hide clear button
    clearBtn!.classList.toggle('visible', q.length > 0);

    // Apply query to filterState (sets filterState.searchText)
    applyQuery(q, deps.filterState, deps.cases);

    // Immediate readout update
    updateReadout(deps, readout!);

    // Debounced wave animation (80 ms)
    clearTimeout(waveTimer);
    waveTimer = setTimeout(triggerWave, 80);
  }

  input.addEventListener('input', handleInput);

  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Skip debounce — apply immediately
      clearTimeout(waveTimer);
      const q = input.value;
      applyQuery(q, deps.filterState, deps.cases);
      updateReadout(deps, readout);
      triggerWave();
      // Save to query history
      addQueryToHistory(q);
      if (historyContainer) renderQueryHistory(historyContainer);
    }
    if (e.key === 'Escape') {
      input.value = '';
      handleInput();
      // Flush debounce immediately on Escape
      clearTimeout(waveTimer);
      applyQuery('', deps.filterState, deps.cases);
      applyFilter(deps.sceneObjects, deps.filterState);
      deps.onFilterChange();
      input.blur();
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    handleInput();
    // Flush debounce immediately on clear
    clearTimeout(waveTimer);
    applyQuery('', deps.filterState, deps.cases);
    applyFilter(deps.sceneObjects, deps.filterState);
    deps.onFilterChange();
    input.focus();
  });

  // ── Query history chips ───────────────────────────────────────────────────
  if (historyContainer) {
    historyContainer.addEventListener('click', (e) => {
      const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.query-chip');
      if (!chip) return;
      const query = chip.getAttribute('data-query') ?? '';
      input.value = query;
      handleInput();
      // Trigger wave animation
      clearTimeout(waveTimer);
      applyQuery(query, deps.filterState, deps.cases);
      updateReadout(deps, readout);
      triggerWave();
      // Add to history if not already there
      addQueryToHistory(query);
      renderQueryHistory(historyContainer);
    });
  }

  // ── Advanced drawer ───────────────────────────────────────────────────────
  const toggleBtn = document.getElementById('queryAdvancedToggle');
  const drawer = document.getElementById('advancedDrawer');

  if (toggleBtn && drawer) {
    let drawerMounted = false;

    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      drawer.setAttribute('aria-hidden', String(!isOpen));

      if (isOpen && !drawerMounted) {
        mountFilterPanel(
          drawer,
          deps.sceneObjects,
          deps.onGroupModeChange ?? (() => {}),
          deps.onExitFocus,
          { hideModeSwitcher: true },
        );
        drawerMounted = true;
      }
    });
  }
}
