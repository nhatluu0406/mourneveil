import type { ItemId } from '../../game/items/itemDefinition'
import { getItemDefinition } from '../../game/items/itemDefinition'
import type { GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import { ItemGlyph } from '../ItemGlyph'
import { itemIcon } from './itemPresentation'

interface OwnedItemListProps {
  readonly snapshot: GameRuntimeSnapshot
  readonly selectedItemId: ItemId | null
  readonly onSelect: (itemId: ItemId) => void
}

export function OwnedItemList({ snapshot, selectedItemId, onSelect }: OwnedItemListProps) {
  const { inventory, equipment } = snapshot
  return (
    <section className="armory-owned" aria-label="Owned relics" data-inventory-scroll="1" data-scrollbar-policy="owned">
      <h3>Relics in Keeping</h3>
      {inventory.entries.length === 0 ? (
        <p className="inventory-panel__empty">No relics recovered</p>
      ) : (
        <ul>
          {inventory.entries.map((entry) => {
            const definition = getItemDefinition(entry.itemId)
            if (definition === null) return null
            const equipped =
              equipment.weaponItemId === entry.itemId || equipment.charmItemId === entry.itemId
            const selected = selectedItemId === entry.itemId
            return (
              <li key={entry.itemId}>
                <button
                  type="button"
                  className={`armory-item-row inventory-item-card--${itemIcon(entry.itemId)}${equipped ? ' is-equipped' : ''}${selected ? ' is-selected' : ''}`}
                  data-item-id={entry.itemId}
                  data-item-slot={definition.slot ?? 'none'}
                  data-item-rarity={definition.rarity}
                  onClick={() => onSelect(entry.itemId)}
                >
                  <span className="inventory-item-glyph"><ItemGlyph icon={itemIcon(entry.itemId)} /></span>
                  <span className="armory-item-row__copy">
                    <strong>{definition.displayName}{entry.quantity > 1 ? ` ×${entry.quantity}` : ''}</strong>
                    <small>{definition.slot ?? definition.type} · {definition.rarity}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
