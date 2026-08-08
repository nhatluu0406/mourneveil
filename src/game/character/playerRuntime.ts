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
  PLAYER_ATTACK_DEFINITIONS,
  constrainMovementIntentForAttack,
  createPlayerAttackSpatialSnapshot,
  playerAttackForRequest,
  type PlayerAttackSpatialSnapshot,
} from '../combat/playerAttackActions'
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
}

export interface PlayerRuntimeAdvance extends PlayerRuntimeSnapshot {
  readonly frame: FixedStepAdvance
}

export class PlayerRuntime {
  private readonly clock = new FixedStepClock()
  private readonly combatRuntime = new CombatActionRuntime(
    PLAYER_ATTACK_DEFINITIONS.map((definition) => definition.action),
  )
  private playerState = createPlayerMotorState()
  private collisionResolver: CharacterCollisionResolver | null = null

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

  advanceFrame(
    frameDeltaSeconds: number,
    movementIntent: PlayerMovementIntent,
  ): PlayerRuntimeAdvance {
    const frame = this.clock.advance(frameDeltaSeconds, (fixedStepSeconds) => {
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
    })

    return { ...this.snapshot(), frame }
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
    }
  }
}
