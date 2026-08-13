import { describe, expect, it } from 'vitest'
import {
  FOLLOW_CAMERA_OFFSET,
  FOLLOW_LOOK_AHEAD_METERS,
  LOOK_AHEAD_DAMPING,
  computeDesiredCameraPosition,
  computeFollowLookAt,
  createInitialFollowCameraState,
  dampLookAheadDirection,
  dampScalar,
  resolveLookAheadDesire,
  stepFollowCamera,
} from './followCamera'

describe('followCamera', () => {
  it('keeps a fixed high-oblique offset from the look target', () => {
    const player = { x: 2, y: 0.82, z: -1 }
    const lookAt = computeFollowLookAt(player, { x: 0, z: -1 })
    const position = computeDesiredCameraPosition(lookAt)

    expect(lookAt.x).toBeCloseTo(2, 8)
    expect(lookAt.y).toBeCloseTo(0.67, 8)
    expect(lookAt.z).toBeCloseTo(-1 - FOLLOW_LOOK_AHEAD_METERS, 8)
    expect(position).toEqual({
      x: lookAt.x + FOLLOW_CAMERA_OFFSET.x,
      y: lookAt.y + FOLLOW_CAMERA_OFFSET.y,
      z: lookAt.z + FOLLOW_CAMERA_OFFSET.z,
    })
  })

  it('biases the look target along a provided look-ahead direction', () => {
    const player = { x: 0, y: 0.82, z: 0 }
    const lookAt = computeFollowLookAt(player, { x: 0, z: 1 })
    expect(lookAt.x).toBeCloseTo(0, 8)
    expect(lookAt.z).toBeCloseTo(FOLLOW_LOOK_AHEAD_METERS, 8)
  })

  it('damps toward the target without overshooting on typical frame deltas', () => {
    expect(dampScalar(0, 10, 12, 1 / 60)).toBeGreaterThan(0)
    expect(dampScalar(0, 10, 12, 1 / 60)).toBeLessThan(10)
    expect(dampScalar(5, 5, 12, 1 / 60)).toBe(5)
  })

  it('steers look-ahead from planar velocity and ignores idle facing flips', () => {
    const previous = { x: 0, y: 0.82, z: 0 }
    const moving = { x: 0.2, y: 0.82, z: 0 }
    const current = { x: 0, z: -1 }
    const fromMotion = resolveLookAheadDesire(previous, moving, { x: 0, z: 1 }, current, 1 / 60)
    expect(fromMotion.x).toBeGreaterThan(0.9)
    expect(Math.abs(fromMotion.z)).toBeLessThan(0.2)

    const idle = resolveLookAheadDesire(moving, moving, { x: 1, z: 0 }, current, 1 / 60)
    expect(idle).toEqual(current)
  })

  it('damps look-ahead direction instead of snapping on reverse', () => {
    const current = { x: 1, z: 0 }
    const desired = { x: -1, z: 0 }
    const next = dampLookAheadDirection(current, desired, LOOK_AHEAD_DAMPING, 1 / 60)
    expect(next.x).toBeGreaterThan(-1)
    expect(next.x).toBeLessThan(1)
    expect(next.x).toBeLessThan(current.x)
  })

  it('follows the player with lag while preserving the rigid isometric offset', () => {
    const player = { x: 0, y: 0.82, z: 0 }
    const initial = createInitialFollowCameraState(player, { x: 0, z: -1 })
    const movedPlayer = { x: 3, y: 0.82, z: -2 }
    const next = stepFollowCamera(initial, movedPlayer, 1 / 60, { x: 1, z: 0 })

    expect(next.pose.lookAt.x).toBeGreaterThan(initial.pose.lookAt.x)
    expect(next.pose.lookAt.x).toBeLessThan(movedPlayer.x + 1)
    expect(next.pose.position.x - next.pose.lookAt.x).toBeCloseTo(FOLLOW_CAMERA_OFFSET.x, 8)
    expect(next.pose.position.y - next.pose.lookAt.y).toBeCloseTo(FOLLOW_CAMERA_OFFSET.y, 8)
    expect(next.pose.position.z - next.pose.lookAt.z).toBeCloseTo(FOLLOW_CAMERA_OFFSET.z, 8)
  })

  it('does not reverse look-ahead within one frame when facing flips while nearly still', () => {
    const player = { x: 1, y: 0.82, z: 1 }
    let state = createInitialFollowCameraState(player, { x: 1, z: 0 })
    state = stepFollowCamera(state, { x: 1.001, y: 0.82, z: 1 }, 1 / 60, { x: -1, z: 0 })
    expect(state.lookAheadDir.x).toBeGreaterThan(0.5)
  })

  it('holds lookAt xz for sub-threshold player motion', () => {
    const player = { x: 0, y: 0.82, z: 0 }
    let state = createInitialFollowCameraState(player, { x: 0, z: -1 })
    const heldLookAt = { ...state.pose.lookAt }
    state = stepFollowCamera(state, { x: 0.04, y: 0.82, z: 0 }, 1 / 60, { x: 0, z: -1 })
    expect(state.holdActive).toBe(true)
    expect(state.pose.lookAt.x).toBeCloseTo(heldLookAt.x, 3)
    expect(state.pose.lookAt.z).toBeCloseTo(heldLookAt.z, 3)
  })
})
