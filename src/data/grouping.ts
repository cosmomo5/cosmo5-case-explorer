import type { CaseStudy, GroupMode } from './types';

export const SERVICE_TO_VERTICAL: Record<string, string> = {
  'Video Ads':         'Media',
  'Social Paid':       'Media',
  'Programmatic':      'Media',
  'Media':             'Media',
  'SEA':               'Performance',
  'Search':            'Performance',
  'SEO':               'Performance',
  'Amazon':            'Commerce',
  'Marketplaces':      'Commerce',
  'Feed':              'Commerce',
  'Commerce':          'Commerce',
  'Data':              'Data & Intelligence',
  'Data Measurement':  'Data & Intelligence',
  'Business strategy': 'Strategy',
  'Consulting':        'Strategy',
  'Organization':      'Strategy',
  'GEO':               'GEO',
  'Creative':          'Creative',
  'Influence':         'Creative',
};

export function groupBy(cases: CaseStudy[], mode: GroupMode): Record<string, CaseStudy[]> {
  const result: Record<string, CaseStudy[]> = {};
  for (const c of cases) {
    let key: string;
    if (mode === 'vertical') {
      key = SERVICE_TO_VERTICAL[c.services[0]] ?? 'Other';
    } else if (mode === 'country') {
      key = c.countries[0] ?? 'Other';
    } else {
      key = c.region ?? 'Other';
    }
    (result[key] ??= []).push(c);
  }
  return result;
}
