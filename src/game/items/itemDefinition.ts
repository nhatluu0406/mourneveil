export type ItemId = string
export type ItemType = 'weapon' | 'charm' | 'misc'
export type EquipSlot = 'weapon' | 'charm'

export interface ItemGameplayModifiers {
  readonly lightDamageBonus: number
  readonly heavyDamageBonus: number
  readonly maxHealthBonus: number
}

export interface ItemDefinition {
  readonly id: ItemId
  readonly displayName: string
  readonly type: ItemType
  readonly slot: EquipSlot | null
  readonly description: string
  readonly modifiers: ItemGameplayModifiers
}

const ZERO_MODIFIERS: ItemGameplayModifiers = Object.freeze({
  lightDamageBonus: 0,
  heavyDamageBonus: 0,
  maxHealthBonus: 0,
})

export const ITEM_DEFINITIONS: readonly ItemDefinition[] = Object.freeze([
  Object.freeze({
    id: 'item.weapon.oathblade',
    displayName: 'Oathblade',
    type: 'weapon',
    slot: 'weapon',
    description: 'Graybox proof weapon. Increases light and heavy attack damage.',
    modifiers: Object.freeze({
      lightDamageBonus: 8,
      heavyDamageBonus: 12,
      maxHealthBonus: 0,
    }),
  }),
  Object.freeze({
    id: 'item.weapon.practice-edge',
    displayName: 'Practice Edge',
    type: 'weapon',
    slot: 'weapon',
    description: 'Lightweight practice blade with no damage bonus.',
    modifiers: ZERO_MODIFIERS,
  }),
  Object.freeze({
    id: 'item.charm.vitality',
    displayName: 'Vitality Charm',
    type: 'charm',
    slot: 'charm',
    description: 'Increases maximum health by a small deterministic amount.',
    modifiers: Object.freeze({
      lightDamageBonus: 0,
      heavyDamageBonus: 0,
      maxHealthBonus: 20,
    }),
  }),
  Object.freeze({
    id: 'item.charm.ember-seal',
    displayName: 'Ember Seal',
    type: 'charm',
    slot: 'charm',
    description: 'Decorative charm with no combat modifiers.',
    modifiers: ZERO_MODIFIERS,
  }),
  Object.freeze({
    id: 'item.misc.ash-token',
    displayName: 'Ash Token',
    type: 'misc',
    slot: null,
    description: 'Non-equippable proof pickup.',
    modifiers: ZERO_MODIFIERS,
  }),
  Object.freeze({
    id: 'item.misc.echo-shard',
    displayName: 'Echo Shard',
    type: 'misc',
    slot: null,
    description: 'Fragment with no equipment slot.',
    modifiers: ZERO_MODIFIERS,
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
