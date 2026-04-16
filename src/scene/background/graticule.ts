import * as THREE from 'three';

export function crtGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const cx = 512;
  const cy = 512;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;

  // 24 radial spokes
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 512, cy + Math.sin(angle) * 512);
    ctx.stroke();
  }

  // 5 concentric circles
  const radii = [80, 160, 240, 320, 400];
  for (const r of radii) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

export function createGraticule(): THREE.Mesh {
  const texture = crtGridTexture();
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });
  const geometry = new THREE.PlaneGeometry(800, 800);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -300;
  return mesh;
}
