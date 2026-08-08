import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type {
  CombatActionDefinition,
  CombatActionRequest,
  CombatResourceValidator,
} from '../combat/combatAction'
import {
  CombatActionRuntime,
  type CombatActionSnapshot,
  type CombatActionStartResult,
} from '../combat/combatActionRuntime'
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
}

export interface PlayerRuntimeAdvance extends PlayerRuntimeSnapshot {
  readonly frame: FixedStepAdvance
}

export class PlayerRuntime {
  private readonly clock = new FixedStepClock()
  private readonly combatRuntime: CombatActionRuntime
  private playerState = createPlayerMotorState()
  private collisionResolver: CharacterCollisionResolver | null = null

  constructor(combatActions: readonly CombatActionDefinition[] = []) {
    this.combatRuntime = new CombatActionRuntime(combatActions)
  }

  requestCombatAction(
    request: CombatActionRequest,
    validateResources?: CombatResourceValidator,
  ): CombatActionStartResult {
    return this.combatRuntime.request(request, validateResources)
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
        this.playerState = stepPlayerMotor(
          this.playerState,
          movementIntent,
          fixedStepSeconds,
          this.collisionResolver,
        )
      }
    })

    return {
      simulation: this.clock.snapshot(),
      player: this.playerState,
      combat: this.combatRuntime.snapshot(),
      frame,
    }
  }

  snapshot(): PlayerRuntimeSnapshot {
    return {
      simulation: this.clock.snapshot(),
      player: this.playerState,
      combat: this.combatRuntime.snapshot(),
    }
  }
}
