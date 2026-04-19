// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  createStarLabel,
  updateStarLabels,
  applyInClusterVisibility,
  STAR_LABEL_FALLOFF_NEAR,
  STAR_LABEL_FALLOFF_FAR,
} from './star-labels';
import type { CaseStudy } from '../data/types';

const sampleCase: CaseStudy = {
  id: 'case-1',
  client: 'BMW Connected Drive',
  year: 2023,
  services: ['Video Ads'],
  countries: ['Germany'],
  region: 'DACH',
  permission: true,
  title: 'BMW test',
  challenge: 'c',
  approach: 'a',
  metrics: [],
};

function setupDOM(): HTMLElement {
  document.body.innerHTML = '<div id="star-labels"></div>';
  return document.getElementById('star-labels')!;
}

describe('createStarLabel', () => {
  beforeEach(() => setupDOM());

  it('creates a div with class "sl"', () => {
    const container = setupDOM();
    const label = createStarLabel(sampleCase, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });
    expect(label.classList.contains('sl')).toBe(true);
  });

  it('sets textContent to the case client name', () => {
    const container = setupDOM();
    const label = createStarLabel(sampleCase, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });
    expect(label.textContent).toBe('BMW Connected Drive');
  });

  it('sets data-case-id to the case id', () => {
    const container = setupDOM();
    const label = createStarLabel(sampleCase, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });
    expect(label.dataset.caseId).toBe('case-1');
  });

  it('appends the label to the given container', () => {
    const container = setupDOM();
    const label = createStarLabel(sampleCase, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });
    expect(container.contains(label)).toBe(true);
  });
});

describe('createStarLabel — click handler', () => {
  beforeEach(() => setupDOM());

  it('fires onClick with the case when clicked and isClickEnabled returns true', () => {
    const container = setupDOM();
    const onClick = vi.fn();
    const label = createStarLabel(sampleCase, container, {
      onClick,
      isClickEnabled: () => true,
    });
    label.click();
    expect(onClick).toHaveBeenCalledWith(sampleCase);
  });

  it('does NOT fire onClick when isClickEnabled returns false (overture gate)', () => {
    const container = setupDOM();
    const onClick = vi.fn();
    const label = createStarLabel(sampleCase, container, {
      onClick,
      isClickEnabled: () => false,
    });
    label.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls isClickEnabled on each click (not just at creation)', () => {
    const container = setupDOM();
    let enabled = false;
    const onClick = vi.fn();
    const label = createStarLabel(sampleCase, container, {
      onClick,
      isClickEnabled: () => enabled,
    });
    label.click();
    expect(onClick).not.toHaveBeenCalled();
    enabled = true;
    label.click();
    expect(onClick).toHaveBeenCalledWith(sampleCase);
  });
});

describe('updateStarLabels — distance falloff + positioning', () => {
  beforeEach(() => setupDOM());

  function makeStarAt(position: THREE.Vector3, caseId: string): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.5),
      new THREE.MeshBasicMaterial(),
    );
    mesh.position.copy(position);
    mesh.userData.caseStudy = { ...sampleCase, id: caseId, client: `Case ${caseId}` };
    return mesh;
  }

  it('applies full baseline opacity (.12) to a label near the camera', () => {
    const container = setupDOM();
    const star = makeStarAt(new THREE.Vector3(0, 0, 0), 'near');
    const label = createStarLabel(star.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 0, STAR_LABEL_FALLOFF_NEAR - 10); // closer than NEAR → clamp to 1.0 opacity factor
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    updateStarLabels([{ star, label }], camera, 800, 600);
    expect(label.style.opacity).toBe('0.12');
  });

  it('fades label to 0 when star is beyond the FAR threshold', () => {
    const container = setupDOM();
    const star = makeStarAt(new THREE.Vector3(0, 0, 0), 'far');
    const label = createStarLabel(star.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    camera.position.set(0, 0, STAR_LABEL_FALLOFF_FAR + 100); // beyond FAR → opacity 0
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    updateStarLabels([{ star, label }], camera, 800, 600);
    expect(parseFloat(label.style.opacity)).toBe(0);
  });

  it('produces a value between 0 and .12 in the mid-distance band', () => {
    const container = setupDOM();
    const star = makeStarAt(new THREE.Vector3(0, 0, 0), 'mid');
    const label = createStarLabel(star.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    const midDistance = (STAR_LABEL_FALLOFF_NEAR + STAR_LABEL_FALLOFF_FAR) / 2;
    camera.position.set(0, 0, midDistance);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    updateStarLabels([{ star, label }], camera, 800, 600);
    const opacity = parseFloat(label.style.opacity);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(0.12);
  });

  it('sets transform style to position label on screen (non-empty, non-zero)', () => {
    const container = setupDOM();
    const star = makeStarAt(new THREE.Vector3(0, 0, 0), 'any');
    const label = createStarLabel(star.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    updateStarLabels([{ star, label }], camera, 800, 600);
    expect(label.style.transform).toMatch(/translate\(/);
  });

  it('applyInClusterVisibility — in focused mode, only focused cluster labels get .show', () => {
    const container = setupDOM();
    const autoStar = makeStarAt(new THREE.Vector3(0, 0, 0), 'auto-1');
    autoStar.userData.starOrbit = { nucleusKey: 'Automotive' };
    const mediaStar = makeStarAt(new THREE.Vector3(10, 0, 0), 'media-1');
    mediaStar.userData.starOrbit = { nucleusKey: 'Media' };

    const autoLabel = createStarLabel(autoStar.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });
    const mediaLabel = createStarLabel(mediaStar.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });
    // Both start with .show (pre-tick state)
    autoLabel.classList.add('show');
    mediaLabel.classList.add('show');

    applyInClusterVisibility(
      [
        { star: autoStar, label: autoLabel },
        { star: mediaStar, label: mediaLabel },
      ],
      { mode: 'focused', focusedKey: 'Automotive' },
    );

    expect(autoLabel.classList.contains('show')).toBe(true);
    expect(mediaLabel.classList.contains('show')).toBe(false);
  });

  it('applyInClusterVisibility — in global mode, all labels keep .show (no filtering)', () => {
    const container = setupDOM();
    const autoStar = makeStarAt(new THREE.Vector3(0, 0, 0), 'auto-1');
    autoStar.userData.starOrbit = { nucleusKey: 'Automotive' };
    const mediaStar = makeStarAt(new THREE.Vector3(10, 0, 0), 'media-1');
    mediaStar.userData.starOrbit = { nucleusKey: 'Media' };

    const autoLabel = createStarLabel(autoStar.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });
    const mediaLabel = createStarLabel(mediaStar.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });
    autoLabel.classList.add('show');
    mediaLabel.classList.add('show');

    applyInClusterVisibility(
      [
        { star: autoStar, label: autoLabel },
        { star: mediaStar, label: mediaLabel },
      ],
      { mode: 'global', focusedKey: null },
    );

    expect(autoLabel.classList.contains('show')).toBe(true);
    expect(mediaLabel.classList.contains('show')).toBe(true);
  });

  it('applyInClusterVisibility — reverts to all-visible when leaving focused mode', () => {
    const container = setupDOM();
    const autoStar = makeStarAt(new THREE.Vector3(0, 0, 0), 'auto-1');
    autoStar.userData.starOrbit = { nucleusKey: 'Automotive' };
    const mediaStar = makeStarAt(new THREE.Vector3(10, 0, 0), 'media-1');
    mediaStar.userData.starOrbit = { nucleusKey: 'Media' };

    const autoLabel = createStarLabel(autoStar.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });
    const mediaLabel = createStarLabel(mediaStar.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });

    // Enter focused mode: other-cluster labels lose .show
    autoLabel.classList.add('show');
    mediaLabel.classList.add('show');
    applyInClusterVisibility(
      [
        { star: autoStar, label: autoLabel },
        { star: mediaStar, label: mediaLabel },
      ],
      { mode: 'focused', focusedKey: 'Automotive' },
    );
    expect(mediaLabel.classList.contains('show')).toBe(false);

    // Leave focused mode → function does NOT add .show back (caller's
    // responsibility: main.ts tick re-adds .show every frame before calling
    // this function). Assert the non-interference contract: in global mode,
    // this function never removes .show — labels the caller marked visible
    // stay visible.
    autoLabel.classList.add('show');
    mediaLabel.classList.add('show');
    applyInClusterVisibility(
      [
        { star: autoStar, label: autoLabel },
        { star: mediaStar, label: mediaLabel },
      ],
      { mode: 'global', focusedKey: null },
    );
    expect(autoLabel.classList.contains('show')).toBe(true);
    expect(mediaLabel.classList.contains('show')).toBe(true);
  });

  it('hides label entirely (opacity 0) when star is behind camera', () => {
    const container = setupDOM();
    const star = makeStarAt(new THREE.Vector3(0, 0, 100), 'behind'); // in front of origin
    const label = createStarLabel(star.userData.caseStudy, container, {
      onClick: () => {},
      isClickEnabled: () => true,
    });

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 0, 0); // camera at origin; star is behind camera-forward direction
    camera.lookAt(0, 0, -1); // looking away from star
    camera.updateMatrixWorld();

    updateStarLabels([{ star, label }], camera, 800, 600);
    expect(parseFloat(label.style.opacity)).toBe(0);
  });
});
