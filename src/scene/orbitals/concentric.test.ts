import { describe, it, expect } from 'vitest';
import {
  computeConcentricOrbits,
  ringPositionAt,
  autoSelectRingDimension,
  type RingOrbit,
  type ConcentricConfig,
} from './concentric';
import type { NucleusOrbitData } from './nucleus-orbit';
import type { EnrichedCaseStudy } from '../../data/enrich';
import { ProofType } from '../../data/proof-type';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeNucleus(overrides?: Partial<NucleusOrbitData>): NucleusOrbitData {
  return {
    key: 'Test',
    orbitR: 200,
    orbitU: { x: 1, y: 0, z: 0 },
    orbitV: { x: 0, y: 1, z: 0 },
    phase: 0,
    speed: 0,
    cases: [],
    ...overrides,
  };
}

function makeCase(id: string, overrides?: Partial<EnrichedCaseStudy>): EnrichedCaseStudy {
  return {
    id,
    client: 'Test',
    year: 2024,
    services: [],
    countries: ['DE'],
    region: 'EMEA',
    permission: true,
    title: 'T',
    challenge: '',
    approach: '',
    metrics: [],
    proofType: ProofType.Engagement,
    impactScale: { value: 0.5, band: 'notable', maxPct: 50 },
    ...overrides,
  };
}

const DEFAULT_CONFIG: ConcentricConfig = {
  baseRadius: 30,
  ringSpacing: 15,
  angularSpeedBase: 0.00008,
};

// ---------------------------------------------------------------------------
// computeConcentricOrbits
// ---------------------------------------------------------------------------

describe('computeConcentricOrbits', () => {
  it('10 cases all same proofType → 1 ring with 10 orbits', () => {
    const cases = Array.from({ length: 10 }, (_, i) =>
      makeCase(`c${i}`, { proofType: ProofType.Engagement }),
    );
    const result = computeConcentricOrbits(cases, 'proofType', makeNucleus(), DEFAULT_CONFIG);
    expect(result).toHaveLength(10);
    const distinctRings = new Set(result.map(r => r.ringIndex));
    expect(distinctRings.size).toBe(1);
  });

  it('15 cases, 3 proofTypes (5 each) → 3 rings of 5', () => {
    const types = [ProofType.Revenue, ProofType.Conversion, ProofType.Awareness];
    const cases = types.flatMap((pt, ti) =>
      Array.from({ length: 5 }, (_, i) => makeCase(`c${ti}-${i}`, { proofType: pt })),
    );
    const result = computeConcentricOrbits(cases, 'proofType', makeNucleus(), DEFAULT_CONFIG);
    expect(result).toHaveLength(15);
    const distinctRings = new Set(result.map(r => r.ringIndex));
    expect(distinctRings.size).toBe(3);
    for (const ringIdx of distinctRings) {
      const inRing = result.filter(r => r.ringIndex === ringIdx);
      expect(inRing).toHaveLength(5);
    }
  });

  it('outer ring has >= cases than inner rings', () => {
    // 3 groups of different sizes: 2, 4, 6 → outermost should have 6
    const cases = [
      ...Array.from({ length: 2 }, (_, i) => makeCase(`a${i}`, { proofType: ProofType.Revenue })),
      ...Array.from({ length: 4 }, (_, i) => makeCase(`b${i}`, { proofType: ProofType.Conversion })),
      ...Array.from({ length: 6 }, (_, i) => makeCase(`c${i}`, { proofType: ProofType.Awareness })),
    ];
    const result = computeConcentricOrbits(cases, 'proofType', makeNucleus(), DEFAULT_CONFIG);
    // Find max ringIndex (outermost)
    const maxRingIdx = Math.max(...result.map(r => r.ringIndex));
    const outerCount = result.filter(r => r.ringIndex === maxRingIdx).length;
    // Every other ring should have <= outerCount cases
    for (const r of result) {
      if (r.ringIndex < maxRingIdx) {
        const thisRingCount = result.filter(x => x.ringIndex === r.ringIndex).length;
        expect(thisRingCount).toBeLessThanOrEqual(outerCount);
      }
    }
  });

  it('ring radii increase monotonically', () => {
    const types = [ProofType.Revenue, ProofType.Conversion, ProofType.Awareness, ProofType.CostEfficiency];
    const cases = types.flatMap((pt, ti) =>
      Array.from({ length: 3 }, (_, i) => makeCase(`c${ti}-${i}`, { proofType: pt })),
    );
    const result = computeConcentricOrbits(cases, 'proofType', makeNucleus(), DEFAULT_CONFIG);
    // Collect unique (ringIndex, ringRadius) pairs
    const radiusMap = new Map<number, number>();
    for (const r of result) {
      radiusMap.set(r.ringIndex, r.ringRadius);
    }
    const sorted = [...radiusMap.entries()].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i][1]).toBeGreaterThan(sorted[i - 1][1]);
    }
  });

  it('every case appears exactly once', () => {
    const cases = Array.from({ length: 12 }, (_, i) =>
      makeCase(`c${i}`, { proofType: i < 6 ? ProofType.Engagement : ProofType.Revenue }),
    );
    const result = computeConcentricOrbits(cases, 'proofType', makeNucleus(), DEFAULT_CONFIG);
    expect(result).toHaveLength(12);
    const ids = result.map(r => r.caseStudy.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(12);
  });

  it('each RingOrbit.orbitU equals the NucleusOrbitData.orbitU', () => {
    const nucleus = makeNucleus({ orbitU: { x: 0.5, y: 0.5, z: 0.707 } });
    const cases = Array.from({ length: 4 }, (_, i) => makeCase(`c${i}`));
    const result = computeConcentricOrbits(cases, 'proofType', nucleus, DEFAULT_CONFIG);
    for (const r of result) {
      expect(r.orbitU).toEqual(nucleus.orbitU);
    }
  });

  it('0 cases → empty array', () => {
    const result = computeConcentricOrbits([], 'proofType', makeNucleus(), DEFAULT_CONFIG);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// ringPositionAt
// ---------------------------------------------------------------------------

describe('ringPositionAt', () => {
  function makeRing(overrides?: Partial<RingOrbit>): RingOrbit {
    return {
      caseStudy: makeCase('x'),
      nucleusKey: 'Test',
      ringIndex: 0,
      ringRadius: 50,
      ringValue: 'v',
      angleOffset: 0,
      angularSpeed: 0.0001,
      orbitCenter: { x: 0, y: 0, z: 0 },
      orbitU: { x: 1, y: 0, z: 0 },
      orbitV: { x: 0, y: 1, z: 0 },
      ...overrides,
    };
  }

  it('distance from orbitCenter ≈ ring.ringRadius (within 0.01)', () => {
    const ring = makeRing({ ringRadius: 50 });
    const pos = ringPositionAt(ring, 100);
    const dx = pos.x - ring.orbitCenter.x;
    const dy = pos.y - ring.orbitCenter.y;
    const dz = pos.z - ring.orbitCenter.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    expect(dist).toBeCloseTo(50, 1);
  });

  it('flat XY plane: z equals orbitCenter.z', () => {
    const ring = makeRing({
      orbitU: { x: 1, y: 0, z: 0 },
      orbitV: { x: 0, y: 1, z: 0 },
      orbitCenter: { x: 0, y: 0, z: 5 },
    });
    const pos = ringPositionAt(ring, 0);
    expect(pos.z).toBeCloseTo(5, 5);
  });

  it('tilted plane: z DIFFERS from orbitCenter.z', () => {
    const ring = makeRing({
      orbitU: { x: 1, y: 0, z: 0 },
      orbitV: { x: 0, y: 0.9, z: -0.44 },
      orbitCenter: { x: 0, y: 0, z: 0 },
      angleOffset: Math.PI / 4, // 45° so both sin and cos contribute
    });
    const pos = ringPositionAt(ring, 0);
    // The V component has a z factor, so z should not be 0
    expect(Math.abs(pos.z)).toBeGreaterThan(0.001);
  });

  it('full revolution returns to start position (within 0.01)', () => {
    const ring = makeRing({ angularSpeed: 0.001, angleOffset: 0.3 });
    const period = (2 * Math.PI) / ring.angularSpeed;
    const pos0 = ringPositionAt(ring, 0);
    const pos1 = ringPositionAt(ring, period);
    expect(pos1.x).toBeCloseTo(pos0.x, 1);
    expect(pos1.y).toBeCloseTo(pos0.y, 1);
    expect(pos1.z).toBeCloseTo(pos0.z, 1);
  });
});

// ---------------------------------------------------------------------------
// autoSelectRingDimension
// ---------------------------------------------------------------------------

describe('autoSelectRingDimension', () => {
  it('mixed cases with varied proofType → returns proofType', () => {
    const types = [
      ProofType.Revenue, ProofType.Revenue, ProofType.Revenue,
      ProofType.Conversion, ProofType.Conversion,
      ProofType.Awareness, ProofType.Awareness,
      ProofType.Engagement,
    ];
    const cases = types.map((pt, i) => makeCase(`c${i}`, {
      proofType: pt,
      // Keep region and country uniform so proofType wins
      region: 'EMEA',
      countries: ['DE'],
    }));
    const result = autoSelectRingDimension(cases, 'region');
    expect(result).toBe('proofType');
  });

  it('all same country → skips country, returns another dimension', () => {
    // All country=DE but varied proofType
    const types = [ProofType.Revenue, ProofType.Conversion, ProofType.Awareness, ProofType.Engagement];
    const cases = types.flatMap((pt, ti) =>
      Array.from({ length: 2 }, (_, i) =>
        makeCase(`c${ti}-${i}`, { proofType: pt, countries: ['DE'] }),
      ),
    );
    const result = autoSelectRingDimension(cases, 'year');
    // country has k=1 so is skipped; should not be 'country'
    expect(result).not.toBe('country');
  });

  it('when masterDimension is country, country is excluded from candidates', () => {
    // Give proofType some variation so it can be selected
    const types = [ProofType.Revenue, ProofType.Conversion, ProofType.Awareness, ProofType.Engagement];
    const cases = types.flatMap((pt, ti) =>
      Array.from({ length: 2 }, (_, i) =>
        makeCase(`c${ti}-${i}`, {
          proofType: pt,
          countries: [`country${ti}`], // varied, would be a valid candidate
        }),
      ),
    );
    const result = autoSelectRingDimension(cases, 'country');
    expect(result).not.toBe('country');
  });
});

// ---------------------------------------------------------------------------
// Ring count clamping
// ---------------------------------------------------------------------------

describe('ring count clamping', () => {
  it('0 cases → 0 rings', () => {
    const result = computeConcentricOrbits([], 'proofType', makeNucleus(), DEFAULT_CONFIG);
    const distinctRings = new Set(result.map(r => r.ringIndex));
    expect(distinctRings.size).toBe(0);
  });

  it('cases with 9 distinct values → max 8 rings', () => {
    // 9 distinct years
    const cases = Array.from({ length: 9 }, (_, i) =>
      makeCase(`c${i}`, { year: 2010 + i }),
    );
    const result = computeConcentricOrbits(cases, 'year', makeNucleus(), DEFAULT_CONFIG);
    const distinctRings = new Set(result.map(r => r.ringIndex));
    expect(distinctRings.size).toBeLessThanOrEqual(8);
  });
});
