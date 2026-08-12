import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../runtime/GameRuntime'
import { GameSaveService, MemorySaveStorage } from '../save/gameSaveService'
import { BOSS_RUNTIME_ID } from '../enemies/bossKit'
import { PLAYER_MAXIMUM_HEALTH } from './playerHealth'
import { PLAYER_GUARD_IMPACT_THRESHOLD } from '../combat/playerDefense'

describe('progression integration', () => {
  it('grants XP once per defeat, levels, allocates, and composes with charms', () => {
    const runtime = new GameRuntime()
    expect(runtime.snapshot().progression).toMatchObject({
      level: 1,
      experience: 0,
      unspentPoints: 0,
    })
    expect(runtime.snapshot().playerHealth.health.maximum).toBe(PLAYER_MAXIMUM_HEALTH)
    expect(runtime.snapshot().defense.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD)

    runtime.debugDefeatEnemy('enemy.skirmisher.1')
    expect(runtime.snapshot().progression.experience).toBe(25)
    runtime.debugDefeatEnemy('enemy.skirmisher.1')
    expect(runtime.snapshot().progression.experience).toBe(25)

    runtime.debugDefeatEnemy('enemy.skirmisher.pressure')
    expect(runtime.snapshot().progression).toMatchObject({
      experience: 50,
      level: 2,
      unspentPoints: 1,
    })

    expect(runtime.allocateProgression('unknown').accepted).toBe(false)
    expect(runtime.allocateProgression('vitality')).toMatchObject({ accepted: true })
    expect(runtime.snapshot().playerHealth.health.maximum).toBe(PLAYER_MAXIMUM_HEALTH + 10)
    expect(runtime.snapshot().progression.unspentPoints).toBe(0)

    runtime.debugDefeatEnemy('enemy.brute.1')
    // pickup vitality charm
    const loot = runtime.snapshot().lootPickup
    expect(loot.itemId).toBe('item.charm.vitality')
    runtime.debugSetPlayerPosition(loot.position!)
    runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    runtime.equipItem('item.charm.vitality')
    expect(runtime.snapshot().playerHealth.health.maximum).toBe(PLAYER_MAXIMUM_HEALTH + 10 + 20)

    runtime.unequipSlot('charm')
    expect(runtime.snapshot().playerHealth.health.maximum).toBe(PLAYER_MAXIMUM_HEALTH + 10)

    // Spend another point into resolve after more XP (brute 60 → total 110 → still level 2)
    expect(runtime.snapshot().progression.level).toBe(2)
    runtime.debugDefeatEnemy(BOSS_RUNTIME_ID)
    // 110 + 200 = 310 → level 4 (thresholds 50/120/220/350)
    expect(runtime.snapshot().progression.level).toBe(4)
    expect(runtime.snapshot().progression.unspentPoints).toBe(2)
    expect(runtime.allocateProgression('resolve')).toMatchObject({ accepted: true })
    expect(runtime.snapshot().defense.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD + 1)

    // Ward seal stacks with resolve
    runtime.debugSetPlayerPosition(runtime.snapshot().lootPickup.position ?? runtime.snapshot().player.position)
    // pressure loot may already be collected; grant ward via inventory restore path
    const save = runtime.captureSave()
    runtime.applySave({
      ...save,
      inventory: [
        ...save.inventory,
        ...(save.inventory.some((e) => e.itemId === 'item.charm.ward-seal')
          ? []
          : [{ itemId: 'item.charm.ward-seal', quantity: 1 }]),
      ],
    })
    runtime.equipItem('item.charm.ward-seal')
    expect(runtime.snapshot().defense.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD + 1 + 1)
  })

  it('persists progression across save/load and death/respawn', () => {
    const runtime = new GameRuntime()
    runtime.debugDefeatEnemy('enemy.skirmisher.1')
    runtime.debugDefeatEnemy('enemy.skirmisher.pressure')
    runtime.allocateProgression('might')
    expect(runtime.resolvedAttackDamage()).toEqual({ light: 22, heavy: 38 })

    const beforeDeath = runtime.captureSave()
    runtime.debugSetPlayerPosition(runtime.snapshot().checkpoint.respawnPosition)
    runtime.requestCheckpointInteraction({ type: 'player-checkpoint-interaction' })
    runtime.applyPlayerDamage(999)
    expect(runtime.snapshot().playerHealth.lifeState).toBe('dead')
    expect(runtime.snapshot().progression.level).toBe(2)
    expect(runtime.snapshot().progression.allocation.might).toBe(1)

    runtime.requestRespawn({ type: 'player-respawn' })
    expect(runtime.snapshot().progression).toMatchObject({
      level: 2,
      experience: 50,
      allocation: { might: 1 },
    })
    expect(runtime.resolvedAttackDamage()).toEqual({ light: 22, heavy: 38 })

    const service = new GameSaveService(new MemorySaveStorage())
    service.save(beforeDeath)
    const restored = new GameRuntime()
    const loaded = service.load()
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    restored.applySave(loaded.save)
    expect(restored.snapshot().progression).toMatchObject({
      level: 2,
      experience: 50,
      unspentPoints: 0,
      allocation: { might: 1 },
    })
    expect(restored.resolvedAttackDamage()).toEqual({ light: 22, heavy: 38 })
  })

  it('does not duplicate boss XP after persistent defeat reload', () => {
    const runtime = new GameRuntime()
    runtime.debugDefeatEnemy(BOSS_RUNTIME_ID)
    const xp = runtime.snapshot().progression.experience
    expect(xp).toBe(200)
    const save = runtime.captureSave()
    runtime.applySave(save)
    expect(runtime.snapshot().world.defeatedBossIds.length).toBe(1)
    runtime.debugDefeatEnemy(BOSS_RUNTIME_ID)
    // Boss remains dead; grant path may run but XP set was cleared on applySave.
    // Persistent boss stay-dead means debugDefeatEnemy sees !alive and still calls grant.
    // Session sets cleared on applySave — second grant would re-award unless we skip
    // when boss already persisted defeated. Assert current intended: no re-award when
    // already in defeatedBossIds AND already dead from persistence.
    expect(runtime.snapshot().progression.experience).toBe(xp)
  })
})
