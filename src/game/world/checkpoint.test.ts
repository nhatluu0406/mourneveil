import { describe, expect, it } from 'vitest'
import { CheckpointRuntime, GRAYBOX_CHECKPOINT_DEFINITION } from './checkpoint'

describe('graybox checkpoint', () => {
  it('activates only for a living player inside authored range and owns current reference', () => {
    const checkpoint = new CheckpointRuntime()
    expect(checkpoint.snapshot()).toMatchObject({
      id: 'checkpoint.graybox.entry',
      activated: false,
      currentCheckpointId: null,
    })
    expect(
      checkpoint.interact({ x: 0, y: 0.82, z: 0 }, true),
    ).toMatchObject({ accepted: false, reason: 'out-of-range' })
    expect(
      checkpoint.interact(GRAYBOX_CHECKPOINT_DEFINITION.respawnPosition, false),
    ).toMatchObject({ accepted: false, reason: 'actor-dead' })
    expect(
      checkpoint.interact(GRAYBOX_CHECKPOINT_DEFINITION.respawnPosition, true),
    ).toEqual({ accepted: true, checkpointId: 'checkpoint.graybox.entry' })
    expect(checkpoint.snapshot()).toMatchObject({
      activated: true,
      currentCheckpointId: 'checkpoint.graybox.entry',
    })
  })
})
