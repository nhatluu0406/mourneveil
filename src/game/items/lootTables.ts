import { getItemDefinition, type ItemId } from './itemDefinition'

export type LootTableId =
  | 'loot.skirmisher-early'
  | 'loot.brute-middle'
  | 'loot.pressure'
  | 'loot.boss-rite'

export interface LootTableDefinition {
  readonly id: LootTableId
  readonly displayName: string
  /** Ordered authored candidates; first unowned unique wins. */
  readonly itemIds: readonly ItemId[]
  /** Echoes when every candidate is already owned (or table empty). */
  readonly exhaustedEchoReward: number
}

export type LootResolution =
  | { readonly kind: 'item'; readonly itemId: ItemId; readonly tableId: LootTableId }
  | { readonly kind: 'echoes'; readonly amount: number; readonly tableId: LootTableId }

export const LOOT_TABLES: readonly LootTableDefinition[] = Object.freeze([
  Object.freeze({
    id: 'loot.skirmisher-early' as const,
    displayName: 'Early skirmisher rites',
    itemIds: Object.freeze([
      'item.weapon.oathblade',
      'item.weapon.veil-thorn',
      'item.weapon.gravebrand',
    ]),
    exhaustedEchoReward: 20,
  }),
  Object.freeze({
    id: 'loot.brute-middle' as const,
    displayName: 'Middle court pressure',
    itemIds: Object.freeze(['item.charm.vitality', 'item.charm.oathbrand-ember']),
    exhaustedEchoReward: 25,
  }),
  Object.freeze({
    id: 'loot.pressure' as const,
    displayName: 'Ash Walk pressure',
    itemIds: Object.freeze(['item.charm.ward-seal', 'item.charm.mourning-phial']),
    exhaustedEchoReward: 25,
  }),
  Object.freeze({
    id: 'loot.boss-rite' as const,
    displayName: 'Sepulchre rite completion',
    itemIds: Object.freeze(['item.charm.ash-circlet', 'item.weapon.gravebrand']),
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
