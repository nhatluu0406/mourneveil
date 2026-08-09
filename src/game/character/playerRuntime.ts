import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { PlayerAttackRequest } from '../../input/playerAttackIntent'
import type { PlayerDodgeRequest } from '../../input/playerDefenseIntent'
import type {
  CombatActionRequest,
  CombatResourceValidator,
} from '../combat/combatAction'
import {
  CombatActionRuntime,
  type CombatActionEndResult,
  type CombatActionSnapshot,
  type CombatActionStartResult,
} from '../combat/combatActionRuntime'
import {
  CombatContactRuntime,
  type CombatContactQuery,
  type CombatContactSnapshot,
  type CombatHitEvent,
} from '../combat/combatContact'
import type { CombatDamageResult } from '../combat/combatHealth'
import {
  PLAYER_ATTACK_DEFINITIONS,
  constrainMovementIntentForAttack,
  createPlayerAttackSpatialSnapshot,
  playerAttackForRequest,
  type PlayerAttackSpatialSnapshot,
} from '../combat/playerAttackActions'
import {
  PLAYER_DODGE_ACTION,
  PLAYER_DODGE_ACTION_ID,
  PLAYER_DODGE_SPEED,
  PlayerDefenseRuntime,
  resolveIncomingMeleeDefense,
  type PlayerDefenseSnapshot,
} from '../combat/playerDefense'
import {
  TrainingTargetRuntime,
  type TrainingTargetSnapshot,
} from '../combat/trainingTarget'
import {
  FixedStepClock,
  type FixedStepAdvance,
  type SimulationTimeSnapshot,
} from '../core/fixedStepClock'
import {
  advanceMeleeEnemy,
  createEnemyAttackSpatialSnapshot,
  createMeleeEnemyRuntime,
  horizontalDistance,
  MELEE_ENEMY_ATTACK_DAMAGE,
  MELEE_ENEMY_SPAWN_POSITION,
  type EnemyAttackSpatialSnapshot,
} from '../enemies/meleeEnemy'
import type { EnemyRuntimeSnapshot } from '../enemies/enemyRuntime'
import {
  PlayerCombatHealthRuntime,
  type PlayerCombatSnapshot,
} from './playerCombatHealth'
import {
  createPlayerMotorState,
  stepPlayerMotor,
  stepPlayerDodgeMotor,
  type CharacterCollisionResolver,
  type PlayerFacingDirection,
  type PlayerMotorState,
} from './playerMotor'

export interface PlayerRuntimeSnapshot {
  readonly simulation: SimulationTimeSnapshot
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
  readonly incomingContact: CombatContactSnapshot
}

export interface PlayerRuntimeAdvance extends PlayerRuntimeSnapshot {
  readonly frame: FixedStepAdvance
  readonly hitEvents: readonly CombatHitEvent[]
  readonly incomingHitEvents: readonly CombatHitEvent[]
}

export class PlayerRuntime {
  private readonly clock = new FixedStepClock()
  private readonly combatRuntime = new CombatActionRuntime(
    [
      ...PLAYER_ATTACK_DEFINITIONS.map((definition) => definition.action),
      PLAYER_DODGE_ACTION,
    ],
  )
  private readonly defenseRuntime = new PlayerDefenseRuntime()
  private readonly contactRuntime = new CombatContactRuntime()
  private readonly enemyContactRuntime = new CombatContactRuntime()
  private readonly trainingTargetRuntime = new TrainingTargetRuntime()
  private playerState = createPlayerMotorState()
  private readonly playerCombatRuntime = new PlayerCombatHealthRuntime(
    this.playerState.position,
  )
  private readonly enemyRuntime = createMeleeEnemyRuntime()
  private collisionResolver: CharacterCollisionResolver | null = null
  private enemyCollisionResolver: CharacterCollisionResolver | null = null
  private contactQuery: CombatContactQuery | null = null
  /** Frozen aim for the committed attack execution; null while combat is idle. */
  private attackExecutionFacing: PlayerFacingDirection | null = null

  requestCombatAction(
    request: CombatActionRequest,
    validateResources?: CombatResourceValidator,
  ): CombatActionStartResult {
    if (!this.playerCombatRuntime.snapshot().health.alive) {
      return {
        accepted: false,
        actionId: request.actionId,
        reason: 'actor-defeated',
      }
    }
    return this.combatRuntime.request(request, validateResources)
  }

  requestPlayerAttack(request: PlayerAttackRequest): CombatActionStartResult {
    if (!this.playerCombatRuntime.snapshot().health.alive) {
      return {
        accepted: false,
        actionId: playerAttackForRequest(request).action.id,
        reason: 'actor-defeated',
      }
    }
    if (!this.defenseRuntime.canStartAction()) {
      return {
        accepted: false,
        actionId: playerAttackForRequest(request).action.id,
        reason: 'guard-active',
      }
    }
    const attack = playerAttackForRequest(request)
    const result = this.requestCombatAction({
      type: 'start-action',
      actionId: attack.action.id,
    })
    if (result.accepted) {
      this.attackExecutionFacing = { ...request.aimDirection }
      this.playerState = {
        ...this.playerState,
        facing: { ...request.aimDirection },
      }
    }
    return result
  }

  requestPlayerDodge(
    request: PlayerDodgeRequest,
    movementIntent: PlayerMovementIntent,
  ): CombatActionStartResult {
    if (!this.playerCombatRuntime.snapshot().health.alive) {
      return { accepted: false, actionId: PLAYER_DODGE_ACTION_ID, reason: 'actor-defeated' }
    }
    if (!this.defenseRuntime.canStartAction()) {
      return { accepted: false, actionId: PLAYER_DODGE_ACTION_ID, reason: 'guard-active' }
    }
    const direction = this.defenseRuntime.sampleDodgeDirection(
      request,
      movementIntent,
      this.playerState.facing,
    )
    const result = this.requestCombatAction({
      type: 'start-action',
      actionId: PLAYER_DODGE_ACTION_ID,
    })
    this.defenseRuntime.acceptDodge(result, direction)
    if (result.accepted) {
      this.attackExecutionFacing = null
      this.playerState = { ...this.playerState, facing: { ...direction } }
    }
    return result
  }

  setGuardIntent(held: boolean): void {
    this.defenseRuntime.setGuardIntent(held)
  }

  interruptCombatAction(): CombatActionEndResult {
    const result = this.combatRuntime.requestInterruption()
    if (this.combatRuntime.snapshot().phase === 'idle') {
      this.attackExecutionFacing = null
    }
    return result
  }

  attachCollisionResolver(resolver: CharacterCollisionResolver): () => void {
    this.collisionResolver = resolver

    return () => {
      if (this.collisionResolver === resolver) {
        this.collisionResolver = null
      }
    }
  }

  attachEnemyCollisionResolver(resolver: CharacterCollisionResolver): () => void {
    this.enemyCollisionResolver = resolver
    return () => {
      if (this.enemyCollisionResolver === resolver) this.enemyCollisionResolver = null
    }
  }

  attachCombatContactQuery(query: CombatContactQuery): () => void {
    this.contactQuery = query

    return () => {
      if (this.contactQuery === query) {
        this.contactQuery = null
      }
    }
  }

  resetTrainingTarget(): void {
    this.trainingTargetRuntime.reset()
  }

  resetMeleeFixture(): void {
    this.playerCombatRuntime.reset()
    this.enemyRuntime.reset(MELEE_ENEMY_SPAWN_POSITION)
    this.enemyContactRuntime.reset()
  }

  advanceFrame(
    frameDeltaSeconds: number,
    movementIntent: PlayerMovementIntent,
  ): PlayerRuntimeAdvance {
    const hitEvents: CombatHitEvent[] = []
    const incomingHitEvents: CombatHitEvent[] = []
    const frame = this.clock.advance(frameDeltaSeconds, (fixedStepSeconds, nextStepCount) => {
      const playerAlive = this.playerCombatRuntime.snapshot().health.alive
      if (playerAlive) this.combatRuntime.advanceFixedStep()
      const combat = this.combatRuntime.snapshot()
      if (combat.phase === 'idle') {
        this.attackExecutionFacing = null
      }
      this.defenseRuntime.advanceFixedStep(combat)
      if (playerAlive && this.collisionResolver !== null) {
        const defense = this.defenseRuntime.snapshot(combat)
        if (defense.dodgeDirection !== null) {
          this.playerState = stepPlayerDodgeMotor(
            this.playerState,
            defense.dodgeDirection,
            defense.dodgeMovementActive ? PLAYER_DODGE_SPEED : 0,
            fixedStepSeconds,
            this.collisionResolver,
          )
        } else {
          const constrainedMovementIntent = constrainMovementIntentForAttack(
            {
              horizontal: movementIntent.horizontal * defense.movementScale,
              forward: movementIntent.forward * defense.movementScale,
            },
            combat.phase,
          )
          this.playerState = stepPlayerMotor(
            this.playerState,
            constrainedMovementIntent,
            fixedStepSeconds,
            this.collisionResolver,
          )
        }
      }
      this.playerCombatRuntime.updatePosition(this.playerState.position)
      if (playerAlive) {
        advanceMeleeEnemy(
          this.enemyRuntime,
          this.playerState.position,
          fixedStepSeconds,
          this.enemyCollisionResolver,
        )
      }
      if (this.contactQuery !== null) {
        const combat = this.combatRuntime.snapshot()
        const attack = createPlayerAttackSpatialSnapshot(
          combat,
          this.playerState.position,
          this.attackExecutionFacing,
        )
        hitEvents.push(
          ...this.contactRuntime.resolvePlayerContact({
            combat,
            attack,
            simulationStep: nextStepCount,
            targets: [this.trainingTargetRuntime, this.enemyRuntime],
            query: this.contactQuery,
          }),
        )
        const enemy = this.enemyRuntime.snapshot()
        const enemyAttack = createEnemyAttackSpatialSnapshot(enemy)
        incomingHitEvents.push(
          ...this.enemyContactRuntime.resolveContact({
            attackerId: enemy.id,
            combat: enemy.action,
            contactShape: enemyAttack.activeContactShape,
            simulationStep: nextStepCount,
            targets: [this.playerCombatRuntime],
            query: this.contactQuery,
            damage: MELEE_ENEMY_ATTACK_DAMAGE,
            resolveDamage: (target, damage) => {
              const outcome = resolveIncomingMeleeDefense(
                this.defenseRuntime.snapshot(combat),
                this.playerState.facing,
                this.playerState.position,
                enemy.position,
              )
              if (outcome === 'damaged') {
                return { outcome, result: target.applyDamage(damage) }
              }
              const health = target.snapshot().health
              const result: CombatDamageResult = {
                applied: false,
                appliedDamage: 0,
                health,
              }
              return { outcome, result }
            },
          }),
        )
      }
    })

    return { ...this.snapshot(), frame, hitEvents, incomingHitEvents }
  }

  snapshot(): PlayerRuntimeSnapshot {
    const combat = this.combatRuntime.snapshot()
    if (combat.phase === 'idle') {
      this.attackExecutionFacing = null
    }
    this.playerCombatRuntime.updatePosition(this.playerState.position)
    const enemy = this.enemyRuntime.snapshot()
    return {
      simulation: this.clock.snapshot(),
      player: this.playerState,
      combat,
      attack: createPlayerAttackSpatialSnapshot(
        combat,
        this.playerState.position,
        this.attackExecutionFacing,
      ),
      contact: this.contactRuntime.snapshot(),
      trainingTarget: this.trainingTargetRuntime.snapshot(),
      defense: this.defenseRuntime.snapshot(combat),
      playerCombat: this.playerCombatRuntime.snapshot(),
      enemy,
      enemyAttack: createEnemyAttackSpatialSnapshot(enemy),
      enemyDistanceToPlayer: horizontalDistance(
        enemy.position,
        this.playerState.position,
      ),
      incomingContact: this.enemyContactRuntime.snapshot(),
    }
  }
}
