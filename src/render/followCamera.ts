import type { Vector3Value } from '../game/character/playerMotor'
import {
  getFollowCameraProfile,
  type FollowCameraProfile,
} from './followCameraProfiles'

export {
  DEFAULT_FOLLOW_CAMERA_PROFILE_ID,
  FOLLOW_CAMERA_PROFILE_CLOSER_TACTICAL,
  FOLLOW_CAMERA_PROFILE_CURRENT,
  FOLLOW_CAMERA_PROFILES,
  getFollowCameraProfile,
  resolveFollowCameraProfileId,
  setFollowCameraProfile,
} from './followCameraProfiles'

/** Active profile offset — tests pin the selected M15 closer-tactical framing. */
export const FOLLOW_CAMERA_OFFSET: Vector3Value = Object.freeze({
  x: 6.15,
  y: 7.55,
  z: 6.15,
})

export const FOLLOW_LOOK_AHEAD_METERS = 0.5
export const FOLLOW_DAMPING = 8
export const LOOK_AHEAD_DAMPING = 3.2
export const LOOK_AHEAD_SPEED_DEADZONE = 0.35
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
  readonly lookAheadDir: CameraFacingHint
  readonly previousPlayerPosition: Vector3Value
  readonly holdActive: boolean
}

export interface CameraDiagnostic {
  readonly mode: typeof FOLLOW_CAMERA_MODE
  readonly profileId: string
  readonly followLookAt: Vector3Value
  readonly cameraPosition: Vector3Value
  readonly lookAheadDir: CameraFacingHint
  readonly impulseMeters: number
  readonly holdActive: boolean
}

function normalizeXZ(x: number, z: number): CameraFacingHint | null {
  const length = Math.hypot(x, z)
  if (length < 1e-6) return null
  return { x: x / length, z: z / length }
}

export function computeFollowLookAt(
  playerPosition: Vector3Value,
  lookAheadDir: CameraFacingHint | null = null,
  lookAheadMeters: number = getFollowCameraProfile().lookAheadMeters,
): Vector3Value {
  return {
    x: playerPosition.x + (lookAheadDir === null ? 0 : lookAheadDir.x * lookAheadMeters),
    y: playerPosition.y - 0.15,
    z: playerPosition.z + (lookAheadDir === null ? 0 : lookAheadDir.z * lookAheadMeters),
  }
}

export function computeDesiredCameraPosition(
  lookAt: Vector3Value,
  offset: Vector3Value = getFollowCameraProfile().offset,
): Vector3Value {
  return {
    x: lookAt.x + offset.x,
    y: lookAt.y + offset.y,
    z: lookAt.z + offset.z,
  }
}

export function dampScalar(
  current: number,
  target: number,
  damping: number,
  deltaSeconds: number,
): number {
  const t = 1 - Math.exp(-damping * Math.max(0, deltaSeconds))
  return current + (target - current) * t
}

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

function planarDistance(a: Vector3Value, b: Vector3Value): number {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

function applyLookAtHold(
  currentLookAt: Vector3Value,
  desiredLookAt: Vector3Value,
  holdActive: boolean,
  profile: FollowCameraProfile,
): { readonly lookAt: Vector3Value; readonly holdActive: boolean } {
  const error = planarDistance(currentLookAt, desiredLookAt)
  if (profile.holdReleaseMeters <= 0) {
    return { lookAt: desiredLookAt, holdActive: false }
  }
  if (holdActive) {
    if (error < profile.holdReleaseMeters) {
      return {
        lookAt: { x: currentLookAt.x, y: desiredLookAt.y, z: currentLookAt.z },
        holdActive: true,
      }
    }
    return { lookAt: desiredLookAt, holdActive: false }
  }
  if (error <= profile.holdRadiusMeters) {
    return {
      lookAt: { x: currentLookAt.x, y: desiredLookAt.y, z: currentLookAt.z },
      holdActive: true,
    }
  }
  return { lookAt: desiredLookAt, holdActive: false }
}

export function createInitialFollowCameraState(
  playerPosition: Vector3Value,
  facing: CameraFacingHint = { x: 0, z: -1 },
): FollowCameraState {
  const profile = getFollowCameraProfile()
  const lookAheadDir = normalizeXZ(facing.x, facing.z) ?? { x: 0, z: -1 }
  const lookAt = computeFollowLookAt(playerPosition, lookAheadDir, profile.lookAheadMeters)
  return {
    pose: {
      lookAt,
      position: computeDesiredCameraPosition(lookAt, profile.offset),
    },
    lookAheadDir,
    previousPlayerPosition: { ...playerPosition },
    holdActive: true,
  }
}

export function stepFollowCamera(
  previous: FollowCameraState,
  playerPosition: Vector3Value,
  deltaSeconds: number,
  facing: CameraFacingHint = previous.lookAheadDir,
): FollowCameraState {
  const profile = getFollowCameraProfile()
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
    profile.lookAheadDamping,
    deltaSeconds,
  )
  const rawDesiredLookAt = computeFollowLookAt(
    playerPosition,
    lookAheadDir,
    profile.lookAheadMeters,
  )
  const held = applyLookAtHold(
    previous.pose.lookAt,
    rawDesiredLookAt,
    previous.holdActive,
    profile,
  )
  const lookAt = {
    x: dampScalar(previous.pose.lookAt.x, held.lookAt.x, profile.damping, deltaSeconds),
    y: dampScalar(previous.pose.lookAt.y, held.lookAt.y, profile.damping, deltaSeconds),
    z: dampScalar(previous.pose.lookAt.z, held.lookAt.z, profile.damping, deltaSeconds),
  }
  return {
    pose: {
      lookAt,
      position: computeDesiredCameraPosition(lookAt, profile.offset),
    },
    lookAheadDir,
    previousPlayerPosition: { ...playerPosition },
    holdActive: held.holdActive,
  }
}
