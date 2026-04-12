import * as THREE from 'three';
import type { CaseStudy } from '../data/types';

const NUCLEUS_COLORS_HEX: Record<string, string> = {
  'Media':               '#5ecfc0',
  'Performance':         '#e8b15a',
  'Commerce':            '#a9f0d1',
  'Data & Intelligence': '#b9e4ff',
  'Strategy':            '#ffdba4',
  'GEO':                 '#ffc6d9',
  'Creative':            '#ffe29a',
};

export class Tooltip {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'star-tooltip';
    document.body.appendChild(this.el);
  }

  show(c: CaseStudy, nucleusKey: string, screenX: number, screenY: number): void {
    const color = NUCLEUS_COLORS_HEX[nucleusKey] ?? '#fff4dd';
    this.el.innerHTML = `
      <div class="tip-client"><span class="tip-dot" style="background:${color}"></span>${c.client}</div>
      <div class="tip-title">${c.title}</div>
    `;
    this.el.style.left = `${screenX + 14}px`;
    this.el.style.top  = `${screenY - 10}px`;
    this.el.classList.add('visible');
  }

  hide(): void {
    this.el.classList.remove('visible');
  }
}

export function projectToScreen(
  position: THREE.Vector3,
  camera: THREE.Camera,
): { x: number; y: number } {
  const v = position.clone().project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * innerWidth,
    y: (-v.y * 0.5 + 0.5) * innerHeight,
  };
}
