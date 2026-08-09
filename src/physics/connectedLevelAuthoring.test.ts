import { describe, expect, it } from 'vitest'
import {
  CONNECTED_LEVEL_COLLIDERS,
  CONNECTED_LEVEL_LANDMARKS,
  horizontalFootprintOverlapsSolid,
} from './connectedLevelCollision'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../game/world/connectedLevel'
import { M5_ENEMY_PLACEMENTS } from '../game/encounters/connectedLevelEncounters'
import { CONNECTED_NAVIGATION_NODES } from '../game/world/connectedNavigation'
import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../game/world/checkpoint'
import { PLAYER_CAPSULE_RADIUS } from './playerCollisionConfig'

const CLEARANCE = PLAYER_CAPSULE_RADIUS + 0.05

describe('connected-level solid authoring', () => {
  it('keeps every landmark in the authoritative collider set with matching extents', () => {
    for (const landmark of CONNECTED_LEVEL_LANDMARKS) {
      const collider = CONNECTED_LEVEL_COLLIDERS.find((entry) => entry.id === landmark.id)
      expect(collider).toEqual(landmark)
      expect(collider?.kind).toBe('blocker')
      expect(collider?.position).toEqual(landmark.position)
      expect(collider?.size).toEqual(landmark.size)
    }
  })

  it('keeps player spawn, checkpoint, enemy, and open-route anchors outside solids', () => {
    const alwaysClear = [
      MOURNEVEIL_CONNECTED_LEVEL.entryPosition,
      CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition,
      ...M5_ENEMY_PLACEMENTS.map((placement) => placement.spawnPosition),
      ...CONNECTED_NAVIGATION_NODES.filter((node) => node.connectionId === null).map(
        (node) => node.position,
      ),
    ]
    for (const point of alwaysClear) {
      expect(horizontalFootprintOverlapsSolid(point.x, point.z, CLEARANCE)).toBeNull()
    }

    for (const connection of MOURNEVEIL_CONNECTED_LEVEL.connections) {
      const point = connection.worldPosition
      if (connection.kind === 'open') {
        expect(
          horizontalFootprintOverlapsSolid(point.x, point.z, CLEARANCE, {
            shortcutOpen: false,
            finalGateOpen: false,
          }),
        ).toBeNull()
        continue
      }
      // Gated/shortcut anchors are only traversable when that gate is open.
      expect(
        horizontalFootprintOverlapsSolid(point.x, point.z, CLEARANCE, {
          shortcutOpen: connection.kind === 'shortcut',
          finalGateOpen: connection.kind === 'gated',
        }),
      ).toBeNull()
    }
  })

  it('treats closed gates as solids and open gates as clear', () => {
    expect(
      horizontalFootprintOverlapsSolid(-3, -1.3, 0.2, {
        shortcutOpen: false,
        finalGateOpen: false,
      })?.id,
    ).toBe('gate.shortcut')
    expect(
      horizontalFootprintOverlapsSolid(-3, -1.3, 0.2, {
        shortcutOpen: true,
        finalGateOpen: false,
      }),
    ).toBeNull()
  })
})
