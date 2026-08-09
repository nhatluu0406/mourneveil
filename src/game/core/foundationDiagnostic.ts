import type { ActiveMovementInputSource } from '../../input/composeMovementIntents'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { CombatInputSnapshot } from '../../input/browserAttackInput'
import type { PlayerMotorState } from '../character/playerMotor'
import type { PlayerDefenseSnapshot } from '../combat/playerDefense'
import type { PlayerAttackSpatialSnapshot } from '../combat/playerAttackActions'
import type { CombatActionSnapshot } from '../combat/combatActionRuntime'
import type { CombatContactSnapshot } from '../combat/combatContact'
import type { TrainingTargetSnapshot } from '../combat/trainingTarget'
import type { PlayerCombatSnapshot } from '../character/playerCombatHealth'
import type { EnemyRuntimeSnapshot } from '../enemies/enemyRuntime'
import type { EnemyAttackSpatialSnapshot } from '../enemies/meleeEnemy'
import type { SimulationTimeSnapshot } from './fixedStepClock'

export const MILESTONE = 'M3.4' as const
export const WORKING_TITLE = 'Mourneveil' as const

export interface FoundationRuntimeDiagnostic {
  readonly simulation: SimulationTimeSnapshot
  readonly movementIntent: PlayerMovementIntent
  readonly activeInputSource: ActiveMovementInputSource
  readonly combatInput: CombatInputSnapshot
  readonly player: PlayerMotorState
  readonly combat: CombatActionSnapshot
  readonly attack: PlayerAttackSpatialSnapshot
  readonly contact: CombatContactSnapshot
  readonly trainingTarget: TrainingTargetSnapshot
  readonly defense: PlayerDefenseSnapshot
  readonly playerCombat: PlayerCombatSnapshot
  readonly enemy: EnemyRuntimeSnapshot
  readonly enemyAttack: EnemyAttackSpatialSnapshot
  readonly enemyDistanceToPlayer: number
  readonly enemies: readonly EnemyRuntimeSnapshot[]
  readonly enemyAttacks: readonly EnemyAttackSpatialSnapshot[]
  readonly incomingContact: CombatContactSnapshot
}

export interface FoundationDiagnostic {
  readonly workingTitle: typeof WORKING_TITLE
  readonly milestone: typeof MILESTONE
  readonly rendererReady: boolean
  readonly physicsReady: boolean
  readonly foundationReady: boolean
  readonly runtime: FoundationRuntimeDiagnostic
}

export function createFoundationDiagnostic(
  rendererReady: boolean,
  physicsReady: boolean,
  runtime: FoundationRuntimeDiagnostic,
): FoundationDiagnostic {
  return {
    workingTitle: WORKING_TITLE,
    milestone: MILESTONE,
    rendererReady,
    physicsReady,
    foundationReady: rendererReady && physicsReady,
    runtime,
  }
}
