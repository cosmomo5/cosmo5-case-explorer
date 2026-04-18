import type { ViewStateMachine } from '../data/view-state';

export interface ObservatoryHeaderHandle {
  element: HTMLElement;
  unmount: () => void;
}

/**
 * Mounts the persistent top-strip instrument header into #observatory-header.
 * Segments: `CASE EXPLORER · CASE_COUNT {n} · STATUS {CALIBRATING|OBSERVING} · EPOCH 2026`.
 * STATUS subscribes to viewState: planetary → CALIBRATING, else → OBSERVING.
 *
 * The header is the ONLY persistent chrome while body.planetary is set — the
 * chrome-hide CSS (style.css, Phase 16-03) omits #observatory-header from its
 * hide list so the instrument readout remains visible across all view-states.
 */
export function mountObservatoryHeader(
  caseCount: number,
  viewState: ViewStateMachine,
): ObservatoryHeaderHandle {
  const host = document.getElementById('observatory-header');
  if (!host) throw new Error('[observatory-header] #observatory-header slot not found in DOM');

  host.innerHTML = '';

  const make = (text: string, cls = '') => {
    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = text;
    return span;
  };
  const sep = () => make('·', 'oh-sep');

  host.appendChild(make('CASE EXPLORER'));
  host.appendChild(sep());
  host.appendChild(make(`CASE_COUNT ${caseCount}`));
  host.appendChild(sep());

  const statusLabel = make('STATUS', '');
  const statusValue = make('CALIBRATING', 'oh-status');
  host.appendChild(statusLabel);
  host.appendChild(statusValue);
  host.appendChild(sep());

  host.appendChild(make('EPOCH 2026'));

  const unsubscribe = viewState.subscribe((next) => {
    statusValue.textContent = next.kind === 'planetary' ? 'CALIBRATING' : 'OBSERVING';
  });

  return {
    element: host,
    unmount: () => {
      unsubscribe();
      host.innerHTML = '';
    },
  };
}
