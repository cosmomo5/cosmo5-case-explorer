import * as THREE from 'three';

export const PLANET_RADIUS = 30;
export const PLANET_RING_RADIUS = 44;
const TEAL = 0x5ecfc0;

export interface PlanetGroup {
  group: THREE.Group;
  sphere: THREE.Mesh;
  ring: THREE.Mesh;
}

export function createPlanet(scene: THREE.Scene): PlanetGroup {
  const group = new THREE.Group();
  group.name = 'planetary-overture-planet';

  const sphereGeo = new THREE.SphereGeometry(PLANET_RADIUS, 48, 48);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x0b0c10,
    emissive: TEAL,
    emissiveIntensity: 0.12,
    roughness: 0.65,
    metalness: 0.2,
    transparent: true,
    // Phase 16-03: start invisible — calibration overture's Act II fades the
    // sphere + ring in as the scan-line crosses viewport center (~2.7s).
    opacity: 0,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  group.add(sphere);

  const ringGeo = new THREE.TorusGeometry(PLANET_RING_RADIUS, 0.15, 8, 128);
  const ringMat = new THREE.MeshBasicMaterial({
    color: TEAL,
    transparent: true,
    // Phase 16-03: ring also fades in from 0 during Act II (target 0.12).
    opacity: 0,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2 - (18 * Math.PI / 180);
  group.add(ring);

  scene.add(group);
  return { group, sphere, ring };
}

export function disposePlanet(planet: PlanetGroup, scene: THREE.Scene): void {
  scene.remove(planet.group);
  planet.sphere.geometry.dispose();
  (planet.sphere.material as THREE.Material).dispose();
  planet.ring.geometry.dispose();
  (planet.ring.material as THREE.Material).dispose();
}
