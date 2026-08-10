import type { Vector3Value } from '../character/playerMotor'

export const M5_CHECKPOINT_ID = 'checkpoint.m5.refuge' as const
export const LEGACY_GRAYBOX_CHECKPOINT_ID = 'checkpoint.graybox.entry' as const
export const CHECKPOINT_ACTIVATION_RANGE = 1.1

export interface CheckpointDefinition {
  readonly id: typeof M5_CHECKPOINT_ID
  /** Render asset pivot; never used as the player spawn authority. */
  readonly visualPosition: Vector3Value
  /** Point used for proximity interaction checks. */
  readonly interactionPosition: Vector3Value
  readonly respawnPosition: Vector3Value
  /** Explicit gameplay collision proxy owned by world physics, not the render asset. */
  readonly collisionSize: readonly [number, number, number]
  readonly activationRange: number
}

export const CONNECTED_LEVEL_CHECKPOINT_DEFINITION: CheckpointDefinition = Object.freeze({
  id: M5_CHECKPOINT_ID,
  visualPosition: Object.freeze({ x: -5.5, y: 0, z: 0 }),
  interactionPosition: Object.freeze({ x: -6.4, y: 0.82, z: 0 }),
  respawnPosition: Object.freeze({ x: -6.8, y: 0.82, z: 0 }),
  collisionSize: Object.freeze([0.8, 2.8, 0.8] as const),
  activationRange: CHECKPOINT_ACTIVATION_RANGE,
})

/** @deprecated M5 repurposed the single canonical checkpoint. */
export const GRAYBOX_CHECKPOINT_DEFINITION = CONNECTED_LEVEL_CHECKPOINT_DEFINITION

export interface CheckpointSnapshot {
  readonly id: typeof M5_CHECKPOINT_ID
  readonly visualPosition: Vector3Value
  readonly interactionPosition: Vector3Value
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
    if (
      horizontalDistance(playerPosition, this.definition.interactionPosition) >
      this.definition.activationRange
    ) {
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
      visualPosition: { ...this.definition.visualPosition },
      interactionPosition: { ...this.definition.interactionPosition },
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
