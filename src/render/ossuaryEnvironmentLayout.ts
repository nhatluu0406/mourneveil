export type OssuaryRouteArea = 'refuge' | 'corridor' | 'first-combat'

export interface OssuaryPlacement {
  readonly id: string
  readonly area: OssuaryRouteArea
  readonly position: readonly [number, number, number]
  readonly rotation: readonly [number, number, number]
  readonly scale: readonly [number, number, number]
}

export interface OssuaryLandmarkDefinition {
  readonly id: 'landmark.refuge-reliquary-crown' | 'landmark.combat-veil-monolith'
  readonly area: 'refuge' | 'first-combat'
  readonly position: readonly [number, number, number]
  readonly description: string
}

const ZERO_ROTATION = Object.freeze([0, 0, 0] as const)
const UNIT_SCALE = Object.freeze([1, 1, 1] as const)

function placement(
  id: string,
  area: OssuaryRouteArea,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = ZERO_ROTATION,
  scale: readonly [number, number, number] = UNIT_SCALE,
): OssuaryPlacement {
  return Object.freeze({
    id,
    area,
    position: Object.freeze(position),
    rotation: Object.freeze(rotation),
    scale: Object.freeze(scale),
  })
}

function slabField(
  area: OssuaryRouteArea,
  xs: readonly number[],
  zs: readonly number[],
  phase: number,
): OssuaryPlacement[] {
  return xs.flatMap((x, xIndex) =>
    zs.map((z, zIndex) =>
      placement(
        `floor.${area}.${xIndex}.${zIndex}`,
        area,
        [x, 0.045 + ((xIndex + zIndex) % 3) * 0.002, z],
        [0, ((xIndex * 2 + zIndex + phase) % 5 - 2) * 0.012, 0],
        [0.94 + ((xIndex + phase) % 2) * 0.05, 1, 0.93 + (zIndex % 2) * 0.05],
      ),
    ),
  )
}

export const OSSUARY_FLOOR_SLABS: readonly OssuaryPlacement[] = Object.freeze([
  ...slabField('refuge', [-7.45, -6.35, -5.25, -4.15], [-1.55, -0.5, 0.55, 1.6], 0),
  ...slabField('corridor', [-8.55, -7.55], [0.45, 1.5, 2.55, 3.6], 1),
  ...slabField('first-combat', [-11.45, -10.35, -9.25, -8.15], [0.25, 1.3, 2.35, 3.4, 4.45], 2),
])

export const OSSUARY_FLOOR_INLAYS: readonly OssuaryPlacement[] = Object.freeze([
  placement('inlay.refuge.west', 'refuge', [-6.95, 0.072, 0], [0, 0.06, 0], [1.5, 1, 1]),
  placement('inlay.refuge.east', 'refuge', [-4.55, 0.072, 0], [0, -0.06, 0], [1.5, 1, 1]),
  placement('inlay.corridor.0', 'corridor', [-7.85, 0.074, 1.05], [0, -0.76, 0], [2.3, 1, 1]),
  placement('inlay.corridor.1', 'corridor', [-8.55, 0.074, 2.15], [0, -0.76, 0], [2.3, 1, 1]),
  placement('inlay.corridor.2', 'corridor', [-9.25, 0.074, 3.25], [0, -0.76, 0], [2.3, 1, 1]),
  placement('inlay.combat.axis', 'first-combat', [-9.75, 0.073, 2.5], [0, Math.PI / 2, 0], [5.4, 1, 1]),
])

/** Shallow relief mounted to existing solid wall proxies. */
export const OSSUARY_WALL_BAYS: readonly OssuaryPlacement[] = Object.freeze([
  ...[-1.25, 0.35, 1.95, 3.55].map((z, index) =>
    placement(`bay.watch.${index}`, 'first-combat', [-10.72, 0.88, z]),
  ),
  ...[0.15, 1.8, 3.45].map((z, index) =>
    placement(`bay.refuge-divider.${index}`, index === 0 ? 'refuge' : 'corridor', [-3.28, 0.88, z], [0, Math.PI, 0]),
  ),
])

export const OSSUARY_BUTTRESSES: readonly OssuaryPlacement[] = Object.freeze([
  ...[-2.05, -0.45, 1.15, 2.75, 4.35].map((z, index) =>
    placement(`buttress.watch.${index}`, 'first-combat', [-10.61, 1.02, z], [0, 0, 0], [0.72, 1, 0.72]),
  ),
  ...[-0.65, 1, 2.65, 4.3].map((z, index) =>
    placement(`buttress.divider.${index}`, index < 2 ? 'refuge' : 'corridor', [-3.39, 1.02, z], [0, Math.PI, 0], [0.72, 1, 0.72]),
  ),
])

export const OSSUARY_TOMB_NICHES: readonly OssuaryPlacement[] = Object.freeze(
  OSSUARY_WALL_BAYS.map((bay, index) =>
    placement(
      `niche.${index}`,
      bay.area,
      [bay.position[0] + (bay.rotation[1] === 0 ? 0.115 : -0.115), 0.92, bay.position[2]],
      bay.rotation,
      [0.82, 0.82, 0.82],
    ),
  ),
)

export const OSSUARY_SARCOPHAGI: readonly OssuaryPlacement[] = Object.freeze([
  placement('sarcophagus.refuge.north', 'refuge', [-7.2, 0.24, 1.55], [0, 0.06, 0]),
  placement('sarcophagus.refuge.south', 'refuge', [-4.35, 0.24, -1.55], [0, -0.08, 0]),
  placement('sarcophagus.watch.west', 'first-combat', [-11.6, 0.24, 0.35], [0, Math.PI / 2 + 0.08, 0]),
])

export const OSSUARY_RUBBLE: readonly OssuaryPlacement[] = Object.freeze([
  ...[
    [-7.6, 0.12, -1.78], [-4.1, 0.1, 1.78], [-8.6, 0.1, 0.2], [-8.8, 0.08, 3.75],
    [-10.55, 0.1, 4.6], [-11.8, 0.11, 4.45], [-9.55, 0.09, 0.15], [-7.75, 0.08, 2.9],
    [-10.45, 0.08, 2.15], [-11.65, 0.08, 1.65], [-4.05, 0.08, -1.75], [-6.35, 0.07, 1.82],
  ].map(([x, y, z], index) =>
    placement(
      `rubble.${index}`,
      x > -7 ? 'refuge' : x > -9 ? 'corridor' : 'first-combat',
      [x, y, z],
      [index * 0.11, index * 0.63, index * -0.07],
      [0.5 + (index % 3) * 0.12, 0.32 + (index % 2) * 0.1, 0.42 + (index % 4) * 0.08],
    ),
  ),
])

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
