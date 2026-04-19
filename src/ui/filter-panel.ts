import type { SceneObjects } from '../scene/scene-state';
import type { GroupMode, CaseStudy } from '../data/types';
import type { FilterDimension } from '../data/filter';
import { createFilterState } from '../data/filter';
import { computeChipCounts, FILTER_DIMENSIONS } from '../data/filter-counts';
import { applyFilter, clearFilter } from '../scene/scene-state';
import { matchesFilter } from '../data/filter';
import type { EnrichedCaseStudy } from '../data/enrich';

// Human-readable labels per dimension
const DIM_LABELS: Record<FilterDimension, string> = {
  countries:   'Country',
  services:    'Service',
  years:       'Year',
  proofTypes:  'Proof Type',
  impactBands: 'Impact',
  nucleusKeys: 'Vertical',
};

/** Collect all enriched cases from nucleusOrbits (covers both global and focused modes). */
function getAllCases(obj: SceneObjects): EnrichedCaseStudy[] {
  return Object.values(obj.nucleusOrbits).flatMap(n => n.cases) as EnrichedCaseStudy[];
}

/** Collect the values for a given dimension from all cases. */
function getValuesForDim(cases: EnrichedCaseStudy[], dim: FilterDimension): string[] {
  const seen = new Set<string>();
  for (const c of cases) {
    switch (dim) {
      case 'countries':
        for (const v of c.countries) seen.add(v);
        break;
      case 'services':
        for (const v of c.services) seen.add(v);
        break;
      case 'years':
        seen.add(String(c.year));
        break;
      case 'proofTypes':
        seen.add(c.proofType);
        break;
      case 'impactBands':
        seen.add(c.impactScale?.band ?? 'unknown');
        break;
    }
  }
  return [...seen].sort();
}

/** Check if a string value is currently active in the filter for a given dimension. */
function isValueActive(obj: SceneObjects, dim: FilterDimension, value: string): boolean {
  switch (dim) {
    case 'countries':   return obj.filterState.countries.has(value);
    case 'services':    return obj.filterState.services.has(value);
    case 'years':       return obj.filterState.years.has(Number(value));
    case 'proofTypes':  return (obj.filterState.proofTypes as Set<string>).has(value);
    case 'impactBands': return (obj.filterState.impactBands as Set<string>).has(value);
    default:            return false;
  }
}

/** Count how many cases match the current filter. */
function countMatches(obj: SceneObjects, allCases: EnrichedCaseStudy[]): number {
  return allCases.filter(c => matchesFilter(c, obj.filterState)).length;
}

/** Build accordion HTML for all 5 filter dimensions. */
function buildAccordionSections(
  obj: SceneObjects,
  allCases: EnrichedCaseStudy[],
  chipCounts: Map<FilterDimension, Map<string, number>>,
): string {
  return FILTER_DIMENSIONS.map(dim => {
    const values = getValuesForDim(allCases, dim);
    const counts = chipCounts.get(dim) ?? new Map<string, number>();
    const selectedCount = (() => {
      switch (dim) {
        case 'countries':   return obj.filterState.countries.size;
        case 'services':    return obj.filterState.services.size;
        case 'years':       return obj.filterState.years.size;
        case 'proofTypes':  return obj.filterState.proofTypes.size;
        case 'impactBands': return obj.filterState.impactBands.size;
        default:            return 0;
      }
    })();
    const badge = selectedCount > 0 ? `<span class="fgroup-badge">${selectedCount} selected</span>` : '';

    const chips = values.map(v => {
      const count = counts.get(v) ?? 0;
      const isOn = isValueActive(obj, dim, v) ? ' on' : '';
      const isDim = count === 0 ? ' dim' : '';
      return `<div class="fchip${isOn}${isDim}" data-dim="${dim}" data-value="${v}">${v} <span class="fchip-count">${count}</span></div>`;
    }).join('');

    return `
      <div class="fgroup" data-dim="${dim}">
        <button class="fgroup-header" aria-expanded="false">
          <span class="fgroup-label">${DIM_LABELS[dim]}</span>
          ${badge}
          <span class="fgroup-arrow">▾</span>
        </button>
        <div class="fgroup-body">${chips}</div>
      </div>`;
  }).join('');
}


/** Build the global mode HTML. */
function buildGlobalHTML(obj: SceneObjects): string {
  const allCases = getAllCases(obj);
  const chipCounts = computeChipCounts(allCases, obj.filterState);
  const accordionSections = buildAccordionSections(obj, allCases, chipCounts);

  const isActive = obj.filterState.isActive();
  const matched = isActive ? countMatches(obj, allCases) : 0;
  const total = allCases.length;

  const statusBar = isActive ? `
    <div class="filter-status">
      <span>${matched} / ${total}</span>
      <button class="clr" id="filterClear">Reset all</button>
    </div>` : '';

  const readoutHtml = isActive
    ? `<div class="filters-readout" aria-live="polite" role="status">${matched} CASES</div>`
    : `<div class="filters-readout" aria-live="polite" role="status">—</div>`;

  return `
    <div class="filters-head">
      <h3>Filter</h3>
    </div>
    ${readoutHtml}
    <div class="filters-body">
      ${accordionSections}
    </div>
    ${statusBar}
  `;
}

/** Build the focused mode HTML. */
function buildFocusedHTML(obj: SceneObjects): string {
  const allCases = getAllCases(obj);
  const chipCounts = computeChipCounts(allCases, obj.filterState);
  const accordionSections = buildAccordionSections(obj, allCases, chipCounts);

  const isActive = obj.filterState.isActive();
  const matched = isActive ? countMatches(obj, allCases) : 0;
  const total = allCases.length;

  const statusBar = isActive ? `
    <div class="filter-status">
      <span>${matched} / ${total}</span>
      <button class="clr" id="filterClear">Reset all</button>
    </div>` : '';

  const readoutHtml = isActive
    ? `<div class="filters-readout" aria-live="polite" role="status">${matched} CASES</div>`
    : `<div class="filters-readout" aria-live="polite" role="status">—</div>`;

  return `
    <div class="filters-head">
      <button class="filters-back" id="filtersBack" aria-label="Back to global view">← ${obj.focusedKey}</button>
    </div>
    ${readoutHtml}
    <div class="filters-body">
      ${accordionSections}
    </div>
    ${statusBar}
  `;
}

export function mountFilterPanel(
  container: HTMLElement,
  objects: SceneObjects,
  onGroupModeChange: (mode: GroupMode) => void,
  onExitFocus?: () => void,
  cases: CaseStudy[] = [],
  onFilterChange: () => void = () => {},
): void {
  const deps = {
    sceneObjects: objects,
    cases,
    onFilterChange,
    onGroupModeChange,
    onExitFocus,
  };

  render();

  function render() {
    container.innerHTML = objects.mode === 'global'
      ? buildGlobalHTML(objects)
      : buildFocusedHTML(objects);
    bindEvents();
  }

  function toggleGroup(group: HTMLElement) {
    const isOpen = group.hasAttribute('data-open');
    const header = group.querySelector('.fgroup-header') as HTMLButtonElement | null;
    if (isOpen) {
      group.removeAttribute('data-open');
      header?.setAttribute('aria-expanded', 'false');
    } else {
      group.setAttribute('data-open', '');
      header?.setAttribute('aria-expanded', 'true');
    }
  }

  function bindEvents() {
    // ── Accordion toggle ───────────────────────────────────────────────
    container.querySelectorAll('.fgroup-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('.fgroup') as HTMLElement | null;
        if (group) toggleGroup(group);
      });
    });

    // ── Filter chips ───────────────────────────────────────────────────
    container.querySelectorAll('.fchip[data-dim][data-value]').forEach(chip => {
      chip.addEventListener('click', () => {
        const el = chip as HTMLElement;
        // Dim chips (0 count) are non-interactive
        if (el.classList.contains('dim')) return;

        const dim = el.dataset.dim as FilterDimension;
        const value = el.dataset.value!;
        const f = createFilterState();

        // Copy current filter state
        for (const v of objects.filterState.countries) f.countries.add(v);
        for (const v of objects.filterState.services) f.services.add(v);
        for (const v of objects.filterState.years) f.years.add(v);
        for (const v of objects.filterState.nucleusKeys) f.nucleusKeys.add(v);
        for (const v of objects.filterState.proofTypes) f.proofTypes.add(v);
        for (const v of objects.filterState.impactBands) f.impactBands.add(v);

        // Toggle the clicked value
        switch (dim) {
          case 'countries':
            f.countries.has(value) ? f.countries.delete(value) : f.countries.add(value);
            break;
          case 'services':
            f.services.has(value) ? f.services.delete(value) : f.services.add(value);
            break;
          case 'years': {
            const y = Number(value);
            f.years.has(y) ? f.years.delete(y) : f.years.add(y);
            break;
          }
          case 'proofTypes':
            (f.proofTypes as Set<string>).has(value)
              ? (f.proofTypes as Set<string>).delete(value)
              : (f.proofTypes as Set<string>).add(value);
            break;
          case 'impactBands':
            (f.impactBands as Set<string>).has(value)
              ? (f.impactBands as Set<string>).delete(value)
              : (f.impactBands as Set<string>).add(value);
            break;
        }

        applyFilter(objects, f);
        render();
      });
    });

    // ── Reset buttons ──────────────────────────────────────────────────
    ['#filterClear', '#filterClearHead'].forEach(id => {
      container.querySelector(id)?.addEventListener('click', () => {
        clearFilter(objects);
        render();
      });
    });

    // ── Back button (focused mode) ─────────────────────────────────────
    const backBtn = container.querySelector('#filtersBack') as HTMLButtonElement | null;
    if (backBtn && deps.onExitFocus) {
      backBtn.addEventListener('click', () => {
        deps.onExitFocus!();
        requestAnimationFrame(() => render());
      });
    }
  }
}
