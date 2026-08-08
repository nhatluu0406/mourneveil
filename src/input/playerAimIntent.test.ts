import { describe, expect, it } from 'vitest'
import { worldAimPointToDirection } from './playerAimIntent'

describe('worldAimPointToDirection', () => {
  it('normalizes a world-space game-plane direction', () => {
    expect(
      worldAimPointToDirection(
        { x: 2, y: 1, z: 3 },
        { x: 5, y: 0, z: 7 },
      ),
    ).toEqual({ x: 0.6, z: 0.8 })
  })

  it('ignores vertical displacement and rejects a degenerate aim', () => {
    expect(
      worldAimPointToDirection(
        { x: 1, y: 0, z: 1 },
        { x: 1, y: 20, z: 1 },
      ),
    ).toBeNull()
  })
})
