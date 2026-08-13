import {
  CAMERA_NEAR_SIDES,
  bounds,
  light,
  opening,
  type DungeonRoomDefinition,
} from '../../../dungeonTypes'

export const SepulchreRoom: DungeonRoomDefinition = Object.freeze({
  id: 'room.sepulchre',
  displayName: 'Sepulchre',
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
})
