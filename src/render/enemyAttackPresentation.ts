import type { PlayerFacingDirection } from '../game/character/playerMotor'
import type { EnemyAttackSpatialSnapshot } from '../game/enemies/meleeEnemy'
import type { EnemyRuntimeSnapshot } from '../game/enemies/enemyRuntime'
import type { CombatActionPhase } from '../game/combat/combatAction'
import { normalizedActionPhaseProgress } from './animation/animationPresentation'

export type EnemyAttackPresentationPhase = CombatActionPhase | 'idle'

export interface EnemyAttackPresentationSnapshot {
  readonly facing: PlayerFacingDirection
  readonly yawRadians: number
  readonly phase: EnemyAttackPresentationPhase
  readonly phaseProgress: number
  readonly telegraphVisible: boolean
  readonly recoveryVisible: boolean
  readonly contactVisible: boolean
  /** 0..1 accent strength for material/emissive feedback derived from phase. */
  readonly phaseAccent: number
}

/** Projects the same accepted execution facing used by the authoritative contact query. */
export function createEnemyAttackPresentationSnapshot(
  enemy: EnemyRuntimeSnapshot,
  attack: EnemyAttackSpatialSnapshot,
): EnemyAttackPresentationSnapshot {
  const facing = attack.executionFacing ?? enemy.facing
  const phase = enemy.action.phase
  const phaseProgress = normalizedActionPhaseProgress(enemy.action)
  const committed = attack.executionFacing !== null && phase !== 'idle'
  return {
    facing: { ...facing },
    yawRadians: localNegativeZFacingYaw(facing),
    phase,
    phaseProgress,
    telegraphVisible: committed && phase === 'startup',
    recoveryVisible: committed && phase === 'recovery',
    contactVisible: attack.contactEnabled,
    phaseAccent: committed ? phaseAccentFor(phase, phaseProgress) : 0,
  }
}

export function localNegativeZFacingYaw(facing: PlayerFacingDirection): number {
  return Math.atan2(-facing.x, -facing.z)
}

function phaseAccentFor(phase: CombatActionPhase | 'idle', progress: number): number {
  switch (phase) {
    case 'startup':
      // Ramp hard toward the strike so wind-up is obvious late in startup.
      return 0.35 + 0.65 * progress
    case 'active':
      return 1
    case 'recovery':
      // Fade from open-recover to idle; stays readable for most of the window.
      return 0.55 * (1 - progress * 0.75)
    case 'idle':
      return 0
  }
}
