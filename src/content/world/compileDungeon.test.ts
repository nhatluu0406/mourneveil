import { describe, expect, it } from 'vitest'
import { compileDungeon } from './compileDungeon'
import { auditCompiledDungeon } from './compileIntegrity'
import { OSSUARY_DUNGEON, compileOssuaryDungeon, ossuaryRoomById } from './dungeons/ossuary/OssuaryDungeon'
import { listWorldObjectIds, OSSUARY_OBJECT_DEFINITIONS } from './objects/catalog'
import { pointInRoom } from './dungeonTypes'

describe('canonical dungeon definition', () => {
  it('authors eight rooms and unique catalog ids', () => {
    expect(OSSUARY_DUNGEON.rooms.map((room) => room.id)).toEqual([
      'room.outer-watch',
      'room.refuge',
      'room.corridor',
      'room.court',
      'room.mixed-court',
      'room.ash-walk',
      'room.final-approach',
      'room.sepulchre',
    ])
    const ids = listWorldObjectIds()
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('ossuary.wall.parapet')
    expect(ids).toContain('ossuary.wall.exterior')
    expect(ids).toContain('ossuary.gate.shortcut')
    expect(OSSUARY_OBJECT_DEFINITIONS['ossuary.wall.bay']?.collision?.kind).toBe('box')
  })

  it('compiles deterministically from the same dungeon and flags', () => {
    const a = compileOssuaryDungeon()
    const b = compileDungeon(OSSUARY_DUNGEON, OSSUARY_OBJECT_DEFINITIONS, {
      shortcutOpen: false,
      finalGateOpen: false,
    })
    expect(a.renderInstances).toEqual(b.renderInstances)
    expect(a.colliders).toEqual(b.colliders)
    expect(a.navObstacles).toEqual(b.navObstacles)
  })

  it('owns render and collision from the same instances', () => {
    const compiled = compileOssuaryDungeon()
    const foundations = compiled.renderInstances.filter((entry) => entry.objectId === 'ossuary.floor.foundation')
    expect(foundations).toHaveLength(1)
    expect(foundations[0]?.instanceId).toBe('foundation.dungeon.ossuary')
    expect(compiled.renderInstances.some((entry) => entry.objectId === 'ossuary.wall.exterior')).toBe(true)
    expect(compiled.renderInstances.some((entry) => entry.objectId === 'ossuary.wall.parapet')).toBe(true)
    expect(compiled.colliders.some((entry) => entry.kind === 'wall')).toBe(true)
    expect(compiled.colliders.some((entry) => entry.id === 'gate.shortcut')).toBe(true)
    expect(compiled.colliders.some((entry) => entry.id === 'gate.final')).toBe(true)
    const open = compileOssuaryDungeon({ shortcutOpen: true, finalGateOpen: true })
    expect(open.colliders.some((entry) => entry.kind === 'shortcut-gate' || entry.kind === 'final-gate')).toBe(false)
  })

  it('keeps visual structural owners matched to colliders', () => {
    const report = auditCompiledDungeon(compileOssuaryDungeon())
    expect(report.visibleStructuralWithoutCollider).toEqual([])
    expect(report.colliderWithoutVisibleStructuralOwner).toEqual([])
    expect(report.boundsMismatch).toEqual([])
    expect(report.duplicateCollider).toEqual([])
    expect(report.overlappingDoorBlocker).toEqual([])
    expect(report.unsupportedStructuralObject).toEqual([])
  })

  it('reports compiled instance and collider counts from one dungeon', () => {
    const compiled = compileOssuaryDungeon()
    expect(compiled.renderInstances.length).toBeGreaterThan(80)
    expect(compiled.colliders.filter((entry) => entry.kind !== 'floor').length).toBeGreaterThan(20)
    expect(compiled.navObstacles.length).toBeGreaterThan(10)
    expect(compiled.lights.length).toBeGreaterThan(0)
  })

  it('keeps door openings and spawns inside rooms', () => {
    expect(pointInRoom(-14, 6, ossuaryRoomById('room.outer-watch'))).toBe(true)
    expect(pointInRoom(-6.8, 0, ossuaryRoomById('room.refuge'))).toBe(true)
    expect(pointInRoom(-3, -1, ossuaryRoomById('room.court'))).toBe(true)
    expect(pointInRoom(13, -4, ossuaryRoomById('room.sepulchre'))).toBe(true)
    const closed = compileOssuaryDungeon()
    const shortcut = closed.colliders.find((entry) => entry.id === 'gate.shortcut')
    expect(shortcut).toBeDefined()
    expect(Math.abs((shortcut?.position[0] ?? 0) + 3)).toBeLessThan(0.2)
  })
})
