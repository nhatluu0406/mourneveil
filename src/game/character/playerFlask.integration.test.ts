import { describe, expect, it } from 'vitest'
import { PLAYER_FLASK_USE_REQUEST } from '../../input/playerFlaskIntent'
import { PLAYER_CHECKPOINT_INTERACTION_REQUEST, PLAYER_RESPAWN_REQUEST } from '../../input/playerRecoveryIntent'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { PLAYER_FLASK_DEFINITION } from './playerFlask'
import { GameRuntime } from '../runtime/GameRuntime'

const NEUTRAL = { horizontal: 0, forward: 0 } as const

function finishCurrentAction(runtime: GameRuntime): void {
  for (let step = 0; step < 120 && runtime.snapshot().combat.phase !== 'idle'; step += 1) {
    runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
  }
  expect(runtime.snapshot().combat.phase).toBe('idle')
}

describe('player flask integration', () => {
  it('commits use, heals at the authoritative active step, clamps, and consumes one charge', () => {
    const runtime = new GameRuntime()
    runtime.applyPlayerDamage(30)
    expect(runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)).toMatchObject({
      accepted: true,
      actionId: 'player.use-flask',
    })

    for (let step = 1; step < PLAYER_FLASK_DEFINITION.action.startupSteps; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
      expect(runtime.snapshot().playerHealth.health.current).toBe(70)
      expect(runtime.snapshot().flask.currentCharges).toBe(3)
    }
    runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
    expect(runtime.snapshot()).toMatchObject({
      playerHealth: { health: { current: 100 } },
      flask: { currentCharges: 2, lastRestoredHealth: 30 },
    })
  })

  it('rejects full health, committed action, guard, death, and exhausted charges', () => {
    const runtime = new GameRuntime()
    expect(runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)).toMatchObject({
      accepted: false,
      reason: 'resource-unavailable',
      detail: 'full-health',
    })

    for (let use = 0; use < 3; use += 1) {
      runtime.applyPlayerDamage(40)
      expect(runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)).toMatchObject({
        accepted: true,
      })
      finishCurrentAction(runtime)
    }
    expect(runtime.snapshot().flask.currentCharges).toBe(0)
    runtime.applyPlayerDamage(10)
    expect(runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)).toMatchObject({
      accepted: false,
      detail: 'no-charges',
    })

    runtime.restorePlayerForDevelopment()
    runtime.requestPlayerAttack({
      type: 'player-attack',
      attack: 'light',
      aimDirection: { x: 0, z: -1 },
    })
    expect(runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)).toMatchObject({
      accepted: false,
      reason: 'action-in-progress',
    })
    runtime.interruptCombatAction()
    runtime.setGuardIntent(true)
    runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
    runtime.applyPlayerDamage(10)
    expect(runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)).toMatchObject({
      accepted: false,
      reason: 'guard-active',
    })
    runtime.setGuardIntent(false)
    runtime.applyPlayerDamage(999)
    expect(runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)).toMatchObject({
      accepted: false,
      reason: 'actor-defeated',
    })
  })

  it('refills on checkpoint activation/rest and on checkpoint respawn', () => {
    const runtime = new GameRuntime()
    runtime.applyPlayerDamage(50)
    runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)
    finishCurrentAction(runtime)
    expect(runtime.snapshot().flask.currentCharges).toBe(2)

    runtime.debugSetPlayerPosition(runtime.snapshot().checkpoint.respawnPosition)
    expect(
      runtime.requestCheckpointInteraction(PLAYER_CHECKPOINT_INTERACTION_REQUEST),
    ).toMatchObject({ accepted: true })
    expect(runtime.snapshot().flask.currentCharges).toBe(3)

    runtime.applyPlayerDamage(50)
    runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)
    finishCurrentAction(runtime)
    runtime.applyPlayerDamage(999)
    expect(runtime.requestRespawn(PLAYER_RESPAWN_REQUEST)).toMatchObject({
      accepted: true,
    })
    expect(runtime.snapshot()).toMatchObject({
      playerHealth: { lifeState: 'alive', health: { current: 100 } },
      flask: { currentCharges: 3, pendingExecutionId: null },
      combat: { phase: 'idle' },
      encounter: { phase: 'active' },
    })
  })
})
