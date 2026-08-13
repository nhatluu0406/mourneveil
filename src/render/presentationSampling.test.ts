import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../game/runtime/GameRuntime'
import { playerVisualPosition } from './presentationSampling'

describe('presentation sampling', () => {
  it('returns simulation position when interpolation is disabled', () => {
    const runtime = new GameRuntime()
    const sim = runtime.snapshot().player.position
    expect(playerVisualPosition(runtime, false)).toEqual(sim)
  })
})
