import { describe, expect, it } from 'vitest'
import { combatContactCueLayout, shouldShowCombatContactDebug } from './combatContactCueLayout'

describe('combatContactCueLayout', () => {
  it('keeps developer contact geometry opt-in', () => {
    expect(shouldShowCombatContactDebug('', true)).toBe(false)
    expect(shouldShowCombatContactDebug('?debugContacts=1', true)).toBe(true)
    expect(shouldShowCombatContactDebug('?debugContacts=1', false)).toBe(false)
  })
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
