import type { WorldObjectPlacement } from '../worldObjectTypes'
import { resolveWorldObjectDefinition } from '../worldObjectRegistry'
import { MOURNEVEIL_DUNGEON_ROOMS, pointInRoom, type DungeonRoomDefinition } from './dungeonRooms'

export type PlacementAuditStatus = 'ok' | 'unsupported' | 'missing-support' | 'vfx'

export interface PlacementAuditEntry {
  readonly id: string
  readonly area: string
  readonly objectId: string
  readonly anchorType: string
  readonly baseY: number
  readonly support: string | null
  readonly status: PlacementAuditStatus
}

export function inferAnchorPolicy(placement: WorldObjectPlacement): string {
  const authored = resolveWorldObjectDefinition(placement.objectId).anchorPolicy
  if (authored !== undefined) return authored
  const id = placement.objectId
  if (id === 'ossuary.wisp' || placement.variant === 'vfx') return 'vfx'
  if (id === 'ossuary.reliquary.chain' || id === 'ossuary.corridor.bell') return 'hanging'
  if (id.includes('sconce') || id.includes('lantern')) return 'wall'
  if (id.startsWith('ossuary.light.')) return 'floor'
  if (
    id.includes('wall') ||
    id.includes('sconce') ||
    id === 'ossuary.banner' ||
    id === 'ossuary.grave.plaque' ||
    id === 'ossuary.niche.arch' ||
    id === 'ossuary.niche.recess'
  ) {
    return 'wall'
  }
  if (
    id.includes('arch') ||
    id.includes('buttress') ||
    id.includes('silhouette') ||
    id === 'ossuary.floor.foundation'
  ) {
    return 'structural'
  }
  return 'floor'
}

export function auditPlacement(
  placement: WorldObjectPlacement,
  all: readonly WorldObjectPlacement[],
): PlacementAuditEntry {
  const anchorType = inferAnchorPolicy(placement)
  const support = placement.supportInstanceId ?? null
  let status: PlacementAuditStatus = 'ok'
  if (anchorType === 'vfx') status = 'vfx'
  else if (anchorType === 'hanging') {
    const parent = support === null ? undefined : all.find((entry) => entry.instanceId === support)
    status = parent === undefined ? 'missing-support' : 'ok'
  }   else if (anchorType === 'floor' || anchorType === 'structural') {
    const objectId = placement.objectId
    if (objectId.includes('arch') || objectId.includes('silhouette')) {
      if (placement.position[1] > 2.4) status = 'unsupported'
    } else if (placement.position[1] > 1.15) status = 'unsupported'
  } else if (anchorType === 'wall') {
    if (!nearAnyRoomWall(placement.position[0], placement.position[2])) status = 'unsupported'
  }
  return {
    id: placement.instanceId,
    area: placement.area,
    objectId: placement.objectId,
    anchorType,
    baseY: placement.position[1],
    support,
    status,
  }
}

export function auditWorldPlacements(
  placements: readonly WorldObjectPlacement[],
  rooms: readonly DungeonRoomDefinition[] = MOURNEVEIL_DUNGEON_ROOMS,
): {
  readonly entries: readonly PlacementAuditEntry[]
  readonly unsupportedOrdinary: readonly PlacementAuditEntry[]
} {
  void rooms
  const entries = placements.map((placement) => auditPlacement(placement, placements))
  return {
    entries,
    unsupportedOrdinary: entries.filter(
      (entry) => entry.status === 'unsupported' || entry.status === 'missing-support',
    ),
  }
}

export function toWorldPlacementAuditJson(
  placements: readonly WorldObjectPlacement[],
): { readonly entries: readonly PlacementAuditEntry[] } {
  return { entries: auditWorldPlacements(placements).entries }
}

function nearAnyRoomWall(x: number, z: number): boolean {
  for (const room of MOURNEVEIL_DUNGEON_ROOMS) {
    if (!pointInRoom(x, z, room) && !pointInRoom(x, z, { ...room, floors: room.floors.map((floor) => ({
      minX: floor.minX - 0.45,
      maxX: floor.maxX + 0.45,
      minZ: floor.minZ - 0.45,
      maxZ: floor.maxZ + 0.45,
    })) })) {
      continue
    }
    for (const floor of room.floors) {
      const edge =
        Math.abs(x - floor.minX) < 0.55 ||
        Math.abs(x - floor.maxX) < 0.55 ||
        Math.abs(z - floor.minZ) < 0.55 ||
        Math.abs(z - floor.maxZ) < 0.55
      if (edge) return true
    }
  }
  return false
}
