import { WorldObjectComposer } from '../WorldObjectComposer'
import { OSSUARY_ROUTE_PLACEMENTS } from './routePlacements'

/** Thin route composition entry — placements declare WHAT/WHERE; object modules own HOW. */
export function OssuaryEnvironmentComposition() {
  return (
    <group userData={{ productionAssetId: 'world.kit.ossuary-hero' }} dispose={null}>
      <WorldObjectComposer placements={OSSUARY_ROUTE_PLACEMENTS} />
      {/* Corridor → combat warm practical; monolith practical lives on the landmark (9-light ceiling). */}
      <pointLight position={[-8.1, 2.5, 1.7]} intensity={1.05} distance={7.2} color="#d89a62" />
    </group>
  )
}
