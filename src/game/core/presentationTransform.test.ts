import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from './fixedStepClock'
import {
  interpolateVector3,
  presentationOffsetFromSimulation,
  presentationPositionFromTransform,
  renderAlphaFromAccumulator,
} from './presentationTransform'

describe('presentation interpolation', () => {
  it('maps accumulator remainder onto 0..1 render alpha', () => {
    expect(renderAlphaFromAccumulator(0)).toBe(0)
    expect(renderAlphaFromAccumulator(FIXED_STEP_SECONDS / 2)).toBeCloseTo(0.5, 8)
    expect(renderAlphaFromAccumulator(FIXED_STEP_SECONDS)).toBe(1)
    expect(renderAlphaFromAccumulator(-1)).toBe(0)
  })

  it('lerps previous→current without touching endpoints at 0 and 1', () => {
    const previous = { x: 0, y: 0.82, z: 0 }
    const current = { x: 2, y: 0.82, z: -2 }
    expect(interpolateVector3(previous, current, 0)).toEqual(previous)
    expect(interpolateVector3(previous, current, 1)).toEqual(current)
    const mid = interpolateVector3(previous, current, 0.5)
    expect(mid.x).toBeCloseTo(1, 8)
    expect(mid.z).toBeCloseTo(-1, 8)
  })

  it('keeps the presentation offset as presented minus simulation', () => {
    const transform = {
      previousSimulationPosition: { x: 0, y: 1, z: 0 },
      simulationPosition: { x: 4, y: 1, z: 0 },
      renderAlpha: 0.25,
    }
    const presented = presentationPositionFromTransform(transform)
    expect(presented.x).toBeCloseTo(1, 8)
    const offset = presentationOffsetFromSimulation(transform.simulationPosition, presented)
    expect(offset.x).toBeCloseTo(-3, 8)
  })
})
