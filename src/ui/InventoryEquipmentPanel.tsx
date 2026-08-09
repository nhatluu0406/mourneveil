import type {
  GameRuntime,
  GameRuntimeSnapshot,
} from '../game/runtime/GameRuntime'
import { getItemDefinition, type EquipSlot, type ItemId } from '../game/items/itemDefinition'

interface InventoryEquipmentPanelProps {
  snapshot: GameRuntimeSnapshot
  runtime: GameRuntime
}

export function InventoryEquipmentPanel({
  snapshot,
  runtime,
}: InventoryEquipmentPanelProps) {
  const { inventory, equipment, resolvedAttackDamage, playerHealth } =
    snapshot

  const equip = (itemId: ItemId): void => {
    runtime.equipItem(itemId)
  }
  const unequip = (slot: EquipSlot): void => {
    runtime.unequipSlot(slot)
  }

  return (
    <aside className="inventory-panel" aria-label="Inventory and equipment">
      <h2>Inventory / Equipment</h2>
      <p className="inventory-panel__meta">
        Light {resolvedAttackDamage.light} · Heavy {resolvedAttackDamage.heavy} · Max HP{' '}
        {playerHealth.health.maximum}
      </p>
      <section>
        <h3>Equipment</h3>
        <div className="inventory-panel__row">
          <span>Weapon</span>
          <strong>{equipment.weaponItemId ?? 'none'}</strong>
          {equipment.weaponItemId !== null ? (
            <button type="button" onClick={() => unequip('weapon')}>
              Unequip
            </button>
          ) : null}
        </div>
        <div className="inventory-panel__row">
          <span>Charm</span>
          <strong>{equipment.charmItemId ?? 'none'}</strong>
          {equipment.charmItemId !== null ? (
            <button type="button" onClick={() => unequip('charm')}>
              Unequip
            </button>
          ) : null}
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
              return (
                <li key={entry.itemId} className="inventory-panel__row">
                  <span>
                    {definition?.displayName ?? entry.itemId} ×{entry.quantity}
                  </span>
                  {definition?.slot !== null && definition?.slot !== undefined ? (
                    <button type="button" onClick={() => equip(entry.itemId)}>
                      Equip
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </aside>
  )
}
