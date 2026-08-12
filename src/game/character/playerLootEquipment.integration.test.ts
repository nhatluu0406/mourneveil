import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { getItemDefinition } from '../items/itemDefinition'
import { PLAYER_GUARD_IMPACT_THRESHOLD } from '../combat/playerDefense'
import { SKIRMISHER_ROLE, BRUTE_ROLE } from '../enemies/enemyRoles'
import type { CharacterCollisionResolver } from './playerMotor'
import {
  BRUTE_LOOT_ITEM_ID,
  GameRuntime,
  PRESSURE_LOOT_ITEM_ID,
  SKIRMISHER_LOOT_ITEM_ID,
} from '../runtime/GameRuntime'

const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})

function pickupActiveLoot(runtime: GameRuntime): void {
  const lootPos = runtime.snapshot().lootPickup.position
  if (lootPos === null) throw new Error('expected active loot')
  runtime.debugSetPlayerPosition({ x: lootPos.x, y: 0.82, z: lootPos.z })
  for (let step = 0; step < 5; step += 1) {
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
  }
}

describe('loot inventory and equipment', () => {
  it('looks up authored item definitions', () => {
    expect(getItemDefinition('item.weapon.oathblade')).toMatchObject({
      slot: 'weapon',
      modifiers: { lightDamageBonus: 8, heavyDamageBonus: 12, guardImpactThresholdBonus: 0 },
    })
    expect(getItemDefinition('item.charm.vitality')).toMatchObject({
      slot: 'charm',
      modifiers: { maxHealthBonus: 20, guardImpactThresholdBonus: 0 },
    })
    expect(getItemDefinition('item.charm.ward-seal')).toMatchObject({
      slot: 'charm',
      modifiers: { maxHealthBonus: 0, guardImpactThresholdBonus: 1 },
    })
    expect(getItemDefinition('missing')).toBeNull()
  })

  it('spawns loot once, picks up once, and equips with ownership and modifiers', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)
    expect(runtime.resolvedAttackDamage()).toEqual({ light: 20, heavy: 35 })

    runtime.debugDefeatEnemy(SKIRMISHER_ROLE.runtimeId)
    expect(runtime.snapshot().lootPickup).toMatchObject({
      active: true,
      itemId: SKIRMISHER_LOOT_ITEM_ID,
    })
    runtime.debugDefeatEnemy(SKIRMISHER_ROLE.runtimeId)
    expect(runtime.snapshot().lootPickup.itemId).toBe(SKIRMISHER_LOOT_ITEM_ID)

    pickupActiveLoot(runtime)
    expect(runtime.snapshot().lootPickup.active).toBe(false)
    expect(runtime.snapshot().inventory.entries).toEqual([
      { itemId: SKIRMISHER_LOOT_ITEM_ID, quantity: 1 },
    ])
    for (let step = 0; step < 5; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    expect(runtime.snapshot().inventory.entries).toEqual([
      { itemId: SKIRMISHER_LOOT_ITEM_ID, quantity: 1 },
    ])

    expect(runtime.equipItem('item.weapon.veil-thorn')).toEqual({
      accepted: false,
      reason: 'not-owned',
    })
    expect(runtime.equipItem(SKIRMISHER_LOOT_ITEM_ID)).toEqual({
      accepted: true,
      slot: 'weapon',
      itemId: SKIRMISHER_LOOT_ITEM_ID,
    })
    expect(runtime.resolvedAttackDamage()).toEqual({ light: 28, heavy: 47 })
    expect(runtime.unequipSlot('weapon')).toMatchObject({ accepted: true })
    expect(runtime.resolvedAttackDamage()).toEqual({ light: 20, heavy: 35 })

    runtime.debugDefeatEnemy(BRUTE_ROLE.runtimeId)
    pickupActiveLoot(runtime)
    expect(runtime.equipItem(BRUTE_LOOT_ITEM_ID)).toMatchObject({ accepted: true })
    expect(runtime.snapshot().playerHealth.health.maximum).toBe(120)
    runtime.restorePlayerForDevelopment()
    expect(runtime.snapshot().playerHealth.health.current).toBe(120)
    expect(runtime.unequipSlot('charm')).toMatchObject({ accepted: true })
    expect(runtime.snapshot().playerHealth.health).toMatchObject({
      maximum: 100,
      current: 100,
    })
  })

  it('creates a vitality vs ward tradeoff without global dominance', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)

    const base = runtime.snapshot()
    expect(base.playerHealth.health.maximum).toBe(100)
    expect(base.defense.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD)

    runtime.debugDefeatEnemy(BRUTE_ROLE.runtimeId)
    pickupActiveLoot(runtime)
    runtime.debugDefeatEnemy('enemy.skirmisher.pressure')
    pickupActiveLoot(runtime)

    expect(runtime.equipItem(BRUTE_LOOT_ITEM_ID)).toMatchObject({ accepted: true })
    const vitality = runtime.snapshot()
    expect(vitality.playerHealth.health.maximum).toBe(120)
    expect(vitality.defense.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD)
    expect(vitality.equipment.modifiers.guardImpactThresholdBonus).toBe(0)

    expect(runtime.equipItem(PRESSURE_LOOT_ITEM_ID)).toMatchObject({ accepted: true })
    const ward = runtime.snapshot()
    expect(ward.playerHealth.health.maximum).toBe(100)
    expect(ward.defense.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD + 1)
    expect(ward.equipment.modifiers.maxHealthBonus).toBe(0)

    // Neither option dominates both axes.
    expect(vitality.playerHealth.health.maximum).toBeGreaterThan(ward.playerHealth.health.maximum)
    expect(ward.defense.guardImpactThreshold).toBeGreaterThan(vitality.defense.guardImpactThreshold)
  })

  it('persists acquired and equipped ward seal through save restore', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)
    runtime.debugDefeatEnemy('enemy.skirmisher.pressure')
    pickupActiveLoot(runtime)
    expect(runtime.equipItem(PRESSURE_LOOT_ITEM_ID)).toMatchObject({ accepted: true })

    const save = runtime.captureSave()
    expect(save.inventory.some((entry) => entry.itemId === PRESSURE_LOOT_ITEM_ID)).toBe(true)
    expect(save.equipment.charmItemId).toBe(PRESSURE_LOOT_ITEM_ID)

    const restored = new GameRuntime()
    restored.attachCollisionResolver(FLAT_GROUND)
    restored.applySave(save)
    expect(restored.snapshot().equipment.charmItemId).toBe(PRESSURE_LOOT_ITEM_ID)
    expect(restored.snapshot().defense.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD + 1)
    expect(restored.snapshot().inventory.entries.some((entry) => entry.itemId === PRESSURE_LOOT_ITEM_ID)).toBe(
      true,
    )
  })

  it('rejects unknown item ids on equip', () => {
    const runtime = new GameRuntime()
    expect(runtime.equipItem('item.charm.not-real')).toEqual({
      accepted: false,
      reason: 'unknown-item',
    })
  })
})
