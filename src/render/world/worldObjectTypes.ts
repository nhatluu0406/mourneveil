/** Presentation-only world object contracts. Gameplay authority stays in world/simulation. */

export type OssuaryRouteArea = 'refuge' | 'corridor' | 'first-combat'

export type WorldObjectFamily =
  | 'architecture'
  | 'burial'
  | 'metal'
  | 'dressing'
  | 'landmark'

export type OssuaryMaterialKey =
  | 'darkStone'
  | 'recessStone'
  | 'floorSlab'
  | 'bone'
  | 'bronze'
  | 'verdigris'
  | 'iron'
  | 'cloth'
  | 'ember'
  | 'veil'

export type OssuaryObjectId =
  | 'ossuary.floor.slab'
  | 'ossuary.floor.inlay'
  | 'ossuary.wall.bay'
  | 'ossuary.wall.break'
  | 'ossuary.buttress'
  | 'ossuary.arch.full'
  | 'ossuary.arch.rib'
  | 'ossuary.niche.recess'
  | 'ossuary.niche.arch'
  | 'ossuary.sarcophagus.body'
  | 'ossuary.sarcophagus.lid'
  | 'ossuary.marker.body'
  | 'ossuary.marker.cap'
  | 'ossuary.rubble.cluster'
  | 'ossuary.candle.body'
  | 'ossuary.candle.flame'
  | 'ossuary.banner'
  | 'ossuary.root.cluster'
  | 'ossuary.wisp'
  | 'ossuary.landmark.veil-monolith'
  | 'ossuary.landmark.reliquary-plinth'
  | 'ossuary.corridor.bell'

export type WorldObjectRenderMode = 'instanced' | 'unique'

export interface WorldObjectDefinition {
  readonly id: OssuaryObjectId
  readonly family: WorldObjectFamily
  readonly materialKey: OssuaryMaterialKey
  readonly defaultScale: readonly [number, number, number]
  readonly castShadow: boolean
  readonly receiveShadow: boolean
  readonly renderMode: WorldObjectRenderMode
  /** Optional authored visual bounds hint for documentation/debug — not collision. */
  readonly visualBounds?: readonly [number, number, number]
}

export interface WorldObjectPlacement {
  readonly instanceId: string
  readonly objectId: OssuaryObjectId
  readonly area: OssuaryRouteArea
  readonly position: readonly [number, number, number]
  readonly rotation: readonly [number, number, number]
  readonly scale?: readonly [number, number, number]
  readonly variant?: string
}

export function resolvePlacementScale(
  placement: WorldObjectPlacement,
  definition: WorldObjectDefinition,
): readonly [number, number, number] {
  return placement.scale ?? definition.defaultScale
}
