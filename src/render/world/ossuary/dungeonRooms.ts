import type { MourneveilConnectionId, MourneveilZoneId } from '../../../game/world/connectedLevel'
import type { OssuaryObjectId, OssuaryRouteArea, RoomWallSide } from '../worldObjectTypes'

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
  readonly area: OssuaryRouteArea
  readonly zoneIds: readonly MourneveilZoneId[]
  readonly floors: readonly RoomBounds[]
  readonly cameraNearSides: readonly RoomWallSide[]
  readonly openings: readonly DungeonOpeningDefinition[]
  readonly landmarkAnchor: readonly [number, number, number] | null
  readonly lightAnchors: readonly DungeonLightAnchor[]
  readonly dressingZones: readonly RoomBounds[]
}

export const CAMERA_NEAR_SIDES: readonly RoomWallSide[] = Object.freeze(['east', 'north'])

export const MOURNEVEIL_DUNGEON_ROOMS: readonly DungeonRoomDefinition[] = Object.freeze([
  Object.freeze({
    id: 'room.outer-watch',
    area: 'first-combat',
    zoneIds: Object.freeze(['zone.arrival', 'zone.first-combat'] as const),
    floors: Object.freeze([
      bounds(-16, -11, 3, 9),
      bounds(-12, -7, 0, 5),
    ]),
    cameraNearSides: CAMERA_NEAR_SIDES,
    openings: Object.freeze([
      opening('east', 5, 2.4, 'door', 'connection.arrival-first-combat', -11),
      opening('east', 1, 2.2, 'door', 'connection.first-combat-checkpoint', -7),
    ]),
    landmarkAnchor: Object.freeze([-10.4, 0, 1.2] as const),
    lightAnchors: Object.freeze([
      light('watch.sconce.west', 'ossuary.light.wall-sconce', [-15.55, 1.12, 6], [0, Math.PI / 2, 0], false),
      light('watch.brazier', 'ossuary.light.brazier', [-8.35, 0.02, 0.85], [0, 0, 0], true),
    ]),
    dressingZones: Object.freeze([bounds(-16, -14.4, 7.2, 9), bounds(-12, -10.6, 0, 1.2)]),
  }),
  Object.freeze({
    id: 'room.refuge',
    area: 'refuge',
    zoneIds: Object.freeze(['zone.checkpoint'] as const),
    floors: Object.freeze([bounds(-8, -4, -2, 2)]),
    cameraNearSides: CAMERA_NEAR_SIDES,
    openings: Object.freeze([
      opening('west', 1, 2.2, 'door', 'connection.first-combat-checkpoint'),
      opening('south', -5, 2.2, 'corridor', 'connection.checkpoint-mixed-long'),
    ]),
    landmarkAnchor: Object.freeze([-5.5, 0, 0] as const),
    lightAnchors: Object.freeze([
      light('refuge.sconce.west', 'ossuary.light.wall-sconce', [-7.78, 1.12, -0.85], [0, Math.PI / 2, 0], true),
      light('refuge.candles.south', 'ossuary.light.candle-cluster', [-4.55, 0.04, -1.55], [0, 0, 0], false),
    ]),
    dressingZones: Object.freeze([bounds(-8, -7.15, 1.15, 2), bounds(-4.85, -4, -2, -1.15)]),
  }),
  Object.freeze({
    id: 'room.corridor',
    area: 'corridor',
    zoneIds: Object.freeze(['zone.checkpoint', 'zone.mixed-combat'] as const),
    floors: Object.freeze([bounds(-8, -3, -5.5, -2)]),
    cameraNearSides: CAMERA_NEAR_SIDES,
    openings: Object.freeze([
      opening('north', -5, 2.2, 'corridor', 'connection.checkpoint-mixed-long'),
      opening('east', -4, 2.4, 'corridor', 'connection.checkpoint-mixed-long'),
    ]),
    landmarkAnchor: null,
    lightAnchors: Object.freeze([
      light('corridor.sconce.west', 'ossuary.light.wall-sconce', [-7.78, 1.12, -3.6], [0, Math.PI / 2, 0], false),
      light('corridor.torch.south', 'ossuary.light.processional-torch', [-6.4, 0.02, -5.15], [0, 0, 0], false),
    ]),
    dressingZones: Object.freeze([bounds(-8, -6.8, -5.5, -4.6)]),
  }),
  Object.freeze({
    id: 'room.court',
    area: 'court',
    zoneIds: Object.freeze(['zone.mixed-combat'] as const),
    floors: Object.freeze([bounds(-3, 1, -7, -1)]),
    cameraNearSides: CAMERA_NEAR_SIDES,
    openings: Object.freeze([
      opening('west', -4, 2.4, 'corridor', 'connection.checkpoint-mixed-long'),
      opening('east', -4, 2.4, 'door'),
      opening('north', -3, 1.8, 'gate', 'connection.shortcut-checkpoint-mixed'),
    ]),
    landmarkAnchor: Object.freeze([0.15, 0, -6.15] as const),
    lightAnchors: Object.freeze([
      light('court.bowl', 'ossuary.light.ember-bowl', [0.15, 0.04, -6.15], [0, 0, 0], true),
      light('court.sconce.south', 'ossuary.light.double-sconce', [-1.4, 1.12, -6.78], [0, 0, 0], false),
    ]),
    dressingZones: Object.freeze([bounds(-3, -1.8, -7, -5.8), bounds(-0.2, 1, -2.2, -1)]),
  }),
  Object.freeze({
    id: 'room.mixed-court',
    area: 'mixed-court',
    zoneIds: Object.freeze(['zone.mixed-combat'] as const),
    floors: Object.freeze([bounds(1, 4, -7, -1)]),
    cameraNearSides: CAMERA_NEAR_SIDES,
    openings: Object.freeze([
      opening('west', -4, 2.4, 'door'),
      opening('east', -4, 2.4, 'door', 'connection.mixed-final-approach'),
    ]),
    landmarkAnchor: Object.freeze([3.35, 0, -6.2] as const),
    lightAnchors: Object.freeze([
      light('mixed.spectral', 'ossuary.light.spectral-reliquary', [3.35, 0.02, -6.2], [0, 0, 0], true),
      light('mixed.sconce.south', 'ossuary.light.wall-sconce', [2.2, 1.12, -6.78], [0, 0, 0], false),
    ]),
    dressingZones: Object.freeze([bounds(1, 1.8, -7, -5.9), bounds(3.2, 4, -2.1, -1)]),
  }),
  Object.freeze({
    id: 'room.ash-walk',
    area: 'ash-walk',
    zoneIds: Object.freeze(['zone.final-approach'] as const),
    floors: Object.freeze([bounds(4, 7, -7, -1)]),
    cameraNearSides: CAMERA_NEAR_SIDES,
    openings: Object.freeze([
      opening('west', -4, 2.4, 'door', 'connection.mixed-final-approach'),
      opening('east', -4, 2.4, 'corridor'),
    ]),
    landmarkAnchor: Object.freeze([5.5, 0, -2.55] as const),
    lightAnchors: Object.freeze([
      light('ash.veil', 'ossuary.light.veil-lamp', [5.5, 0.02, -2.55], [0, 0, 0], true),
      light('ash.sconce.south', 'ossuary.light.wall-sconce', [5.4, 1.12, -6.78], [0, 0, 0], false),
    ]),
    dressingZones: Object.freeze([bounds(4, 4.8, -7, -5.9)]),
  }),
  Object.freeze({
    id: 'room.final-approach',
    area: 'final-approach',
    zoneIds: Object.freeze(['zone.final-approach'] as const),
    floors: Object.freeze([bounds(7, 10, -7, -1)]),
    cameraNearSides: CAMERA_NEAR_SIDES,
    openings: Object.freeze([
      opening('west', -4, 2.4, 'corridor'),
      opening('east', -4, 2.9, 'gate', 'connection.gate-final-arena'),
    ]),
    landmarkAnchor: Object.freeze([8.4, 0, -2.4] as const),
    lightAnchors: Object.freeze([
      light('approach.sconce.south', 'ossuary.light.double-sconce', [8.8, 1.12, -6.78], [0, 0, 0], false),
    ]),
    dressingZones: Object.freeze([bounds(7, 7.8, -7, -5.9)]),
  }),
  Object.freeze({
    id: 'room.sepulchre',
    area: 'final-arena',
    zoneIds: Object.freeze(['zone.final-arena'] as const),
    floors: Object.freeze([bounds(10, 16, -8, 0)]),
    cameraNearSides: CAMERA_NEAR_SIDES,
    openings: Object.freeze([opening('west', -4, 2.9, 'gate', 'connection.gate-final-arena')]),
    landmarkAnchor: Object.freeze([13, 0, -4] as const),
    lightAnchors: Object.freeze([
      light('sepulchre.candelabrum', 'ossuary.light.candelabrum', [10.85, 0.02, -6.55], [0, 0, 0], true),
      light('sepulchre.veil', 'ossuary.light.veil-lamp', [15.35, 0.02, -6.35], [0, 0, 0], true),
      light('sepulchre.sconce.south', 'ossuary.light.wall-sconce', [13, 1.12, -7.78], [0, 0, 0], false),
    ]),
    dressingZones: Object.freeze([bounds(10.2, 11.3, -8, -6.6), bounds(14.7, 16, -1.4, 0)]),
  }),
])

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

export function roomById(id: DungeonRoomId): DungeonRoomDefinition {
  const room = MOURNEVEIL_DUNGEON_ROOMS.find((entry) => entry.id === id)
  if (room === undefined) throw new Error(`Unknown dungeon room: ${id}`)
  return room
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

/** True when this plane is a camera-near edge of any authored room (low parapet wins). */
export function planeIsCameraNear(axis: 'x' | 'z', value: number, tolerance = 0.08): boolean {
  for (const room of MOURNEVEIL_DUNGEON_ROOMS) {
    if (axis === 'x' && room.cameraNearSides.includes('east') && Math.abs(sidePlane(room, 'east') - value) <= tolerance) {
      return true
    }
    if (axis === 'z' && room.cameraNearSides.includes('north') && Math.abs(sidePlane(room, 'north') - value) <= tolerance) {
      return true
    }
  }
  return false
}

function bounds(minX: number, maxX: number, minZ: number, maxZ: number): RoomBounds {
  return Object.freeze({ minX, maxX, minZ, maxZ })
}

function opening(
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

function light(
  id: string,
  objectId: OssuaryObjectId,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number],
  actualLight: boolean,
): DungeonLightAnchor {
  return Object.freeze({ id, objectId, position, rotation, actualLight })
}
