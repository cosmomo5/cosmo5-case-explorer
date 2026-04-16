import type { LayoutController } from '../layout/layout-controller';
import type { ViewStateMachine } from '../data/view-state';
import type { ShortlistStore } from '../data/shortlist-store';
import type { CaseStudy } from '../data/types';
import { classifyProofType } from '../data/proof-type';
import { deriveImpactScale } from '../data/impact-scale';
import { trackRecentlyViewed } from '../data/persistence';
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

    // Track this case as recently viewed
    trackRecentlyViewed(c.id);

    // Populate instrument readout with imagery, title, and labeled grid
    const instrument = this.slot.querySelector('#rp-instrument') as HTMLElement;
    const vertical = c.services[0] ?? '—';
    const proofType = classifyProofType(c.metrics);
    const impactScale = deriveImpactScale(c.metrics);
    const impactLabels = ['—', 'Incremental', 'Notable', 'Significant', 'Transformative'];

    // Map band to numeric scale index
    const bandToIndex: Record<string, number> = {
      'unknown': 0,
      'incremental': 1,
      'notable': 2,
      'significant': 3,
      'transformative': 4,
    };
    const impactIndex = bandToIndex[impactScale.band] ?? 0;

    // Imagery strip (RP-02) + Title (RP-06)
    let imageryHTML = '';
    if (c.permission !== false && c.imagery) {
      if (c.imagery.key_visual) {
        imageryHTML += `<div class="rp-key-visual"><img src="/case-imagery/${c.imagery.key_visual}" alt="" loading="lazy"/></div>`;
      }
      if (c.imagery.logo) {
        imageryHTML += `<img src="/case-imagery/${c.imagery.logo}" alt="${c.client} logo" class="rp-logo" loading="lazy"/>`;
      }
    }

    // Permission gate for confidential (RP-07)
    if (c.permission === false) {
      imageryHTML = `<div class="rp-confidential">[CONFIDENTIAL]</div>`;
    }

    // Title in Fraunces italic (RP-06)
    const titleHTML = `<h2 class="rp-title">${c.title}</h2>`;

    // Header grid (RP-01)
    const headerGridHTML = `
      <div class="rp-header-grid">
        <div class="rp-field"><span class="rp-label">CLIENT</span><span class="rp-value">${c.client}</span></div>
        <div class="rp-field"><span class="rp-label">SECTOR</span><span class="rp-value">${vertical}</span></div>
        <div class="rp-field"><span class="rp-label">REGION</span><span class="rp-value">${c.region}</span></div>
        <div class="rp-field"><span class="rp-label">YEAR</span><span class="rp-value">${c.year}</span></div>
        <div class="rp-field"><span class="rp-label">PROOF TYPE</span><span class="rp-value">${proofType}</span></div>
        <div class="rp-field"><span class="rp-label">IMPACT BAND</span><span class="rp-value">${impactLabels[impactIndex]}</span></div>
      </div>
    `;

    instrument.innerHTML = imageryHTML + titleHTML + headerGridHTML;

    // Populate body
    const body = this.slot.querySelector('#rp-body') as HTMLElement;

    if (!c.permission) {
      // Locked banner — hide sections
      body.innerHTML = `<div class="rp-locked">Access restricted</div>`;
    } else {
      // Full content with restructured sections (RP-03, RP-04)
      const metricsHTML = c.metrics
        .map(m => `
          <div class="rp-metric-row">
            <span class="rp-metric-label">${m.label.toUpperCase()}</span>
            <span class="rp-metric-value">${m.value}</span>
          </div>
        `)
        .join('');

      body.innerHTML = `
        <section class="rp-section">
          <h3 class="rp-section-label">CHALLENGE</h3>
          <p class="rp-section-body">${c.challenge}</p>
        </section>
        <section class="rp-section">
          <h3 class="rp-section-label">APPROACH</h3>
          <p class="rp-section-body">${c.approach}</p>
        </section>
        <section class="rp-section">
          <h3 class="rp-section-label">OBSERVED IMPACT</h3>
          <div class="rp-metrics-grid">${metricsHTML}</div>
        </section>
      `;
    }

    // Shortlist button (RP-05)
    const shortlistBtn = this.slot.querySelector('#rp-shortlist-btn') as HTMLButtonElement;
    shortlistBtn.textContent = this.shortlistStore.has(c.id) ? 'REMOVE' : 'ADD TO READING LIST';
    shortlistBtn.onclick = () => {
      if (this.shortlistStore.has(c.id)) {
        this.shortlistStore.remove(c.id);
        shortlistBtn.textContent = 'ADD TO READING LIST';
      } else {
        this.shortlistStore.add(c.id, nucleusKey);
        shortlistBtn.textContent = 'REMOVE';
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
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const originalColor = mesh.userData.originalColor as number | undefined;
    if (mat && originalColor !== undefined) {
      mat.color.setHex(originalColor);
    }
  }
}
