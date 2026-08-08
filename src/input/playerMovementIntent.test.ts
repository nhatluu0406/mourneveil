import { describe, expect, it } from 'vitest'
import {
  createMovementInputState,
  resetMovementInputState,
  setMovementDirection,
  toPlayerMovementIntent,
} from './playerMovementIntent'

describe('player movement intent', () => {
  it('keeps neutral input neutral', () => {
    expect(toPlayerMovementIntent(createMovementInputState())).toEqual({
      horizontal: 0,
      forward: 0,
    })
  })

  it('keeps one-axis input at unit magnitude', () => {
    const state = setMovementDirection(createMovementInputState(), 'right', true)

    expect(toPlayerMovementIntent(state)).toEqual({ horizontal: 1, forward: 0 })
  })

  it('normalizes diagonal movement to the maximum unit magnitude', () => {
    const right = setMovementDirection(createMovementInputState(), 'right', true)
    const diagonal = setMovementDirection(right, 'forward', true)
    const intent = toPlayerMovementIntent(diagonal)

    expect(Math.hypot(intent.horizontal, intent.forward)).toBeCloseTo(1)
    expect(intent.horizontal).toBeCloseTo(Math.SQRT1_2)
    expect(intent.forward).toBeCloseTo(Math.SQRT1_2)
  })

  it('cancels simultaneous opposite directions', () => {
    let state = createMovementInputState()
    state = setMovementDirection(state, 'left', true)
    state = setMovementDirection(state, 'right', true)
    state = setMovementDirection(state, 'forward', true)
    state = setMovementDirection(state, 'backward', true)

    expect(toPlayerMovementIntent(state)).toEqual({ horizontal: 0, forward: 0 })
  })

  it('resets held input to neutral', () => {
    const held = setMovementDirection(createMovementInputState(), 'forward', true)

    expect(toPlayerMovementIntent(resetMovementInputState(held))).toEqual({
      horizontal: 0,
      forward: 0,
    })
    expect(toPlayerMovementIntent(held).forward).toBe(1)
  })
})
