import type { SceneObjects } from '../scene/scene-state';
import type { GroupMode } from '../data/types';
import { createFilterState, getFilterableAttrs } from '../data/filter';
import { applyFilter, clearFilter } from '../scene/scene-state';

export function mountFilterPanel(
  container: HTMLElement,
  objects: SceneObjects,
  onGroupModeChange: (mode: GroupMode) => void,
): void {
  render();

  function render() {
    container.innerHTML = buildHTML(objects);
    bindEvents();
  }

  function buildHTML(obj: SceneObjects): string {
    const isGlobal = obj.mode === 'global';
    const isActive = obj.filterState.isActive();
    const staged = isActive
      ? obj.starMeshes.filter(s => s.userData.isStagingTarget).length
      : 0;

    if (isGlobal) {
      const keys = Object.keys(obj.nucleusOrbits).sort();
      const chips = keys.map(k => {
        const count = obj.nucleusOrbits[k].cases.length;
        const on = obj.filterState.nucleusKeys.has(k) ? ' on' : '';
        return `<button class="fchip${on}" data-key="${k}">${k} <span class="dot"></span>×${count}</button>`;
      }).join('');

      const modeChips = (['vertical', 'country', 'region'] as GroupMode[]).map(m => {
        const active = obj.groupMode === m ? ' active' : '';
        return `<button class="mode-chip${active}" data-mode="${m}">${m}</button>`;
      }).join('');

      return `
        <div class="filters-head">
          <h3>Filter</h3>
          ${isActive ? '<button class="clr" id="filterClear">Reset</button>' : ''}
        </div>
        <div class="mode-row">${modeChips}</div>
        <div class="filters-body">
          <div class="fgroup"><div class="fg-label">Pull to staging</div>
          <div class="fchips" id="fc-nuclei">${chips}</div></div>
        </div>
        ${staged > 0 ? `
        <div class="filters-staging">
          <div class="fs-label">Staging</div>
          <div class="fs-count">${staged}</div>
          <div class="fs-status">${staged} stars en route</div>
          <button class="fs-clear" id="stagingClear">clear → fly home</button>
        </div>` : ''}
      `;
    } else {
      // Focused view — case attribute filters
      const focusedCases = obj.starMeshes
        .filter(s => s.userData.starOrbit?.nucleusKey === obj.focusedKey)
        .map(s => s.userData.caseStudy);
      const attrs = getFilterableAttrs(focusedCases);
      const countriesHTML = attrs.countries.map(c => {
        const on = obj.filterState.countries.has(c) ? ' on' : '';
        const cnt = focusedCases.filter(cs => cs.countries.includes(c)).length;
        return `<button class="fchip${on}" data-country="${c}">${c} ×${cnt}</button>`;
      }).join('');
      const servicesHTML = attrs.services.map(s => {
        const on = obj.filterState.services.has(s) ? ' on' : '';
        const cnt = focusedCases.filter(cs => cs.services.includes(s)).length;
        return `<button class="fchip${on}" data-service="${s}">${s} ×${cnt}</button>`;
      }).join('');
      const yearsHTML = attrs.years.map(y => {
        const on = obj.filterState.years.has(y) ? ' on' : '';
        const cnt = focusedCases.filter(cs => cs.year === y).length;
        return `<button class="fchip${on}" data-year="${y}">${y} ×${cnt}</button>`;
      }).join('');

      return `
        <div class="filters-head">
          <button class="clr" id="focusBack">← ${obj.focusedKey}</button>
          ${isActive ? '<button class="clr" id="filterClear">Reset</button>' : ''}
        </div>
        <div class="filters-body">
          <div class="fgroup"><div class="fg-label">Country</div>
            <div class="fchips">${countriesHTML}</div></div>
          <div class="fgroup"><div class="fg-label">Service</div>
            <div class="fchips">${servicesHTML}</div></div>
          <div class="fgroup"><div class="fg-label">Year</div>
            <div class="fchips">${yearsHTML}</div></div>
        </div>
        ${staged > 0 ? `
        <div class="filters-staging">
          <div class="fs-label">Staging — ${obj.focusedKey}</div>
          <div class="fs-count">${staged}</div>
          <div class="fs-status">${staged} stars en route</div>
          <button class="fs-clear" id="stagingClear">clear → fly home</button>
        </div>` : ''}
      `;
    }
  }

  function bindEvents() {
    container.querySelector('#filterClear')?.addEventListener('click', () => {
      clearFilter(objects);
      render();
    });
    container.querySelector('#stagingClear')?.addEventListener('click', () => {
      clearFilter(objects);
      render();
    });
    container.querySelector('#focusBack')?.addEventListener('click', () => {
      objects.mode = 'global';
      objects.focusedKey = null;
      clearFilter(objects);
      render();
    });

    // Mode chips
    container.querySelectorAll('.mode-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.mode as GroupMode;
        onGroupModeChange(mode);
      });
    });

    // Nucleus chips (global view)
    container.querySelectorAll('.fchip[data-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = (btn as HTMLElement).dataset.key!;
        const f = createFilterState();
        // Copy existing selections
        for (const k of objects.filterState.nucleusKeys) f.nucleusKeys.add(k);
        f.nucleusKeys.has(key) ? f.nucleusKeys.delete(key) : f.nucleusKeys.add(key);
        applyFilter(objects, f);
        render();
      });
    });

    // Country chips (focused view)
    container.querySelectorAll('.fchip[data-country]').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = (btn as HTMLElement).dataset.country!;
        const f = createFilterState();
        for (const k of objects.filterState.countries) f.countries.add(k);
        for (const k of objects.filterState.services) f.services.add(k);
        for (const k of objects.filterState.years) f.years.add(k);
        f.countries.has(c) ? f.countries.delete(c) : f.countries.add(c);
        applyFilter(objects, f);
        render();
      });
    });

    // Service chips (focused view)
    container.querySelectorAll('.fchip[data-service]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = (btn as HTMLElement).dataset.service!;
        const f = createFilterState();
        for (const k of objects.filterState.countries) f.countries.add(k);
        for (const k of objects.filterState.services) f.services.add(k);
        for (const k of objects.filterState.years) f.years.add(k);
        f.services.has(s) ? f.services.delete(s) : f.services.add(s);
        applyFilter(objects, f);
        render();
      });
    });

    // Year chips (focused view)
    container.querySelectorAll('.fchip[data-year]').forEach(btn => {
      btn.addEventListener('click', () => {
        const y = parseInt((btn as HTMLElement).dataset.year!);
        const f = createFilterState();
        for (const k of objects.filterState.countries) f.countries.add(k);
        for (const k of objects.filterState.services) f.services.add(k);
        for (const k of objects.filterState.years) f.years.add(k);
        f.years.has(y) ? f.years.delete(y) : f.years.add(y);
        applyFilter(objects, f);
        render();
      });
    });
  }
}
