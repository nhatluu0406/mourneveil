import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { PlayerAttackRequest } from '../../input/playerAttackIntent'
import type { PlayerDodgeRequest } from '../../input/playerDefenseIntent'
import type {
  PlayerCheckpointInteractionRequest,
  PlayerRespawnRequest,
} from '../../input/playerRecoveryIntent'
import type { PlayerFlaskUseRequest } from '../../input/playerFlaskIntent'
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
  enemyAttackDamage,
  horizontalDistance,
  type EnemyAttackSpatialSnapshot,
} from '../enemies/meleeEnemy'
import {
  createGrayboxEncounterSnapshot,
  type GrayboxEncounterSnapshot,
} from '../encounters/grayboxEncounter'
import {
  createGrayboxEnemyRuntimes,
  meleeRoleByRuntimeId,
  GRAYBOX_ENEMY_ROLES,
} from '../enemies/enemyRoles'
import type { EnemyRuntime, EnemyRuntimeSnapshot } from '../enemies/enemyRuntime'
import {
  CheckpointRuntime,
  GRAYBOX_CHECKPOINT_DEFINITION,
  type CheckpointInteractionResult,
  type CheckpointSnapshot,
  type PlayerRespawnResult,
} from '../world/checkpoint'
import { PlayerHealthRuntime, type PlayerHealthSnapshot } from './playerHealth'
import {
  PLAYER_FLASK_DEFINITION,
  PLAYER_FLASK_ACTION_ID,
  PlayerFlaskRuntime,
  type PlayerFlaskSnapshot,
} from './playerFlask'
import {
  createPlayerMotorState,
  stopPlayerMotor,
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
  readonly playerHealth: PlayerHealthSnapshot
  /** Primary diagnostic enemy (skirmisher). Prefer `enemies` for multi-role fixtures. */
  readonly enemy: EnemyRuntimeSnapshot
  readonly enemyAttack: EnemyAttackSpatialSnapshot
  readonly enemyDistanceToPlayer: number
  readonly enemies: readonly EnemyRuntimeSnapshot[]
  readonly enemyAttacks: readonly EnemyAttackSpatialSnapshot[]
  readonly encounter: GrayboxEncounterSnapshot
  readonly incomingContact: CombatContactSnapshot
  readonly checkpoint: CheckpointSnapshot
  readonly flask: PlayerFlaskSnapshot
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
      PLAYER_FLASK_DEFINITION.action,
    ],
  )
  private readonly defenseRuntime = new PlayerDefenseRuntime()
  private readonly contactRuntime = new CombatContactRuntime()
  private readonly enemyContactRuntimes = new Map<string, CombatContactRuntime>()
  private readonly trainingTargetRuntime = new TrainingTargetRuntime()
  private readonly checkpointRuntime = new CheckpointRuntime()
  private readonly flaskRuntime = new PlayerFlaskRuntime()
  private playerState = createPlayerMotorState(
    GRAYBOX_CHECKPOINT_DEFINITION.respawnPosition,
  )
  private readonly playerHealthRuntime = new PlayerHealthRuntime(
    this.playerState.position,
  )
  private readonly enemyRuntimes: EnemyRuntime[] = createGrayboxEnemyRuntimes()
  private collisionResolver: CharacterCollisionResolver | null = null
  private readonly enemyCollisionResolvers = new Map<string, CharacterCollisionResolver>()
  private contactQuery: CombatContactQuery | null = null
  /** Frozen aim for the committed attack execution; null while combat is idle. */
  private attackExecutionFacing: PlayerFacingDirection | null = null

  requestCombatAction(
    request: CombatActionRequest,
    validateResources?: CombatResourceValidator,
  ): CombatActionStartResult {
    if (!this.playerHealthRuntime.snapshot().health.alive) {
      return {
        accepted: false,
        actionId: request.actionId,
        reason: 'actor-defeated',
      }
    }
    return this.combatRuntime.request(request, validateResources)
  }

  requestPlayerAttack(request: PlayerAttackRequest): CombatActionStartResult {
    if (!this.playerHealthRuntime.snapshot().health.alive) {
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
    if (!this.playerHealthRuntime.snapshot().health.alive) {
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
    this.defenseRuntime.setGuardIntent(
      this.playerHealthRuntime.snapshot().health.alive && held,
    )
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

  attachEnemyCollisionResolver(
    enemyId: string,
    resolver: CharacterCollisionResolver,
  ): () => void {
    this.enemyCollisionResolvers.set(enemyId, resolver)
    return () => {
      if (this.enemyCollisionResolvers.get(enemyId) === resolver) {
        this.enemyCollisionResolvers.delete(enemyId)
      }
    }
  }

  enemyIds(): readonly string[] {
    return this.enemyRuntimes.map((enemy) => enemy.id)
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
    this.restorePlayerForDevelopment()
    this.resetGrayboxEncounter()
  }

  resetGrayboxEncounter(): void {
    for (const enemy of this.enemyRuntimes) {
      const role = meleeRoleByRuntimeId(enemy.id)
      enemy.reset(role?.spawnPosition ?? enemy.snapshot().position)
      this.enemyContactRuntimeFor(enemy.id).reset()
    }
  }

  /** Development-only restore; gameplay recovery must use checkpoint respawn. */
  restorePlayerForDevelopment(): void {
    this.playerHealthRuntime.restoreToMaximum()
    this.resetPlayerActionState()
    this.playerState = stopPlayerMotor(this.playerState)
  }

  applyPlayerDamage(damage: number): CombatDamageResult {
    const result = this.playerHealthRuntime.applyDamage(damage)
    if (result.applied && !result.health.alive) {
      this.enterPlayerDefeatedState()
    }
    return result
  }

  requestPlayerFlaskUse(request: PlayerFlaskUseRequest): CombatActionStartResult {
    void request
    if (!this.defenseRuntime.canStartAction()) {
      return {
        accepted: false,
        actionId: PLAYER_FLASK_ACTION_ID,
        reason: 'guard-active',
      }
    }
    const result = this.requestCombatAction(
      { type: 'start-action', actionId: PLAYER_FLASK_ACTION_ID },
      () => {
        const eligibility = this.flaskRuntime.validateUse(
          this.playerHealthRuntime.snapshot().health,
        )
        return eligibility.allowed
          ? { allowed: true }
          : { allowed: false, reason: eligibility.reason }
      },
    )
    this.flaskRuntime.acceptUse(result)
    return result
  }

  requestCheckpointInteraction(
    request: PlayerCheckpointInteractionRequest,
  ): CheckpointInteractionResult {
    void request
    const result = this.checkpointRuntime.interact(
      this.playerState.position,
      this.playerHealthRuntime.snapshot().health.alive,
    )
    if (result.accepted) this.flaskRuntime.refill()
    return result
  }

  requestRespawn(request: PlayerRespawnRequest): PlayerRespawnResult {
    void request
    if (this.playerHealthRuntime.snapshot().health.alive) {
      return { accepted: false, reason: 'actor-alive' }
    }
    const respawnPosition = this.checkpointRuntime.activeRespawnPosition()
    if (respawnPosition === null) {
      return { accepted: false, reason: 'no-active-checkpoint' }
    }

    this.playerState = createPlayerMotorState(respawnPosition)
    this.playerHealthRuntime.updatePosition(respawnPosition)
    this.playerHealthRuntime.restoreToMaximum()
    this.resetPlayerActionState()
    this.flaskRuntime.refill()
    this.resetGrayboxEncounter()
    return {
      accepted: true,
      checkpointId: this.checkpointRuntime.definition.id,
    }
  }

  advanceFrame(
    frameDeltaSeconds: number,
    movementIntent: PlayerMovementIntent,
  ): PlayerRuntimeAdvance {
    const hitEvents: CombatHitEvent[] = []
    const incomingHitEvents: CombatHitEvent[] = []
    const frame = this.clock.advance(frameDeltaSeconds, (fixedStepSeconds, nextStepCount) => {
      const playerAlive = this.playerHealthRuntime.snapshot().health.alive
      if (playerAlive) this.combatRuntime.advanceFixedStep()
      const combat = this.combatRuntime.snapshot()
      if (combat.phase === 'idle') {
        this.attackExecutionFacing = null
      }
      this.defenseRuntime.advanceFixedStep(combat)
      const flaskHealAmount = this.flaskRuntime.advanceFixedStep(combat)
      if (flaskHealAmount !== null) {
        const restoration = this.playerHealthRuntime.restore(flaskHealAmount)
        this.flaskRuntime.recordRestoration(restoration.restoredHealth)
      }
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
      this.playerHealthRuntime.updatePosition(this.playerState.position)
      for (const enemyRuntime of this.enemyRuntimes) {
        advanceMeleeEnemy(
          enemyRuntime,
          this.playerState.position,
          fixedStepSeconds,
          this.enemyCollisionResolvers.get(enemyRuntime.id) ?? null,
          { targetAlive: playerAlive },
        )
      }
      if (this.contactQuery !== null) {
        const combatSnapshot = this.combatRuntime.snapshot()
        const attack = createPlayerAttackSpatialSnapshot(
          combatSnapshot,
          this.playerState.position,
          this.attackExecutionFacing,
        )
        hitEvents.push(
          ...this.contactRuntime.resolvePlayerContact({
            combat: combatSnapshot,
            attack,
            simulationStep: nextStepCount,
            targets: [this.trainingTargetRuntime, ...this.enemyRuntimes],
            query: this.contactQuery,
          }),
        )
        if (playerAlive) {
          for (const enemyRuntime of this.enemyRuntimes) {
            const enemy = enemyRuntime.snapshot()
            const enemyAttack = createEnemyAttackSpatialSnapshot(enemy)
            incomingHitEvents.push(
              ...this.enemyContactRuntimeFor(enemy.id).resolveContact({
                attackerId: enemy.id,
                combat: enemy.action,
                contactShape: enemyAttack.activeContactShape,
                simulationStep: nextStepCount,
                targets: [this.playerHealthRuntime],
                query: this.contactQuery,
                damage: enemyAttackDamage(enemy),
                resolveDamage: (target, damage) => {
                  const outcome = resolveIncomingMeleeDefense(
                    this.defenseRuntime.snapshot(combatSnapshot),
                    this.playerState.facing,
                    enemyAttack.executionFacing ?? enemy.facing,
                  )
                  if (outcome === 'damaged') {
                    return { outcome, result: this.applyPlayerDamage(damage) }
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
        }
      }
    })

    return { ...this.snapshot(), frame, hitEvents, incomingHitEvents }
  }

  snapshot(): PlayerRuntimeSnapshot {
    const combat = this.combatRuntime.snapshot()
    if (combat.phase === 'idle') {
      this.attackExecutionFacing = null
    }
    this.playerHealthRuntime.updatePosition(this.playerState.position)
    const enemies = this.enemyRuntimes.map((enemy) => enemy.snapshot())
    const enemyAttacks = enemies.map((enemy) => createEnemyAttackSpatialSnapshot(enemy))
    const enemy = enemies[0]
    const enemyAttack = enemyAttacks[0]
    const lastIncoming = [...this.enemyContactRuntimes.values()]
      .map((runtime) => runtime.snapshot())
      .reduce<CombatContactSnapshot>(
        (latest, snapshot) => {
          if (snapshot.lastHit === null) return latest
          if (latest.lastHit === null) return snapshot
          return snapshot.lastHit.simulationStep >= latest.lastHit.simulationStep
            ? snapshot
            : latest
        },
        { totalHitCount: 0, lastHit: null },
      )
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
      playerHealth: this.playerHealthRuntime.snapshot(),
      enemy,
      enemyAttack,
      enemyDistanceToPlayer: horizontalDistance(
        enemy.position,
        this.playerState.position,
      ),
      enemies,
      enemyAttacks,
      encounter: createGrayboxEncounterSnapshot(
        GRAYBOX_ENEMY_ROLES.map((role) => role.runtimeId),
        enemies,
      ),
      incomingContact: {
        totalHitCount: [...this.enemyContactRuntimes.values()].reduce(
          (sum, runtime) => sum + runtime.snapshot().totalHitCount,
          0,
        ),
        lastHit: lastIncoming.lastHit,
      },
      checkpoint: this.checkpointRuntime.snapshot(),
      flask: this.flaskRuntime.snapshot(),
    }
  }

  private enemyContactRuntimeFor(enemyId: string): CombatContactRuntime {
    const existing = this.enemyContactRuntimes.get(enemyId)
    if (existing !== undefined) return existing
    const created = new CombatContactRuntime()
    this.enemyContactRuntimes.set(enemyId, created)
    return created
  }

  private enterPlayerDefeatedState(): void {
    this.resetPlayerActionState()
    this.playerState = stopPlayerMotor(this.playerState)
  }

  private resetPlayerActionState(): void {
    this.combatRuntime.reset()
    this.defenseRuntime.reset()
    this.contactRuntime.reset()
    this.flaskRuntime.cancelCommittedUse()
    this.attackExecutionFacing = null
  }
}
