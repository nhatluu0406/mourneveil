import type { WorldObjectPlacement } from '../worldObjectTypes'
import { MOURNEVEIL_DUNGEON_ROOMS, type DungeonRoomDefinition } from './dungeonRooms'
import { place } from './roomShell'

const ZERO = Object.freeze([0, 0, 0] as const)

/** Sparse room dressing. Center playspace stays clear except the landmark. */
export function generateRoomDressing(
  rooms: readonly DungeonRoomDefinition[] = MOURNEVEIL_DUNGEON_ROOMS,
): readonly WorldObjectPlacement[] {
  return Object.freeze([
    ...rooms.flatMap((room) => [...landmarks(room), ...lights(room), ...cornerDressing(room)]),
    ...explicitSupports(),
    ...magicalVfx(),
    ...perimeterMasses(),
  ])
}

function landmarks(room: DungeonRoomDefinition): WorldObjectPlacement[] {
  const anchor = room.landmarkAnchor
  if (anchor === null) return []
  switch (room.id) {
    case 'room.outer-watch':
      return [place('landmark.watch.monolith', 'ossuary.landmark.veil-monolith', room.area, anchor)]
    case 'room.refuge':
      return []
    case 'room.court':
      return []
    case 'room.mixed-court':
      return []
    case 'room.ash-walk':
      return []
    case 'room.final-approach':
      return [place('landmark.approach.cairn', 'ossuary.rubble.cluster', room.area, [anchor[0], 0.06, anchor[2]], ZERO, [1.15, 0.7, 1.15])]
    case 'room.sepulchre':
      return [place('landmark.sepulchre.seal', 'ossuary.landmark.arena-seal', room.area, anchor)]
    default:
      return []
  }
}

function lights(room: DungeonRoomDefinition): WorldObjectPlacement[] {
  return room.lightAnchors.map((anchor) =>
    place(
      `light.${anchor.id}`,
      anchor.objectId,
      room.area,
      anchor.position,
      anchor.rotation ?? ZERO,
      undefined,
      anchor.actualLight ? 'actual-light' : undefined,
    ),
  )
}

function cornerDressing(room: DungeonRoomDefinition): WorldObjectPlacement[] {
  const result: WorldObjectPlacement[] = []
  room.dressingZones.forEach((zone, index) => {
    const x = (zone.minX + zone.maxX) / 2
    const z = (zone.minZ + zone.maxZ) / 2
    const far = z < (room.landmarkAnchor?.[2] ?? z) || x < (room.landmarkAnchor?.[0] ?? x)
    if (index === 0 && far) {
      result.push(
        place(`dressing.${room.id}.sarcophagus`, 'ossuary.sarcophagus.body', room.area, [x, 0.22, z], [0, 0.04, 0]),
        place(`dressing.${room.id}.lid`, 'ossuary.sarcophagus.lid', room.area, [x, 0.48, z], [0, 0.04, 0]),
      )
    } else {
      result.push(
        place(`dressing.${room.id}.rubble.${index}`, 'ossuary.rubble.cluster', room.area, [x, 0.05, z], ZERO, [0.85, 0.7, 0.85]),
      )
    }
    if (index === 0 && room.id !== 'room.corridor' && room.id !== 'room.ash-walk' && room.id !== 'room.final-approach') {
      result.push(
        place(
          `dressing.${room.id}.niche`,
          'ossuary.niche.recess',
          room.area,
          [zone.minX + 0.08, 0.92, z],
          [0, Math.PI / 2, 0],
        ),
      )
    }
  })
  return result
}

function explicitSupports(): WorldObjectPlacement[] {
  const arch = place(
    'arch.corridor.south',
    'ossuary.arch.full',
    'corridor',
    [-5.5, 1.42, -5.42],
    [0, 0, 0],
    [1, 1, 1],
  )
  const bell = place(
    'bell.corridor.south',
    'ossuary.corridor.bell',
    'corridor',
    [-5.5, 2.05, -5.42],
    [0, 0, Math.PI / 2],
    undefined,
    undefined,
    arch.instanceId,
  )
  return [arch, bell]
}

function magicalVfx(): WorldObjectPlacement[] {
  return [
    place('vfx.wisp.refuge', 'ossuary.wisp', 'refuge', [-7.35, 1.15, 1.55], ZERO, [0.7, 0.7, 0.7], 'vfx'),
    place('vfx.wisp.court', 'ossuary.wisp', 'court', [-2.35, 1.15, -6.35], ZERO, [0.65, 0.65, 0.65], 'vfx'),
    place('vfx.wisp.ash', 'ossuary.wisp', 'ash-walk', [6.55, 1.15, -6.2], ZERO, [0.6, 0.6, 0.6], 'vfx'),
    place('vfx.wisp.sepulchre', 'ossuary.wisp', 'final-arena', [15.1, 1.2, -1.35], ZERO, [0.7, 0.7, 0.7], 'vfx'),
  ]
}

function perimeterMasses(): WorldObjectPlacement[] {
  return [
    place('silhouette.north', 'ossuary.silhouette.mass', 'perimeter', [-6, 0.85, 12.4], ZERO, [3.2, 1.6, 1.4]),
    place('silhouette.west', 'ossuary.silhouette.mass', 'perimeter', [-19.2, 0.9, 4], ZERO, [1.6, 1.8, 3.4]),
    place('silhouette.south', 'ossuary.silhouette.mass', 'perimeter', [2, 0.8, -11.2], ZERO, [4.2, 1.5, 1.3]),
    place('silhouette.ash.east', 'ossuary.silhouette.mass', 'perimeter', [18.6, 0.85, -4], ZERO, [1.5, 1.7, 3.6]),
    place('silhouette.column.se', 'ossuary.silhouette.column', 'perimeter', [17.4, 1.1, -9.2], ZERO, [1, 1.3, 1]),
  ]
}
