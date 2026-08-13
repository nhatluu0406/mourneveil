import {
  CAMERA_NEAR_SIDES,
  bounds,
  light,
  opening,
  type DungeonRoomDefinition,
} from '../../../dungeonTypes'

export const OuterWatchRoom: DungeonRoomDefinition = Object.freeze({
  id: 'room.outer-watch',
  displayName: 'Outer Watch',
  area: 'first-combat',
  zoneIds: Object.freeze(['zone.arrival', 'zone.first-combat'] as const),
  floors: Object.freeze([bounds(-16, -11, 3, 9), bounds(-12, -8, 0, 5)]),
  cameraNearSides: CAMERA_NEAR_SIDES,
  openings: Object.freeze([
    opening('east', 5, 2.6, 'door', 'connection.arrival-first-combat', -11),
    opening('west', 4, 2.4, 'door', 'connection.arrival-first-combat', -12),
    opening('north', -11, 2.6, 'door', 'connection.arrival-first-combat', 5),
    opening('east', 1, 2.2, 'door', 'connection.first-combat-checkpoint'),
  ]),
  landmarkAnchor: Object.freeze([-10.4, 0, 1.2] as const),
  lightAnchors: Object.freeze([
    light('watch.sconce.west', 'ossuary.light.wall-sconce', [-15.55, 1.12, 6], [0, Math.PI / 2, 0], false),
    light('watch.brazier', 'ossuary.light.brazier', [-9.15, 0.02, 0.85], [0, 0, 0], true),
  ]),
  dressingZones: Object.freeze([bounds(-16, -14.4, 7.2, 9), bounds(-12, -10.6, 0, 1.2)]),
})
