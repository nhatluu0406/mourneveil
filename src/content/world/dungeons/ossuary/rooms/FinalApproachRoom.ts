import {
  CAMERA_NEAR_SIDES,
  bounds,
  light,
  opening,
  type DungeonRoomDefinition,
} from '../../../dungeonTypes'

export const FinalApproachRoom: DungeonRoomDefinition = Object.freeze({
  id: 'room.final-approach',
  displayName: 'Final Approach',
  area: 'final-approach',
  zoneIds: Object.freeze(['zone.final-approach'] as const),
  floors: Object.freeze([bounds(7, 10, -7, -1)]),
  cameraNearSides: CAMERA_NEAR_SIDES,
  openings: Object.freeze([
    opening('west', -4, 2.4, 'corridor'),
    opening('east', -4, 2.9, 'gate', 'connection.gate-final-arena'),
  ]),
  landmarkAnchor: Object.freeze([8.4, 0, -2.4] as const),
  lightAnchors: Object.freeze([
    light('approach.sconce.south', 'ossuary.light.double-sconce', [8.8, 1.12, -6.78], [0, 0, 0], false),
  ]),
  dressingZones: Object.freeze([bounds(7, 7.8, -7, -5.9)]),
})
