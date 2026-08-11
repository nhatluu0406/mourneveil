import { describe, expect, it } from 'vitest'
import { CombatActionRuntime } from './combatActionRuntime'
import {
  PLAYER_HEAVY_ATTACK,
  PLAYER_LIGHT_ATTACK,
  constrainMovementIntentForAttack,
  createPlayerAttackSpatialSnapshot,
  transformPlayerAttackContactShape,
} from './playerAttackActions'

function advance(runtime: CombatActionRuntime, steps: number): void {
  for (let step = 0; step < steps; step += 1) {
    runtime.advanceFixedStep()
  }
}

describe('player attack definitions', () => {
  it.each([
    ['light', PLAYER_LIGHT_ATTACK],
    ['heavy', PLAYER_HEAVY_ATTACK],
  ] as const)('%s attack follows its authoritative phase timings', (_name, attack) => {
    const runtime = new CombatActionRuntime([attack.action])
    expect(
      runtime.request({ type: 'start-action', actionId: attack.action.id }),
    ).toEqual({ accepted: true, actionId: attack.action.id, executionId: 1 })

    expect(runtime.snapshot().phase).toBe('startup')
    advance(runtime, attack.action.startupSteps)
    expect(runtime.snapshot().phase).toBe('active')
    expect(runtime.snapshot().contact).toEqual({
      enabled: true,
      actionId: attack.action.id,
      windowId: attack.contactShape.windowId,
    })
    advance(runtime, attack.action.activeSteps)
    expect(runtime.snapshot().phase).toBe('recovery')
    expect(runtime.snapshot().contact.enabled).toBe(false)
    advance(runtime, attack.action.recoverySteps)
    expect(runtime.snapshot().phase).toBe('idle')
  })

  it('makes heavy attack more committed than light attack', () => {
    const lightSteps =
      PLAYER_LIGHT_ATTACK.action.startupSteps +
      PLAYER_LIGHT_ATTACK.action.activeSteps +
      PLAYER_LIGHT_ATTACK.action.recoverySteps
    const heavySteps =
      PLAYER_HEAVY_ATTACK.action.startupSteps +
      PLAYER_HEAVY_ATTACK.action.activeSteps +
      PLAYER_HEAVY_ATTACK.action.recoverySteps

    expect(PLAYER_HEAVY_ATTACK.action.startupSteps).toBeGreaterThan(
      PLAYER_LIGHT_ATTACK.action.startupSteps,
    )
    expect(PLAYER_HEAVY_ATTACK.action.recoverySteps).toBeGreaterThan(
      PLAYER_LIGHT_ATTACK.action.recoverySteps,
    )
    expect(heavySteps).toBeGreaterThan(lightSteps)
    expect(PLAYER_HEAVY_ATTACK.damage).toBeGreaterThan(
      PLAYER_LIGHT_ATTACK.damage,
    )
  })

  it('rejects another attack without queueing and restarts after completion', () => {
    const runtime = new CombatActionRuntime([
      PLAYER_LIGHT_ATTACK.action,
      PLAYER_HEAVY_ATTACK.action,
    ])
    runtime.request({
      type: 'start-action',
      actionId: PLAYER_LIGHT_ATTACK.action.id,
    })

    expect(
      runtime.request({
        type: 'start-action',
        actionId: PLAYER_HEAVY_ATTACK.action.id,
      }),
    ).toEqual({
      accepted: false,
      actionId: PLAYER_HEAVY_ATTACK.action.id,
      reason: 'action-in-progress',
    })

    advance(
      runtime,
      PLAYER_LIGHT_ATTACK.action.startupSteps +
        PLAYER_LIGHT_ATTACK.action.activeSteps +
        PLAYER_LIGHT_ATTACK.action.recoverySteps,
    )
    expect(runtime.snapshot().phase).toBe('idle')
    expect(
      runtime.request({
        type: 'start-action',
        actionId: PLAYER_LIGHT_ATTACK.action.id,
      }).accepted,
    ).toBe(true)
  })

  it('transforms the contact sphere consistently with facing', () => {
    const shape = transformPlayerAttackContactShape(
      PLAYER_LIGHT_ATTACK.contactShape,
      { x: 2, y: 0.82, z: 3 },
      { x: 1, z: 0 },
    )

    expect(shape.center).toEqual({
      x: 2 + PLAYER_LIGHT_ATTACK.contactShape.forwardOffset,
      y: 0.82,
      z: 3,
    })
    expect(shape.radius).toBe(PLAYER_LIGHT_ATTACK.contactShape.radius)
  })

  it('constrains movement only while an action phase is committed', () => {
    const intent = { horizontal: 1, forward: 0 }

    expect(constrainMovementIntentForAttack(intent, 'idle')).toBe(intent)
    expect(constrainMovementIntentForAttack(intent, 'startup')).toEqual({
      horizontal: 0,
      forward: 0,
    })
    expect(constrainMovementIntentForAttack(intent, 'active')).toEqual({
      horizontal: 0,
      forward: 0,
    })
    expect(constrainMovementIntentForAttack(intent, 'recovery')).toEqual({
      horizontal: 0.35,
      forward: 0,
    })
  })

  it('exposes a spatial contact only during the matching active window', () => {
    const runtime = new CombatActionRuntime([PLAYER_LIGHT_ATTACK.action])
    runtime.request({
      type: 'start-action',
      actionId: PLAYER_LIGHT_ATTACK.action.id,
    })
    const position = { x: 0, y: 0.82, z: 0 }
    const facing = { x: 0, z: -1 }

    expect(
      createPlayerAttackSpatialSnapshot(runtime.snapshot(), position, facing)
        .activeContactShape,
    ).toBeNull()
    advance(runtime, PLAYER_LIGHT_ATTACK.action.startupSteps)
    expect(
      createPlayerAttackSpatialSnapshot(runtime.snapshot(), position, facing)
        .activeContactShape?.id,
    ).toBe(PLAYER_LIGHT_ATTACK.contactShape.id)
    advance(runtime, PLAYER_LIGHT_ATTACK.action.activeSteps)
    expect(
      createPlayerAttackSpatialSnapshot(runtime.snapshot(), position, facing)
        .activeContactShape,
    ).toBeNull()
  })
})
