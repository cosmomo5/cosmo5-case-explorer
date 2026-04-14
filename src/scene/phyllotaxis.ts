// Preserved for Comparison Mode (Phase 12). See MILESTONE-v3.2.md Q5 resolution.
// Adapted from draft/v3-starmap:src/scene/starmap/gather.ts (commit 80def0d — "v2/phase-6: phyllotaxis gather replaces modal panel").
// Golden angle + sqrt-radius spacing preserved. Camera-independent: positions lie in the XZ plane at y=0. Caller orients the disk.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)) // ≈ 137.508°

export interface PhyllotaxisOptions {
  radius?: number
  scale?: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

export function computePhyllotaxisPositions(
  count: number,
  options: PhyllotaxisOptions = {}
): Vec3[] {
  const { radius = 2.0, scale = 1.0 } = options
  const positions: Vec3[] = []
  for (let i = 0; i < count; i++) {
    const angle = i * GOLDEN_ANGLE
    const r = Math.sqrt(i / Math.max(count - 1, 1)) * radius * scale
    positions.push({
      x: Math.cos(angle) * r,
      y: 0,
      z: Math.sin(angle) * r,
    })
  }
  return positions
}
