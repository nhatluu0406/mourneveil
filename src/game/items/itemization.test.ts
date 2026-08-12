import { describe, expect, it } from 'vitest'
import {
  ITEM_DEFINITIONS,
  effectiveActiveSkillCooldownSteps,
  effectiveFlaskHealAmount,
  getItemDefinition,
  sumItemModifiers,
  ZERO_ITEM_MODIFIERS,
} from './itemDefinition'
import { compareItemToEquipped } from './itemComparison'
import { resolveLootTable } from './lootTables'

describe('M14 item definitions', () => {
  it('authors eight equippable gameplay items with presentation hooks', () => {
    expect(ITEM_DEFINITIONS).toHaveLength(8)
    for (const item of ITEM_DEFINITIONS) {
      expect(item.slot).toMatch(/weapon|charm/)
      expect(item.unique).toBe(true)
      expect(item.presentation.iconKey.length).toBeGreaterThan(0)
      expect(item.presentation.visualKey.length).toBeGreaterThan(0)
      expect(item.presentation.pickupSemantic.length).toBeGreaterThan(0)
      expect(item.presentation.equipSemantic.length).toBeGreaterThan(0)
    }
  })

  it('keeps modifier vocabulary typed and composable', () => {
    const veil = getItemDefinition('item.weapon.veil-thorn')!
    const ash = getItemDefinition('item.charm.ash-circlet')!
    const sum = sumItemModifiers(veil.modifiers, ash.modifiers)
    expect(sum.activeSkillCooldownStepDelta).toBe(-54)
    expect(effectiveActiveSkillCooldownSteps(180, sum)).toBe(126)
    expect(effectiveFlaskHealAmount(40, getItemDefinition('item.charm.mourning-phial')!.modifiers)).toBe(58)
    expect(sumItemModifiers(ZERO_ITEM_MODIFIERS, ZERO_ITEM_MODIFIERS)).toEqual(ZERO_ITEM_MODIFIERS)
  })

  it('exposes canonical comparison gains and losses', () => {
    const comparison = compareItemToEquipped(
      'item.charm.ward-seal',
      null,
      'item.charm.vitality',
    )
    expect(comparison).toMatchObject({
      slot: 'charm',
      equippedId: 'item.charm.vitality',
    })
    expect(comparison?.gains.some((entry) => entry.key === 'guardImpactThresholdBonus')).toBe(true)
    expect(comparison?.losses.some((entry) => entry.key === 'maxHealthBonus')).toBe(true)

    const skillWeapon = compareItemToEquipped(
      'item.weapon.veil-thorn',
      'item.weapon.oathblade',
      null,
    )
    expect(skillWeapon?.gains.some((entry) => entry.key === 'activeSkillCooldownStepDelta')).toBe(
      true,
    )
    expect(skillWeapon?.losses.some((entry) => entry.key === 'lightDamageBonus')).toBe(true)
  })

  it('resolves loot tables deterministically without randomness', () => {
    expect(resolveLootTable('loot.skirmisher-early', [])).toEqual({
      kind: 'item',
      itemId: 'item.weapon.oathblade',
      tableId: 'loot.skirmisher-early',
    })
    expect(
      resolveLootTable('loot.skirmisher-early', ['item.weapon.oathblade']),
    ).toEqual({
      kind: 'item',
      itemId: 'item.weapon.veil-thorn',
      tableId: 'loot.skirmisher-early',
    })
    expect(
      resolveLootTable('loot.skirmisher-early', [
        'item.weapon.oathblade',
        'item.weapon.veil-thorn',
        'item.weapon.gravebrand',
      ]),
    ).toEqual({
      kind: 'echoes',
      amount: 20,
      tableId: 'loot.skirmisher-early',
    })
  })
})
