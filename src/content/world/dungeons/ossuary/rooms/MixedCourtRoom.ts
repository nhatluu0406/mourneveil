import {
  CAMERA_NEAR_SIDES,
  bounds,
  light,
  opening,
  type DungeonRoomDefinition,
} from '../../../dungeonTypes'

export const MixedCourtRoom: DungeonRoomDefinition = Object.freeze({
  id: 'room.mixed-court',
  displayName: 'Mixed Court',
  area: 'mixed-court',
  zoneIds: Object.freeze(['zone.mixed-combat'] as const),
  floors: Object.freeze([bounds(1, 4, -7, -1)]),
  cameraNearSides: CAMERA_NEAR_SIDES,
  openings: Object.freeze([
    opening('west', -4, 2.4, 'door'),
    opening('east', -4, 2.4, 'door', 'connection.mixed-final-approach'),
  ]),
  landmarkAnchor: Object.freeze([3.35, 0, -6.2] as const),
  lightAnchors: Object.freeze([
    light('mixed.spectral', 'ossuary.light.spectral-reliquary', [3.35, 0.02, -6.2], [0, 0, 0], true),
    light('mixed.sconce.south', 'ossuary.light.wall-sconce', [2.2, 1.12, -6.78], [0, 0, 0], false),
  ]),
  dressingZones: Object.freeze([bounds(1, 1.8, -7, -5.9), bounds(3.2, 4, -2.1, -1)]),
})
