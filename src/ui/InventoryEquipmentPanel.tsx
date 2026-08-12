import type {
  GameRuntime,
  GameRuntimeSnapshot,
} from '../game/runtime/GameRuntime'
import { getItemDefinition, type EquipSlot, type ItemId } from '../game/items/itemDefinition'
import type { ProgressionAttributeId } from '../game/character/playerProgression'

interface InventoryEquipmentPanelProps {
  snapshot: GameRuntimeSnapshot
  runtime: GameRuntime
  open: boolean
  onClose: () => void
}

function itemLabel(itemId: ItemId | null): string {
  if (itemId === null) return 'Empty'
  return getItemDefinition(itemId)?.displayName ?? 'Unknown item'
}

export function InventoryEquipmentPanel({
  snapshot,
  runtime,
  open,
  onClose,
}: InventoryEquipmentPanelProps) {
  const { inventory, equipment, resolvedAttackDamage, playerHealth, defense, progression } =
    snapshot

  if (!open) return null

  const equip = (itemId: ItemId): void => {
    runtime.equipItem(itemId)
  }
  const unequip = (slot: EquipSlot): void => {
    runtime.unequipSlot(slot)
  }
  const allocate = (attribute: ProgressionAttributeId): void => {
    runtime.allocateProgression(attribute)
  }

  return (
    <div className="inventory-overlay" role="presentation">
      <aside className="inventory-panel" aria-label="Inventory and equipment">
        <header className="inventory-panel__header">
          <div>
            <p className="inventory-panel__eyebrow">Loadout</p>
            <h2>Armory</h2>
          </div>
          <button type="button" className="inventory-panel__close" onClick={onClose}>
            Close · I
          </button>
        </header>

        <p className="inventory-panel__meta">
          Lv {progression.level} · XP {progression.experience}
          {progression.experienceToNextLevel === null
            ? ' · Max'
            : ` · Next ${progression.experienceToNextLevel}`}{' '}
          · Points {progression.unspentPoints} · Light {resolvedAttackDamage.light} · Heavy{' '}
          {resolvedAttackDamage.heavy} · Max HP {playerHealth.health.maximum} · Guard{' '}
          {defense.guardImpactThreshold}
        </p>

        <section data-progression-panel="1">
          <h3>Build</h3>
          <p className="inventory-panel__empty">
            Vitality {progression.allocation.vitality} · Resolve {progression.allocation.resolve} ·
            Might {progression.allocation.might}
          </p>
          <div className="inventory-panel__row">
            <span>Vitality</span>
            <strong className="inventory-panel__name">+Max HP</strong>
            <button
              type="button"
              disabled={progression.unspentPoints <= 0}
              onClick={() => allocate('vitality')}
            >
              Spend
            </button>
          </div>
          <div className="inventory-panel__row">
            <span>Resolve</span>
            <strong className="inventory-panel__name">+Guard</strong>
            <button
              type="button"
              disabled={progression.unspentPoints <= 0}
              onClick={() => allocate('resolve')}
            >
              Spend
            </button>
          </div>
          <div className="inventory-panel__row">
            <span>Might</span>
            <strong className="inventory-panel__name">+Melee</strong>
            <button
              type="button"
              disabled={progression.unspentPoints <= 0}
              onClick={() => allocate('might')}
            >
              Spend
            </button>
          </div>
        </section>

        <section>
          <h3>Equipped</h3>
          <div className="inventory-panel__row is-equipped">
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
          <div className={`inventory-panel__row${equipment.charmItemId ? ' is-equipped' : ''}`}>
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
                      {definition?.slot === 'charm' ? (
                        <small>
                          {' '}
                          HP +{definition.modifiers.maxHealthBonus} · Guard +
                          {definition.modifiers.guardImpactThresholdBonus}
                        </small>
                      ) : null}
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
      </aside>
    </div>
  )
}
