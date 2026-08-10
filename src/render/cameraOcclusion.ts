export interface Aabb3 {
  readonly minimum: { readonly x: number; readonly y: number; readonly z: number }
  readonly maximum: { readonly x: number; readonly y: number; readonly z: number }
}

export interface Vec3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

/** Axis-aligned box from center + full size (same convention as connected-level colliders). */
export function aabbFromCenterSize(
  center: readonly [number, number, number] | Vec3,
  size: readonly [number, number, number],
): Aabb3 {
  const cx = typeof (center as Vec3).x === 'number' ? (center as Vec3).x : (center as readonly [number, number, number])[0]
  const cy = typeof (center as Vec3).y === 'number' ? (center as Vec3).y : (center as readonly [number, number, number])[1]
  const cz = typeof (center as Vec3).z === 'number' ? (center as Vec3).z : (center as readonly [number, number, number])[2]
  const hx = size[0] / 2
  const hy = size[1] / 2
  const hz = size[2] / 2
  return {
    minimum: { x: cx - hx, y: cy - hy, z: cz - hz },
    maximum: { x: cx + hx, y: cy + hy, z: cz + hz },
  }
}

/**
 * True when the open segment from `origin` to `target` intersects the AABB.
 * Uses the slab method; endpoints inside count as intersection.
 */
export function segmentIntersectsAabb(origin: Vec3, target: Vec3, box: Aabb3): boolean {
  const dx = target.x - origin.x
  const dy = target.y - origin.y
  const dz = target.z - origin.z
  let tMin = 0
  let tMax = 1

  if (!updateSlab(origin.x, dx, box.minimum.x, box.maximum.x)) return false
  if (!updateSlab(origin.y, dy, box.minimum.y, box.maximum.y)) return false
  if (!updateSlab(origin.z, dz, box.minimum.z, box.maximum.z)) return false
  return tMin <= tMax

  function updateSlab(originAxis: number, delta: number, min: number, max: number): boolean {
    if (Math.abs(delta) < 1e-8) {
      return originAxis >= min && originAxis <= max
    }
    const inv = 1 / delta
    let t1 = (min - originAxis) * inv
    let t2 = (max - originAxis) * inv
    if (t1 > t2) {
      const swap = t1
      t1 = t2
      t2 = swap
    }
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
    return tMin <= tMax
  }
}

/**
 * Follow-camera readability probe: cast at focus height from the camera's XZ
 * toward the actor so low walls still count as foreground occluders.
 */
export function readabilityOcclusionOrigin(camera: Vec3, focus: Vec3): Vec3 {
  return { x: camera.x, y: focus.y, z: camera.z }
}

/** Presentation helper: which solid boxes occlude camera→focus readability. */
export function occludingSolidIds(
  camera: Vec3,
  focus: Vec3,
  solids: ReadonlyArray<{ readonly id: string; readonly box: Aabb3 }>,
): readonly string[] {
  const origin = readabilityOcclusionOrigin(camera, focus)
  return solids.filter((solid) => segmentIntersectsAabb(origin, focus, solid.box)).map((solid) => solid.id)
}
