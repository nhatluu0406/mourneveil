import { describe, expect, it } from 'vitest'
import type { ConnectedLevelBoxCollider } from '../physics/connectedLevelCollision'
import {
  computePlayerWeaponWallScale,
  PLAYER_WEAPON_BLADE_LENGTH,
  PLAYER_WEAPON_HILT_LOCAL,
  PLAYER_WEAPON_WALL_MARGIN,
} from './playerWeaponWallConstraint'

const wall = (
  position: readonly [number, number, number],
  size: readonly [number, number, number],
): ConnectedLevelBoxCollider => ({ id: 'wall.test', kind: 'wall', position, size })

const base = {
  playerPosition: { x: 0, z: 0 },
  facing: { x: 0, z: -1 },
  sweepYawRadians: 0,
  bladeCenterForwardOffset: -0.62,
}

describe('player weapon wall constraint', () => {
  it('leaves the render blade at full length in open space', () => {
    expect(computePlayerWeaponWallScale({ ...base, solids: [] })).toBe(1)
  })

  it('retracts the visible blade before a front wall without changing authored reach', () => {
    const scale = computePlayerWeaponWallScale({
      ...base,
      solids: [wall([0, 0.75, -0.8], [2, 1.5, 0.2])],
    })
    expect(scale).toBeGreaterThan(0.08)
    expect(scale).toBeLessThan(1)
    const fullForwardLength =
      PLAYER_WEAPON_HILT_LOCAL.z -
      (base.bladeCenterForwardOffset - PLAYER_WEAPON_BLADE_LENGTH / 2)
    expect(fullForwardLength * scale + PLAYER_WEAPON_WALL_MARGIN).toBeLessThan(0.5)
  })

  it('handles cardinal wall orientations and attack sweep yaw', () => {
    const eastScale = computePlayerWeaponWallScale({
      ...base,
      facing: { x: 1, z: 0 },
      solids: [wall([0.8, 0.75, 0], [0.2, 1.5, 2])],
    })
    const sweptScale = computePlayerWeaponWallScale({
      ...base,
      sweepYawRadians: Math.PI / 2,
      solids: [wall([-0.8, 0.75, 0], [0.2, 1.5, 2])],
    })
    expect(eastScale).toBeLessThan(1)
    expect(sweptScale).toBeLessThan(1)
  })

  it('ignores floors and returns a finite scale at degenerate reach', () => {
    const floor: ConnectedLevelBoxCollider = {
      id: 'floor',
      kind: 'floor',
      position: [0, -0.25, 0],
      size: [5, 0.5, 5],
    }
    expect(computePlayerWeaponWallScale({ ...base, solids: [floor] })).toBe(1)
    expect(
      computePlayerWeaponWallScale({
        ...base,
        bladeCenterForwardOffset:
          PLAYER_WEAPON_HILT_LOCAL.z + PLAYER_WEAPON_BLADE_LENGTH / 2,
        solids: [wall([0, 0.75, -0.8], [2, 1.5, 0.2])],
      }),
    ).toBe(1)
  })
})
