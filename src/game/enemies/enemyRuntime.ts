import type { CombatActionDefinition, CombatActionId } from '../combat/combatAction'
import {
  CombatActionRuntime,
  type CombatActionSnapshot,
  type CombatActionStartResult,
} from '../combat/combatActionRuntime'
import {
  applyCombatDamage,
  createCombatHealth,
  type CombatDamageResult,
  type CombatHealthState,
} from '../combat/combatHealth'
import type { SphereHurtbox } from '../combat/combatTarget'
import type { PlayerFacingDirection, Vector3Value } from '../character/playerMotor'
import type { EnemyDefinition, EnemyDefinitionId } from './enemyDefinition'

export type EnemyRuntimeId = string
export type EnemyState = 'idle' | 'pursue' | 'attack' | 'recovery' | 'defeated'

export interface EnemyRuntimeSnapshot {
  readonly id: EnemyRuntimeId
  readonly definitionId: EnemyDefinitionId
  readonly position: Vector3Value
  readonly facing: PlayerFacingDirection
  readonly velocity: Vector3Value
  readonly state: EnemyState
  readonly health: CombatHealthState
  readonly alive: boolean
  readonly targetId: string | null
  readonly action: CombatActionSnapshot
  readonly hurtbox: SphereHurtbox
}

const ALLOWED_TRANSITIONS: Readonly<Record<EnemyState, readonly EnemyState[]>> = {
  idle: ['pursue', 'defeated'],
  pursue: ['idle', 'attack', 'defeated'],
  attack: ['recovery', 'defeated'],
  recovery: ['pursue', 'defeated'],
  defeated: [],
}

export class EnemyRuntime {
  private readonly actions: CombatActionRuntime
  private position: Vector3Value
  private facing: PlayerFacingDirection
  private velocity: Vector3Value = { x: 0, y: 0, z: 0 }
  private state: EnemyState = 'idle'
  private health: CombatHealthState
  private targetId: string | null = null

  constructor(
    readonly definition: EnemyDefinition,
    readonly id: EnemyRuntimeId,
    spawnPosition: Vector3Value,
    actionDefinitions: readonly CombatActionDefinition[],
    facing: PlayerFacingDirection = { x: 0, z: 1 },
  ) {
    if (id.trim().length === 0) throw new TypeError('Enemy runtime id must not be empty')
    assertFiniteVector(spawnPosition, 'Enemy spawn position')
    assertUnitFacing(facing)
    const actionIds = new Set(actionDefinitions.map((action) => action.id))
    for (const actionId of definition.attackActionIds) {
      if (!actionIds.has(actionId)) {
        throw new Error(`Missing enemy attack definition: ${actionId}`)
      }
    }
    this.position = { ...spawnPosition }
    this.facing = { ...facing }
    this.health = createCombatHealth(definition.maximumHealth)
    this.actions = new CombatActionRuntime(actionDefinitions)
  }

  transition(next: EnemyState, targetId: string | null = this.targetId): void {
    if (!ALLOWED_TRANSITIONS[this.state].includes(next)) {
      throw new Error(`Forbidden enemy transition: ${this.state} -> ${next}`)
    }
    if (next !== 'idle' && next !== 'defeated' && targetId === null) {
      throw new Error(`Enemy state ${next} requires a target`)
    }
    this.state = next
    this.targetId = next === 'idle' || next === 'defeated' ? null : targetId
    if (next === 'defeated') {
      this.velocity = { x: 0, y: 0, z: 0 }
      this.actions.reset()
    }
  }

  startAction(actionId: CombatActionId, facing: PlayerFacingDirection): CombatActionStartResult {
    if (!this.health.alive) {
      return { accepted: false, actionId, reason: 'actor-defeated' }
    }
    if (this.state !== 'pursue') {
      return { accepted: false, actionId, reason: 'action-in-progress' }
    }
    assertUnitFacing(facing)
    const result = this.actions.request({ type: 'start-action', actionId })
    if (result.accepted) {
      this.facing = { ...facing }
      this.velocity = { x: 0, y: 0, z: 0 }
      this.transition('attack')
    }
    return result
  }

  advanceAction(): void {
    if (!this.health.alive) return
    this.actions.advanceFixedStep()
    const phase = this.actions.snapshot().phase
    if (this.state === 'attack' && phase === 'recovery') this.transition('recovery')
    if (this.state === 'recovery' && phase === 'idle') this.transition('pursue')
  }

  setMotion(
    position: Vector3Value,
    velocity: Vector3Value,
    facing: PlayerFacingDirection,
  ): void {
    if (this.state !== 'pursue' || !this.health.alive) return
    assertFiniteVector(position, 'Enemy position')
    assertFiniteVector(velocity, 'Enemy velocity')
    assertUnitFacing(facing)
    this.position = { ...position }
    this.velocity = { ...velocity }
    this.facing = { ...facing }
  }

  applyDamage(damage: number): CombatDamageResult {
    const result = applyCombatDamage(this.health, damage)
    if (!result.applied) return result
    this.health = result.health
    if (!this.health.alive) this.transition('defeated')
    return result
  }

  reset(position: Vector3Value = this.position): void {
    assertFiniteVector(position, 'Enemy reset position')
    this.position = { ...position }
    this.velocity = { x: 0, y: 0, z: 0 }
    this.state = 'idle'
    this.targetId = null
    this.health = createCombatHealth(this.definition.maximumHealth)
    this.actions.reset()
  }

  snapshot(): EnemyRuntimeSnapshot {
    const offset = this.definition.hurtbox.offset
    return {
      id: this.id,
      definitionId: this.definition.id,
      position: { ...this.position },
      facing: { ...this.facing },
      velocity: { ...this.velocity },
      state: this.state,
      health: this.health,
      alive: this.health.alive,
      targetId: this.targetId,
      action: this.actions.snapshot(),
      hurtbox: {
        id: `${this.id}.${this.definition.hurtbox.id}`,
        ownerId: this.id,
        kind: 'sphere',
        center: {
          x: this.position.x + offset.x,
          y: this.position.y + offset.y,
          z: this.position.z + offset.z,
        },
        radius: this.definition.hurtbox.radius,
      },
    }
  }
}

function assertFiniteVector(value: Vector3Value, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must contain only finite values`)
  }
}

function assertUnitFacing(value: PlayerFacingDirection): void {
  const magnitude = Math.hypot(value.x, value.z)
  if (!Number.isFinite(magnitude) || Math.abs(magnitude - 1) > 0.000_001) {
    throw new RangeError('Enemy facing must be a finite unit direction')
  }
}
