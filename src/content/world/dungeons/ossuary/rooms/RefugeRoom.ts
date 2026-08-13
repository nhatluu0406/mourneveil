import {
  CAMERA_NEAR_SIDES,
  bounds,
  light,
  opening,
  type DungeonRoomDefinition,
} from '../../../dungeonTypes'

export const RefugeRoom: DungeonRoomDefinition = Object.freeze({
  id: 'room.refuge',
  displayName: 'Refuge',
  area: 'refuge',
  zoneIds: Object.freeze(['zone.checkpoint'] as const),
  floors: Object.freeze([bounds(-8, -4, -2, 2)]),
  cameraNearSides: CAMERA_NEAR_SIDES,
  openings: Object.freeze([
    opening('west', 1, 2.2, 'door', 'connection.first-combat-checkpoint'),
    opening('south', -5, 2.2, 'corridor', 'connection.checkpoint-mixed-long'),
    opening('east', -1, 1.8, 'door'),
  ]),
  landmarkAnchor: Object.freeze([-5.5, 0, 0] as const),
  lightAnchors: Object.freeze([
    light('refuge.sconce.west', 'ossuary.light.wall-sconce', [-7.78, 1.12, -0.85], [0, Math.PI / 2, 0], true),
    light('refuge.candles.south', 'ossuary.light.candle-cluster', [-4.55, 0.04, -1.55], [0, 0, 0], false),
  ]),
    dressingZones: Object.freeze([bounds(-8, -7.15, -2, -1.15), bounds(-4.85, -4, -2, -1.15)]),
})
