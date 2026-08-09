import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import type { CombatHitEvent } from '../combat/combatContact'
import type { CharacterCollisionResolver } from './playerMotor'
import { PlayerRuntime } from './playerRuntime'

const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})
const NEUTRAL = { horizontal: 0, forward: 0 } as const

function createApproachingRuntime(): PlayerRuntime {
  const runtime = new PlayerRuntime()
  runtime.attachCollisionResolver(FLAT_GROUND)
  runtime.attachEnemyCollisionResolver(FLAT_GROUND)
  runtime.attachCombatContactQuery(({ hurtboxes }) =>
    hurtboxes
      .filter((hurtbox) => hurtbox.ownerId === 'player')
      .map((hurtbox) => ({ hurtboxId: hurtbox.id, targetId: hurtbox.ownerId })),
  )

  for (let step = 0; step < 180 && runtime.snapshot().enemy.state === 'idle'; step += 1) {
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 1, forward: 0 })
  }
  for (let step = 0; step < 240 && runtime.snapshot().enemy.action.phase !== 'startup'; step += 1) {
    runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
  }
  expect(runtime.snapshot().enemy.action.phase).toBe('startup')
  expect(runtime.snapshot().player.facing).toEqual({ x: 1, z: 0 })
  return runtime
}

function advanceUntilIncoming(runtime: PlayerRuntime, maximumSteps = 120): CombatHitEvent {
  for (let step = 0; step < maximumSteps; step += 1) {
    const events = runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL).incomingHitEvents
    if (events.length > 0) return events[0]
  }
  throw new Error('Enemy did not produce incoming contact')
}

describe('player runtime enemy incoming-melee integration', () => {
  it('applies one normal incoming hit through player combat health', () => {
    const runtime = createApproachingRuntime()
    expect(advanceUntilIncoming(runtime)).toMatchObject({
      attackerId: 'enemy.melee.1',
      targetId: 'player',
      outcome: 'damaged',
      appliedDamage: 15,
    })
    expect(runtime.snapshot().playerCombat.health.current).toBe(85)
  })

  it('uses authoritative dodge active phase to prevent the same contact', () => {
    const runtime = createApproachingRuntime()
    while (runtime.snapshot().enemy.action.phaseElapsedSteps < 28) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
    }
    expect(
      runtime.requestPlayerDodge(
        { type: 'player-dodge' },
        NEUTRAL,
      ),
    ).toMatchObject({ accepted: true })

    expect(advanceUntilIncoming(runtime)).toMatchObject({
      outcome: 'dodged',
      appliedDamage: 0,
    })
    expect(runtime.snapshot().playerCombat.health.current).toBe(100)
  })

  it('blocks an incoming attacker inside the authoritative forward guard cone', () => {
    const runtime = createApproachingRuntime()
    runtime.setGuardIntent(true)

    expect(advanceUntilIncoming(runtime)).toMatchObject({
      outcome: 'guarded',
      appliedDamage: 0,
    })
    expect(runtime.snapshot().playerCombat.health.current).toBe(100)
  })

  it('continues enemy action clocks after player defeat instead of freezing mid-attack', () => {
    const runtime = createApproachingRuntime()
    while (runtime.snapshot().playerCombat.health.alive) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
    }
    expect(runtime.snapshot().playerCombat.defeated).toBe(true)
    const frozen = runtime.snapshot().enemy
    expect(['attack', 'recovery', 'spacing', 'pursue', 'idle']).toContain(frozen.state)

    for (let step = 0; step < 240; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
      if (runtime.snapshot().enemy.state === 'idle') break
    }
    expect(runtime.snapshot().enemy).toMatchObject({
      state: 'idle',
      targetId: null,
      action: { phase: 'idle' },
      attackExecutionFacing: null,
    })
    expect(runtime.snapshot().simulation.stepCount).toBeGreaterThan(0)
  })
})
