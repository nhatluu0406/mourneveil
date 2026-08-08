import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { PlayerAttackRequest } from '../../input/playerAttackIntent'
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
}

export interface PlayerRuntimeAdvance extends PlayerRuntimeSnapshot {
  readonly frame: FixedStepAdvance
  readonly hitEvents: readonly CombatHitEvent[]
}

export class PlayerRuntime {
  private readonly clock = new FixedStepClock()
  private readonly combatRuntime = new CombatActionRuntime(
    PLAYER_ATTACK_DEFINITIONS.map((definition) => definition.action),
  )
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
    const attack = playerAttackForRequest(request)
    return this.requestCombatAction({
      type: 'start-action',
      actionId: attack.action.id,
    })
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
      if (this.collisionResolver !== null) {
        const constrainedMovementIntent = constrainMovementIntentForAttack(
          movementIntent,
          this.combatRuntime.snapshot().phase,
        )
        this.playerState = stepPlayerMotor(
          this.playerState,
          constrainedMovementIntent,
          fixedStepSeconds,
          this.collisionResolver,
        )
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
    }
  }
}
