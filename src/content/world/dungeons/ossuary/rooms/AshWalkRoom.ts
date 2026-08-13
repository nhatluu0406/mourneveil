import {
  CAMERA_NEAR_SIDES,
  bounds,
  light,
  opening,
  type DungeonRoomDefinition,
} from '../../../dungeonTypes'

export const AshWalkRoom: DungeonRoomDefinition = Object.freeze({
  id: 'room.ash-walk',
  displayName: 'Ash Walk',
  area: 'ash-walk',
  zoneIds: Object.freeze(['zone.final-approach'] as const),
  floors: Object.freeze([bounds(4, 7, -7, -1)]),
  cameraNearSides: CAMERA_NEAR_SIDES,
  openings: Object.freeze([
    opening('west', -4, 2.4, 'door', 'connection.mixed-final-approach'),
    opening('east', -4, 2.4, 'corridor'),
  ]),
  landmarkAnchor: Object.freeze([5.5, 0, -2.55] as const),
  lightAnchors: Object.freeze([
    light('ash.veil', 'ossuary.light.veil-lamp', [5.5, 0.02, -2.55], [0, 0, 0], true),
    light('ash.sconce.south', 'ossuary.light.wall-sconce', [5.4, 1.12, -6.78], [0, 0, 0], false),
  ]),
  dressingZones: Object.freeze([bounds(4, 4.8, -7, -5.9)]),
})
