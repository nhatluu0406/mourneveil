import type { GameRuntime, GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import { getItemDefinition, type ItemId } from '../../game/items/itemDefinition'
import { formatModifierSummary } from '../../game/items/itemComparison'
import { ItemGlyph } from '../ItemGlyph'
import { itemIcon, itemLabel } from './itemPresentation'

interface ItemDetailProps {
  readonly snapshot: GameRuntimeSnapshot
  readonly runtime: GameRuntime
  readonly selectedItemId: ItemId | null
}

export function ItemDetail({ snapshot, runtime, selectedItemId }: ItemDetailProps) {
  const { equipment } = snapshot
  if (selectedItemId === null) {
    return (
      <section className="armory-detail" aria-label="Selected relic" data-item-detail="1">
        <h3>Relic Detail</h3>
        <p className="inventory-panel__empty">Select a relic to inspect and compare.</p>
      </section>
    )
  }
  const definition = getItemDefinition(selectedItemId)
  if (definition === null) {
    return (
      <section className="armory-detail" aria-label="Selected relic" data-item-detail="1">
        <h3>Relic Detail</h3>
        <p className="inventory-panel__empty">Unknown relic.</p>
      </section>
    )
  }
  const equipped =
    equipment.weaponItemId === selectedItemId || equipment.charmItemId === selectedItemId
  const comparison = runtime.compareItem(selectedItemId)
  const comparisonRows =
    comparison === null
      ? []
      : [
          ...comparison.gains.map((gain) => ({ text: `${gain.delta > 0 ? '+' : ''}${gain.delta} ${gain.label}`, gain: true })),
          ...comparison.losses.map((loss) => ({ text: `${loss.delta} ${loss.label}`, gain: false })),
        ]
  return (
    <section className="armory-detail" aria-label="Selected relic" data-item-detail="1">
      <h3>Relic Detail</h3>
      <div className={`armory-detail__hero inventory-item-card--${itemIcon(selectedItemId)}`}>
        <span className="inventory-item-glyph"><ItemGlyph icon={itemIcon(selectedItemId)} /></span>
        <div>
          <span>{definition.slot ?? definition.type} · {definition.rarity}</span>
          <strong>{itemLabel(selectedItemId)}</strong>
        </div>
      </div>
      {formatModifierSummary(definition.modifiers).map((line) => (
        <small key={line} className="armory-detail__mod">{line}</small>
      ))}
      {comparisonRows.length > 0 && !equipped ? (
        <div className="inventory-item-card__comparison" data-item-comparison="1">
          {comparisonRows.map((line) => (
            <em key={line.text} className={line.gain ? 'is-gain' : 'is-loss'}>{line.text}</em>
          ))}
        </div>
      ) : null}
      {definition.slot === null ? null : (
        <button
          type="button"
          disabled={equipped}
          onClick={() => runtime.equipItem(selectedItemId)}
        >
          {equipped ? 'Bound' : 'Equip'}
        </button>
      )}
    </section>
  )
}
