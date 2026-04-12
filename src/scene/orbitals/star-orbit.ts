import { hash } from './hash';
import type { CaseStudy, StarOrbit } from '../../data/types';

interface Vec3 { x: number; y: number; z: number }

function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function computeStarOrbit(
  c: CaseStudy,
  nucleusKey: string,
  nucleusCenter: Vec3,
  rMin: number,
  rMax: number,
): StarOrbit {
  const ah = 'orb' + c.id;
  const ax = normalize({
    x: hash(ah + 'ax') - 0.5,
    y: hash(ah + 'ay') - 0.5,
    z: hash(ah + 'az') - 0.5,
  });
  let up: Vec3 = { x: 0, y: 1, z: 0 };
  if (Math.abs(ax.x * up.x + ax.y * up.y + ax.z * up.z) > 0.92) up = { x: 1, y: 0, z: 0 };
  const u = normalize(cross(ax, up));
  const v = normalize(cross(ax, u));
  const r = rMin === rMax ? 0 : rMin + hash(ah + 'r') * (rMax - rMin);
  const phase = hash(ah + 'p') * Math.PI * 2;
  const dir = hash(ah + 'd') > 0.5 ? 1 : -1;
  const speed = (0.00008 + hash(ah + 's') * 0.00020) * dir;
  return { caseStudy: c, nucleusKey, orbitCenter: nucleusCenter, u, v, r, phase, speed };
}

export function starPositionAt(orbit: StarOrbit, t: number): Vec3 {
  const a = orbit.phase + t * orbit.speed;
  return {
    x: orbit.orbitCenter.x + orbit.r * (orbit.u.x * Math.cos(a) + orbit.v.x * Math.sin(a)),
    y: orbit.orbitCenter.y + orbit.r * (orbit.u.y * Math.cos(a) + orbit.v.y * Math.sin(a)),
    z: orbit.orbitCenter.z + orbit.r * (orbit.u.z * Math.cos(a) + orbit.v.z * Math.sin(a)),
  };
}
