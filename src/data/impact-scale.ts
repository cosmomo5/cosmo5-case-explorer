import type { Metric } from './types';

export type ImpactScaleBand = 'incremental' | 'notable' | 'significant' | 'transformative' | 'unknown';

export interface ImpactScale {
  value: number;    // 0–1 continuous
  band: ImpactScaleBand;
  maxPct: number;   // raw max percentage
}

const UNKNOWN: ImpactScale = { value: 0, band: 'unknown', maxPct: 0 };

/**
 * Parses a metric value string into a percentage (0-based, e.g. 40.87 for 40.87%).
 * Returns null if the value cannot be interpreted as a percentage or multiplier.
 *
 * Rules:
 * - 'n/a' → null
 * - Detect `x` suffix → multiplier (result * 100)
 * - Replace `,` with `.` for European decimals BEFORE parseFloat
 * - Strip +/-, %/$€£x for parsing
 * - Absolute numbers without % or x suffix → null (skip)
 */
function parseMetricPct(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();

  if (trimmed === 'n/a' || trimmed === '') return null;

  const hasPercent = trimmed.includes('%');
  const hasMultiplier = /\d+x/.test(trimmed) || trimmed.endsWith('x');

  // Absolute numbers without % or x do not count
  if (!hasPercent && !hasMultiplier) return null;

  // European decimal: replace comma with dot BEFORE parseFloat
  const normalized = trimmed
    .replace(',', '.')
    .replace(/[+\-$€£%x]/g, '');

  const parsed = parseFloat(normalized);
  if (isNaN(parsed)) return null;

  return hasMultiplier ? parsed * 100 : parsed;
}

function bandFromPct(pct: number): ImpactScaleBand {
  if (pct <= 20)  return 'incremental';
  if (pct <= 100) return 'notable';
  if (pct <= 300) return 'significant';
  return 'transformative';
}

function valueFromPct(pct: number, band: ImpactScaleBand): number {
  switch (band) {
    case 'incremental':
      return (pct / 20) * 0.2;
    case 'notable':
      return 0.2 + ((pct - 20) / 80) * 0.3;
    case 'significant':
      return 0.5 + ((pct - 100) / 200) * 0.25;
    case 'transformative':
      return Math.min(1.0, 0.75 + ((pct - 300) / 5000) * 0.25);
    default:
      return 0;
  }
}

/**
 * Derives an ImpactScale from a set of metrics by taking the maximum
 * parsed percentage across all metric values.
 */
export function deriveImpactScale(metrics: Metric[]): ImpactScale {
  if (metrics.length === 0) return UNKNOWN;

  let maxPct = -Infinity;

  for (const metric of metrics) {
    const pct = parseMetricPct(metric.value);
    if (pct !== null && pct > maxPct) {
      maxPct = pct;
    }
  }

  if (maxPct === -Infinity) return UNKNOWN;

  const band = bandFromPct(maxPct);
  const value = valueFromPct(maxPct, band);

  return { value, band, maxPct };
}
