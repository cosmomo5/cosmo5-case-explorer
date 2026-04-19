import { type FilterState } from './filter';
import { ProofType } from './proof-type';
import type { ImpactScaleBand } from './impact-scale';
import type { CaseStudy } from './types';

export interface KeywordHint {
  keywords: string[];
  apply: (fs: FilterState, cases: CaseStudy[]) => void;
}

export const KEYWORD_HINTS: KeywordHint[] = [
  // Service dimensions
  { keywords: ['performance', 'paid', 'ppc', 'sem'],
    apply: fs => { fs.services.add('Performance Marketing'); fs.services.add('Paid Media'); } },
  { keywords: ['social media', 'social', 'instagram', 'tiktok'],
    apply: fs => { fs.services.add('Social Media'); } },
  { keywords: ['seo', 'organic'],
    apply: fs => { fs.services.add('Search (SEO/SEM)'); } },
  { keywords: ['brand', 'branding'],
    apply: fs => { fs.services.add('Brand Strategy'); } },
  { keywords: ['data', 'analytics', 'insight'],
    apply: fs => { fs.services.add('Data Analytics'); } },
  { keywords: ['content'],
    apply: fs => { fs.services.add('Content Strategy'); } },
  { keywords: ['influencer'],
    apply: fs => { fs.services.add('Influencer Marketing'); } },
  { keywords: ['programmatic', 'display'],
    apply: fs => { fs.services.add('Programmatic'); } },
  { keywords: ['email', 'crm', 'retention'],
    apply: fs => { fs.services.add('Email Marketing'); } },
  { keywords: ['video', 'production'],
    apply: fs => { fs.services.add('Video Production'); } },
  { keywords: ['ecommerce', 'e-commerce', 'commerce'],
    apply: fs => { fs.services.add('E-commerce'); } },
  { keywords: ['research', 'study', 'survey'],
    apply: fs => { fs.services.add('Market Research'); } },
  { keywords: ['ux', 'web', 'digital'],
    apply: fs => { fs.services.add('UX & Web'); } },
  { keywords: ['fintech', 'finance'],
    apply: fs => { fs.services.add('Finance & Insurance'); } },
  { keywords: ['media planning'],
    apply: fs => { fs.services.add('Media Planning'); } },
  { keywords: ['pr', 'communications', 'public relations'],
    apply: fs => { fs.services.add('PR & Communications'); } },
  { keywords: ['campaign'],
    apply: fs => { fs.services.add('Campaign Strategy'); } },

  // ProofType dimensions
  { keywords: ['revenue', 'sales', 'growth', 'roi', 'return'],
    apply: fs => { (fs.proofTypes as Set<ProofType>).add(ProofType.Revenue); } },
  { keywords: ['conversion', 'convert', 'lead'],
    apply: fs => { (fs.proofTypes as Set<ProofType>).add(ProofType.Conversion); } },
  { keywords: ['awareness', 'brand lift', 'reach'],
    apply: fs => { (fs.proofTypes as Set<ProofType>).add(ProofType.Awareness); } },
  { keywords: ['efficiency', 'cost', 'saving', 'cpa'],
    apply: fs => { (fs.proofTypes as Set<ProofType>).add(ProofType.CostEfficiency); } },
  { keywords: ['engagement', 'community', 'audience'],
    apply: fs => { (fs.proofTypes as Set<ProofType>).add(ProofType.Engagement); } },

  // ImpactBand dimensions
  { keywords: ['transformative', 'breakthrough', 'game-changing'],
    apply: fs => { (fs.impactBands as Set<ImpactScaleBand>).add('transformative'); } },
  { keywords: ['significant', 'major'],
    apply: fs => { (fs.impactBands as Set<ImpactScaleBand>).add('significant'); } },

  // Year dimensions
  { keywords: ['2024', 'last year'],
    apply: fs => { fs.years.add(2024); } },
  { keywords: ['2025'],
    apply: fs => { fs.years.add(2025); } },
  { keywords: ['2026', 'this year'],
    apply: fs => { fs.years.add(2026); } },

  // Region → country expansion (runtime, from cases array)
  { keywords: ['europe', 'european'],
    apply: (fs, cases) => {
      const europeanCountries = [...new Set(
        cases.filter(c => c.region === 'Europe').flatMap(c => c.countries)
      )];
      for (const country of europeanCountries) fs.countries.add(country);
    } },
  { keywords: ['americas', 'america', ' us ', 'usa', 'united states'],
    apply: (fs, cases) => {
      const americasCountries = [...new Set(
        cases.filter(c => c.region === 'Americas').flatMap(c => c.countries)
      )];
      for (const country of americasCountries) fs.countries.add(country);
    } },
  { keywords: ['asia', 'apac', 'asia-pacific'],
    apply: (fs, cases) => {
      const apacCountries = [...new Set(
        cases.filter(c => c.region === 'Asia-Pacific').flatMap(c => c.countries)
      )];
      for (const country of apacCountries) fs.countries.add(country);
    } },
];

export function applyQuery(q: string, fs: FilterState, cases: CaseStudy[]): void {
  const norm = q.trim().toLowerCase();

  // Clear all dimension sets
  fs.countries = new Set();
  fs.services = new Set();
  fs.years = new Set();
  fs.nucleusKeys = new Set();
  fs.proofTypes = new Set();
  fs.impactBands = new Set();

  if (!norm) return; // empty query = clear all

  for (const hint of KEYWORD_HINTS) {
    if (hint.keywords.some(kw => norm.includes(kw))) {
      hint.apply(fs, cases);
    }
  }
}
