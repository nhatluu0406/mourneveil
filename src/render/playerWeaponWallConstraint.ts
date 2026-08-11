import type { PlayerFacingDirection } from '../game/character/playerMotor'
import type { ConnectedLevelBoxCollider } from '../physics/connectedLevelCollision'
import { localNegativeZFacingYaw } from './enemyAttackPresentation'

export const PLAYER_WEAPON_HILT_LOCAL = Object.freeze({ x: 0.28, z: -0.28 })
export const PLAYER_WEAPON_BLADE_LENGTH = 0.95
export const PLAYER_WEAPON_BLADE_HALF_WIDTH = 0.025
export const PLAYER_WEAPON_WALL_MARGIN = 0.04

interface WeaponWallConstraintInput {
  readonly playerPosition: Readonly<{ x: number; z: number }>
  readonly facing: PlayerFacingDirection
  readonly sweepYawRadians: number
  readonly bladeCenterForwardOffset: number
  readonly solids: readonly ConnectedLevelBoxCollider[]
}

interface Point2 {
  readonly x: number
  readonly z: number
}

/**
 * Presentation-only blade-length constraint against authored solid footprints.
 * The returned scale never changes attack reach, contact geometry, or player motion.
 */
export function computePlayerWeaponWallScale({
  playerPosition,
  facing,
  sweepYawRadians,
  bladeCenterForwardOffset,
  solids,
}: WeaponWallConstraintInput): number {
  const yaw = localNegativeZFacingYaw(facing) + sweepYawRadians
  const hilt = localToWorld(PLAYER_WEAPON_HILT_LOCAL, playerPosition, yaw)
  const forwardTip = localToWorld(
    {
      x: PLAYER_WEAPON_HILT_LOCAL.x,
      z: bladeCenterForwardOffset - PLAYER_WEAPON_BLADE_LENGTH / 2,
    },
    playerPosition,
    yaw,
  )
  const fullLength = Math.hypot(forwardTip.x - hilt.x, forwardTip.z - hilt.z)
  if (!Number.isFinite(fullLength) || fullLength <= 1e-6) return 1

  let firstContact: number | null = null
  for (const solid of solids) {
    if (solid.kind === 'floor') continue
    const contact = segmentAabbEntryFraction(hilt, forwardTip, {
      minimumX: solid.position[0] - solid.size[0] / 2 - PLAYER_WEAPON_BLADE_HALF_WIDTH,
      maximumX: solid.position[0] + solid.size[0] / 2 + PLAYER_WEAPON_BLADE_HALF_WIDTH,
      minimumZ: solid.position[2] - solid.size[2] / 2 - PLAYER_WEAPON_BLADE_HALF_WIDTH,
      maximumZ: solid.position[2] + solid.size[2] / 2 + PLAYER_WEAPON_BLADE_HALF_WIDTH,
    })
    if (contact !== null) {
      firstContact = firstContact === null ? contact : Math.min(firstContact, contact)
    }
  }

  if (firstContact === null) return 1
  const allowedLength = Math.max(0, firstContact * fullLength - PLAYER_WEAPON_WALL_MARGIN)
  return Math.max(0.08, Math.min(1, allowedLength / fullLength))
}

function localToWorld(local: Point2, origin: Point2, yaw: number): Point2 {
  const cosine = Math.cos(yaw)
  const sine = Math.sin(yaw)
  return {
    x: origin.x + cosine * local.x + sine * local.z,
    z: origin.z - sine * local.x + cosine * local.z,
  }
}

function segmentAabbEntryFraction(
  start: Point2,
  end: Point2,
  box: {
    readonly minimumX: number
    readonly maximumX: number
    readonly minimumZ: number
    readonly maximumZ: number
  },
): number | null {
  let entry = 0
  let exit = 1
  const deltaX = end.x - start.x
  const deltaZ = end.z - start.z

  for (const [startAxis, deltaAxis, minimum, maximum] of [
    [start.x, deltaX, box.minimumX, box.maximumX],
    [start.z, deltaZ, box.minimumZ, box.maximumZ],
  ] as const) {
    if (Math.abs(deltaAxis) <= 1e-9) {
      if (startAxis < minimum || startAxis > maximum) return null
      continue
    }
    const first = (minimum - startAxis) / deltaAxis
    const second = (maximum - startAxis) / deltaAxis
    entry = Math.max(entry, Math.min(first, second))
    exit = Math.min(exit, Math.max(first, second))
    if (entry > exit) return null
  }

  return entry >= 0 && entry <= 1 ? entry : null
}
