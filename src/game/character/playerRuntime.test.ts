import { describe, expect, it } from 'vitest'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import {
  PLAYER_LIGHT_ATTACK,
  PLAYER_LIGHT_ATTACK_ID,
} from '../combat/playerAttackActions'
import type { CharacterCollisionResolver } from './playerMotor'
import { PlayerRuntime } from './playerRuntime'

const resolveOnFlatGround: CharacterCollisionResolver = (
  _position,
  desiredTranslation,
) => ({
  translation: { ...desiredTranslation, y: 0 },
  grounded: true,
})

function advancePattern(
  frameDeltas: readonly number[],
  intent: PlayerMovementIntent,
): PlayerRuntime {
  const runtime = new PlayerRuntime()
  runtime.attachCollisionResolver(resolveOnFlatGround)

  for (const frameDelta of frameDeltas) {
    runtime.advanceFrame(frameDelta, intent)
  }

  return runtime
}

describe('PlayerRuntime', () => {
  it('produces equivalent movement from different render-delta patterns', () => {
    const intent = { horizontal: 0, forward: 1 }
    const manySmallFrames = advancePattern(
      Array.from({ length: 120 }, () => 1 / 120),
      intent,
    )
    const fewerLargeFrames = advancePattern(
      Array.from({ length: 30 }, () => 1 / 30),
      intent,
    )

    expect(manySmallFrames.snapshot()).toEqual(fewerLargeFrames.snapshot())
    expect(manySmallFrames.snapshot().simulation.stepCount).toBe(60)
  })

  it('does not advance the motor until collision authority is attached', () => {
    const runtime = new PlayerRuntime()
    const initialPlayer = runtime.snapshot().player

    runtime.advanceFrame(1 / 30, { horizontal: 1, forward: 0 })

    expect(runtime.snapshot().player).toBe(initialPlayer)
    expect(runtime.snapshot().simulation.stepCount).toBe(2)
  })

  it('maps semantic light requests through combat authority', () => {
    const runtime = new PlayerRuntime()

    expect(
      runtime.requestPlayerAttack({ type: 'player-attack', attack: 'light' }),
    ).toEqual({ accepted: true, actionId: PLAYER_LIGHT_ATTACK_ID })
    expect(
      runtime.requestPlayerAttack({ type: 'player-attack', attack: 'heavy' }),
    ).toEqual({
      accepted: false,
      actionId: 'player.attack.heavy',
      reason: 'action-in-progress',
    })
  })

  it('locks movement intent and facing through committed attack phases', () => {
    const runtime = new PlayerRuntime()
    runtime.attachCollisionResolver(resolveOnFlatGround)
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 1, forward: 0 })
    expect(runtime.snapshot().player.facing).toEqual({ x: 1, z: 0 })

    runtime.requestPlayerAttack({ type: 'player-attack', attack: 'light' })
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 1 })

    expect(runtime.snapshot().attack.movementConstrained).toBe(true)
    expect(runtime.snapshot().player.movementIntent).toEqual({
      horizontal: 0,
      forward: 0,
    })
    expect(runtime.snapshot().player.facing).toEqual({ x: 1, z: 0 })
  })

  it('restores movement after completion and gameplay interruption', () => {
    const runtime = new PlayerRuntime()
    runtime.attachCollisionResolver(resolveOnFlatGround)
    runtime.requestPlayerAttack({ type: 'player-attack', attack: 'light' })

    const totalSteps =
      PLAYER_LIGHT_ATTACK.action.startupSteps +
      PLAYER_LIGHT_ATTACK.action.activeSteps +
      PLAYER_LIGHT_ATTACK.action.recoverySteps
    for (let step = 0; step < totalSteps; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 1, forward: 0 })
    }
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 1, forward: 0 })
    expect(runtime.snapshot().attack.movementConstrained).toBe(false)
    expect(runtime.snapshot().player.movementIntent.horizontal).toBe(1)

    runtime.requestPlayerAttack({ type: 'player-attack', attack: 'heavy' })
    expect(runtime.interruptCombatAction()).toEqual({
      accepted: true,
      actionId: 'player.attack.heavy',
    })
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 1 })
    expect(runtime.snapshot().attack.movementConstrained).toBe(false)
    expect(runtime.snapshot().player.movementIntent.forward).toBe(1)
  })
})
