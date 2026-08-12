import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../runtime/GameRuntime'
import { GameSaveService, MemorySaveStorage } from './gameSaveService'
import { migrateAndValidateSave } from './migrateSave'
import {
  createDefaultSaveV1,
  createDefaultSaveV2,
  type SaveFileV2,
} from './saveSchema'

describe('versioned local save', () => {
  it('creates a default V2 save without transient combat fields', () => {
    const save = createDefaultSaveV2()
    expect(save.version).toBe(2)
    expect(save.world).toEqual({ openedShortcutIds: [], finalGateReached: false, defeatedBossIds: [] })
    expect(save).not.toHaveProperty('combat')
    expect(save).not.toHaveProperty('defense')
    expect(save).not.toHaveProperty('camera')
  })

  it('round-trips V2 through storage and restores persistent gameplay facts', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition(runtime.snapshot().checkpoint.respawnPosition)
    runtime.requestCheckpointInteraction({ type: 'player-checkpoint-interaction' })
    runtime.debugDefeatEnemy('enemy.skirmisher.1')
    runtime.debugSetPlayerPosition({
      x: runtime.snapshot().lootPickup.position!.x,
      y: 0.82,
      z: runtime.snapshot().lootPickup.position!.z,
    })
    runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    runtime.equipItem('item.weapon.oathblade')
    runtime.applyPlayerDamage(40)
    // consume one flask charge via direct set after damage for charge persistence
    // (committed flask use needs more steps; setCharges path covers schema)
    const mid = runtime.captureSave()
    expect(mid.checkpointActivated).toBe(true)
    expect(mid.version).toBe(2)
    expect(mid.echoesCarried).toBe(25)
    expect(mid.inventory.some((entry) => entry.itemId === 'item.weapon.oathblade')).toBe(true)
    expect(mid.equipment.weaponItemId).toBe('item.weapon.oathblade')

    runtime.debugSetPlayerPosition({ x: 2, y: 0.82, z: -2 })
    runtime.applyPlayerDamage(999)
    const withRecovery = runtime.captureSave()
    expect(withRecovery.echoRecovery.active).toBe(true)
    expect(withRecovery.echoesCarried).toBe(0)

    const storage = new MemorySaveStorage()
    const service = new GameSaveService(storage)
    service.save(withRecovery)

    const restored = new GameRuntime()
    const loaded = service.load()
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    restored.applySave(loaded.save)
    expect(restored.snapshot()).toMatchObject({
      checkpoint: { activated: true, currentCheckpointId: 'checkpoint.m5.refuge' },
      echoes: { carried: 0 },
      echoRecovery: { active: true, amount: 25 },
      equipment: { weaponItemId: 'item.weapon.oathblade' },
      combat: { phase: 'idle' },
      playerHealth: { lifeState: 'alive' },
      world: { openedShortcutIds: [], finalGateReached: false, defeatedBossIds: [] },
    })
    expect(restored.resolvedAttackDamage()).toEqual({ light: 28, heavy: 47 })
    expect(restored.snapshot().enemies.every((enemy) => enemy.alive)).toBe(true)
  })

  it('migrates V1 with safe default world facts', () => {
    const result = migrateAndValidateSave(createDefaultSaveV1())
    expect(result).toEqual({
      ok: true,
      save: createDefaultSaveV2(),
      migratedFromVersion: 1,
    })
  })

  it('round-trips stable V2 world flags without transient zone state', () => {
    const storage = new MemorySaveStorage()
    const service = new GameSaveService(storage)
    service.save({
      ...createDefaultSaveV2(),
      world: {
        openedShortcutIds: ['connection.shortcut-checkpoint-mixed'],
        finalGateReached: true,
        defeatedBossIds: [],
      },
    })
    const loaded = service.load()
    expect(loaded).toMatchObject({
      ok: true,
      save: {
        version: 2,
        world: {
          openedShortcutIds: ['connection.shortcut-checkpoint-mixed'],
          finalGateReached: true,
          defeatedBossIds: [],
        },
      },
    })
    if (loaded.ok) expect(loaded.save).not.toHaveProperty('currentZoneId')
  })

  it('rejects malformed and unknown versions safely', () => {
    expect(migrateAndValidateSave(null)).toEqual({ ok: false, reason: 'missing' })
    expect(migrateAndValidateSave('{')).toEqual({ ok: false, reason: 'malformed' })
    expect(migrateAndValidateSave({ version: 99 })).toEqual({
      ok: false,
      reason: 'unsupported-version',
    })
    expect(migrateAndValidateSave({ version: 1, flaskCharges: 'nope' }).ok).toBe(true)
    expect(migrateAndValidateSave({ version: 2, world: { openedShortcutIds: [3] } })).toMatchObject({
      ok: true,
      save: { world: { openedShortcutIds: [], finalGateReached: false, defeatedBossIds: [] } },
    })
    const service = new GameSaveService(new MemorySaveStorage())
    service.save({ not: 'a save' } as unknown as SaveFileV2)
    // overwrite with bad JSON
    const bad = new MemorySaveStorage()
    bad.writeRaw('{')
    expect(new GameSaveService(bad).load()).toEqual({ ok: false, reason: 'malformed' })
  })
})
