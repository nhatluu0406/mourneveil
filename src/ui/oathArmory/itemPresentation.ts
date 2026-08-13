import { getItemDefinition, type ItemId } from '../../game/items/itemDefinition'
import type { EquipmentBarIcon } from '../gameplayHudModel'

export function itemLabel(itemId: ItemId | null): string {
  if (itemId === null) return 'Empty'
  return getItemDefinition(itemId)?.displayName ?? 'Unknown item'
}

export function itemIcon(itemId: ItemId): EquipmentBarIcon {
  if (itemId === 'item.weapon.oathblade') return 'oathblade'
  if (itemId === 'item.weapon.gravebrand') return 'gravebrand'
  if (itemId === 'item.weapon.veil-thorn') return 'veil-thorn'
  if (itemId === 'item.charm.vitality') return 'vitality-charm'
  if (itemId === 'item.charm.ward-seal') return 'ward-seal'
  if (itemId === 'item.charm.oathbrand-ember') return 'oathbrand-ember'
  if (itemId === 'item.charm.ash-circlet') return 'ash-circlet'
  if (itemId === 'item.charm.mourning-phial') return 'mourning-phial'
  if (getItemDefinition(itemId)?.slot === 'charm') return 'charm'
  return 'echo'
}
