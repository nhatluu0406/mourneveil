import type { OssuaryRouteArea, WorldObjectPlacement } from '../worldObjectTypes'

const ZERO_ROTATION = Object.freeze([0, 0, 0] as const)

function place(
  instanceId: string,
  objectId: WorldObjectPlacement['objectId'],
  area: OssuaryRouteArea,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = ZERO_ROTATION,
  scale?: readonly [number, number, number],
  variant?: string,
): WorldObjectPlacement {
  return Object.freeze({
    instanceId,
    objectId,
    area,
    position: Object.freeze(position),
    rotation: Object.freeze(rotation),
    ...(scale === undefined ? {} : { scale: Object.freeze(scale) }),
    ...(variant === undefined ? {} : { variant }),
  })
}

function slabField(
  area: OssuaryRouteArea,
  xs: readonly number[],
  zs: readonly number[],
  phase: number,
): WorldObjectPlacement[] {
  return xs.flatMap((x, xIndex) =>
    zs.map((z, zIndex) =>
      place(
        `floor.${area}.${xIndex}.${zIndex}`,
        'ossuary.floor.slab',
        area,
        [x, 0.045 + ((xIndex + zIndex) % 3) * 0.002, z],
        [0, ((xIndex * 2 + zIndex + phase) % 5 - 2) * 0.012, 0],
        [0.94 + ((xIndex + phase) % 2) * 0.05, 1, 0.93 + (zIndex % 2) * 0.05],
      ),
    ),
  )
}

const WALL_BAYS: readonly WorldObjectPlacement[] = Object.freeze([
  ...[-1.25, 0.35, 1.95, 3.55].map((z, index) =>
    place(`bay.watch.${index}`, 'ossuary.wall.bay', 'first-combat', [-10.72, 0.88, z]),
  ),
  ...[0.15, 1.8, 3.45].map((z, index) =>
    place(
      `bay.refuge-divider.${index}`,
      'ossuary.wall.bay',
      index === 0 ? 'refuge' : 'corridor',
      [-3.28, 0.88, z],
      [0, Math.PI, 0],
    ),
  ),
])

const TOMB_NICHES: readonly WorldObjectPlacement[] = Object.freeze(
  WALL_BAYS.map((bay, index) =>
    place(
      `niche.${index}`,
      'ossuary.niche.recess',
      bay.area,
      [bay.position[0] + (bay.rotation[1] === 0 ? 0.115 : -0.115), 0.92, bay.position[2]],
      bay.rotation,
      [0.82, 0.82, 0.82],
    ),
  ),
)

const SARCOPHAGI: readonly WorldObjectPlacement[] = Object.freeze([
  place('sarcophagus.refuge.north', 'ossuary.sarcophagus.body', 'refuge', [-7.2, 0.24, 1.55], [0, 0.06, 0]),
  place('sarcophagus.refuge.south', 'ossuary.sarcophagus.body', 'refuge', [-4.35, 0.24, -1.55], [0, -0.08, 0]),
  place(
    'sarcophagus.watch.west',
    'ossuary.sarcophagus.body',
    'first-combat',
    [-11.6, 0.24, 0.35],
    [0, Math.PI / 2 + 0.08, 0],
  ),
])

const CORRIDOR_ARCHES: readonly WorldObjectPlacement[] = Object.freeze([
  place('arch.corridor.0', 'ossuary.arch.full', 'corridor', [-7.78, 1.55, 1.05], [0, -0.62, 0]),
  place('arch.corridor.1', 'ossuary.arch.full', 'corridor', [-8.7, 1.55, 2.45], [0, -0.62, 0]),
])

const CORRIDOR_RIBS: readonly WorldObjectPlacement[] = Object.freeze(
  CORRIDOR_ARCHES.flatMap((arch, index) =>
    [-1, 1].map((side) => {
      const localX = side * 0.95
      const angle = arch.rotation[1]
      return place(
        `arch-rib.${index}.${side}`,
        'ossuary.arch.rib',
        'corridor',
        [
          arch.position[0] + Math.cos(angle) * localX,
          0.85,
          arch.position[2] - Math.sin(angle) * localX,
        ],
        arch.rotation,
      )
    }),
  ),
)

const MARKERS: readonly WorldObjectPlacement[] = Object.freeze([
  place('marker.refuge.0', 'ossuary.marker.body', 'refuge', [-7.6, 0.36, -1.72], [0, 0.12, 0]),
  place('marker.refuge.1', 'ossuary.marker.body', 'refuge', [-4.18, 0.36, 1.72], [0, -0.12, 0]),
  place('marker.corridor.0', 'ossuary.marker.body', 'corridor', [-7.25, 0.36, 2.92], [0, -0.3, 0], [
    0.86, 0.9, 0.86,
  ]),
  place('marker.combat.0', 'ossuary.marker.body', 'first-combat', [-11.62, 0.36, 3.9], [0, 0.2, 0]),
])

const CANDLES: readonly WorldObjectPlacement[] = Object.freeze(
  (
    [
      [-6.62, -0.72],
      [-6.48, -0.78],
      [-4.55, 1.22],
      [-4.4, 1.3],
      [-9.18, 3.86],
      [-9.05, 3.92],
    ] as const
  ).map(([x, z], index) =>
    place(
      `candle.${index}`,
      'ossuary.candle.body',
      x > -7 ? 'refuge' : 'first-combat',
      [x, 0.15, z],
      ZERO_ROTATION,
      [1, 0.75 + (index % 3) * 0.16, 1],
    ),
  ),
)

/**
 * Declarative hero-route composition: WHAT exists WHERE.
 * Object modules own HOW each type renders.
 */
export const OSSUARY_ROUTE_PLACEMENTS: readonly WorldObjectPlacement[] = Object.freeze([
  ...slabField('refuge', [-7.45, -6.35, -5.25, -4.15], [-1.55, -0.5, 0.55, 1.6], 0),
  ...slabField('corridor', [-8.55, -7.55], [0.45, 1.5, 2.55, 3.6], 1),
  ...slabField('first-combat', [-11.45, -10.35, -9.25, -8.15], [0.25, 1.3, 2.35, 3.4, 4.45], 2),

  place('inlay.refuge.west', 'ossuary.floor.inlay', 'refuge', [-6.95, 0.072, 0], [0, 0.06, 0], [1.5, 1, 1]),
  place('inlay.refuge.east', 'ossuary.floor.inlay', 'refuge', [-4.55, 0.072, 0], [0, -0.06, 0], [1.5, 1, 1]),
  place('inlay.corridor.0', 'ossuary.floor.inlay', 'corridor', [-7.85, 0.074, 1.05], [0, -0.76, 0], [2.3, 1, 1]),
  place('inlay.corridor.1', 'ossuary.floor.inlay', 'corridor', [-8.55, 0.074, 2.15], [0, -0.76, 0], [2.3, 1, 1]),
  place('inlay.corridor.2', 'ossuary.floor.inlay', 'corridor', [-9.25, 0.074, 3.25], [0, -0.76, 0], [2.3, 1, 1]),
  place(
    'inlay.combat.axis',
    'ossuary.floor.inlay',
    'first-combat',
    [-9.75, 0.073, 2.5],
    [0, Math.PI / 2, 0],
    [5.4, 1, 1],
  ),

  ...WALL_BAYS,
  ...TOMB_NICHES,
  ...TOMB_NICHES.map((entry) =>
    place(
      `${entry.instanceId}.arch`,
      'ossuary.niche.arch',
      entry.area,
      [entry.position[0] + (entry.position[0] < -8 ? 0.045 : -0.045), 1.18, entry.position[2]],
      [0, Math.PI / 2, 0],
      [0.92, 1.12, 0.92],
    ),
  ),

  ...[-2.05, -0.45, 1.15, 2.75, 4.35].map((z, index) =>
    place(
      `buttress.watch.${index}`,
      'ossuary.buttress',
      'first-combat',
      [-10.61, 1.02, z],
      ZERO_ROTATION,
      [0.72, 1, 0.72],
    ),
  ),
  ...[-0.65, 1, 2.65, 4.3].map((z, index) =>
    place(
      `buttress.divider.${index}`,
      'ossuary.buttress',
      index < 2 ? 'refuge' : 'corridor',
      [-3.39, 1.02, z],
      [0, Math.PI, 0],
      [0.72, 1, 0.72],
    ),
  ),

  ...SARCOPHAGI,
  ...SARCOPHAGI.map((entry) =>
    place(
      `${entry.instanceId}.lid`,
      'ossuary.sarcophagus.lid',
      entry.area,
      [entry.position[0], entry.position[1] + 0.28, entry.position[2]],
      entry.rotation,
      entry.scale,
    ),
  ),

  ...[
    [-7.6, 0.12, -1.78],
    [-4.1, 0.1, 1.78],
    [-8.6, 0.1, 0.2],
    [-8.8, 0.08, 3.75],
    [-10.55, 0.1, 4.6],
    [-11.8, 0.11, 4.45],
    [-9.55, 0.09, 0.15],
    [-7.75, 0.08, 2.9],
    [-10.45, 0.08, 2.15],
    [-11.65, 0.08, 1.65],
    [-4.05, 0.08, -1.75],
    [-6.35, 0.07, 1.82],
  ].map(([x, y, z], index) =>
    place(
      `rubble.${index}`,
      'ossuary.rubble.cluster',
      x > -7 ? 'refuge' : x > -9 ? 'corridor' : 'first-combat',
      [x, y, z],
      [index * 0.11, index * 0.63, index * -0.07],
      [0.5 + (index % 3) * 0.12, 0.32 + (index % 2) * 0.1, 0.42 + (index % 4) * 0.08],
    ),
  ),

  place('break.watch.0', 'ossuary.wall.break', 'first-combat', [-10.7, 1.55, 0.98], [0.2, 0.4, 0.1], [
    0.55, 0.42, 0.65,
  ]),
  place('break.watch.1', 'ossuary.wall.break', 'first-combat', [-10.67, 1.57, 3.95], [-0.1, 0.9, -0.18], [
    0.68, 0.48, 0.55,
  ]),
  place('break.divider.0', 'ossuary.wall.break', 'corridor', [-3.31, 1.56, 1.9], [0.12, 0.25, 0.22], [
    0.58, 0.42, 0.72,
  ]),

  ...CORRIDOR_ARCHES,
  ...CORRIDOR_RIBS,

  ...MARKERS,
  ...MARKERS.map((entry) =>
    place(
      `${entry.instanceId}.cap`,
      'ossuary.marker.cap',
      entry.area,
      [entry.position[0], 0.83, entry.position[2]],
      entry.rotation,
      entry.scale,
    ),
  ),

  ...CANDLES,
  ...CANDLES.map((entry) =>
    place(
      `${entry.instanceId}.flame`,
      'ossuary.candle.flame',
      entry.area,
      [entry.position[0], 0.34 + ((entry.scale?.[1] ?? 1) - 0.75) * 0.12, entry.position[2]],
      ZERO_ROTATION,
      [1, 1.4, 1],
    ),
  ),

  place(
    'banner.watch.0',
    'ossuary.banner',
    'first-combat',
    [-10.59, 1.15, 0.35],
    [0, Math.PI / 2, -0.06],
    [0.8, 1, 1],
  ),
  place(
    'banner.divider.0',
    'ossuary.banner',
    'corridor',
    [-3.41, 1.14, 2.65],
    [0, Math.PI / 2, 0.08],
    [0.68, 0.9, 1],
  ),

  place(
    'root.watch.0',
    'ossuary.root.cluster',
    'first-combat',
    [-10.56, 0.34, 2.85],
    [0, Math.PI / 2, 0.35],
    [1, 1.3, 1],
  ),
  place(
    'root.combat.0',
    'ossuary.root.cluster',
    'first-combat',
    [-8.58, 0.17, 4.35],
    [Math.PI / 2, 0.2, 0],
    [0.8, 1, 1.25],
  ),

  place('wisp.0', 'ossuary.wisp', 'refuge', [-4.55, 1.3, 1.2], ZERO_ROTATION, [1, 1.8, 1]),
  place('wisp.1', 'ossuary.wisp', 'corridor', [-7.75, 1.5, 2.7], ZERO_ROTATION, [0.8, 1.5, 0.8]),
  place('wisp.2', 'ossuary.wisp', 'first-combat', [-9.0, 1.1, 4.35], ZERO_ROTATION, [0.75, 1.4, 0.75]),
  place('wisp.3', 'ossuary.wisp', 'first-combat', [-11.65, 1.45, 2.65], ZERO_ROTATION, [0.65, 1.25, 0.65]),

  place(
    'landmark.combat-veil-monolith',
    'ossuary.landmark.veil-monolith',
    'first-combat',
    [-10.4, 0, 1.2],
    ZERO_ROTATION,
    [0.62, 1, 0.62],
  ),
  place(
    'dressing.blocker.first-combat',
    'ossuary.landmark.reliquary-plinth',
    'first-combat',
    [-8.25, 0, 4.25],
  ),
  place('bell.corridor.0', 'ossuary.corridor.bell', 'corridor', [-8.25, 2.46, 1.76], [0, -0.62, Math.PI / 2]),
])

export interface OssuaryLandmarkDefinition {
  readonly id: 'landmark.refuge-reliquary-crown' | 'landmark.combat-veil-monolith'
  readonly area: 'refuge' | 'first-combat'
  readonly position: readonly [number, number, number]
  readonly description: string
}

export const OSSUARY_LANDMARKS: readonly OssuaryLandmarkDefinition[] = Object.freeze([
  Object.freeze({
    id: 'landmark.refuge-reliquary-crown',
    area: 'refuge',
    position: Object.freeze([-5.5, 0, 0] as const),
    description: 'A bronze-and-bone rib crown focuses the canonical veil shrine.',
  }),
  Object.freeze({
    id: 'landmark.combat-veil-monolith',
    area: 'first-combat',
    position: Object.freeze([-10.4, 0, 1.2] as const),
    description: 'A fractured reliquary monolith grows from the rear watch-column proxy.',
  }),
])

export const OSSUARY_ROUTE_CAPTURE_POINTS = Object.freeze({
  refugeWide: Object.freeze({ x: -5.2, y: 0.82, z: 0.4 }),
  refugeClose: Object.freeze({ x: -6.15, y: 0.82, z: -0.2 }),
  corridor: Object.freeze({ x: -7.9, y: 0.82, z: 1.65 }),
  firstCombat: Object.freeze({ x: -9.15, y: 0.82, z: 2.15 }),
  progressionLandmark: Object.freeze({ x: -9.15, y: 0.82, z: 3.85 }),
})
