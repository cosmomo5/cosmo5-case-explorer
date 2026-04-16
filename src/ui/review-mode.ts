import type { ShortlistEntry, ShortlistStore } from '../data/shortlist-store';
import type { CaseStudy } from '../data/types';
import { classifyProofType } from '../data/proof-type';
import { deriveImpactScale } from '../data/impact-scale';

export interface ReviewModeOptions {
  caseById: Map<string, CaseStudy>;
  shortlistStore: ShortlistStore;
}

/**
 * ReviewMode — Full-viewport paginated reader overlay
 *
 * Opens as a fixed overlay with one case displayed as an instrument readout.
 * Navigates with arrow keys or buttons. Progress shows "CASE N OF M".
 * Esc or close button exits. Remove button drops case without exiting.
 */
export class ReviewMode {
  private overlay: HTMLElement | null = null;
  private body: HTMLElement | null = null;
  private progress: HTMLElement | null = null;
  private entries: ShortlistEntry[] = [];
  private currentIndex: number = 0;
  private caseById: Map<string, CaseStudy>;
  private shortlistStore: ShortlistStore;

  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: ReviewModeOptions) {
    this.caseById = options.caseById;
    this.shortlistStore = options.shortlistStore;
  }

  /**
   * Open the overlay, optionally starting at a specific case.
   * @param startCaseId Optional case ID to focus on. Defaults to first entry.
   */
  open(startCaseId?: string): void {
    // Get current entries from store
    this.entries = this.shortlistStore.entries();

    if (this.entries.length === 0) {
      console.warn('ReviewMode: no entries in shortlist store');
      return;
    }

    // Find start index
    if (startCaseId) {
      const idx = this.entries.findIndex(e => e.caseId === startCaseId);
      this.currentIndex = idx >= 0 ? idx : 0;
    } else {
      this.currentIndex = 0;
    }

    // Get or create overlay element
    let overlay = document.getElementById('reviewMode') as HTMLElement;
    if (!overlay) {
      console.warn('ReviewMode: #reviewMode not found in DOM');
      return;
    }

    this.overlay = overlay;
    this.body = overlay.querySelector('#rvBody') as HTMLElement;
    this.progress = overlay.querySelector('#rvProgress') as HTMLElement;

    if (!this.body || !this.progress) {
      console.warn('ReviewMode: required child elements not found');
      return;
    }

    // Make overlay visible
    this.overlay.setAttribute('aria-hidden', 'false');
    this.overlay.classList.add('open');

    // Render current case
    this.renderCase();

    // Bind keyboard events
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    // Bind button handlers
    const closeBtn = this.overlay.querySelector('#rvClose') as HTMLButtonElement;
    const prevBtn = this.overlay.querySelector('#rvPrev') as HTMLButtonElement;
    const nextBtn = this.overlay.querySelector('#rvNext') as HTMLButtonElement;
    const removeBtn = this.overlay.querySelector('#rvRemove') as HTMLButtonElement;

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());
    if (removeBtn) removeBtn.addEventListener('click', () => this.removeCurrent());

    // Move focus to close button for keyboard accessibility
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  /**
   * Close the overlay and clean up event handlers.
   */
  close(): void {
    if (!this.overlay) return;

    // Clean up keyboard handler
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    // Hide overlay
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.classList.remove('open');

    this.overlay = null;
    this.body = null;
    this.progress = null;
    this.entries = [];
    this.currentIndex = 0;
  }

  /**
   * Render the case at the current index into the overlay body.
   */
  private renderCase(): void {
    if (!this.body || !this.progress || this.entries.length === 0) {
      return;
    }

    const entry = this.entries[this.currentIndex];
    const c = this.caseById.get(entry.caseId);

    if (!c) {
      console.warn(`ReviewMode: case ${entry.caseId} not found`);
      return;
    }

    // Update progress indicator
    this.progress.textContent = `CASE ${this.currentIndex + 1} OF ${this.entries.length}`;

    // Render instrument readout (reuse reading-panel logic)
    const vertical = c.services[0] ?? '—';
    const proofType = classifyProofType(c.metrics);
    const impactScale = deriveImpactScale(c.metrics);
    const impactLabels = ['—', 'Incremental', 'Notable', 'Significant', 'Transformative'];

    const bandToIndex: Record<string, number> = {
      'unknown': 0,
      'incremental': 1,
      'notable': 2,
      'significant': 3,
      'transformative': 4,
    };
    const impactIndex = bandToIndex[impactScale.band] ?? 0;

    // Imagery and title
    let imageryHTML = '';
    if (c.permission !== false && c.imagery) {
      if (c.imagery.key_visual) {
        imageryHTML += `<div class="rp-key-visual"><img src="/case-imagery/${c.imagery.key_visual}" alt="" loading="lazy"/></div>`;
      }
      if (c.imagery.logo) {
        imageryHTML += `<img src="/case-imagery/${c.imagery.logo}" alt="${c.client} logo" class="rp-logo" loading="lazy"/>`;
      }
    }

    if (c.permission === false) {
      imageryHTML = `<div class="rp-confidential">[CONFIDENTIAL]</div>`;
    }

    const titleHTML = `<h2 class="rp-title">${c.title}</h2>`;

    // Header grid
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

    // Instrument readout
    const instrumentHTML = imageryHTML + titleHTML + headerGridHTML;

    // Body content
    let contentHTML = '';

    if (c.permission === false) {
      contentHTML = `<div class="rp-locked">Access restricted</div>`;
    } else {
      const metricsHTML = c.metrics
        .map(m => `
          <div class="rp-metric-row">
            <span class="rp-metric-label">${m.label.toUpperCase()}</span>
            <span class="rp-metric-value">${m.value}</span>
          </div>
        `)
        .join('');

      contentHTML = `
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

    // Render into review-mode body (not reading-panel slot)
    this.body.innerHTML = `
      <div class="rp-instrument">${instrumentHTML}</div>
      <div class="rp-body">${contentHTML}</div>
    `;

    // Update nav button states
    const prevBtn = this.overlay?.querySelector('#rvPrev') as HTMLButtonElement;
    const nextBtn = this.overlay?.querySelector('#rvNext') as HTMLButtonElement;

    if (prevBtn) {
      prevBtn.disabled = this.currentIndex === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = this.currentIndex === this.entries.length - 1;
    }
  }

  /**
   * Navigate to the next case.
   */
  private next(): void {
    if (this.currentIndex < this.entries.length - 1) {
      this.currentIndex++;
      this.renderCase();
    }
  }

  /**
   * Navigate to the previous case.
   */
  private prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCase();
    }
  }

  /**
   * Remove the current case from the reading list without exiting the overlay.
   */
  private removeCurrent(): void {
    if (this.entries.length === 0) return;

    const entry = this.entries[this.currentIndex];
    this.shortlistStore.remove(entry.caseId);

    // Re-fetch entries after removal
    this.entries = this.shortlistStore.entries();

    if (this.entries.length === 0) {
      // No more cases, close overlay
      this.close();
      return;
    }

    // Adjust index if out of bounds
    if (this.currentIndex >= this.entries.length) {
      this.currentIndex = this.entries.length - 1;
    }

    // Re-render
    this.renderCase();
  }
}

/**
 * Factory function to create and mount ReviewMode with DI from the host.
 */
export function mountReviewMode(options: ReviewModeOptions): ReviewMode {
  return new ReviewMode(options);
}
