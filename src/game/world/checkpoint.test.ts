import { describe, expect, it } from 'vitest'
import { CheckpointRuntime, GRAYBOX_CHECKPOINT_DEFINITION } from './checkpoint'

describe('graybox checkpoint', () => {
  it('activates only for a living player inside authored range and owns current reference', () => {
    const checkpoint = new CheckpointRuntime()
    expect(checkpoint.snapshot()).toMatchObject({
      id: 'checkpoint.m5.refuge',
      activated: false,
      currentCheckpointId: null,
    })
    expect(
      checkpoint.interact({ x: 0, y: 0.82, z: 0 }, true),
    ).toMatchObject({ accepted: false, reason: 'out-of-range' })
    expect(
      checkpoint.interact(GRAYBOX_CHECKPOINT_DEFINITION.interactionPosition, false),
    ).toMatchObject({ accepted: false, reason: 'actor-dead' })
    expect(
      checkpoint.interact(GRAYBOX_CHECKPOINT_DEFINITION.interactionPosition, true),
    ).toEqual({ accepted: true, checkpointId: 'checkpoint.m5.refuge' })
    expect(checkpoint.snapshot()).toMatchObject({
      activated: true,
      currentCheckpointId: 'checkpoint.m5.refuge',
    })
  })

  it('authors distinct visual, interaction, and respawn anchors', () => {
    const definition = GRAYBOX_CHECKPOINT_DEFINITION
    expect(definition.visualPosition).not.toEqual(definition.respawnPosition)
    expect(definition.interactionPosition).not.toEqual(definition.respawnPosition)
    expect(
      Math.hypot(
        definition.respawnPosition.x - definition.visualPosition.x,
        definition.respawnPosition.z - definition.visualPosition.z,
      ),
    ).toBeGreaterThan(1)
  })
})
