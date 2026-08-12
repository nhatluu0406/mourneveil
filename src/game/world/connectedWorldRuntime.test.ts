import { describe, expect, it } from 'vitest'
import { MOURNEVEIL_CONNECTED_LEVEL, validateConnectedLevelDefinition } from './connectedLevel'
import { ConnectedWorldRuntime } from './connectedWorldRuntime'

describe('connected world contract', () => {
  it('has stable valid zone and connection references', () => {
    expect(() => validateConnectedLevelDefinition(MOURNEVEIL_CONNECTED_LEVEL)).not.toThrow()
    expect(MOURNEVEIL_CONNECTED_LEVEL.zones.map((zone) => zone.id)).toEqual([
      'zone.arrival',
      'zone.first-combat',
      'zone.checkpoint',
      'zone.mixed-combat',
      'zone.final-approach',
      'zone.final-arena',
    ])
    const connectionIds = new Set(MOURNEVEIL_CONNECTED_LEVEL.connections.map((entry) => entry.id))
    expect(MOURNEVEIL_CONNECTED_LEVEL.zones.every((zone) => zone.connectionIds.every((id) => connectionIds.has(id)))).toBe(true)
  })

  it('rejects a dangling authored connection', () => {
    const invalid = {
      ...MOURNEVEIL_CONNECTED_LEVEL,
      connections: [
        ...MOURNEVEIL_CONNECTED_LEVEL.connections,
        {
          id: 'connection.mixed-final-approach',
          kind: 'open',
          fromZoneId: 'zone.arrival',
          toZoneId: 'zone.missing',
          worldPosition: { x: 0, y: 0.82, z: 0 },
        },
      ],
    } as unknown as typeof MOURNEVEIL_CONNECTED_LEVEL
    expect(() => validateConnectedLevelDefinition(invalid)).toThrow()
  })

  it('opens the shortcut deterministically only from its authored far side', () => {
    const world = new ConnectedWorldRuntime()
    const shortcutId = 'connection.shortcut-checkpoint-mixed'
    expect(world.isConnectionOpen(shortcutId)).toBe(false)
    expect(world.openShortcut(shortcutId, { x: -3, y: 0.82, z: -0.5 })).toMatchObject({
      accepted: false,
      reason: 'wrong-side',
    })
    expect(world.openShortcut(shortcutId, { x: -2, y: 0.82, z: -1.2 })).toEqual({
      accepted: true,
      shortcutId,
      changed: true,
    })
    expect(world.openShortcut(shortcutId, { x: -2, y: 0.82, z: -1.2 })).toEqual({
      accepted: true,
      shortcutId,
      changed: false,
    })
    expect(world.isConnectionOpen(shortcutId)).toBe(true)
  })

  it('restores only known stable world flags', () => {
    const world = new ConnectedWorldRuntime()
    world.restore({
      openedShortcutIds: ['connection.shortcut-checkpoint-mixed', 'connection.unknown'],
      finalGateReached: true,
    })
    expect(world.snapshot()).toMatchObject({
      openedShortcutIds: ['connection.shortcut-checkpoint-mixed'],
      finalGateReached: true,
      defeatedBossIds: [],
    })
  })
})
