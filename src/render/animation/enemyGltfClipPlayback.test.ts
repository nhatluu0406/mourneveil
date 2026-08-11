import { AnimationClip, AnimationMixer, Object3D } from 'three'
import { describe, expect, it } from 'vitest'
import {
  SKIRMISHER_PROOF_ASSET,
  clipNameForEnemyAnimationMode,
} from '../../content/assets/productionAssetReference'
import {
  resolveEnemyClipLoop,
  syncEnemyGltfClipPlayback,
} from './enemyGltfClipPlayback'

describe('skirmisher GLB animation mapping', () => {
  it('maps M7 semantic modes to manifest clip names without leaking raw names to callers', () => {
    expect(clipNameForEnemyAnimationMode(SKIRMISHER_PROOF_ASSET.animationSemantics, 'idle')).toBe(
      'Clip_Skirm_Idle',
    )
    expect(
      clipNameForEnemyAnimationMode(SKIRMISHER_PROOF_ASSET.animationSemantics, 'enemy-attack'),
    ).toBe('Clip_Skirm_Strike')
    expect(resolveEnemyClipLoop('locomotion')).toBe(true)
    expect(resolveEnemyClipLoop('defeated')).toBe(false)
  })

  it('syncs mixer actions through semantic modes and rejects missing clips', () => {
    const root = new Object3D()
    const mixer = new AnimationMixer(root)
    const clips = [
      new AnimationClip('Clip_Skirm_Idle', 1, []),
      new AnimationClip('Clip_Skirm_Walk', 1, []),
      new AnimationClip('Clip_Skirm_Strike', 1, []),
      new AnimationClip('Clip_Skirm_Hit', 1, []),
      new AnimationClip('Clip_Skirm_Death', 1, []),
    ]
    const idle = syncEnemyGltfClipPlayback({
      mixer,
      clips,
      mapping: SKIRMISHER_PROOF_ASSET.animationSemantics,
      mode: 'idle',
      blendSeconds: 0.16,
      previous: { mode: null, action: null },
    })
    expect(idle.mode).toBe('idle')
    expect(idle.action?.getClip().name).toBe('Clip_Skirm_Idle')

    const attack = syncEnemyGltfClipPlayback({
      mixer,
      clips,
      mapping: SKIRMISHER_PROOF_ASSET.animationSemantics,
      mode: 'enemy-attack',
      blendSeconds: 0.08,
      previous: idle,
    })
    expect(attack.mode).toBe('enemy-attack')
    expect(attack.action?.getClip().name).toBe('Clip_Skirm_Strike')

    expect(() =>
      syncEnemyGltfClipPlayback({
        mixer,
        clips: [new AnimationClip('unrelated', 1, [])],
        mapping: SKIRMISHER_PROOF_ASSET.animationSemantics,
        mode: 'idle',
        blendSeconds: 0.1,
        previous: { mode: null, action: null },
      }),
    ).toThrow('missing runtime animation clip "Clip_Skirm_Idle"')
  })
})
