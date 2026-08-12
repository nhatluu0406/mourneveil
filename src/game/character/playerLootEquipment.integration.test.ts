import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { getItemDefinition } from '../items/itemDefinition'
import { PLAYER_GUARD_IMPACT_THRESHOLD } from '../combat/playerDefense'
import { SKIRMISHER_ROLE, BRUTE_ROLE } from '../enemies/enemyRoles'
import type { CharacterCollisionResolver } from './playerMotor'
import {
  BRUTE_LOOT_ITEM_ID,
  GameRuntime,
  INTRO_LOOT_ITEM_ID,
  MIXED_CLEAR_LOOT_ITEM_ID,
  PRESSURE_CLEAR_LOOT_ITEM_ID,
  PRESSURE_LOOT_ITEM_ID,
  SKIRMISHER_LOOT_ITEM_ID,
} from '../runtime/GameRuntime'
import { PLAYER_SKILL_USE_REQUEST } from '../../input/playerSkillIntent'
import { FIRST_RUN_DISCOVERABLE_ITEM_IDS } from '../items/lootTables'

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

describe('loot inventory and equipment MB2', () => {
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

  it('exposes the authored first-run journey of at least six items', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)

    runtime.debugDefeatEnemy('enemy.skirmisher.introduction')
    expect(runtime.snapshot().lootPickup.itemId).toBe(INTRO_LOOT_ITEM_ID)
    pickupActiveLoot(runtime)

    runtime.debugDefeatEnemy(SKIRMISHER_ROLE.runtimeId)
    expect(runtime.snapshot().lootPickup.itemId).toBe(SKIRMISHER_LOOT_ITEM_ID)
    pickupActiveLoot(runtime)

    runtime.debugDefeatEnemy(BRUTE_ROLE.runtimeId)
    expect(runtime.snapshot().lootPickup.itemId).toBe(BRUTE_LOOT_ITEM_ID)
    pickupActiveLoot(runtime)
    expect(
      runtime.snapshot().inventory.entries.some((entry) => entry.itemId === MIXED_CLEAR_LOOT_ITEM_ID),
    ).toBe(true)

    runtime.debugDefeatEnemy('enemy.skirmisher.pressure')
    expect(runtime.snapshot().lootPickup.itemId).toBe(PRESSURE_LOOT_ITEM_ID)
    pickupActiveLoot(runtime)
    expect(
      runtime
        .snapshot()
        .inventory.entries.some((entry) => entry.itemId === PRESSURE_CLEAR_LOOT_ITEM_ID),
    ).toBe(true)

    runtime.debugDefeatEnemy('enemy.boss.sepulchre.1')
    expect(runtime.snapshot().lootPickup.itemId).toBe('item.charm.ash-circlet')
    pickupActiveLoot(runtime)

    const owned = new Set(runtime.snapshot().inventory.entries.map((entry) => entry.itemId))
    for (const id of FIRST_RUN_DISCOVERABLE_ITEM_IDS) {
      expect(owned.has(id)).toBe(true)
    }
    expect(owned.size).toBeGreaterThanOrEqual(6)
  })

  it('blocks equipment swaps during committed combat and applies skill cooldown clamps', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)
    runtime.debugGrantItem(SKIRMISHER_LOOT_ITEM_ID)
    runtime.debugGrantItem('item.weapon.veil-thorn')
    runtime.debugGrantItem('item.charm.ash-circlet')
    expect(runtime.equipItem(SKIRMISHER_LOOT_ITEM_ID)).toMatchObject({ accepted: true })
    expect(runtime.equipItem('item.charm.ash-circlet')).toMatchObject({ accepted: true })

    runtime.requestPlayerAttack({
      type: 'player-attack',
      attack: 'light',
      aimDirection: { x: 0, z: -1 },
    })
    expect(runtime.snapshot().combat.phase).not.toBe('idle')
    expect(runtime.equipItem('item.weapon.veil-thorn')).toEqual({
      accepted: false,
      reason: 'combat-busy',
    })
    while (runtime.snapshot().combat.phase !== 'idle') {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }

    expect(runtime.equipItem('item.weapon.veil-thorn')).toMatchObject({ accepted: true })
    runtime.equipSkill('skill.veil-step')
    const used = runtime.requestPlayerSkillUse(PLAYER_SKILL_USE_REQUEST, {
      horizontal: 0,
      forward: 1,
    })
    expect(used.accepted).toBe(true)
    while (runtime.snapshot().combat.phase !== 'idle') {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    // Base 180 + veil (-30) + ash (-24) = 126
    expect(runtime.snapshot().skills.cooldownRemainingSteps).toBe(126)
  })

  it('creates vitality vs ward tradeoff without global dominance', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)
    runtime.debugGrantItem(INTRO_LOOT_ITEM_ID)
    runtime.debugGrantItem(PRESSURE_LOOT_ITEM_ID)

    expect(runtime.equipItem(INTRO_LOOT_ITEM_ID)).toMatchObject({ accepted: true })
    const vitality = runtime.snapshot()
    expect(vitality.playerHealth.health.maximum).toBe(120)
    expect(vitality.defense.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD)

    expect(runtime.equipItem(PRESSURE_LOOT_ITEM_ID)).toMatchObject({ accepted: true })
    const ward = runtime.snapshot()
    expect(ward.playerHealth.health.maximum).toBe(100)
    expect(ward.defense.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD + 1)
    expect(vitality.playerHealth.health.maximum).toBeGreaterThan(ward.playerHealth.health.maximum)
    expect(ward.defense.guardImpactThreshold).toBeGreaterThan(vitality.defense.guardImpactThreshold)
  })

  it('persists equipment and does not re-grant encounter clear rewards after reload', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(FLAT_GROUND)
    runtime.debugDefeatEnemy(SKIRMISHER_ROLE.runtimeId)
    pickupActiveLoot(runtime)
    runtime.debugDefeatEnemy(BRUTE_ROLE.runtimeId)
    pickupActiveLoot(runtime)
    expect(runtime.snapshot().inventory.entries.some((e) => e.itemId === MIXED_CLEAR_LOOT_ITEM_ID)).toBe(
      true,
    )
    runtime.equipItem(BRUTE_LOOT_ITEM_ID)
    runtime.equipItem(MIXED_CLEAR_LOOT_ITEM_ID)

    const save = runtime.captureSave()
    const restored = new GameRuntime()
    restored.attachCollisionResolver(FLAT_GROUND)
    restored.applySave(save)
    const inventoryBefore = restored.snapshot().inventory.entries.map((e) => e.itemId).sort()
    restored.debugDefeatEnemy(SKIRMISHER_ROLE.runtimeId)
    restored.debugDefeatEnemy(BRUTE_ROLE.runtimeId)
    expect(
      restored.snapshot().inventory.entries.find((e) => e.itemId === MIXED_CLEAR_LOOT_ITEM_ID)
        ?.quantity,
    ).toBe(1)
    expect(restored.snapshot().inventory.entries.map((e) => e.itemId).sort()).toEqual(inventoryBefore)
    expect(restored.snapshot().equipment.weaponItemId).toBe(BRUTE_LOOT_ITEM_ID)
  })

  it('rejects unknown item ids on equip', () => {
    const runtime = new GameRuntime()
    expect(runtime.equipItem('item.charm.not-real')).toEqual({
      accepted: false,
      reason: 'unknown-item',
    })
  })
})
