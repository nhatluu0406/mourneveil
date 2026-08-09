import type { PlayerFacingDirection } from '../game/character/playerMotor'
import type { EnemyAttackSpatialSnapshot } from '../game/enemies/meleeEnemy'
import type { EnemyRuntimeSnapshot } from '../game/enemies/enemyRuntime'

export interface EnemyAttackPresentationSnapshot {
  readonly facing: PlayerFacingDirection
  readonly yawRadians: number
  readonly telegraphVisible: boolean
  readonly contactVisible: boolean
}

/** Projects the same accepted execution facing used by the authoritative contact query. */
export function createEnemyAttackPresentationSnapshot(
  enemy: EnemyRuntimeSnapshot,
  attack: EnemyAttackSpatialSnapshot,
): EnemyAttackPresentationSnapshot {
  const facing = attack.executionFacing ?? enemy.facing
  return {
    facing: { ...facing },
    yawRadians: localNegativeZFacingYaw(facing),
    telegraphVisible:
      attack.executionFacing !== null && enemy.action.phase === 'startup',
    contactVisible: attack.contactEnabled,
  }
}

export function localNegativeZFacingYaw(facing: PlayerFacingDirection): number {
  return Math.atan2(-facing.x, -facing.z)
}
