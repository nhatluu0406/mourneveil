import { describe, expect, it } from 'vitest'
import {
  PLAYER_ATTACK_RECOVERY_MOVEMENT_SCALE,
  PLAYER_HEAVY_ATTACK,
  PLAYER_LIGHT_ATTACK,
  constrainMovementIntentForAttack,
  createPlayerAttackSpatialSnapshot,
} from './playerAttackActions'
import { CombatActionRuntime } from './combatActionRuntime'

describe('player attack commitment timing and movement', () => {
  it('A–B: light and heavy authored phase durations differ as intended', () => {
    expect(PLAYER_LIGHT_ATTACK.action).toMatchObject({
      startupSteps: 10,
      activeSteps: 5,
      recoverySteps: 16,
    })
    expect(PLAYER_HEAVY_ATTACK.action).toMatchObject({
      startupSteps: 18,
      activeSteps: 8,
      recoverySteps: 38,
    })
    expect(PLAYER_LIGHT_ATTACK.action.startupSteps).toBeLessThan(
      PLAYER_HEAVY_ATTACK.action.startupSteps,
    )
    expect(PLAYER_LIGHT_ATTACK.action.recoverySteps).toBeLessThan(
      PLAYER_HEAVY_ATTACK.action.recoverySteps,
    )
  })

  it('A–C: light advances startup → active contact → recovery → idle', () => {
    const runtime = new CombatActionRuntime([PLAYER_LIGHT_ATTACK.action])
    expect(runtime.request({ type: 'start-action', actionId: PLAYER_LIGHT_ATTACK.action.id })).toMatchObject({
      accepted: true,
    })
    expect(runtime.snapshot().phase).toBe('startup')
    expect(runtime.snapshot().contact.enabled).toBe(false)

    for (let step = 0; step < PLAYER_LIGHT_ATTACK.action.startupSteps; step += 1) {
      runtime.advanceFixedStep()
    }
    expect(runtime.snapshot().phase).toBe('active')
    expect(runtime.snapshot().contact.enabled).toBe(true)

    for (let step = 0; step < PLAYER_LIGHT_ATTACK.action.activeSteps; step += 1) {
      runtime.advanceFixedStep()
    }
    expect(runtime.snapshot().phase).toBe('recovery')
    expect(runtime.snapshot().contact.enabled).toBe(false)

    for (let step = 0; step < PLAYER_LIGHT_ATTACK.action.recoverySteps; step += 1) {
      runtime.advanceFixedStep()
    }
    expect(runtime.snapshot().phase).toBe('idle')
  })

  it('B–H: heavy sequence completes and rejects overlapping starts while committed', () => {
    const runtime = new CombatActionRuntime([
      PLAYER_LIGHT_ATTACK.action,
      PLAYER_HEAVY_ATTACK.action,
    ])
    expect(runtime.request({ type: 'start-action', actionId: PLAYER_HEAVY_ATTACK.action.id })).toMatchObject({
      accepted: true,
    })
    expect(
      runtime.request({ type: 'start-action', actionId: PLAYER_LIGHT_ATTACK.action.id }),
    ).toMatchObject({ accepted: false, reason: 'action-in-progress' })

    for (let step = 0; step < PLAYER_HEAVY_ATTACK.action.startupSteps; step += 1) {
      runtime.advanceFixedStep()
    }
    expect(runtime.snapshot().phase).toBe('active')
    expect(runtime.snapshot().contact.enabled).toBe(true)

    const remaining =
      PLAYER_HEAVY_ATTACK.action.activeSteps + PLAYER_HEAVY_ATTACK.action.recoverySteps
    for (let step = 0; step < remaining; step += 1) runtime.advanceFixedStep()
    expect(runtime.snapshot().phase).toBe('idle')
  })

  it('I: contact shape uses frozen execution facing while committed', () => {
    const runtime = new CombatActionRuntime([PLAYER_LIGHT_ATTACK.action])
    runtime.request({ type: 'start-action', actionId: PLAYER_LIGHT_ATTACK.action.id })
    for (let step = 0; step < PLAYER_LIGHT_ATTACK.action.startupSteps; step += 1) {
      runtime.advanceFixedStep()
    }
    const attack = createPlayerAttackSpatialSnapshot(
      runtime.snapshot(),
      { x: 0, y: 0.82, z: 0 },
      { x: 0, z: -1 },
    )
    expect(attack.executionFacing).toEqual({ x: 0, z: -1 })
    expect(attack.activeContactShape?.center.z).toBeLessThan(0)
    expect(attack.movementConstrained).toBe(true)
  })

  it('locks startup/active movement and restores partial control in recovery', () => {
    expect(constrainMovementIntentForAttack({ horizontal: 1, forward: 1 }, 'startup')).toEqual({
      horizontal: 0,
      forward: 0,
    })
    expect(constrainMovementIntentForAttack({ horizontal: 1, forward: 1 }, 'active')).toEqual({
      horizontal: 0,
      forward: 0,
    })
    expect(constrainMovementIntentForAttack({ horizontal: 1, forward: -1 }, 'recovery')).toEqual({
      horizontal: PLAYER_ATTACK_RECOVERY_MOVEMENT_SCALE,
      forward: -PLAYER_ATTACK_RECOVERY_MOVEMENT_SCALE,
    })
    expect(constrainMovementIntentForAttack({ horizontal: 1, forward: 0 }, 'idle')).toEqual({
      horizontal: 1,
      forward: 0,
    })
  })
})
