import type { Vector3Value } from '../game/character/playerMotor'

export const FOLLOW_CAMERA_PROFILE_IDS = ['current', 'closer-tactical'] as const
export type FollowCameraProfileId = (typeof FOLLOW_CAMERA_PROFILE_IDS)[number]

export interface FollowCameraProfile {
  readonly id: FollowCameraProfileId
  readonly offset: Vector3Value
  readonly lookAheadMeters: number
  readonly fov: number
  readonly damping: number
  readonly lookAheadDamping: number
  readonly holdRadiusMeters: number
  readonly holdReleaseMeters: number
}

/** Baseline M14 framing — kept for same-build A/B (`?m15Baseline=1`). */
export const FOLLOW_CAMERA_PROFILE_CURRENT: FollowCameraProfile = Object.freeze({
  id: 'current',
  offset: Object.freeze({ x: 7.35, y: 9.05, z: 7.35 }),
  lookAheadMeters: 0.85,
  fov: 40,
  damping: 10,
  lookAheadDamping: 3.5,
  holdRadiusMeters: 0,
  holdReleaseMeters: 0,
})

/**
 * Selected M15 profile: ~20% closer planar/oblique distance, slightly tighter FOV,
 * soft hold so idle/micro-moves do not hunt. Not a Vesperfall copy.
 */
export const FOLLOW_CAMERA_PROFILE_CLOSER_TACTICAL: FollowCameraProfile = Object.freeze({
  id: 'closer-tactical',
  offset: Object.freeze({ x: 6.15, y: 7.55, z: 6.15 }),
  lookAheadMeters: 0.5,
  fov: 38,
  damping: 8,
  lookAheadDamping: 3.2,
  holdRadiusMeters: 0.28,
  holdReleaseMeters: 0.48,
})

export const FOLLOW_CAMERA_PROFILES: Readonly<Record<FollowCameraProfileId, FollowCameraProfile>> =
  Object.freeze({
    current: FOLLOW_CAMERA_PROFILE_CURRENT,
    'closer-tactical': FOLLOW_CAMERA_PROFILE_CLOSER_TACTICAL,
  })

export const DEFAULT_FOLLOW_CAMERA_PROFILE_ID: FollowCameraProfileId = 'closer-tactical'

let activeProfileId: FollowCameraProfileId = DEFAULT_FOLLOW_CAMERA_PROFILE_ID

export function setFollowCameraProfile(id: FollowCameraProfileId): FollowCameraProfile {
  activeProfileId = id
  return FOLLOW_CAMERA_PROFILES[id]
}

export function getFollowCameraProfile(): FollowCameraProfile {
  return FOLLOW_CAMERA_PROFILES[activeProfileId]
}

export function resolveFollowCameraProfileId(
  search: string,
  baseline: boolean,
): FollowCameraProfileId {
  if (baseline) return 'current'
  const requested = new URLSearchParams(search.startsWith('?') ? search : `?${search}`).get(
    'cameraProfile',
  )
  if (requested === 'current' || requested === 'closer-tactical') return requested
  return DEFAULT_FOLLOW_CAMERA_PROFILE_ID
}
