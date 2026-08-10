import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../game/runtime/GameRuntime'
import { checkpointShrinePresentation } from './checkpointShrinePresentation'

describe('checkpoint shrine presentation', () => {
  it('projects the production asset at the authored visual anchor', () => {
    const checkpoint = new GameRuntime().snapshot().checkpoint
    const presentation = checkpointShrinePresentation(checkpoint)
    expect(presentation.asset.id).toBe('world.checkpoint.refuge-shrine')
    expect(presentation.asset.runtimeUrl).toBe('/assets/world/checkpoint/refuge-shrine.gltf')
    expect(presentation.position).toEqual([
      checkpoint.visualPosition.x,
      checkpoint.visualPosition.y,
      checkpoint.visualPosition.z,
    ])
  })

  it('does not use the respawn anchor as a render offset', () => {
    const checkpoint = new GameRuntime().snapshot().checkpoint
    expect(checkpointShrinePresentation(checkpoint).position).not.toEqual([
      checkpoint.respawnPosition.x,
      checkpoint.respawnPosition.y,
      checkpoint.respawnPosition.z,
    ])
  })
})
