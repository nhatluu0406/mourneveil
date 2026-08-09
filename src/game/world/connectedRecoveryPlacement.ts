import type { Vector3Value } from '../character/playerMotor'
import { MOURNEVEIL_CONNECTED_LEVEL, type ConnectedLevelDefinition } from './connectedLevel'

const RECOVERY_FLOOR_Y = 0.82
const BOUNDS_INSET = 0.45

/**
 * Collision-resolved player positions remain unchanged. Debug/legacy positions outside
 * the connected level clamp to the nearest authored zone interior.
 */
export function resolveConnectedRecoveryPosition(
  position: Vector3Value,
  definition: ConnectedLevelDefinition = MOURNEVEIL_CONNECTED_LEVEL,
): Vector3Value {
  const containingZone = definition.zones.find((zone) =>
    position.x >= zone.bounds.minimumX + BOUNDS_INSET &&
    position.x <= zone.bounds.maximumX - BOUNDS_INSET &&
    position.z >= zone.bounds.minimumZ + BOUNDS_INSET &&
    position.z <= zone.bounds.maximumZ - BOUNDS_INSET,
  )
  if (containingZone !== undefined) {
    return { x: position.x, y: RECOVERY_FLOOR_Y, z: position.z }
  }
  const closest = definition.zones
    .map((zone) => ({
      x: clamp(position.x, zone.bounds.minimumX + BOUNDS_INSET, zone.bounds.maximumX - BOUNDS_INSET),
      z: clamp(position.z, zone.bounds.minimumZ + BOUNDS_INSET, zone.bounds.maximumZ - BOUNDS_INSET),
    }))
    .sort((left, right) =>
      squaredDistance(position, left) - squaredDistance(position, right),
    )[0]
  return { x: closest.x, y: RECOVERY_FLOOR_Y, z: closest.z }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function squaredDistance(position: Vector3Value, target: { readonly x: number; readonly z: number }): number {
  return (position.x - target.x) ** 2 + (position.z - target.z) ** 2
}
