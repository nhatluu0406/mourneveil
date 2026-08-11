import { describe, expect, it } from 'vitest'
import {
  CHECKPOINT_SHRINE_ASSET,
  SKIRMISHER_PROOF_ASSET,
  checkpointShrineAssetReference,
  skirmisherProofAssetReference,
} from './productionAssetReference'

describe('production asset references', () => {
  it('uses the stable public runtime path and explicit transform for the shrine', () => {
    expect(CHECKPOINT_SHRINE_ASSET).toEqual({
      id: 'world.checkpoint.refuge-shrine',
      runtimeUrl: '/assets/world/checkpoint/refuge-shrine.gltf',
      scale: [1, 1, 1],
      rotationRadians: [0, 0, 0],
    })
    expect(checkpointShrineAssetReference()).toEqual(CHECKPOINT_SHRINE_ASSET)
  })

  it('exposes skirmisher GLB URL and semantic clip mapping at the asset boundary', () => {
    expect(SKIRMISHER_PROOF_ASSET.id).toBe('enemy.skirmisher.proof')
    expect(SKIRMISHER_PROOF_ASSET.runtimeUrl).toBe(
      '/assets/enemies/skirmisher/skirmisher-proof.glb',
    )
    expect(SKIRMISHER_PROOF_ASSET.animationSemantics).toEqual({
      idle: 'Clip_Skirm_Idle',
      locomotion: 'Clip_Skirm_Walk',
      'enemy-attack': 'Clip_Skirm_Strike',
      'hit-reaction': 'Clip_Skirm_Hit',
      defeated: 'Clip_Skirm_Death',
    })
    expect(skirmisherProofAssetReference()).toEqual(SKIRMISHER_PROOF_ASSET)
  })
})
