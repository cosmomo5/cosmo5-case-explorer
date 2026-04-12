import * as THREE from 'three';
import { gsap } from 'gsap';
import type { GroupMode } from '../data/types';
import type { CaseStudy } from '../data/types';
import { groupBy, getKeyForCase } from '../data/grouping';
import { computeNucleusOrbits, nucleusPositionAt } from './orbitals/nucleus-orbit';
import { computeStarOrbit, starPositionAt } from './orbitals/star-orbit';
import type { SceneObjects } from './scene-state';
import { clearFilter } from './scene-state';

export function regroupScene(
  objects: SceneObjects,
  newMode: GroupMode,
  _scene: THREE.Scene,
): void {
  clearFilter(objects);
  objects.groupMode = newMode;

  const cases = objects.starMeshes.map(s => s.userData.caseStudy as CaseStudy);
  const newGroups = groupBy(cases, newMode);
  const newNucleusOrbits = computeNucleusOrbits(newGroups);

  objects.nucleusOrbits = newNucleusOrbits;

  // Animate existing nucleus meshes to new positions where keys match
  for (const [key, nucOrbit] of Object.entries(newNucleusOrbits)) {
    const mesh = objects.nucleusMeshes.get(key);
    if (mesh) {
      const newPos = nucleusPositionAt(nucOrbit, 0);
      gsap.to(mesh.position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.inOut' });
      if (mesh.userData.halo) {
        gsap.to((mesh.userData.halo as THREE.Mesh).position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.inOut' });
      }
    }
  }

  // Reassign stars to new nucleus groups and animate them
  for (const star of objects.starMeshes) {
    const c = star.userData.caseStudy as CaseStudy;
    const newKey = getKeyForCase(c, newMode);

    const nucOrbit = newNucleusOrbits[newKey];
    if (!nucOrbit) continue;
    const newCenter = nucleusPositionAt(nucOrbit, 0);
    const n = nucOrbit.cases.length;
    const rMin = Math.max(30, 15 + Math.sqrt(n) * 8);
    const rMax = Math.max(rMin + 20, rMin + Math.sqrt(n) * 12);
    const newOrbit = computeStarOrbit(c, newKey, newCenter, rMin, rMax);
    const newPos = starPositionAt(newOrbit, 0);

    star.userData.starOrbit = newOrbit;
    gsap.to(star.position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.inOut' });
  }
}
