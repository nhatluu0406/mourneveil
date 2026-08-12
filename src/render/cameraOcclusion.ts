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
 * Follow-camera readability probe origins:
 * - real camera→focus (tall foreground masses under high-oblique view)
 * - camera XZ at focus height (low walls still count)
 */
export function readabilityOcclusionOrigins(camera: Vec3, focus: Vec3): readonly Vec3[] {
  return [
    { x: camera.x, y: camera.y, z: camera.z },
    { x: camera.x, y: focus.y, z: camera.z },
  ]
}

/** @deprecated Prefer readabilityOcclusionOrigins — kept for call-site clarity. */
export function readabilityOcclusionOrigin(camera: Vec3, focus: Vec3): Vec3 {
  return readabilityOcclusionOrigins(camera, focus)[1]!
}

/**
 * High-oblique follow cameras often miss thin 3D rays against neighboring wall bays
 * that still cover the actor in screen space. Treat the camera→focus XZ segment as a
 * corridor and fade tall solids whose footprints enter that corridor.
 */
export const READABILITY_CORRIDOR_RADIUS_METERS = 1.45

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/** Closest approach (meters) from XZ point to the camera→focus XZ segment, plus along-segment t. */
export function distanceToSegmentXZ(
  pointX: number,
  pointZ: number,
  camera: Vec3,
  focus: Vec3,
): { readonly distance: number; readonly t: number } {
  const abx = focus.x - camera.x
  const abz = focus.z - camera.z
  const lengthSq = abx * abx + abz * abz
  if (lengthSq < 1e-8) {
    const dx = pointX - camera.x
    const dz = pointZ - camera.z
    return { distance: Math.hypot(dx, dz), t: 0 }
  }
  const t = clamp01(((pointX - camera.x) * abx + (pointZ - camera.z) * abz) / lengthSq)
  const closestX = camera.x + abx * t
  const closestZ = camera.z + abz * t
  return {
    distance: Math.hypot(pointX - closestX, pointZ - closestZ),
    t,
  }
}

function thinWallPlaneOccludes(camera: Vec3, focus: Vec3, box: Aabb3): boolean {
  if (box.maximum.y < focus.y - 0.15) return false
  const widthX = box.maximum.x - box.minimum.x
  const widthZ = box.maximum.z - box.minimum.z
  const centerX = (box.minimum.x + box.maximum.x) * 0.5
  const centerY = (box.minimum.y + box.maximum.y) * 0.5
  const centerZ = (box.minimum.z + box.maximum.z) * 0.5
  const cameraToFocus = Math.hypot(focus.x - camera.x, focus.y - camera.y, focus.z - camera.z)
  const cameraToSolid = Math.hypot(centerX - camera.x, centerY - camera.y, centerZ - camera.z)
  // Do not hollow the room behind the actor — only foreground / crossing architecture.
  if (cameraToSolid > cameraToFocus + 1.35) return false

  if (widthX <= widthZ) {
    // N-S wall (thin in X): fade when the camera→focus segment crosses the wall plane
    // and the wall's Z span overlaps the look corridor (with pad for neighboring bays).
    const wallX = centerX
    if ((camera.x - wallX) * (focus.x - wallX) >= 0) return false
    const t = (wallX - camera.x) / (focus.x - camera.x)
    if (t <= 0.04 || t >= 0.99) return false
    const z0 = Math.min(camera.z, focus.z) - 2.85
    const z1 = Math.max(camera.z, focus.z) + 0.45
    return box.maximum.z >= z0 && box.minimum.z <= z1
  }

  // E-W wall (thin in Z)
  const wallZ = centerZ
  if ((camera.z - wallZ) * (focus.z - wallZ) >= 0) return false
  const t = (wallZ - camera.z) / (focus.z - camera.z)
  if (t <= 0.04 || t >= 0.99) return false
  const x0 = Math.min(camera.x, focus.x) - 2.85
  const x1 = Math.max(camera.x, focus.x) + 0.45
  return box.maximum.x >= x0 && box.minimum.x <= x1
}

function corridorOccludesSolid(
  camera: Vec3,
  focus: Vec3,
  box: Aabb3,
  corridorRadius: number,
): boolean {
  // Ignore floors / low props — only tall architecture can hide the actor.
  if (box.maximum.y < focus.y - 0.15) return false
  if (thinWallPlaneOccludes(camera, focus, box)) return true

  // Sample box center + XZ corners so long wall bays beside the focus still count.
  const samples: Array<readonly [number, number]> = [
    [(box.minimum.x + box.maximum.x) * 0.5, (box.minimum.z + box.maximum.z) * 0.5],
    [box.minimum.x, box.minimum.z],
    [box.minimum.x, box.maximum.z],
    [box.maximum.x, box.minimum.z],
    [box.maximum.x, box.maximum.z],
  ]

  let bestDistance = Number.POSITIVE_INFINITY
  let bestT = 0
  for (const [x, z] of samples) {
    const abx = focus.x - camera.x
    const abz = focus.z - camera.z
    const lengthSq = abx * abx + abz * abz
    if (lengthSq < 1e-8) continue
    const tUnclamped = ((x - camera.x) * abx + (z - camera.z) * abz) / lengthSq
    const t = clamp01(tUnclamped)
    const closestX = camera.x + abx * t
    const closestZ = camera.z + abz * t
    const distance = Math.hypot(x - closestX, z - closestZ)
    if (distance < bestDistance) {
      bestDistance = distance
      bestT = tUnclamped
    }
  }

  // Allow slightly past the focus: high-oblique views still cover the actor with
  // neighboring divider bays whose centers project just beyond the look target.
  if (bestT < 0.05 || bestT > 1.18) return false
  const radiusScale = bestT > 1 ? 0.9 : 1
  return bestDistance <= corridorRadius * radiusScale
}

/** Presentation helper: which solid boxes occlude camera→focus readability. */
export function occludingSolidIds(
  camera: Vec3,
  focus: Vec3,
  solids: ReadonlyArray<{ readonly id: string; readonly box: Aabb3 }>,
  corridorRadius: number = READABILITY_CORRIDOR_RADIUS_METERS,
): readonly string[] {
  const origins = readabilityOcclusionOrigins(camera, focus)
  const hit = new Set<string>()
  for (const solid of solids) {
    let matched = false
    for (const origin of origins) {
      if (segmentIntersectsAabb(origin, focus, solid.box)) {
        hit.add(solid.id)
        matched = true
        break
      }
    }
    if (!matched && corridorOccludesSolid(camera, focus, solid.box, corridorRadius)) {
      hit.add(solid.id)
    }
  }
  return [...hit]
}
