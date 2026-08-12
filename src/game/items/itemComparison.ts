import {
  getItemDefinition,
  requireItemDefinition,
  type EquipSlot,
  type ItemGameplayModifiers,
  type ItemId,
  type ItemRarity,
} from './itemDefinition'

export interface ItemModifierDelta {
  readonly key: keyof ItemGameplayModifiers
  readonly label: string
  readonly delta: number
}

export interface ItemComparisonView {
  readonly candidateId: ItemId
  readonly candidateName: string
  readonly slot: EquipSlot
  readonly rarity: ItemRarity
  readonly equippedId: ItemId | null
  readonly equippedName: string | null
  readonly gains: readonly ItemModifierDelta[]
  readonly losses: readonly ItemModifierDelta[]
  readonly unchanged: readonly ItemModifierDelta[]
  readonly derivedEffects: readonly string[]
}

const MODIFIER_LABELS: Readonly<Record<keyof ItemGameplayModifiers, string>> = {
  lightDamageBonus: 'Light Damage',
  heavyDamageBonus: 'Heavy Damage',
  maxHealthBonus: 'Max HP',
  guardImpactThresholdBonus: 'Guard Threshold',
  activeSkillCooldownStepDelta: 'Skill Cooldown Steps',
  flaskHealBonus: 'Flask Heal',
}

/**
 * Canonical equipped-vs-candidate comparison for UI projection.
 * UI must not recompute gameplay authority beyond displaying these deltas.
 */
export function compareItemToEquipped(
  candidateId: ItemId,
  equippedWeaponId: ItemId | null,
  equippedCharmId: ItemId | null,
): ItemComparisonView | null {
  const candidate = getItemDefinition(candidateId)
  if (candidate === null || candidate.slot === null) return null

  const equippedId = candidate.slot === 'weapon' ? equippedWeaponId : equippedCharmId
  const equipped = equippedId === null ? null : getItemDefinition(equippedId)
  const currentMods = equipped?.modifiers
  const nextMods = candidate.modifiers

  const gains: ItemModifierDelta[] = []
  const losses: ItemModifierDelta[] = []
  const unchanged: ItemModifierDelta[] = []

  for (const key of Object.keys(MODIFIER_LABELS) as (keyof ItemGameplayModifiers)[]) {
    const delta = nextMods[key] - (currentMods?.[key] ?? 0)
    const entry: ItemModifierDelta = { key, label: MODIFIER_LABELS[key], delta }
    const isGain =
      key === 'activeSkillCooldownStepDelta' ? delta < 0 : delta > 0
    const isLoss =
      key === 'activeSkillCooldownStepDelta' ? delta > 0 : delta < 0
    if (isGain) gains.push(entry)
    else if (isLoss) losses.push(entry)
    else if (nextMods[key] !== 0 || (currentMods?.[key] ?? 0) !== 0) unchanged.push(entry)
  }

  const derivedEffects: string[] = []
  if (nextMods.activeSkillCooldownStepDelta !== 0) {
    derivedEffects.push(
      nextMods.activeSkillCooldownStepDelta < 0
        ? 'Faster active-skill recovery'
        : 'Slower active-skill recovery',
    )
  }
  if (nextMods.flaskHealBonus !== 0) {
    derivedEffects.push(
      nextMods.flaskHealBonus > 0 ? 'Stronger flask restoration' : 'Weaker flask restoration',
    )
  }
  if (candidate.slot === 'weapon' && nextMods.lightDamageBonus + nextMods.heavyDamageBonus > 0) {
    derivedEffects.push('Oath Cleave still scales from resolved Might + weapon damage')
  }
  if (candidate.id === 'item.charm.ward-seal' || nextMods.guardImpactThresholdBonus > 0) {
    derivedEffects.push('Stacks with Ward Pulse temporary threshold via resolved guard')
  }

  return {
    candidateId,
    candidateName: candidate.displayName,
    slot: candidate.slot,
    rarity: candidate.rarity,
    equippedId,
    equippedName: equipped?.displayName ?? null,
    gains,
    losses,
    unchanged,
    derivedEffects,
  }
}

export function formatModifierSummary(modifiers: ItemGameplayModifiers): readonly string[] {
  const lines: string[] = []
  if (modifiers.maxHealthBonus !== 0) {
    lines.push(`${signed(modifiers.maxHealthBonus)} Max HP`)
  }
  if (modifiers.guardImpactThresholdBonus !== 0) {
    lines.push(`${signed(modifiers.guardImpactThresholdBonus)} Guard Threshold`)
  }
  if (modifiers.lightDamageBonus !== 0 || modifiers.heavyDamageBonus !== 0) {
    lines.push(
      `${signed(modifiers.lightDamageBonus)} Light · ${signed(modifiers.heavyDamageBonus)} Heavy`,
    )
  }
  if (modifiers.activeSkillCooldownStepDelta !== 0) {
    lines.push(`${signed(modifiers.activeSkillCooldownStepDelta)} Skill CD steps`)
  }
  if (modifiers.flaskHealBonus !== 0) {
    lines.push(`${signed(modifiers.flaskHealBonus)} Flask heal`)
  }
  return lines.length > 0 ? lines : ['No combat modifier']
}

export function requireOwnedDefinition(itemId: ItemId) {
  return requireItemDefinition(itemId)
}

function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${value}`
}
