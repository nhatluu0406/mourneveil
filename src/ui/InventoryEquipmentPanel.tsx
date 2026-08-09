import { useState } from 'react'
import type {
  GameRuntime,
  GameRuntimeSnapshot,
} from '../game/runtime/GameRuntime'
import { getItemDefinition, type EquipSlot, type ItemId } from '../game/items/itemDefinition'

interface InventoryEquipmentPanelProps {
  snapshot: GameRuntimeSnapshot
  runtime: GameRuntime
}

function itemLabel(itemId: ItemId | null): string {
  if (itemId === null) return 'Empty'
  return getItemDefinition(itemId)?.displayName ?? 'Unknown item'
}

export function InventoryEquipmentPanel({
  snapshot,
  runtime,
}: InventoryEquipmentPanelProps) {
  const [open, setOpen] = useState(false)
  const { inventory, equipment, resolvedAttackDamage, playerHealth } = snapshot

  const equip = (itemId: ItemId): void => {
    runtime.equipItem(itemId)
  }
  const unequip = (slot: EquipSlot): void => {
    runtime.unequipSlot(slot)
  }

  return (
    <aside className="inventory-panel" aria-label="Inventory and equipment">
      <header className="inventory-panel__header">
        <h2>Loadout</h2>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? 'Hide' : 'Show'}
        </button>
      </header>
      {!open ? (
        <p className="inventory-panel__meta">
          {itemLabel(equipment.weaponItemId)}
          {equipment.charmItemId !== null ? ` · ${itemLabel(equipment.charmItemId)}` : ''}
        </p>
      ) : (
        <>
          <p className="inventory-panel__meta">
            Light {resolvedAttackDamage.light} · Heavy {resolvedAttackDamage.heavy} · Max HP{' '}
            {playerHealth.health.maximum}
          </p>
          <section>
            <h3>Equipped</h3>
            <div className="inventory-panel__row">
              <span>Weapon</span>
              <strong className="inventory-panel__name">{itemLabel(equipment.weaponItemId)}</strong>
              {equipment.weaponItemId !== null ? (
                <button type="button" onClick={() => unequip('weapon')}>
                  Unequip
                </button>
              ) : (
                <span />
              )}
            </div>
            <div className="inventory-panel__row">
              <span>Charm</span>
              <strong className="inventory-panel__name">{itemLabel(equipment.charmItemId)}</strong>
              {equipment.charmItemId !== null ? (
                <button type="button" onClick={() => unequip('charm')}>
                  Unequip
                </button>
              ) : (
                <span />
              )}
            </div>
          </section>
          <section>
            <h3>Owned</h3>
            {inventory.entries.length === 0 ? (
              <p className="inventory-panel__empty">No items</p>
            ) : (
              <ul>
                {inventory.entries.map((entry) => {
                  const definition = getItemDefinition(entry.itemId)
                  const equipped =
                    equipment.weaponItemId === entry.itemId ||
                    equipment.charmItemId === entry.itemId
                  return (
                    <li
                      key={entry.itemId}
                      className={`inventory-panel__row${equipped ? ' is-equipped' : ''}`}
                    >
                      <span className="inventory-panel__name">
                        {definition?.displayName ?? 'Unknown item'} ×{entry.quantity}
                      </span>
                      {definition?.slot !== null && definition?.slot !== undefined ? (
                        <button type="button" onClick={() => equip(entry.itemId)}>
                          Equip
                        </button>
                      ) : (
                        <span />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </aside>
  )
}
