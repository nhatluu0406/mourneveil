import { WorldObjectComposer } from '../WorldObjectComposer'
import { OSSUARY_ROUTE_PLACEMENTS } from './routePlacements'

/** Thin route composition entry — placements declare WHAT/WHERE; object modules own HOW. */
export function OssuaryEnvironmentComposition() {
  return (
    <group userData={{ productionAssetId: 'world.kit.ossuary-hero' }} dispose={null}>
      <WorldObjectComposer placements={OSSUARY_ROUTE_PLACEMENTS} />
    </group>
  )
}
