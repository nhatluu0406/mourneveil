import type { PlayerFacingDirection, Vector3Value } from '../game/character/playerMotor'

export type PlayerAimDirection = PlayerFacingDirection

const MINIMUM_AIM_DISTANCE = 0.001

export function worldAimPointToDirection(
  playerPosition: Vector3Value,
  worldAimPoint: Vector3Value,
): PlayerAimDirection | null {
  const x = worldAimPoint.x - playerPosition.x
  const z = worldAimPoint.z - playerPosition.z
  const magnitude = Math.hypot(x, z)
  if (!Number.isFinite(magnitude) || magnitude < MINIMUM_AIM_DISTANCE) {
    return null
  }

  return Object.freeze({ x: normalizeZero(x / magnitude), z: normalizeZero(z / magnitude) })
}

function normalizeZero(value: number): number {
  return value === 0 ? 0 : value
}
