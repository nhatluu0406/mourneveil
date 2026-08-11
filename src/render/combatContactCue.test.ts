import { describe, expect, it } from 'vitest'
import { combatContactCueLayout } from './combatContactCueLayout'

describe('combatContactCueLayout', () => {
  it('keeps the cue slightly above actor origin for floor-safe readability', () => {
    expect(combatContactCueLayout(0.82, 0.52)).toEqual({
      localY: 0.18,
      forwardOffset: 0.82,
      radius: 0.52,
    })
  })

  it('rejects non-positive dimensions', () => {
    expect(() => combatContactCueLayout(0, 0.5)).toThrow(/forwardOffset/)
    expect(() => combatContactCueLayout(0.8, -1)).toThrow(/radius/)
  })
})
