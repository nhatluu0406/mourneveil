import type { CombatActionDefinition, CombatActionId } from '../combat/combatAction'
import {
  CombatActionRuntime,
  type CombatActionSnapshot,
  type CombatActionStartResult,
} from '../combat/combatActionRuntime'
import type { CombatHitEvent } from '../combat/combatContact'
import {
  applyCombatDamage,
  createCombatHealth,
  type CombatDamageResult,
  type CombatHealthState,
} from '../combat/combatHealth'
import type { SphereHurtbox } from '../combat/combatTarget'
import type { PlayerFacingDirection, Vector3Value } from '../character/playerMotor'
import type { EnemyDefinition, EnemyDefinitionId } from './enemyDefinition'
import {
  ENEMY_HIT_REACTION_DURATION_STEPS,
  ENEMY_HIT_REACTION_IMMUNITY_STEPS,
  ENEMY_INTERRUPT_METER_QUIET_RESET_STEPS,
  enemyInterruptThreshold,
  enemyPhaseAllowsInterrupt,
  interruptImpactForPlayerAction,
} from './enemyHitReaction'

export type EnemyRuntimeId = string
export type EnemyState =
  | 'idle'
  | 'pursue'
  | 'spacing'
  | 'attack'
  | 'recovery'
  | 'hitReaction'
  | 'defeated'

export interface EnemyRuntimeSnapshot {
  readonly id: EnemyRuntimeId
  readonly definitionId: EnemyDefinitionId
  readonly position: Vector3Value
  readonly facing: PlayerFacingDirection
  readonly attackExecutionFacing: PlayerFacingDirection | null
  readonly velocity: Vector3Value
  readonly state: EnemyState
  readonly health: CombatHealthState
  readonly alive: boolean
  readonly targetId: string | null
  readonly action: CombatActionSnapshot
  readonly hurtbox: SphereHurtbox
  readonly hitReactionRemainingSteps: number
  readonly interruptMeter: number
  readonly hitReactionImmunityRemainingSteps: number
}

const ALLOWED_TRANSITIONS: Readonly<Record<EnemyState, readonly EnemyState[]>> = {
  idle: ['pursue', 'hitReaction', 'defeated'],
  pursue: ['idle', 'spacing', 'attack', 'hitReaction', 'defeated'],
  spacing: ['idle', 'pursue', 'attack', 'hitReaction', 'defeated'],
  attack: ['recovery', 'hitReaction', 'defeated'],
  recovery: ['spacing', 'hitReaction', 'defeated'],
  hitReaction: ['pursue', 'idle', 'defeated'],
  defeated: [],
}

export class EnemyRuntime {
  private readonly actions: CombatActionRuntime
  private position: Vector3Value
  private facing: PlayerFacingDirection
  private attackExecutionFacing: PlayerFacingDirection | null = null
  private velocity: Vector3Value = { x: 0, y: 0, z: 0 }
  private state: EnemyState = 'idle'
  private health: CombatHealthState
  private targetId: string | null = null
  private hitReactionRemainingSteps = 0
  private interruptMeter = 0
  private interruptMeterQuietSteps = 0
  private hitReactionImmunityRemainingSteps = 0
  private lastReactionExecutionId: number | null = null
  private previousAttackId: CombatActionId | null = null

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
    if (next === 'idle' || next === 'defeated') {
      this.targetId = null
    } else if (next === 'hitReaction') {
      this.targetId = targetId ?? this.targetId
    } else if (targetId === null) {
      throw new Error(`Enemy state ${next} requires a target`)
    } else {
      this.targetId = targetId
    }
    this.state = next
    if (next === 'defeated') {
      this.velocity = { x: 0, y: 0, z: 0 }
      this.attackExecutionFacing = null
      this.hitReactionRemainingSteps = 0
      this.interruptMeter = 0
      this.interruptMeterQuietSteps = 0
      this.hitReactionImmunityRemainingSteps = 0
      this.lastReactionExecutionId = null
      this.actions.reset()
    }
  }

  startAction(actionId: CombatActionId, facing: PlayerFacingDirection): CombatActionStartResult {
    if (!this.health.alive) {
      return { accepted: false, actionId, reason: 'actor-defeated' }
    }
    if (this.state === 'hitReaction') {
      return { accepted: false, actionId, reason: 'action-in-progress' }
    }
    if (this.state !== 'pursue' && this.state !== 'spacing') {
      return { accepted: false, actionId, reason: 'action-in-progress' }
    }
    assertUnitFacing(facing)
    const result = this.actions.request({ type: 'start-action', actionId })
    if (result.accepted) {
      this.previousAttackId = actionId
      this.attackExecutionFacing = { ...facing }
      this.facing = { ...this.attackExecutionFacing }
      this.velocity = { x: 0, y: 0, z: 0 }
      this.transition('attack')
    }
    return result
  }

  lastAttackId(): CombatActionId | null {
    return this.previousAttackId
  }

  advanceAction(): void {
    if (!this.health.alive) return
    if (this.state === 'hitReaction') return
    this.actions.advanceFixedStep()
    const phase = this.actions.snapshot().phase
    if (this.state === 'attack' && phase === 'recovery') this.transition('recovery')
    if (this.state === 'recovery' && phase === 'idle') {
      this.attackExecutionFacing = null
      this.transition('spacing')
    }
  }

  /** Advances simulation-owned hit-reaction and quiet/immunity timers one fixed step. */
  advanceHitReaction(): void {
    if (!this.health.alive) return
    if (this.hitReactionImmunityRemainingSteps > 0) {
      this.hitReactionImmunityRemainingSteps -= 1
    }
    if (this.interruptMeter > 0) {
      this.interruptMeterQuietSteps += 1
      if (this.interruptMeterQuietSteps >= ENEMY_INTERRUPT_METER_QUIET_RESET_STEPS) {
        this.interruptMeter = 0
        this.interruptMeterQuietSteps = 0
      }
    }
    if (this.state !== 'hitReaction') return
    this.velocity = { x: 0, y: 0, z: 0 }
    if (this.hitReactionRemainingSteps > 0) {
      this.hitReactionRemainingSteps -= 1
    }
    if (this.hitReactionRemainingSteps > 0) return
    this.hitReactionImmunityRemainingSteps = ENEMY_HIT_REACTION_IMMUNITY_STEPS
    if (this.targetId !== null) {
      this.transition('pursue', this.targetId)
    } else {
      this.transition('idle')
    }
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

  holdSpacing(facing: PlayerFacingDirection | null): void {
    if (this.state !== 'spacing' || !this.health.alive) return
    if (facing !== null) {
      assertUnitFacing(facing)
      this.facing = { ...facing }
    }
    this.velocity = { x: 0, y: 0, z: 0 }
  }

  applyDamage(damage: number): CombatDamageResult {
    const result = applyCombatDamage(this.health, damage)
    if (!result.applied) return result
    this.health = result.health
    if (!this.health.alive) this.transition('defeated')
    return result
  }

  /**
   * Applies interrupt policy after an already-deduped damaged hit.
   * Returns whether a new hit-reaction state began.
   */
  applyHitReactionFromDamagedHit(hit: Pick<CombatHitEvent, 'actionId' | 'executionId' | 'outcome'>): boolean {
    if (hit.outcome !== 'damaged' || !this.health.alive || this.state === 'defeated') return false
    if (this.state === 'hitReaction') return false
    if (this.hitReactionImmunityRemainingSteps > 0) return false
    if (this.lastReactionExecutionId === hit.executionId) return false

    const impact = interruptImpactForPlayerAction(hit.actionId)
    if (impact <= 0) return false

    const actionPhase = this.actions.snapshot().phase
    if (!enemyPhaseAllowsInterrupt(this.state, actionPhase)) return false

    this.interruptMeter += impact
    this.interruptMeterQuietSteps = 0
    const threshold = enemyInterruptThreshold(this.definition.role)
    if (this.interruptMeter < threshold) return false

    this.interruptMeter = 0
    this.interruptMeterQuietSteps = 0
    this.lastReactionExecutionId = hit.executionId
    this.attackExecutionFacing = null
    this.velocity = { x: 0, y: 0, z: 0 }
    this.actions.reset()
    this.hitReactionRemainingSteps = ENEMY_HIT_REACTION_DURATION_STEPS
    this.transition('hitReaction', this.targetId)
    return true
  }

  reset(position: Vector3Value = this.position): void {
    assertFiniteVector(position, 'Enemy reset position')
    this.position = { ...position }
    this.velocity = { x: 0, y: 0, z: 0 }
    this.state = 'idle'
    this.targetId = null
    this.attackExecutionFacing = null
    this.hitReactionRemainingSteps = 0
    this.interruptMeter = 0
    this.interruptMeterQuietSteps = 0
    this.hitReactionImmunityRemainingSteps = 0
    this.lastReactionExecutionId = null
    this.previousAttackId = null
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
      attackExecutionFacing:
        this.attackExecutionFacing === null ? null : { ...this.attackExecutionFacing },
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
      hitReactionRemainingSteps: this.hitReactionRemainingSteps,
      interruptMeter: this.interruptMeter,
      hitReactionImmunityRemainingSteps: this.hitReactionImmunityRemainingSteps,
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
