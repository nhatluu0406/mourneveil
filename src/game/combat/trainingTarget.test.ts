import { describe, expect, it } from 'vitest'
import {
  TrainingTargetRuntime,
  applyTrainingTargetDamage,
} from './trainingTarget'

describe('training target health', () => {
  it('applies deterministic damage and exposes alive state', () => {
    const target = new TrainingTargetRuntime()

    expect(target.applyDamage(20)).toMatchObject({
      applied: true,
      appliedDamage: 20,
      health: { maximum: 100, current: 80, alive: true },
    })
  })

  it('clamps at zero and rejects further damage after defeat', () => {
    const target = new TrainingTargetRuntime()

    expect(target.applyDamage(150)).toMatchObject({
      applied: true,
      appliedDamage: 100,
      health: { current: 0, alive: false },
    })
    expect(target.applyDamage(10)).toMatchObject({
      applied: false,
      appliedDamage: 0,
      health: { current: 0, alive: false },
    })
    expect(target.snapshot().health.current).toBe(0)
    expect(target.snapshot().hitCount).toBe(1)
  })

  it('keeps pure health input unchanged', () => {
    const health = Object.freeze({ maximum: 40, current: 40, alive: true })

    expect(applyTrainingTargetDamage(health, 15).health).toEqual({
      maximum: 40,
      current: 25,
      alive: true,
    })
    expect(health.current).toBe(40)
  })
})
