import type { CaseStudy } from '../data/types';

export class DetailPanel {
  private panel: HTMLElement;
  private scrim: HTMLElement;

  constructor() {
    this.panel = document.getElementById('panel') as HTMLElement;
    this.scrim = document.getElementById('panelScrim') as HTMLElement;
    this.scrim.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  }

  open(c: CaseStudy): void {
    const inner = this.panel.querySelector('.panel-inner') as HTMLElement;
    inner.innerHTML = `
      <div class="pn-head">
        <div class="pn-client">${c.client}</div>
        <button class="pn-close" id="panelClose">✕</button>
      </div>
      <div class="pn-meta">
        <span class="pn-row"><span class="pn-key">YEAR</span><span class="pn-val">${c.year}</span></span>
        <span class="pn-row"><span class="pn-key">COUNTRY</span><span class="pn-val">${c.countries.join(', ')}</span></span>
        <span class="pn-row"><span class="pn-key">SERVICE</span><span class="pn-val">${c.services.join(', ')}</span></span>
      </div>
      <div class="pn-title">${c.title}</div>
      ${c.permission ? `
        <div class="pn-section"><div class="pn-section-label">CHALLENGE</div><div class="pn-body">${c.challenge}</div></div>
        <div class="pn-section"><div class="pn-section-label">APPROACH</div><div class="pn-body">${c.approach}</div></div>
        <div class="pn-section"><div class="pn-section-label">METRICS</div><div class="pn-body">${c.metrics}</div></div>
      ` : `<div class="pn-locked">Content restricted</div>`}
    `;
    inner.querySelector('#panelClose')?.addEventListener('click', () => this.close());
    this.panel.classList.add('open');
    this.scrim.classList.add('on');
  }

  close(): void {
    this.panel.classList.remove('open');
    this.scrim.classList.remove('on');
  }
}
