import { describe, expect, it } from 'vitest'
import { EncounterActivationRuntime } from './encounterActivation'
import { GameRuntime } from '../runtime/GameRuntime'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'

describe('encounter activation policy', () => {
  it('keeps distant encounters inactive until the player enters their zone', () => {
    const activation = new EncounterActivationRuntime()
    expect(activation.snapshot().activatedEncounterIds).toEqual([])
    expect(
      activation.isEnemySimulationEnabled('enemy.skirmisher.introduction', {
        x: -14,
        y: 0.82,
        z: 6,
      }),
    ).toBe(false)

    activation.update({ x: -9.5, y: 0.82, z: 2.5 })
    expect(activation.snapshot().activatedEncounterIds).toContain('encounter.m5.introduction')
    expect(
      activation.isEnemySimulationEnabled('enemy.skirmisher.introduction', {
        x: -9.5,
        y: 0.82,
        z: 2.5,
      }),
    ).toBe(true)
    // Refuge center is outside the first-combat egress margin.
    expect(
      activation.isEnemySimulationEnabled('enemy.skirmisher.introduction', {
        x: -5.5,
        y: 0.82,
        z: 0,
      }),
    ).toBe(false)
  })

  it('prevents introduction chase damage while the player rests at the refuge', () => {
    const runtime = new GameRuntime()
    runtime.attachCombatContactQuery(({ hurtboxes }) =>
      hurtboxes.map((hurtbox) => ({
        hurtboxId: hurtbox.id,
        targetId: hurtbox.ownerId,
      })),
    )
    runtime.debugSetPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
    const before = runtime.snapshot().playerHealth.health.current
    for (let step = 0; step < 240; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    const after = runtime.snapshot()
    expect(after.playerHealth.health.current).toBe(before)
    expect(after.encounterActivation.activatedEncounterIds).toEqual([])
    expect(
      after.enemies.find((enemy) => enemy.id === 'enemy.skirmisher.introduction')?.state,
    ).toBe('idle')
  })
})
