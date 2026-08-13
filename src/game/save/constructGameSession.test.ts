import { describe, expect, it } from 'vitest'
import { BOSS_RUNTIME_ID, BOSS_TECHNICAL_ID } from '../enemies/bossKit'
import { GameRuntime } from '../runtime/GameRuntime'
import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../world/checkpoint'
import { constructGameSession } from './constructGameSession'
import { GameSaveService, MemorySaveStorage } from './gameSaveService'
import { createDefaultSaveV4 } from './saveSchema'

describe('constructGameSession', () => {
  it('Continue restores a defeated boss; New Rite starts a living rite', () => {
    const seed = new GameRuntime()
    seed.applySave({
      ...createDefaultSaveV4(),
      checkpointActivated: true,
      activeCheckpointId: CONNECTED_LEVEL_CHECKPOINT_DEFINITION.id,
      world: {
        openedShortcutIds: [],
        finalGateReached: true,
        defeatedBossIds: [],
      },
    })
    seed.debugSetPlayerPosition({ x: 13, y: 0.82, z: -3 })
    seed.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    seed.debugDefeatEnemy(BOSS_RUNTIME_ID)
    const completed = seed.captureSave()
    expect(completed.world.defeatedBossIds).toContain(BOSS_TECHNICAL_ID)

    const storage = new MemorySaveStorage()
    const saves = new GameSaveService(storage)
    saves.save(completed)

    const continued = constructGameSession('continue', saves)
    expect(continued.snapshot().world.defeatedBossIds).toContain(BOSS_TECHNICAL_ID)
    expect(continued.snapshot().enemies.find((enemy) => enemy.id === BOSS_RUNTIME_ID)?.alive).toBe(false)

    const fresh = constructGameSession('new-rite', saves)
    expect(saves.hasValidSave()).toBe(false)
    expect(fresh.snapshot().world.defeatedBossIds).toEqual([])
    expect(fresh.snapshot().enemies.find((enemy) => enemy.id === BOSS_RUNTIME_ID)?.alive).toBe(true)
    expect(fresh.snapshot().progression.level).toBe(1)
  })
})
