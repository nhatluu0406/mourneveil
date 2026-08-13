import {
  CAMERA_NEAR_SIDES,
  bounds,
  light,
  opening,
  type DungeonRoomDefinition,
} from '../../../dungeonTypes'

export const CourtRoom: DungeonRoomDefinition = Object.freeze({
  id: 'room.court',
  displayName: 'Court',
  area: 'court',
  zoneIds: Object.freeze(['zone.mixed-combat'] as const),
  floors: Object.freeze([bounds(-3, 1, -7, 0)]),
  cameraNearSides: CAMERA_NEAR_SIDES,
  openings: Object.freeze([
    opening('west', -4, 2.4, 'corridor', 'connection.checkpoint-mixed-long'),
    opening('west', -1, 1.8, 'gate', 'connection.shortcut-checkpoint-mixed'),
    opening('east', -4, 2.4, 'door'),
  ]),
  landmarkAnchor: Object.freeze([0.15, 0, -6.15] as const),
  lightAnchors: Object.freeze([
    light('court.bowl', 'ossuary.light.ember-bowl', [0.15, 0.04, -6.15], [0, 0, 0], true),
    light('court.sconce.south', 'ossuary.light.double-sconce', [-1.4, 1.12, -6.78], [0, 0, 0], false),
  ]),
  dressingZones: Object.freeze([bounds(-3, -1.8, -7, -5.8), bounds(-0.2, 1, -2.2, -1)]),
})
