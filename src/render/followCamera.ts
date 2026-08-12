import type { Vector3Value } from '../game/character/playerMotor'

/** Fixed high-oblique offset from the follow look target (presentation-only). */
export const FOLLOW_CAMERA_OFFSET: Vector3Value = Object.freeze({
  x: 7.35,
  y: 9.05,
  z: 7.35,
})

/**
 * Meters of look-target bias along a *damped* look-ahead direction.
 * Favor progression without yanking on discrete facing flips.
 */
export const FOLLOW_LOOK_AHEAD_METERS = 0.85

/** Exponential follow rate for the look target (higher = snappier). */
export const FOLLOW_DAMPING = 10

/** Slower rate for look-ahead direction so facing flips do not hunt. */
export const LOOK_AHEAD_DAMPING = 3.5

/** Ignore look-ahead steering below this planar speed (m/s), estimated from position delta. */
export const LOOK_AHEAD_SPEED_DEADZONE = 0.35

/** Ignore tiny direction changes (dot product above this keeps current look-ahead). */
export const LOOK_AHEAD_DIR_DEADZONE = 0.985

export const FOLLOW_CAMERA_MODE = 'high-oblique-follow' as const

export interface FollowCameraPose {
  readonly position: Vector3Value
  readonly lookAt: Vector3Value
}

export interface CameraFacingHint {
  readonly x: number
  readonly z: number
}

export interface FollowCameraState {
  readonly pose: FollowCameraPose
  /** Unit XZ look-ahead direction (damped). */
  readonly lookAheadDir: CameraFacingHint
  readonly previousPlayerPosition: Vector3Value
}

export interface CameraDiagnostic {
  readonly mode: typeof FOLLOW_CAMERA_MODE
  readonly followLookAt: Vector3Value
  readonly cameraPosition: Vector3Value
  readonly lookAheadDir: CameraFacingHint
}

function normalizeXZ(x: number, z: number): CameraFacingHint | null {
  const length = Math.hypot(x, z)
  if (length < 1e-6) return null
  return { x: x / length, z: z / length }
}

export function computeFollowLookAt(
  playerPosition: Vector3Value,
  lookAheadDir: CameraFacingHint | null = null,
  lookAheadMeters: number = FOLLOW_LOOK_AHEAD_METERS,
): Vector3Value {
  return {
    x: playerPosition.x + (lookAheadDir === null ? 0 : lookAheadDir.x * lookAheadMeters),
    y: playerPosition.y - 0.15,
    z: playerPosition.z + (lookAheadDir === null ? 0 : lookAheadDir.z * lookAheadMeters),
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
  const t = 1 - Math.exp(-damping * Math.max(0, deltaSeconds))
  return current + (target - current) * t
}

/**
 * Angle-lerp look-ahead on XZ. Vector lerp + renormalize collapses on reverses;
 * spherical-style blend keeps direction continuous.
 */
export function dampLookAheadDirection(
  current: CameraFacingHint,
  desired: CameraFacingHint,
  damping: number,
  deltaSeconds: number,
): CameraFacingHint {
  const dot = Math.max(-1, Math.min(1, current.x * desired.x + current.z * desired.z))
  if (dot > LOOK_AHEAD_DIR_DEADZONE) return current
  const t = 1 - Math.exp(-damping * Math.max(0, deltaSeconds))
  const blend = Math.min(1, t)
  // Near-opposite directions: sin(angle)≈0 — fall back to perpendicular blend axis.
  if (dot <= -0.999) {
    const perp = normalizeXZ(-current.z, current.x) ?? { x: 0, z: 1 }
    const mid = normalizeXZ(
      current.x * (1 - blend) + perp.x * blend,
      current.z * (1 - blend) + perp.z * blend,
    )
    return mid ?? desired
  }
  const angle = Math.acos(dot)
  if (angle < 1e-5) return desired
  const sin = Math.sin(angle)
  const a = Math.sin((1 - blend) * angle) / sin
  const b = Math.sin(blend * angle) / sin
  return normalizeXZ(current.x * a + desired.x * b, current.z * a + desired.z * b) ?? desired
}

/**
 * Prefer planar motion for look-ahead. When nearly idle, keep the prior direction
 * so discrete facing flips (attack / wall-slide) do not yank the camera.
 */
export function resolveLookAheadDesire(
  previousPlayerPosition: Vector3Value,
  playerPosition: Vector3Value,
  facing: CameraFacingHint,
  currentLookAhead: CameraFacingHint,
  deltaSeconds: number,
): CameraFacingHint {
  const dt = Math.max(1e-4, deltaSeconds)
  const vx = (playerPosition.x - previousPlayerPosition.x) / dt
  const vz = (playerPosition.z - previousPlayerPosition.z) / dt
  const speed = Math.hypot(vx, vz)
  if (speed >= LOOK_AHEAD_SPEED_DEADZONE) {
    return normalizeXZ(vx, vz) ?? currentLookAhead
  }
  void facing
  return currentLookAhead
}

export function createInitialFollowCameraState(
  playerPosition: Vector3Value,
  facing: CameraFacingHint = { x: 0, z: -1 },
): FollowCameraState {
  const lookAheadDir = normalizeXZ(facing.x, facing.z) ?? { x: 0, z: -1 }
  const lookAt = computeFollowLookAt(playerPosition, lookAheadDir)
  return {
    pose: {
      lookAt,
      position: computeDesiredCameraPosition(lookAt),
    },
    lookAheadDir,
    previousPlayerPosition: { ...playerPosition },
  }
}

export function stepFollowCamera(
  previous: FollowCameraState,
  playerPosition: Vector3Value,
  deltaSeconds: number,
  facing: CameraFacingHint = previous.lookAheadDir,
): FollowCameraState {
  const desiredDir = resolveLookAheadDesire(
    previous.previousPlayerPosition,
    playerPosition,
    facing,
    previous.lookAheadDir,
    deltaSeconds,
  )
  const lookAheadDir = dampLookAheadDirection(
    previous.lookAheadDir,
    desiredDir,
    LOOK_AHEAD_DAMPING,
    deltaSeconds,
  )
  const desiredLookAt = computeFollowLookAt(playerPosition, lookAheadDir)
  const lookAt = {
    x: dampScalar(previous.pose.lookAt.x, desiredLookAt.x, FOLLOW_DAMPING, deltaSeconds),
    y: dampScalar(previous.pose.lookAt.y, desiredLookAt.y, FOLLOW_DAMPING, deltaSeconds),
    z: dampScalar(previous.pose.lookAt.z, desiredLookAt.z, FOLLOW_DAMPING, deltaSeconds),
  }
  return {
    pose: {
      lookAt,
      position: computeDesiredCameraPosition(lookAt),
    },
    lookAheadDir,
    previousPlayerPosition: { ...playerPosition },
  }
}
