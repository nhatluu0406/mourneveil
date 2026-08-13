import type { Aabb3 } from '../cameraOcclusion'
import { aabbFromCenterSize } from '../cameraOcclusion'
import { worldObjectAllowsFade } from '../allowedOcclusionFade'
import { resolveWorldObjectDefinition } from './worldObjectRegistry'
import {
  resolvePlacementScale,
  type WorldObjectPlacement,
} from './worldObjectTypes'

let occludedIds = new Set<string>()
let fadeSolids: Array<{ id: string; box: Aabb3 }> = []
let occlusionOverride: 'auto' | 'all-fade' | 'none' = 'auto'

/** Presentation-only: which placement instance IDs are currently camera-occluding. */
export function setOccludedPlacementIds(ids: ReadonlySet<string>): void {
  if (occlusionOverride === 'all-fade') {
    occludedIds = new Set(fadeSolids.map((solid) => solid.id))
    return
  }
  if (occlusionOverride === 'none') {
    occludedIds = new Set()
    return
  }
  occludedIds = new Set(ids)
}

/** DEV gate helper: pin occlusion set so CameraOcclusionFader cannot overwrite. */
export function setOcclusionOverride(mode: 'auto' | 'all-fade' | 'none'): void {
  occlusionOverride = mode
  if (mode === 'all-fade') {
    occludedIds = new Set(fadeSolids.map((solid) => solid.id))
  } else if (mode === 'none') {
    occludedIds = new Set()
  }
}

export function getOcclusionOverride(): 'auto' | 'all-fade' | 'none' {
  return occlusionOverride
}

export function isPlacementOccluded(instanceId: string): boolean {
  return occludedIds.has(instanceId)
}

export function readOccludedPlacementIds(): readonly string[] {
  return [...occludedIds]
}

export function listFadeOcclusionSolids(): ReadonlyArray<{ readonly id: string; readonly box: Aabb3 }> {
  return fadeSolids
}

/**
 * Build AABB candidates for ADR-0002 placements marked occlusionPolicy='fade'.
 * Uses visualBounds * placement scale (rotation ignored — conservative).
 */
export function rebuildFadeOcclusionSolids(placements: readonly WorldObjectPlacement[]): void {
  fadeSolids = placements.flatMap((placement) => {
    const definition = resolveWorldObjectDefinition(placement.objectId)
    if (!worldObjectAllowsFade(definition.occlusionPolicy)) return []
    const bounds = definition.visualBounds ?? [1, 1, 1]
    const scale = resolvePlacementScale(placement, definition)
    // Pad so thin rotated wall bays still catch high-oblique readability casts.
    const pad = 0.55
    const size: [number, number, number] = [
      bounds[0] * scale[0] + pad,
      bounds[1] * scale[1] + pad * 0.5,
      bounds[2] * scale[2] + pad,
    ]
    return [{ id: placement.instanceId, box: aabbFromCenterSize(placement.position, size) }]
  })
}
