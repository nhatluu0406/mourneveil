import type { Vector3Value } from '../character/playerMotor'

export const M5_CHECKPOINT_ID = 'checkpoint.m5.refuge' as const
export const LEGACY_GRAYBOX_CHECKPOINT_ID = 'checkpoint.graybox.entry' as const
export const CHECKPOINT_ACTIVATION_RANGE = 1.1

export interface CheckpointDefinition {
  readonly id: typeof M5_CHECKPOINT_ID
  readonly respawnPosition: Vector3Value
  readonly activationRange: number
}

export const CONNECTED_LEVEL_CHECKPOINT_DEFINITION: CheckpointDefinition = Object.freeze({
  id: M5_CHECKPOINT_ID,
  respawnPosition: Object.freeze({ x: -6, y: 0.82, z: 0 }),
  activationRange: CHECKPOINT_ACTIVATION_RANGE,
})

/** @deprecated M5 repurposed the single canonical checkpoint. */
export const GRAYBOX_CHECKPOINT_DEFINITION = CONNECTED_LEVEL_CHECKPOINT_DEFINITION

export interface CheckpointSnapshot {
  readonly id: typeof M5_CHECKPOINT_ID
  readonly respawnPosition: Vector3Value
  readonly activationRange: number
  readonly activated: boolean
  readonly currentCheckpointId: typeof M5_CHECKPOINT_ID | null
}

export type CheckpointInteractionResult =
  | { readonly accepted: true; readonly checkpointId: typeof M5_CHECKPOINT_ID }
  | {
      readonly accepted: false
      readonly checkpointId: typeof M5_CHECKPOINT_ID
      readonly reason: 'actor-dead' | 'out-of-range'
    }

export type PlayerRespawnResult =
  | { readonly accepted: true; readonly checkpointId: typeof M5_CHECKPOINT_ID }
  | { readonly accepted: false; readonly reason: 'actor-alive' | 'no-active-checkpoint' }

export class CheckpointRuntime {
  private activated = false
  private currentCheckpointId: typeof M5_CHECKPOINT_ID | null = null

  constructor(
    readonly definition: CheckpointDefinition = CONNECTED_LEVEL_CHECKPOINT_DEFINITION,
  ) {}

  interact(playerPosition: Vector3Value, playerAlive: boolean): CheckpointInteractionResult {
    if (!playerAlive) {
      return { accepted: false, checkpointId: this.definition.id, reason: 'actor-dead' }
    }
    if (horizontalDistance(playerPosition, this.definition.respawnPosition) > this.definition.activationRange) {
      return { accepted: false, checkpointId: this.definition.id, reason: 'out-of-range' }
    }
    this.activated = true
    this.currentCheckpointId = this.definition.id
    return { accepted: true, checkpointId: this.definition.id }
  }

  activeRespawnPosition(): Vector3Value | null {
    return this.currentCheckpointId === this.definition.id
      ? { ...this.definition.respawnPosition }
      : null
  }

  snapshot(): CheckpointSnapshot {
    return {
      id: this.definition.id,
      respawnPosition: { ...this.definition.respawnPosition },
      activationRange: this.definition.activationRange,
      activated: this.activated,
      currentCheckpointId: this.currentCheckpointId,
    }
  }

  restore(activated: boolean, currentCheckpointId: typeof M5_CHECKPOINT_ID | null): void {
    this.activated = activated
    this.currentCheckpointId =
      activated && currentCheckpointId === this.definition.id ? this.definition.id : null
  }
}

function horizontalDistance(left: Vector3Value, right: Vector3Value): number {
  return Math.hypot(left.x - right.x, left.z - right.z)
}
