import type { CombatActionId } from '../combat/combatAction'
import type { Vector3Value } from '../character/playerMotor'
import { assertPositiveFinite } from '../combat/combatHealth'

export type EnemyDefinitionId = string
export type EnemyRole = 'skirmisher' | 'brute' | 'boss'

export interface EnemyBodyDefinition {
  readonly radius: number
  readonly halfHeight: number
}

export interface EnemyHurtboxDefinition {
  readonly id: string
  readonly kind: 'sphere'
  readonly offset: Vector3Value
  readonly radius: number
}

export interface EnemyDefinition {
  readonly id: EnemyDefinitionId
  readonly role: EnemyRole
  readonly tags: readonly string[]
  readonly body: EnemyBodyDefinition
  readonly hurtbox: EnemyHurtboxDefinition
  readonly maximumHealth: number
  readonly movementSpeed: number
  readonly perceptionRange: number
  readonly stoppingRange: number
  readonly attackRange: number
  readonly attackActionIds: readonly CombatActionId[]
  /** Provisional Echo reward granted once when this enemy is defeated. */
  readonly echoReward: number
}

export function defineEnemy(definition: EnemyDefinition): EnemyDefinition {
  assertNonEmpty(definition.id, 'Enemy definition id')
  assertPositiveFinite(definition.body.radius, 'Enemy body radius')
  assertPositiveFinite(definition.body.halfHeight, 'Enemy body half height')
  assertNonEmpty(definition.hurtbox.id, 'Enemy hurtbox id')
  assertFiniteVector(definition.hurtbox.offset, 'Enemy hurtbox offset')
  assertPositiveFinite(definition.hurtbox.radius, 'Enemy hurtbox radius')
  assertPositiveFinite(definition.maximumHealth, 'Enemy maximum health')
  assertPositiveFinite(definition.movementSpeed, 'Enemy movement speed')
  assertPositiveFinite(definition.perceptionRange, 'Enemy perception range')
  assertPositiveFinite(definition.stoppingRange, 'Enemy stopping range')
  assertPositiveFinite(definition.attackRange, 'Enemy attack range')
  if (definition.stoppingRange > definition.attackRange) {
    throw new RangeError('Enemy stopping range must not exceed attack range')
  }
  if (definition.attackRange > definition.perceptionRange) {
    throw new RangeError('Enemy attack range must not exceed perception range')
  }
  if (definition.tags.length === 0 || definition.attackActionIds.length === 0) {
    throw new TypeError('Enemy requires at least one tag and attack action id')
  }
  assertNonNegativeInteger(definition.echoReward, 'Enemy echo reward')
  definition.tags.forEach((tag) => assertNonEmpty(tag, 'Enemy tag'))
  definition.attackActionIds.forEach((id) => assertNonEmpty(id, 'Attack action id'))

  return Object.freeze({
    ...definition,
    tags: Object.freeze([...definition.tags]),
    attackActionIds: Object.freeze([...definition.attackActionIds]),
    body: Object.freeze({ ...definition.body }),
    hurtbox: Object.freeze({
      ...definition.hurtbox,
      offset: Object.freeze({ ...definition.hurtbox.offset }),
    }),
  })
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`)
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) throw new TypeError(`${label} must not be empty`)
}

function assertFiniteVector(value: Vector3Value, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must contain only finite values`)
  }
}
