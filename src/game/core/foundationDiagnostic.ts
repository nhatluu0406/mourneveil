import type { ActiveMovementInputSource } from '../../input/composeMovementIntents'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { CombatInputSnapshot } from '../../input/browserAttackInput'
import type { PlayerMotorState } from '../character/playerMotor'
import type { PlayerDefenseSnapshot } from '../combat/playerDefense'
import type { PlayerAttackSpatialSnapshot } from '../combat/playerAttackActions'
import type { CombatActionSnapshot } from '../combat/combatActionRuntime'
import type { CombatContactSnapshot } from '../combat/combatContact'
import type { TrainingTargetSnapshot } from '../combat/trainingTarget'
import type { PlayerHealthSnapshot } from '../character/playerHealth'
import type { PlayerFlaskSnapshot } from '../character/playerFlask'
import type { EchoesSnapshot } from '../character/playerCurrency'
import type { EnemyRuntimeSnapshot } from '../enemies/enemyRuntime'
import type { EnemyAttackSpatialSnapshot } from '../enemies/meleeEnemy'
import type { GrayboxEncounterSnapshot } from '../encounters/grayboxEncounter'
import type { CheckpointSnapshot } from '../world/checkpoint'
import type { EchoRecoverySnapshot } from '../world/echoRecovery'
import type { InventorySnapshot } from '../items/playerInventory'
import type { EquipmentSnapshot } from '../items/playerEquipment'
import type { LootPickupSnapshot } from '../items/lootPickup'
import type { SimulationTimeSnapshot } from './fixedStepClock'

export const MILESTONE = 'M4.5' as const
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
  readonly playerHealth: PlayerHealthSnapshot
  readonly enemy: EnemyRuntimeSnapshot
  readonly enemyAttack: EnemyAttackSpatialSnapshot
  readonly enemyDistanceToPlayer: number
  readonly enemies: readonly EnemyRuntimeSnapshot[]
  readonly enemyAttacks: readonly EnemyAttackSpatialSnapshot[]
  readonly encounter: GrayboxEncounterSnapshot
  readonly incomingContact: CombatContactSnapshot
  readonly checkpoint: CheckpointSnapshot
  readonly flask: PlayerFlaskSnapshot
  readonly echoes: EchoesSnapshot
  readonly echoRecovery: EchoRecoverySnapshot
  readonly inventory: InventorySnapshot
  readonly equipment: EquipmentSnapshot
  readonly lootPickup: LootPickupSnapshot
  readonly resolvedAttackDamage: {
    readonly light: number
    readonly heavy: number
  }
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
