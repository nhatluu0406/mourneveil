export {
  CAMERA_NEAR_SIDES,
  isCameraNearSide,
  pointInRoom,
  pointInRoomBounds,
  roomUnionBounds,
  sidePlane,
  type DungeonLightAnchor,
  type DungeonOpeningDefinition,
  type DungeonOpeningKind,
  type DungeonRoomDefinition,
  type DungeonRoomId,
  type RoomBounds,
} from '../../../content/world/dungeonTypes'
export { OSSUARY_DUNGEON } from '../../../content/world/dungeons/ossuary/OssuaryDungeon'
export { ossuaryRoomById as roomById } from '../../../content/world/dungeons/ossuary/OssuaryDungeon'
import { OSSUARY_DUNGEON } from '../../../content/world/dungeons/ossuary/OssuaryDungeon'
import { sidePlane, type DungeonRoomDefinition } from '../../../content/world/dungeonTypes'

export const MOURNEVEIL_DUNGEON_ROOMS: readonly DungeonRoomDefinition[] = OSSUARY_DUNGEON.rooms

export function planeIsCameraNear(axis: 'x' | 'z', value: number, tolerance = 0.08): boolean {
  for (const room of MOURNEVEIL_DUNGEON_ROOMS) {
    if (axis === 'x' && room.cameraNearSides.includes('east') && Math.abs(sidePlane(room, 'east') - value) <= tolerance) {
      return true
    }
    if (axis === 'z' && room.cameraNearSides.includes('north') && Math.abs(sidePlane(room, 'north') - value) <= tolerance) {
      return true
    }
  }
  return false
}
