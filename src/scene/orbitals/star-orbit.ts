import { hash } from './hash';
import type { CaseStudy, StarOrbit } from '../../data/types';

interface Vec3 { x: number; y: number; z: number }

function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Stars are placed on the SURFACE of a sphere around their nucleus.
 * Golden-angle spiral distribution gives uniform coverage so the sphere
 * is visually recognizable from any angle. Each star slowly drifts along
 * a great circle (Rodrigues rotation) to give orbital motion.
 */
export function computeStarOrbit(
  c: CaseStudy,
  nucleusKey: string,
  nucleusCenter: Vec3,
  rMin: number,
  rMax: number,
  indexInGroup: number = 0,
  groupSize: number = 1,
): StarOrbit {
  const ah = 'orb' + c.id;

  // Sphere radius — slight variation per star for visual texture
  const r = rMin + hash(ah + 'r') * (rMax - rMin);

  // Golden-angle spiral: uniform point distribution on sphere surface
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const safeSize = Math.max(groupSize, 1);
  const t0 = indexInGroup / safeSize;
  const phi0 = Math.acos(1 - 2 * t0);   // polar angle: 0 → π
  const theta0 = GOLDEN * indexInGroup;  // azimuthal: golden spiral

  // Base position on sphere surface (at t=0, before drift)
  const sinPhi = Math.sin(phi0);
  const basePos: Vec3 = {
    x: r * sinPhi * Math.cos(theta0),
    y: r * sinPhi * Math.sin(theta0),
    z: r * Math.cos(phi0),
  };

  // Random rotation axis for the slow drift (Rodrigues)
  const ax = normalize({
    x: hash(ah + 'ax') - 0.5,
    y: hash(ah + 'ay') - 0.5,
    z: hash(ah + 'az') - 0.5,
  });

  const dir = hash(ah + 'd') > 0.5 ? 1 : -1;
  const speed = (0.00006 + hash(ah + 's') * 0.00012) * dir;
  const phase = hash(ah + 'p') * Math.PI * 2;

  // u = base position on sphere, v = placeholder (not used in Rodrigues path)
  return {
    caseStudy: c,
    nucleusKey,
    orbitCenter: nucleusCenter,
    u: basePos,
    v: ax,   // store ax in v for compatibility; real axis is in _ax
    r,
    phase,
    speed,
    _ax: ax,
  };
}

/**
 * Rodrigues' rotation formula: rotates basePos around _ax by angle `a`.
 * This keeps the star on the sphere surface as it drifts.
 * Pass `out` to reuse an existing object and avoid per-frame allocations.
 */
export function starPositionAt(orbit: StarOrbit, t: number, out?: Vec3): Vec3 {
  const a = orbit.phase + t * orbit.speed;
  const base = orbit.u;
  const ax = orbit._ax;
  const o = out ?? { x: 0, y: 0, z: 0 };

  if (!ax) {
    // Fallback for any orbit without _ax (e.g. old data)
    o.x = orbit.orbitCenter.x + base.x * Math.cos(a) + orbit.v.x * Math.sin(a);
    o.y = orbit.orbitCenter.y + base.y * Math.cos(a) + orbit.v.y * Math.sin(a);
    o.z = orbit.orbitCenter.z + base.z * Math.cos(a) + orbit.v.z * Math.sin(a);
    return o;
  }

  // Rodrigues: base*cos(a) + (ax × base)*sin(a) + ax*(ax·base)*(1-cos(a))
  const cosA = Math.cos(a);
  const sinA = Math.sin(a);
  const dot = ax.x * base.x + ax.y * base.y + ax.z * base.z;
  const cx = ax.y * base.z - ax.z * base.y;
  const cy = ax.z * base.x - ax.x * base.z;
  const cz = ax.x * base.y - ax.y * base.x;

  o.x = orbit.orbitCenter.x + base.x * cosA + cx * sinA + ax.x * dot * (1 - cosA);
  o.y = orbit.orbitCenter.y + base.y * cosA + cy * sinA + ax.y * dot * (1 - cosA);
  o.z = orbit.orbitCenter.z + base.z * cosA + cz * sinA + ax.z * dot * (1 - cosA);
  return o;
}
