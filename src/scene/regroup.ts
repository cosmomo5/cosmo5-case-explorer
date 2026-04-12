import * as THREE from 'three';
import { gsap } from 'gsap';
import type { GroupMode } from '../data/types';
import type { CaseStudy } from '../data/types';
import { groupBy, getKeyForCase } from '../data/grouping';
import { computeNucleusOrbits, nucleusPositionAt } from './orbitals/nucleus-orbit';
import { computeStarOrbit, starPositionAt } from './orbitals/star-orbit';
import type { SceneObjects } from './scene-state';
import { clearFilter } from './scene-state';

const DEFAULT_COLOR = 0xfff4dd;

/** Convert a THREE hex color int to "r,g,b" string for CSS rgba() usage */
function hexToRgb(hex: number): string {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8)  & 0xff;
  const b =  hex        & 0xff;
  return `${r},${g},${b}`;
}

export function regroupScene(
  objects: SceneObjects,
  newMode: GroupMode,
  scene: THREE.Scene,
): void {
  clearFilter(objects);
  objects.groupMode = newMode;

  const cases = objects.starMeshes.map(s => s.userData.caseStudy as CaseStudy);
  const newGroups = groupBy(cases, newMode);
  const newNucleusOrbits = computeNucleusOrbits(newGroups);

  objects.nucleusOrbits = newNucleusOrbits;

  // ── Remove nuclei that no longer exist in the new grouping ────────────────
  for (const [key, mesh] of objects.nucleusMeshes.entries()) {
    if (!newNucleusOrbits[key]) {
      if (mesh.userData.halo) scene.remove(mesh.userData.halo as THREE.Mesh);
      scene.remove(mesh);
      objects.nucleusMeshes.delete(key);

      const label = objects.nucleusLabels.get(key);
      if (label) { label.remove(); objects.nucleusLabels.delete(key); }
    }
  }

  const labelContainer = document.getElementById('star-labels') as HTMLElement;

  // ── Create nuclei that are new in this grouping ───────────────────────────
  for (const [key, nucOrbit] of Object.entries(newNucleusOrbits)) {
    if (!objects.nucleusMeshes.get(key)) {
      const color = DEFAULT_COLOR;
      const nucPos = nucleusPositionAt(nucOrbit, 0);
      const n = nucOrbit.cases.length;
      const rMin = Math.max(30, 15 + Math.sqrt(n) * 8);
      const rMax = Math.max(rMin + 20, rMin + Math.sqrt(n) * 12);

      const geo = new THREE.SphereGeometry(6, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(nucPos.x, nucPos.y, nucPos.z);
      mesh.userData = { key, isNucleus: true, nucleusOrbit: nucOrbit, starRMax: rMax };
      scene.add(mesh);
      objects.nucleusMeshes.set(key, mesh);

      const haloGeo = new THREE.SphereGeometry(rMax + 10, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, side: THREE.BackSide });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(mesh.position);
      scene.add(halo);
      mesh.userData.halo = halo;

      const colorHex = `#${color.toString(16).padStart(6, '0')}`;
      const glowRgb  = hexToRgb(color);
      const div = document.createElement('div');
      div.className = 'cl';
      div.style.setProperty('--cl-accent', colorHex);
      div.style.setProperty('--cl-glow', `rgba(${glowRgb},0.45)`);
      div.innerHTML = `<span class="cl-name">${key}</span><span class="cl-count">${nucOrbit.cases.length}</span>`;
      labelContainer.appendChild(div);
      objects.nucleusLabels.set(key, div);
    }
  }

  // ── Animate existing nucleus meshes to new positions ──────────────────────
  for (const [key, nucOrbit] of Object.entries(newNucleusOrbits)) {
    const mesh = objects.nucleusMeshes.get(key)!;
    const newPos = nucleusPositionAt(nucOrbit, 0);
    gsap.to(mesh.position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.inOut' });
    if (mesh.userData.halo) {
      gsap.to((mesh.userData.halo as THREE.Mesh).position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.inOut' });
    }
  }

  // ── Reassign stars to new nucleus groups and animate them ──────────────────
  for (const star of objects.starMeshes) {
    const c = star.userData.caseStudy as CaseStudy;
    const newKey = getKeyForCase(c, newMode);

    const nucOrbit = newNucleusOrbits[newKey];
    if (!nucOrbit) continue;
    const newCenter = nucleusPositionAt(nucOrbit, 0);
    const n = nucOrbit.cases.length;
    const rMin = Math.max(30, 15 + Math.sqrt(n) * 8);
    const rMax = Math.max(rMin + 20, rMin + Math.sqrt(n) * 12);
    const idx = nucOrbit.cases.indexOf(c);
    const newOrbit = computeStarOrbit(c, newKey, newCenter, rMin, rMax, idx, n);
    const newPos = starPositionAt(newOrbit, 0);

    star.userData.starOrbit = newOrbit;
    gsap.to(star.position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.inOut' });
  }
}
