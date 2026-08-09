import type { Vector3Value } from '../character/playerMotor'
import {
  applyCombatDamage,
  assertPositiveFinite,
  createCombatHealth,
  type CombatDamageResult,
  type CombatHealthState,
} from './combatHealth'
import type { CombatTargetId, SphereHurtbox } from './combatTarget'

export type { CombatHurtboxId, CombatTargetId, SphereHurtbox } from './combatTarget'

export interface TrainingTargetDefinition {
  readonly id: CombatTargetId
  readonly position: Vector3Value
  readonly hurtbox: SphereHurtbox
  readonly maximumHealth: number
}

export type TrainingTargetHealthState = CombatHealthState
export type TrainingTargetDamageResult = CombatDamageResult

export interface TrainingTargetSnapshot extends TrainingTargetDefinition {
  readonly health: TrainingTargetHealthState
  readonly hitCount: number
  readonly hitRevision: number
}

export const TRAINING_TARGET_ID = 'training-target.graybox' as const

export const TRAINING_TARGET_DEFINITION: TrainingTargetDefinition =
  defineTrainingTarget({
    id: TRAINING_TARGET_ID,
    position: { x: -3, y: 0.65, z: 1.65 },
    hurtbox: {
      id: 'training-target.graybox.hurtbox',
      ownerId: TRAINING_TARGET_ID,
      kind: 'sphere',
      center: { x: -3, y: 0.65, z: 1.65 },
      radius: 0.45,
    },
    maximumHealth: 100,
  })

export function applyTrainingTargetDamage(
  health: TrainingTargetHealthState,
  damage: number,
): TrainingTargetDamageResult {
  return applyCombatDamage(health, damage)
}

export class TrainingTargetRuntime {
  private health: TrainingTargetHealthState
  private hitCount = 0
  private hitRevision = 0

  constructor(
    private readonly definition: TrainingTargetDefinition =
      TRAINING_TARGET_DEFINITION,
  ) {
    this.health = createCombatHealth(definition.maximumHealth)
  }

  applyDamage(damage: number): TrainingTargetDamageResult {
    const result = applyTrainingTargetDamage(this.health, damage)
    if (result.applied) {
      this.health = result.health
      this.hitCount += 1
      this.hitRevision += 1
    }
    return result
  }

  reset(): void {
    this.health = createCombatHealth(this.definition.maximumHealth)
    this.hitCount = 0
    this.hitRevision += 1
  }

  snapshot(): TrainingTargetSnapshot {
    return {
      ...this.definition,
      health: this.health,
      hitCount: this.hitCount,
      hitRevision: this.hitRevision,
    }
  }
}

export function defineTrainingTarget(
  definition: TrainingTargetDefinition,
): TrainingTargetDefinition {
  if (definition.id.trim().length === 0) {
    throw new TypeError('Training target id must not be empty')
  }
  if (
    definition.hurtbox.id.trim().length === 0 ||
    definition.hurtbox.ownerId !== definition.id
  ) {
    throw new TypeError('Training target hurtbox must identify its owner')
  }
  assertFiniteVector(definition.position, 'Training target position')
  assertFiniteVector(definition.hurtbox.center, 'Training target hurtbox center')
  assertPositiveFinite(definition.hurtbox.radius, 'Hurtbox radius')
  assertPositiveFinite(definition.maximumHealth, 'Maximum health')

  return Object.freeze({
    ...definition,
    position: Object.freeze({ ...definition.position }),
    hurtbox: Object.freeze({
      ...definition.hurtbox,
      center: Object.freeze({ ...definition.hurtbox.center }),
    }),
  })
}

function assertFiniteVector(value: Vector3Value, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must contain only finite values`)
  }
}
