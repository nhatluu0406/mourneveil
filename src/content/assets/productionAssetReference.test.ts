import { describe, expect, it } from 'vitest'
import { CHECKPOINT_SHRINE_ASSET, checkpointShrineAssetReference } from './productionAssetReference'

describe('checkpoint shrine production asset reference', () => {
  it('uses the stable public runtime path and explicit transform', () => {
    expect(CHECKPOINT_SHRINE_ASSET).toEqual({
      id: 'world.checkpoint.refuge-shrine',
      runtimeUrl: '/assets/world/checkpoint/refuge-shrine.gltf',
      scale: [1, 1, 1],
      rotationRadians: [0, 0, 0],
    })
    expect(checkpointShrineAssetReference()).toEqual(CHECKPOINT_SHRINE_ASSET)
  })
})
