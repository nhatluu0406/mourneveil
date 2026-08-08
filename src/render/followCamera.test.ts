import { describe, expect, it } from 'vitest'
import {
  FOLLOW_CAMERA_OFFSET,
  computeDesiredCameraPosition,
  computeFollowLookAt,
  createInitialFollowCameraPose,
  dampScalar,
  stepFollowCamera,
} from './followCamera'

describe('followCamera', () => {
  it('keeps a fixed high-oblique offset from the look target', () => {
    const player = { x: 2, y: 0.82, z: -1 }
    const lookAt = computeFollowLookAt(player)
    const position = computeDesiredCameraPosition(lookAt)

    expect(lookAt.x).toBe(2)
    expect(lookAt.y).toBeCloseTo(0.67, 8)
    expect(lookAt.z).toBe(-1)
    expect(position).toEqual({
      x: lookAt.x + FOLLOW_CAMERA_OFFSET.x,
      y: lookAt.y + FOLLOW_CAMERA_OFFSET.y,
      z: lookAt.z + FOLLOW_CAMERA_OFFSET.z,
    })
  })

  it('damps toward the target without overshooting on typical frame deltas', () => {
    expect(dampScalar(0, 10, 12, 1 / 60)).toBeGreaterThan(0)
    expect(dampScalar(0, 10, 12, 1 / 60)).toBeLessThan(10)
    expect(dampScalar(5, 5, 12, 1 / 60)).toBe(5)
  })

  it('follows the player with lag while preserving the rigid isometric offset', () => {
    const player = { x: 0, y: 0.82, z: 0 }
    const initial = createInitialFollowCameraPose(player)
    const movedPlayer = { x: 3, y: 0.82, z: -2 }
    const next = stepFollowCamera(initial, movedPlayer, 1 / 60)

    expect(next.lookAt.x).toBeGreaterThan(initial.lookAt.x)
    expect(next.lookAt.x).toBeLessThan(movedPlayer.x)
    expect(next.position.x - next.lookAt.x).toBeCloseTo(FOLLOW_CAMERA_OFFSET.x, 8)
    expect(next.position.y - next.lookAt.y).toBeCloseTo(FOLLOW_CAMERA_OFFSET.y, 8)
    expect(next.position.z - next.lookAt.z).toBeCloseTo(FOLLOW_CAMERA_OFFSET.z, 8)
  })
})
