import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../runtime/GameRuntime'
import { GameSaveService, MemorySaveStorage } from './gameSaveService'
import { migrateAndValidateSave } from './migrateSave'
import {
  createDefaultSaveV1,
  createDefaultSaveV2,
  createDefaultSaveV3,
  type SaveFileV3,
} from './saveSchema'

describe('versioned local save', () => {
  it('creates a default V3 save without transient combat fields', () => {
    const save = createDefaultSaveV3()
    expect(save.version).toBe(3)
    expect(save.world).toEqual({ openedShortcutIds: [], finalGateReached: false, defeatedBossIds: [] })
    expect(save.progression).toEqual({
      level: 1,
      experience: 0,
      unspentPoints: 0,
      allocation: { vitality: 0, resolve: 0, might: 0 },
    })
    expect(save).not.toHaveProperty('combat')
    expect(save).not.toHaveProperty('defense')
    expect(save).not.toHaveProperty('camera')
  })

  it('round-trips V3 through storage and restores persistent gameplay facts', () => {
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
    const mid = runtime.captureSave()
    expect(mid.checkpointActivated).toBe(true)
    expect(mid.version).toBe(3)
    expect(mid.echoesCarried).toBe(25)
    expect(mid.progression.experience).toBe(25)
    expect(mid.inventory.some((entry) => entry.itemId === 'item.weapon.oathblade')).toBe(true)
    expect(mid.equipment.weaponItemId).toBe('item.weapon.oathblade')

    runtime.debugSetPlayerPosition({ x: 2, y: 0.82, z: -2 })
    runtime.applyPlayerDamage(999)
    const withRecovery = runtime.captureSave()
    expect(withRecovery.echoRecovery.active).toBe(true)
    expect(withRecovery.echoesCarried).toBe(0)
    expect(withRecovery.progression.experience).toBe(25)

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
      progression: { level: 1, experience: 25, unspentPoints: 0 },
    })
    expect(restored.resolvedAttackDamage()).toEqual({ light: 28, heavy: 47 })
    expect(restored.snapshot().enemies.every((enemy) => enemy.alive)).toBe(true)
  })

  it('migrates V1 and V2 into V3 with default progression', () => {
    expect(migrateAndValidateSave(createDefaultSaveV1())).toEqual({
      ok: true,
      save: createDefaultSaveV3(),
      migratedFromVersion: 1,
    })
    expect(migrateAndValidateSave(createDefaultSaveV2())).toEqual({
      ok: true,
      save: createDefaultSaveV3(),
      migratedFromVersion: 2,
    })
  })

  it('round-trips stable V3 world flags without transient zone state', () => {
    const storage = new MemorySaveStorage()
    const service = new GameSaveService(storage)
    service.save({
      ...createDefaultSaveV3(),
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
        version: 3,
        world: {
          openedShortcutIds: ['connection.shortcut-checkpoint-mixed'],
          finalGateReached: true,
          defeatedBossIds: [],
        },
        progression: { level: 1, experience: 0 },
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
      save: {
        version: 3,
        world: { openedShortcutIds: [], finalGateReached: false, defeatedBossIds: [] },
      },
    })
    const service = new GameSaveService(new MemorySaveStorage())
    service.save({ not: 'a save' } as unknown as SaveFileV3)
    const bad = new MemorySaveStorage()
    bad.writeRaw('{')
    expect(new GameSaveService(bad).load()).toEqual({ ok: false, reason: 'malformed' })
  })
})
