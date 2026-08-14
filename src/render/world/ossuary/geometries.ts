import {
  BoxGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  OctahedronGeometry,
  TorusGeometry,
  type BufferGeometry,
} from 'three'
import { createProfilePrismGeometry, createTaperedPrismGeometry } from '../../productionGeometry'
import type { OssuaryObjectId } from '../worldObjectTypes'

const FLOOR_SLAB = createProfilePrismGeometry(
  [
    [-0.52, -0.46],
    [0.38, -0.5],
    [0.52, -0.3],
    [0.48, 0.45],
    [0.12, 0.5],
    [-0.46, 0.4],
  ],
  0.035,
)
const FLOOR_INLAY = new BoxGeometry(0.55, 0.025, 0.055)
const FLOOR_FOUNDATION = new BoxGeometry(1, 0.055, 1)
const FLOOR_BROKEN_EDGE = createProfilePrismGeometry([[-0.5, -0.18], [-0.31, -0.3], [-0.08, -0.2], [0.16, -0.33], [0.5, -0.16], [0.5, 0.16], [-0.5, 0.16]], 0.08)
const FLOOR_PIT_RIM = FLOOR_BROKEN_EDGE
const WALL_BAY = new BoxGeometry(0.16, 1.25, 1.2)
const EXTERIOR_WALL = createProfilePrismGeometry(
  [[-0.14, -0.86], [-0.14, 0.7], [-0.1, 0.82], [0, 0.9], [0.1, 0.82], [0.14, 0.7], [0.14, -0.86]],
  2.4,
)
const WALL_PARAPET = WALL_BAY
const WALL_BREAK = new DodecahedronGeometry(0.34, 0)
const BUTTRESS = createTaperedPrismGeometry({
  bottomWidth: 0.42,
  topWidth: 0.22,
  height: 2.04,
  depth: 0.4,
})
const ARCH_FULL = createProfilePrismGeometry(
  [[-0.82, -1.08], [-0.82, 0.26], [-0.48, 0.72], [0, 1.06], [0.48, 0.72], [0.82, 0.26], [0.82, -1.08], [0.6, -1.08], [0.6, 0.18], [0, 0.79], [-0.6, 0.18], [-0.6, -1.08]],
  0.16,
)
const ARCH_RIB = createTaperedPrismGeometry({
  bottomWidth: 0.24,
  topWidth: 0.16,
  height: 1.7,
  depth: 0.22,
})
const ARCH_LANCET = createProfilePrismGeometry(
  [[-0.78, -1.05], [-0.78, 0.35], [-0.48, 0.76], [0, 1.14], [0.48, 0.76], [0.78, 0.35], [0.78, -1.05], [0.56, -1.05], [0.56, 0.25], [0, 0.88], [-0.56, 0.25], [-0.56, -1.05]],
  0.11,
)
const ARCH_LANCET_BROKEN = createProfilePrismGeometry(
  [[-0.72, -0.88], [-0.72, 0.3], [-0.4, 0.7], [-0.08, 0.92], [0.16, 0.66], [0.42, 0.54], [0.66, 0.1], [0.66, -0.88], [0.48, -0.88], [0.48, 0.05], [0, 0.7], [-0.5, 0.2], [-0.5, -0.88]],
  0.13,
)
const SPLIT_BUTTRESS = createProfilePrismGeometry(
  [[-0.3, -0.95], [-0.18, 0.95], [-0.04, 0.95], [0, 0.18], [0.12, 0.84], [0.25, 0.72], [0.34, -0.95]],
  0.25,
)
const NICHE_CLUSTER = createProfilePrismGeometry(
  [[-0.06, -0.62], [-0.06, 0.62], [0.06, 0.62], [0.06, -0.62]],
  0.58,
)
const MEMORIAL_CLUSTER = createProfilePrismGeometry(
  [[-0.4, -0.38], [-0.34, 0.28], [-0.18, 0.42], [-0.04, 0.2], [0.08, 0.38], [0.22, 0.3], [0.4, -0.38]],
  0.14,
)
const RELIQUARY_CHAIN = new TorusGeometry(0.12, 0.018, 4, 10, Math.PI * 1.65)
const WALL_LEDGE = FLOOR_BROKEN_EDGE
const GRAVE_PLAQUE = MEMORIAL_CLUSTER
const BRONZE_BRACE = ARCH_RIB
const NICHE_RECESS = new BoxGeometry(0.06, 0.74, 0.62)
const NICHE_ARCH = new TorusGeometry(0.29, 0.034, 5, 18, Math.PI)
const SARCOPHAGUS_BODY = createTaperedPrismGeometry({
  bottomWidth: 0.72,
  topWidth: 0.62,
  height: 0.42,
  depth: 1.25,
})
const SARCOPHAGUS_LID = createTaperedPrismGeometry({
  bottomWidth: 0.7,
  topWidth: 0.46,
  height: 0.2,
  depth: 1.2,
})
const MARKER_BODY = createTaperedPrismGeometry({
  bottomWidth: 0.28,
  topWidth: 0.17,
  height: 0.7,
  depth: 0.16,
})
const MARKER_CAP = new OctahedronGeometry(0.15, 0)
const RUBBLE = new DodecahedronGeometry(0.34, 0)
const CANDLE_BODY = new CylinderGeometry(0.025, 0.035, 0.26, 6)
const CANDLE_FLAME = new OctahedronGeometry(0.045, 0)
const BANNER = new BoxGeometry(0.5, 0.84, 0.025)
const ROOT = new TorusGeometry(0.46, 0.035, 5, 16, Math.PI * 1.35)
const WISP = new OctahedronGeometry(0.065, 0)
const SILHOUETTE_MASS = new BoxGeometry(2.4, 3.2, 0.55)
const SILHOUETTE_COLUMN = new CylinderGeometry(0.22, 0.28, 3.4, 6)
const BURIAL_SCREEN = createProfilePrismGeometry(
  [[-0.7, -0.65], [-0.7, 0.42], [-0.42, 0.65], [0, 0.76], [0.42, 0.65], [0.7, 0.42], [0.7, -0.65]],
  0.045,
)
const BROKEN_RELIQUARY = createTaperedPrismGeometry({ bottomWidth: 0.72, topWidth: 0.46, height: 0.72, depth: 0.42 })
const LIGHT_SCONCE = createProfilePrismGeometry(
  [[-0.2, -0.2], [-0.11, 0.12], [0, 0.28], [0.11, 0.12], [0.2, -0.2]],
  0.22,
)
const LIGHT_BOWL = new CylinderGeometry(0.32, 0.2, 0.22, 8)
const LIGHT_LAMP = createTaperedPrismGeometry({ bottomWidth: 0.18, topWidth: 0.1, height: 1.18, depth: 0.16 })
const LIGHT_CANDELABRUM = createProfilePrismGeometry(
  [[-0.36, 0.34], [-0.08, 0.48], [-0.05, -0.52], [0.05, -0.52], [0.08, 0.48], [0.36, 0.34], [0.36, 0.48], [0, 0.64], [-0.36, 0.48]],
  0.08,
)
const LIGHT_RELIQUARY = new OctahedronGeometry(0.3, 0)
const LIGHT_DOUBLE_SCONCE = createProfilePrismGeometry(
  [[-0.42, -0.18], [-0.3, 0.18], [-0.08, 0.02], [0.08, 0.02], [0.3, 0.18], [0.42, -0.18]],
  0.18,
)

/** Shared geometries for instanced ossuary object types. Unique landmarks own local meshes. */
export const OSSUARY_OBJECT_GEOMETRIES: Readonly<
  Partial<Record<OssuaryObjectId, BufferGeometry>>
> = Object.freeze({
  'ossuary.floor.slab': FLOOR_SLAB,
  'ossuary.floor.ash-slab': FLOOR_SLAB,
  'ossuary.floor.seal-slab': FLOOR_SLAB,
  'ossuary.floor.inlay': FLOOR_INLAY,
  'ossuary.floor.foundation': FLOOR_FOUNDATION,
  'ossuary.floor.broken-edge': FLOOR_BROKEN_EDGE,
  'ossuary.floor.pit-rim': FLOOR_PIT_RIM,
  'ossuary.wall.bay': WALL_BAY,
  'ossuary.wall.exterior': EXTERIOR_WALL,
  'ossuary.wall.parapet': WALL_PARAPET,
  'ossuary.wall.break': WALL_BREAK,
  'ossuary.buttress': BUTTRESS,
  'ossuary.arch.full': ARCH_FULL,
  'ossuary.arch.rib': ARCH_RIB,
  'ossuary.arch.lancet': ARCH_LANCET,
  'ossuary.arch.lancet-broken': ARCH_LANCET_BROKEN,
  'ossuary.buttress.split': SPLIT_BUTTRESS,
  'ossuary.niche.cluster': NICHE_CLUSTER,
  'ossuary.memorial.cluster': MEMORIAL_CLUSTER,
  'ossuary.reliquary.chain': RELIQUARY_CHAIN,
  'ossuary.wall.ledge': WALL_LEDGE,
  'ossuary.grave.plaque': GRAVE_PLAQUE,
  'ossuary.metal.bronze-brace': BRONZE_BRACE,
  'ossuary.niche.recess': NICHE_RECESS,
  'ossuary.niche.arch': NICHE_ARCH,
  'ossuary.sarcophagus.body': SARCOPHAGUS_BODY,
  'ossuary.sarcophagus.lid': SARCOPHAGUS_LID,
  'ossuary.marker.body': MARKER_BODY,
  'ossuary.marker.cap': MARKER_CAP,
  'ossuary.rubble.cluster': RUBBLE,
  'ossuary.candle.body': CANDLE_BODY,
  'ossuary.candle.flame': CANDLE_FLAME,
  'ossuary.banner': BANNER,
  'ossuary.root.cluster': ROOT,
  'ossuary.wisp': WISP,
  'ossuary.silhouette.mass': SILHOUETTE_MASS,
  'ossuary.silhouette.column': SILHOUETTE_COLUMN,
  'ossuary.metal.burial-screen': BURIAL_SCREEN,
  'ossuary.reliquary.broken': BROKEN_RELIQUARY,
  'ossuary.light.wall-sconce': LIGHT_SCONCE,
  'ossuary.light.brazier': LIGHT_BOWL,
  'ossuary.light.veil-lamp': LIGHT_LAMP,
  'ossuary.light.candle-cluster': LIGHT_CANDELABRUM,
  'ossuary.light.candelabrum': LIGHT_CANDELABRUM,
  'ossuary.light.reliquary-lantern': LIGHT_RELIQUARY,
  'ossuary.light.double-sconce': LIGHT_DOUBLE_SCONCE,
  'ossuary.light.processional-torch': LIGHT_LAMP,
  'ossuary.light.ember-bowl': LIGHT_BOWL,
  'ossuary.light.spectral-reliquary': LIGHT_RELIQUARY,
})

export function getOssuaryObjectGeometry(objectId: OssuaryObjectId): BufferGeometry {
  const geometry = OSSUARY_OBJECT_GEOMETRIES[objectId]
  if (geometry === undefined) {
    throw new Error(`Ossuary object "${objectId}" has no shared instanced geometry`)
  }
  return geometry
}
