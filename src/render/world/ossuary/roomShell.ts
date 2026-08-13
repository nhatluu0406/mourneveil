import type { OssuaryRouteArea, RoomWallSide, WorldObjectPlacement } from '../worldObjectTypes'
import {
  isCameraNearSide,
  MOURNEVEIL_DUNGEON_ROOMS,
  planeIsCameraNear,
  roomUnionBounds,
  type DungeonOpeningDefinition,
  type DungeonRoomDefinition,
  type RoomBounds,
} from './dungeonRooms'

const ZERO = Object.freeze([0, 0, 0] as const)
const BAY_LENGTH = 2.05
const TALL_WALL_Y = 0.88

export function place(
  instanceId: string,
  objectId: WorldObjectPlacement['objectId'],
  area: OssuaryRouteArea,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = ZERO,
  scale?: readonly [number, number, number],
  variant?: string,
  supportInstanceId?: string,
): WorldObjectPlacement {
  return Object.freeze({
    instanceId,
    objectId,
    area,
    position: Object.freeze(position),
    rotation: Object.freeze(rotation),
    ...(scale === undefined ? {} : { scale: Object.freeze(scale) }),
    ...(variant === undefined ? {} : { variant }),
    ...(supportInstanceId === undefined ? {} : { supportInstanceId }),
  })
}

export function generateDungeonShell(
  rooms: readonly DungeonRoomDefinition[] = MOURNEVEIL_DUNGEON_ROOMS,
): readonly WorldObjectPlacement[] {
  const placements: WorldObjectPlacement[] = []
  const wallKeys = new Set<string>()

  for (const room of rooms) {
    for (const [floorIndex, floor] of room.floors.entries()) {
      placements.push(foundationPlacement(room, floor, floorIndex))
      for (const side of ['west', 'east', 'south', 'north'] as const) {
        placements.push(
          ...wallRun(room, floor, floorIndex, side, wallKeys),
        )
      }
    }
    placements.push(...openingMarkers(room))
    placements.push(...insetSlabs(room))
  }
  return Object.freeze(placements)
}

function foundationPlacement(
  room: DungeonRoomDefinition,
  floor: RoomBounds,
  floorIndex: number,
): WorldObjectPlacement {
  const width = floor.maxX - floor.minX
  const depth = floor.maxZ - floor.minZ
  return place(
    `foundation.${room.id}.${floorIndex}`,
    'ossuary.floor.foundation',
    room.area,
    [(floor.minX + floor.maxX) / 2, 0.055, (floor.minZ + floor.maxZ) / 2],
    ZERO,
    [width, 2.4, depth],
  )
}

function wallRun(
  room: DungeonRoomDefinition,
  floor: RoomBounds,
  floorIndex: number,
  side: RoomWallSide,
  wallKeys: Set<string>,
): WorldObjectPlacement[] {
  const vertical = side === 'west' || side === 'east'
  const plane = side === 'west' ? floor.minX : side === 'east' ? floor.maxX : side === 'south' ? floor.minZ : floor.maxZ
  const runMin = vertical ? floor.minZ : floor.minX
  const runMax = vertical ? floor.maxZ : floor.maxX
  const openings = room.openings.filter(
    (opening) => opening.side === side && Math.abs((opening.plane ?? defaultPlane(room, side)) - plane) < 0.12,
  )
  const low = isCameraNearSide(room, side) || planeIsCameraNear(vertical ? 'x' : 'z', plane)
  const spans = subtractOpenings(runMin, runMax, openings)
  const result: WorldObjectPlacement[] = []
  let serial = 0
  for (const span of spans) {
    const length = span.end - span.start
    if (length < 0.35) continue
    const steps = Math.max(1, Math.round(length / BAY_LENGTH))
    const step = length / steps
    for (let index = 0; index < steps; index += 1) {
      const along = span.start + (index + 0.5) * step
      const key = `${side}:${plane.toFixed(2)}:${along.toFixed(2)}:${low ? 'low' : 'tall'}`
      if (wallKeys.has(key)) continue
      wallKeys.add(key)
      result.push(wallBay(room, floorIndex, side, plane, along, step, low, serial))
      serial += 1
    }
  }
  return result
}

function wallBay(
  room: DungeonRoomDefinition,
  floorIndex: number,
  side: RoomWallSide,
  plane: number,
  along: number,
  length: number,
  low: boolean,
  serial: number,
): WorldObjectPlacement {
  const vertical = side === 'west' || side === 'east'
  const yaw = vertical ? (side === 'east' ? 0 : Math.PI) : side === 'north' ? Math.PI / 2 : -Math.PI / 2
  const x = vertical ? plane : along
  const z = vertical ? along : plane
  const scaleZ = Math.max(0.45, length / 1.2)
  if (low) {
    return place(
      `parapet.${room.id}.${floorIndex}.${side}.${serial}`,
      'ossuary.wall.bay',
      room.area,
      [x, 0.28, z],
      [0, yaw, 0],
      [1, 0.34, scaleZ],
    )
  }
  return place(
    `wall.${room.id}.${floorIndex}.${side}.${serial}`,
    'ossuary.wall.bay',
    room.area,
    [x, TALL_WALL_Y, z],
    [0, yaw, 0],
    [1, 1, scaleZ],
  )
}

function openingMarkers(room: DungeonRoomDefinition): WorldObjectPlacement[] {
  const result: WorldObjectPlacement[] = []
  for (const opening of room.openings) {
    if (!isCameraNearSide(room, opening.side) && (opening.kind === 'door' || opening.kind === 'archway')) {
      const plane = opening.plane ?? defaultPlane(room, opening.side)
      const vertical = opening.side === 'west' || opening.side === 'east'
      const x = vertical ? plane : opening.centerAlong
      const z = vertical ? opening.centerAlong : plane
      result.push(
        place(
          `arch.${room.id}.${opening.side}.${plane}`,
          'ossuary.arch.full',
          room.area,
          [x, 1.35, z],
          [0, vertical ? Math.PI / 2 : 0, 0],
          [0.95, 0.95, 0.95],
        ),
      )
    }
  }
  return result
}

function insetSlabs(room: DungeonRoomDefinition): WorldObjectPlacement[] {
  const result: WorldObjectPlacement[] = []
  const objectId =
    room.id === 'room.sepulchre'
      ? 'ossuary.floor.seal-slab'
      : room.id === 'room.ash-walk' || room.id === 'room.final-approach'
        ? 'ossuary.floor.ash-slab'
        : 'ossuary.floor.slab'
  for (const [floorIndex, floor] of room.floors.entries()) {
    const xs = sampleAxis(floor.minX + 0.95, floor.maxX - 0.95, 1)
    const zs = sampleAxis(floor.minZ + 0.95, floor.maxZ - 0.95, 1)
    xs.forEach((x, xIndex) => {
      zs.forEach((z, zIndex) => {
        if (room.landmarkAnchor !== null) {
          const dx = x - room.landmarkAnchor[0]
          const dz = z - room.landmarkAnchor[2]
          if (Math.hypot(dx, dz) < 1.15) return
        }
        result.push(
          place(
            `slab.${room.id}.${floorIndex}.${xIndex}.${zIndex}`,
            objectId,
            room.area,
            [x, 0.062, z],
            ZERO,
            [0.92, 1, 0.92],
          ),
        )
      })
    })
  }
  return result
}

function subtractOpenings(
  runMin: number,
  runMax: number,
  openings: readonly DungeonOpeningDefinition[],
): readonly { start: number; end: number }[] {
  const cuts = openings
    .map((opening) => ({
      start: opening.centerAlong - opening.width / 2,
      end: opening.centerAlong + opening.width / 2,
    }))
    .sort((a, b) => a.start - b.start)
  const spans: Array<{ start: number; end: number }> = []
  let cursor = runMin
  for (const cut of cuts) {
    if (cut.start > cursor + 0.08) spans.push({ start: cursor, end: Math.min(cut.start, runMax) })
    cursor = Math.max(cursor, cut.end)
  }
  if (cursor < runMax - 0.08) spans.push({ start: cursor, end: runMax })
  return spans
}

function defaultPlane(room: DungeonRoomDefinition, side: RoomWallSide): number {
  const box = roomUnionBounds(room)
  if (side === 'west') return box.minX
  if (side === 'east') return box.maxX
  if (side === 'south') return box.minZ
  return box.maxZ
}

function sampleAxis(min: number, max: number, count: number): readonly number[] {
  if (max - min < 0.6) return [(min + max) / 2]
  if (count <= 1) return [(min + max) / 2]
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, index) => min + index * step)
}
