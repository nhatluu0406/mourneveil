import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { getItemDefinition } from '../items/itemDefinition'
import { SKIRMISHER_ROLE, BRUTE_ROLE } from '../enemies/enemyRoles'
import type { CharacterCollisionResolver } from './playerMotor'
import {
  BRUTE_LOOT_ITEM_ID,
  GameRuntime,
  SKIRMISHER_LOOT_ITEM_ID,
} from '../runtime/GameRuntime'

const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})

describe('loot inventory and equipment', () => {
  it('looks up authored item definitions', () => {
    expect(getItemDefinition('item.weapon.oathblade')).toMatchObject({
      slot: 'weapon',
      modifiers: { lightDamageBonus: 8, heavyDamageBonus: 12 },
    })
    expect(getItemDefinition('item.charm.vitality')).toMatchObject({
      slot: 'charm',
      modifiers: { maxHealthBonus: 20 },
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

    const lootPos = runtime.snapshot().lootPickup.position!
    runtime.debugSetPlayerPosition({
      x: lootPos.x,
      y: 0.82,
      z: lootPos.z,
    })
    for (let step = 0; step < 5; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
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

    expect(runtime.equipItem('item.weapon.practice-edge')).toEqual({
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
    const charmPos = runtime.snapshot().lootPickup.position!
    runtime.debugSetPlayerPosition({ x: charmPos.x, y: 0.82, z: charmPos.z })
    for (let step = 0; step < 5; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    expect(runtime.equipItem(BRUTE_LOOT_ITEM_ID)).toMatchObject({ accepted: true })
    expect(runtime.snapshot().playerHealth.health.maximum).toBe(120)
    runtime.snapshot()
    // Fill current near max then unequip to clamp
    runtime.restorePlayerForDevelopment()
    expect(runtime.snapshot().playerHealth.health.current).toBe(120)
    expect(runtime.unequipSlot('charm')).toMatchObject({ accepted: true })
    expect(runtime.snapshot().playerHealth.health).toMatchObject({
      maximum: 100,
      current: 100,
    })
  })
})
