export interface LayoutController {
  setPanelOpen(open: boolean): void;
  setViewMode(mode: 'global' | 'constellation' | 'reading'): void;
  dispose(): void;
}

export function createLayoutController(): LayoutController {
  const panelSlot = document.getElementById('reading-panel-slot') as HTMLElement;

  return {
    setPanelOpen(open: boolean) {
      panelSlot.classList.toggle('open', open);
      document.body.classList.toggle('panel-open', open);
    },
    setViewMode(mode) {
      document.body.classList.toggle('constellation', mode !== 'global');
      document.body.classList.toggle('reading', mode === 'reading');
    },
    dispose() { /* no cleanup needed */ },
  };
}
