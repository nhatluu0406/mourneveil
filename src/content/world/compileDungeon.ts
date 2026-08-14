import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../../game/world/checkpoint'
import { OSSUARY_OBJECT_DEFINITIONS, getWorldObjectDefinition } from './objects/catalog'
import {
  DEFAULT_DUNGEON_DYNAMIC_STATE,
  isCameraNearSide,
  sidePlane,
  type CompiledDungeon,
  type CompiledInteraction,
  type CompiledLight,
  type CompiledNavObstacle,
  type DungeonDefinition,
  type DungeonDynamicState,
  type DungeonOpeningDefinition,
  type DungeonRoomDefinition,
  type RoomBounds,
  type WorldBoxCollider,
} from './dungeonTypes'
import { instance } from './instance'
import {
  resolveObjectCollision,
  resolvePlacementScale,
  type OssuaryObjectId,
  type RoomWallSide,
  type WorldObjectDefinition,
  type WorldObjectPlacement,
} from './worldObjectTypes'

const ZERO = Object.freeze([0, 0, 0] as const)
const BAY_LENGTH = 2.05
const TALL_WALL_Y = 0.88
const PARAPET_Y = 0.28
const WALL_THICKNESS = 0.16
const TALL_WALL_HEIGHT = 1.7
const PARAPET_HEIGHT = 1.2
const FLOOR_COLLIDER_Y = -0.25
const FLOOR_COLLIDER_HEIGHT = 0.5

export type WorldObjectCatalog = Readonly<Record<OssuaryObjectId, WorldObjectDefinition>>

export function compileDungeon(
  dungeon: DungeonDefinition,
  catalog: WorldObjectCatalog = OSSUARY_OBJECT_DEFINITIONS,
  dynamicState: DungeonDynamicState = DEFAULT_DUNGEON_DYNAMIC_STATE,
): CompiledDungeon {
  const renderInstances: WorldObjectPlacement[] = []
  const colliders: WorldBoxCollider[] = []
  const wallKeys = new Set<string>()
  const colliderKeys = new Set<string>()

  if (dungeon.architecturalEnvelope !== undefined) {
    const envelope = envelopeFoundationPlacement(dungeon.architecturalEnvelope)
    renderInstances.push(envelope)
    pushUniqueCollider(colliders, colliderKeys, floorCollider(envelope, dungeon.architecturalEnvelope))
    const shell = envelopeWalls(dungeon.architecturalEnvelope)
    renderInstances.push(...shell.placements)
    for (const collider of shell.colliders) pushUniqueCollider(colliders, colliderKeys, collider)
  }

  for (const room of dungeon.rooms) {
    for (const [floorIndex, floor] of room.floors.entries()) {
      if (dungeon.architecturalEnvelope === undefined) {
        const foundation = foundationPlacement(room, floor, floorIndex)
        renderInstances.push(foundation)
        pushUniqueCollider(colliders, colliderKeys, floorCollider(foundation, floor))
      }
      for (const side of ['west', 'east', 'south', 'north'] as const) {
        if (dungeon.architecturalEnvelope !== undefined && sideIsEnvelopeBoundary(floor, side, dungeon.architecturalEnvelope)) continue
        const compiled = wallRun(dungeon.rooms, room, floor, floorIndex, side, wallKeys)
        renderInstances.push(...compiled.placements)
        for (const collider of compiled.colliders) {
          pushUniqueCollider(colliders, colliderKeys, collider)
        }
      }
    }
    renderInstances.push(...openingMarkers(room), ...insetSlabs(room), ...gateInstances(room, dynamicState))
    for (const gate of gateColliders(room, dynamicState)) {
      pushUniqueCollider(colliders, colliderKeys, gate)
    }
    renderInstances.push(...landmarks(room), ...lights(room), ...cornerDressing(room))
    if (room.objectInstances !== undefined) renderInstances.push(...room.objectInstances)
  }

  renderInstances.push(...explicitSupports(), ...magicalVfx(), ...shrineInstances(dungeon))

  for (const placement of renderInstances) {
    const definition = catalog[placement.objectId] ?? getWorldObjectDefinition(placement.objectId)
    const derived = colliderFromInstance(placement, definition, dynamicState)
    if (derived !== null) pushUniqueCollider(colliders, colliderKeys, derived)
  }

  const lightsOut: CompiledLight[] = renderInstances
    .filter((entry) => entry.objectId.startsWith('ossuary.light.'))
    .map((entry) =>
      Object.freeze({
        instanceId: entry.instanceId,
        objectId: entry.objectId,
        position: entry.position,
        actualLight: entry.variant === 'actual-light',
      }),
    )

  const interactions: CompiledInteraction[] = renderInstances.flatMap((entry) => {
    const kind = getWorldObjectDefinition(entry.objectId).interaction?.kind
    if (kind !== 'checkpoint' && kind !== 'gate') return []
    return [Object.freeze({ instanceId: entry.instanceId, kind, position: entry.position })]
  })

  const navObstacles: CompiledNavObstacle[] = colliders
    .filter((collider) => collider.kind === 'blocker' || collider.kind === 'wall')
    .map((collider) =>
      Object.freeze({
        id: collider.id,
        centerX: collider.position[0],
        centerZ: collider.position[2],
        halfX: collider.size[0] / 2,
        halfZ: collider.size[2] / 2,
        ownerInstanceId: collider.ownerInstanceId ?? collider.id,
      }),
    )

  return Object.freeze({
    dungeonId: dungeon.id,
    rooms: dungeon.rooms,
    renderInstances: Object.freeze(dedupePlacements(renderInstances)),
    colliders: Object.freeze(colliders),
    navObstacles: Object.freeze(navObstacles),
    lights: Object.freeze(lightsOut),
    interactions: Object.freeze(interactions),
  })
}

function envelopeFoundationPlacement(footprint: RoomBounds): WorldObjectPlacement {
  return instance(
    'foundation.dungeon.ossuary',
    'ossuary.floor.foundation',
    'perimeter',
    [(footprint.minX + footprint.maxX) / 2, 0.045, (footprint.minZ + footprint.maxZ) / 2],
    ZERO,
    [footprint.maxX - footprint.minX, 2.4, footprint.maxZ - footprint.minZ],
  )
}

function envelopeWalls(footprint: RoomBounds): {
  placements: WorldObjectPlacement[]
  colliders: WorldBoxCollider[]
} {
  const placements: WorldObjectPlacement[] = []
  const colliders: WorldBoxCollider[] = []
  for (const side of ['west', 'east', 'south', 'north'] as const) {
    const vertical = side === 'west' || side === 'east'
    const plane = side === 'west' ? footprint.minX : side === 'east' ? footprint.maxX : side === 'south' ? footprint.minZ : footprint.maxZ
    const start = vertical ? footprint.minZ : footprint.minX
    const end = vertical ? footprint.maxZ : footprint.maxX
    const length = end - start
    const steps = Math.max(1, Math.ceil(length / 2.4))
    const step = length / steps
    const cameraNear = side === 'east' || side === 'north'
    for (let index = 0; index < steps; index += 1) {
      const along = start + (index + 0.5) * step
      placements.push(instance(
        `wall.envelope.${side}.${index}`,
        cameraNear ? 'ossuary.wall.parapet' : 'ossuary.wall.exterior',
        'perimeter',
        [vertical ? plane : along, cameraNear ? PARAPET_Y : 0.9, vertical ? along : plane],
        [0, vertical ? 0 : Math.PI / 2, 0],
        cameraNear ? [1.45, 0.42, step / 1.2] : [1, 1, step / 2.4],
      ))
    }
    colliders.push(Object.freeze({
      id: `collider.wall.envelope.${side}`,
      kind: 'wall' as const,
      position: Object.freeze([vertical ? plane : (start + end) / 2, cameraNear ? 0.6 : 0.9, vertical ? (start + end) / 2 : plane] as const),
      size: Object.freeze([vertical ? WALL_THICKNESS * 1.75 : length, cameraNear ? PARAPET_HEIGHT : 1.8, vertical ? length : WALL_THICKNESS * 1.75] as const),
      ownerInstanceId: `wall.envelope.${side}.0`,
    }))
  }
  return { placements, colliders }
}

function sideIsEnvelopeBoundary(floor: RoomBounds, side: RoomWallSide, envelope: RoomBounds): boolean {
  if (side === 'west') return Math.abs(floor.minX - envelope.minX) < 0.01
  if (side === 'east') return Math.abs(floor.maxX - envelope.maxX) < 0.01
  if (side === 'south') return Math.abs(floor.minZ - envelope.minZ) < 0.01
  return Math.abs(floor.maxZ - envelope.maxZ) < 0.01
}

function foundationPlacement(
  room: DungeonRoomDefinition,
  floor: RoomBounds,
  floorIndex: number,
): WorldObjectPlacement {
  const width = floor.maxX - floor.minX
  const depth = floor.maxZ - floor.minZ
  return instance(
    `foundation.${room.id}.${floorIndex}`,
    'ossuary.floor.foundation',
    room.area,
    [(floor.minX + floor.maxX) / 2, 0.055, (floor.minZ + floor.maxZ) / 2],
    ZERO,
    [width, 2.4, depth],
  )
}

function floorCollider(placement: WorldObjectPlacement, floor: RoomBounds): WorldBoxCollider {
  return Object.freeze({
    id: `collider.${placement.instanceId}`,
    kind: 'floor',
    position: Object.freeze([
      (floor.minX + floor.maxX) / 2,
      FLOOR_COLLIDER_Y,
      (floor.minZ + floor.maxZ) / 2,
    ] as const),
    size: Object.freeze([floor.maxX - floor.minX, FLOOR_COLLIDER_HEIGHT, floor.maxZ - floor.minZ] as const),
    ownerInstanceId: placement.instanceId,
  })
}

function wallRun(
  rooms: readonly DungeonRoomDefinition[],
  room: DungeonRoomDefinition,
  floor: RoomBounds,
  floorIndex: number,
  side: RoomWallSide,
  wallKeys: Set<string>,
): { placements: WorldObjectPlacement[]; colliders: WorldBoxCollider[] } {
  const vertical = side === 'west' || side === 'east'
  const plane = side === 'west' ? floor.minX : side === 'east' ? floor.maxX : side === 'south' ? floor.minZ : floor.maxZ
  const runMin = vertical ? floor.minZ : floor.minX
  const runMax = vertical ? floor.maxZ : floor.maxX
  const openings = room.openings.filter(
    (entry) => entry.side === side && Math.abs((entry.plane ?? defaultPlane(room, side)) - plane) < 0.12,
  )
  const low = isCameraNearSide(room, side) || planeIsCameraNear(rooms, vertical ? 'x' : 'z', plane)
  const spans = subtractOpenings(runMin, runMax, openings)
  const placements: WorldObjectPlacement[] = []
  const colliders: WorldBoxCollider[] = []
  let serial = 0
  for (const span of spans) {
    const length = span.end - span.start
    if (length < 0.35) continue
    const spanKey = `${side}:${plane.toFixed(2)}:${span.start.toFixed(2)}:${span.end.toFixed(2)}:${low ? 'low' : 'tall'}`
    const steps = Math.max(1, Math.round(length / BAY_LENGTH))
    const step = length / steps
    const spanPlacements: WorldObjectPlacement[] = []
    for (let index = 0; index < steps; index += 1) {
      const along = span.start + (index + 0.5) * step
      const key = `${side}:${plane.toFixed(2)}:${along.toFixed(2)}:${low ? 'low' : 'tall'}`
      if (wallKeys.has(key)) continue
      wallKeys.add(key)
      const bay = wallBay(room, floorIndex, side, plane, along, step, low, serial)
      spanPlacements.push(bay)
      serial += 1
    }
    placements.push(...spanPlacements)
    if (spanPlacements.length > 0 && !wallKeys.has(`collider:${spanKey}`)) {
      wallKeys.add(`collider:${spanKey}`)
      colliders.push(wallSpanCollider(spanPlacements[0]!.instanceId, side, plane, span.start, span.end, low))
    }
  }
  return { placements, colliders }
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
    return instance(
      `parapet.${room.id}.${floorIndex}.${side}.${serial}`,
      'ossuary.wall.parapet',
      room.area,
      [x, PARAPET_Y, z],
      [0, yaw, 0],
      [1, 0.34, scaleZ],
    )
  }
  return instance(
    `wall.${room.id}.${floorIndex}.${side}.${serial}`,
    'ossuary.wall.bay',
    room.area,
    [x, TALL_WALL_Y, z],
    [0, yaw, 0],
    [1, 1, scaleZ],
  )
}

function wallSpanCollider(
  ownerInstanceId: string,
  side: RoomWallSide,
  plane: number,
  start: number,
  end: number,
  low: boolean,
): WorldBoxCollider {
  const vertical = side === 'west' || side === 'east'
  const height = low ? PARAPET_HEIGHT : TALL_WALL_HEIGHT
  const mid = (start + end) / 2
  const run = Math.max(0.35, end - start)
  return Object.freeze({
    id: `collider.${ownerInstanceId}.span`,
    kind: 'wall',
    position: Object.freeze(
      vertical ? [plane, height / 2, mid] : [mid, height / 2, plane],
    ) as readonly [number, number, number],
    size: Object.freeze(
      vertical ? [WALL_THICKNESS, height, run] : [run, height, WALL_THICKNESS],
    ) as readonly [number, number, number],
    ownerInstanceId,
  })
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
        instance(
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

function gateInstances(
  room: DungeonRoomDefinition,
  dynamicState: DungeonDynamicState,
): WorldObjectPlacement[] {
  const result: WorldObjectPlacement[] = []
  for (const opening of room.openings) {
    if (opening.kind !== 'gate') continue
    const objectId = opening.connectionId === 'connection.gate-final-arena' ? 'ossuary.gate.final' : 'ossuary.gate.shortcut'
    const open = objectId === 'ossuary.gate.final' ? dynamicState.finalGateOpen : dynamicState.shortcutOpen
    if (open) continue
    const pose = openingPose(room, opening)
    const instanceId = objectId === 'ossuary.gate.final' ? 'gate.final' : 'gate.shortcut'
    if (result.some((entry) => entry.instanceId === instanceId)) continue
    result.push(instance(instanceId, objectId, room.area, pose.position, pose.rotation, pose.scale))
  }
  return result
}

function gateColliders(
  room: DungeonRoomDefinition,
  dynamicState: DungeonDynamicState,
): WorldBoxCollider[] {
  return gateInstances(room, dynamicState).map((placement) => {
    const vertical = Math.abs(placement.rotation[1]) < 0.2 || Math.abs(Math.abs(placement.rotation[1]) - Math.PI) < 0.2
    const definition = getWorldObjectDefinition(placement.objectId)
    const bounds = definition.visualBounds ?? [0.5, 1.5, 1.8]
    const scale = resolvePlacementScale(placement, definition)
    const size: readonly [number, number, number] = vertical
      ? [bounds[0] * scale[0], bounds[1] * scale[1], bounds[2] * scale[2]]
      : [bounds[2] * scale[2], bounds[1] * scale[1], bounds[0] * scale[0]]
    return Object.freeze({
      id: placement.instanceId,
      kind: definition.collision?.colliderKind ?? 'shortcut-gate',
      position: placement.position,
      size,
      ownerInstanceId: placement.instanceId,
    })
  })
}

function openingPose(
  room: DungeonRoomDefinition,
  opening: DungeonOpeningDefinition,
): {
  readonly position: readonly [number, number, number]
  readonly rotation: readonly [number, number, number]
  readonly scale: readonly [number, number, number]
} {
  const plane = opening.plane ?? defaultPlane(room, opening.side)
  const vertical = opening.side === 'west' || opening.side === 'east'
  const x = vertical ? plane : opening.centerAlong
  const z = vertical ? opening.centerAlong : plane
  const yaw = vertical ? 0 : Math.PI / 2
  const objectId = opening.connectionId === 'connection.gate-final-arena' ? 'ossuary.gate.final' : 'ossuary.gate.shortcut'
  const bounds = getWorldObjectDefinition(objectId).visualBounds ?? [0.5, 1.5, 1.8]
  const scaleZ = opening.width / bounds[2]
  return {
    position: [x, bounds[1] / 2, z],
    rotation: [0, yaw, 0],
    scale: [1, 1, scaleZ],
  }
}

function insetSlabs(room: DungeonRoomDefinition): WorldObjectPlacement[] {
  const result: WorldObjectPlacement[] = []
  const objectId: OssuaryObjectId =
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
          instance(`slab.${room.id}.${floorIndex}.${xIndex}.${zIndex}`, objectId, room.area, [x, 0.062, z], ZERO, [
            0.92,
            1,
            0.92,
          ]),
        )
      })
    })
  }
  return result
}

function landmarks(room: DungeonRoomDefinition): WorldObjectPlacement[] {
  const anchor = room.landmarkAnchor
  if (anchor === null) return []
  switch (room.id) {
    case 'room.outer-watch':
      return [instance('landmark.watch.monolith', 'ossuary.landmark.veil-monolith', room.area, anchor)]
    case 'room.final-approach':
      return [
        instance('landmark.approach.cairn', 'ossuary.rubble.cluster', room.area, [anchor[0], 0.06, anchor[2]], ZERO, [
          1.15,
          0.7,
          1.15,
        ]),
      ]
    case 'room.sepulchre':
      return [instance('landmark.sepulchre.seal', 'ossuary.landmark.arena-seal', room.area, anchor)]
    default:
      return []
  }
}

function lights(room: DungeonRoomDefinition): WorldObjectPlacement[] {
  return room.lightAnchors.map((anchor) =>
    instance(
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
        instance(`dressing.${room.id}.sarcophagus`, 'ossuary.sarcophagus.body', room.area, [x, 0.22, z], [0, 0.04, 0]),
        instance(`dressing.${room.id}.lid`, 'ossuary.sarcophagus.lid', room.area, [x, 0.48, z], [0, 0.04, 0]),
      )
    } else {
      result.push(
        instance(`dressing.${room.id}.rubble.${index}`, 'ossuary.rubble.cluster', room.area, [x, 0.05, z], ZERO, [
          0.85,
          0.7,
          0.85,
        ]),
      )
    }
    if (index === 0 && room.id !== 'room.corridor' && room.id !== 'room.ash-walk' && room.id !== 'room.final-approach') {
      result.push(
        instance(`dressing.${room.id}.niche`, 'ossuary.niche.recess', room.area, [zone.minX + 0.08, 0.92, z], [
          0,
          Math.PI / 2,
          0,
        ]),
      )
    }
  })
  return result
}

function explicitSupports(): WorldObjectPlacement[] {
  const arch = instance('arch.corridor.south', 'ossuary.arch.full', 'corridor', [-5.5, 1.42, -5.42])
  const bell = instance(
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
    instance('vfx.wisp.refuge', 'ossuary.wisp', 'refuge', [-7.35, 1.15, 1.55], ZERO, [0.7, 0.7, 0.7], 'vfx'),
    instance('vfx.wisp.court', 'ossuary.wisp', 'court', [-2.35, 1.15, -6.35], ZERO, [0.65, 0.65, 0.65], 'vfx'),
    instance('vfx.wisp.ash', 'ossuary.wisp', 'ash-walk', [6.55, 1.15, -6.2], ZERO, [0.6, 0.6, 0.6], 'vfx'),
    instance('vfx.wisp.sepulchre', 'ossuary.wisp', 'final-arena', [15.1, 1.2, -1.35], ZERO, [0.7, 0.7, 0.7], 'vfx'),
  ]
}

function shrineInstances(dungeon: DungeonDefinition): WorldObjectPlacement[] {
  return dungeon.checkpointAnchors.map((anchor) => {
    const room = dungeon.rooms.find((entry) => entry.id === anchor.roomId)
    return instance(
      'interactive.checkpoint.shrine',
      'ossuary.interactive.checkpoint-shrine',
      room?.area ?? 'refuge',
      anchor.position,
    )
  })
}

function colliderFromInstance(
  placement: WorldObjectPlacement,
  definition: WorldObjectDefinition,
  dynamicState: DungeonDynamicState,
): WorldBoxCollider | null {
  const collision = resolveObjectCollision(definition)
  if (collision.kind === 'none') return null
  if (collision.colliderKind === 'floor' || collision.colliderKind === 'wall') return null
  if (collision.colliderKind === 'shortcut-gate' && dynamicState.shortcutOpen) return null
  if (collision.colliderKind === 'final-gate' && dynamicState.finalGateOpen) return null
  if (collision.colliderKind === 'shortcut-gate' || collision.colliderKind === 'final-gate') return null
  const local = collision.dimensions ?? definition.visualBounds
  if (local === undefined) return null
  const scale = resolvePlacementScale(placement, definition)
  const yaw = placement.rotation[1]
  const aligned = Math.abs(Math.sin(yaw)) < 0.5
  const size: readonly [number, number, number] = aligned
    ? [local[0] * scale[0], local[1] * scale[1], local[2] * scale[2]]
    : [local[2] * scale[2], local[1] * scale[1], local[0] * scale[0]]
  const kind = collision.colliderKind ?? 'blocker'
  const position: readonly [number, number, number] =
    kind === 'checkpoint'
      ? [
          CONNECTED_LEVEL_CHECKPOINT_DEFINITION.visualPosition.x,
          CONNECTED_LEVEL_CHECKPOINT_DEFINITION.collisionSize[1] / 2,
          CONNECTED_LEVEL_CHECKPOINT_DEFINITION.visualPosition.z,
        ]
      : placement.position
  const colliderSize =
    kind === 'checkpoint' ? CONNECTED_LEVEL_CHECKPOINT_DEFINITION.collisionSize : size
  return Object.freeze({
    id: `collider.${placement.instanceId}`,
    kind,
    position,
    size: colliderSize,
    ownerInstanceId: placement.instanceId,
  })
}

function pushUniqueCollider(
  colliders: WorldBoxCollider[],
  keys: Set<string>,
  collider: WorldBoxCollider,
): void {
  if (keys.has(collider.id)) return
  keys.add(collider.id)
  colliders.push(collider)
}

function subtractOpenings(
  runMin: number,
  runMax: number,
  openings: readonly DungeonOpeningDefinition[],
): readonly { start: number; end: number }[] {
  const cuts = openings
    .map((entry) => ({
      start: entry.centerAlong - entry.width / 2,
      end: entry.centerAlong + entry.width / 2,
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
  return sidePlane(room, side)
}

function planeIsCameraNear(
  rooms: readonly DungeonRoomDefinition[],
  axis: 'x' | 'z',
  value: number,
  tolerance = 0.08,
): boolean {
  for (const room of rooms) {
    if (axis === 'x' && room.cameraNearSides.includes('east') && Math.abs(sidePlane(room, 'east') - value) <= tolerance) {
      return true
    }
    if (axis === 'z' && room.cameraNearSides.includes('north') && Math.abs(sidePlane(room, 'north') - value) <= tolerance) {
      return true
    }
  }
  return false
}

function sampleAxis(min: number, max: number, count: number): readonly number[] {
  if (max - min < 0.6) return [(min + max) / 2]
  if (count <= 1) return [(min + max) / 2]
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, index) => min + index * step)
}

function dedupePlacements(placements: readonly WorldObjectPlacement[]): WorldObjectPlacement[] {
  const seen = new Set<string>()
  const result: WorldObjectPlacement[] = []
  for (const placement of placements) {
    if (seen.has(placement.instanceId)) continue
    seen.add(placement.instanceId)
    result.push(placement)
  }
  return result
}
