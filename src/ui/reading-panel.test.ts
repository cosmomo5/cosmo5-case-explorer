// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReadingPanel } from './reading-panel';
import { createViewStateMachine } from '../data/view-state';
import { createShortlistStore } from '../data/shortlist-store';
import { createLayoutController } from '../layout/layout-controller';
import type { CaseStudy } from '../data/types';
import * as THREE from 'three';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const caseOpen: CaseStudy = {
  id: 'case-1',
  client: 'Acme Corp',
  year: 2023,
  services: ['Video Ads', 'SEA'],
  countries: ['Germany'],
  region: 'DACH',
  permission: true,
  title: 'Acme Revenue Drive',
  challenge: 'Needed to grow online revenue by 40%.',
  approach: 'Multi-channel video and search activation.',
  metrics: [
    { value: '+42%', label: 'Revenue uplift' },
    { value: '3.2x', label: 'ROAS' },
  ],
};

const caseLocked: CaseStudy = {
  id: 'case-2',
  client: 'LockedCo',
  year: 2022,
  services: ['Amazon'],
  countries: ['US'],
  region: 'Americas',
  permission: false,
  title: 'Locked Case',
  challenge: 'Hidden challenge.',
  approach: 'Hidden approach.',
  metrics: [{ value: '99%', label: 'Secret metric' }],
};

function makeStar(c: CaseStudy): THREE.Mesh {
  const mesh = new THREE.Mesh();
  mesh.userData.caseStudy = c;
  mesh.userData.starState = 'idle';
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  mesh.userData.originalColor = 0xffffff;
  mesh.material = mat;
  return mesh;
}

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="reading-panel-slot"></div>
  `;
}

function makePanel() {
  const layoutController = createLayoutController();
  const viewStateMachine = createViewStateMachine({ kind: 'constellation', nucleusKey: 'test-key' });
  const shortlistStore = createShortlistStore();
  const starMesh1 = makeStar(caseOpen);
  const starMesh2 = makeStar(caseLocked);
  const sceneObjects = { starMeshes: [starMesh1, starMesh2] };
  const panel = new ReadingPanel(layoutController, viewStateMachine, shortlistStore, sceneObjects);
  return { panel, layoutController, viewStateMachine, shortlistStore, starMesh1, starMesh2 };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReadingPanel — constructor', () => {
  beforeEach(() => setupDOM());

  it('renders inner shell into #reading-panel-slot (not #panel)', () => {
    const { panel } = makePanel();
    void panel; // ensure constructed
    const slot = document.getElementById('reading-panel-slot')!;
    expect(slot.innerHTML).not.toBe('');
  });

  it('throws if #reading-panel-slot is missing', () => {
    document.body.innerHTML = '<div id="other"></div>';
    const lc = createLayoutController();
    const vsm = createViewStateMachine({ kind: 'constellation', nucleusKey: 'k' });
    const ss = createShortlistStore();
    expect(() => new ReadingPanel(lc, vsm, ss, { starMeshes: [] })).toThrow('#reading-panel-slot');
  });
});

describe('ReadingPanel — open()', () => {
  beforeEach(() => setupDOM());

  it('calls layoutController.setPanelOpen(true)', () => {
    const { panel, layoutController } = makePanel();
    const spy = vi.spyOn(layoutController, 'setPanelOpen');
    panel.open(caseOpen, 'test-key');
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('calls viewStateMachine.dispatch({ type: OPEN_READING, caseId })', () => {
    const { panel, viewStateMachine } = makePanel();
    const spy = vi.spyOn(viewStateMachine, 'dispatch');
    panel.open(caseOpen, 'test-key');
    expect(spy).toHaveBeenCalledWith({ type: 'OPEN_READING', caseId: caseOpen.id });
  });

  it('renders instrument readout with region and year', () => {
    const { panel } = makePanel();
    panel.open(caseOpen, 'test-key');
    const instrument = document.getElementById('rp-instrument')!;
    expect(instrument.textContent).toContain('DACH');
    expect(instrument.textContent).toContain('2023');
  });

  it('renders services as chips', () => {
    const { panel } = makePanel();
    panel.open(caseOpen, 'test-key');
    const body = document.getElementById('rp-body')!;
    expect(body.textContent).toContain('Video Ads');
    expect(body.textContent).toContain('SEA');
  });

  it('renders challenge and approach sections', () => {
    const { panel } = makePanel();
    panel.open(caseOpen, 'test-key');
    const body = document.getElementById('rp-body')!;
    expect(body.textContent).toContain('Needed to grow online revenue');
    expect(body.textContent).toContain('Multi-channel video');
  });

  it('renders metric cards (one per metric)', () => {
    const { panel } = makePanel();
    panel.open(caseOpen, 'test-key');
    const cards = document.querySelectorAll('.rp-metric-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('+42%');
    expect(cards[0].textContent).toContain('Revenue uplift');
  });

  it('shows locked banner and hides body content when permission=false', () => {
    const { panel } = makePanel();
    panel.open(caseLocked, 'test-key');
    const body = document.getElementById('rp-body')!;
    expect(body.textContent).toContain('Access restricted');
    expect(body.textContent).not.toContain('Hidden challenge');
    expect(body.textContent).not.toContain('99%');
  });

  it('sets starState=reading on the matched star mesh', () => {
    const { panel, starMesh1 } = makePanel();
    panel.open(caseOpen, 'test-key');
    expect(starMesh1.userData.starState).toBe('reading');
  });
});

describe('ReadingPanel — close()', () => {
  beforeEach(() => setupDOM());

  it('calls layoutController.setPanelOpen(false)', () => {
    const { panel, layoutController } = makePanel();
    const spy = vi.spyOn(layoutController, 'setPanelOpen');
    panel.open(caseOpen, 'test-key');
    panel.close();
    expect(spy).toHaveBeenLastCalledWith(false);
  });

  it('calls viewStateMachine.dispatch({ type: CLOSE_READING })', () => {
    const { panel, viewStateMachine } = makePanel();
    const spy = vi.spyOn(viewStateMachine, 'dispatch');
    panel.open(caseOpen, 'test-key');
    panel.close();
    expect(spy).toHaveBeenLastCalledWith({ type: 'CLOSE_READING' });
  });

  it('isOpen() returns false after close()', () => {
    const { panel } = makePanel();
    panel.open(caseOpen, 'test-key');
    panel.close();
    expect(panel.isOpen()).toBe(false);
  });
});

describe('ReadingPanel — isOpen()', () => {
  beforeEach(() => setupDOM());

  it('reflects whether slot has open class', () => {
    const { panel } = makePanel();
    expect(panel.isOpen()).toBe(false);
    panel.open(caseOpen, 'test-key');
    expect(panel.isOpen()).toBe(true);
  });
});
