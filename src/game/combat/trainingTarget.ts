import type { Vector3Value } from '../character/playerMotor'

export type CombatTargetId = string
export type CombatHurtboxId = string

export interface SphereHurtbox {
  readonly id: CombatHurtboxId
  readonly ownerId: CombatTargetId
  readonly kind: 'sphere'
  readonly center: Vector3Value
  readonly radius: number
}

export interface TrainingTargetDefinition {
  readonly id: CombatTargetId
  readonly position: Vector3Value
  readonly hurtbox: SphereHurtbox
  readonly maximumHealth: number
}

export interface TrainingTargetHealthState {
  readonly maximum: number
  readonly current: number
  readonly alive: boolean
}

export interface TrainingTargetDamageResult {
  readonly applied: boolean
  readonly appliedDamage: number
  readonly health: TrainingTargetHealthState
}

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
  assertPositiveFinite(damage, 'Damage')
  if (!health.alive) {
    return { applied: false, appliedDamage: 0, health }
  }

  const current = Math.max(0, health.current - damage)
  const nextHealth = Object.freeze({
    maximum: health.maximum,
    current,
    alive: current > 0,
  })
  return {
    applied: true,
    appliedDamage: health.current - current,
    health: nextHealth,
  }
}

export class TrainingTargetRuntime {
  private health: TrainingTargetHealthState
  private hitCount = 0
  private hitRevision = 0

  constructor(
    private readonly definition: TrainingTargetDefinition =
      TRAINING_TARGET_DEFINITION,
  ) {
    this.health = createFullHealth(definition.maximumHealth)
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
    this.health = createFullHealth(this.definition.maximumHealth)
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

function createFullHealth(maximum: number): TrainingTargetHealthState {
  return Object.freeze({ maximum, current: maximum, alive: true })
}

function assertFiniteVector(value: Vector3Value, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must contain only finite values`)
  }
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite positive number`)
  }
}
