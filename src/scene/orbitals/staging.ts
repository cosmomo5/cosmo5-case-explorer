interface Vec3 { x: number; y: number; z: number }

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function computeStagingPositions(count: number, radius: number, center: Vec3 = { x: 0, y: 0, z: 0 }): Vec3[] {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = i * GOLDEN_ANGLE;
    const r = radius * Math.sqrt(i / count);
    return {
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle),
      z: center.z,
    };
  });
}
