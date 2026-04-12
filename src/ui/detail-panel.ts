import type { CaseStudy } from '../data/types';

/** Returns initials for the contributor avatar */
function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
}

/** Tag positive/negative/neutral metric values for color classes */
function metricClass(val: string): string {
  const stripped = val.replace(/[^0-9.+-]/g, '');
  if (/^\+/.test(val) || (parseFloat(stripped) > 0 && !/^[-–]/.test(val))) return 'pos';
  if (/^[-–]/.test(val)) return 'neg';
  return 'neu';
}

export class DetailPanel {
  private panel: HTMLElement;
  private scrim: HTMLElement;
  private closeBtn: HTMLElement;

  // DOM refs populated once at construction
  private elRegion: HTMLElement;
  private elClient: HTMLElement;
  private elTitle: HTMLElement;
  private elMeta: HTMLElement;
  private elChalWrap: HTMLElement;
  private elChal: HTMLElement;
  private elApprWrap: HTMLElement;
  private elAppr: HTMLElement;
  private elImpact: HTMLElement;
  private elMetrics: HTMLElement;
  private elContribWrap: HTMLElement;
  private elAvatar: HTMLElement;
  private elCname: HTMLElement;
  private elCsrc: HTMLElement;
  private elLocked: HTMLElement;

  constructor() {
    this.panel  = document.getElementById('panel')      as HTMLElement;
    this.scrim  = document.getElementById('panelScrim') as HTMLElement;
    this.closeBtn = document.getElementById('close')    as HTMLElement;

    // Cache all static IDs — they live in the HTML and never move
    this.elRegion    = document.getElementById('p-region')      as HTMLElement;
    this.elClient    = document.getElementById('p-client')      as HTMLElement;
    this.elTitle     = document.getElementById('p-title')       as HTMLElement;
    this.elMeta      = document.getElementById('p-meta')        as HTMLElement;
    this.elChalWrap  = document.getElementById('p-chal-wrap')   as HTMLElement;
    this.elChal      = document.getElementById('p-chal')        as HTMLElement;
    this.elApprWrap  = document.getElementById('p-appr-wrap')   as HTMLElement;
    this.elAppr      = document.getElementById('p-appr')        as HTMLElement;
    this.elImpact    = document.getElementById('p-impact')      as HTMLElement;
    this.elMetrics   = document.getElementById('p-metrics')     as HTMLElement;
    this.elContribWrap = document.getElementById('p-contrib-wrap') as HTMLElement;
    this.elAvatar    = document.getElementById('p-avatar')      as HTMLElement;
    this.elCname     = document.getElementById('p-cname')       as HTMLElement;
    this.elCsrc      = document.getElementById('p-csrc')        as HTMLElement;
    this.elLocked    = document.getElementById('p-locked')      as HTMLElement;

    this.scrim.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  }

  open(c: CaseStudy): void {
    // Region eyebrow
    this.elRegion.textContent = c.region || 'Global';

    // Typography fix: title is the hero, client is the label above it
    this.elClient.textContent = c.client;
    this.elTitle.textContent  = c.title;

    // Meta chips: year + services + countries
    this.elMeta.innerHTML = [
      `<span class="chip chip-yr">${c.year}</span>`,
      ...c.services.map(s  => `<span class="chip chip-svc">${s}</span>`),
      ...c.countries.map(co => `<span class="chip chip-geo">${co}</span>`),
    ].join('');

    if (c.permission) {
      // Challenge
      this.elChalWrap.style.display = '';
      this.elChal.textContent = c.challenge;

      // Approach
      this.elApprWrap.style.display = '';
      this.elAppr.textContent = c.approach;

      // Metrics
      if (c.metrics && c.metrics.length > 0) {
        this.elImpact.style.display = '';
        this.elMetrics.innerHTML = c.metrics.map(m => `
          <div class="metric-card">
            <div class="metric-val ${metricClass(m.value)}">${m.value}</div>
            <div class="metric-lbl">${m.label}</div>
          </div>`).join('');
      } else {
        this.elImpact.style.display = 'none';
      }

      // Contributor
      if (c.contributor_name) {
        this.elContribWrap.style.display = '';
        this.elAvatar.textContent = initials(c.contributor_name);
        this.elCname.textContent  = c.contributor_name;
        this.elCsrc.textContent   = c.contributor_source ?? 'Cosmo5 Contributor';
      } else {
        this.elContribWrap.style.display = 'none';
      }

      this.elLocked.style.display = 'none';
    } else {
      // Restricted — hide body sections, show locked banner
      this.elChalWrap.style.display  = 'none';
      this.elApprWrap.style.display  = 'none';
      this.elImpact.style.display    = 'none';
      this.elContribWrap.style.display = 'none';
      this.elLocked.style.display    = '';
    }

    this.panel.classList.add('open');
    this.scrim.classList.add('on');
  }

  close(): void {
    this.panel.classList.remove('open');
    this.scrim.classList.remove('on');
  }

  isOpen(): boolean {
    return this.panel.classList.contains('open');
  }
}
