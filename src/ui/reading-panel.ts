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

  constructor(
    _layoutController: LayoutController,
    _viewStateMachine: ViewStateMachine,
    _shortlistStore: ShortlistStore,
    _sceneObjects: SceneObjectsForPanel,
  ) {
    const slot = document.getElementById('reading-panel-slot');
    if (!slot) throw new Error('ReadingPanel: #reading-panel-slot not found');
    this.slot = slot;
    throw new Error('ReadingPanel: not yet implemented');
  }

  open(_c: CaseStudy, _nucleusKey: string): void {
    throw new Error('ReadingPanel.open: not yet implemented');
  }

  close(): void {
    throw new Error('ReadingPanel.close: not yet implemented');
  }

  isOpen(): boolean {
    return this.slot.classList.contains('open');
  }

  navigate(_direction: 'next' | 'prev', _ringCases: CaseStudy[]): void {
    throw new Error('ReadingPanel.navigate: not yet implemented');
  }
}
