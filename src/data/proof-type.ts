import type { Metric } from './types';

export enum ProofType {
  Revenue        = 'Revenue',
  Conversion     = 'Conversion',
  Awareness      = 'Awareness',
  CostEfficiency = 'CostEfficiency',
  Engagement     = 'Engagement',
}

const PROOF_KEYWORDS: [ProofType, string[]][] = [
  [ProofType.Revenue,        ['roas', 'revenue', 'sales', 'roi', 'return on']],
  [ProofType.Conversion,     ['conver', 'cpa', 'lead', 'acqui', 'qualified call']],
  [ProofType.Awareness,      ['brand', 'aware', 'recall', 'reach', 'impression', 'search', 'visibility']],
  [ProofType.CostEfficiency, ['cpm', 'cpc', 'cost per', 'efficien', 'cheaper', 'saving']],
  [ProofType.Engagement,     ['click', 'ctr', 'engagement', 'view', 'vtr', 'follower', 'watch', 'interaction']],
];

/**
 * Classifies a set of metrics into a ProofType based on keyword matching.
 *
 * For each metric label, the FIRST matching keyword row wins (first match
 * per label — break). Tallies per ProofType. Returns the type with the most
 * hits. Tie: earlier in PROOF_KEYWORDS wins. No matches: Engagement fallback.
 */
export function classifyProofType(metrics: Metric[]): ProofType {
  const tally = new Map<ProofType, number>(
    PROOF_KEYWORDS.map(([type]) => [type, 0])
  );

  for (const metric of metrics) {
    const normalized = metric.label.toLowerCase();
    for (const [type, keywords] of PROOF_KEYWORDS) {
      if (keywords.some(kw => normalized.includes(kw))) {
        tally.set(type, (tally.get(type) ?? 0) + 1);
        break; // first match per label wins
      }
    }
  }

  let winner: ProofType = ProofType.Engagement;
  let max = -1;

  for (const [type] of PROOF_KEYWORDS) {
    const count = tally.get(type) ?? 0;
    if (count > max) {
      max = count;
      winner = type;
    }
  }

  // If nothing matched (max is still 0 after iteration), return Engagement
  return max === 0 ? ProofType.Engagement : winner;
}
