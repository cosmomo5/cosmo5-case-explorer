import type { ShortlistEntry, ShortlistStore } from '../data/shortlist-store';
import { returnStarToOrbit } from '../scene/star-flight';
import * as THREE from 'three';

export interface ShortlistTrackSceneObjects {
  starMeshes: THREE.Mesh[];
}

/**
 * ShortlistTrack — renders shortlisted cases as chips in the bottom track zone.
 *
 * Pure subscriber: adds no entries itself. Calls onSelect(caseId) on chip click.
 * Optional getCaseLabel allows the host to provide human-readable labels.
 */
export class ShortlistTrack {
  private readonly container: HTMLElement;
  private readonly getCaseLabel: (caseId: string) => string;
  private readonly store: ShortlistStore;
  private readonly sceneObjects?: ShortlistTrackSceneObjects;
  private readonly unsubscribe: () => void;

  constructor(
    container: HTMLElement,
    store: ShortlistStore,
    onSelect: (caseId: string) => void,
    getCaseLabel?: (caseId: string) => string,
    sceneObjects?: ShortlistTrackSceneObjects,
  ) {
    this.container = container;
    // onSelect is used by parent but not needed here since rendering is subscription-based
    void onSelect;
    this.getCaseLabel = getCaseLabel ?? ((id) => id);
    this.store = store;
    this.sceneObjects = sceneObjects;

    // Render initial state from current store contents
    this.render(store.entries());

    // Subscribe to future mutations
    this.unsubscribe = store.subscribe((entries) => this.render(entries));
  }

  /** Re-renders the entire track contents synchronously. */
  private render(entries: ShortlistEntry[]): void {
    this.container.innerHTML = '';

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'rl-empty';
      empty.textContent = 'No readings staged. Add cases from the panel — your list persists across sessions.';
      this.container.appendChild(empty);
      return;
    }

    // Count display
    const countDiv = document.createElement('div');
    countDiv.className = 'rl-count';
    countDiv.textContent = `${entries.length} READINGS`;
    this.container.appendChild(countDiv);

    // Cards container
    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'rl-cards';

    for (const entry of entries) {
      const card = document.createElement('div');
      card.className = 'rl-card';
      card.setAttribute('data-case-id', entry.caseId);

      // Get case data (pass through container dataset or use getCaseLabel)
      const label = this.getCaseLabel(entry.caseId);

      // Format the timestamp
      const addedTime = this.getAddedAtTimestamp(entry.caseId);
      const timeStr = addedTime ? this.formatTimeAgo(addedTime) : 'just now';

      // Build card content: client, sector (placeholder), metric (placeholder), timestamp, remove button
      card.innerHTML = `
        <span class="rl-client">${label}</span>
        <span class="rl-sector">—</span>
        <span class="rl-metric">—</span>
        <span class="rl-added">${timeStr}</span>
        <button class="rl-remove" aria-label="Remove from reading list" data-case-id="${entry.caseId}">×</button>
      `;

      // Remove button handler
      const removeBtn = card.querySelector('.rl-remove') as HTMLButtonElement;
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Find the star mesh and trigger return animation
          if (this.sceneObjects) {
            const mesh = this.sceneObjects.starMeshes.find(
              m => m.userData.caseStudy?.id === entry.caseId
            );
            if (mesh) {
              returnStarToOrbit(mesh, entry.caseId);
            }
          }
          // Remove from store (triggers re-render via subscription)
          this.store.remove(entry.caseId);
        });
      }

      cardsDiv.appendChild(card);
    }

    this.container.appendChild(cardsDiv);

    // Actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'rl-actions';

    const reviewBtn = document.createElement('button');
    reviewBtn.id = 'rlReview';
    reviewBtn.className = 'rl-review';
    reviewBtn.textContent = 'REVIEW';
    reviewBtn.disabled = entries.length < 1;
    actionsDiv.appendChild(reviewBtn);

    const compareBtn = document.createElement('button');
    compareBtn.id = 'rlCompare';
    compareBtn.className = 'rl-compare';
    compareBtn.textContent = 'COMPARE';
    compareBtn.disabled = entries.length < 3;
    if (entries.length < 3) {
      compareBtn.title = 'Add 3+ readings to compare';
    }
    actionsDiv.appendChild(compareBtn);

    this.container.appendChild(actionsDiv);
  }

  /** Get the timestamp when a case was added (in ms). */
  private getAddedAtTimestamp(caseId: string): number | null {
    const addedAtMap = (this.store as any)._addedAtMap as Map<string, number> | undefined;
    if (addedAtMap && addedAtMap.has(caseId)) {
      return addedAtMap.get(caseId) ?? null;
    }
    return null;
  }

  /** Format a timestamp as "Xm ago", "Xh ago", or "Xd ago". */
  private formatTimeAgo(timestampMs: number): string {
    const now = Date.now();
    const diffMs = now - timestampMs;
    const diffS = Math.floor(diffMs / 1000);
    const diffM = Math.floor(diffS / 60);
    const diffH = Math.floor(diffM / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffD > 0) return `${diffD}d ago`;
    if (diffH > 0) return `${diffH}h ago`;
    if (diffM > 0) return `${diffM}m ago`;
    return 'just now';
  }

  /** Detach from the store (call when removing the component). */
  destroy(): void {
    this.unsubscribe();
  }
}
