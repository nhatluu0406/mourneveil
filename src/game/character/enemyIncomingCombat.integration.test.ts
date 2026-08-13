import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import type { CombatHitEvent } from '../combat/combatContact'
import type { CharacterCollisionResolver } from './playerMotor'
import { GameRuntime } from '../runtime/GameRuntime'

const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})
const NEUTRAL = { horizontal: 0, forward: 0 } as const

function createApproachingRuntime(): GameRuntime {
  const runtime = new GameRuntime()
  runtime.debugSetPlayerPosition({ x: 1.35, y: 0.82, z: -2.6 })
  runtime.attachCollisionResolver(FLAT_GROUND)
  runtime.attachEnemyCollisionResolver(runtime.snapshot().enemy.id, FLAT_GROUND)
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

function advanceUntilIncoming(runtime: GameRuntime, maximumSteps = 120): CombatHitEvent {
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
      attackerId: 'enemy.skirmisher.1',
      targetId: 'player',
      outcome: 'damaged',
      appliedDamage: 10,
    })
    expect(runtime.snapshot().playerHealth.health.current).toBe(90)
  })

  it('uses authoritative dodge active phase to prevent the same contact', () => {
    const runtime = createApproachingRuntime()
    const startupSteps = runtime.snapshot().enemy.action.phaseDurationSteps
    while (runtime.snapshot().enemy.action.phaseElapsedSteps < Math.max(0, startupSteps - 2)) {
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
    expect(runtime.snapshot().playerHealth.health.current).toBe(100)
  })

  it('blocks an incoming attacker inside the authoritative forward guard cone', () => {
    const runtime = createApproachingRuntime()
    runtime.setGuardIntent(true)

    expect(advanceUntilIncoming(runtime)).toMatchObject({
      outcome: 'guarded',
      appliedDamage: 0,
    })
    expect(runtime.snapshot().playerHealth.health.current).toBe(100)
  })

  it('deduplicates guard impact, breaks under repeated executions, then takes damage', () => {
    const runtime = createApproachingRuntime()
    runtime.setGuardIntent(true)

    const first = advanceUntilIncoming(runtime)
    expect(first.outcome).toBe('guarded')
    const firstImpact = runtime.snapshot().defense.guardImpact
    for (let step = 0; step < 4; step += 1) {
      expect(runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL).incomingHitEvents).toEqual([])
    }
    expect(runtime.snapshot().defense.guardImpact).toBe(firstImpact)

    expect(advanceUntilIncoming(runtime, 180).outcome).toBe('guarded')
    expect(advanceUntilIncoming(runtime, 180).outcome).toBe('guard-broken')
    expect(runtime.snapshot().defense).toMatchObject({
      guarding: false,
      guardImpact: 3,
      guardBroken: true,
    })
    runtime.setGuardIntent(true)
    expect(runtime.snapshot().defense.guardIntentHeld).toBe(false)

    expect(advanceUntilIncoming(runtime, 180)).toMatchObject({
      outcome: 'damaged',
      appliedDamage: 10,
    })
    expect(runtime.snapshot().playerHealth.health.current).toBe(90)

    for (let step = 0; step < 120 && runtime.snapshot().defense.guardBroken; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
    }
    runtime.setGuardIntent(true)
    runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
    expect(runtime.snapshot().defense).toMatchObject({
      guarding: true,
      guardImpact: 0,
      guardBroken: false,
    })
  })

  it('clears transient guard break on death and excludes it from save restoration', () => {
    const runtime = createApproachingRuntime()
    runtime.setGuardIntent(true)
    expect(advanceUntilIncoming(runtime).outcome).toBe('guarded')
    expect(advanceUntilIncoming(runtime, 180).outcome).toBe('guarded')
    expect(advanceUntilIncoming(runtime, 180).outcome).toBe('guard-broken')
    const save = runtime.captureSave()
    expect(save).not.toHaveProperty('guardImpact')

    runtime.applyPlayerDamage(999)
    expect(runtime.snapshot()).toMatchObject({
      playerHealth: { lifeState: 'dead' },
      defense: { guardImpact: 0, guardBroken: false, guardBreakRemainingSteps: 0 },
    })

    runtime.applySave(save)
    expect(runtime.snapshot()).toMatchObject({
      playerHealth: { lifeState: 'alive' },
      defense: { guardImpact: 0, guardBroken: false, guardBreakRemainingSteps: 0 },
    })
  })

  it('continues enemy action clocks after player defeat instead of freezing mid-attack', () => {
    const runtime = createApproachingRuntime()
    let defeated = false
    for (let step = 0; step < 2400; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
      if (!runtime.snapshot().playerHealth.health.alive) {
        defeated = true
        break
      }
    }
    expect(defeated).toBe(true)
    expect(runtime.snapshot().playerHealth.lifeState).toBe('dead')
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
