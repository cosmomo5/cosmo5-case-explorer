import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createPlanet, disposePlanet, PLANET_RADIUS, PLANET_RING_RADIUS } from './planet';

describe('createPlanet', () => {
  it('returns a group containing sphere + ring, both added to scene', () => {
    const scene = new THREE.Scene();
    const planet = createPlanet(scene);
    expect(planet.group).toBeInstanceOf(THREE.Group);
    expect(planet.sphere).toBeInstanceOf(THREE.Mesh);
    expect(planet.ring).toBeInstanceOf(THREE.Mesh);
    expect(planet.group.children).toContain(planet.sphere);
    expect(planet.group.children).toContain(planet.ring);
    expect(scene.children).toContain(planet.group);
  });

  it('sphere geometry has PLANET_RADIUS', () => {
    const scene = new THREE.Scene();
    const planet = createPlanet(scene);
    const geom = planet.sphere.geometry as THREE.SphereGeometry;
    expect(geom.parameters.radius).toBe(PLANET_RADIUS);
  });

  it('ring geometry uses PLANET_RING_RADIUS', () => {
    const scene = new THREE.Scene();
    const planet = createPlanet(scene);
    const geom = planet.ring.geometry as THREE.TorusGeometry;
    expect(geom.parameters.radius).toBe(PLANET_RING_RADIUS);
  });

  it('sphere material is transparent and fully opaque at creation', () => {
    const scene = new THREE.Scene();
    const planet = createPlanet(scene);
    const mat = planet.sphere.material as THREE.MeshStandardMaterial;
    expect(mat.transparent).toBe(true);
    expect(mat.opacity).toBe(1);
  });

  it('group has an identifying name', () => {
    const scene = new THREE.Scene();
    const planet = createPlanet(scene);
    expect(planet.group.name).toBe('planetary-overture-planet');
  });
});

describe('disposePlanet', () => {
  it('removes the group from the scene', () => {
    const scene = new THREE.Scene();
    const planet = createPlanet(scene);
    expect(scene.children).toContain(planet.group);
    disposePlanet(planet, scene);
    expect(scene.children).not.toContain(planet.group);
  });

  it('disposes sphere + ring geometries (no throw)', () => {
    const scene = new THREE.Scene();
    const planet = createPlanet(scene);
    expect(() => disposePlanet(planet, scene)).not.toThrow();
  });
});
