export interface EntryScreenOptions {
  onEnter: () => void;
}

/**
 * Mount the Entry screen overlay — the editorial arrival point before State 1.
 * Appends a full-viewport div to `parent` (typically document.body).
 *
 * CTA click lifecycle:
 *  1. Adds `entry-screen--exiting` class immediately (triggers CSS fade)
 *  2. After 200ms: removes overlay DOM, then calls options.onEnter()
 *
 * No GSAP dependency — plain CSS transition + class toggle.
 * Does not import ViewStateMachine; dispatch happens in main.ts via onEnter.
 */
export function mountEntryScreen(
  parent: HTMLElement,
  options: EntryScreenOptions,
): void {
  const el = document.createElement('div');
  el.className = 'entry-screen';

  el.innerHTML = `
    <div class="entry-hero">
      <p class="entry-eyebrow">— COSMO5 / OBSERVATORY / 2026.04</p>
      <h1 class="entry-headline">
        A cosmos of <em>proof</em>,<br>
        <span class="entry-headline-secondary">observed.</span>
      </h1>
      <p class="entry-body">
        One hundred and sixteen case studies, plotted as an atlas.<br>
        Navigate by gravity. Read by instrument.
      </p>
      <button class="entry-cta" type="button">
        <span class="entry-cta-dot">●</span>
        ENTER OBSERVATORY →
      </button>
    </div>
    <div class="entry-telemetry">
      116 cases · 13 markets · 7 verticals · 2014 — 2025
    </div>
  `;

  parent.appendChild(el);

  const btn = el.querySelector('.entry-cta') as HTMLButtonElement;
  btn.addEventListener('click', () => {
    el.classList.add('entry-screen--exiting');
    setTimeout(() => {
      el.remove();
      options.onEnter();
    }, 200);
  });
}
