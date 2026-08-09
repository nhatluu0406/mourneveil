import type Rapier from '@dimforge/rapier3d-compat'
import type { World } from '@dimforge/rapier3d-compat'
import type { Vector3Value } from '../game/character/playerMotor'

export type CombatOcclusionResult = 'clear' | 'blocked'

export interface CombatOcclusionQueryRequest {
  readonly origin: Vector3Value
  readonly target: Vector3Value
}

export type CombatOcclusionQuery = (
  request: CombatOcclusionQueryRequest,
) => CombatOcclusionResult

/**
 * Narrow solid-world occlusion probe for melee contact.
 * Hits only fixed world colliders (walls/gates/blockers/floor). Sensors and
 * kinematic/dynamic character bodies are ignored.
 */
export function createRapierCombatOcclusionQuery(
  world: World,
  rapier: typeof Rapier,
): CombatOcclusionQuery {
  return ({ origin, target }) => {
    const deltaX = target.x - origin.x
    const deltaY = target.y - origin.y
    const deltaZ = target.z - origin.z
    const distance = Math.hypot(deltaX, deltaY, deltaZ)
    if (distance <= 1e-4) {
      return 'clear'
    }

    const direction = {
      x: deltaX / distance,
      y: deltaY / distance,
      z: deltaZ / distance,
    }
    const ray = new rapier.Ray(origin, direction)
    const maxToi = Math.max(0, distance - 0.05)
    const hit = world.castRay(
      ray,
      maxToi,
      true,
      rapier.QueryFilterFlags.ONLY_FIXED | rapier.QueryFilterFlags.EXCLUDE_SENSORS,
    )
    return hit === null ? 'clear' : 'blocked'
  }
}
