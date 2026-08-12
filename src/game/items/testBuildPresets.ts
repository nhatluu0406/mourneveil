import type { ItemId } from './itemDefinition'
import {
  ZERO_ITEM_MODIFIERS,
  getItemDefinition,
  type ItemGameplayModifiers,
} from './itemDefinition'

/** Deterministic test-only build fixtures — not player-facing presets. */
export interface TestBuildPreset {
  readonly id: 'balanced' | 'heavy' | 'skill' | 'defensive' | 'sustain'
  readonly label: string
  readonly weaponItemId: ItemId
  readonly charmItemId: ItemId
}

export const TEST_BUILD_PRESETS: readonly TestBuildPreset[] = Object.freeze([
  Object.freeze({
    id: 'balanced' as const,
    label: 'Balanced',
    weaponItemId: 'item.weapon.oathblade',
    charmItemId: 'item.charm.vitality',
  }),
  Object.freeze({
    id: 'heavy' as const,
    label: 'Heavy',
    weaponItemId: 'item.weapon.gravebrand',
    charmItemId: 'item.charm.oathbrand-ember',
  }),
  Object.freeze({
    id: 'skill' as const,
    label: 'Skill',
    weaponItemId: 'item.weapon.veil-thorn',
    charmItemId: 'item.charm.ash-circlet',
  }),
  Object.freeze({
    id: 'defensive' as const,
    label: 'Defensive',
    weaponItemId: 'item.weapon.oathblade',
    charmItemId: 'item.charm.ward-seal',
  }),
  Object.freeze({
    id: 'sustain' as const,
    label: 'Sustain',
    weaponItemId: 'item.weapon.oathblade',
    charmItemId: 'item.charm.mourning-phial',
  }),
])

export function modifiersForPreset(preset: TestBuildPreset): ItemGameplayModifiers {
  const weapon = getItemDefinition(preset.weaponItemId)?.modifiers ?? ZERO_ITEM_MODIFIERS
  const charm = getItemDefinition(preset.charmItemId)?.modifiers ?? ZERO_ITEM_MODIFIERS
  return {
    lightDamageBonus: weapon.lightDamageBonus + charm.lightDamageBonus,
    heavyDamageBonus: weapon.heavyDamageBonus + charm.heavyDamageBonus,
    maxHealthBonus: weapon.maxHealthBonus + charm.maxHealthBonus,
    guardImpactThresholdBonus:
      weapon.guardImpactThresholdBonus + charm.guardImpactThresholdBonus,
    activeSkillCooldownStepDelta:
      weapon.activeSkillCooldownStepDelta + charm.activeSkillCooldownStepDelta,
    flaskHealBonus: weapon.flaskHealBonus + charm.flaskHealBonus,
  }
}
