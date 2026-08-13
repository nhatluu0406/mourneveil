import { useFrame } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import type { GameRuntime } from '../../../game/runtime/GameRuntime'
import type { MourneveilZoneId } from '../../../game/world/connectedLevel'
import { zoneIdContainingPosition } from '../../../game/world/connectedNavigation'
import { isZoneCullEnabled } from '../../../debug/devQuery'
import { WorldObjectComposer } from '../WorldObjectComposer'
import { OSSUARY_ROUTE_PLACEMENTS } from './routePlacements'
import { filterPlacementsForZone } from './scenePresentation'

/** Thin route composition entry — placements declare WHAT/WHERE; object modules own HOW. */
export function OssuaryEnvironmentComposition({
  runtime,
}: {
  readonly runtime: GameRuntime
}) {
  const cullEnabled =
    typeof window === 'undefined' ? true : isZoneCullEnabled(window.location.search)
  const [zoneId, setZoneId] = useState<MourneveilZoneId | null>(
    () =>
      runtime.snapshot().world.currentZoneId ??
      zoneIdContainingPosition(runtime.snapshot().player.position),
  )
  useFrame(() => {
    const snapshot = runtime.snapshot()
    const next =
      snapshot.world.currentZoneId ?? zoneIdContainingPosition(snapshot.player.position)
    if (next !== zoneId) setZoneId(next)
  })
  const placements = useMemo(
    () => filterPlacementsForZone(OSSUARY_ROUTE_PLACEMENTS, zoneId, cullEnabled),
    [zoneId, cullEnabled],
  )
  return (
    <group userData={{ productionAssetId: 'world.kit.ossuary-hero' }} dispose={null}>
      <WorldObjectComposer placements={placements} />
    </group>
  )
}
