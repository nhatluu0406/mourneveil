import { describe, expect, it } from 'vitest'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../../../game/world/connectedLevel'
import {
  MOURNEVEIL_DUNGEON_ROOMS,
  pointInRoom,
  roomById,
  roomUnionBounds,
} from './dungeonRooms'
import { generateDungeonShell } from './roomShell'
import { OSSUARY_ROUTE_PLACEMENTS } from './routePlacements'
import { auditWorldPlacements } from './placementAudit'
import { resolveWorldObjectDefinition } from '../worldObjectRegistry'

describe('room-first dungeon composition', () => {
  it('authors eight rectangular rooms covering the hero route', () => {
    expect(MOURNEVEIL_DUNGEON_ROOMS.map((room) => room.id)).toEqual([
      'room.outer-watch',
      'room.refuge',
      'room.corridor',
      'room.court',
      'room.mixed-court',
      'room.ash-walk',
      'room.final-approach',
      'room.sepulchre',
    ])
    for (const room of MOURNEVEIL_DUNGEON_ROOMS) {
      const box = roomUnionBounds(room)
      expect(box.maxX).toBeGreaterThan(box.minX)
      expect(box.maxZ).toBeGreaterThan(box.minZ)
      expect(room.cameraNearSides).toEqual(['east', 'north'])
      expect(room.lightAnchors.length).toBeGreaterThanOrEqual(1)
      expect(room.lightAnchors.length).toBeLessThanOrEqual(5)
    }
  })

  it('keeps gameplay connections inside room openings', () => {
    const refuge = roomById('room.refuge')
    expect(refuge.openings.some((opening) => opening.connectionId === 'connection.first-combat-checkpoint')).toBe(true)
    expect(refuge.openings.some((opening) => opening.connectionId === 'connection.checkpoint-mixed-long')).toBe(true)
    expect(pointInRoom(-5.5, 0, refuge)).toBe(true)
    expect(MOURNEVEIL_CONNECTED_LEVEL.connections.map((entry) => entry.id).sort()).toEqual(
      [
        'connection.arrival-first-combat',
        'connection.checkpoint-mixed-long',
        'connection.first-combat-checkpoint',
        'connection.gate-final-arena',
        'connection.mixed-final-approach',
        'connection.shortcut-checkpoint-mixed',
      ].sort(),
    )
  })

  it('generates a continuous foundation per floor and camera-near parapets', () => {
    const shell = generateDungeonShell()
    const foundations = shell.filter((entry) => entry.objectId === 'ossuary.floor.foundation')
    expect(foundations.length).toBe(MOURNEVEIL_DUNGEON_ROOMS.reduce((sum, room) => sum + room.floors.length, 0))
    expect(shell.some((entry) => entry.instanceId.startsWith('parapet.room.refuge.'))).toBe(true)
    expect(shell.some((entry) => entry.instanceId.startsWith('wall.room.refuge.'))).toBe(true)
  })

  it('forbids generic architecture fading and unsupported ordinary placements', () => {
    for (const placement of OSSUARY_ROUTE_PLACEMENTS) {
      expect(resolveWorldObjectDefinition(placement.objectId).occlusionPolicy).not.toBe('fade')
    }
    const audit = auditWorldPlacements(OSSUARY_ROUTE_PLACEMENTS)
    expect(audit.unsupportedOrdinary).toEqual([])
    expect(OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.wisp')).toHaveLength(4)
    expect(
      OSSUARY_ROUTE_PLACEMENTS.find((entry) => entry.instanceId === 'bell.corridor.south')?.supportInstanceId,
    ).toBe('arch.corridor.south')
  })

  it('keeps spawn, shrine, shortcut, and boss arena inside authored rooms', () => {
    expect(pointInRoom(-14, 6, roomById('room.outer-watch'))).toBe(true)
    expect(pointInRoom(-6.8, 0, roomById('room.refuge'))).toBe(true)
    expect(pointInRoom(-3, -1.3, roomById('room.court'))).toBe(true)
    expect(pointInRoom(13, -4, roomById('room.sepulchre'))).toBe(true)
  })
})
