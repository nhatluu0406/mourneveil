/** Canonical world-object contracts. Definitions are immutable; runtimes hold instance state. */

export type OssuaryRouteArea =
  | 'refuge'
  | 'corridor'
  | 'first-combat'
  | 'court'
  | 'mixed-court'
  | 'ash-walk'
  | 'final-approach'
  | 'final-arena'
  | 'perimeter'

export type WorldObjectAnchorPolicy = 'floor' | 'wall' | 'hanging' | 'structural' | 'vfx'

export type RoomWallSide = 'north' | 'south' | 'east' | 'west'

export type WorldObjectFamily =
  | 'architecture'
  | 'burial'
  | 'metal'
  | 'dressing'
  | 'landmark'
  | 'lighting'
  | 'interactive'
  | 'vfx'

export type OssuaryMaterialKey =
  | 'darkStone'
  | 'recessStone'
  | 'floorSlab'
  | 'sealStone'
  | 'ashStone'
  | 'bone'
  | 'bronze'
  | 'verdigris'
  | 'iron'
  | 'cloth'
  | 'ember'
  | 'veil'

export type OssuaryObjectId =
  | 'ossuary.floor.slab'
  | 'ossuary.floor.ash-slab'
  | 'ossuary.floor.seal-slab'
  | 'ossuary.floor.inlay'
  | 'ossuary.floor.foundation'
  | 'ossuary.floor.broken-edge'
  | 'ossuary.floor.pit-rim'
  | 'ossuary.wall.bay'
  | 'ossuary.wall.parapet'
  | 'ossuary.wall.break'
  | 'ossuary.buttress'
  | 'ossuary.arch.full'
  | 'ossuary.arch.rib'
  | 'ossuary.arch.lancet'
  | 'ossuary.arch.lancet-broken'
  | 'ossuary.buttress.split'
  | 'ossuary.niche.cluster'
  | 'ossuary.memorial.cluster'
  | 'ossuary.reliquary.chain'
  | 'ossuary.wall.ledge'
  | 'ossuary.grave.plaque'
  | 'ossuary.metal.bronze-brace'
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
  | 'ossuary.silhouette.mass'
  | 'ossuary.silhouette.column'
  | 'ossuary.light.wall-sconce'
  | 'ossuary.light.brazier'
  | 'ossuary.light.veil-lamp'
  | 'ossuary.light.candle-cluster'
  | 'ossuary.light.candelabrum'
  | 'ossuary.light.reliquary-lantern'
  | 'ossuary.light.double-sconce'
  | 'ossuary.light.processional-torch'
  | 'ossuary.light.ember-bowl'
  | 'ossuary.light.spectral-reliquary'
  | 'ossuary.metal.burial-screen'
  | 'ossuary.reliquary.broken'
  | 'ossuary.landmark.arena-seal'
  | 'ossuary.landmark.veil-monolith'
  | 'ossuary.landmark.reliquary-plinth'
  | 'ossuary.corridor.bell'
  | 'ossuary.gate.shortcut'
  | 'ossuary.gate.final'
  | 'ossuary.interactive.checkpoint-shrine'

export type WorldObjectRenderMode = 'instanced' | 'unique'

/** Only explicitly allowlisted IDs may fade. Architecture defaults to solid. */
export type WorldObjectOcclusionPolicy = 'fade' | 'solid'

export type WorldColliderKind =
  | 'floor'
  | 'wall'
  | 'blocker'
  | 'checkpoint'
  | 'shortcut-gate'
  | 'final-gate'

export type WorldCollisionKind = 'none' | 'box' | 'compound'

export interface WorldObjectCollision {
  readonly kind: WorldCollisionKind
  readonly colliderKind?: WorldColliderKind
  /** Local-space box before placement scale/yaw. Defaults to visualBounds. */
  readonly dimensions?: readonly [number, number, number]
  readonly navigationBlocking?: boolean
}

export type WorldLightingKind = 'none' | 'emissive' | 'actual'

export interface WorldObjectLighting {
  readonly kind: WorldLightingKind
}

export type WorldInteractionKind = 'none' | 'checkpoint' | 'gate'

export interface WorldObjectInteraction {
  readonly kind: WorldInteractionKind
}

export interface WorldObjectDefinition {
  readonly id: OssuaryObjectId
  readonly family: WorldObjectFamily
  readonly materialKey: OssuaryMaterialKey
  readonly defaultScale: readonly [number, number, number]
  readonly castShadow: boolean
  readonly receiveShadow: boolean
  readonly renderMode: WorldObjectRenderMode
  readonly occlusionPolicy?: WorldObjectOcclusionPolicy
  readonly anchorPolicy?: WorldObjectAnchorPolicy
  readonly visualBounds?: readonly [number, number, number]
  readonly collision?: WorldObjectCollision
  readonly lighting?: WorldObjectLighting
  readonly interaction?: WorldObjectInteraction
  readonly tags?: readonly string[]
}

export interface WorldObjectPlacement {
  readonly instanceId: string
  readonly objectId: OssuaryObjectId
  readonly area: OssuaryRouteArea
  readonly position: readonly [number, number, number]
  readonly rotation: readonly [number, number, number]
  readonly scale?: readonly [number, number, number]
  readonly variant?: string
  /** Hanging placements must name a structural support instance. */
  readonly supportInstanceId?: string
}

export function resolvePlacementScale(
  placement: WorldObjectPlacement,
  definition: WorldObjectDefinition,
): readonly [number, number, number] {
  return placement.scale ?? definition.defaultScale
}

export function resolveObjectCollision(definition: WorldObjectDefinition): WorldObjectCollision {
  return definition.collision ?? { kind: 'none' }
}
