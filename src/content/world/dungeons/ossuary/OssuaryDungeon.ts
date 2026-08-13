import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../../../../game/world/checkpoint'
import { compileDungeon } from '../../compileDungeon'
import {
  DEFAULT_DUNGEON_DYNAMIC_STATE,
  type DungeonDefinition,
  type DungeonDynamicState,
} from '../../dungeonTypes'
import { OSSUARY_OBJECT_DEFINITIONS } from '../../objects/catalog'
import { AshWalkRoom } from './rooms/AshWalkRoom'
import { CorridorRoom } from './rooms/CorridorRoom'
import { CourtRoom } from './rooms/CourtRoom'
import { FinalApproachRoom } from './rooms/FinalApproachRoom'
import { MixedCourtRoom } from './rooms/MixedCourtRoom'
import { OuterWatchRoom } from './rooms/OuterWatchRoom'
import { RefugeRoom } from './rooms/RefugeRoom'
import { SepulchreRoom } from './rooms/SepulchreRoom'

export const OSSUARY_DUNGEON: DungeonDefinition = Object.freeze({
  id: 'dungeon.ossuary.rite-i',
  displayName: 'Ossuary · Rite I',
  rooms: Object.freeze([
    OuterWatchRoom,
    RefugeRoom,
    CorridorRoom,
    CourtRoom,
    MixedCourtRoom,
    AshWalkRoom,
    FinalApproachRoom,
    SepulchreRoom,
  ]),
  connections: Object.freeze([
    Object.freeze({
      connectionId: 'connection.arrival-first-combat' as const,
      fromRoomId: 'room.outer-watch' as const,
      toRoomId: 'room.outer-watch' as const,
    }),
    Object.freeze({
      connectionId: 'connection.first-combat-checkpoint' as const,
      fromRoomId: 'room.outer-watch' as const,
      toRoomId: 'room.refuge' as const,
    }),
    Object.freeze({
      connectionId: 'connection.checkpoint-mixed-long' as const,
      fromRoomId: 'room.refuge' as const,
      toRoomId: 'room.court' as const,
    }),
    Object.freeze({
      connectionId: 'connection.shortcut-checkpoint-mixed' as const,
      fromRoomId: 'room.corridor' as const,
      toRoomId: 'room.court' as const,
    }),
    Object.freeze({
      connectionId: 'connection.mixed-final-approach' as const,
      fromRoomId: 'room.mixed-court' as const,
      toRoomId: 'room.ash-walk' as const,
    }),
    Object.freeze({
      connectionId: 'connection.gate-final-arena' as const,
      fromRoomId: 'room.final-approach' as const,
      toRoomId: 'room.sepulchre' as const,
    }),
  ]),
  spawnPoints: Object.freeze([
    Object.freeze({ id: 'spawn.rite-entry', position: Object.freeze([-14, 0.82, 6] as const) }),
    Object.freeze({
      id: 'spawn.refuge',
      position: Object.freeze([
        CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition.x,
        CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition.y,
        CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition.z,
      ] as const),
    }),
  ]),
  encounterAnchors: Object.freeze([
    Object.freeze({ encounterId: 'encounter.m5.introduction', roomId: 'room.outer-watch' as const }),
    Object.freeze({ encounterId: 'encounter.m5.mixed', roomId: 'room.mixed-court' as const }),
    Object.freeze({ encounterId: 'encounter.m5.pressure', roomId: 'room.final-approach' as const }),
    Object.freeze({ encounterId: 'encounter.m11.boss', roomId: 'room.sepulchre' as const }),
  ]),
  checkpointAnchors: Object.freeze([
    Object.freeze({
      id: CONNECTED_LEVEL_CHECKPOINT_DEFINITION.id,
      roomId: 'room.refuge' as const,
      position: Object.freeze([
        CONNECTED_LEVEL_CHECKPOINT_DEFINITION.visualPosition.x,
        CONNECTED_LEVEL_CHECKPOINT_DEFINITION.visualPosition.y,
        CONNECTED_LEVEL_CHECKPOINT_DEFINITION.visualPosition.z,
      ] as const),
    }),
  ]),
})

export function compileOssuaryDungeon(dynamicState: DungeonDynamicState = DEFAULT_DUNGEON_DYNAMIC_STATE) {
  return compileDungeon(OSSUARY_DUNGEON, OSSUARY_OBJECT_DEFINITIONS, dynamicState)
}

export function ossuaryRoomById(id: (typeof OSSUARY_DUNGEON.rooms)[number]['id']) {
  const room = OSSUARY_DUNGEON.rooms.find((entry) => entry.id === id)
  if (room === undefined) throw new Error(`Unknown dungeon room: ${id}`)
  return room
}
