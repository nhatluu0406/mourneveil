import { getItemDefinition, type ItemId } from './itemDefinition'

export type LootTableId =
  | 'loot.intro-survivability'
  | 'loot.skirmisher-early'
  | 'loot.brute-middle'
  | 'loot.pressure'
  | 'loot.boss-rite'

export interface LootTableDefinition {
  readonly id: LootTableId
  readonly displayName: string
  readonly routePhase: 'early' | 'mid' | 'late' | 'boss'
  /** Ordered authored candidates; first unowned unique wins. */
  readonly itemIds: readonly ItemId[]
  readonly exhaustedEchoReward: number
}

export type LootResolution =
  | { readonly kind: 'item'; readonly itemId: ItemId; readonly tableId: LootTableId }
  | { readonly kind: 'echoes'; readonly amount: number; readonly tableId: LootTableId }

/**
 * Authored encounter-clear bonus rewards (inventory grant; not world pickups).
 * Synthetic source IDs participate in loot spawn memory (save-safe, no farm).
 */
export const LOOT_REWARD_MIXED_CLEAR_SOURCE_ID = 'reward.encounter.m5.mixed.clear' as const
export const LOOT_REWARD_PRESSURE_CLEAR_SOURCE_ID = 'reward.encounter.m5.pressure.clear' as const
export const LOOT_REWARD_MIXED_CLEAR_ITEM_ID = 'item.charm.oathbrand-ember' as const
export const LOOT_REWARD_PRESSURE_CLEAR_ITEM_ID = 'item.weapon.veil-thorn' as const

/** Guaranteed discoverable on a normal first complete route (≥6 of 8). */
export const FIRST_RUN_DISCOVERABLE_ITEM_IDS = Object.freeze([
  'item.charm.vitality',
  'item.weapon.oathblade',
  'item.weapon.gravebrand',
  'item.charm.oathbrand-ember',
  'item.charm.ward-seal',
  'item.weapon.veil-thorn',
  'item.charm.ash-circlet',
] as const satisfies readonly ItemId[])

/** Intentionally reserved for alternate/replay after Ward Seal is owned. */
export const REPLAY_ALTERNATE_ITEM_IDS = Object.freeze([
  'item.charm.mourning-phial',
] as const satisfies readonly ItemId[])

export const LOOT_TABLES: readonly LootTableDefinition[] = Object.freeze([
  Object.freeze({
    id: 'loot.intro-survivability' as const,
    displayName: 'Outer Watch arrival',
    routePhase: 'early' as const,
    itemIds: Object.freeze(['item.charm.vitality', 'item.charm.mourning-phial']),
    exhaustedEchoReward: 15,
  }),
  Object.freeze({
    id: 'loot.skirmisher-early' as const,
    displayName: 'Court approach skirmisher',
    routePhase: 'early' as const,
    itemIds: Object.freeze(['item.weapon.oathblade']),
    exhaustedEchoReward: 20,
  }),
  Object.freeze({
    id: 'loot.brute-middle' as const,
    displayName: 'Court brute pocket',
    routePhase: 'mid' as const,
    itemIds: Object.freeze(['item.weapon.gravebrand']),
    exhaustedEchoReward: 25,
  }),
  Object.freeze({
    id: 'loot.pressure' as const,
    displayName: 'Ash Walk pressure',
    routePhase: 'late' as const,
    itemIds: Object.freeze(['item.charm.ward-seal', 'item.charm.mourning-phial']),
    exhaustedEchoReward: 25,
  }),
  Object.freeze({
    id: 'loot.boss-rite' as const,
    displayName: 'Sepulchre rite completion',
    routePhase: 'boss' as const,
    itemIds: Object.freeze(['item.charm.ash-circlet', 'item.charm.mourning-phial']),
    exhaustedEchoReward: 40,
  }),
])

const BY_ID = new Map(LOOT_TABLES.map((table) => [table.id, table]))

export function getLootTable(tableId: LootTableId): LootTableDefinition {
  const table = BY_ID.get(tableId)
  if (table === undefined) throw new Error(`Unknown loot table: ${tableId}`)
  return table
}

/**
 * Deterministic authored resolution: first unowned candidate, else Echoes.
 * No Math.random.
 */
export function resolveLootTable(
  tableId: LootTableId,
  ownedItemIds: ReadonlySet<ItemId> | readonly ItemId[],
): LootResolution {
  const table = getLootTable(tableId)
  const owned = ownedItemIds instanceof Set ? ownedItemIds : new Set(ownedItemIds)
  for (const itemId of table.itemIds) {
    if (getItemDefinition(itemId) === null) {
      throw new Error(`Loot table ${tableId} references unknown item ${itemId}`)
    }
    if (!owned.has(itemId)) {
      return { kind: 'item', itemId, tableId }
    }
  }
  return { kind: 'echoes', amount: table.exhaustedEchoReward, tableId }
}

export function expectedFirstRunDiscoverableCount(): number {
  return FIRST_RUN_DISCOVERABLE_ITEM_IDS.length
}
