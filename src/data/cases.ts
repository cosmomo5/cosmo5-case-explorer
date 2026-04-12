export interface Case {
  id: string
  client: string
  year: number
  services: string[]
  countries: string[]
  region: string
  permission: boolean
  contributor_source: string
  contributor_name: string
  title: string
  challenge: string
  approach: string
  metrics: { value: string; label: string }[]
  industry: string
  capability: string
  business_type: string
  slide_url: string
  case_url: string
}

export interface CaseIndex {
  cases: Case[]
  byCountry: Record<string, Case[]>
  byIndustry: Record<string, Case[]>
  byCapability: Record<string, Case[]>
  byService: Record<string, Case[]>
  allCountries: string[]
  allIndustries: string[]
  allCapabilities: string[]
  allServices: string[]
  allYears: number[]
  /** multi-country case connections: caseId -> array of caseIds that share countries */
  multiCountryLinks: Record<string, string[]>
  /** industry connections across countries: caseId -> array of caseIds in different countries, same industry */
  industryLinks: Record<string, string[]>
}

export async function loadCases(): Promise<CaseIndex> {
  const res = await fetch('/cases.json')
  const cases: Case[] = await res.json()

  const byCountry: Record<string, Case[]> = {}
  const byIndustry: Record<string, Case[]> = {}
  const byCapability: Record<string, Case[]> = {}
  const byService: Record<string, Case[]> = {}

  for (const c of cases) {
    for (const cc of c.countries) {
      ;(byCountry[cc] = byCountry[cc] || []).push(c)
    }
    if (c.industry) {
      ;(byIndustry[c.industry] = byIndustry[c.industry] || []).push(c)
    }
    if (c.capability) {
      ;(byCapability[c.capability] = byCapability[c.capability] || []).push(c)
    }
    for (const s of c.services) {
      ;(byService[s] = byService[s] || []).push(c)
    }
  }

  // Build connection maps
  // Multi-country: cases that appear in multiple countries link to each other
  const multiCountryLinks: Record<string, string[]> = {}
  for (const c of cases) {
    if (c.countries.length > 1) {
      // Find all other cases that share ANY of the same countries (and are in a different country's constellation)
      const related: string[] = []
      for (const c2 of cases) {
        if (c2.id === c.id) continue
        const shared = c.countries.filter(cc => c2.countries.includes(cc))
        if (shared.length > 0 && c2.countries.some(cc => !c.countries.includes(cc))) {
          related.push(c2.id)
        }
      }
      if (related.length) multiCountryLinks[c.id] = related
    }
  }

  // Industry links: same industry, different primary country
  const industryLinks: Record<string, string[]> = {}
  for (const c of cases) {
    if (!c.industry) continue
    const primaryCountry = c.countries[0]
    const related = cases
      .filter(c2 => c2.id !== c.id && c2.industry === c.industry && c2.countries[0] !== primaryCountry)
      .map(c2 => c2.id)
    if (related.length) industryLinks[c.id] = related
  }

  return {
    cases,
    byCountry,
    byIndustry,
    byCapability,
    byService,
    allCountries: Object.keys(byCountry).sort(),
    allIndustries: Object.keys(byIndustry).sort(),
    allCapabilities: Object.keys(byCapability).sort(),
    allServices: Object.keys(byService).sort(),
    allYears: [...new Set(cases.map(c => c.year))].sort((a, b) => b - a),
    multiCountryLinks,
    industryLinks,
  }
}
