import { hash } from './hash';
import type { CaseStudy } from '../../data/types';

interface Vec3 { x: number; y: number; z: number }

function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x**2 + v.y**2 + v.z**2);
  return { x: v.x/len, y: v.y/len, z: v.z/len };
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y*b.z - a.z*b.y, y: a.z*b.x - a.x*b.z, z: a.x*b.y - a.y*b.x };
}

export interface NucleusOrbitData {
  key: string;
  orbitR: number;
  orbitU: Vec3;
  orbitV: Vec3;
  phase: number;
  speed: number;
  cases: CaseStudy[];
}

// Two-band spacing: inner and outer rings prevent orbital path crossings
const INNER_RMIN = 200;
const INNER_RMAX = 260;
const OUTER_RMIN = 340;
const OUTER_RMAX = 400;

export function computeNucleusOrbits(
  groups: Record<string, CaseStudy[]>
): Record<string, NucleusOrbitData> {
  const result: Record<string, NucleusOrbitData> = {};
  const keys = Object.keys(groups);
  const count = keys.length;

  for (let i = 0; i < count; i++) {
    const key = keys[i];
    const nh = 'nuc' + key;

    // Evenly-spaced angular placement so nuclei don't cluster
    const evenPhase = (i / count) * Math.PI * 2;

    // Alternate inner/outer band by index to prevent path crossings
    const isInner = i % 2 === 0;
    const rMin = isInner ? INNER_RMIN : OUTER_RMIN;
    const rMax = isInner ? INNER_RMAX : OUTER_RMAX;
    const orbitR = rMin + hash(nh + 'r') * (rMax - rMin);

    // Gently tilted orbital plane — constrained z so nuclei stay in a
    // rough disk but constellations read as volumetric, not flat.
    // ax.z is clamped to [-0.35, 0.35] so tilt never exceeds ~20°.
    const rawAz = (hash(nh + 'az') - 0.5) * 0.7; // range [-0.35, 0.35]
    const ax = normalize({
      x: hash(nh + 'ax') - 0.5,
      y: hash(nh + 'ay') - 0.5,
      z: rawAz,
    });
    let up: Vec3 = { x: 0, y: 1, z: 0 };
    if (Math.abs(ax.x*up.x + ax.y*up.y + ax.z*up.z) > 0.92) up = { x: 1, y: 0, z: 0 };
    const orbitU = normalize(cross(ax, up));
    const orbitV = normalize(cross(ax, orbitU));

    const dir = hash(nh + 'd') > 0.5 ? 1 : -1;
    const speed = (0.00002 + hash(nh + 's') * 0.00006) * dir;

    result[key] = { key, orbitR, orbitU, orbitV, phase: evenPhase, speed, cases: groups[key] };
  }
  return result;
}

export function nucleusPositionAt(o: NucleusOrbitData, t: number): Vec3 {
  const a = o.phase + t * o.speed;
  return {
    x: o.orbitR * (o.orbitU.x * Math.cos(a) + o.orbitV.x * Math.sin(a)),
    y: o.orbitR * (o.orbitU.y * Math.cos(a) + o.orbitV.y * Math.sin(a)),
    z: o.orbitR * (o.orbitU.z * Math.cos(a) + o.orbitV.z * Math.sin(a)),
  };
}
