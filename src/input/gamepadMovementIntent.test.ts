import { describe, expect, it } from 'vitest'
import { composeMovementIntents } from './composeMovementIntents'
import {
  GAMEPAD_LEFT_STICK_DEAD_ZONE,
  isNeutralMovementIntent,
  leftStickAxesToMovementIntent,
} from './gamepadMovementIntent'

describe('leftStickAxesToMovementIntent', () => {
  it('returns neutral inside the dead zone and when a pad is unavailable', () => {
    expect(leftStickAxesToMovementIntent(0, 0)).toEqual({
      horizontal: 0,
      forward: 0,
    })
    expect(
      leftStickAxesToMovementIntent(
        GAMEPAD_LEFT_STICK_DEAD_ZONE * 0.5,
        0,
      ),
    ).toEqual({ horizontal: 0, forward: 0 })
    expect(leftStickAxesToMovementIntent(Number.NaN, 0)).toEqual({
      horizontal: 0,
      forward: 0,
    })
  })

  it('maps a full cardinal left-stick deflection to unit intent', () => {
    expect(leftStickAxesToMovementIntent(1, 0)).toEqual({
      horizontal: 1,
      forward: 0,
    })
    expect(leftStickAxesToMovementIntent(0, -1).forward).toBeCloseTo(1)
    expect(leftStickAxesToMovementIntent(0, 1).forward).toBeCloseTo(-1)
  })

  it('normalizes diagonal stick input to magnitude ≤ 1', () => {
    const intent = leftStickAxesToMovementIntent(1, -1)
    expect(Math.hypot(intent.horizontal, intent.forward)).toBeCloseTo(1)
    expect(intent.horizontal).toBeCloseTo(Math.SQRT1_2)
    expect(intent.forward).toBeCloseTo(Math.SQRT1_2)
  })
})

describe('composeMovementIntents', () => {
  it('keeps keyboard-only behavior unchanged', () => {
    const composed = composeMovementIntents(
      { horizontal: Math.SQRT1_2, forward: Math.SQRT1_2 },
      { horizontal: 0, forward: 0 },
    )
    expect(composed.source).toBe('keyboard')
    expect(Math.hypot(composed.intent.horizontal, composed.intent.forward)).toBeCloseTo(1)
  })

  it('uses gamepad when keyboard is neutral', () => {
    const composed = composeMovementIntents(
      { horizontal: 0, forward: 0 },
      { horizontal: 1, forward: 0 },
    )
    expect(composed.source).toBe('gamepad')
    expect(composed.intent).toEqual({ horizontal: 1, forward: 0 })
  })

  it('sums both sources then clamps magnitude to 1', () => {
    const composed = composeMovementIntents(
      { horizontal: 1, forward: 0 },
      { horizontal: 1, forward: 0 },
    )
    expect(composed.source).toBe('combined')
    expect(composed.intent).toEqual({ horizontal: 1, forward: 0 })
    expect(isNeutralMovementIntent(composed.intent)).toBe(false)
  })
})
