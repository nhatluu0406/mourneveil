import type { OssuaryObjectId, WorldObjectDefinition } from '../worldObjectTypes'

const UNIT = Object.freeze([1, 1, 1] as const)

function define(
  partial: Omit<WorldObjectDefinition, 'defaultScale'> & {
    readonly defaultScale?: readonly [number, number, number]
  },
): WorldObjectDefinition {
  return Object.freeze({
    defaultScale: UNIT,
    ...partial,
  })
}

/** Immutable authored definitions for reusable ossuary object types. */
export const OSSUARY_OBJECT_DEFINITIONS: Readonly<
  Record<OssuaryObjectId, WorldObjectDefinition>
> = Object.freeze({
  'ossuary.floor.slab': define({
    id: 'ossuary.floor.slab',
    family: 'architecture',
    materialKey: 'floorSlab',
    castShadow: false,
    receiveShadow: true,
    renderMode: 'instanced',
    visualBounds: [1.04, 0.035, 1],
  }),
  'ossuary.floor.inlay': define({
    id: 'ossuary.floor.inlay',
    family: 'metal',
    materialKey: 'verdigris',
    castShadow: false,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.wall.bay': define({
    id: 'ossuary.wall.bay',
    family: 'architecture',
    materialKey: 'darkStone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.wall.break': define({
    id: 'ossuary.wall.break',
    family: 'architecture',
    materialKey: 'darkStone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.buttress': define({
    id: 'ossuary.buttress',
    family: 'architecture',
    materialKey: 'darkStone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.arch.full': define({
    id: 'ossuary.arch.full',
    family: 'architecture',
    materialKey: 'bone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.arch.rib': define({
    id: 'ossuary.arch.rib',
    family: 'architecture',
    materialKey: 'darkStone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.niche.recess': define({
    id: 'ossuary.niche.recess',
    family: 'burial',
    materialKey: 'recessStone',
    castShadow: false,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.niche.arch': define({
    id: 'ossuary.niche.arch',
    family: 'metal',
    materialKey: 'bronze',
    castShadow: false,
    receiveShadow: false,
    renderMode: 'instanced',
  }),
  'ossuary.sarcophagus.body': define({
    id: 'ossuary.sarcophagus.body',
    family: 'burial',
    materialKey: 'darkStone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.sarcophagus.lid': define({
    id: 'ossuary.sarcophagus.lid',
    family: 'burial',
    materialKey: 'bone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.marker.body': define({
    id: 'ossuary.marker.body',
    family: 'burial',
    materialKey: 'darkStone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.marker.cap': define({
    id: 'ossuary.marker.cap',
    family: 'burial',
    materialKey: 'bone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.rubble.cluster': define({
    id: 'ossuary.rubble.cluster',
    family: 'dressing',
    materialKey: 'darkStone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.candle.body': define({
    id: 'ossuary.candle.body',
    family: 'dressing',
    materialKey: 'bone',
    castShadow: false,
    receiveShadow: false,
    renderMode: 'instanced',
  }),
  'ossuary.candle.flame': define({
    id: 'ossuary.candle.flame',
    family: 'dressing',
    materialKey: 'ember',
    castShadow: false,
    receiveShadow: false,
    renderMode: 'instanced',
  }),
  'ossuary.banner': define({
    id: 'ossuary.banner',
    family: 'dressing',
    materialKey: 'cloth',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.root.cluster': define({
    id: 'ossuary.root.cluster',
    family: 'dressing',
    materialKey: 'iron',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'instanced',
  }),
  'ossuary.wisp': define({
    id: 'ossuary.wisp',
    family: 'dressing',
    materialKey: 'veil',
    castShadow: false,
    receiveShadow: false,
    renderMode: 'instanced',
  }),
  'ossuary.landmark.veil-monolith': define({
    id: 'ossuary.landmark.veil-monolith',
    family: 'landmark',
    materialKey: 'darkStone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'unique',
  }),
  'ossuary.landmark.reliquary-plinth': define({
    id: 'ossuary.landmark.reliquary-plinth',
    family: 'landmark',
    materialKey: 'darkStone',
    castShadow: true,
    receiveShadow: true,
    renderMode: 'unique',
  }),
  'ossuary.corridor.bell': define({
    id: 'ossuary.corridor.bell',
    family: 'metal',
    materialKey: 'bronze',
    castShadow: true,
    receiveShadow: false,
    renderMode: 'unique',
  }),
})
