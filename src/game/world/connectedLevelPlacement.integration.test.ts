import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { GameRuntime } from '../runtime/GameRuntime'
import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from './checkpoint'

const INTERACT = { type: 'player-world-interaction' as const }
const RESPAWN = { type: 'player-respawn' as const }

describe('connected-level checkpoint, shortcut, and encounter placement', () => {
  it('activates the authored checkpoint and preserves an opened shortcut through death and save', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition(CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition)
    expect(runtime.requestWorldInteraction(INTERACT)).toMatchObject({
      kind: 'checkpoint',
      result: { accepted: true, checkpointId: 'checkpoint.m5.refuge' },
    })
    runtime.debugSetPlayerPosition({ x: -2, y: 0.82, z: -1.2 })
    expect(runtime.requestWorldInteraction(INTERACT)).toMatchObject({
      kind: 'shortcut',
      result: { accepted: true, changed: true },
    })
    runtime.applyPlayerDamage(999)
    expect(runtime.requestRespawn(RESPAWN)).toMatchObject({ accepted: true })
    expect(runtime.snapshot().world.openedShortcutIds).toEqual([
      'connection.shortcut-checkpoint-mixed',
    ])

    const restored = new GameRuntime()
    restored.applySave(runtime.captureSave())
    expect(restored.snapshot()).toMatchObject({
      checkpoint: { currentCheckpointId: 'checkpoint.m5.refuge' },
      world: { openedShortcutIds: ['connection.shortcut-checkpoint-mixed'] },
    })
  })

  it('resets enemies without granting Echoes or duplicating collected loot', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition(CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition)
    runtime.requestCheckpointInteraction({ type: 'player-checkpoint-interaction' })
    runtime.debugDefeatEnemy('enemy.skirmisher.1')
    expect(runtime.snapshot().echoes.carried).toBe(25)
    runtime.debugSetPlayerPosition(runtime.snapshot().lootPickup.position!)
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    expect(runtime.snapshot().inventory.entries).toContainEqual({
      itemId: 'item.weapon.oathblade',
      quantity: 1,
    })

    runtime.debugSetPlayerPosition(CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition)
    runtime.requestCheckpointInteraction({ type: 'player-checkpoint-interaction' })
    expect(runtime.snapshot().echoes.carried).toBe(25)
    expect(runtime.snapshot().enemies.every((enemy) => enemy.alive)).toBe(true)
    runtime.debugDefeatEnemy('enemy.skirmisher.1')
    expect(runtime.snapshot().lootPickup.active).toBe(false)
  })

  it('opens the final gate only after every authored encounter is complete', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: 9.2, y: 0.82, z: -4 })
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    expect(runtime.snapshot().world.finalGateReached).toBe(false)
    for (const enemyId of runtime.enemyIds()) runtime.debugDefeatEnemy(enemyId)
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    expect(runtime.snapshot().world.finalGateReached).toBe(true)
    expect(runtime.captureSave().world.finalGateReached).toBe(true)
  })
})
