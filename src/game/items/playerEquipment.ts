import {
  getItemDefinition,
  requireItemDefinition,
  type EquipSlot,
  type ItemGameplayModifiers,
  type ItemId,
} from './itemDefinition'
import type { PlayerInventoryRuntime } from './playerInventory'

export interface EquipmentSnapshot {
  readonly weaponItemId: ItemId | null
  readonly charmItemId: ItemId | null
  readonly modifiers: ItemGameplayModifiers
}

export type EquipResult =
  | { readonly accepted: true; readonly slot: EquipSlot; readonly itemId: ItemId }
  | {
      readonly accepted: false
      readonly reason: 'unknown-item' | 'not-owned' | 'wrong-slot' | 'not-equippable'
    }

export type UnequipResult =
  | { readonly accepted: true; readonly slot: EquipSlot; readonly itemId: ItemId | null }
  | { readonly accepted: false; readonly reason: 'slot-empty' }

const ZERO_MODIFIERS: ItemGameplayModifiers = Object.freeze({
  lightDamageBonus: 0,
  heavyDamageBonus: 0,
  maxHealthBonus: 0,
})

export class PlayerEquipmentRuntime {
  private weaponItemId: ItemId | null = null
  private charmItemId: ItemId | null = null

  equip(itemId: ItemId, inventory: PlayerInventoryRuntime): EquipResult {
    const definition = getItemDefinition(itemId)
    if (definition === null) return { accepted: false, reason: 'unknown-item' }
    if (definition.slot === null) return { accepted: false, reason: 'not-equippable' }
    if (!inventory.has(itemId)) return { accepted: false, reason: 'not-owned' }

    if (definition.slot === 'weapon') this.weaponItemId = itemId
    else this.charmItemId = itemId
    return { accepted: true, slot: definition.slot, itemId }
  }

  unequip(slot: EquipSlot): UnequipResult {
    if (slot === 'weapon') {
      if (this.weaponItemId === null) return { accepted: false, reason: 'slot-empty' }
      const itemId = this.weaponItemId
      this.weaponItemId = null
      return { accepted: true, slot, itemId }
    }
    if (this.charmItemId === null) return { accepted: false, reason: 'slot-empty' }
    const itemId = this.charmItemId
    this.charmItemId = null
    return { accepted: true, slot, itemId }
  }

  reset(): void {
    this.weaponItemId = null
    this.charmItemId = null
  }

  restore(weaponItemId: ItemId | null, charmItemId: ItemId | null): void {
    this.weaponItemId = weaponItemId
    this.charmItemId = charmItemId
  }

  resolvedModifiers(): ItemGameplayModifiers {
    const weapon =
      this.weaponItemId === null
        ? ZERO_MODIFIERS
        : requireItemDefinition(this.weaponItemId).modifiers
    const charm =
      this.charmItemId === null
        ? ZERO_MODIFIERS
        : requireItemDefinition(this.charmItemId).modifiers
    return {
      lightDamageBonus: weapon.lightDamageBonus + charm.lightDamageBonus,
      heavyDamageBonus: weapon.heavyDamageBonus + charm.heavyDamageBonus,
      maxHealthBonus: weapon.maxHealthBonus + charm.maxHealthBonus,
    }
  }

  snapshot(): EquipmentSnapshot {
    return {
      weaponItemId: this.weaponItemId,
      charmItemId: this.charmItemId,
      modifiers: this.resolvedModifiers(),
    }
  }
}
