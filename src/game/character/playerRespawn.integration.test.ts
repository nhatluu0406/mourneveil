import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { BRUTE_ROLE, SKIRMISHER_ROLE } from '../enemies/enemyRoles'
import type { CharacterCollisionResolver } from './playerMotor'
import { PlayerRuntime } from './playerRuntime'

const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})
const INTERACT = { type: 'player-checkpoint-interaction' as const }
const RESPAWN = { type: 'player-respawn' as const }
const LIGHT = {
  type: 'player-attack' as const,
  attack: 'light' as const,
  aimDirection: { x: 0, z: -1 },
}
const HEAVY = { ...LIGHT, attack: 'heavy' as const }

function defeatSkirmisher(runtime: PlayerRuntime): void {
  runtime.attachCombatContactQuery(({ hurtboxes }) =>
    hurtboxes
      .filter((hurtbox) => hurtbox.ownerId === SKIRMISHER_ROLE.runtimeId)
      .map((hurtbox) => ({ hurtboxId: hurtbox.id, targetId: hurtbox.ownerId })),
  )
  for (let attack = 0; attack < 2; attack += 1) {
    while (!runtime.requestPlayerAttack(HEAVY).accepted) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    while (runtime.snapshot().combat.phase !== 'idle') {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
  }
}

describe('player checkpoint and respawn integration', () => {
  it('requires checkpoint activation and restores transform, health, combat, and encounter', () => {
    const runtime = new PlayerRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)
    expect(runtime.requestRespawn(RESPAWN)).toEqual({
      accepted: false,
      reason: 'actor-alive',
    })
    expect(runtime.requestCheckpointInteraction(INTERACT)).toEqual({
      accepted: true,
      checkpointId: 'checkpoint.graybox.entry',
    })

    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 1, forward: 0 })
    defeatSkirmisher(runtime)
    expect(runtime.snapshot().enemy.health.current).toBe(0)
    runtime.requestPlayerAttack(LIGHT)
    runtime.applyPlayerDamage(999)
    expect(runtime.snapshot()).toMatchObject({
      playerHealth: { lifeState: 'dead' },
      combat: { phase: 'idle' },
    })

    expect(runtime.requestRespawn(RESPAWN)).toEqual({
      accepted: true,
      checkpointId: 'checkpoint.graybox.entry',
    })
    expect(runtime.snapshot()).toMatchObject({
      player: {
        position: runtime.snapshot().checkpoint.respawnPosition,
        velocity: { x: 0, y: 0, z: 0 },
        movementIntent: { horizontal: 0, forward: 0 },
      },
      playerHealth: { lifeState: 'alive', health: { current: 100, alive: true } },
      combat: { phase: 'idle', executionId: null },
      defense: { guarding: false, guardIntentHeld: false, dodgeExecutionId: null },
      encounter: { phase: 'active', defeatedEnemyIds: [] },
    })
    expect(runtime.snapshot().enemies.map((enemy) => enemy.health.current)).toEqual([
      SKIRMISHER_ROLE.definition.maximumHealth,
      BRUTE_ROLE.definition.maximumHealth,
    ])
    expect(runtime.snapshot().incomingContact).toMatchObject({
      totalHitCount: 0,
      lastHit: null,
    })
  })

  it('supports repeated death and respawn cycles without stale action state', () => {
    const runtime = new PlayerRuntime()
    runtime.requestCheckpointInteraction(INTERACT)

    for (let cycle = 0; cycle < 3; cycle += 1) {
      runtime.requestPlayerAttack(LIGHT)
      runtime.setGuardIntent(true)
      runtime.applyPlayerDamage(999)
      expect(runtime.requestRespawn(RESPAWN)).toMatchObject({ accepted: true })
      expect(runtime.snapshot()).toMatchObject({
        playerHealth: { lifeState: 'alive', health: { current: 100 } },
        combat: { phase: 'idle', executionId: null },
        defense: { guarding: false, guardIntentHeld: false },
        encounter: { phase: 'active' },
      })
    }
  })
})
