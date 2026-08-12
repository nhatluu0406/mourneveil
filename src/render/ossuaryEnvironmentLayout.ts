/**
 * Compatibility exports for capture points / landmarks / legacy placement shape tests.
 * New route authoring should use `world/ossuary/routePlacements.ts`.
 */
export {
  OSSUARY_LANDMARKS,
  OSSUARY_ROUTE_CAPTURE_POINTS,
  OSSUARY_ROUTE_PLACEMENTS,
  type OssuaryLandmarkDefinition,
} from './world/ossuary/routePlacements'
export type { OssuaryRouteArea, WorldObjectPlacement as OssuaryPlacement } from './world/worldObjectTypes'

import { OSSUARY_ROUTE_PLACEMENTS } from './world/ossuary/routePlacements'

/** @deprecated Prefer filtering OSSUARY_ROUTE_PLACEMENTS by objectId. */
export const OSSUARY_FLOOR_SLABS = Object.freeze(
  OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.floor.slab').map((entry) =>
    Object.freeze({
      id: entry.instanceId,
      area: entry.area,
      position: entry.position,
      rotation: entry.rotation,
      scale: entry.scale ?? ([1, 1, 1] as const),
    }),
  ),
)

/** @deprecated Prefer filtering OSSUARY_ROUTE_PLACEMENTS by objectId. */
export const OSSUARY_WALL_BAYS = Object.freeze(
  OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.wall.bay').map((entry) =>
    Object.freeze({
      id: entry.instanceId,
      area: entry.area,
      position: entry.position,
      rotation: entry.rotation,
      scale: entry.scale ?? ([1, 1, 1] as const),
    }),
  ),
)

/** @deprecated Prefer filtering OSSUARY_ROUTE_PLACEMENTS by objectId. */
export const OSSUARY_FLOOR_INLAYS = Object.freeze(
  OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.floor.inlay'),
)

/** @deprecated Prefer filtering OSSUARY_ROUTE_PLACEMENTS by objectId. */
export const OSSUARY_BUTTRESSES = Object.freeze(
  OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.buttress'),
)

/** @deprecated Prefer filtering OSSUARY_ROUTE_PLACEMENTS by objectId. */
export const OSSUARY_TOMB_NICHES = Object.freeze(
  OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.niche.recess'),
)

/** @deprecated Prefer filtering OSSUARY_ROUTE_PLACEMENTS by objectId. */
export const OSSUARY_SARCOPHAGI = Object.freeze(
  OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.sarcophagus.body'),
)

/** @deprecated Prefer filtering OSSUARY_ROUTE_PLACEMENTS by objectId. */
export const OSSUARY_RUBBLE = Object.freeze(
  OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.rubble.cluster'),
)
