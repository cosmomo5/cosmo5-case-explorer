import type { CaseStudy } from './types';
import { type ProofType, classifyProofType } from './proof-type';
import type { ImpactScale } from './impact-scale';
import { deriveImpactScale } from './impact-scale';

export interface EnrichedCaseStudy extends CaseStudy {
  proofType: ProofType;
  impactScale: ImpactScale;
}

export function enrichCases(cases: CaseStudy[]): EnrichedCaseStudy[] {
  return cases.map(c => ({
    ...c,
    proofType: classifyProofType(c.metrics),
    impactScale: deriveImpactScale(c.metrics),
  }));
}
