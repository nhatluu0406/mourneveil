import { getItemDefinition, type ItemId } from './itemDefinition'

export interface InventoryEntry {
  readonly itemId: ItemId
  readonly quantity: number
}

export interface InventorySnapshot {
  readonly entries: readonly InventoryEntry[]
}

export class PlayerInventoryRuntime {
  private readonly quantities = new Map<ItemId, number>()

  add(itemId: ItemId, quantity = 1): void {
    assertPositiveInteger(quantity, 'Inventory add quantity')
    if (getItemDefinition(itemId) === null) {
      throw new Error(`Cannot add unknown item: ${itemId}`)
    }
    this.quantities.set(itemId, (this.quantities.get(itemId) ?? 0) + quantity)
  }

  has(itemId: ItemId, quantity = 1): boolean {
    return (this.quantities.get(itemId) ?? 0) >= quantity
  }

  count(itemId: ItemId): number {
    return this.quantities.get(itemId) ?? 0
  }

  remove(itemId: ItemId, quantity = 1): boolean {
    assertPositiveInteger(quantity, 'Inventory remove quantity')
    const current = this.quantities.get(itemId) ?? 0
    if (current < quantity) return false
    const next = current - quantity
    if (next === 0) this.quantities.delete(itemId)
    else this.quantities.set(itemId, next)
    return true
  }

  reset(): void {
    this.quantities.clear()
  }

  replaceAll(entries: readonly InventoryEntry[]): void {
    this.quantities.clear()
    for (const entry of entries) {
      assertPositiveInteger(entry.quantity, 'Inventory entry quantity')
      if (getItemDefinition(entry.itemId) === null) {
        throw new Error(`Cannot restore unknown item: ${entry.itemId}`)
      }
      this.quantities.set(entry.itemId, entry.quantity)
    }
  }

  snapshot(): InventorySnapshot {
    return {
      entries: [...this.quantities.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([itemId, quantity]) => ({ itemId, quantity })),
    }
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer`)
  }
}
