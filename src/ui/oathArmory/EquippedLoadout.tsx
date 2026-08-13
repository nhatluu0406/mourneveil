import type { GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import type { EquipSlot } from '../../game/items/itemDefinition'
import { getItemDefinition } from '../../game/items/itemDefinition'
import { formatModifierSummary } from '../../game/items/itemComparison'
import { ItemGlyph } from '../ItemGlyph'
import { itemIcon, itemLabel } from './itemPresentation'

interface EquippedLoadoutProps {
  readonly snapshot: GameRuntimeSnapshot
  readonly onUnequip: (slot: EquipSlot) => void
}

export function EquippedLoadout({ snapshot, onUnequip }: EquippedLoadoutProps) {
  const { equipment } = snapshot
  return (
    <section className="armory-loadout" aria-label="Equipped loadout" data-armory-loadout="1">
      <h3>Bound Loadout</h3>
      {(['weapon', 'charm'] as const).map((slot) => {
        const itemId = slot === 'weapon' ? equipment.weaponItemId : equipment.charmItemId
        const definition = itemId === null ? null : getItemDefinition(itemId)
        return (
          <div key={slot} className={`inventory-equipped-card${itemId === null ? '' : ' is-equipped'}`} data-equip-slot={slot}>
            <span className="inventory-item-glyph">
              {itemId === null ? <span>—</span> : <ItemGlyph icon={itemIcon(itemId)} />}
            </span>
            <div>
              <span>{slot}</span>
              <strong>{itemLabel(itemId)}</strong>
              {definition === null
                ? <small>Socket unbound</small>
                : formatModifierSummary(definition.modifiers).slice(0, 2).map((line) => <small key={line}>{line}</small>)}
            </div>
            {itemId === null ? null : (
              <button type="button" onClick={() => onUnequip(slot)}>Unbind</button>
            )}
          </div>
        )
      })}
    </section>
  )
}
