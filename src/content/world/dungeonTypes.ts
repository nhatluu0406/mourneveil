import type { MourneveilConnectionId, MourneveilZoneId } from '../../game/world/connectedLevel'
import type {
  OssuaryObjectId,
  OssuaryRouteArea,
  RoomWallSide,
  WorldColliderKind,
  WorldObjectPlacement,
} from './worldObjectTypes'

export type DungeonRoomId =
  | 'room.outer-watch'
  | 'room.refuge'
  | 'room.corridor'
  | 'room.court'
  | 'room.mixed-court'
  | 'room.ash-walk'
  | 'room.final-approach'
  | 'room.sepulchre'

export type DungeonOpeningKind = 'door' | 'corridor' | 'gate' | 'archway'

export interface RoomBounds {
  readonly minX: number
  readonly maxX: number
  readonly minZ: number
  readonly maxZ: number
}

export interface DungeonOpeningDefinition {
  readonly side: RoomWallSide
  readonly centerAlong: number
  readonly width: number
  readonly kind: DungeonOpeningKind
  readonly connectionId?: MourneveilConnectionId
  /** Wall plane override for L-shaped rooms. Defaults to the union AABB side. */
  readonly plane?: number
}

export interface DungeonLightAnchor {
  readonly id: string
  readonly objectId: OssuaryObjectId
  readonly position: readonly [number, number, number]
  readonly rotation?: readonly [number, number, number]
  readonly actualLight: boolean
}

export interface DungeonRoomDefinition {
  readonly id: DungeonRoomId
  readonly displayName: string
  readonly area: OssuaryRouteArea
  readonly zoneIds: readonly MourneveilZoneId[]
  readonly floors: readonly RoomBounds[]
  readonly cameraNearSides: readonly RoomWallSide[]
  readonly openings: readonly DungeonOpeningDefinition[]
  readonly landmarkAnchor: readonly [number, number, number] | null
  readonly lightAnchors: readonly DungeonLightAnchor[]
  readonly dressingZones: readonly RoomBounds[]
  /** Extra authored instances (not generated from the shell). */
  readonly objectInstances?: readonly WorldObjectPlacement[]
}

export interface DungeonConnectionRef {
  readonly connectionId: MourneveilConnectionId
  readonly fromRoomId: DungeonRoomId
  readonly toRoomId: DungeonRoomId
}

export interface DungeonSpawnPoint {
  readonly id: string
  readonly position: readonly [number, number, number]
}

export interface DungeonEncounterAnchor {
  readonly encounterId: string
  readonly roomId: DungeonRoomId
}

export interface DungeonCheckpointAnchor {
  readonly id: string
  readonly roomId: DungeonRoomId
  readonly position: readonly [number, number, number]
}

export interface DungeonDefinition {
  readonly id: string
  readonly displayName: string
  readonly rooms: readonly DungeonRoomDefinition[]
  readonly connections: readonly DungeonConnectionRef[]
  readonly spawnPoints: readonly DungeonSpawnPoint[]
  readonly encounterAnchors: readonly DungeonEncounterAnchor[]
  readonly checkpointAnchors: readonly DungeonCheckpointAnchor[]
}

export interface DungeonDynamicState {
  readonly shortcutOpen: boolean
  readonly finalGateOpen: boolean
}

export interface WorldBoxCollider {
  readonly id: string
  readonly kind: WorldColliderKind
  readonly position: readonly [number, number, number]
  readonly size: readonly [number, number, number]
  readonly ownerInstanceId?: string
  readonly color?: string
}

export interface CompiledNavObstacle {
  readonly id: string
  readonly centerX: number
  readonly centerZ: number
  readonly halfX: number
  readonly halfZ: number
  readonly ownerInstanceId: string
}

export interface CompiledLight {
  readonly instanceId: string
  readonly objectId: OssuaryObjectId
  readonly position: readonly [number, number, number]
  readonly actualLight: boolean
}

export interface CompiledInteraction {
  readonly instanceId: string
  readonly kind: 'checkpoint' | 'gate'
  readonly position: readonly [number, number, number]
}

export interface CompiledDungeon {
  readonly dungeonId: string
  readonly rooms: readonly DungeonRoomDefinition[]
  readonly renderInstances: readonly WorldObjectPlacement[]
  readonly colliders: readonly WorldBoxCollider[]
  readonly navObstacles: readonly CompiledNavObstacle[]
  readonly lights: readonly CompiledLight[]
  readonly interactions: readonly CompiledInteraction[]
}

export const CAMERA_NEAR_SIDES: readonly RoomWallSide[] = Object.freeze(['east', 'north'])

export const DEFAULT_DUNGEON_DYNAMIC_STATE: DungeonDynamicState = Object.freeze({
  shortcutOpen: false,
  finalGateOpen: false,
})

export function bounds(minX: number, maxX: number, minZ: number, maxZ: number): RoomBounds {
  return Object.freeze({ minX, maxX, minZ, maxZ })
}

export function opening(
  side: RoomWallSide,
  centerAlong: number,
  width: number,
  kind: DungeonOpeningKind,
  connectionId?: MourneveilConnectionId,
  plane?: number,
): DungeonOpeningDefinition {
  return Object.freeze({
    side,
    centerAlong,
    width,
    kind,
    ...(connectionId === undefined ? {} : { connectionId }),
    ...(plane === undefined ? {} : { plane }),
  })
}

export function light(
  id: string,
  objectId: OssuaryObjectId,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number],
  actualLight: boolean,
): DungeonLightAnchor {
  return Object.freeze({ id, objectId, position, rotation, actualLight })
}

export function roomUnionBounds(room: DungeonRoomDefinition): RoomBounds {
  return room.floors.reduce(
    (union, floor) => ({
      minX: Math.min(union.minX, floor.minX),
      maxX: Math.max(union.maxX, floor.maxX),
      minZ: Math.min(union.minZ, floor.minZ),
      maxZ: Math.max(union.maxZ, floor.maxZ),
    }),
    room.floors[0]!,
  )
}

export function pointInRoomBounds(x: number, z: number, box: RoomBounds, epsilon = 0.001): boolean {
  return x >= box.minX - epsilon && x <= box.maxX + epsilon && z >= box.minZ - epsilon && z <= box.maxZ + epsilon
}

export function pointInRoom(x: number, z: number, room: DungeonRoomDefinition): boolean {
  return room.floors.some((floor) => pointInRoomBounds(x, z, floor))
}

export function sidePlane(room: DungeonRoomDefinition, side: RoomWallSide): number {
  const box = roomUnionBounds(room)
  if (side === 'west') return box.minX
  if (side === 'east') return box.maxX
  if (side === 'south') return box.minZ
  return box.maxZ
}

export function isCameraNearSide(room: DungeonRoomDefinition, side: RoomWallSide): boolean {
  return room.cameraNearSides.includes(side)
}
