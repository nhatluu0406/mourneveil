import type { ActiveMovementInputSource } from '../../input/composeMovementIntents'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { CombatInputSnapshot } from '../../input/browserAttackInput'
import type { PlayerMotorState } from '../character/playerMotor'
import type { PlayerDefenseSnapshot } from '../combat/playerDefense'
import type { PlayerAttackSpatialSnapshot } from '../combat/playerAttackActions'
import type { CombatActionSnapshot } from '../combat/combatActionRuntime'
import type { CombatContactSnapshot } from '../combat/combatContact'
import type { TrainingTargetSnapshot } from '../combat/trainingTarget'
import type { SimulationTimeSnapshot } from './fixedStepClock'

export const MILESTONE = 'M2.6' as const
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
