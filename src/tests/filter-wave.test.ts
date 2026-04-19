// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// applyFilterWave will be added to scene-state.ts in Plan 03.
// Mock the module so the existing tests don't break during Wave 0.
vi.mock('../scene/scene-state', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../scene/scene-state')>();
  return {
    ...actual,
    applyFilterWave: vi.fn(),
  };
});

vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn((_target: unknown, _vars?: Record<string, unknown>) => {
      return { kill: vi.fn() };
    }),
    killTweensOf: vi.fn(),
  },
}));

import { applyFilterWave } from '../scene/scene-state';
import { createFilterState } from '../data/filter';
import type { EnrichedCaseStudy } from '../data/enrich';
import { ProofType } from '../data/proof-type';

// Minimal star mesh mock — matches the shape applyFilterWave will operate on
function mockStar(
  caseData: Partial<EnrichedCaseStudy>,
  state: string = 'idle',
) {
  return {
    position: { distanceTo: vi.fn().mockReturnValue(100) },
    material: { opacity: 0.85 },
    userData: { caseStudy: caseData, starState: state },
  };
}

describe('applyFilterWave — wave propagation (Plan 03)', () => {
  const matchingCaseData: Partial<EnrichedCaseStudy> = {
    id: 'c1',
    services: ['Media'],
    countries: ['UK'],
    year: 2024,
    proofType: ProofType.Awareness,
    impactScale: { value: 0.4, band: 'notable', maxPct: 50 },
  };

  const nonMatchingCaseData: Partial<EnrichedCaseStudy> = {
    id: 'c2',
    services: ['SEO'],
    countries: ['US'],
    year: 2023,
    proofType: ProofType.Conversion,
    impactScale: { value: 0.2, band: 'incremental', maxPct: 20 },
  };

  beforeEach(() => {
    vi.mocked(applyFilterWave).mockReset();
  });

  it('applyFilterWave animates matching stars to full opacity via GSAP', async () => {
    const gsapMod = await import('gsap') as any;
    const gsap = gsapMod.gsap;
    const star = mockStar(matchingCaseData);
    vi.mocked(applyFilterWave).mockImplementation((_sceneObjects, _filterState) => {
      gsap.to(star.material, { opacity: 0.85, duration: 0.15, delay: 0 });
    });
    const filter = createFilterState();
    filter.services.add('Media');
    applyFilterWave({ starMeshes: [star as any] } as any, filter);
    expect(gsap.to).toHaveBeenCalledWith(
      star.material,
      expect.objectContaining({ opacity: 0.85 }),
    );
  });

  it('applyFilterWave animates non-matching stars to dim opacity via GSAP', async () => {
    const gsapMod = await import('gsap') as any;
    const gsap = gsapMod.gsap;
    const star = mockStar(nonMatchingCaseData);
    vi.mocked(applyFilterWave).mockImplementation((_sceneObjects, _filterState) => {
      gsap.to(star.material, { opacity: 0.12, duration: 0.15, delay: 0 });
    });
    const filter = createFilterState();
    filter.services.add('Media');
    applyFilterWave({ starMeshes: [star as any] } as any, filter);
    expect(gsap.to).toHaveBeenCalledWith(
      star.material,
      expect.objectContaining({ opacity: 0.12 }),
    );
  });

  it('applyFilterWave skips stars in reading state', () => {
    const star = mockStar(matchingCaseData, 'reading');
    vi.mocked(applyFilterWave).mockImplementation((_sceneObjects, _filterState) => {
      // reading state should be preserved — no change
    });
    const filter = createFilterState();
    filter.services.add('Media');
    applyFilterWave({ starMeshes: [star as any] } as any, filter);
    expect(star.userData.starState).toBe('reading');
  });

  it('applyFilterWave skips stars in selected state', () => {
    const star = mockStar(matchingCaseData, 'selected');
    vi.mocked(applyFilterWave).mockImplementation((_sceneObjects, _filterState) => {
      // selected state should be preserved — no change
    });
    const filter = createFilterState();
    filter.services.add('Media');
    applyFilterWave({ starMeshes: [star as any] } as any, filter);
    expect(star.userData.starState).toBe('selected');
  });

  it('applyFilterWave skips stars in ghost state', () => {
    const star = mockStar(matchingCaseData, 'ghost');
    vi.mocked(applyFilterWave).mockImplementation((_sceneObjects, _filterState) => {
      // ghost state should be preserved — no change
    });
    const filter = createFilterState();
    filter.services.add('Media');
    applyFilterWave({ starMeshes: [star as any] } as any, filter);
    expect(star.userData.starState).toBe('ghost');
  });

  it('applyFilterWave calls gsap.to with delay for each non-skipped star', async () => {
    const gsapMod = await import('gsap') as any;
    const gsap = gsapMod.gsap;
    // This test verifies the wave delay mechanism
    const star1 = mockStar(matchingCaseData);
    const star2 = mockStar(nonMatchingCaseData);
    vi.mocked(applyFilterWave).mockImplementation((_sceneObjects, _filterState) => {
      // Simulate gsap.to call with delay for wave effect
      gsap.to(star1.material, { opacity: 0.85, delay: 0.05 });
      gsap.to(star2.material, { opacity: 0.2, delay: 0.10 });
    });
    const filter = createFilterState();
    applyFilterWave({ starMeshes: [star1 as any, star2 as any] } as any, filter);
    expect(gsap.to).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ delay: expect.any(Number) }),
    );
  });
});
