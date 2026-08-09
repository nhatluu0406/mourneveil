import { describe, expect, it } from 'vitest'
import { resolveConnectedRecoveryPosition } from './connectedRecoveryPlacement'

describe('connected-level Echo recovery placement', () => {
  it('preserves a valid collision-resolved death position', () => {
    expect(resolveConnectedRecoveryPosition({ x: 1, y: 0.7, z: -4 })).toEqual({
      x: 1,
      y: 0.82,
      z: -4,
    })
  })

  it('clamps an unsafe out-of-level position to an authored zone interior', () => {
    const safe = resolveConnectedRecoveryPosition({ x: 100, y: -20, z: 100 })
    expect(safe).toEqual({ x: 15.55, y: 0.82, z: -0.45 })
  })
})
