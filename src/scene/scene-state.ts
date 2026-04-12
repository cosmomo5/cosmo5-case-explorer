import * as THREE from 'three';
import { gsap } from 'gsap';
import type { CaseStudy, GroupMode } from '../data/types';
import type { NucleusOrbitData } from './orbitals/nucleus-orbit';
import type { StarOrbit } from '../data/types';
import { groupBy } from '../data/grouping';
import { computeNucleusOrbits, nucleusPositionAt } from './orbitals/nucleus-orbit';
import { computeStarOrbit, starPositionAt } from './orbitals/star-orbit';
import { computeStagingPositions } from './orbitals/staging';
import { createFilterState, matchesFilter } from '../data/filter';
import type { FilterState } from '../data/filter';

export type SceneMode = 'global' | 'focused';

const NUCLEUS_COLORS: Record<string, number> = {
  'Media':               0x5ecfc0,
  'Performance':         0xe8b15a,
  'Commerce':            0xa9f0d1,
  'Data & Intelligence': 0xb9e4ff,
  'Strategy':            0xffdba4,
  'GEO':                 0xffc6d9,
  'Creative':            0xffe29a,
};
const DEFAULT_COLOR = 0xfff4dd;

export interface SceneObjects {
  nucleusMeshes: Map<string, THREE.Mesh>;
  nucleusLabels: Map<string, HTMLDivElement>;
  starMeshes: THREE.Mesh[];
  starOrbits: StarOrbit[];
  nucleusOrbits: Record<string, NucleusOrbitData>;
  filterState: FilterState;
  mode: SceneMode;
  focusedKey: string | null;
  groupMode: GroupMode;
}

export function buildOrbitalScene(
  cases: CaseStudy[],
  groupMode: GroupMode,
  scene: THREE.Scene,
  labelContainer: HTMLElement,
): SceneObjects {
  const groups = groupBy(cases, groupMode);
  const nucleusOrbits = computeNucleusOrbits(groups);

  const nucleusMeshes = new Map<string, THREE.Mesh>();
  const nucleusLabels = new Map<string, HTMLDivElement>();
  const starMeshes: THREE.Mesh[] = [];
  const starOrbits: StarOrbit[] = [];

  for (const [key, nucOrbit] of Object.entries(nucleusOrbits)) {
    const color = NUCLEUS_COLORS[key] ?? DEFAULT_COLOR;
    const nucPos = nucleusPositionAt(nucOrbit, 0);

    // Nucleus glow mesh
    const geo = new THREE.SphereGeometry(6, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(nucPos.x, nucPos.y, nucPos.z);
    mesh.userData = { key, isNucleus: true, nucleusOrbit: nucOrbit };
    scene.add(mesh);
    nucleusMeshes.set(key, mesh);

    // Nucleus halo
    const haloGeo = new THREE.SphereGeometry(8, 12, 12);
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, side: THREE.BackSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(mesh.position);
    scene.add(halo);
    mesh.userData.halo = halo;

    // Nucleus label
    const div = document.createElement('div');
    div.className = 'cl';
    div.innerHTML = `<span class="cl-name">${key}</span><span class="cl-count">${nucOrbit.cases.length}</span>`;
    labelContainer.appendChild(div);
    nucleusLabels.set(key, div);

    // Stars for this nucleus
    const n = nucOrbit.cases.length;
    const rMin = Math.max(30, 15 + Math.sqrt(n) * 8);
    const rMax = Math.max(rMin + 20, rMin + Math.sqrt(n) * 12);

    for (const c of nucOrbit.cases) {
      const starOrbit = computeStarOrbit(c, key, nucPos, rMin, rMax);
      const initPos = starPositionAt(starOrbit, 0);

      const sGeo = new THREE.SphereGeometry(2.5, 8, 8);
      const sMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const star = new THREE.Mesh(sGeo, sMat);
      star.position.set(initPos.x, initPos.y, initPos.z);
      star.userData = { caseStudy: c, starOrbit, isFiltered: false, isStagingTarget: false };
      scene.add(star);
      starMeshes.push(star);
      starOrbits.push(starOrbit);
    }
  }

  // Staging center glow
  const stagingGeo = new THREE.SphereGeometry(10, 16, 16);
  const stagingMat = new THREE.MeshBasicMaterial({ color: 0xe8b15a, transparent: true, opacity: 0.08 });
  const stagingMesh = new THREE.Mesh(stagingGeo, stagingMat);
  stagingMesh.position.set(0, 0, 0);
  scene.add(stagingMesh);

  return {
    nucleusMeshes,
    nucleusLabels,
    starMeshes,
    starOrbits,
    nucleusOrbits,
    filterState: createFilterState(),
    mode: 'global',
    focusedKey: null,
    groupMode,
  };
}

function matchesReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function tickOrbits(
  objects: SceneObjects,
  t: number,
  _camera: THREE.Camera,
): void {
  const { nucleusMeshes, nucleusOrbits, starMeshes, filterState } = objects;
  const prefersReduced = matchesReducedMotion();

  // Update nucleus positions (outer orbital)
  for (const [key, nucOrbit] of Object.entries(nucleusOrbits)) {
    const mesh = nucleusMeshes.get(key)!;
    const pos = prefersReduced ? nucleusPositionAt(nucOrbit, 0) : nucleusPositionAt(nucOrbit, t);
    mesh.position.set(pos.x, pos.y, pos.z);
    if (mesh.userData.halo) (mesh.userData.halo as THREE.Mesh).position.copy(mesh.position);
    // Update star orbit centers to follow nucleus
    for (const star of starMeshes) {
      if ((star.userData.starOrbit as StarOrbit).nucleusKey === key) {
        star.userData.starOrbit = { ...star.userData.starOrbit, orbitCenter: pos };
      }
    }
  }

  // Update star positions (inner orbital, unless staging)
  const anyFilter = filterState.isActive();
  for (const star of starMeshes) {
    if (star.userData.isStagingTarget) continue; // GSAP controls staging stars
    const orbit = star.userData.starOrbit as StarOrbit;
    const pos = prefersReduced ? starPositionAt(orbit, 0) : starPositionAt(orbit, t);
    star.position.lerp(new THREE.Vector3(pos.x, pos.y, pos.z), 0.055);
    // Opacity: dim unmatched stars when filter is active
    const mat = star.material as THREE.MeshBasicMaterial;
    const isMatch = !anyFilter || matchesFilter(star.userData.caseStudy as CaseStudy, filterState);
    mat.opacity = isMatch ? 0.85 : 0.15;
  }
}

export function applyFilter(
  objects: SceneObjects,
  newFilter: FilterState,
): void {
  const { starMeshes } = objects;
  objects.filterState = newFilter;

  let matchedStars: THREE.Mesh[];
  if (objects.mode === 'global') {
    matchedStars = starMeshes.filter(s => {
      const c = s.userData.caseStudy as CaseStudy;
      if (newFilter.nucleusKeys.size > 0) {
        return newFilter.nucleusKeys.has((s.userData.starOrbit as StarOrbit).nucleusKey);
      }
      return matchesFilter(c, newFilter);
    });
  } else {
    matchedStars = starMeshes.filter(s => {
      const c = s.userData.caseStudy as CaseStudy;
      if ((s.userData.starOrbit as StarOrbit).nucleusKey !== objects.focusedKey) return false;
      return matchesFilter(c, newFilter);
    });
  }

  const stagingPositions = computeStagingPositions(matchedStars.length, 80);

  for (const [i, star] of matchedStars.entries()) {
    star.userData.isStagingTarget = true;
    const pos = stagingPositions[i];
    gsap.to(star.position, {
      x: pos.x, y: pos.y, z: pos.z,
      duration: 1.0, ease: 'power2.out',
    });
  }

  // Return previously staged stars that no longer match
  for (const star of starMeshes) {
    if (!matchedStars.includes(star) && star.userData.isStagingTarget) {
      star.userData.isStagingTarget = false;
    }
  }
}

export function clearFilter(objects: SceneObjects): void {
  objects.filterState = createFilterState();
  for (const star of objects.starMeshes) {
    star.userData.isStagingTarget = false;
  }
}

// Sphere Expands to Fill
export function focusSphere(
  objects: SceneObjects,
  key: string,
  camera: THREE.Camera,
): void {
  objects.mode = 'focused';
  objects.focusedKey = key;
  const nucleus = objects.nucleusMeshes.get(key)!;

  // Animate camera toward nucleus
  gsap.to(camera.position, {
    x: nucleus.position.x * 0.5,
    y: nucleus.position.y * 0.5,
    z: nucleus.position.z * 0.5 + 300,
    duration: 1.2, ease: 'power2.inOut',
  });

  // Dim + recede other nuclei
  for (const [k, mesh] of objects.nucleusMeshes.entries()) {
    if (k === key) continue;
    gsap.to((mesh.material as THREE.MeshBasicMaterial), { opacity: 0.08, duration: 0.8 });
    gsap.to(mesh.position, {
      x: mesh.position.x * 1.3,
      y: mesh.position.y * 1.3,
      z: mesh.position.z * 1.3,
      duration: 1.0, ease: 'power2.out',
    });
    if (mesh.userData.halo) {
      gsap.to(((mesh.userData.halo as THREE.Mesh).material as THREE.MeshBasicMaterial), { opacity: 0.02, duration: 0.8 });
    }
  }

  // Boost focused nucleus
  gsap.to((nucleus.material as THREE.MeshBasicMaterial), { opacity: 1.0, duration: 0.6 });

  // Dim stars from other nuclei
  for (const star of objects.starMeshes) {
    if (star.userData.starOrbit?.nucleusKey !== key) {
      gsap.to((star.material as THREE.MeshBasicMaterial), { opacity: 0.05, duration: 0.8 });
    } else {
      gsap.to((star.material as THREE.MeshBasicMaterial), { opacity: 1.0, duration: 0.8 });
    }
  }
}

export function unfocusSphere(objects: SceneObjects, camera: THREE.Camera): void {
  objects.mode = 'global';
  objects.focusedKey = null;
  clearFilter(objects);

  gsap.to(camera.position, { x: 0, y: 0, z: 900, duration: 1.2, ease: 'power2.inOut' });

  for (const mesh of objects.nucleusMeshes.values()) {
    gsap.to((mesh.material as THREE.MeshBasicMaterial), { opacity: 0.9, duration: 0.8 });
    if (mesh.userData.halo) {
      gsap.to(((mesh.userData.halo as THREE.Mesh).material as THREE.MeshBasicMaterial), { opacity: 0.06, duration: 0.8 });
    }
  }

  for (const star of objects.starMeshes) {
    gsap.to((star.material as THREE.MeshBasicMaterial), { opacity: 0.85, duration: 0.8 });
  }
}
