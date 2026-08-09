import { describe, expect, it } from 'vitest'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import {
  PLAYER_LIGHT_ATTACK,
  PLAYER_LIGHT_ATTACK_ID,
} from '../combat/playerAttackActions'
import type { CharacterCollisionResolver } from '../character/playerMotor'
import { GameRuntime } from './GameRuntime'

const AIM_FORWARD = { x: 0, z: -1 } as const

function attackRequest(attack: 'light' | 'heavy') {
  return { type: 'player-attack' as const, attack, aimDirection: AIM_FORWARD }
}

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
): GameRuntime {
  const runtime = new GameRuntime()
  runtime.attachCollisionResolver(resolveOnFlatGround)

  for (const frameDelta of frameDeltas) {
    runtime.advanceFrame(frameDelta, intent)
  }

  return runtime
}

describe('GameRuntime', () => {
  it.each([
    ['light', 20],
    ['heavy', 35],
  ] as const)('applies authoritative player %s damage to the enemy hurtbox', (attack, damage) => {
    const runtime = new GameRuntime()
    runtime.attachCombatContactQuery(({ hurtboxes }) =>
      hurtboxes
        .filter((hurtbox) => hurtbox.ownerId === runtime.snapshot().enemy.id)
        .map((hurtbox) => ({ hurtboxId: hurtbox.id, targetId: hurtbox.ownerId })),
    )
    runtime.requestPlayerAttack(attackRequest(attack))
    const startup = attack === 'light' ? 8 : 18
    for (let step = 0; step < startup; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    expect(runtime.snapshot().enemy.health.current).toBe(70 - damage)
  })

  it('resolves active contact after movement in the fixed simulation step', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(resolveOnFlatGround)
    const enemyId = runtime.snapshot().enemy.id
    runtime.attachCombatContactQuery(({ hurtboxes }) =>
      hurtboxes
        .filter((hurtbox) => hurtbox.ownerId === enemyId)
        .map((hurtbox) => ({
          hurtboxId: hurtbox.id,
          targetId: hurtbox.ownerId,
        })),
    )
    runtime.requestPlayerAttack(attackRequest('light'))

    for (let step = 1; step < PLAYER_LIGHT_ATTACK.action.startupSteps; step += 1) {
      expect(
        runtime.advanceFrame(FIXED_STEP_SECONDS, {
          horizontal: 0,
          forward: 0,
        }).hitEvents,
      ).toEqual([])
    }
    const activeStep = runtime.advanceFrame(FIXED_STEP_SECONDS, {
      horizontal: 0,
      forward: 0,
    })

    expect(activeStep.hitEvents).toHaveLength(1)
    expect(activeStep.hitEvents[0].simulationStep).toBe(
      PLAYER_LIGHT_ATTACK.action.startupSteps,
    )
    expect(activeStep.enemy.health.current).toBe(
      activeStep.enemy.health.maximum - PLAYER_LIGHT_ATTACK.damage,
    )
  })

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
    const runtime = new GameRuntime()
    const initialPlayer = runtime.snapshot().player

    runtime.advanceFrame(1 / 30, { horizontal: 1, forward: 0 })

    expect(runtime.snapshot().player).toBe(initialPlayer)
    expect(runtime.snapshot().simulation.stepCount).toBe(2)
  })

  it('maps semantic light requests through combat authority', () => {
    const runtime = new GameRuntime()

    expect(
      runtime.requestPlayerAttack(attackRequest('light')),
    ).toEqual({
      accepted: true,
      actionId: PLAYER_LIGHT_ATTACK_ID,
      executionId: 1,
    })
    expect(
      runtime.requestPlayerAttack(attackRequest('heavy')),
    ).toEqual({
      accepted: false,
      actionId: 'player.attack.heavy',
      reason: 'action-in-progress',
    })
  })

  it('locks movement intent and facing through committed attack phases', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(resolveOnFlatGround)
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 1, forward: 0 })
    expect(runtime.snapshot().player.facing).toEqual({ x: 1, z: 0 })

    runtime.requestPlayerAttack(attackRequest('light'))
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 1 })

    expect(runtime.snapshot().attack.movementConstrained).toBe(true)
    expect(runtime.snapshot().player.movementIntent).toEqual({
      horizontal: 0,
      forward: 0,
    })
    expect(runtime.snapshot().player.facing).toEqual(AIM_FORWARD)
  })

  it('restores movement after completion and gameplay interruption', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(resolveOnFlatGround)
    runtime.requestPlayerAttack(attackRequest('light'))

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

    runtime.requestPlayerAttack(attackRequest('heavy'))
    expect(runtime.interruptCombatAction()).toEqual({
      accepted: true,
      actionId: 'player.attack.heavy',
    })
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 1 })
    expect(runtime.snapshot().attack.movementConstrained).toBe(false)
    expect(runtime.snapshot().player.movementIntent.forward).toBe(1)
  })

  it('enters canonical death and rejects movement, attack, dodge, and guard', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(resolveOnFlatGround)
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 1, forward: 0 })
    runtime.requestPlayerAttack(attackRequest('light'))

    expect(runtime.applyPlayerDamage(999)).toMatchObject({
      applied: true,
      appliedDamage: 100,
      health: { current: 0, alive: false },
    })
    const deathPosition = runtime.snapshot().player.position
    runtime.setGuardIntent(true)

    expect(runtime.requestPlayerAttack(attackRequest('light'))).toMatchObject({
      accepted: false,
      reason: 'actor-defeated',
    })
    expect(
      runtime.requestPlayerDodge(
        { type: 'player-dodge' },
        { horizontal: 1, forward: 0 },
      ),
    ).toMatchObject({ accepted: false, reason: 'actor-defeated' })

    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 1, forward: 1 })
    expect(runtime.snapshot()).toMatchObject({
      player: { position: deathPosition, velocity: { x: 0, y: 0, z: 0 } },
      playerHealth: { lifeState: 'dead', health: { current: 0, alive: false } },
      combat: { phase: 'idle', contact: { enabled: false } },
      defense: { guarding: false, guardIntentHeld: false, invulnerable: false },
    })
  })
})
