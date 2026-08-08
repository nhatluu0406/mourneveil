import type { PlayerMovementIntent } from '../../input/playerMovementIntent'

export const PLAYER_MOVE_SPEED = 4
export const PLAYER_ACCELERATION = 18
export const PLAYER_DECELERATION = 24
export const PLAYER_GRAVITY = 24
export const PLAYER_MAX_FALL_SPEED = 30

export interface Vector3Value {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface PlayerFacingDirection {
  readonly x: number
  readonly z: number
}

export interface PlayerMotorState {
  readonly position: Vector3Value
  readonly velocity: Vector3Value
  readonly grounded: boolean
  readonly movementIntent: PlayerMovementIntent
  readonly facing: PlayerFacingDirection
}

export interface CharacterCollisionResult {
  readonly translation: Vector3Value
  readonly grounded: boolean
}

export type CharacterCollisionResolver = (
  position: Vector3Value,
  desiredTranslation: Vector3Value,
) => CharacterCollisionResult

const INITIAL_POSITION: Vector3Value = Object.freeze({ x: -3, y: 0.82, z: 3 })
const ZERO_VECTOR: Vector3Value = Object.freeze({ x: 0, y: 0, z: 0 })
const NEUTRAL_INTENT: PlayerMovementIntent = Object.freeze({
  horizontal: 0,
  forward: 0,
})
const INITIAL_FACING: PlayerFacingDirection = Object.freeze({ x: 0, z: -1 })

export function createPlayerMotorState(
  position: Vector3Value = INITIAL_POSITION,
): PlayerMotorState {
  return {
    position: { ...position },
    velocity: ZERO_VECTOR,
    grounded: false,
    movementIntent: NEUTRAL_INTENT,
    facing: INITIAL_FACING,
  }
}

export function stepPlayerMotor(
  state: PlayerMotorState,
  movementIntent: PlayerMovementIntent,
  fixedStepSeconds: number,
  resolveCollision: CharacterCollisionResolver,
): PlayerMotorState {
  if (!Number.isFinite(fixedStepSeconds) || fixedStepSeconds <= 0) {
    throw new RangeError('Fixed step must be a finite, positive number')
  }

  const targetHorizontalVelocity = {
    x: movementIntent.horizontal * PLAYER_MOVE_SPEED,
    z: -movementIntent.forward * PLAYER_MOVE_SPEED,
  }
  const hasMovementIntent =
    movementIntent.horizontal !== 0 || movementIntent.forward !== 0
  const facing = hasMovementIntent
    ? movementIntentToFacing(movementIntent)
    : state.facing
  const horizontalVelocity = moveToward2D(
    { x: state.velocity.x, z: state.velocity.z },
    targetHorizontalVelocity,
    (hasMovementIntent ? PLAYER_ACCELERATION : PLAYER_DECELERATION) *
      fixedStepSeconds,
  )
  const verticalVelocity = Math.max(
    state.velocity.y - PLAYER_GRAVITY * fixedStepSeconds,
    -PLAYER_MAX_FALL_SPEED,
  )
  const desiredTranslation = {
    x: horizontalVelocity.x * fixedStepSeconds,
    y: verticalVelocity * fixedStepSeconds,
    z: horizontalVelocity.z * fixedStepSeconds,
  }
  const collision = resolveCollision(state.position, desiredTranslation)
  assertFiniteVector(collision.translation, 'Collision translation')

  return {
    position: {
      x: state.position.x + collision.translation.x,
      y: state.position.y + collision.translation.y,
      z: state.position.z + collision.translation.z,
    },
    velocity: {
      x: normalizeZero(collision.translation.x / fixedStepSeconds),
      y:
        collision.grounded && verticalVelocity <= 0
          ? 0
          : collision.translation.y / fixedStepSeconds,
      z: normalizeZero(collision.translation.z / fixedStepSeconds),
    },
    grounded: collision.grounded,
    movementIntent: { ...movementIntent },
    facing,
  }
}

export function movementIntentToFacing(
  movementIntent: PlayerMovementIntent,
): PlayerFacingDirection {
  const magnitude = Math.hypot(
    movementIntent.horizontal,
    movementIntent.forward,
  )
  if (magnitude === 0) {
    throw new RangeError('Neutral movement has no facing direction')
  }

  return {
    x: normalizeZero(movementIntent.horizontal / magnitude),
    z: normalizeZero(-movementIntent.forward / magnitude),
  }
}

function normalizeZero(value: number): number {
  return value === 0 ? 0 : value
}

function moveToward2D(
  current: { readonly x: number; readonly z: number },
  target: { readonly x: number; readonly z: number },
  maximumChange: number,
): { readonly x: number; readonly z: number } {
  const deltaX = target.x - current.x
  const deltaZ = target.z - current.z
  const distance = Math.hypot(deltaX, deltaZ)

  if (distance <= maximumChange || distance === 0) {
    return target
  }

  const scale = maximumChange / distance
  return {
    x: current.x + deltaX * scale,
    z: current.z + deltaZ * scale,
  }
}

function assertFiniteVector(value: Vector3Value, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must contain only finite numbers`)
  }
}
