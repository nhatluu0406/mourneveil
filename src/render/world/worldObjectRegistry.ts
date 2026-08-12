import type { BufferGeometry, MeshStandardMaterial } from 'three'
import { OSSUARY_OBJECT_DEFINITIONS } from './ossuary/definitions'
import { getOssuaryObjectGeometry } from './ossuary/geometries'
import { getOssuaryMaterial } from './ossuary/materials'
import type {
  OssuaryObjectId,
  WorldObjectDefinition,
  WorldObjectPlacement,
} from './worldObjectTypes'
import { resolvePlacementScale } from './worldObjectTypes'

export class UnknownWorldObjectIdError extends Error {
  readonly objectId: string

  constructor(objectId: string) {
    super(`Unknown world object id: "${objectId}"`)
    this.name = 'UnknownWorldObjectIdError'
    this.objectId = objectId
  }
}

export interface ResolvedInstancedWorldObject {
  readonly definition: WorldObjectDefinition
  readonly geometry: BufferGeometry
  readonly material: MeshStandardMaterial
}

/** Immutable typed registry — resolve by stable objectId only. */
export function resolveWorldObjectDefinition(objectId: string): WorldObjectDefinition {
  const definition = OSSUARY_OBJECT_DEFINITIONS[objectId as OssuaryObjectId]
  if (definition === undefined) {
    throw new UnknownWorldObjectIdError(objectId)
  }
  return definition
}

export function resolveInstancedWorldObject(objectId: string): ResolvedInstancedWorldObject {
  const definition = resolveWorldObjectDefinition(objectId)
  if (definition.renderMode !== 'instanced') {
    throw new Error(`World object "${objectId}" is not instanced (mode=${definition.renderMode})`)
  }
  return Object.freeze({
    definition,
    geometry: getOssuaryObjectGeometry(definition.id),
    material: getOssuaryMaterial(definition.materialKey),
  })
}

export function listRegisteredWorldObjectIds(): readonly OssuaryObjectId[] {
  return Object.freeze(Object.keys(OSSUARY_OBJECT_DEFINITIONS) as OssuaryObjectId[])
}

export function groupPlacementsByObjectId(
  placements: readonly WorldObjectPlacement[],
): ReadonlyMap<OssuaryObjectId, readonly WorldObjectPlacement[]> {
  const groups = new Map<OssuaryObjectId, WorldObjectPlacement[]>()
  for (const placement of placements) {
    resolveWorldObjectDefinition(placement.objectId)
    const bucket = groups.get(placement.objectId)
    if (bucket === undefined) {
      groups.set(placement.objectId, [placement])
    } else {
      bucket.push(placement)
    }
  }
  return groups
}

export function placementTransformMatrixInputs(
  placement: WorldObjectPlacement,
): {
  readonly position: readonly [number, number, number]
  readonly rotation: readonly [number, number, number]
  readonly scale: readonly [number, number, number]
} {
  const definition = resolveWorldObjectDefinition(placement.objectId)
  return {
    position: placement.position,
    rotation: placement.rotation,
    scale: resolvePlacementScale(placement, definition),
  }
}
