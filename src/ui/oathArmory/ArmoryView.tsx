import { useState } from 'react'
import type { GameRuntime, GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import type { ItemId } from '../../game/items/itemDefinition'
import { EquippedLoadout } from './EquippedLoadout'
import { ItemDetail } from './ItemDetail'
import { OwnedItemList } from './OwnedItemList'

interface ArmoryViewProps {
  readonly snapshot: GameRuntimeSnapshot
  readonly runtime: GameRuntime
}

export function ArmoryView({ snapshot, runtime }: ArmoryViewProps) {
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(
    snapshot.inventory.entries[0]?.itemId ?? null,
  )
  return (
    <div className="armory-layout" data-armory-view="1">
      <EquippedLoadout snapshot={snapshot} onUnequip={(slot) => runtime.unequipSlot(slot)} />
      <OwnedItemList
        snapshot={snapshot}
        selectedItemId={selectedItemId}
        onSelect={setSelectedItemId}
      />
      <ItemDetail snapshot={snapshot} runtime={runtime} selectedItemId={selectedItemId} />
    </div>
  )
}
