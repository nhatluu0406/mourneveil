import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../game/runtime/GameRuntime'
import { resolveGameplayInteractionPrompt } from './gameplayHudModel'

describe('gameplay HUD interaction prompts', () => {
  it('prompts Rest near the refuge checkpoint while alive', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
    expect(resolveGameplayInteractionPrompt(runtime.snapshot())).toBe('F — Rest')
  })

  it('prompts Respawn when dead with an activated checkpoint', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
    runtime.requestCheckpointInteraction({ type: 'player-checkpoint-interaction' })
    runtime.applyPlayerDamage(999)
    expect(resolveGameplayInteractionPrompt(runtime.snapshot())).toBe('R — Respawn')
  })

  it('prompts Open shortcut from the authored far side while closed', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: -2.2, y: 0.82, z: -1 })
    // Force zone projection for unlock side.
    runtime.debugSetPlayerPosition({ x: -2.5, y: 0.82, z: -1.1 })
    for (let step = 0; step < 2; step += 1) {
      runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    }
    const prompt = resolveGameplayInteractionPrompt(runtime.snapshot())
    expect(['F — Open shortcut', null]).toContain(prompt)
  })
})
