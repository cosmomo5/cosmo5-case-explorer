import type { LayoutController } from '../layout/layout-controller';
import type { ViewStateMachine } from '../data/view-state';
import type { ShortlistStore } from '../data/shortlist-store';
import type { CaseStudy } from '../data/types';
import * as THREE from 'three';

export interface SceneObjectsForPanel {
  starMeshes: THREE.Mesh[];
}

export class ReadingPanel {
  private slot: HTMLElement;
  private currentCaseId: string | null = null;
  private currentNucleusKey: string | null = null;

  private layoutController: LayoutController;
  private viewStateMachine: ViewStateMachine;
  private shortlistStore: ShortlistStore;
  private sceneObjects: SceneObjectsForPanel;

  constructor(
    layoutController: LayoutController,
    viewStateMachine: ViewStateMachine,
    shortlistStore: ShortlistStore,
    sceneObjects: SceneObjectsForPanel,
  ) {
    const slot = document.getElementById('reading-panel-slot');
    if (!slot) throw new Error('ReadingPanel: #reading-panel-slot not found');
    this.slot = slot;
    this.layoutController = layoutController;
    this.viewStateMachine = viewStateMachine;
    this.shortlistStore = shortlistStore;
    this.sceneObjects = sceneObjects;

    // Render static shell HTML once
    this.slot.innerHTML = `
      <div class="rp-shell">
        <button id="rp-close" aria-label="Close reading panel">&times;</button>
        <div id="rp-instrument" class="rp-instrument"></div>
        <div id="rp-body" class="rp-body"></div>
        <button id="rp-shortlist-btn" class="rp-shortlist-btn">Add to Shortlist</button>
      </div>
    `;

    // Bind close button
    const closeBtn = this.slot.querySelector('#rp-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.close());
  }

  open(c: CaseStudy, nucleusKey: string): void {
    // If re-opening on a different case, restore previous star's state
    if (this.currentCaseId && this.currentCaseId !== c.id) {
      this._restoreStarState(this.currentCaseId);
    }

    this.currentCaseId = c.id;
    this.currentNucleusKey = nucleusKey;

    // Populate instrument readout: region | vertical (services[0]) | year
    const instrument = this.slot.querySelector('#rp-instrument') as HTMLElement;
    const vertical = c.services[0] ?? '—';
    instrument.innerHTML = `
      <span class="rp-cell">${c.region}</span>
      <span class="rp-cell">${vertical}</span>
      <span class="rp-cell">${c.year}</span>
    `;

    // Populate body
    const body = this.slot.querySelector('#rp-body') as HTMLElement;

    if (!c.permission) {
      // Locked banner — hide sections
      body.innerHTML = `<div class="rp-locked">Access restricted</div>`;
    } else {
      // Full content
      const chips = c.services
        .map(s => `<span class="rp-chip">${s}</span>`)
        .join('');

      const metricCards = c.metrics
        .map(m => `
          <div class="rp-metric-card">
            <span class="rp-metric-value">${m.value}</span>
            <span class="rp-metric-label">${m.label}</span>
          </div>
        `)
        .join('');

      body.innerHTML = `
        <h2 class="rp-title">${c.title}</h2>
        <div class="rp-chips">${chips}</div>
        <section class="rp-section">
          <div class="rp-section-label">Challenge</div>
          <p class="rp-section-text">${c.challenge}</p>
        </section>
        <section class="rp-section">
          <div class="rp-section-label">Approach</div>
          <p class="rp-section-text">${c.approach}</p>
        </section>
        <section class="rp-section rp-results">
          <div class="rp-section-label">Results</div>
          <div class="rp-metric-grid">${metricCards}</div>
        </section>
      `;
    }

    // Shortlist button
    const shortlistBtn = this.slot.querySelector('#rp-shortlist-btn') as HTMLButtonElement;
    shortlistBtn.textContent = this.shortlistStore.has(c.id) ? 'Remove' : 'Add to Shortlist';
    shortlistBtn.onclick = () => {
      if (this.shortlistStore.has(c.id)) {
        this.shortlistStore.remove(c.id);
        shortlistBtn.textContent = 'Add to Shortlist';
      } else {
        this.shortlistStore.add(c.id, nucleusKey);
        shortlistBtn.textContent = 'Remove';
      }
    };

    // Update star state → reading
    const mesh = this._findStarMesh(c.id);
    if (mesh) {
      mesh.userData.starState = 'reading';
    }

    // Call layout controller and view state machine
    this.layoutController.setPanelOpen(true);
    this.layoutController.setViewMode('reading');
    this.viewStateMachine.dispatch({ type: 'OPEN_READING', caseId: c.id });
  }

  close(): void {
    if (!this.currentCaseId) return;

    // Restore star state
    this._restoreStarState(this.currentCaseId);

    // Reset layout and view state
    this.layoutController.setPanelOpen(false);
    this.layoutController.setViewMode('constellation');
    this.viewStateMachine.dispatch({ type: 'CLOSE_READING' });

    this.currentCaseId = null;
    this.currentNucleusKey = null;
  }

  isOpen(): boolean {
    return this.slot.classList.contains('open');
  }

  navigate(direction: 'next' | 'prev', ringCases: CaseStudy[]): void {
    if (!this.currentCaseId || ringCases.length === 0) return;

    const idx = ringCases.findIndex(c => c.id === this.currentCaseId);
    let nextIdx: number;

    if (idx < 0) {
      // currentCaseId not found in ringCases — open first
      nextIdx = 0;
    } else {
      nextIdx = direction === 'next'
        ? (idx + 1) % ringCases.length
        : (idx - 1 + ringCases.length) % ringCases.length;
    }

    this.open(ringCases[nextIdx], this.currentNucleusKey!);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _findStarMesh(caseId: string): THREE.Mesh | undefined {
    return this.sceneObjects.starMeshes.find(
      m => m.userData.caseStudy?.id === caseId
    );
  }

  private _restoreStarState(caseId: string): void {
    const mesh = this._findStarMesh(caseId);
    if (!mesh) return;
    mesh.userData.starState = this.shortlistStore.has(caseId) ? 'selected' : 'idle';
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat && 'emissiveIntensity' in mat) {
      mat.emissiveIntensity = 0;
    }
  }
}
