import {
  CAMERA_NEAR_SIDES,
  bounds,
  light,
  opening,
  type DungeonRoomDefinition,
} from '../../../dungeonTypes'

export const CorridorRoom: DungeonRoomDefinition = Object.freeze({
  id: 'room.corridor',
  displayName: 'Corridor',
  area: 'corridor',
  zoneIds: Object.freeze(['zone.checkpoint', 'zone.mixed-combat'] as const),
  floors: Object.freeze([bounds(-8, -3, -5.5, -2), bounds(-4, -3, -2, 0)]),
  cameraNearSides: CAMERA_NEAR_SIDES,
  openings: Object.freeze([
    opening('north', -5, 2.2, 'corridor', 'connection.checkpoint-mixed-long', -2),
    opening('east', -4, 2.4, 'corridor', 'connection.checkpoint-mixed-long'),
    opening('west', -1, 1.8, 'door', undefined, -4),
    opening('east', -1, 1.8, 'gate', 'connection.shortcut-checkpoint-mixed'),
  ]),
  landmarkAnchor: null,
  lightAnchors: Object.freeze([
    light('corridor.sconce.west', 'ossuary.light.wall-sconce', [-7.78, 1.12, -3.6], [0, Math.PI / 2, 0], false),
    light('corridor.torch.south', 'ossuary.light.processional-torch', [-6.4, 0.02, -5.15], [0, 0, 0], false),
  ]),
  dressingZones: Object.freeze([bounds(-8, -6.8, -5.5, -4.6)]),
})
