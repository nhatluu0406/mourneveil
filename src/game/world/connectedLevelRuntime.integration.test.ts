import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../runtime/GameRuntime'
import { createDefaultSaveV4 } from '../save/saveSchema'
import { horizontalFootprintOverlapsSolid } from '../../physics/connectedLevelCollision'
import { PLAYER_CAPSULE_RADIUS } from '../../physics/playerCollisionConfig'
import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from './checkpoint'
import { MOURNEVEIL_CONNECTED_LEVEL } from './connectedLevel'

describe('complete connected-level runtime initialization', () => {
  it('starts a new session at the authored arrival without activating the checkpoint', () => {
    const runtime = new GameRuntime()
    expect(runtime.snapshot()).toMatchObject({
      player: { position: MOURNEVEIL_CONNECTED_LEVEL.entryPosition },
      world: { currentZoneId: 'zone.arrival', openedShortcutIds: [], finalGateReached: false },
      checkpoint: { activated: false, currentCheckpointId: null },
    })
  })

  it('loads a default save at arrival and an activated save at the canonical checkpoint', () => {
    const fresh = new GameRuntime()
    fresh.applySave(createDefaultSaveV4())
    expect(fresh.snapshot().player.position).toEqual(MOURNEVEIL_CONNECTED_LEVEL.entryPosition)

    const rested = new GameRuntime()
    rested.applySave({
      ...createDefaultSaveV4(),
      checkpointActivated: true,
      activeCheckpointId: 'checkpoint.m5.refuge',
    })
    expect(rested.snapshot()).toMatchObject({
      player: { position: CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition },
      world: { currentZoneId: 'zone.checkpoint' },
    })
    const position = rested.snapshot().player.position
    expect(
      horizontalFootprintOverlapsSolid(position.x, position.z, PLAYER_CAPSULE_RADIUS),
    ).toBeNull()
  })
})
