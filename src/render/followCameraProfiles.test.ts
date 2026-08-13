import { describe, expect, it } from 'vitest'
import {
  FOLLOW_CAMERA_PROFILES,
  resolveFollowCameraProfileId,
  setFollowCameraProfile,
} from './followCameraProfiles'
import { FOLLOW_CAMERA_OFFSET, computeDesiredCameraPosition } from './followCamera'

describe('follow camera profiles', () => {
  it('selects closer-tactical by default and current for the baseline flag', () => {
    expect(resolveFollowCameraProfileId('', false)).toBe('closer-tactical')
    expect(resolveFollowCameraProfileId('?cameraProfile=current', false)).toBe('current')
    expect(resolveFollowCameraProfileId('?cameraProfile=closer-tactical', true)).toBe('current')
  })

  it('keeps the selected profile offset on the camera boom', () => {
    setFollowCameraProfile('closer-tactical')
    const lookAt = { x: 0, y: 0.67, z: 0 }
    expect(computeDesiredCameraPosition(lookAt)).toEqual({
      x: lookAt.x + FOLLOW_CAMERA_OFFSET.x,
      y: lookAt.y + FOLLOW_CAMERA_OFFSET.y,
      z: lookAt.z + FOLLOW_CAMERA_OFFSET.z,
    })
    expect(FOLLOW_CAMERA_PROFILES.current.fov).toBe(40)
    expect(FOLLOW_CAMERA_PROFILES['closer-tactical'].fov).toBe(38)
    setFollowCameraProfile('closer-tactical')
  })
})
