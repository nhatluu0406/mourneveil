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
  createPlayerMotorState,
  stepPlayerMotor,
  stepPlayerDodgeMotor,
  type CharacterCollisionResolver,
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
}

export interface PlayerRuntimeAdvance extends PlayerRuntimeSnapshot {
  readonly frame: FixedStepAdvance
  readonly hitEvents: readonly CombatHitEvent[]
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
  private readonly trainingTargetRuntime = new TrainingTargetRuntime()
  private playerState = createPlayerMotorState()
  private collisionResolver: CharacterCollisionResolver | null = null
  private contactQuery: CombatContactQuery | null = null

  requestCombatAction(
    request: CombatActionRequest,
    validateResources?: CombatResourceValidator,
  ): CombatActionStartResult {
    return this.combatRuntime.request(request, validateResources)
  }

  requestPlayerAttack(request: PlayerAttackRequest): CombatActionStartResult {
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
      this.playerState = { ...this.playerState, facing: { ...direction } }
    }
    return result
  }

  setGuardIntent(held: boolean): void {
    this.defenseRuntime.setGuardIntent(held)
  }

  interruptCombatAction(): CombatActionEndResult {
    return this.combatRuntime.requestInterruption()
  }

  attachCollisionResolver(resolver: CharacterCollisionResolver): () => void {
    this.collisionResolver = resolver

    return () => {
      if (this.collisionResolver === resolver) {
        this.collisionResolver = null
      }
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

  advanceFrame(
    frameDeltaSeconds: number,
    movementIntent: PlayerMovementIntent,
  ): PlayerRuntimeAdvance {
    const hitEvents: CombatHitEvent[] = []
    const frame = this.clock.advance(frameDeltaSeconds, (fixedStepSeconds, nextStepCount) => {
      this.combatRuntime.advanceFixedStep()
      const combat = this.combatRuntime.snapshot()
      this.defenseRuntime.advanceFixedStep(combat)
      if (this.collisionResolver !== null) {
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
      if (this.contactQuery !== null) {
        const combat = this.combatRuntime.snapshot()
        const attack = createPlayerAttackSpatialSnapshot(
          combat,
          this.playerState.position,
          this.playerState.facing,
        )
        hitEvents.push(
          ...this.contactRuntime.resolvePlayerContact({
            combat,
            attack,
            simulationStep: nextStepCount,
            targets: [this.trainingTargetRuntime],
            query: this.contactQuery,
          }),
        )
      }
    })

    return { ...this.snapshot(), frame, hitEvents }
  }

  snapshot(): PlayerRuntimeSnapshot {
    const combat = this.combatRuntime.snapshot()
    return {
      simulation: this.clock.snapshot(),
      player: this.playerState,
      combat,
      attack: createPlayerAttackSpatialSnapshot(
        combat,
        this.playerState.position,
        this.playerState.facing,
      ),
      contact: this.contactRuntime.snapshot(),
      trainingTarget: this.trainingTargetRuntime.snapshot(),
      defense: this.defenseRuntime.snapshot(combat),
    }
  }
}
