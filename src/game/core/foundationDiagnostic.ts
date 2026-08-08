import type { ActiveMovementInputSource } from '../../input/composeMovementIntents'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { PlayerMotorState } from '../character/playerMotor'
import type { CombatActionSnapshot } from '../combat/combatActionRuntime'
import type { SimulationTimeSnapshot } from './fixedStepClock'

export const MILESTONE = 'M2.1' as const
export const WORKING_TITLE = 'Mourneveil' as const

export interface FoundationRuntimeDiagnostic {
  readonly simulation: SimulationTimeSnapshot
  readonly movementIntent: PlayerMovementIntent
  readonly activeInputSource: ActiveMovementInputSource
  readonly player: PlayerMotorState
  readonly combat: CombatActionSnapshot
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
