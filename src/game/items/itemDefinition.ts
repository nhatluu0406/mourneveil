export type ItemId = string
export type ItemType = 'weapon' | 'charm' | 'misc'
export type EquipSlot = 'weapon' | 'charm'
/** Tiny authored rarity vocabulary — not Diablo-style loot tiers. */
export type ItemRarity = 'common' | 'bound' | 'reliquary'

/**
 * Compact typed modifier vocabulary for M14.
 * Combat/runtime must consume resolved modifiers — never item-id conditionals.
 */
export interface ItemGameplayModifiers {
  readonly lightDamageBonus: number
  readonly heavyDamageBonus: number
  readonly maxHealthBonus: number
  /** Added to base player guard impact threshold (not a second guard system). */
  readonly guardImpactThresholdBonus: number
  /**
   * Added to active-skill cooldown steps after an execution completes.
   * Negative shortens cooldown; clamped at 0 by the combat cooldown resolver.
   */
  readonly activeSkillCooldownStepDelta: number
  /** Added to flask heal amount when the flask active step applies. */
  readonly flaskHealBonus: number
}

export interface ItemPresentationHooks {
  readonly iconKey: string
  readonly visualKey: string
  readonly rarityKey: ItemRarity
  readonly pickupSemantic: string
  readonly equipSemantic: string
}

export interface ItemDefinition {
  readonly id: ItemId
  readonly displayName: string
  readonly type: ItemType
  readonly slot: EquipSlot | null
  readonly description: string
  readonly flavor: string
  readonly rarity: ItemRarity
  readonly unique: boolean
  /** Echoes granted when a unique item would duplicate. */
  readonly duplicateEchoReward: number
  readonly modifiers: ItemGameplayModifiers
  readonly presentation: ItemPresentationHooks
}

export const ZERO_ITEM_MODIFIERS: ItemGameplayModifiers = Object.freeze({
  lightDamageBonus: 0,
  heavyDamageBonus: 0,
  maxHealthBonus: 0,
  guardImpactThresholdBonus: 0,
  activeSkillCooldownStepDelta: 0,
  flaskHealBonus: 0,
})

export const DUPLICATE_UNIQUE_ECHO_DEFAULT = 25

function defineItem(definition: ItemDefinition): ItemDefinition {
  return Object.freeze({
    ...definition,
    modifiers: Object.freeze({ ...definition.modifiers }),
    presentation: Object.freeze({ ...definition.presentation }),
  })
}

export const ITEM_DEFINITIONS: readonly ItemDefinition[] = Object.freeze([
  // —— Weapons (3) ——
  defineItem({
    id: 'item.weapon.oathblade',
    displayName: 'Oathblade',
    type: 'weapon',
    slot: 'weapon',
    description: 'Balanced funerary blade. Reliable light and heavy bite.',
    flavor: 'The first cut that bound the Warden to the Court.',
    rarity: 'bound',
    unique: true,
    duplicateEchoReward: DUPLICATE_UNIQUE_ECHO_DEFAULT,
    modifiers: {
      lightDamageBonus: 8,
      heavyDamageBonus: 12,
      maxHealthBonus: 0,
      guardImpactThresholdBonus: 0,
      activeSkillCooldownStepDelta: 0,
      flaskHealBonus: 0,
    },
    presentation: {
      iconKey: 'icon.weapon.oathblade',
      visualKey: 'visual.weapon.oathblade',
      rarityKey: 'bound',
      pickupSemantic: 'pickup.weapon.bound',
      equipSemantic: 'equip.weapon.bound',
    },
  }),
  defineItem({
    id: 'item.weapon.gravebrand',
    displayName: 'Gravebrand',
    type: 'weapon',
    slot: 'weapon',
    description: 'Heavier oath-iron. Greater damage; skills recover more slowly.',
    flavor: 'Forged for rites that answer only with weight.',
    rarity: 'bound',
    unique: true,
    duplicateEchoReward: DUPLICATE_UNIQUE_ECHO_DEFAULT,
    modifiers: {
      lightDamageBonus: 14,
      heavyDamageBonus: 22,
      maxHealthBonus: 0,
      guardImpactThresholdBonus: 0,
      activeSkillCooldownStepDelta: 36,
      flaskHealBonus: 0,
    },
    presentation: {
      iconKey: 'icon.weapon.gravebrand',
      visualKey: 'visual.weapon.gravebrand',
      rarityKey: 'bound',
      pickupSemantic: 'pickup.weapon.bound',
      equipSemantic: 'equip.weapon.bound',
    },
  }),
  defineItem({
    id: 'item.weapon.veil-thorn',
    displayName: 'Veil Thorn',
    type: 'weapon',
    slot: 'weapon',
    description: 'Light funerary thorn. Modest damage; quicker active-skill recovery.',
    flavor: 'A needle that slips between veil and flesh.',
    rarity: 'bound',
    unique: true,
    duplicateEchoReward: DUPLICATE_UNIQUE_ECHO_DEFAULT,
    modifiers: {
      lightDamageBonus: 4,
      heavyDamageBonus: 6,
      maxHealthBonus: 0,
      guardImpactThresholdBonus: 0,
      activeSkillCooldownStepDelta: -30,
      flaskHealBonus: 0,
    },
    presentation: {
      iconKey: 'icon.weapon.veil-thorn',
      visualKey: 'visual.weapon.veil-thorn',
      rarityKey: 'bound',
      pickupSemantic: 'pickup.weapon.bound',
      equipSemantic: 'equip.weapon.bound',
    },
  }),
  // —— Charms / relics (5) ——
  defineItem({
    id: 'item.charm.vitality',
    displayName: 'Vitality Charm',
    type: 'charm',
    slot: 'charm',
    description: 'Increases maximum health. Does not improve guard capacity.',
    flavor: 'A warm vessel against the Court cold.',
    rarity: 'bound',
    unique: true,
    duplicateEchoReward: DUPLICATE_UNIQUE_ECHO_DEFAULT,
    modifiers: {
      lightDamageBonus: 0,
      heavyDamageBonus: 0,
      maxHealthBonus: 20,
      guardImpactThresholdBonus: 0,
      activeSkillCooldownStepDelta: 0,
      flaskHealBonus: 0,
    },
    presentation: {
      iconKey: 'icon.charm.vitality',
      visualKey: 'visual.charm.vitality',
      rarityKey: 'bound',
      pickupSemantic: 'pickup.charm.bound',
      equipSemantic: 'equip.charm.bound',
    },
  }),
  defineItem({
    id: 'item.charm.ward-seal',
    displayName: 'Ward Seal',
    type: 'charm',
    slot: 'charm',
    description: 'Raises guard impact threshold. Does not increase maximum health.',
    flavor: 'Angular wax that remembers every blocked blow.',
    rarity: 'bound',
    unique: true,
    duplicateEchoReward: DUPLICATE_UNIQUE_ECHO_DEFAULT,
    modifiers: {
      lightDamageBonus: 0,
      heavyDamageBonus: 0,
      maxHealthBonus: 0,
      guardImpactThresholdBonus: 1,
      activeSkillCooldownStepDelta: 0,
      flaskHealBonus: 0,
    },
    presentation: {
      iconKey: 'icon.charm.ward-seal',
      visualKey: 'visual.charm.ward-seal',
      rarityKey: 'bound',
      pickupSemantic: 'pickup.charm.bound',
      equipSemantic: 'equip.charm.bound',
    },
  }),
  defineItem({
    id: 'item.charm.oathbrand-ember',
    displayName: 'Oathbrand Ember',
    type: 'charm',
    slot: 'charm',
    description: 'Might-leaning relic. Raises melee damage; no survivability.',
    flavor: 'A coal from the oathfire that never cools.',
    rarity: 'bound',
    unique: true,
    duplicateEchoReward: DUPLICATE_UNIQUE_ECHO_DEFAULT,
    modifiers: {
      lightDamageBonus: 6,
      heavyDamageBonus: 10,
      maxHealthBonus: 0,
      guardImpactThresholdBonus: 0,
      activeSkillCooldownStepDelta: 0,
      flaskHealBonus: 0,
    },
    presentation: {
      iconKey: 'icon.charm.oathbrand-ember',
      visualKey: 'visual.charm.oathbrand-ember',
      rarityKey: 'bound',
      pickupSemantic: 'pickup.charm.bound',
      equipSemantic: 'equip.charm.bound',
    },
  }),
  defineItem({
    id: 'item.charm.ash-circlet',
    displayName: 'Ash Circlet',
    type: 'charm',
    slot: 'charm',
    description: 'Skill-leaning relic. Shortens active-skill cooldown; no raw damage.',
    flavor: 'Ashen wire wound for the next rite step.',
    rarity: 'reliquary',
    unique: true,
    duplicateEchoReward: 35,
    modifiers: {
      lightDamageBonus: 0,
      heavyDamageBonus: 0,
      maxHealthBonus: 0,
      guardImpactThresholdBonus: 0,
      activeSkillCooldownStepDelta: -24,
      flaskHealBonus: 0,
    },
    presentation: {
      iconKey: 'icon.charm.ash-circlet',
      visualKey: 'visual.charm.ash-circlet',
      rarityKey: 'reliquary',
      pickupSemantic: 'pickup.charm.reliquary',
      equipSemantic: 'equip.charm.reliquary',
    },
  }),
  defineItem({
    id: 'item.charm.mourning-phial',
    displayName: 'Mourning Phial',
    type: 'charm',
    slot: 'charm',
    description: 'Sustain relic. Improves flask healing; slight max-HP cost.',
    flavor: 'Grief distilled for the living still walking.',
    rarity: 'reliquary',
    unique: true,
    duplicateEchoReward: 35,
    modifiers: {
      lightDamageBonus: 0,
      heavyDamageBonus: 0,
      maxHealthBonus: -8,
      guardImpactThresholdBonus: 0,
      activeSkillCooldownStepDelta: 0,
      flaskHealBonus: 18,
    },
    presentation: {
      iconKey: 'icon.charm.mourning-phial',
      visualKey: 'visual.charm.mourning-phial',
      rarityKey: 'reliquary',
      pickupSemantic: 'pickup.charm.reliquary',
      equipSemantic: 'equip.charm.reliquary',
    },
  }),
])

const BY_ID = new Map(ITEM_DEFINITIONS.map((item) => [item.id, item]))

export function getItemDefinition(itemId: ItemId): ItemDefinition | null {
  return BY_ID.get(itemId) ?? null
}

export function requireItemDefinition(itemId: ItemId): ItemDefinition {
  const item = getItemDefinition(itemId)
  if (item === null) throw new Error(`Unknown item id: ${itemId}`)
  return item
}

export function sumItemModifiers(
  left: ItemGameplayModifiers,
  right: ItemGameplayModifiers,
): ItemGameplayModifiers {
  return {
    lightDamageBonus: left.lightDamageBonus + right.lightDamageBonus,
    heavyDamageBonus: left.heavyDamageBonus + right.heavyDamageBonus,
    maxHealthBonus: left.maxHealthBonus + right.maxHealthBonus,
    guardImpactThresholdBonus: left.guardImpactThresholdBonus + right.guardImpactThresholdBonus,
    activeSkillCooldownStepDelta:
      left.activeSkillCooldownStepDelta + right.activeSkillCooldownStepDelta,
    flaskHealBonus: left.flaskHealBonus + right.flaskHealBonus,
  }
}

export function effectiveActiveSkillCooldownSteps(
  baseCooldownSteps: number,
  equipment: ItemGameplayModifiers,
): number {
  if (!Number.isInteger(baseCooldownSteps) || baseCooldownSteps < 0) {
    throw new RangeError('baseCooldownSteps must be a non-negative integer')
  }
  return Math.max(0, baseCooldownSteps + equipment.activeSkillCooldownStepDelta)
}

export function effectiveFlaskHealAmount(
  baseHealAmount: number,
  equipment: ItemGameplayModifiers,
): number {
  if (!Number.isInteger(baseHealAmount) || baseHealAmount < 0) {
    throw new RangeError('baseHealAmount must be a non-negative integer')
  }
  return Math.max(0, baseHealAmount + equipment.flaskHealBonus)
}
