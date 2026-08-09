import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import type { CharacterCollisionResolver } from '../character/playerMotor'
import { GameRuntime } from '../runtime/GameRuntime'
import { MOURNEVEIL_CONNECTED_LEVEL } from './connectedLevel'
import { M5_ENEMY_PLACEMENTS } from '../encounters/connectedLevelEncounters'

const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})
const NEUTRAL = { horizontal: 0, forward: 0 } as const

const SAFE_ZONE_POINTS: ReadonlyArray<{
  readonly zoneId: string
  readonly position: { x: number; y: number; z: number }
}> = [
  { zoneId: 'zone.arrival', position: { x: -14, y: 0.82, z: 6 } },
  { zoneId: 'zone.first-combat', position: { x: -11.2, y: 0.82, z: 1.2 } },
  { zoneId: 'zone.checkpoint', position: { x: -5.5, y: 0.82, z: 0 } },
  { zoneId: 'zone.mixed-combat', position: { x: 0, y: 0.82, z: -6.2 } },
  { zoneId: 'zone.final-approach', position: { x: 8.5, y: 0.82, z: -3.5 } },
  { zoneId: 'zone.final-arena', position: { x: 13, y: 0.82, z: -4 } },
]

function attachAlwaysHitPlayer(runtime: GameRuntime): void {
  runtime.attachCollisionResolver(FLAT_GROUND)
  for (const enemy of runtime.snapshot().enemies) {
    runtime.attachEnemyCollisionResolver(enemy.id, FLAT_GROUND)
  }
  runtime.attachCombatContactQuery(({ hurtboxes }) =>
    hurtboxes
      .filter((hurtbox) => hurtbox.ownerId === 'player')
      .map((hurtbox) => ({ hurtboxId: hurtbox.id, targetId: hurtbox.ownerId })),
  )
}

function defeatAll(runtime: GameRuntime): void {
  for (const enemy of runtime.snapshot().enemies) {
    if (enemy.alive) runtime.debugDefeatEnemy(enemy.id)
  }
}

function soak(runtime: GameRuntime, steps: number): void {
  for (let step = 0; step < steps; step += 1) {
    runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL)
  }
}

describe('M5.6.2 regional damage attribution', () => {
  it('does not invent an environmental hazard system in authored level data', () => {
    for (const zone of MOURNEVEIL_CONNECTED_LEVEL.zones) {
      expect(zone).not.toHaveProperty('hazardId')
      expect(zone).not.toHaveProperty('damagePerStep')
    }
    expect(M5_ENEMY_PLACEMENTS.some((placement) => placement.encounterId === 'encounter.m5.pressure')).toBe(
      true,
    )
  })

  it('leaves HP unchanged in every authored zone when hostiles are defeated', () => {
    for (const point of SAFE_ZONE_POINTS) {
      const runtime = new GameRuntime()
      attachAlwaysHitPlayer(runtime)
      defeatAll(runtime)
      runtime.restorePlayerForDevelopment()
      runtime.debugSetPlayerPosition(point.position)
      const before = runtime.snapshot().playerHealth.health.current
      soak(runtime, 360)
      expect(runtime.snapshot().playerHealth.health.current, point.zoneId).toBe(before)
      expect(runtime.snapshot().incomingContact.totalHitCount, point.zoneId).toBe(0)
    }
  })

  it('never damages the player from inactive encounter enemies', () => {
    const runtime = new GameRuntime()
    attachAlwaysHitPlayer(runtime)
    // Stay in arrival: introduction remains inactive despite always-hit contact query.
    runtime.debugSetPlayerPosition({ x: -14, y: 0.82, z: 6 })
    const before = runtime.snapshot().playerHealth.health.current
    soak(runtime, 360)
    expect(runtime.snapshot().playerHealth.health.current).toBe(before)
    expect(runtime.snapshot().encounterActivation.activatedEncounterIds).toEqual([])
    expect(
      runtime.snapshot().enemies.find((enemy) => enemy.id === 'enemy.skirmisher.introduction')?.state,
    ).toBe('idle')
  })

  it('never damages the player from defeated enemies in an activated zone', () => {
    const runtime = new GameRuntime()
    attachAlwaysHitPlayer(runtime)
    runtime.debugDefeatEnemy('enemy.skirmisher.pressure')
    runtime.restorePlayerForDevelopment()
    runtime.debugSetPlayerPosition({ x: 7.6, y: 0.82, z: -3.4 })
    soak(runtime, 30)
    expect(runtime.snapshot().encounterActivation.activatedEncounterIds).toContain(
      'encounter.m5.pressure',
    )
    const before = runtime.snapshot().playerHealth.health.current
    const hitsBefore = runtime.snapshot().incomingContact.totalHitCount
    soak(runtime, 360)
    expect(runtime.snapshot().playerHealth.health.current).toBe(before)
    expect(runtime.snapshot().incomingContact.totalHitCount).toBe(hitsBefore)
    expect(
      runtime.snapshot().enemies.find((enemy) => enemy.id === 'enemy.skirmisher.pressure')?.alive,
    ).toBe(false)
  })

  it('attributes final-approach damage only to the authored pressure skirmisher', () => {
    const runtime = new GameRuntime()
    attachAlwaysHitPlayer(runtime)
    runtime.debugSetPlayerPosition({ x: 7.2, y: 0.82, z: -3.5 })
    let hit = null
    for (let step = 0; step < 480; step += 1) {
      const events = runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL).incomingHitEvents
      if (events.length > 0) {
        hit = events[0]
        break
      }
    }
    expect(hit).toMatchObject({
      attackerId: 'enemy.skirmisher.pressure',
      targetId: 'player',
      outcome: 'damaged',
      appliedDamage: 10,
    })
    expect(runtime.snapshot().playerHealth.health.current).toBe(90)
  })

  it('applies exactly one hit per pressure execution', () => {
    const runtime = new GameRuntime()
    attachAlwaysHitPlayer(runtime)
    runtime.debugSetPlayerPosition({ x: 7.2, y: 0.82, z: -3.5 })
    let firstExecutionId: number | null = null
    let hitsForExecution = 0
    for (let step = 0; step < 600; step += 1) {
      const events = runtime.advanceFrame(FIXED_STEP_SECONDS, NEUTRAL).incomingHitEvents
      for (const event of events) {
        if (event.attackerId !== 'enemy.skirmisher.pressure') continue
        if (firstExecutionId === null) firstExecutionId = event.executionId
        if (event.executionId === firstExecutionId) hitsForExecution += 1
      }
      if (firstExecutionId !== null && runtime.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.pressure')?.action.phase === 'idle') {
        break
      }
    }
    expect(firstExecutionId).not.toBeNull()
    expect(hitsForExecution).toBe(1)
  })

  it('does not duplicate damage sources across save/reload or respawn', () => {
    const runtime = new GameRuntime()
    attachAlwaysHitPlayer(runtime)
    runtime.debugSetPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
    runtime.requestCheckpointInteraction({ type: 'player-checkpoint-interaction' })
    expect(runtime.snapshot().enemies).toHaveLength(M5_ENEMY_PLACEMENTS.length)

    const serialized = runtime.captureSave()
    const restored = new GameRuntime()
    attachAlwaysHitPlayer(restored)
    restored.applySave(serialized)
    expect(restored.snapshot().enemies).toHaveLength(M5_ENEMY_PLACEMENTS.length)
    expect(new Set(restored.snapshot().enemies.map((enemy) => enemy.id)).size).toBe(
      M5_ENEMY_PLACEMENTS.length,
    )

    restored.applyPlayerDamage(999)
    restored.requestRespawn({ type: 'player-respawn' })
    expect(restored.snapshot().enemies).toHaveLength(M5_ENEMY_PLACEMENTS.length)
    expect(new Set(restored.snapshot().enemies.map((enemy) => enemy.id)).size).toBe(
      M5_ENEMY_PLACEMENTS.length,
    )
  })
})
