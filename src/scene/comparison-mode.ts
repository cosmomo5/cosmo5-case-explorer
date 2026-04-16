import gsap from 'gsap';
import * as THREE from 'three';
import { computePhyllotaxisPositions } from './phyllotaxis';
import type { SceneObjects } from './scene-state';
import type { CaseStudy } from '../data/types';

/**
 * ComparisonMode: Gather mechanics adapted for simultaneous spatial comparison.
 *
 * On enter: Save prior star state, compute phyllotaxis formation, fly gathered stars
 * to formation center with stagger, dim all non-gathered stars to 0.08 opacity, hide UI.
 *
 * On exit: Kill all tweens, restore prior star states and opacities, remove labels,
 * show UI elements again.
 */
export class ComparisonMode {
  private active = false;
  private gatheredStars: THREE.Mesh[] = [];
  private labels: HTMLElement[] = [];
  private priorState: Map<THREE.Mesh, { opacity: number; position: THREE.Vector3 }> = new Map();
  private ctx: gsap.Context;

  constructor(private sceneObjects: SceneObjects) {
    this.ctx = gsap.context(() => {});
  }

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Enter comparison mode: fly gathered stars to phyllotaxis formation.
   * @param starMeshes - Array of star meshes to gather
   * @param caseData - Map of case ID to case data for labels
   */
  enter(starMeshes: THREE.Mesh[], caseData: Map<string, CaseStudy>): void {
    if (this.active) return;
    this.active = true;
    this.gatheredStars = starMeshes;
    this.priorState.clear();
    this.labels = [];

    // Save prior state of ALL stars
    for (const star of this.sceneObjects.starMeshes) {
      const mat = star.material as THREE.MeshBasicMaterial;
      this.priorState.set(star, {
        opacity: mat.opacity,
        position: star.position.clone(),
      });
    }

    // Compute phyllotaxis positions for gathered stars
    const positions = computePhyllotaxisPositions(starMeshes.length);

    // Dim all non-gathered stars
    this.ctx.add(() => {
      for (const star of this.sceneObjects.starMeshes) {
        if (this.gatheredStars.includes(star)) continue;
        const mat = star.material as THREE.MeshBasicMaterial;
        gsap.to(mat, {
          opacity: 0.08,
          duration: 0.4,
          ease: 'power1.inOut',
        });
      }
    });

    // Fly gathered stars to formation with stagger
    this.ctx.add(() => {
      starMeshes.forEach((star, i) => {
        const target = positions[i];
        const proxy = {
          x: star.position.x,
          y: star.position.y,
          z: star.position.z,
        };
        gsap.to(proxy, {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: 0.9,
          ease: 'power2.inOut',
          delay: i * 0.05, // slight stagger
          onUpdate: () => {
            star.position.set(proxy.x, proxy.y, proxy.z);
          },
        });

        // Ensure gathered stars are at full opacity
        const mat = star.material as THREE.MeshBasicMaterial;
        gsap.to(mat, {
          opacity: 1.0,
          duration: 0.4,
          ease: 'power1.inOut',
        });
      });
    });

    // Add DM Mono labels near each gathered star (DOM overlay)
    this.ctx.add(() => {
      const labelContainer = document.getElementById('star-labels');
      if (!labelContainer) return;

      starMeshes.forEach((star) => {
        const caseId = star.userData.caseStudy?.id;
        if (!caseId) return;

        const caseStudy = caseData.get(caseId);
        if (!caseStudy) return;

        const labelEl = document.createElement('div');
        labelEl.className = 'cm-label';
        labelEl.textContent = caseStudy.client || caseId;

        // Position will be updated in tick loop via projection
        labelEl.dataset.caseId = caseId;
        labelContainer.appendChild(labelEl);
        this.labels.push(labelEl);
      });
    });

    // Hide UI elements via CSS class
    document.body.classList.add('comparison-active');
  }

  /**
   * Exit comparison mode: restore prior states.
   */
  exit(): void {
    if (!this.active) return;
    this.active = false;

    // Kill all GSAP tweens in this context
    this.ctx.revert();

    // Restore all star positions and opacities from prior state
    for (const [star, state] of this.priorState) {
      // Animate position back with slightly longer duration for smooth exit
      const proxy = {
        x: star.position.x,
        y: star.position.y,
        z: star.position.z,
      };
      gsap.to(proxy, {
        x: state.position.x,
        y: state.position.y,
        z: state.position.z,
        duration: 0.7,
        ease: 'power2.inOut',
        onUpdate: () => {
          star.position.set(proxy.x, proxy.y, proxy.z);
        },
      });

      // Restore opacity
      const mat = star.material as THREE.MeshBasicMaterial;
      gsap.to(mat, {
        opacity: state.opacity,
        duration: 0.3,
        ease: 'power1.inOut',
      });
    }

    // Remove labels
    this.labels.forEach((l) => l.remove());
    this.labels = [];

    // Restore UI elements
    document.body.classList.remove('comparison-active');
    this.priorState.clear();
  }

  /**
   * Update label positions every frame (call from main tick loop).
   * Projects gathered star positions to screen coordinates.
   */
  updateLabelPositions(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    containerWidth: number,
    containerHeight: number,
  ): void {
    if (!this.active) return;

    for (const label of this.labels) {
      const caseId = label.dataset.caseId;
      if (!caseId) continue;

      const star = this.gatheredStars.find((s) => s.userData.caseStudy?.id === caseId);
      if (!star) continue;

      // Project to screen coordinates
      const vector = new THREE.Vector3();
      vector.setFromMatrixPosition(star.matrixWorld);
      vector.project(camera);

      const x = (vector.x * 0.5 + 0.5) * containerWidth;
      const y = (-(vector.y * 0.5 - 0.5)) * containerHeight;

      label.style.transform = `translate(${x}px, ${y}px)`;
    }
  }
}
