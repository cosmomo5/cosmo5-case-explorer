import type { ShortlistEntry, ShortlistStore } from '../data/shortlist-store';

/**
 * ShortlistTrack — renders shortlisted cases as chips in the bottom track zone.
 *
 * Pure subscriber: adds no entries itself. Calls onSelect(caseId) on chip click.
 * Optional getCaseLabel allows the host to provide human-readable labels.
 */
export class ShortlistTrack {
  private readonly container: HTMLElement;
  private readonly onSelect: (caseId: string) => void;
  private readonly getCaseLabel: (caseId: string) => string;
  private readonly unsubscribe: () => void;

  constructor(
    container: HTMLElement,
    store: ShortlistStore,
    onSelect: (caseId: string) => void,
    getCaseLabel?: (caseId: string) => string,
  ) {
    this.container = container;
    this.onSelect = onSelect;
    this.getCaseLabel = getCaseLabel ?? ((id) => id);

    // Render initial state from current store contents
    this.render(store.entries());

    // Subscribe to future mutations
    this.unsubscribe = store.subscribe((entries) => this.render(entries));
  }

  /** Re-renders the entire track contents synchronously. */
  private render(entries: ShortlistEntry[]): void {
    this.container.innerHTML = '';

    if (entries.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'track-empty';
      empty.textContent = 'No cases shortlisted';
      this.container.appendChild(empty);
      return;
    }

    for (const entry of entries) {
      const card = document.createElement('button');
      card.className = 'track-card';
      card.type = 'button';
      card.textContent = this.getCaseLabel(entry.caseId);
      card.addEventListener('click', () => this.onSelect(entry.caseId));
      this.container.appendChild(card);
    }
  }

  /** Detach from the store (call when removing the component). */
  destroy(): void {
    this.unsubscribe();
  }
}
