import * as THREE from 'three';
import type { EnrichedCaseStudy } from '../../data/enrich';
import type { NucleusOrbitData } from './nucleus-orbit';
import { nucleusPositionAt } from './nucleus-orbit';
import { hash } from './hash';

interface Vec3 { x: number; y: number; z: number }

export type RingDimension = 'country' | 'region' | 'year' | 'proofType' | 'impactBand';

export interface RingOrbit {
  caseStudy: EnrichedCaseStudy;
  nucleusKey: string;
  ringIndex: number;
  ringRadius: number;
  ringValue: string;
  angleOffset: number;
  angularSpeed: number;
  orbitCenter: Vec3;
  orbitU: Vec3;
  orbitV: Vec3;
}

export interface ConcentricConfig {
  baseRadius: number;
  ringSpacing: number;
  angularSpeedBase: number;
}

export interface ConcentricOrbitResult {
  rings: Map<string, RingOrbit[]>;
  ringRadii: Map<string, number>;
  ringOrder: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getDimensionValue(c: EnrichedCaseStudy, dim: RingDimension): string {
  switch (dim) {
    case 'proofType':   return c.proofType;
    case 'impactBand':  return c.impactScale?.band ?? 'unknown';
    case 'country':     return c.countries[0] ?? 'Unknown';
    case 'region':      return c.region;
    case 'year':        return String(c.year);
  }
}

// ---------------------------------------------------------------------------
// computeConcentricOrbits
// ---------------------------------------------------------------------------

export function computeConcentricOrbits(
  cases: EnrichedCaseStudy[],
  dimension: RingDimension,
  nucleusOrbit: NucleusOrbitData,
  config: ConcentricConfig,
): RingOrbit[] {
  if (cases.length === 0) return [];

  // Group cases by dimension value
  const grouped = new Map<string, EnrichedCaseStudy[]>();
  for (const c of cases) {
    const val = getDimensionValue(c, dimension);
    if (!grouped.has(val)) grouped.set(val, []);
    grouped.get(val)!.push(c);
  }

  // Sort groups: ordinal dimensions by scale, categorical by case count
  const isOrdinal = dimension === 'year' || dimension === 'impactBand';
  const IMPACT_ORDER: Record<string, number> = {
    'incremental': 0, 'notable': 1, 'significant': 2, 'transformative': 3, 'unknown': 4,
  };

  let sortedGroups: [string, EnrichedCaseStudy[]][];
  if (dimension === 'year') {
    // Inner ring = earliest year, outer = latest
    sortedGroups = [...grouped.entries()].sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  } else if (dimension === 'impactBand') {
    // Inner ring = incremental, outer = transformative
    sortedGroups = [...grouped.entries()].sort(
      (a, b) => (IMPACT_ORDER[a[0]] ?? 99) - (IMPACT_ORDER[b[0]] ?? 99),
    );
  } else {
    // Categorical: inner = fewest cases, outer = most cases
    sortedGroups = [...grouped.entries()].sort((a, b) => a[1].length - b[1].length);
  }

  // Clamp to max 8 rings
  const clampedGroups = isOrdinal
    ? sortedGroups.slice(0, 8) // keep ordinal order, drop excess from the end
    : sortedGroups.slice(-8);  // keep the 8 largest groups

  const orbitCenter = nucleusPositionAt(nucleusOrbit, 0);

  const result: RingOrbit[] = [];

  for (let ringIndex = 0; ringIndex < clampedGroups.length; ringIndex++) {
    const [ringValue, ringCases] = clampedGroups[ringIndex];
    const ringRadius = config.baseRadius + ringIndex * config.ringSpacing;
    const angularSpeed = config.angularSpeedBase / Math.sqrt(ringIndex + 1);

    for (let caseIdx = 0; caseIdx < ringCases.length; caseIdx++) {
      const c = ringCases[caseIdx];
      const angleOffset =
        (caseIdx / ringCases.length) * 2 * Math.PI + hash(c.id) * 0.1;

      result.push({
        caseStudy: c,
        nucleusKey: nucleusOrbit.key,
        ringIndex,
        ringRadius,
        ringValue,
        angleOffset,
        angularSpeed,
        orbitCenter: { ...orbitCenter },
        orbitU: { ...nucleusOrbit.orbitU },
        orbitV: { ...nucleusOrbit.orbitV },
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// ringPositionAt
// ---------------------------------------------------------------------------

/**
 * Compute the world-space position of a ring orbit at time t.
 * Pass `out` to reuse an existing object and avoid per-frame allocations.
 */
export function ringPositionAt(ring: RingOrbit, t: number, out?: Vec3): Vec3 {
  const angle = ring.angleOffset + t * ring.angularSpeed;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const r = ring.ringRadius;
  const o = out ?? { x: 0, y: 0, z: 0 };
  o.x = ring.orbitCenter.x + r * (ring.orbitU.x * cos + ring.orbitV.x * sin);
  o.y = ring.orbitCenter.y + r * (ring.orbitU.y * cos + ring.orbitV.y * sin);
  o.z = ring.orbitCenter.z + r * (ring.orbitU.z * cos + ring.orbitV.z * sin);
  return o;
}

// ---------------------------------------------------------------------------
// autoSelectRingDimension
// ---------------------------------------------------------------------------

const ALL_RING_DIMENSIONS: RingDimension[] = [
  'country', 'region', 'year', 'proofType', 'impactBand',
];

function log2(x: number): number {
  return Math.log(x) / Math.log(2);
}

function normalizedEntropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  const k = counts.length;
  if (k < 2 || total === 0) return 0;
  const entropy = counts.reduce((sum, count) => {
    const p = count / total;
    return sum - p * log2(p);
  }, 0);
  return entropy / log2(k);
}

/**
 * Select the ring dimension that best complements masterDimension.
 * Excludes masterDimension itself, and 'region' when masterDimension is 'country'.
 * Picks the candidate with the highest normalized entropy (most evenly distributed).
 * Fallback: 'proofType'.
 */
export function autoSelectRingDimension(
  cases: EnrichedCaseStudy[],
  masterDimension: string,
): RingDimension {
  const excluded = new Set<string>([masterDimension]);
  if (masterDimension === 'country') excluded.add('region');

  let bestDim: RingDimension = 'proofType';
  let bestScore = -Infinity;

  for (const dim of ALL_RING_DIMENSIONS) {
    if (excluded.has(dim)) continue;

    // Group cases by this dimension
    const counts = new Map<string, number>();
    for (const c of cases) {
      const val = getDimensionValue(c, dim);
      counts.set(val, (counts.get(val) ?? 0) + 1);
    }

    const k = counts.size;
    if (k < 2 || k > 8) continue;

    const score = normalizedEntropy([...counts.values()]);
    if (score > bestScore) {
      bestScore = score;
      bestDim = dim;
    }
  }

  return bestDim;
}

// ---------------------------------------------------------------------------
// Three.js ring line helpers
// ---------------------------------------------------------------------------

export function buildRingLine(
  radius: number,
  center: THREE.Vector3,
  planeNormal: THREE.Vector3,
  color: number,
): THREE.LineLoop {
  const segments = 128;
  const pts: THREE.Vector3[] = [];
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    planeNormal.clone().normalize(),
  );
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const local = new THREE.Vector3(radius * Math.cos(a), radius * Math.sin(a), 0);
    pts.push(local.applyQuaternion(q).add(center));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  return new THREE.LineLoop(geo, mat);
}

export function disposeRingLines(lines: THREE.LineLoop[], scene: THREE.Scene): void {
  for (const line of lines) {
    scene.remove(line);
    line.geometry.dispose();
    (line.material as THREE.LineBasicMaterial).dispose();
  }
}
