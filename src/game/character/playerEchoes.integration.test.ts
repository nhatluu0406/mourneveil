import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { BRUTE_ROLE, SKIRMISHER_ROLE } from '../enemies/enemyRoles'
import type { CharacterCollisionResolver } from './playerMotor'
import { GameRuntime } from '../runtime/GameRuntime'

const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})
const HEAVY = {
  type: 'player-attack' as const,
  attack: 'heavy' as const,
  aimDirection: { x: 1, z: 0 },
}
const INTERACT = { type: 'player-checkpoint-interaction' as const }
const RESPAWN = { type: 'player-respawn' as const }

function forceContactOn(runtime: GameRuntime, enemyId: string): void {
  runtime.attachCombatContactQuery(({ hurtboxes }) =>
    hurtboxes
      .filter((hurtbox) => hurtbox.ownerId === enemyId)
      .map((hurtbox) => ({ hurtboxId: hurtbox.id, targetId: hurtbox.ownerId })),
  )
}

function defeatEnemy(runtime: GameRuntime, enemyId: string, attacks: number): void {
  forceContactOn(runtime, enemyId)
  for (let attack = 0; attack < attacks; attack += 1) {
    while (!runtime.requestPlayerAttack(HEAVY).accepted) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    while (runtime.snapshot().combat.phase !== 'idle') {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
  }
}

describe('Echo reward, death drop, and recovery', () => {
  it('rewards distinct enemy values once per defeat lifecycle', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)
    expect(SKIRMISHER_ROLE.definition.echoReward).toBe(25)
    expect(BRUTE_ROLE.definition.echoReward).toBe(60)

    defeatEnemy(runtime, SKIRMISHER_ROLE.runtimeId, 2)
    expect(runtime.snapshot().enemy.alive).toBe(false)
    expect(runtime.snapshot().echoes.carried).toBe(25)

    // Repeated overlap against a dead enemy must not duplicate the reward.
    forceContactOn(runtime, SKIRMISHER_ROLE.runtimeId)
    runtime.requestPlayerAttack(HEAVY)
    while (runtime.snapshot().combat.phase !== 'idle') {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    expect(runtime.snapshot().echoes.carried).toBe(25)

    defeatEnemy(runtime, BRUTE_ROLE.runtimeId, 5)
    expect(runtime.snapshot().echoes.carried).toBe(85)

    runtime.resetGrayboxEncounter()
    expect(runtime.snapshot().enemies.every((enemy) => enemy.alive)).toBe(true)
    defeatEnemy(runtime, SKIRMISHER_ROLE.runtimeId, 2)
    expect(runtime.snapshot().echoes.carried).toBe(110)
  })

  it('drops carried Echoes on death, recovers once, and replaces on second death', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)
    runtime.debugSetPlayerPosition(runtime.snapshot().checkpoint.respawnPosition)
    runtime.requestCheckpointInteraction(INTERACT)
    defeatEnemy(runtime, SKIRMISHER_ROLE.runtimeId, 2)
    expect(runtime.snapshot().echoes.carried).toBe(25)

    const deathPosition = { ...runtime.snapshot().player.position }
    runtime.applyPlayerDamage(999)
    expect(runtime.snapshot()).toMatchObject({
      playerHealth: { lifeState: 'dead' },
      echoes: { carried: 0 },
      echoRecovery: {
        active: true,
        amount: 25,
        position: deathPosition,
      },
    })

    runtime.requestRespawn(RESPAWN)
    expect(runtime.snapshot().echoes.carried).toBe(0)
    expect(runtime.snapshot().echoRecovery.active).toBe(true)
    runtime.requestCheckpointInteraction(INTERACT)
    expect(runtime.snapshot().echoRecovery.active).toBe(true)

    // Walk onto the recovery marker via forced position steps.
    const recovery = runtime.snapshot().echoRecovery.position!
    for (let step = 0; step < 180; step += 1) {
      const pos = runtime.snapshot().player.position
      const dx = recovery.x - pos.x
      const dz = recovery.z - pos.z
      const dist = Math.hypot(dx, dz)
      if (!runtime.snapshot().echoRecovery.active) break
      runtime.advanceFrame(FIXED_STEP_SECONDS, {
        horizontal: dist < 0.01 ? 0 : dx / dist,
        forward: dist < 0.01 ? 0 : -dz / dist,
      })
    }
    expect(runtime.snapshot().echoRecovery.active).toBe(false)
    expect(runtime.snapshot().echoes.carried).toBe(25)

    // Overlap again must not duplicate.
    for (let step = 0; step < 30; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    expect(runtime.snapshot().echoes.carried).toBe(25)

    // Second death before recovery of a new drop replaces prior (none active) and drops current.
    defeatEnemy(runtime, BRUTE_ROLE.runtimeId, 5)
    expect(runtime.snapshot().echoes.carried).toBe(85)
    runtime.applyPlayerDamage(999)
    expect(runtime.snapshot().echoRecovery).toMatchObject({ active: true, amount: 85 })
    expect(runtime.snapshot().echoes.carried).toBe(0)

    runtime.requestRespawn(RESPAWN)
    // Die with zero carried → prior recovery lost, no new marker.
    runtime.applyPlayerDamage(999)
    expect(runtime.snapshot().echoRecovery.active).toBe(false)
    expect(runtime.snapshot().echoes.carried).toBe(0)
  })
})
