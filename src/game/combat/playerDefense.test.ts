import { describe, expect, it } from 'vitest'
import { PlayerRuntime } from '../character/playerRuntime'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import type { CharacterCollisionResolver } from '../character/playerMotor'
import { PLAYER_DODGE_ACTION, PLAYER_DODGE_ACTION_ID } from './playerDefense'

const flatGround: CharacterCollisionResolver = (_position, desired) => ({
  translation: { ...desired, y: 0 },
  grounded: true,
})

function advance(runtime: PlayerRuntime, steps: number, horizontal = 0, forward = 0) {
  for (let step = 0; step < steps; step += 1) {
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal, forward })
  }
}

describe('player defensive actions', () => {
  it('snapshots accepted mouse aim for the full attack execution', () => {
    const runtime = new PlayerRuntime()
    runtime.attachCollisionResolver(flatGround)
    expect(
      runtime.requestPlayerAttack({
        type: 'player-attack',
        attack: 'light',
        aimDirection: { x: 1, z: 0 },
      }),
    ).toMatchObject({ accepted: true })

    runtime.requestPlayerAttack({
      type: 'player-attack',
      attack: 'heavy',
      aimDirection: { x: -1, z: 0 },
    })
    advance(runtime, 10, 0, 1)

    expect(runtime.snapshot().player.facing).toEqual({ x: 1, z: 0 })
    expect(runtime.snapshot().attack.executionFacing).toEqual({ x: 1, z: 0 })
  })

  it('samples dodge direction once and exposes invulnerability only while active', () => {
    const runtime = new PlayerRuntime()
    runtime.attachCollisionResolver(flatGround)
    const startingX = runtime.snapshot().player.position.x
    expect(
      runtime.requestPlayerDodge({ type: 'player-dodge' }, { horizontal: 1, forward: 0 }),
    ).toEqual({ accepted: true, actionId: PLAYER_DODGE_ACTION_ID, executionId: 1 })

    advance(runtime, 1, -1, 0)
    expect(runtime.snapshot().defense.invulnerable).toBe(false)
    advance(runtime, 1, -1, 0)
    expect(runtime.snapshot().defense).toMatchObject({
      dodgeDirection: { x: 1, z: 0 },
      dodgeMovementActive: true,
      invulnerable: true,
    })

    advance(runtime, PLAYER_DODGE_ACTION.activeSteps - 1, -1, 0)
    expect(runtime.snapshot().defense.invulnerable).toBe(true)
    expect(runtime.snapshot().player.position.x - startingX).toBeCloseTo(
      (PLAYER_DODGE_ACTION.activeSteps * 8) / 60,
    )
    advance(runtime, 1, -1, 0)
    expect(runtime.snapshot().combat.phase).toBe('recovery')
    expect(runtime.snapshot().defense.invulnerable).toBe(false)

    advance(runtime, PLAYER_DODGE_ACTION.recoverySteps)
    expect(runtime.snapshot().combat.phase).toBe('idle')
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: -1, forward: 0 })
    expect(runtime.snapshot().player.movementIntent.horizontal).toBe(-1)
  })

  it('falls back to facing for a neutral dodge and keeps its direction fixed', () => {
    const runtime = new PlayerRuntime()
    runtime.attachCollisionResolver(flatGround)
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: -1 })
    const facing = runtime.snapshot().player.facing
    runtime.requestPlayerDodge(
      { type: 'player-dodge' },
      { horizontal: 0, forward: 0 },
    )
    advance(runtime, 4, 1, 0)
    expect(runtime.snapshot().defense.dodgeDirection).toEqual(facing)
    expect(runtime.snapshot().player.facing).toEqual(facing)
  })

  it('guards only while idle, constrains movement, and releases cleanly', () => {
    const guarded = new PlayerRuntime()
    guarded.attachCollisionResolver(flatGround)
    guarded.setGuardIntent(true)
    advance(guarded, 30, 1, 0)
    expect(guarded.snapshot().defense.guarding).toBe(true)
    expect(guarded.snapshot().player.velocity.x).toBeCloseTo(1.4)
    expect(
      guarded.requestPlayerAttack({
        type: 'player-attack',
        attack: 'light',
        aimDirection: { x: 0, z: -1 },
      }),
    ).toMatchObject({ accepted: false, reason: 'guard-active' })

    guarded.setGuardIntent(false)
    advance(guarded, 1)
    expect(guarded.snapshot().defense.guarding).toBe(false)
    expect(
      guarded.requestPlayerDodge(
        { type: 'player-dodge' },
        { horizontal: 0, forward: 0 },
      ),
    ).toMatchObject({ accepted: true })
  })

  it('does not enter guard during a committed attack but enters after completion if held', () => {
    const runtime = new PlayerRuntime()
    runtime.attachCollisionResolver(flatGround)
    runtime.requestPlayerAttack({
      type: 'player-attack',
      attack: 'light',
      aimDirection: { x: 0, z: -1 },
    })
    runtime.setGuardIntent(true)
    advance(runtime, 1)
    expect(runtime.snapshot().defense.guarding).toBe(false)
    advance(runtime, 25)
    expect(runtime.snapshot().combat.phase).toBe('idle')
    expect(runtime.snapshot().defense.guarding).toBe(true)
  })
})
