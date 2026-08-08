import { describe, expect, it, vi } from 'vitest'
import {
  FIXED_STEP_SECONDS,
  FixedStepClock,
  MAX_CATCH_UP_STEPS,
} from './fixedStepClock'

function advancePattern(frameDeltas: readonly number[]): FixedStepClock {
  const clock = new FixedStepClock()
  for (const frameDelta of frameDeltas) {
    clock.advance(frameDelta, () => undefined)
  }
  return clock
}

describe('FixedStepClock', () => {
  it('produces equivalent authority from different render-delta patterns', () => {
    const manySmallFrames = advancePattern(Array.from({ length: 120 }, () => 1 / 120))
    const fewerLargeFrames = advancePattern(Array.from({ length: 30 }, () => 1 / 30))

    expect(manySmallFrames.snapshot()).toEqual(fewerLargeFrames.snapshot())
    expect(manySmallFrames.snapshot()).toMatchObject({
      stepCount: 60,
      simulationTimeSeconds: 1,
      accumulatorSeconds: 0,
    })
  })

  it('bounds catch-up after a long frame gap', () => {
    const clock = new FixedStepClock()
    const simulateStep = vi.fn()

    const result = clock.advance(10, simulateStep)

    expect(result.stepsExecuted).toBe(MAX_CATCH_UP_STEPS)
    expect(result.stepCount).toBe(MAX_CATCH_UP_STEPS)
    expect(result.acceptedFrameDeltaSeconds).toBe(0.25)
    expect(result.discardedTimeSeconds).toBeCloseTo(
      10 - MAX_CATCH_UP_STEPS * FIXED_STEP_SECONDS,
    )
    expect(result.accumulatorSeconds).toBe(0)
    expect(simulateStep).toHaveBeenCalledTimes(MAX_CATCH_UP_STEPS)
  })

  it('keeps only a fractional-step remainder when catch-up is exhausted', () => {
    const clock = new FixedStepClock()
    const fractionalRemainder = FIXED_STEP_SECONDS / 2

    const result = clock.advance(
      (MAX_CATCH_UP_STEPS + 2) * FIXED_STEP_SECONDS + fractionalRemainder,
      () => undefined,
    )

    expect(result.stepsExecuted).toBe(MAX_CATCH_UP_STEPS)
    expect(result.discardedTimeSeconds).toBeCloseTo(2 * FIXED_STEP_SECONDS)
    expect(result.accumulatorSeconds).toBeCloseTo(fractionalRemainder)
  })
})
