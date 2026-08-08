import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
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
}

export interface PlayerRuntimeAdvance extends PlayerRuntimeSnapshot {
  readonly frame: FixedStepAdvance
}

export class PlayerRuntime {
  private readonly clock = new FixedStepClock()
  private playerState = createPlayerMotorState()
  private collisionResolver: CharacterCollisionResolver | null = null

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
      frame,
    }
  }

  snapshot(): PlayerRuntimeSnapshot {
    return {
      simulation: this.clock.snapshot(),
      player: this.playerState,
    }
  }
}
