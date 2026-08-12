import { describe, expect, it } from 'vitest'
import {
  ACTIVE_SKILL_COOLDOWN_MAX_STEPS,
  ACTIVE_SKILL_COOLDOWN_MIN_STEPS,
  ITEM_DEFINITIONS,
  effectiveActiveSkillCooldownSteps,
  effectiveFlaskHealAmount,
  getItemDefinition,
  sumItemModifiers,
  ZERO_ITEM_MODIFIERS,
} from './itemDefinition'
import { compareItemToEquipped } from './itemComparison'
import {
  FIRST_RUN_DISCOVERABLE_ITEM_IDS,
  REPLAY_ALTERNATE_ITEM_IDS,
  expectedFirstRunDiscoverableCount,
  resolveLootTable,
} from './lootTables'
import { TEST_BUILD_PRESETS, modifiersForPreset } from './testBuildPresets'
import { SKILL_VEIL_STEP } from '../skills/skillDefinition'
import { resolvePlayerCombatStats } from '../character/playerStatResolution'
import { ZERO_PROGRESSION_ALLOCATION } from '../character/playerProgression'
import { PLAYER_FLASK_DEFINITION } from '../character/playerFlask'

describe('M14 itemization MB2', () => {
  it('authors eight equippable gameplay items with presentation hooks', () => {
    expect(ITEM_DEFINITIONS).toHaveLength(8)
    for (const item of ITEM_DEFINITIONS) {
      expect(item.slot).toMatch(/weapon|charm/)
      expect(item.unique).toBe(true)
      expect(item.presentation.iconKey.length).toBeGreaterThan(0)
    }
  })

  it('keeps first-run discoverable set at least six distinct authored items', () => {
    expect(expectedFirstRunDiscoverableCount()).toBeGreaterThanOrEqual(6)
    expect(FIRST_RUN_DISCOVERABLE_ITEM_IDS).toHaveLength(7)
    expect(REPLAY_ALTERNATE_ITEM_IDS).toContain('item.charm.mourning-phial')
    for (const id of FIRST_RUN_DISCOVERABLE_ITEM_IDS) {
      expect(getItemDefinition(id)).not.toBeNull()
    }
  })

  it('clamps composed active-skill cooldown to floor and ceiling', () => {
    const hugeCut = {
      ...ZERO_ITEM_MODIFIERS,
      activeSkillCooldownStepDelta: -10_000,
    }
    const hugePenalty = {
      ...ZERO_ITEM_MODIFIERS,
      activeSkillCooldownStepDelta: 10_000,
    }
    expect(effectiveActiveSkillCooldownSteps(SKILL_VEIL_STEP.action.cooldownSteps, hugeCut)).toBe(
      ACTIVE_SKILL_COOLDOWN_MIN_STEPS,
    )
    expect(
      effectiveActiveSkillCooldownSteps(SKILL_VEIL_STEP.action.cooldownSteps, hugePenalty),
    ).toBe(ACTIVE_SKILL_COOLDOWN_MAX_STEPS)
    expect(effectiveActiveSkillCooldownSteps(0, hugeCut)).toBe(0)
  })

  it('proves weapon and charm tradeoffs are not strict upgrades', () => {
    const oath = getItemDefinition('item.weapon.oathblade')!
    const grave = getItemDefinition('item.weapon.gravebrand')!
    const thorn = getItemDefinition('item.weapon.veil-thorn')!
    expect(grave.modifiers.lightDamageBonus).toBeGreaterThan(oath.modifiers.lightDamageBonus)
    expect(grave.modifiers.activeSkillCooldownStepDelta).toBeGreaterThan(
      oath.modifiers.activeSkillCooldownStepDelta,
    )
    expect(thorn.modifiers.lightDamageBonus).toBeLessThan(oath.modifiers.lightDamageBonus)
    expect(thorn.modifiers.activeSkillCooldownStepDelta).toBeLessThan(
      oath.modifiers.activeSkillCooldownStepDelta,
    )

    const vitality = modifiersForPreset(TEST_BUILD_PRESETS.find((p) => p.id === 'balanced')!)
    const heavy = modifiersForPreset(TEST_BUILD_PRESETS.find((p) => p.id === 'heavy')!)
    const skill = modifiersForPreset(TEST_BUILD_PRESETS.find((p) => p.id === 'skill')!)
    const defensive = modifiersForPreset(TEST_BUILD_PRESETS.find((p) => p.id === 'defensive')!)
    const sustain = modifiersForPreset(TEST_BUILD_PRESETS.find((p) => p.id === 'sustain')!)

    expect(heavy.lightDamageBonus).toBeGreaterThan(vitality.lightDamageBonus)
    expect(heavy.activeSkillCooldownStepDelta).toBeGreaterThan(vitality.activeSkillCooldownStepDelta)
    expect(skill.activeSkillCooldownStepDelta).toBeLessThan(vitality.activeSkillCooldownStepDelta)
    expect(defensive.guardImpactThresholdBonus).toBeGreaterThan(vitality.guardImpactThresholdBonus)
    expect(sustain.flaskHealBonus).toBeGreaterThan(0)
    expect(sustain.maxHealthBonus).toBeLessThan(0)

    const sustainResolved = resolvePlayerCombatStats(ZERO_PROGRESSION_ALLOCATION, sustain)
    expect(sustainResolved.maximumHealth).toBe(92)
    expect(effectiveFlaskHealAmount(PLAYER_FLASK_DEFINITION.healAmount, sustain)).toBe(58)
  })

  it('exposes canonical comparison gains and losses including cooldown polarity', () => {
    const comparison = compareItemToEquipped(
      'item.charm.ward-seal',
      null,
      'item.charm.vitality',
    )
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

  it('resolves first-run tables deterministically', () => {
    expect(resolveLootTable('loot.intro-survivability', [])).toEqual({
      kind: 'item',
      itemId: 'item.charm.vitality',
      tableId: 'loot.intro-survivability',
    })
    expect(resolveLootTable('loot.brute-middle', [])).toEqual({
      kind: 'item',
      itemId: 'item.weapon.gravebrand',
      tableId: 'loot.brute-middle',
    })
    expect(resolveLootTable('loot.boss-rite', [])).toEqual({
      kind: 'item',
      itemId: 'item.charm.ash-circlet',
      tableId: 'loot.boss-rite',
    })
    expect(
      resolveLootTable('loot.pressure', ['item.charm.ward-seal']),
    ).toEqual({
      kind: 'item',
      itemId: 'item.charm.mourning-phial',
      tableId: 'loot.pressure',
    })
    expect(sumItemModifiers(ZERO_ITEM_MODIFIERS, ZERO_ITEM_MODIFIERS)).toEqual(ZERO_ITEM_MODIFIERS)
  })
})
