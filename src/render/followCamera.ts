import type { Vector3Value } from '../game/character/playerMotor'

/** Fixed high-oblique offset from the follow look target (presentation-only). */
export const FOLLOW_CAMERA_OFFSET: Vector3Value = Object.freeze({
  x: 7.35,
  y: 9.05,
  z: 7.35,
})

/**
 * Meters of look-target bias along player facing. Favors the progression side of
 * the frame without introducing lock-on or per-room camera rails.
 */
export const FOLLOW_LOOK_AHEAD_METERS = 1.15

/**
 * Exponential follow rate (higher = snappier). Restored to the first
 * Playwright-verified value after PO lag/snappiness tuning.
 */
export const FOLLOW_DAMPING = 12

export const FOLLOW_CAMERA_MODE = 'high-oblique-follow' as const

export interface FollowCameraPose {
  readonly position: Vector3Value
  readonly lookAt: Vector3Value
}

export interface CameraFacingHint {
  readonly x: number
  readonly z: number
}

export interface CameraDiagnostic {
  readonly mode: typeof FOLLOW_CAMERA_MODE
  readonly followLookAt: Vector3Value
  readonly cameraPosition: Vector3Value
}

/**
 * Look slightly below capsule center, with optional facing look-ahead so
 * traversable space ahead of the player claims more of the gameplay frame.
 */
export function computeFollowLookAt(
  playerPosition: Vector3Value,
  facing: CameraFacingHint | null = null,
  lookAheadMeters: number = FOLLOW_LOOK_AHEAD_METERS,
): Vector3Value {
  const length =
    facing === null ? 0 : Math.hypot(facing.x, facing.z)
  const scale = length > 1e-6 ? lookAheadMeters / length : 0
  return {
    x: playerPosition.x + (facing === null ? 0 : facing.x * scale),
    y: playerPosition.y - 0.15,
    z: playerPosition.z + (facing === null ? 0 : facing.z * scale),
  }
}

export function computeDesiredCameraPosition(lookAt: Vector3Value): Vector3Value {
  return {
    x: lookAt.x + FOLLOW_CAMERA_OFFSET.x,
    y: lookAt.y + FOLLOW_CAMERA_OFFSET.y,
    z: lookAt.z + FOLLOW_CAMERA_OFFSET.z,
  }
}

/** Frame-rate independent exponential approach of `current` toward `target`. */
export function dampScalar(
  current: number,
  target: number,
  damping: number,
  deltaSeconds: number,
): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return current
  }
  if (!Number.isFinite(damping) || damping <= 0) {
    return target
  }
  const alpha = 1 - Math.exp(-damping * deltaSeconds)
  return current + (target - current) * alpha
}

export function dampVector3(
  current: Vector3Value,
  target: Vector3Value,
  damping: number,
  deltaSeconds: number,
): Vector3Value {
  return {
    x: dampScalar(current.x, target.x, damping, deltaSeconds),
    y: dampScalar(current.y, target.y, damping, deltaSeconds),
    z: dampScalar(current.z, target.z, damping, deltaSeconds),
  }
}

/**
 * Damp the look target toward the player, then place the camera at a fixed
 * high-oblique offset. Orientation stays locked; only follow lag is smoothed.
 */
export function stepFollowCamera(
  current: FollowCameraPose,
  playerPosition: Vector3Value,
  deltaSeconds: number,
  damping: number = FOLLOW_DAMPING,
  facing: CameraFacingHint | null = null,
): FollowCameraPose {
  const lookAt = dampVector3(
    current.lookAt,
    computeFollowLookAt(playerPosition, facing),
    damping,
    deltaSeconds,
  )

  return {
    lookAt,
    position: computeDesiredCameraPosition(lookAt),
  }
}

export function createInitialFollowCameraPose(
  playerPosition: Vector3Value,
  facing: CameraFacingHint | null = null,
): FollowCameraPose {
  const lookAt = computeFollowLookAt(playerPosition, facing)
  return {
    lookAt,
    position: computeDesiredCameraPosition(lookAt),
  }
}
