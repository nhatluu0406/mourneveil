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
const WALL_BAY = new BoxGeometry(0.16, 1.25, 1.2)
const WALL_BREAK = new DodecahedronGeometry(0.34, 0)
const BUTTRESS = createTaperedPrismGeometry({
  bottomWidth: 0.42,
  topWidth: 0.22,
  height: 2.04,
  depth: 0.4,
})
const ARCH_FULL = new TorusGeometry(0.96, 0.11, 6, 24, Math.PI)
const ARCH_RIB = createTaperedPrismGeometry({
  bottomWidth: 0.24,
  topWidth: 0.16,
  height: 1.7,
  depth: 0.22,
})
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

/** Shared geometries for instanced ossuary object types. Unique landmarks own local meshes. */
export const OSSUARY_OBJECT_GEOMETRIES: Readonly<
  Partial<Record<OssuaryObjectId, BufferGeometry>>
> = Object.freeze({
  'ossuary.floor.slab': FLOOR_SLAB,
  'ossuary.floor.inlay': FLOOR_INLAY,
  'ossuary.wall.bay': WALL_BAY,
  'ossuary.wall.break': WALL_BREAK,
  'ossuary.buttress': BUTTRESS,
  'ossuary.arch.full': ARCH_FULL,
  'ossuary.arch.rib': ARCH_RIB,
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
})

export function getOssuaryObjectGeometry(objectId: OssuaryObjectId): BufferGeometry {
  const geometry = OSSUARY_OBJECT_GEOMETRIES[objectId]
  if (geometry === undefined) {
    throw new Error(`Ossuary object "${objectId}" has no shared instanced geometry`)
  }
  return geometry
}
