import type { MourneveilZoneId } from '../../../game/world/connectedLevel'
import type { OssuaryRouteArea, WorldObjectPlacement } from '../worldObjectTypes'
import { resolveWorldObjectDefinition } from '../worldObjectRegistry'
import { OSSUARY_ROUTE_PLACEMENTS } from './routePlacements'

export const ALL_ROUTE_AREAS: readonly OssuaryRouteArea[] = Object.freeze([
  'refuge',
  'corridor',
  'first-combat',
  'mixed-court',
  'ash-walk',
  'final-arena',
  'perimeter',
])

/** Current zone plus visually adjacent rooms. Perimeter stays mounted to avoid skybox pop. */
export const ZONE_VISIBLE_AREAS: Readonly<Record<MourneveilZoneId, readonly OssuaryRouteArea[]>> =
  Object.freeze({
    'zone.arrival': ['first-combat', 'corridor', 'refuge', 'perimeter'] as const,
    'zone.first-combat': ['first-combat', 'corridor', 'refuge', 'perimeter'] as const,
    'zone.checkpoint': [
      'refuge',
      'corridor',
      'first-combat',
      'mixed-court',
      'perimeter',
    ] as const,
    'zone.mixed-combat': [
      'mixed-court',
      'corridor',
      'refuge',
      'ash-walk',
      'perimeter',
    ] as const,
    'zone.final-approach': ['ash-walk', 'mixed-court', 'final-arena', 'perimeter'] as const,
    'zone.final-arena': ['final-arena', 'ash-walk', 'perimeter'] as const,
  })

export type PropAnchorClass =
  | 'floor-anchored'
  | 'wall-anchored'
  | 'hanging'
  | 'intentionally-floating'
  | 'architectural'

export type SceneFamilyBucket =
  | 'architecture'
  | 'floor'
  | 'lights'
  | 'rubble'
  | 'burial'
  | 'arches'
  | 'markers'
  | 'dressing'
  | 'landmarks'

export function activeRouteAreas(
  zoneId: MourneveilZoneId | null,
  cullEnabled: boolean,
): readonly OssuaryRouteArea[] {
  if (!cullEnabled || zoneId === null) return ALL_ROUTE_AREAS
  return ZONE_VISIBLE_AREAS[zoneId]
}

export function filterPlacementsForZone(
  placements: readonly WorldObjectPlacement[],
  zoneId: MourneveilZoneId | null,
  cullEnabled: boolean,
): readonly WorldObjectPlacement[] {
  const areas = new Set(activeRouteAreas(zoneId, cullEnabled))
  return placements.filter((placement) => areas.has(placement.area))
}

export function classifySceneFamily(objectId: string): SceneFamilyBucket {
  if (objectId.startsWith('ossuary.floor.')) return 'floor'
  if (objectId.startsWith('ossuary.light.') || objectId === 'ossuary.candle.flame') return 'lights'
  if (objectId.includes('arch')) return 'arches'
  if (objectId.includes('marker')) return 'markers'
  if (objectId.includes('rubble')) return 'rubble'
  if (objectId.startsWith('ossuary.landmark.') || objectId === 'ossuary.corridor.bell') {
    return 'landmarks'
  }
  const family = resolveWorldObjectDefinition(objectId).family
  if (family === 'burial') return 'burial'
  if (family === 'architecture') return 'architecture'
  if (family === 'landmark') return 'landmarks'
  return 'dressing'
}

export function classifyPropAnchor(placement: WorldObjectPlacement): PropAnchorClass {
  const id = placement.objectId
  if (id === 'ossuary.wisp') return 'intentionally-floating'
  if (id === 'ossuary.reliquary.chain' || id === 'ossuary.corridor.bell') return 'hanging'
  if (id.includes('arch') || id.includes('buttress') || id.includes('silhouette')) {
    return 'architectural'
  }
  if (
    id.includes('wall') ||
    id.includes('bay') ||
    id.includes('plaque') ||
    id.includes('sconce') ||
    id === 'ossuary.banner' ||
    id === 'ossuary.niche.arch'
  ) {
    return 'wall-anchored'
  }
  return 'floor-anchored'
}

/** Flag placements whose origin sits too high without a hanging/veil/arch reason. */
export function isSuspiciousUnsupported(placement: WorldObjectPlacement): boolean {
  const anchor = classifyPropAnchor(placement)
  if (anchor === 'hanging' || anchor === 'intentionally-floating' || anchor === 'architectural') {
    return false
  }
  if (anchor === 'wall-anchored') return false
  if (classifySceneFamily(placement.objectId) === 'lights') return false
  return placement.position[1] > 1.15
}

export interface ScenePresentationAudit {
  readonly total: number
  readonly byArea: Readonly<Record<string, number>>
  readonly byFamily: Readonly<Record<SceneFamilyBucket, number>>
  readonly byAnchor: Readonly<Record<PropAnchorClass, number>>
  readonly suspiciousUnsupported: readonly string[]
}

export function auditScenePlacements(
  placements: readonly WorldObjectPlacement[] = OSSUARY_ROUTE_PLACEMENTS,
): ScenePresentationAudit {
  const byArea: Record<string, number> = {}
  const byFamily: Record<SceneFamilyBucket, number> = {
    architecture: 0,
    floor: 0,
    lights: 0,
    rubble: 0,
    burial: 0,
    arches: 0,
    markers: 0,
    dressing: 0,
    landmarks: 0,
  }
  const byAnchor: Record<PropAnchorClass, number> = {
    'floor-anchored': 0,
    'wall-anchored': 0,
    hanging: 0,
    'intentionally-floating': 0,
    architectural: 0,
  }
  const suspiciousUnsupported: string[] = []
  for (const placement of placements) {
    byArea[placement.area] = (byArea[placement.area] ?? 0) + 1
    byFamily[classifySceneFamily(placement.objectId)] += 1
    const anchor = classifyPropAnchor(placement)
    byAnchor[anchor] += 1
    if (isSuspiciousUnsupported(placement)) suspiciousUnsupported.push(placement.instanceId)
  }
  return {
    total: placements.length,
    byArea,
    byFamily,
    byAnchor,
    suspiciousUnsupported,
  }
}
